import { HAPPY_THRESHOLD, type Face } from '../heroes';
import type { Episode, Step } from './types';

export type Frame =
  | { kind: 'line'; who: 'hero' | 'me' | 'narr'; text: string; face: Face }
  | { kind: 'choice'; options: readonly string[] };

export interface StoryVars {
  place: string;
  me: string;
}

export const AFFECTION_MIN = 0;
export const AFFECTION_MAX = 100;

const clamp = (v: number) => Math.min(AFFECTION_MAX, Math.max(AFFECTION_MIN, v));

/**
 * 한 화를 한 걸음씩 진행한다. DOM을 모른다.
 * current()로 지금 보여 줄 것을 받고, 대사면 advance(), 선택지면 choose(i).
 * 끝나면 current()가 null이고 affection·ending·faces를 결과로 쓴다.
 */
export class StoryRunner {
  private queue: Step[];
  private face: Face = 'neutral';
  private endingQueued = false;
  readonly faces = new Set<Face>(['neutral']);
  affection: number;
  ending: 'happy' | 'friend' | undefined;

  constructor(
    private readonly episode: Episode,
    startAffection: number,
    private readonly vars: StoryVars,
  ) {
    this.affection = clamp(startAffection);
    this.queue = [...episode.steps];
    this.settle();
  }

  get done(): boolean {
    return this.queue.length === 0;
  }

  current(): Frame | null {
    const s = this.queue[0];
    if (!s) return null;
    if ('choice' in s) return { kind: 'choice', options: s.choice.map((o) => this.fill(o.text)) };
    if ('hero' in s) return { kind: 'line', who: 'hero', text: this.fill(s.hero), face: this.face };
    if ('me' in s) return { kind: 'line', who: 'me', text: this.fill(s.me), face: this.face };
    return { kind: 'line', who: 'narr', text: this.fill(s.narr), face: this.face };
  }

  advance(): void {
    const s = this.queue[0];
    if (!s || 'choice' in s) return;
    this.queue.shift();
    this.settle();
  }

  /** 선택지를 고른다. 호감도 변화량을 돌려준다(선택지가 아니면 0). */
  choose(index: number): number {
    const s = this.queue[0];
    if (!s || !('choice' in s)) return 0;
    const opt = s.choice[index];
    if (!opt) return 0;
    this.queue.shift();
    const before = this.affection;
    this.affection = clamp(this.affection + opt.delta);
    this.queue.unshift(...opt.reply);
    this.settle();
    return this.affection - before;
  }

  /** 맨 앞 걸음의 표정을 반영하고, 본문이 끝났으면 엔딩 갈래를 붙인다. */
  private settle() {
    if (!this.queue.length && !this.endingQueued && (this.episode.happy || this.episode.friend)) {
      this.endingQueued = true;
      this.ending = this.affection >= HAPPY_THRESHOLD ? 'happy' : 'friend';
      this.queue.push(...((this.ending === 'happy' ? this.episode.happy : this.episode.friend) ?? []));
    }
    const s = this.queue[0];
    if (s && 'hero' in s && s.face) {
      this.face = s.face;
      this.faces.add(s.face);
    }
  }

  private fill(text: string): string {
    return text.replaceAll('{place}', this.vars.place).replaceAll('{me}', this.vars.me);
  }
}
