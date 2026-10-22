import type { HeroStatus } from '../game/GameState';
import type { HeroSave } from '../game/storage';
import type { PlaceResult, ScreenPoint } from '../map/MapProvider';
import {
  endingImage,
  EPISODES,
  FACE_LABEL,
  FACES,
  heroImage,
  PLACE_EMOJI,
  stageLabel,
  type Hero,
} from '../romance/heroes';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

export interface BannerAction {
  label: string;
  onClick: () => void;
}

/** 지도 위 DOM UI. 게임 상태를 직접 읽지 않고, main이 넘겨주는 값만 그린다. */
export class Hud {
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    $('#banner-close').addEventListener('click', () => ($('#banner').hidden = true));
    $('#list-btn').addEventListener('click', () => this.toggleSheet('#list', true));
    $('#list-close').addEventListener('click', () => this.toggleSheet('#list', false));
    $('#album-close').addEventListener('click', () => this.toggleSheet('#album', false));
    $('#roadview-close').addEventListener('click', () => this.closeRoadview());
  }

  setSource(text: string, tone: 'ok' | 'warn' | 'error' = 'ok') {
    const el = $('#src-chip');
    el.textContent = text;
    el.dataset.tone = tone;
  }

  setNear(text: string | null, tone: 'hot' | 'warn' | '' = '') {
    const el = $('#near-chip');
    el.hidden = !text;
    el.textContent = text ?? '';
    el.dataset.tone = tone;
  }

  setHint(text: string | null) {
    $('#hint').hidden = !text;
    $('#hint').textContent = text ?? '';
  }

  setFollow(on: boolean) {
    $('#follow-btn').classList.toggle('active', on);
  }

  banner(text: string, tone: 'warn' | 'error', action?: BannerAction) {
    const el = $('#banner');
    el.dataset.tone = tone;
    $('#banner-text').textContent = text;
    const btn = $<HTMLButtonElement>('#banner-action');
    btn.hidden = !action;
    if (action) {
      btn.textContent = action.label;
      btn.onclick = action.onClick;
    }
    el.hidden = false;
  }

  toast(text: string, ms = 2200) {
    const el = $('#toast');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('show');
    void el.offsetWidth; // 애니메이션 재시작
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (el.hidden = true), ms);
  }

  /** 그 자리에서 이모지가 튀어 오르는 효과. */
  pop(emoji: string, at: ScreenPoint) {
    const el = document.createElement('div');
    el.className = 'pop';
    el.textContent = emoji;
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
    $('#fx').appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  /** 인연 목록. rows는 캐릭터마다 진행·지금 상태·플레이어와의 거리. */
  setHeroes(rows: readonly { hero: Hero; save: Readonly<HeroSave>; status: HeroStatus; distanceM?: number }[]) {
    $('#hero-list').replaceChildren(
      ...rows.map(({ hero, save, status, distanceM }) => {
        const li = document.createElement('li');
        li.className = 'hero-card';
        li.style.setProperty('--hero', hero.color);
        const seen = save.episode > 1 || !!save.ending;
        const name = seen ? hero.name : '???';
        const ep = Math.min(save.episode - 1, EPISODES);
        li.innerHTML =
          `<div class="face" style="background-image:url('${heroImage(hero.id, 'neutral')}')${seen ? '' : ';filter:brightness(0) opacity(.5)'}"></div>` +
          `<h3>${name}<small>${hero.age}세 · ${hero.job}</small></h3>` +
          `<div class="stage"><b>${stageLabel(save.affection, save.ending)}</b> · 호감도 ${save.affection} · ${ep}/${EPISODES}화</div>` +
          `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${save.affection}"><i style="width:${save.affection}%"></i></div>` +
          `<div class="row"><span class="where">${whereText(hero, status, distanceM)}</span></div>`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '🖼️ 앨범';
        btn.onclick = () => this.openAlbum(hero, save);
        li.querySelector('.row')!.appendChild(btn);
        return li;
      }),
    );
  }

  private openAlbum(hero: Hero, save: Readonly<HeroSave>) {
    $('#album-title').textContent = `${hero.name} 앨범`;
    const faces = FACES.map((f) => {
      const open = save.faces.includes(f);
      return `<figure>${open ? `<img src="${heroImage(hero.id, f)}" alt="${hero.short} ${FACE_LABEL[f]}">` : '<div class="locked">🔒</div>'}<figcaption>${FACE_LABEL[f]}</figcaption></figure>`;
    });
    const cg =
      save.ending === 'happy'
        ? `<figure class="wide"><img src="${endingImage(hero.id)}" alt="${hero.short} 엔딩"><figcaption>엔딩</figcaption></figure>`
        : `<figure class="wide"><div class="locked">🔒</div><figcaption>${save.ending === 'friend' ? '엔딩 (해피 엔딩에서 열림)' : '엔딩'}</figcaption></figure>`;
    const grid = $('#album-grid');
    grid.innerHTML = faces.join('') + cg;
    grid.querySelectorAll('img').forEach((img) => (img.onclick = () => this.view(img.src)));
    this.toggleSheet('#album', true);
  }

  private view(src: string) {
    const v = document.createElement('div');
    v.className = 'viewer';
    v.innerHTML = `<img src="${src}" alt="">`;
    v.onclick = () => v.remove();
    document.body.appendChild(v);
  }

  onReset(fn: () => void) {
    $('#reset-btn').addEventListener('click', fn);
  }

  onFollow(fn: () => void) {
    $('#follow-btn').addEventListener('click', fn);
  }

  setMode(label: string, fn: () => void) {
    const btn = $('#mode-btn');
    btn.textContent = label;
    btn.onclick = fn;
  }

  enableRoadview(fn: (el: HTMLElement) => Promise<boolean>) {
    const btn = $<HTMLButtonElement>('#roadview-btn');
    btn.hidden = false;
    btn.onclick = async () => {
      const view = $('#roadview-view');
      view.replaceChildren();
      this.toggleSheet('#roadview', true);
      if (!(await fn(view))) {
        this.toggleSheet('#roadview', false);
        this.toast('이 근처(50m)에는 로드뷰 사진이 없어요');
      }
    };
  }

  closeRoadview() {
    this.toggleSheet('#roadview', false);
    $('#roadview-view').replaceChildren();
  }

  /** 장소 검색창. 결과를 고르면 onPick. */
  enableSearch(search: (q: string) => Promise<PlaceResult[]>, onPick: (r: PlaceResult) => void) {
    const form = $<HTMLFormElement>('#search');
    const input = $<HTMLInputElement>('#search-input');
    const list = $('#search-results');
    form.hidden = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      const rows = await search(q).catch(() => []);
      list.hidden = false;
      if (!rows.length) {
        list.innerHTML = '<li class="empty">검색 결과가 없어요</li>';
        return;
      }
      list.replaceChildren(
        ...rows.slice(0, 8).map((r) => {
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = r.name;
          const small = document.createElement('small');
          small.textContent = r.address;
          btn.appendChild(small);
          btn.addEventListener('click', () => {
            list.hidden = true;
            input.blur();
            onPick(r);
          });
          li.appendChild(btn);
          return li;
        }),
      );
    });
    input.addEventListener('input', () => {
      if (!input.value) list.hidden = true;
    });
  }

  hideBanner() {
    $('#banner').hidden = true;
  }

  private toggleSheet(sel: string, open: boolean) {
    $(sel).hidden = !open;
  }
}

function whereText(hero: Hero, s: HeroStatus, distanceM?: number): string {
  switch (s.state) {
    case 'here': {
      const d = distanceM === undefined ? '' : ` · ${distanceM < 1000 ? `${Math.round(distanceM)}m` : `${(distanceM / 1000).toFixed(1)}km`}`;
      return `${PLACE_EMOJI[hero.placeKind]} ${s.place.name}${d}`;
    }
    case 'resting':
      return `💤 다음 만남까지 ${Math.ceil(s.restLeftMs / 60000)}분`;
    case 'done':
      return s.ending === 'happy' ? '💖 해피 엔딩' : '🤝 친구 엔딩';
    default:
      return '📍 위치를 찾는 중';
  }
}
