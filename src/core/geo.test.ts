import { describe, expect, it } from 'vitest';
import { deltaMeters, distanceMeters, offsetMeters } from './geo';
import { isInKorea } from './korea';
import { hashString, mulberry32 } from './random';

const HERE = { lat: 37.5663, lng: 126.9779 }; // 서울시청

describe('distanceMeters', () => {
  it('같은 점은 0', () => {
    expect(distanceMeters(HERE, HERE)).toBe(0);
  });

  it('위도 1도는 약 111.2km', () => {
    const d = distanceMeters({ lat: 37, lng: 127 }, { lat: 38, lng: 127 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it('서울시청–부산시청은 약 325km', () => {
    const d = distanceMeters({ lat: 37.5663, lng: 126.9779 }, { lat: 35.1798, lng: 129.075 });
    expect(d / 1000).toBeGreaterThan(320);
    expect(d / 1000).toBeLessThan(330);
  });
});

describe('offsetMeters / deltaMeters', () => {
  it('북동으로 30m, 40m 옮기면 거리 50m', () => {
    const p = offsetMeters(HERE, 30, 40);
    expect(distanceMeters(HERE, p)).toBeCloseTo(50, 1);
  });

  it('deltaMeters는 offsetMeters의 역', () => {
    const p = offsetMeters(HERE, -120, 75);
    const d = deltaMeters(HERE, p);
    expect(d.northM).toBeCloseTo(-120, 1);
    expect(d.eastM).toBeCloseTo(75, 1);
  });
});

describe('isInKorea', () => {
  const inside: Record<string, [number, number]> = {
    서울시청: [37.5663, 126.9779],
    부산시청: [35.1798, 129.075],
    제주시: [33.4996, 126.5312],
    마라도: [33.1167, 126.2667],
    울릉도: [37.4844, 130.9057],
    독도: [37.2426, 131.8669],
    백령도: [37.9667, 124.7167],
    강원고성: [38.38, 128.47],
    원주: [37.342, 127.92],
  };
  const outside: Record<string, [number, number]> = {
    평양: [39.0392, 125.7625],
    개성: [37.97, 126.55],
    대마도: [34.4, 129.3],
    후쿠오카: [33.59, 130.4],
    도쿄: [35.68, 139.69],
    상하이: [31.23, 121.47],
    다롄: [38.91, 121.6],
  };
  for (const [name, [lat, lng]] of Object.entries(inside)) {
    it(`${name}은 안`, () => expect(isInKorea({ lat, lng })).toBe(true));
  }
  for (const [name, [lat, lng]] of Object.entries(outside)) {
    it(`${name}은 밖`, () => expect(isInKorea({ lat, lng })).toBe(false));
  }
});

describe('random', () => {
  it('같은 시드면 같은 수열', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('값은 [0,1) 범위', () => {
    const r = mulberry32(hashString('x'));
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
