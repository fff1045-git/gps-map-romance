import type { Story } from './types';

/** 한서윤(27, 바리스타). 선택지는 첫 번째가 가장 좋은 답, 마지막이 가장 나쁜 답(화면에서는 섞어 보여 준다). */
export const SEOYUN: Story = [
  {
    title: '처음 보는 단골',
    steps: [
      { narr: '{place}. 문을 열자 갓 볶은 원두 향이 쏟아진다.' },
      { hero: '어서 오세요! 처음 오셨죠? 이 동네 손님 얼굴은 제가 다 외우거든요.', face: 'smile' },
      { hero: '오늘은 원두가 두 가지예요. 산미 있는 에티오피아, 고소한 브라질.', face: 'neutral' },
      {
        choice: [
          {
            text: '추천해 주시는 걸로 마셔 볼게요.',
            delta: 10,
            reply: [
              { hero: '오, 저 믿어 주시는 거예요? 그럼 에티오피아요. 오늘 제일 자신 있거든요.', face: 'smile' },
            ],
          },
          { text: '고소한 쪽이 좋아요.', delta: 5, reply: [{ hero: '브라질이요. 무난하지만 오늘 거 진짜 괜찮아요.' }] },
          { text: '아무거나 빨리 주세요.', delta: -5, reply: [{ hero: '아… 네, 금방 드릴게요.', face: 'neutral' }] },
        ],
      },
      { narr: '잔을 건네는 손목에 작은 화상 자국이 보였다. 오래 일한 사람의 손이다.' },
      { hero: '저는 서윤이에요. 다음에 오시면 이름 불러 드릴게요.', face: 'smile' },
    ],
  },
  {
    title: '비 오는 오후',
    steps: [
      { narr: '{place}. 창밖으로 비가 쏟아진다. 손님은 나 하나뿐이다.' },
      { hero: '또 오셨네요! 비 와서 오늘 장사 공치나 했는데, 다행이다.', face: 'smile' },
      { hero: '…사실 오늘 신메뉴 시험해 보는 날이거든요. 맛 좀 봐 주실래요?', face: 'neutral' },
      {
        choice: [
          { text: '영광이죠. 솔직하게 말할게요.', delta: 10, reply: [{ hero: '솔직한 거 좋아요. 무서운데… 좋아요.', face: 'smile' }] },
          { text: '공짜면 좋죠.', delta: 5, reply: [{ hero: '하하, 네. 대신 평가는 정확하게요.' }] },
          { text: '전 원래 먹던 것만 마셔요.', delta: -5, reply: [{ hero: '아, 그렇구나. 괜히 물어봤네요.' }] },
        ],
      },
      { narr: '흑설탕 시럽에 생강을 살짝 띄운 라테. 따뜻하고, 조금 맵다.' },
      { hero: '어때요? 너무 이상하면 말해 줘요.', face: 'neutral' },
      {
        choice: [
          {
            text: '비 오는 날 생각날 맛이에요.',
            delta: 10,
            reply: [{ hero: '…그 말, 메뉴판에 그대로 써도 돼요?', face: 'shy' }],
          },
          { text: '생강이 조금 강해요.', delta: 5, reply: [{ hero: '역시! 저도 그 생각 했어요. 반으로 줄여 볼게요.' }] },
          { text: '그냥 그래요.', delta: -5, reply: [{ hero: '그냥 그렇구나… 메모해 둘게요.' }] },
        ],
      },
    ],
  },
  {
    title: '셔터를 내린 뒤',
    steps: [
      { narr: '{place} 앞. 마감 시간인데 불이 아직 켜져 있다.' },
      { hero: '어? 오늘은 끝났는데… 아, 그냥 지나가던 길이에요?', face: 'neutral' },
      { hero: '저 혼자 남아서 연습하던 중이었어요. 라테아트 대회가 다음 달이라.', face: 'neutral' },
      {
        choice: [
          { text: '구경해도 돼요? 응원할게요.', delta: 10, reply: [{ hero: '구경꾼 있으면 더 떨리는데… 그래도 좋아요.', face: 'smile' }] },
          { text: '대회도 나가요? 대단하네요.', delta: 5, reply: [{ hero: '대단하긴요. 작년엔 예선 탈락이었어요.' }] },
          { text: '늦었는데 얼른 들어가세요.', delta: -5, reply: [{ hero: '네… 그래야겠죠.' }] },
        ],
      },
      { narr: '우유 거품 위로 백조가 떠올랐다가, 마지막 순간 목이 휘어 버렸다.' },
      { hero: '아, 또 망했다. 늘 마지막에 손이 떨려요.', face: 'neutral' },
      {
        choice: [
          {
            text: '방금 거, 제가 마셔도 돼요?',
            delta: 10,
            reply: [{ hero: '망한 걸요? …진짜 이상한 사람이다.', face: 'shy' }, { narr: '그녀가 웃음을 참으며 잔을 밀어 주었다.' }],
          },
          { text: '그래도 처음보다 많이 늘었을 거예요.', delta: 5, reply: [{ hero: '처음 걸 못 보셨잖아요. 그래도 고마워요.', face: 'smile' }] },
          { text: '그 정도면 그냥 포기하는 게…', delta: -5, reply: [{ hero: '…그럴지도요.' }] },
        ],
      },
    ],
  },
  {
    title: '내 가게의 이름',
    steps: [
      { narr: '{place}. 서윤이 노트를 펼쳐 놓고 펜 끝을 깨물고 있다.' },
      { hero: '아, 왔어요? 마침 잘 왔다. 저 고민 상담 좀 해도 돼요?', face: 'smile' },
      { hero: '내년에 제 가게 내려고 돈 모으는 중이거든요. 근데 이름을 못 정하겠어요.', face: 'neutral' },
      {
        choice: [
          {
            text: '서윤 씨가 제일 좋아하는 순간이 언제예요?',
            delta: 10,
            reply: [
              { hero: '음… 아침에 첫 잔 내릴 때? 가게가 아직 조용할 때요.', face: 'smile' },
              { hero: '"첫 잔". …어, 괜찮은데요?', face: 'smile' },
            ],
          },
          { text: '서윤 이름을 넣는 건 어때요?', delta: 5, reply: [{ hero: '부끄러워서 그건 못 하겠어요.', face: 'shy' }] },
          { text: '이름은 아무래도 상관없지 않아요?', delta: -5, reply: [{ hero: '저한텐 상관있는데…' }] },
        ],
      },
      { hero: '근데 있잖아요. 가게 열면… 그때도 와 줄 거예요?', face: 'shy' },
      {
        choice: [
          { text: '첫 손님 자리는 제가 맡을게요.', delta: 10, reply: [{ hero: '약속했어요. 진짜로 기다릴 거예요.', face: 'shy' }] },
          { text: '가까우면요.', delta: 5, reply: [{ hero: '그럼 이 동네에서 열어야겠네.', face: 'smile' }] },
          { text: '글쎄요, 그때 봐서요.', delta: -5, reply: [{ hero: '…그쵸, 먼 얘기니까.' }] },
        ],
      },
    ],
  },
  {
    title: '첫 잔',
    steps: [
      { narr: '{place}. 이른 아침, 아직 문을 열기 전이다. 서윤이 유리문 너머로 손짓한다.' },
      { hero: '와 줬네요. 오늘 대회 날이라… 가기 전에 한 잔만 내려 주고 싶었어요.', face: 'neutral' },
      { narr: '잔 위에 선명한 백조가 앉아 있다. 목은 휘지 않았다.' },
      { hero: '손 안 떨렸어요. 누가 보고 있다고 생각하니까 오히려 괜찮더라고요.', face: 'smile' },
      { hero: '그래서… 그 누가, 계속 봐 줬으면 좋겠어요.', face: 'shy' },
      {
        choice: [
          {
            text: '나도 계속 보고 싶어요. 서윤 씨를.',
            delta: 10,
            reply: [{ hero: '…방금 그 말, 대회보다 더 떨려요.', face: 'shy' }],
          },
          { text: '대회 끝나고 축하하러 올게요.', delta: 5, reply: [{ hero: '네, 꼭이요.', face: 'smile' }] },
          { text: '커피 맛있네요.', delta: -5, reply: [{ hero: '…네. 다행이에요.' }] },
        ],
      },
    ],
    happy: [
      { hero: '그럼 정해졌다. 제 가게 첫 잔은, 당신 거예요.', face: 'smile' },
      { narr: '서윤이 앞치마 끈을 고쳐 매며 웃었다. 오늘 이 동네에서 가장 먼저 내린 커피가 아직 따뜻하다.' },
      { hero: '다녀올게요. 끝나면 제일 먼저 연락할게요.', face: 'shy' },
    ],
    friend: [
      { hero: '고마워요. 덕분에 여기까지 왔어요. 좋은 단골이 있어서 다행이에요.', face: 'smile' },
      { narr: '서윤은 손을 흔들고 대회장으로 향했다. 다음에 오면 또 이름을 불러 줄 것이다.' },
    ],
  },
];
