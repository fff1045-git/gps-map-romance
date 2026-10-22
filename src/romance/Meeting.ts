import './meeting.css';
import { seededRandom } from '../core/random';
import type { Place } from '../game/placement';
import { cameraErrorMessage, readArPref, startCamera, stopCamera, writeArPref } from './camera';
import { FACES, heroImage, PLACE_EMOJI, stageLabel, type Face, type Hero } from './heroes';
import { StoryRunner, type Frame } from './story/engine';
import type { Episode } from './story/types';

/**
 * 비주얼노벨식 만남 화면(전체 화면 오버레이).
 * - 배경: 후면 카메라(AR) 또는 장소 유형별 그림 배경. 카메라가 안 되면 자동으로 그림 배경.
 * - 캐릭터 스탠딩 + 대사창(타자 효과, 탭하면 다음) + 선택지(호감도 변화).
 * 게임 상태는 모른다. 결과만 돌려주고, 저장은 부른 쪽(main)이 한다.
 */

export interface MeetingOptions {
  hero: Hero;
  episode: Episode;
  /** 1부터. */
  episodeNo: number;
  affection: number;
  place: Place;
}

export interface MeetingResult {
  /** 끝까지 봤으면 true. 중간에 나가면 false(저장하지 않는다). */
  completed: boolean;
  affection: number;
  faces: Face[];
  ending?: 'happy' | 'friend';
}

const TYPE_MS = 28;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function runMeeting(opts: MeetingOptions): Promise<MeetingResult> {
  return new Promise((resolve) => new MeetingView(opts, resolve).open());
}

class MeetingView {
  private readonly runner: StoryRunner;
  private readonly startAffection: number;
  private readonly root = el('div', 'mt');
  private readonly video = el('video', 'mt-video');
  private readonly heroImg = el('img', 'mt-hero');
  private readonly choices = el('div', 'mt-choices');
  private readonly box = el('div', 'mt-box');
  private readonly nameTag = el('div', 'mt-name');
  private readonly text = el('p', 'mt-text');
  private readonly next = el('div', 'mt-next', '▼');
  private readonly heart = el('div', 'mt-heart');
  private readonly msg = el('div', 'mt-msg');
  private readonly toggle = el('button', 'mt-btn mt-toggle');

