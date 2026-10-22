import { deltaMeters, distanceMeters, offsetMeters } from '../core/geo';
import type { PlayerFix } from '../game/rules';

export interface FilterConfig {
  /** 정확도가 이보다 나쁜 측정은 버린다(m). */
  rejectAccuracyM: number;
  /** 이보다 빠른 이동은 GPS 튐으로 본다(m/s). 걷기·뛰기 게임 기준. */
  maxSpeedMps: number;
  /** 평활화에서 가정하는 플레이어 이동 속도(m/s). 클수록 새 측정을 더 믿는다. */
  processSpeedMps: number;
  /** 튐으로 버린 측정이 연속 이만큼 쌓이면 실제 이동으로 보고 받아들인다. */
  acceptAfterRejects: number;
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  rejectAccuracyM: 500,
  maxSpeedMps: 50,
  processSpeedMps: 3,
  acceptAfterRejects: 3,
};

export type FilterResult =
  | { accepted: true; fix: PlayerFix }
  | { accepted: false; reason: 'inaccurate' | 'jump' };

/**
 * GPS 보정: 엉터리 정확도 컷 → 비현실적 순간이동 제거 → 정확도 가중 평활화(1차원 칼만을 위·경도에 각각).
 * 출력 accuracy는 평활화 후 추정 오차.
 */
export class PositionFilter {
  private last: PlayerFix | null = null;
  private variance = 0;
  private rejects = 0;

  constructor(private readonly cfg: FilterConfig = DEFAULT_FILTER_CONFIG) {}

  reset(): void {
    this.last = null;
    this.rejects = 0;
  }

  push(fix: PlayerFix): FilterResult {
    if (!(fix.accuracy > 0) || fix.accuracy > this.cfg.rejectAccuracyM) {
      return { accepted: false, reason: 'inaccurate' };
    }
    const last = this.last;
    if (!last) return this.accept(fix);

    const dt = Math.max((fix.timestamp - last.timestamp) / 1000, 0.001);
    const d = distanceMeters(last.pos, fix.pos);
    const beyondNoise = d > fix.accuracy + last.accuracy;
    if (beyondNoise && d / dt > this.cfg.maxSpeedMps) {
      this.rejects += 1;
      if (this.rejects < this.cfg.acceptAfterRejects) return { accepted: false, reason: 'jump' };
      // 계속 같은 쪽을 가리키면 진짜 이동(차량, GPS 재획득)으로 보고 새로 시작한다.
      return this.accept(fix);
    }
    this.rejects = 0;

    const q = (this.cfg.processSpeedMps * dt) ** 2;
    const prior = this.variance + q;
    const k = prior / (prior + fix.accuracy ** 2);
    const delta = deltaMeters(last.pos, fix.pos);
    const smoothed: PlayerFix = {
      pos: offsetMeters(last.pos, delta.northM * k, delta.eastM * k),
      accuracy: Math.sqrt((1 - k) * prior),
      timestamp: fix.timestamp,
    };
    this.variance = (1 - k) * prior;
    this.last = smoothed;
    return { accepted: true, fix: smoothed };
  }

  private accept(fix: PlayerFix): FilterResult {
    this.last = fix;
    this.variance = fix.accuracy ** 2;
    this.rejects = 0;
    return { accepted: true, fix };
  }
}
