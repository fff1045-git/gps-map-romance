import { distanceMeters, type LatLng } from '../core/geo';
import type { NearbyPlace, NearbyQuery } from '../map/MapProvider';
import { PLACE_QUERIES, type PlaceKind } from '../romance/heroes';
import type { Place } from './placement';

export type NearbySearch = (q: NearbyQuery, center: LatLng, radiusM: number) => Promise<NearbyPlace[]>;

export interface PlaceFinderConfig {
  /** 이 반경 안의 장소를 후보로 쓴다(m). */
  radiusM: number;
  /** 마지막 검색 지점에서 이만큼 움직이면 다시 찾는다(m). */
  refreshAfterM: number;
}

export const DEFAULT_FINDER: PlaceFinderConfig = { radiusM: 1000, refreshAfterM: 400 };

/**
 * 플레이어 주변 실제 장소를 장소 유형별로 찾아 onFound로 넘긴다.
 * 검색이 안 되면(지원 안 함·실패) 빈 배열을 넘겨 가상 지점으로 대체되게 한다.
 */
export class PlaceFinder {
  private lastCenter: LatLng | null = null;
  private running = false;

  constructor(
    private readonly search: NearbySearch | undefined,
    private readonly onFound: (kind: PlaceKind, places: Place[]) => void,
    private readonly cfg: PlaceFinderConfig = DEFAULT_FINDER,
  ) {}

  /** 위치가 바뀔 때마다 부른다. 필요할 때만 실제로 검색한다. 검색했으면 true. */
  async update(pos: LatLng): Promise<boolean> {
    if (this.running) return false;
    if (this.lastCenter && distanceMeters(this.lastCenter, pos) < this.cfg.refreshAfterM) return false;
    this.running = true;
    this.lastCenter = pos;
    try {
      const kinds = Object.keys(PLACE_QUERIES) as PlaceKind[];
      await Promise.all(kinds.map(async (kind) => this.onFound(kind, await this.find(kind, pos))));
    } finally {
      this.running = false;
    }
    return true;
  }

  private async find(kind: PlaceKind, pos: LatLng): Promise<Place[]> {
    if (!this.search) return [];
    const rows = await Promise.all(
      PLACE_QUERIES[kind].map((q) => this.search!(q, pos, this.cfg.radiusM).catch(() => [] as NearbyPlace[])),
    );
    const byId = new Map<string, Place>();
    for (const r of rows.flat()) {
      if (distanceMeters(pos, r.pos) > this.cfg.radiusM) continue;
      byId.set(r.id, { id: r.id, name: r.name, pos: r.pos, kind });
    }
    return [...byId.values()];
  }
}
