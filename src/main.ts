import './styles.css';
import { readConfig } from './app/config';
import { distanceMeters, type LatLng } from './core/geo';
import { KOREA_OVERVIEW } from './core/korea';
import { Hud } from './app/hud';
import { GameState } from './game/GameState';
import { PlaceFinder } from './game/PlaceFinder';
import type { PlayerFix } from './game/rules';
import { LocalStorageStore } from './game/storage';
import type { LocationSource } from './gps/LocationSource';
import { createGps, getStartFix, isNativeApp } from './gps/platform';
import { PositionFilter } from './gps/PositionFilter';
import { Simulator } from './gps/Simulator';
import { createProvider } from './map/createProvider';
import { heroImage, josa, type Hero } from './romance/heroes';
import { runMeeting } from './romance/Meeting';
import { STORIES } from './romance/story';

const PLAYER_ID = 'player';
const HERO_PREFIX = 'hero:';

/** 시뮬레이터에서 지도를 눌렀을 때 이보다 멀면 걸어가지 않고 순간이동한다(m). */
const TELEPORT_OVER_M = 300;

async function main() {
  const cfg = readConfig(import.meta.env, new URL(location.href), isNativeApp);
  const hud = new Hud();
  const state = new GameState(new LocalStorageStore());

  // ── 시작 위치: ?at → 현재 위치(Geolocation) → 마지막 위치 → 사용자가 고름 ──
  // 지도는 마지막 위치(없으면 전국)로 먼저 띄우고, 현재 위치를 받는 대로 옮긴다.
  hud.setSource('📡 현재 위치 확인 중…');
  const firstView = cfg.start ?? state.lastKnown;
  const [here, { provider, fallbackReason }] = await Promise.all([
    cfg.start ? Promise.resolve(null) : getStartFix(),
    createProvider(
      cfg,
      document.getElementById('map')!,
      firstView ?? KOREA_OVERVIEW.center,
      firstView ? cfg.zoom : KOREA_OVERVIEW.zoom,
    ),
  ]);
  if (fallbackReason) hud.banner(fallbackReason, 'warn');
  document.body.dataset.map = provider.name;

  const startPos = cfg.start ?? here?.pos ?? state.lastKnown;
  if (startPos) {
    provider.setZoom(cfg.zoom);
    provider.setCenter(startPos);
  }

  // ── 카메라 따라가기 ─────────────────────────────
  let follow = true;
  const setFollow = (on: boolean) => {
    follow = on;
    hud.setFollow(on);
  };
  provider.onUserPan(() => setFollow(false));
  hud.onFollow(() => {
    setFollow(true);
    if (state.player) provider.setCenter(state.player.pos, true);
  });

  // ── 위치 소스 ──────────────────────────────────
  const switchMode = (sim: boolean) => {
    const u = new URL(location.href);
    u.searchParams.set('sim', sim ? '1' : '0');
    location.href = u.toString();
  };

  let source: LocationSource;
  let sim: Simulator | null = null;
  let askedToPick = false;

  if (cfg.useSimulator) {
    sim = new Simulator(startPos, { keyTarget: window });
    source = sim;
    hud.setHint(`WASD·방향키 걷기 · Shift 달리기 · 지도 클릭: 가까우면 걸어가고 ${TELEPORT_OVER_M}m 넘으면 순간이동`);
    hud.setMode('📡 실제 GPS', () => switchMode(false));
    if (!startPos) {
      askedToPick = true;
      hud.setSource('🕹️ 시작 위치 없음', 'warn');
      hud.banner('현재 위치를 받지 못했어요. 위 검색창에서 장소를 찾거나 지도를 눌러 시작 위치를 고르세요.', 'warn');
    } else if (!cfg.start && !here) {
      hud.toast('현재 위치를 받지 못해 마지막 위치에서 시작해요');
    }
  } else {
    source = createGps();
    hud.setMode('🕹️ 시뮬레이터', () => switchMode(true));
  }

  const teleportTo = (p: LatLng) => {
    if (!sim) return;
    setFollow(true);
    provider.setZoom(cfg.zoom);
    sim.teleport(p);
  };

  if (sim) {
    const s = sim;
    provider.onClick((p) => {
      const cur = s.position;
      if (!cur || distanceMeters(cur, p) > TELEPORT_OVER_M) teleportTo(p);
      else s.walkTo(p);
    });
  }

  if (provider.searchPlaces) {
    const search = provider.searchPlaces.bind(provider);
    hud.enableSearch(search, (r) => {
      if (sim) {
        teleportTo(r.pos);
        hud.toast(`${r.name}(으)로 순간이동`);
      } else {
        setFollow(false);
        provider.setZoom(cfg.zoom);
        provider.setCenter(r.pos, true);
        hud.toast('실제 GPS 모드에서는 지도만 옮겨요');
      }
    });
  }

  // 주변 실제 장소(카페·학교·공원). 지원하지 않는 지도(Leaflet)면 가상 지점.
  const finder = new PlaceFinder(provider.searchNearby?.bind(provider), (kind, places) =>
    state.setCandidates(kind, places),
  );

  const filter = new PositionFilter();
  const onFix = (raw: PlayerFix) => {
    let fix = raw;
    if (source.kind === 'gps') {
      const r = filter.push(raw);
      if (!r.accepted) {
        hud.setSource(r.reason === 'inaccurate' ? `📡 신호 약함 ±${Math.round(raw.accuracy)}m` : '📡 위치 튐 무시', 'warn');
        return;
      }
      fix = r.fix;
    }
    if (askedToPick) {
      askedToPick = false;
      hud.hideBanner();
    }
    state.setPlayer(fix);
    void finder.update(fix.pos);
    if (follow) provider.setCenter(fix.pos);
  };

  source.start(onFix, (err) => {
    if (err.code === 'coarse-only') return hud.banner(err.message, 'warn');
    hud.setSource('📡 위치 없음', 'error');
    const where = state.lastKnown ? ' 지금은 마지막으로 알던 위치를 보여 주고 있어요.' : '';
    hud.banner(err.message + where, 'error', { label: '시뮬레이터로 하기', onClick: () => switchMode(true) });
  });
  // GPS 모드: 시작 때 받은 위치를 첫 측정으로 쓴다(watchPosition 첫 응답 전까지).
  if (source.kind === 'gps' && here) onFix(here);

  // ── 만남 ──────────────────────────────────────
  // 지도에서 캐릭터 탭 → (40m 안이면) 만남 화면 → 끝까지 보면 저장 → 지도로 복귀
  let inMeeting = false;
  const meet = async (hero: Hero) => {
    if (inMeeting) return;
    const now = Date.now();
    const r = state.beginMeeting(hero.id, now);
    if (r.ok) {
      const episode = STORIES[hero.id]?.[r.episode - 1];
      if (!episode) return;
      inMeeting = true;
      const res = await runMeeting({ hero, episode, episodeNo: r.episode, affection: r.affection, place: r.place }).finally(
        () => (inMeeting = false),
      );
      if (!res.completed) return hud.toast(`${josa(hero.short, '과/와')}의 이야기는 다음에 이어서 봐요`);
      state.finishMeeting(hero.id, r.place, res, Date.now());
      hud.pop(res.ending === 'happy' ? '💖' : '💗', provider.latLngToScreen(r.place.pos));
      return;
    }
    switch (r.reason) {
      case 'too-far':
        hud.toast(`${Math.ceil(r.remainingM)}m 더 가까이 가야 만날 수 있어요`);
        break;
      case 'poor-accuracy':
        hud.toast(`GPS 신호가 약해요 (±${Math.round(r.accuracyM)}m)`);
        break;
      case 'no-position':
        hud.toast('아직 내 위치를 몰라요');
        break;
      case 'resting':
        hud.toast(`${josa(hero.short, '은/는')} 지금 쉬는 중이에요`);
        break;
      default:
        hud.toast('지금은 만날 수 없어요');
    }
  };

  // ── 그리기 ────────────────────────────────────
  const shown = new Set<string>();

  const render = () => {
    const now = Date.now();
    const player = state.player;

    const rows = state.heroes.map((hero) => {
      const status = state.status(hero.id, now);
      const distanceM = status.state === 'here' && player ? distanceMeters(player.pos, status.place.pos) : undefined;
      return { hero, save: state.progress(hero.id), status, distanceM };
    });
    hud.setHeroes(rows);
    if (!player) return;

    const weak = player.accuracy > state.meetConfig.maxAccuracyM;
    hud.setSource(
      `${source.kind === 'sim' ? '🕹️ 시뮬레이터' : '📡 GPS'} ±${Math.round(player.accuracy)}m`,
      weak ? 'warn' : 'ok',
    );
    provider.setMarker({ id: PLAYER_ID, pos: player.pos, html: '<div class="player"></div>', zIndex: 100 });
    provider.setCircle({ id: PLAYER_ID, center: player.pos, radiusM: state.meetConfig.radiusM, color: '#ff8fb1' });

    const next = new Set<string>();
    let hot: Hero | null = null;
    let nearest: { hero: Hero; d: number } | null = null;
    for (const { hero, status, distanceM } of rows) {
      if (status.state !== 'here' || distanceM === undefined) continue;
      const ok = state.check(status.place).ok;
      if (ok) hot = hero;
      if (!nearest || distanceM < nearest.d) nearest = { hero, d: distanceM };
      const id = HERO_PREFIX + hero.id;
      next.add(id);
      provider.setMarker({
        id,
        pos: status.place.pos,
        html:
          `<button class="hero-pin${ok ? ' hot' : ''}" type="button" style="--hero:${hero.color}" aria-label="${hero.short} 만나기">` +
          `<span class="face" style="background-image:url('${heroImage(hero.id, 'neutral')}')"></span>` +
          `<span class="label">${hero.short} · ${status.place.name}</span></button>`,
        zIndex: ok ? 50 : 10,
        onClick: () => void meet(hero),
      });
    }
    for (const id of shown) if (!next.has(id)) provider.removeMarker(id);
    shown.clear();
    for (const id of next) shown.add(id);

    if (!state.inPlayArea) hud.setNear('🇰🇷 국내에서만 만날 수 있어요', 'warn');
    else if (hot) hud.setNear(`💗 ${josa(hot.short, '을/를')} 만날 수 있어요`, 'hot');
    else if (nearest) hud.setNear(`${nearest.hero.short}까지 ${Math.round(nearest.d)}m`);
    else hud.setNear('모두 쉬는 중이에요');
  };

  state.subscribe(render);
  render();
  // 쉬는 시간·장소 시간 창이 바뀌므로 가끔 다시 그린다.
  setInterval(() => state.tick(), 15_000);

  hud.onReset(() => {
    if (confirm('모든 캐릭터와의 진행을 지울까요?')) state.reset();
  });

  if (provider.showStreetView) {
    const show = provider.showStreetView.bind(provider);
    hud.enableRoadview((el) => show(state.player?.pos ?? provider.getCenter(), el));
  }

  // 개발 중 콘솔에서 확인할 수 있게(예: __game.state.skipRest())
  Object.assign(window, { __game: { state, provider, source, cfg, finder } });
}

main().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre class="fatal">${String(e?.message ?? e)}</pre>`);
});
