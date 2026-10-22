import type { LatLng } from '../core/geo';
import type { KakaoMapType } from '../map/KakaoProvider';
import type { FallbackTiles } from '../map/LeafletProvider';

export interface AppConfig {
  mapProvider: 'kakao' | 'leaflet';
  kakaoKey: string;
  kakaoMapType: KakaoMapType;
  fallbackTiles: FallbackTiles;
  useSimulator: boolean;
  /** URL ?at= 로 지정한 시작 위치. 없으면 현재 위치(Geolocation) → 마지막 위치 → 사용자가 고름. */
  start: LatLng | null;
  zoom: number;
}

type Env = Record<string, string | undefined>;

/**
 * .env(.local) 값과 URL 파라미터를 합친다. URL이 우선.
 *   ?sim=1|0          시뮬레이터 강제 on/off (기본: 브라우저 localhost에서는 on, 앱에서는 off)
 *   ?map=kakao|leaflet
 *   ?tiles=satellite|osm
 *   ?at=37.5663,126.9779  시작 위치 강제 (테스트용)
 */
export function readConfig(env: Env, url: URL, isNativeApp = false): AppConfig {
  const q = url.searchParams;
  // 앱 WebView도 주소가 https://localhost 라서, 앱이면 개발 서버로 보지 않는다.
  const isLocal = !isNativeApp && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const sim = q.get('sim');
  return {
    mapProvider: pick(q.get('map') ?? env.VITE_MAP_PROVIDER, ['kakao', 'leaflet'], 'kakao'),
    kakaoKey: (env.VITE_KAKAO_JS_KEY ?? '').trim(),
    kakaoMapType: pick(env.VITE_KAKAO_MAP_TYPE, ['hybrid', 'skyview'], 'hybrid'),
    fallbackTiles: pick(q.get('tiles') ?? env.VITE_FALLBACK_TILES, ['satellite', 'osm'], 'satellite'),
    useSimulator: sim === null ? isLocal : sim === '1',
    start: parseLatLng(q.get('at')),
    zoom: 18,
  };
}

function pick<T extends string>(v: string | null | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function parseLatLng(s: string | null): LatLng | null {
  if (!s) return null;
  const [lat, lng] = s.split(',').map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}
