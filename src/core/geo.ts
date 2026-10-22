export interface LatLng {
  lat: number;
  lng: number;
}

/** WGS84 평균 지구 반지름(m). */
export const EARTH_RADIUS_M = 6_371_008.8;
/** 위도 1도의 길이(m). 구면 근사. */
export const METERS_PER_DEG_LAT = (Math.PI / 180) * EARTH_RADIUS_M;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 두 좌표 사이 대권 거리(m), 하버사인 공식. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 기준점에서 북쪽/동쪽으로 미터만큼 옮긴 좌표. 수 km 이내에서 쓰는 평면 근사. */
export function offsetMeters(p: LatLng, northM: number, eastM: number): LatLng {
  return {
    lat: p.lat + northM / METERS_PER_DEG_LAT,
    lng: p.lng + eastM / (METERS_PER_DEG_LAT * Math.cos(toRad(p.lat))),
  };
}

/** a에서 b로 향하는 방향을 북/동 미터 성분으로. 짧은 거리용 평면 근사. */
export function deltaMeters(a: LatLng, b: LatLng): { northM: number; eastM: number } {
  return {
    northM: (b.lat - a.lat) * METERS_PER_DEG_LAT,
    eastM: (b.lng - a.lng) * METERS_PER_DEG_LAT * Math.cos(toRad((a.lat + b.lat) / 2)),
  };
}

/** a→b 직선 위에서 a로부터 t(0..1) 지점. */
export function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}
