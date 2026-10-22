import type { LatLng } from '../core/geo';
import type { AppConfig } from '../app/config';
import { KakaoProvider } from './KakaoProvider';
import { LeafletProvider } from './LeafletProvider';
import type { MapProvider } from './MapProvider';

export interface ProviderResult {
  provider: MapProvider;
  /** 원하는 지도를 못 써서 폴백했을 때 그 이유. 화면에 보여 준다. */
  fallbackReason?: string;
}

/** 설정대로 지도를 띄운다. 카카오가 안 되면(키 없음·로드 실패) Leaflet 폴백. */
export async function createProvider(
  cfg: AppConfig,
  el: HTMLElement,
  center: LatLng,
  zoom: number,
): Promise<ProviderResult> {
  let fallbackReason: string | undefined;

  if (cfg.mapProvider === 'kakao') {
    if (!cfg.kakaoKey) {
      fallbackReason = '카카오 JavaScript 키가 없어 개발용 지도로 표시합니다 (.env.local의 VITE_KAKAO_JS_KEY).';
    } else {
      const kakao = new KakaoProvider(cfg.kakaoKey, cfg.kakaoMapType);
      try {
        await kakao.mount(el, center, zoom);
        return { provider: kakao };
      } catch (e) {
        fallbackReason = `카카오맵을 불러오지 못해 개발용 지도로 표시합니다: ${(e as Error).message}`;
        console.warn('[map]', fallbackReason);
        el.replaceChildren();
      }
    }
  }

  const leaflet = new LeafletProvider(cfg.fallbackTiles);
  await leaflet.mount(el, center, zoom);
  return { provider: leaflet, fallbackReason };
}
