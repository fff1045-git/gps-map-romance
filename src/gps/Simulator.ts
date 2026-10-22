import { distanceMeters, lerpLatLng, offsetMeters, type LatLng } from '../core/geo';
import type { PlayerFix } from '../game/rules';
import type { LocationError, LocationSource } from './LocationSource';

export interface SimulatorOptions {
  /** 걷는 속도(m/s). Shift를 누르면 3배. */
  speedMps?: number;
  tickMs?: number;
  /** 보고할 정확도(m). */
  accuracyM?: number;
  /** 키 입력을 받을 대상. 테스트에서는 생략. */
  keyTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  now?: () => number;
}

const KEY_DIRS: Record<string, [north: number, east: number]> = {
  KeyW: [1, 0], ArrowUp: [1, 0],
  KeyS: [-1, 0], ArrowDown: [-1, 0],
  KeyA: [0, -1], ArrowLeft: [0, -1],
  KeyD: [0, 1], ArrowRight: [0, 1],
};

/**
 * PC 개발용 가짜 위치. WASD/방향키로 걷고, walkTo로 목표 지점까지 걸어가고, teleport로 순간이동한다.
 * 걷기는 연속 이동이라 게임 로직은 GPS와 똑같이 동작한다.
 * 시작 위치를 모르면(null) teleport가 불릴 때까지 아무 위치도 보고하지 않는다.
 */
export class Simulator implements LocationSource {
  readonly kind = 'sim';
  private pos: LatLng | null;
  private target: LatLng | null = null;
  private held = new Set<string>();
  private run = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTick = 0;
  private onFix: ((fix: PlayerFix) => void) | null = null;
  private readonly speed: number;
  private readonly tickMs: number;
  private readonly accuracy: number;
  private readonly now: () => number;

  constructor(start: LatLng | null, private readonly opts: SimulatorOptions = {}) {
    this.pos = start;
    this.speed = opts.speedMps ?? 4;
    this.tickMs = opts.tickMs ?? 100;
    this.accuracy = opts.accuracyM ?? 5;
    this.now = opts.now ?? Date.now;
  }

  get position(): LatLng | null {
    return this.pos;
  }

  start(onFix: (fix: PlayerFix) => void, _onError: (err: LocationError) => void): void {
    this.onFix = onFix;
    this.opts.keyTarget?.addEventListener('keydown', this.onKeyDown);
    this.opts.keyTarget?.addEventListener('keyup', this.onKeyUp);
    this.opts.keyTarget?.addEventListener('blur', this.onBlur);
    this.lastTick = this.now();
    this.timer = setInterval(() => this.step(this.now()), this.tickMs);
    this.emit();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.opts.keyTarget?.removeEventListener('keydown', this.onKeyDown);
    this.opts.keyTarget?.removeEventListener('keyup', this.onKeyUp);
    this.opts.keyTarget?.removeEventListener('blur', this.onBlur);
    this.onFix = null;
  }

  /** 목표 지점까지 걸어간다. 아직 위치가 없으면 바로 그 자리로 간다. */
  walkTo(p: LatLng): void {
    if (!this.pos) return this.teleport(p);
    this.target = p;
  }

  teleport(p: LatLng): void {
    this.pos = p;
    this.target = null;
    this.emit();
  }

  /** 시간 t까지 이동을 진행한다. 타이머가 부르지만 테스트에서 직접 불러도 된다. */
  step(t: number): void {
    const dt = Math.min((t - this.lastTick) / 1000, 1);
    this.lastTick = t;
    if (dt <= 0 || !this.pos) return;
    const dist = this.speed * (this.run ? 3 : 1) * dt;

    let north = 0;
    let east = 0;
    for (const code of this.held) {
      const d = KEY_DIRS[code];
      if (d) { north += d[0]; east += d[1]; }
    }
    if (north || east) {
      this.target = null; // 키 입력이 클릭 이동보다 우선
      const len = Math.hypot(north, east);
      this.pos = offsetMeters(this.pos, (north / len) * dist, (east / len) * dist);
      this.emit(t);
    } else if (this.target) {
      const remaining = distanceMeters(this.pos, this.target);
      if (remaining <= dist) {
        this.pos = this.target;
        this.target = null;
      } else {
        this.pos = lerpLatLng(this.pos, this.target, dist / remaining);
      }
      this.emit(t);
    }
  }

  private emit(t = this.now()) {
    if (!this.pos) return;
    this.onFix?.({ pos: this.pos, accuracy: this.accuracy, timestamp: t });
  }

  private onKeyDown = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (isTyping(ke)) return;
    if (ke.key === 'Shift') this.run = true;
    if (ke.code in KEY_DIRS) {
      this.held.add(ke.code);
      ke.preventDefault();
    }
  };

  private onKeyUp = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Shift') this.run = false;
    this.held.delete(ke.code);
  };

  private onBlur = () => {
    this.held.clear();
    this.run = false;
  };
}

function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
