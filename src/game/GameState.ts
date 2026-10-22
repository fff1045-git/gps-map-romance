import { distanceMeters, type LatLng } from '../core/geo';
import { isInKorea } from '../core/korea';
import { EPISODES, HEROES, heroById, type Hero, type PlaceKind } from '../romance/heroes';
import { DEFAULT_PLACEMENT, pickPlace, placementWindow, virtualPlace, type Place, type PlacementConfig } from './placement';
import { checkRange, DEFAULT_MEET_CONFIG, type MeetConfig, type PlayerFix, type RangeCheck } from './rules';
import { emptySave, newHeroSave, type HeroSave, type SaveData, type SaveStore } from './storage';

/** 마지막 위치를 다시 저장하기 전에 이만큼은 움직여야 한다(m). 매 측정마다 쓰지 않기 위해. */
const LAST_KNOWN_MIN_MOVE_M = 25;

export type HeroStatus =
  | { state: 'here'; place: Place }
  | { state: 'resting'; restLeftMs: number }
  | { state: 'done'; ending: 'happy' | 'friend' }
  | { state: 'unknown' };

export type MeetStart =
  | { ok: true; hero: Hero; place: Place; episode: number; affection: number }
  | (Exclude<RangeCheck, { ok: true }> & { hero?: Hero })
  | { ok: false; reason: 'resting' | 'done' | 'unknown-hero' };

export interface MeetResult {
  affection: number;
  faces: Iterable<string>;
  ending?: 'happy' | 'friend';
}

/**
 * 게임 상태. 지도·GPS·DOM을 모른다.
 * 위치는 setPlayer로, 주변 실제 장소 후보는 setCandidates로 받고, 화면은 subscribe로 변화를 받아 다시 그린다.
 */
export class GameState {
  private data: SaveData;
  private _player: PlayerFix | null = null;
  private candidates: Partial<Record<PlaceKind, readonly Place[]>> = {};
  private listeners = new Set<() => void>();

  constructor(
    private readonly store: SaveStore,
    readonly meetConfig: MeetConfig = DEFAULT_MEET_CONFIG,
    readonly placementConfig: PlacementConfig = DEFAULT_PLACEMENT,
  ) {
    this.data = store.load() ?? emptySave();
  }

  get player(): PlayerFix | null {
    return this._player;
  }

  /** 마지막으로 알던 위치(저장됨). 없으면 null. */
  get lastKnown(): LatLng | null {
    const p = this.data.lastKnown;
    return p ? { lat: p.lat, lng: p.lng } : null;
  }

  /** 플레이어가 플레이 영역(대한민국) 안에 있는지. 위치를 모르면 false. */
  get inPlayArea(): boolean {
    return !!this._player && isInKorea(this._player.pos);
  }

  progress(heroId: string): Readonly<HeroSave> {
    return this.data.heroes[heroId] ?? newHeroSave();
  }

  setPlayer(fix: PlayerFix): void {
    this._player = fix;
    const last = this.data.lastKnown;
    if (!last || distanceMeters(last, fix.pos) >= LAST_KNOWN_MIN_MOVE_M) {
      this.data.lastKnown = { lat: fix.pos.lat, lng: fix.pos.lng, at: fix.timestamp };
      this.store.save(this.data);
    }
    this.emit();
  }

  /** 주변 실제 장소 후보(장소 유형별). 빈 배열이면 가상 지점을 쓴다. */
  setCandidates(kind: PlaceKind, places: readonly Place[]): void {
    this.candidates[kind] = places.filter((p) => isInKorea(p.pos));
    this.emit();
  }

  status(heroId: string, now: number): HeroStatus {
    const hero = heroById(heroId);
    const p = this.progress(heroId);
    if (p.ending) return { state: 'done', ending: p.ending };
    if (p.lastMetAt !== undefined) {
      const left = p.lastMetAt + this.meetConfig.restMs - now;
      if (left > 0) return { state: 'resting', restLeftMs: left };
    }
    if (!hero || !this._player || !isInKorea(this._player.pos)) return { state: 'unknown' };
    const window = placementWindow(now, this.placementConfig);
    const place =
      pickPlace(hero.id, window, this.candidates[hero.placeKind] ?? [], p.lastPlaceId, this.placementConfig) ??
      virtualPlace(hero.id, hero.placeKind, this._player.pos, window, p.lastPlaceId, this.placementConfig);
    return { state: 'here', place };
  }

  check(place: Place): RangeCheck {
    return checkRange(this._player, place.pos, this.meetConfig);
  }

  /** 만남을 시작할 수 있는지. 장소는 지금 상태로 다시 계산한다(낡은 마커를 눌러도 안전). */
  beginMeeting(heroId: string, now: number): MeetStart {
    const hero = heroById(heroId);
    if (!hero) return { ok: false, reason: 'unknown-hero' };
    const s = this.status(heroId, now);
    if (s.state === 'done') return { ok: false, reason: 'done' };
    if (s.state === 'resting') return { ok: false, reason: 'resting' };
    if (s.state === 'unknown') return { ok: false, reason: 'no-position' };
    const r = this.check(s.place);
    if (!r.ok) return { ...r, hero };
    const p = this.progress(heroId);
    return { ok: true, hero, place: s.place, episode: p.episode, affection: p.affection };
  }

  /** 한 화를 끝까지 봤을 때. 중간에 닫으면 부르지 않는다(진행도 쉬는 시간도 그대로). */
  finishMeeting(heroId: string, place: Place, result: MeetResult, now: number): HeroSave {
    const prev = this.progress(heroId);
    const faces = new Set([...prev.faces, ...result.faces]);
    const next: HeroSave = {
      episode: Math.min(prev.episode + 1, EPISODES + 1),
      affection: result.affection,
      lastMetAt: now,
      lastPlaceId: place.id,
      faces: [...faces],
      ...(result.ending ? { ending: result.ending } : {}),
    };
    this.data.heroes[heroId] = next;
    this.store.save(this.data);
    this.emit();
    return next;
  }

  /** 개발용: 모든 캐릭터의 쉬는 시간을 끝낸다. */
  skipRest(): void {
    for (const h of Object.values(this.data.heroes)) delete h.lastMetAt;
    this.store.save(this.data);
    this.emit();
  }

  /** 시간이 흘러 쉬는 시간·장소가 바뀌었을 수 있으니 다시 그리게 한다. */
  tick(): void {
    this.emit();
  }

  /** 진행을 모두 지운다. 마지막 위치는 남긴다. */
  reset(): void {
    this.data = { ...emptySave(), lastKnown: this.data.lastKnown };
    this.store.save(this.data);
    this.emit();
  }

  get heroes(): readonly Hero[] {
    return HEROES;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }
}
