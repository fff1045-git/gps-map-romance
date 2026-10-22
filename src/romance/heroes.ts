/** 공략 캐릭터 정의. 모두 성인이다. 이야기는 story/<id>.ts. */

export type Face = 'neutral' | 'smile' | 'shy';
export const FACES: readonly Face[] = ['neutral', 'smile', 'shy'];
export const FACE_LABEL: Record<Face, string> = { neutral: '기본', smile: '웃음', shy: '부끄러움' };

/** 캐릭터가 나타나는 장소 유형. */
export type PlaceKind = 'cafe' | 'campus' | 'park';

/** 카카오 장소 검색 조건 하나. category는 카카오 카테고리 코드(CE7 카페 등). */
export type PlaceQuery = { category: string } | { keyword: string };

export const PLACE_QUERIES: Record<PlaceKind, readonly PlaceQuery[]> = {
  cafe: [{ category: 'CE7' }],
  campus: [{ keyword: '대학교' }, { keyword: '도서관' }, { category: 'CT1' }],
  park: [{ keyword: '공원' }, { category: 'AT4' }],
};

/** 장소 검색이 안 될 때 가상 지점에 붙이는 이름. */
export const VIRTUAL_PLACE_NAME: Record<PlaceKind, string> = {
  cafe: '골목 카페',
  campus: '동네 도서관',
  park: '작은 공원',
};

export const PLACE_EMOJI: Record<PlaceKind, string> = { cafe: '☕', campus: '📚', park: '🌳' };

export interface Hero {
  id: string;
  name: string;
  /** 성 빼고 부르는 이름(대사창·토스트). */
  short: string;
  age: number;
  job: string;
  intro: string;
  placeKind: PlaceKind;
  /** 이름표·호감도 바 색. */
  color: string;
}

export const HEROES: readonly Hero[] = [
  {
    id: 'seoyun',
    name: '한서윤',
    short: '서윤',
    age: 27,
    job: '동네 카페 바리스타',
    intro: '손님 얼굴과 주문을 다 외우는 바리스타. 언젠가 자기 가게를 여는 게 꿈이다.',
    placeKind: 'cafe',
    color: '#c98b5a',
  },
  {
    id: 'chaea',
    name: '윤채아',
    short: '채아',
    age: 25,
    job: '천문학 대학원생',
    intro: '논문 마감과 별 보기 사이를 오가는 대학원생. 말이 빠르고 호기심이 많다.',
    placeKind: 'campus',
    color: '#6c8cff',
  },
  {
    id: 'doha',
    name: '강도하',
    short: '도하',
    age: 29,
    job: '물리치료사 · 러닝 크루 리더',
    intro: '새벽마다 공원을 달리는 러닝 크루 리더. 털털하지만 남 챙기는 데는 누구보다 빠르다.',
    placeKind: 'park',
    color: '#3fbf8f',
  },
];

export function heroById(id: string): Hero | undefined {
  return HEROES.find((h) => h.id === id);
}

export function heroImage(id: string, face: Face): string {
  return `${import.meta.env.BASE_URL}characters/${id}_${face}.png`;
}

export function endingImage(id: string): string {
  return `${import.meta.env.BASE_URL}characters/${id}_ending.jpg`;
}

/** 호감도 단계. 하한 오름차순. 연인은 해피 엔딩을 본 뒤에만. */
export const STAGES = [
  { min: 0, label: '낯선 사이' },
  { min: 15, label: '아는 사이' },
  { min: 35, label: '친구' },
  { min: 60, label: '설렘' },
] as const;

export const HAPPY_THRESHOLD = 60;
export const EPISODES = 5;

export function stageLabel(affection: number, ending?: 'happy' | 'friend'): string {
  if (ending === 'happy') return '연인';
  if (ending === 'friend') return '좋은 친구';
  let label: string = STAGES[0].label;
  for (const s of STAGES) if (affection >= s.min) label = s.label;
  return label;
}

/** 이름 뒤 조사. josa('서윤', '을/를') → '서윤을', josa('채아', '을/를') → '채아를'. 받침 있는 쪽이 앞. */
export function josa(word: string, pair: '을/를' | '이/가' | '은/는' | '과/와'): string {
  const [withFinal, without] = pair.split('/');
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasFinal ? withFinal : without);
}