  private arOn = readArPref();
  private stream: MediaStream | null = null;
  private camToken = 0;
  private closed = false;
  private typing: { full: string; timer: ReturnType<typeof setInterval> } | null = null;
  private shownFace: Face | null = null;
  private choiceNo = 0;
  private msgTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly opts: MeetingOptions,
    private readonly done: (r: MeetingResult) => void,
  ) {
    this.startAffection = opts.affection;
    this.runner = new StoryRunner(opts.episode, opts.affection, { place: opts.place.name, me: '당신' });
  }

  open() {
    this.build();
    document.body.appendChild(this.root);
    window.addEventListener('keydown', this.onKey, true);
    void this.setAr(this.arOn, false);
    this.render();
  }

  // ── 화면 구성 ─────────────────────────────
  private build() {
    const { hero, place, episode, episodeNo } = this.opts;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', `${hero.name}와의 만남`);
    this.root.dataset.place = place.kind;
    this.root.style.setProperty('--hero', hero.color);
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');
    this.video.autoplay = true;

    // 표정 그림을 미리 받아 둔다(바뀔 때 깜빡이지 않게).
    for (const f of FACES) new Image().src = heroImage(hero.id, f);
    this.heroImg.alt = hero.name;
    this.heroImg.draggable = false;

    const top = el('header', 'mt-top');
    const leave = el('button', 'mt-btn', '✕ 나가기');
    leave.type = 'button';
    leave.onclick = () => this.leave();
    const title = el('div', 'mt-title');
    title.append(
      el('div', 'mt-place', `${PLACE_EMOJI[place.kind]} ${place.name}`),
      el('div', 'mt-ep', `${episodeNo}화 · ${episode.title}`),
    );
    this.toggle.type = 'button';
    this.toggle.setAttribute('role', 'switch');
    this.toggle.setAttribute('aria-label', '카메라 배경');
    this.toggle.textContent = '📷';
    this.toggle.onclick = () => void this.setAr(!this.arOn, true);
    top.append(leave, title, this.toggle);

    this.box.append(this.nameTag, this.text, this.next);
    this.box.tabIndex = 0;
    this.box.setAttribute('role', 'button');
    this.box.setAttribute('aria-label', '다음 대사');
    this.box.onclick = () => this.tap();
    this.heroImg.onclick = () => this.tap();

    this.root.append(this.video, el('div', 'mt-scenery'), this.heroImg, top, this.heart, this.msg, this.choices, this.box);
  }

  private render() {
    const f = this.runner.current();
    if (!f) return this.finish();
    if (f.kind === 'line') {
      this.choices.replaceChildren();
      this.choices.hidden = true;
      this.box.hidden = false;
      this.showLine(f);
    } else {
      this.showChoices(f.options);
    }
  }

  private showLine(f: Extract<Frame, { kind: 'line' }>) {
    const { hero } = this.opts;
    this.setFace(f.face);
    this.root.dataset.who = f.who;
    this.nameTag.hidden = f.who === 'narr';
    this.nameTag.textContent = f.who === 'hero' ? hero.short : '나';
    this.type(f.text);
  }

  private setFace(face: Face) {
    if (face === this.shownFace) return;
    this.shownFace = face;
    this.heroImg.src = heroImage(this.opts.hero.id, face);
    this.heroImg.dataset.face = face;
  }

  private type(full: string) {
    this.stopTyping();
    this.next.hidden = true;
    let n = 0;
    this.text.textContent = '';
    const timer = setInterval(() => {
      n += 1;
      this.text.textContent = full.slice(0, n);
      if (n >= full.length) this.stopTyping();
    }, TYPE_MS);
    this.typing = { full, timer };
  }

  private stopTyping() {
    if (!this.typing) return;
    clearInterval(this.typing.timer);
    this.text.textContent = this.typing.full;
    this.typing = null;
    this.next.hidden = false;
  }

  /** 대사창 탭: 타자 중이면 줄을 다 보여 주고, 아니면 다음 줄. */
  private tap() {
    if (this.closed || !this.choices.hidden) return;
    if (this.typing) return this.stopTyping();
    this.runner.advance();
    this.render();
  }

  private showChoices(options: readonly string[]) {
    const { hero, episodeNo } = this.opts;
    // 데이터는 첫 번째가 가장 좋은 답이라, 화면에서는 섞어서 보여 준다(같은 화·같은 선택지면 같은 순서).
    const rand = seededRandom(`${hero.id}:${episodeNo}:${this.choiceNo++}`);
    const order = options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    this.choices.replaceChildren(
      ...order.map((idx, k) => {
        const b = el('button', 'mt-choice', options[idx]);
        b.type = 'button';
        b.dataset.key = String(k + 1);
        b.onclick = () => this.pick(idx);
        return b;
      }),
    );
    this.choices.hidden = false;
    (this.choices.firstElementChild as HTMLElement | null)?.focus();
  }

  private pick(index: number) {
    const delta = this.runner.choose(index);
    if (delta !== 0) {
      this.heart.textContent = delta > 0 ? `♥ +${delta}` : `💔 ${delta}`;
      this.heart.dataset.tone = delta > 0 ? 'up' : 'down';
      this.heart.classList.remove('show');
      void this.heart.offsetWidth;
      this.heart.classList.add('show');
    }
    this.render();
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.closed) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.leave();
      return;
    }
    if (!this.choices.hidden) {
      const btn = this.choices.querySelector<HTMLButtonElement>(`[data-key="${e.key}"]`);
      if (btn) {
        e.preventDefault();
        btn.click();
      }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      this.tap();
    }
  };

  // ── 끝 ────────────────────────────────────
  private finish() {
    const { hero } = this.opts;
    const r = this.runner;
    this.box.hidden = true;
    this.choices.hidden = false;
    const card = el('div', 'mt-end');
    const gained = r.affection - this.startAffection;
    const title =
      r.ending === 'happy' ? '💖 해피 엔딩' : r.ending === 'friend' ? '🤝 친구 엔딩' : `${hero.short}와 조금 더 가까워졌다`;
    card.append(
      el('h2', '', title),
      el('p', '', `호감도 ${this.startAffection} → ${r.affection} (${gained >= 0 ? '+' : ''}${gained})`),
      el('p', 'mt-stage', stageLabel(r.affection, r.ending)),
    );
    if (!r.ending) card.append(el('p', 'mt-sub', `${hero.short}는 한 시간쯤 뒤 다른 곳에 나타나요.`));
    else if (r.ending === 'friend') card.append(el('p', 'mt-sub', '호감도 60 이상이면 다른 엔딩이 열려요. 💌 인연 → 진행도 초기화로 다시 할 수 있어요.'));
    const ok = el('button', 'mt-choice', '지도로 돌아가기');
    ok.type = 'button';
    ok.onclick = () => this.close({ completed: true, affection: r.affection, faces: [...r.faces], ending: r.ending });
    card.append(ok);
    this.choices.replaceChildren(card);
    ok.focus();
  }

  private leave() {
    if (this.runner.done) return this.close({ completed: true, affection: this.runner.affection, faces: [...this.runner.faces], ending: this.runner.ending });
    this.close({ completed: false, affection: this.startAffection, faces: [] });
  }

  private close(result: MeetingResult) {
    if (this.closed) return;
    this.closed = true;
    this.stopTyping();
    clearTimeout(this.msgTimer);
    window.removeEventListener('keydown', this.onKey, true);
    stopCamera(this.video, this.stream);
    this.stream = null;
    this.root.remove();
    this.done(result);
  }

  // ── 카메라 배경 ───────────────────────────
  private say(text: string, ms = 2600) {
    this.msg.textContent = text;
    this.msg.hidden = false;
    clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => (this.msg.hidden = true), ms);
  }

  private setBg(on: boolean) {
    this.arOn = on;
    this.root.dataset.ar = on ? 'on' : 'off';
    this.toggle.setAttribute('aria-checked', String(on));
  }

  private async setAr(on: boolean, userAction: boolean) {
    if (userAction) writeArPref(on);
    const token = ++this.camToken;
    this.setBg(on);
    if (!on) {
      stopCamera(this.video, this.stream);
      this.stream = null;
      return;
    }
    try {
      const stream = await startCamera(this.video, () => {
        if (this.stream !== stream || this.closed) return;
        stopCamera(this.video, stream);
        this.stream = null;
        this.setBg(false);
        this.say('카메라가 끊겨 그림 배경으로 바꿨어요');
      });
      if (this.closed || !this.arOn || token !== this.camToken) {
        stopCamera(this.video, stream);
        return;
      }
      this.stream = stream;
    } catch (e) {
      if (this.closed || token !== this.camToken) return;
      // 자동 전환은 이번 만남만. 다음에 권한을 주면 다시 켜지도록 선호값은 그대로 둔다.
      this.setBg(false);
      this.say(cameraErrorMessage(e));
    }
  }
}
