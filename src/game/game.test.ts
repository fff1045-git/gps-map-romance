import { describe, expect, it } from 'vitest';
import { distanceMeters, offsetMeters } from '../core/geo';
import { GameState } from './GameState';
import { DEFAULT_PLACEMENT, pickPlace, placementWindow, virtualPlace, type Place } from './placement';
import { LocalStorageStore, MemoryStore } from './storage';

const SEOUL = { lat: 37.5663, lng: 126.9779 };
const HOUR = 60 * 60 * 1000;
const T0 = 1_800_000_000_000;

const cafes: Place[] = [0, 1, 2, 3].map((i) => ({
  id: `kakao:${100 + i}`,
  name: `카페 ${i}`,
  pos: offsetMeters(SEOUL, 100 * (i + 1), 0),
  kind: 'cafe',
}));

const fix = (pos = SEOUL, accuracy = 5) => ({ pos, accuracy, timestamp: T0 });

describe('pickPlace', () => {
  it('같은 캐릭터·창·후보면 같은 곳, 후보 순서와 무관', () => {
    const a = pickPlace('seoyun', 7, cafes, undefined);
    const b = pickPlace('seoyun', 7, [...cafes].reverse(), undefined);
    expect(a).toEqual(b);
  });

  it('직전 장소는 고르지 않는다', () => {
    for (let w = 0; w < 50; w++) {
      const last = pickPlace('seoyun', w, cafes, undefined)!;
      expect(pickPlace('seoyun', w, cafes, last.id)!.id).not.toBe(last.id);
    }
  });

  it('후보가 없거나 직전 장소뿐이면 null', () => {
    expect(pickPlace('seoyun', 1, [], undefined)).toBeNull();
    expect(pickPlace('seoyun', 1, [cafes[0]], cafes[0].id)).toBeNull();
  });

  it('창이 바뀌면 여러 장소에 고르게 나타난다', () => {
    const seen = new Set<string>();
    for (let w = 0; w < 40; w++) seen.add(pickPlace('seoyun', w, cafes, undefined)!.id);
    expect(seen.size).toBe(cafes.length);
  });
});

describe('virtualPlace', () => {
  it('200~600m 근처에, 같은 칸 안에서 걸어도 같은 지점', () => {
    const a = virtualPlace('doha', 'park', SEOUL, 3, undefined);
    const b = virtualPlace('doha', 'park', offsetMeters(SEOUL, 20, 20), 3, undefined);
    expect(a.virtual).toBe(true);
    expect(a.name).toBe('작은 공원');
    // 칸 중심 기준 200~600m라서 플레이어에게서는 대략 0~950m
    expect(distanceMeters(SEOUL, a.pos)).toBeLessThan(1000);
    if (a.id === b.id) expect(a.pos).toEqual(b.pos);
  });

  it('직전 장소면 다른 지점', () => {
    const a = virtualPlace('doha', 'park', SEOUL, 3, undefined);
    const b = virtualPlace('doha', 'park', SEOUL, 3, a.id);
    expect(b.id).not.toBe(a.id);
    expect(distanceMeters(a.pos, b.pos)).toBeGreaterThan(1);
  });
});

