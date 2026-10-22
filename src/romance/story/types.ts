import type { Face } from '../heroes';

/**
 * 이야기 한 걸음.
 * - hero: 캐릭터 대사(face를 주면 그 표정으로 바뀌고, 안 주면 앞 표정 유지)
 * - me: 플레이어 대사
 * - narr: 지문
 * - choice: 선택지. 고르면 delta만큼 호감도가 바뀌고 reply가 이어진다.
 * 문자열 안의 {place}는 만난 장소 이름, {me}는 플레이어 호칭으로 바뀐다.
 */
export type Step =
  | { hero: string; face?: Face }
  | { me: string }
  | { narr: string }
  | { choice: readonly ChoiceOption[] };

export interface ChoiceOption {
  text: string;
  /** 호감도 변화(−5..+10 정도). */
  delta: number;
  reply: readonly Step[];
}

export interface Episode {
  title: string;
  steps: readonly Step[];
  /** 마지막 화만: 호감도가 기준 이상이면 happy, 아니면 friend 줄이 이어진다. */
  happy?: readonly Step[];
  friend?: readonly Step[];
}

/** 캐릭터 한 명의 이야기(1화부터 순서대로). */
export type Story = readonly Episode[];
