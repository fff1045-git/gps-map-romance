export const SAVE_VERSION = 1;

/** 캐릭터 한 명의 진행. */
export interface HeroSave {
  /** 다음에 볼 화(1부터). 엔딩을 보면 마지막 화 + 1. */
  episode: number;
  affection: number;
  /** 마지막으로 만난(한 화를 끝낸) 시각(ms epoch). 이때부터 쉬는 시간. */
  lastMetAt?: number;
  /** 마지막으로 만난 장소 id. 다음엔 다른 곳에 나타난다. */
  lastPlaceId?: string;
  ending?: 'happy' | 'friend';
  /** 앨범에 열린 표정. */
  faces: string[];
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  heroes: Record<string, HeroSave>;
  /** 마지막으로 알던 위치. GPS를 못 받을 때 지도 시작점으로 쓴다. */
  lastKnown?: { lat: number; lng: number; at: number };
}

export function emptySave(): SaveData {
  return { version: SAVE_VERSION, heroes: {} };
}

export function newHeroSave(): HeroSave {
  return { episode: 1, affection: 0, faces: [] };
}

/** 저장소 추상화. 지금은 localStorage. */
export interface SaveStore {
  load(): SaveData | null;
  save(data: SaveData): void;
  clear(): void;
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export class LocalStorageStore implements SaveStore {
  constructor(
    private readonly key = 'gps-romance/save',
    private readonly storage: KeyValueStorage | undefined = globalThis.localStorage,
  ) {}

  load(): SaveData | null {
    try {
      const raw = this.storage?.getItem(this.key);
      if (!raw) return null;
      const data = JSON.parse(raw) as Partial<SaveData>;
      if (data.version !== SAVE_VERSION) return null;
      const out = { ...emptySave(), ...data } as SaveData;
      if (!out.heroes || typeof out.heroes !== 'object') out.heroes = {};
      for (const h of Object.values(out.heroes)) if (!Array.isArray(h.faces)) h.faces = [];
      return out;
    } catch {
      // 사생활 보호 모드, 손상된 JSON 등 → 새 게임으로 시작
      return null;
    }
  }

  save(data: SaveData): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(data));
    } catch {
      // 용량 초과·차단 시 저장만 건너뛴다. 게임은 계속.
    }
  }

  clear(): void {
    try {
      this.storage?.removeItem(this.key);
    } catch {
      /* 무시 */
    }
  }
}

export class MemoryStore implements SaveStore {
  private data: SaveData | null = null;
  load() {
    return this.data ? structuredClone(this.data) : null;
  }
  save(data: SaveData) {
    this.data = structuredClone(data);
  }
  clear() {
    this.data = null;
  }
}