describe('GameState', () => {
  const nearCafe = (s: GameState, now: number) => {
    const st = s.status('seoyun', now);
    if (st.state !== 'here') throw new Error(st.state);
    s.setPlayer(fix(st.place.pos));
    return st.place;
  };

  it('위치를 모르면 unknown, 알면 실제 장소 후보에 나타난다', () => {
    const s = new GameState(new MemoryStore());
    expect(s.status('seoyun', T0).state).toBe('unknown');
    s.setPlayer(fix());
    s.setCandidates('cafe', cafes);
    const st = s.status('seoyun', T0);
    expect(st.state).toBe('here');
    if (st.state === 'here') expect(cafes.map((c) => c.id)).toContain(st.place.id);
  });

  it('후보가 없으면 가상 지점', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix());
    const st = s.status('chaea', T0);
    expect(st.state === 'here' && st.place.virtual).toBe(true);
  });

  it('멀면 만날 수 없고, 40m 안이면 만난다', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix());
    s.setCandidates('cafe', cafes);
    const st = s.status('seoyun', T0);
    if (st.state !== 'here') throw new Error();
    const far = s.beginMeeting('seoyun', T0);
    expect(far).toMatchObject({ ok: false, reason: 'too-far' });
    s.setPlayer(fix(offsetMeters(st.place.pos, 30, 0)));
    expect(s.beginMeeting('seoyun', T0)).toMatchObject({ ok: true, episode: 1, affection: 0 });
  });

  it('정확도가 나쁘면 만날 수 없다', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix());
    s.setCandidates('cafe', cafes);
    const place = nearCafe(s, T0);
    s.setPlayer(fix(place.pos, 300));
    expect(s.beginMeeting('seoyun', T0)).toMatchObject({ ok: false, reason: 'poor-accuracy' });
  });

  it('한 화를 끝내면 저장되고 1시간 쉰 뒤 다른 장소에 나타난다', () => {
    const store = new MemoryStore();
    const s = new GameState(store);
    s.setPlayer(fix());
    s.setCandidates('cafe', cafes);
    const place = nearCafe(s, T0);
    expect(s.beginMeeting('seoyun', T0).ok).toBe(true);
    s.finishMeeting('seoyun', place, { affection: 12, faces: ['neutral', 'smile'] }, T0);

    expect(s.progress('seoyun')).toMatchObject({ episode: 2, affection: 12, lastPlaceId: place.id });
    expect(s.status('seoyun', T0 + HOUR - 1)).toMatchObject({ state: 'resting' });
    expect(s.beginMeeting('seoyun', T0 + 10)).toMatchObject({ ok: false, reason: 'resting' });
    const after = s.status('seoyun', T0 + HOUR);
    expect(after.state).toBe('here');
    if (after.state === 'here') expect(after.place.id).not.toBe(place.id);

    // 새로 불러와도 그대로
    const again = new GameState(store);
    expect(again.progress('seoyun')).toMatchObject({ episode: 2, affection: 12 });
    expect(again.progress('seoyun').faces.sort()).toEqual(['neutral', 'smile']);
  });

  it('엔딩을 보면 더 나오지 않는다', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix());
    const st = s.status('doha', T0);
    if (st.state !== 'here') throw new Error();
    s.finishMeeting('doha', st.place, { affection: 70, faces: ['shy'], ending: 'happy' }, T0);
    expect(s.status('doha', T0 + 5 * HOUR)).toEqual({ state: 'done', ending: 'happy' });
    expect(s.beginMeeting('doha', T0 + 5 * HOUR)).toMatchObject({ ok: false, reason: 'done' });
  });

  it('가상 지점으로 걸어가는 동안 격자 칸을 넘어도 장소가 그대로다', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix());
    const st = s.status('chaea', T0);
    if (st.state !== 'here') throw new Error();
    for (let t = 0.1; t <= 1; t += 0.1) {
      const p = { lat: SEOUL.lat + (st.place.pos.lat - SEOUL.lat) * t, lng: SEOUL.lng + (st.place.pos.lng - SEOUL.lng) * t };
      s.setPlayer(fix(p));
      expect(s.status('chaea', T0)).toEqual(st);
    }
    expect(s.beginMeeting('chaea', T0).ok).toBe(true);
  });

  it('실제 장소 후보가 나중에 오면 가상 지점에서 옮긴다', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix());
    const before = s.status('seoyun', T0);
    expect(before.state === 'here' && before.place.virtual).toBe(true);
    s.setCandidates('cafe', cafes);
    const after = s.status('seoyun', T0);
    expect(after.state === 'here' && after.place.virtual).toBeFalsy();
  });

  it('국외에서는 나타나지 않는다', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix({ lat: 35.6812, lng: 139.7671 })); // 도쿄
    expect(s.status('seoyun', T0).state).toBe('unknown');
  });

  it('skipRest·reset', () => {
    const s = new GameState(new MemoryStore());
    s.setPlayer(fix());
    const st = s.status('chaea', T0);
    if (st.state !== 'here') throw new Error();
    s.finishMeeting('chaea', st.place, { affection: 5, faces: [] }, T0);
    s.skipRest();
    expect(s.status('chaea', T0 + 1).state).toBe('here');
    s.reset();
    expect(s.progress('chaea')).toMatchObject({ episode: 1, affection: 0 });
    expect(s.lastKnown).toEqual(SEOUL);
  });

  it('창 번호는 1시간 단위', () => {
    expect(placementWindow(HOUR * 5 + 1, DEFAULT_PLACEMENT)).toBe(5);
  });
});

describe('LocalStorageStore', () => {
  const mem = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
  };

  it('저장·불러오기', () => {
    const st = mem();
    const a = new LocalStorageStore('k', st);
    a.save({ version: 1, heroes: { seoyun: { episode: 3, affection: 40, faces: ['smile'] } } });
    expect(new LocalStorageStore('k', st).load()?.heroes.seoyun.affection).toBe(40);
  });

  it('손상·다른 버전이면 null, faces가 없으면 채운다', () => {
    const st = mem();
    st.setItem('k', '{oops');
    expect(new LocalStorageStore('k', st).load()).toBeNull();
    st.setItem('k', JSON.stringify({ version: 99, heroes: {} }));
    expect(new LocalStorageStore('k', st).load()).toBeNull();
    st.setItem('k', JSON.stringify({ version: 1, heroes: { a: { episode: 1, affection: 0 } } }));
    expect(new LocalStorageStore('k', st).load()?.heroes.a.faces).toEqual([]);
  });
});
