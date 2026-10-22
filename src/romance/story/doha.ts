import type { Story } from './types';

/** 강도하(29, 물리치료사·러닝 크루 리더). 선택지는 첫 번째가 가장 좋은 답, 마지막이 가장 나쁜 답. */
export const DOHA: Story = [
  {
    title: '신발 끈',
    steps: [
      { narr: '{place}. 러닝복 차림의 여자가 내 앞에 멈춰 섰다.' },
      { hero: '저기요, 신발 끈 풀렸어요. 그러다 발목 접질려요. 직업병이라 그냥 못 지나가겠네.', face: 'neutral' },
      {
        choice: [
          { text: '고마워요. 직업이 뭔데요?', delta: 10, reply: [{ hero: '물리치료사요. 발목 접질린 사람 하루에 열 명은 봐요.', face: 'smile' }] },
          { text: '아, 감사합니다.', delta: 5, reply: [{ hero: '이중 매듭 하세요. 안 풀려요.' }] },
          { text: '괜찮아요, 신경 쓰지 마세요.', delta: -5, reply: [{ hero: '…네, 그럼.' }] },
        ],
      },
      { hero: '저 강도하예요. 매주 여기서 러닝 크루 해요. 초보 환영이에요.', face: 'smile' },
    ],
  },
  {
    title: '5킬로미터',
    steps: [
      { narr: '{place}. 크루가 몸을 풀고 있다. 도하가 손을 크게 흔든다.' },
      { hero: '진짜 왔네! 오늘은 5킬로. 첫날이니까 제 옆에서 뛰어요.', face: 'smile' },
      { narr: '3킬로 지점. 숨이 턱까지 차오른다.' },
      { hero: '힘들면 걸어도 돼요. 여기 기록 재는 사람 없어요.', face: 'neutral' },
      {
        choice: [
          { text: '도하 씨 속도 맞춰 볼게요.', delta: 10, reply: [{ hero: '오, 근성 있네. 그럼 호흡은 둘 들이쉬고 둘 내쉬고.', face: 'smile' }] },
          { text: '조금만 걸을게요.', delta: 5, reply: [{ hero: '잘했어요. 걷는 것도 훈련이에요.' }] },
          { text: '그냥 여기서 그만할래요.', delta: -5, reply: [{ hero: '…그래요. 무리하면 안 되죠.' }] },
        ],
      },
      { narr: '결승점. 도하가 이온음료를 던져 준다.' },
      { hero: '첫날 5킬로 완주한 사람 별로 없어요. 다음 주에도 올 거죠?', face: 'smile' },
      {
        choice: [
          { text: '도하 씨가 있으면요.', delta: 10, reply: [{ hero: '어… 그런 말 크루 단톡방에선 하지 마요.', face: 'shy' }] },
          { text: '다리가 버텨 주면요.', delta: 5, reply: [{ hero: '버티게 해 줄게요. 스트레칭 알려 줄게.' }] },
          { text: '생각해 볼게요.', delta: -5, reply: [{ hero: '네, 편할 때 와요.' }] },
        ],
      },
    ],
  },
  {
    title: '리더의 무릎',
    steps: [
      { narr: '{place}. 크루는 이미 출발했는데, 도하가 벤치에 앉아 무릎을 문지르고 있다.' },
      { hero: '아, 들켰다. 별거 아니에요. 그냥 조금 쑤셔서.', face: 'neutral' },
      { hero: '남들 무릎은 잘 고치면서 내 건 맨날 미뤄요. 웃기죠.', face: 'neutral' },
      {
        choice: [
          { text: '오늘은 도하 씨가 쉬어요. 제가 옆에 있을게요.', delta: 10, reply: [{ hero: '…그런 말 들으니까 이상하게 안 아픈 것 같네.', face: 'shy' }] },
          { text: '병원 가 봤어요?', delta: 5, reply: [{ hero: '제가 병원이에요. …다음 주에 갈게요.' }] },
          { text: '리더가 그러면 안 되죠.', delta: -5, reply: [{ hero: '알아요. 그래서 말 안 한 거예요.' }] },
        ],
      },
      { hero: '사실 작년에 마라톤 풀코스 완주 못 했어요. 30킬로에서 무릎이 나가서.', face: 'neutral' },
      {
        choice: [
          {
            text: '다시 도전할 거죠? 그때 결승선에서 기다릴게요.',
            delta: 10,
            reply: [{ hero: '…결승선에 누가 있다고 생각하면 끝까지 갈 수 있을 것 같아요.', face: 'smile' }],
          },
          { text: '30킬로도 엄청난 거예요.', delta: 5, reply: [{ hero: '그렇게 말해 주니 좀 낫네요.', face: 'smile' }] },
          { text: '무리하지 말고 그만두는 것도 방법이죠.', delta: -5, reply: [{ hero: '…그 말은 제가 환자들한테 하는 말인데.' }] },
        ],
      },
    ],
  },
  {
    title: '쉬는 날',
    steps: [
      { narr: '{place}. 러닝복이 아닌 도하는 처음 본다.' },
      { hero: '뭘 그렇게 봐요. 저도 쉬는 날엔 청바지 입어요.', face: 'shy' },
      { hero: '오늘은 안 뛰어요. 그냥 걷기만. 같이 걸을래요?', face: 'smile' },
      {
        choice: [
          { text: '좋아요. 오늘은 제가 코스 정할게요.', delta: 10, reply: [{ hero: '오, 리드당하는 거 처음이다. 기대할게요.', face: 'smile' }] },
          { text: '천천히 걸어요.', delta: 5, reply: [{ hero: '그래요, 오늘은 기록 없이.' }] },
          { text: '걷는 건 좀 심심한데요.', delta: -5, reply: [{ hero: '…그럼 다음에 뛸 때 봐요.' }] },
        ],
      },
      { narr: '해가 기울 무렵, 도하가 걸음을 멈췄다.' },
      { hero: '크루 사람들은 저를 리더로만 봐요. 근데 당신은 그냥 저를 보는 것 같아요.', face: 'shy' },
      {
        choice: [
          { text: '맞아요. 그냥 도하 씨가 좋아서 보는 거예요.', delta: 10, reply: [{ hero: '…진짜, 심장 박동 수 지금 재면 안 돼요.', face: 'shy' }] },
          { text: '리더 아닌 도하 씨도 멋있어요.', delta: 5, reply: [{ hero: '그 말 오래 기억할게요.', face: 'smile' }] },
          { text: '리더 일이 힘들긴 하겠네요.', delta: -5, reply: [{ hero: '…네. 뭐, 그렇죠.' }] },
        ],
      },
    ],
  },
  {
    title: '결승선',
    steps: [
      { narr: '{place}. 마라톤 대회 날 아침. 도하가 번호표를 달고 있다.' },
      { hero: '진짜 왔네. 무릎은 다 나았어요. 이번엔 끝까지 갈 거예요.', face: 'smile' },
      { hero: '근데 부탁 하나 해도 돼요? 결승선에… 서 있어 줄래요?', face: 'shy' },
      {
        choice: [
          {
            text: '거기서 기다릴게요. 들어오면 할 말도 있어요.',
            delta: 10,
            reply: [{ hero: '할 말? …그거 들으려면 무조건 완주해야겠네.', face: 'shy' }],
          },
          { text: '물이랑 수건 들고 있을게요.', delta: 5, reply: [{ hero: '역시 크루원이다.', face: 'smile' }] },
          { text: '사람 많으면 못 찾을 수도 있어요.', delta: -5, reply: [{ hero: '…그래도 찾아볼게요.' }] },
        ],
      },
    ],
    happy: [
      { narr: '4시간 12분. 결승선을 넘은 도하가 곧장 내게 달려왔다.' },
      { hero: '완주했어요! 이제 할 말 해요. …아니, 내가 먼저 할래요. 좋아해요.', face: 'shy' },
      { hero: '앞으로 쉬는 날은 전부 당신이랑 걸을 거예요. 거절은 안 받아요.', face: 'smile' },
    ],
    friend: [
      { narr: '4시간 12분. 결승선을 넘은 도하가 크루와 얼싸안았다.' },
      { hero: '봤어요? 완주했어요! 당신도 이제 우리 크루 정식 멤버예요.', face: 'smile' },
    ],
  },
];
