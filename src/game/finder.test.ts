import { describe, expect, it } from 'vitest';
import { offsetMeters } from '../core/geo';
import type { NearbyQuery } from '../map/MapProvider';
import { PlaceFinder, type NearbySearch } from './PlaceFinder';
import type { Place } from './placement';

const HOME = { lat: 37.5, lng: 127.0 };

function fakeSearch(log: NearbyQuery[]): NearbySearch {
  return async (q, center) => {
    log.push(q);
    if ('category' in q && q.category === 'CE7') {
      return [
        { id: 'kakao:1', name: '가까운 카페', address: '', pos: offsetMeters(center, 100, 0) },
        { id: 'kakao:2', name: '먼 카페', address: '', pos: offsetMeters(center, 1500, 0) },
      ];
    }
    if ('keyword' in q && q.keyword === '공원') {
      return [{ id: 'kakao:9', name: '중앙공원', address: '', pos: offsetMeters(center, 300, 0) }];
    }
    if ('category' in q && q.category === 'AT4') {
      // 같은 장소가 다른 조건에서도 나오면 한 번만
      return [{ id: 'kakao:9', name: '중앙공원', address: '', pos: offsetMeters(center, 300, 0) }];
    }
    if ('keyword' in q && q.keyword === '도서관') throw new Error('network');
    return [];
  };
}

describe('PlaceFinder', () => {
  it('유형별로 찾고, 반경 밖은 빼고, 중복은 합친다', async () => {
    const log: NearbyQuery[] = [];
    const found: Record<string, Place[]> = {};
    const f = new PlaceFinder(fakeSearch(log), (k, p) => (found[k] = p));
    expect(await f.update(HOME)).toBe(true);
    expect(found.cafe.map((p) => p.name)).toEqual(['가까운 카페']);
    expect(found.park.map((p) => p.id)).toEqual(['kakao:9']);
    expect(found.campus).toEqual([]); // 실패한 검색은 빈 결과로
    expect(found.cafe[0].kind).toBe('cafe');
  });

  it('조금 움직이면 다시 찾지 않고, 많이 움직이면 다시 찾는다', async () => {
    const log: NearbyQuery[] = [];
    const f = new PlaceFinder(fakeSearch(log), () => {});
    await f.update(HOME);
    const n = log.length;
    expect(await f.update(offsetMeters(HOME, 100, 0))).toBe(false);
    expect(log.length).toBe(n);
    expect(await f.update(offsetMeters(HOME, 500, 0))).toBe(true);
    expect(log.length).toBe(n * 2);
  });

  it('검색을 지원하지 않으면 빈 후보', async () => {
    const found: Record<string, Place[]> = {};
    await new PlaceFinder(undefined, (k, p) => (found[k] = p)).update(HOME);
    expect(found).toEqual({ cafe: [], campus: [], park: [] });
  });
});
