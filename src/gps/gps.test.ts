import { describe, expect, it } from 'vitest';
import { deltaMeters, distanceMeters, offsetMeters } from '../core/geo';
import type { PlayerFix } from '../game/rules';
import { PositionFilter } from './PositionFilter';
import { Simulator } from './Simulator';

const HERE = { lat: 37.5663, lng: 126.9779 }; // 서울시청

const fix = (pos = HERE, accuracy = 10, timestamp = 0): PlayerFix => ({ pos, accuracy, timestamp });

describe('PositionFilter', () => {
  it('첫 측정은 그대로 받는다', () => {
    const f = new PositionFilter();
    expect(f.push(fix())).toEqual({ accepted: true, fix: fix() });
  });

  it('정확도가 너무 나쁘면 버린다', () => {
    expect(new PositionFilter().push(fix(HERE, 900))).toMatchObject({ accepted: false, reason: 'inaccurate' });
  });

  it('1초에 1km 튀는 값은 버린다', () => {
    const f = new PositionFilter();
    f.push(fix(HERE, 10, 0));
    expect(f.push(fix(offsetMeters(HERE, 1000, 0), 10, 1000))).toMatchObject({ accepted: false, reason: 'jump' });
  });

  it('튄 값이 계속 같은 곳을 가리키면 실제 이동으로 받아들인다', () => {
    const f = new PositionFilter();
    f.push(fix(HERE, 10, 0));
    const far = offsetMeters(HERE, 1000, 0);
    f.push(fix(far, 10, 1000));
    f.push(fix(far, 10, 2000));
    const r = f.push(fix(far, 10, 3000));
    expect(r.accepted).toBe(true);
    if (r.accepted) expect(distanceMeters(r.fix.pos, far)).toBeLessThan(1);
  });

  it('제자리 잡음은 평활화되어 흔들림이 줄어든다', () => {
    const f = new PositionFilter();
    let maxDev = 0;
    for (let i = 0; i < 40; i++) {
      const noisy = offsetMeters(HERE, (i % 2 ? 1 : -1) * 8, 0);
      const r = f.push(fix(noisy, 10, i * 1000));
      if (r.accepted && i > 5) maxDev = Math.max(maxDev, distanceMeters(HERE, r.fix.pos));
    }
    expect(maxDev).toBeLessThan(6);
  });

  it('걷는 중이면 뒤처지지 않고 따라간다', () => {
    const f = new PositionFilter();
    let out = HERE;
    for (let i = 0; i <= 30; i++) {
      const r = f.push(fix(offsetMeters(HERE, i * 1.4, 0), 5, i * 1000));
      if (r.accepted) out = r.fix.pos;
    }
    expect(distanceMeters(out, offsetMeters(HERE, 42, 0))).toBeLessThan(5);
  });
});

describe('Simulator', () => {
  it('walkTo로 목표까지 걷고 도착하면 멈춘다', () => {
    let t = 0;
    const sim = new Simulator(HERE, { speedMps: 4, now: () => t });
    const fixes: PlayerFix[] = [];
    sim.start((f) => fixes.push(f), () => {});
    const goal = offsetMeters(HERE, 0, 20);
    sim.walkTo(goal);
    for (t = 500; t <= 10_000; t += 500) sim.step(t);
    expect(distanceMeters(sim.position!, goal)).toBeLessThan(0.01);
    // 4m/s × 0.5s = 2m씩이라 약 10번 이동. 도착 뒤에는 더 보고하지 않는다.
    const afterArrival = fixes.length;
    expect(afterArrival).toBeGreaterThanOrEqual(11);
    expect(afterArrival).toBeLessThanOrEqual(12);
    for (; t <= 15_000; t += 500) sim.step(t);
    expect(fixes.length).toBe(afterArrival);
    sim.stop();
  });

  it('키를 누르면 그 방향으로 움직인다', () => {
    let t = 0;
    const listeners: Record<string, (e: Event) => void> = {};
    const keyTarget = {
      addEventListener: (type: string, fn: (e: Event) => void) => void (listeners[type] = fn),
      removeEventListener: () => {},
    } as unknown as Window;
    const sim = new Simulator(HERE, { speedMps: 4, now: () => t, keyTarget });
    sim.start(() => {}, () => {});
    listeners.keydown({ code: 'KeyD', key: 'd', target: null, preventDefault() {} } as unknown as Event);
    t = 1000;
    sim.step(t);
    sim.stop();
    const d = deltaMeters(HERE, sim.position!);
    expect(d.eastM).toBeCloseTo(4, 1);
    expect(Math.abs(d.northM)).toBeLessThan(0.01);
  });

  it('시작 위치가 없으면 순간이동 전까지 아무것도 보고하지 않는다', () => {
    let t = 0;
    const sim = new Simulator(null, { now: () => t });
    const fixes: PlayerFix[] = [];
    sim.start((f) => fixes.push(f), () => {});
    for (t = 100; t <= 1000; t += 100) sim.step(t);
    expect(fixes).toEqual([]);
    const busan = { lat: 35.1798, lng: 129.075 };
    sim.walkTo(busan); // 위치가 없으면 걷지 않고 바로 이동
    expect(fixes.at(-1)?.pos).toEqual(busan);
    sim.teleport(HERE);
    expect(fixes.at(-1)?.pos).toEqual(HERE);
    sim.stop();
  });
});
