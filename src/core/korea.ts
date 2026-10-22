import type { LatLng } from './geo';

/**
 * 대한민국 플레이 영역의 대략적인 다각형 [경도, 위도].
 * 카카오 스카이뷰가 국내만 제공하므로 이 안에서만 스폰한다.
 * 해안선을 따르지 않는 굵은 경계라 가까운 바다는 포함한다. 휴전선 부근(옹진반도 등)과
 * 대마도는 경계 근처라 정확하지 않다. 서쪽 백령도, 동쪽 울릉도·독도, 남쪽 제주·마라도는 포함한다.
 */
const KOREA_POLYGON: ReadonlyArray<readonly [number, number]> = [
  [124.5, 38.05], // 백령도 북서
  [125.2, 37.95],
  [126.1, 37.75], // 강화·한강 하구
  [126.7, 37.95],
  [127.1, 38.3], // 철원
  [128.0, 38.35],
  [128.35, 38.62], // 고성 휴전선
  [128.75, 38.62],
  [131.0, 38.0], // 울릉도 북쪽 바다
  [132.0, 37.5],
  [132.0, 36.8], // 독도 동쪽
  [130.0, 36.0],
  [129.6, 35.4], // 울산 앞바다
  [129.2, 35.0], // 부산 앞바다
  [128.9, 34.75], // 대마도 서쪽
  [128.4, 34.4],
  [127.6, 33.9],
  [127.2, 33.0], // 제주 남동
  [126.0, 32.9], // 마라도 남서
  [125.9, 33.6],
  [125.0, 34.0], // 가거도
  [124.6, 34.5],
  [124.5, 36.0],
];

/** 점이 플레이 영역(대한민국) 안인지. 반직선 교차 판정. */
export function isInKorea(p: LatLng): boolean {
  let inside = false;
  const x = p.lng;
  const y = p.lat;
  for (let i = 0, j = KOREA_POLYGON.length - 1; i < KOREA_POLYGON.length; j = i++) {
    const [xi, yi] = KOREA_POLYGON[i];
    const [xj, yj] = KOREA_POLYGON[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 위치를 모를 때 보여 줄 전국 지도 화면. 플레이어 위치로는 쓰지 않는다. */
export const KOREA_OVERVIEW = { center: { lat: 36.3, lng: 127.8 }, zoom: 7 } as const;
