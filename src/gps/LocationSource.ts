import type { PlayerFix } from '../game/rules';

export type LocationErrorCode = 'unsupported' | 'insecure' | 'denied' | 'unavailable' | 'timeout' | 'coarse-only';

export interface LocationError {
  code: LocationErrorCode;
  message: string;
}

/** 위치 공급원. 실제 GPS와 개발용 시뮬레이터가 같은 모양을 따른다. */
export interface LocationSource {
  readonly kind: 'gps' | 'sim';
  start(onFix: (fix: PlayerFix) => void, onError: (err: LocationError) => void): void;
  stop(): void;
}
