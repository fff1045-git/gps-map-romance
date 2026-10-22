import { METERS_PER_DEG_LAT, offsetMeters, type LatLng } from '../core/geo';
import { seededRandom } from '../core/random';
import { VIRTUAL_PLACE_NAME, type PlaceKind } from '../romance/heroes';

/** 캐릭터가 서 있을 수 있는 장소. 실제(카카오 장소 검색) 또는 가상(격자 시드). */
export interface Place {
  id: string;
  name: string;
  pos: LatLng;
  kind: PlaceKind;
  virtual?: boolean;
}

export interface PlacementConfig {
  /** 이 시간 동안 같은 장소에 머문다(ms). */
  windowMs: number;
  /** 가상 지점 격자 한 칸(m). 플레이어가 이 칸 안에 있는 동안 가상 지점이 고정된다. */
  virtualCellM: number;
  /** 가상 지점이 칸 중심에서 떨어지는 거리 범위(m). */
  virtualMinM: number;
  virtualMaxM: number;
  seed: string;
}

export const DEFAULT_PLACEMENT: PlacementConfig = {
  windowMs: 60 * 60 * 1000,
  virtualCellM: 500,
  virtualMinM: 200,
  virtualMaxM: 600,
  seed: 'gps-romance-v1',
};

export function placementWindow(now: number, cfg: PlacementConfig): number {
  return Math.floor(now / cfg.windowMs);
}

/**
 * 후보 장소 중 하나를 결정적으로 고른다. 같은 (캐릭터, 시간 창, 후보 목록)이면 같은 곳.
 * 직전에 만난 장소는 뺀다. 고를 곳이 없으면 null.
 */
export function pickPlace(
  heroId: string,
  window: number,
  candidates: readonly Place[],
  excludeId: string | undefined,
  cfg: PlacementConfig = DEFAULT_PLACEMENT,
): Place | null {
  const pool = candidates.filter((p) => p.id !== excludeId).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (!pool.length) return null;
  const rand = seededRandom(`${cfg.seed}:${heroId}:${window}`);
  return pool[Math.floor(rand() * pool.length)];
}

/**
 * 장소 검색이 안 될 때 쓰는 가상 지점. 플레이어가 있는 격자 칸 중심에서 시드로 방향·거리를 정한다.
 * 같은 칸·같은 창이면 같은 지점이라 걸어가는 동안 도망가지 않는다.
 * 직전에 만난 곳과 같으면 다음 시드로 다시 뽑는다.
 */
export function virtualPlace(
  heroId: string,
  kind: PlaceKind,
  player: LatLng,
  window: number,
  excludeId: string | undefined,
  cfg: PlacementConfig = DEFAULT_PLACEMENT,
): Place {
  const dLat = cfg.virtualCellM / METERS_PER_DEG_LAT;
  const row = Math.floor(player.lat / dLat);
  const dLng = dLat / Math.cos(((row + 0.5) * dLat * Math.PI) / 180);
  const col = Math.floor(player.lng / dLng);
  const center = { lat: (row + 0.5) * dLat, lng: (col + 0.5) * dLng };
  for (let n = 0; ; n++) {
    const id = `v:${heroId}:${row}:${col}:${window}${n ? `:${n}` : ''}`;
    if (id === excludeId) continue;
    const rand = seededRandom(`${cfg.seed}:${id}`);
    const angle = rand() * 2 * Math.PI;
    const dist = cfg.virtualMinM + rand() * (cfg.virtualMaxM - cfg.virtualMinM);
    return {
      id,
      name: VIRTUAL_PLACE_NAME[kind],
      pos: offsetMeters(center, Math.cos(angle) * dist, Math.sin(angle) * dist),
      kind,
      virtual: true,
    };
  }
}
