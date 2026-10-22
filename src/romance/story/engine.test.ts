import { describe, expect, it } from 'vitest';
import { StoryRunner } from './engine';
import type { Episode } from './types';
import { STORIES } from './index';
import { EPISODES, HAPPY_THRESHOLD, HEROES } from '../heroes';

const vars = { place: '테스트 카페', me: '손님' };

const ep: Episode = {
  title: '시험',
  steps: [
    { narr: '{place}에 들어섰다.' },
    { hero: '어서 오세요.', face: 'smile' },
    {
      choice: [
        { text: '좋아', delta: 10, reply: [{ hero: '다행이다.', face: 'shy' }] },
        { text: '별로', delta: -5, reply: [{ hero: '그래요?' }] },
      ],
    },
    { me: '또 올게요.' },
  ],
};

const finale: Episode = {
  title: '끝',
  steps: [{ choice: [{ text: '고백', delta: 10, reply: [] }, { text: '침묵', delta: 0, reply: [] }] }],
  happy: [{ hero: '저도요.', face: 'shy' }],
  friend: [{ hero: '앞으로도 친구로 지내요.', face: 'smile' }],
};

function drive(r: StoryRunner, pick: number) {
  for (let i = 0; i < 100 && !r.done; i++) {
    const f = r.current()!;
    if (f.kind === 'choice') r.choose(pick);
    else r.advance();
  }
}

describe('StoryRunner', () => {
  it('대사를 차례로 보여 주고 {place}를 바꾼다', () => {
    const r = new StoryRunner(ep, 0, vars);
    expect(r.current()).toEqual({ kind: 'line', who: 'narr', text: '테스트 카페에 들어섰다.', face: 'neutral' });
    r.advance();
    expect(r.current()).toMatchObject({ who: 'hero', face: 'smile' });
    r.advance();
    expect(r.current()).toEqual({ kind: 'choice', options: ['좋아', '별로'] });
  });

  it('선택지가 호감도를 바꾸고 답이 이어진다', () => {
    const r = new StoryRunner(ep, 20, vars);
    r.advance();
    r.advance();
    expect(r.choose(0)).toBe(10);
    expect(r.affection).toBe(30);
    expect(r.current()).toMatchObject({ who: 'hero', text: '다행이다.', face: 'shy' });
    r.advance();
    expect(r.current()).toMatchObject({ who: 'me', face: 'shy' }); // 표정은 유지
    r.advance();
    expect(r.done).toBe(true);
    expect([...r.faces].sort()).toEqual(['neutral', 'shy', 'smile']);
    expect(r.ending).toBeUndefined();
  });

  it('대사 중에는 choose가, 선택지에서는 advance가 무시된다', () => {
    const r = new StoryRunner(ep, 0, vars);
    expect(r.choose(0)).toBe(0);
    r.advance();
    r.advance();
    r.advance();
    expect(r.current()?.kind).toBe('choice');
  });

  it('호감도는 0..100에 머문다', () => {
    const a = new StoryRunner(ep, 98, vars);
    a.advance();
    a.advance();
    expect(a.choose(0)).toBe(2);
    expect(a.affection).toBe(100);
    const b = new StoryRunner(ep, 3, vars);
    b.advance();
    b.advance();
    b.choose(1);
    expect(b.affection).toBe(0);
  });

  it('마지막 화는 기준 이상이면 해피, 아니면 친구 엔딩', () => {
    const happy = new StoryRunner(finale, HAPPY_THRESHOLD - 10, vars);
    happy.choose(0);
    expect(happy.ending).toBe('happy');
    expect(happy.current()).toMatchObject({ text: '저도요.' });
    drive(happy, 0);
    expect(happy.done).toBe(true);

    const friend = new StoryRunner(finale, HAPPY_THRESHOLD - 10, vars);
    friend.choose(1);
    expect(friend.ending).toBe('friend');
    expect(friend.current()).toMatchObject({ text: '앞으로도 친구로 지내요.' });
  });
});

describe('이야기 데이터', () => {
  it.each(HEROES.map((h) => h.id))('%s: 5화가 있고 끝까지 진행된다', (id) => {
    const story = STORIES[id];
    expect(story).toHaveLength(EPISODES);
    expect(story[EPISODES - 1].happy?.length).toBeGreaterThan(0);
    expect(story[EPISODES - 1].friend?.length).toBeGreaterThan(0);
    for (const e of story.slice(0, -1)) expect(e.happy ?? e.friend).toBeUndefined();
  });

  it.each(HEROES.map((h) => h.id))('%s: 좋은 선택만 하면 해피, 나쁜 선택만 하면 친구 엔딩', (id) => {
    const story = STORIES[id];
    const play = (pick: (n: number) => number) => {
      let aff = 0;
      let last: StoryRunner | null = null;
      for (const e of story) {
        const r = new StoryRunner(e, aff, vars);
        for (let i = 0; i < 200 && !r.done; i++) {
          const f = r.current()!;
          if (f.kind === 'choice') r.choose(pick(f.options.length));
          else r.advance();
        }
        expect(r.done).toBe(true);
        aff = r.affection;
        last = r;
      }
      return last!;
    };
    // 데이터 규칙: 각 선택지의 첫 번째가 가장 좋은 답, 마지막이 가장 나쁜 답.
    expect(play(() => 0).ending).toBe('happy');
    expect(play((n) => n - 1).ending).toBe('friend');
  });

  it.each(HEROES.map((h) => h.id))('%s: 세 표정을 모두 쓴다', (id) => {
    const faces = new Set<string>();
    const walk = (steps: readonly import('./types').Step[]) => {
      for (const s of steps) {
        if ('hero' in s && s.face) faces.add(s.face);
        if ('choice' in s) for (const o of s.choice) walk(o.reply);
      }
    };
    for (const e of STORIES[id]) {
      walk(e.steps);
      walk(e.happy ?? []);
      walk(e.friend ?? []);
    }
    expect([...faces].sort()).toEqual(['neutral', 'shy', 'smile']);
  });
});
