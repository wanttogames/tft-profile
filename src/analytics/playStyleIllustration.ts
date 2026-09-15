import type { StyleKey } from './playStyleClassifier';
export interface StyleIllustration {
  illustrationTheme: string;
  visualKeywords: string[];
  backgroundMood: string;
  accentStyle: string;
  emblemStyle: string;
  shortFlavorText: string;
  color: string;
  secondary: string;
  backdrop: string;
  emblemPath: string;
  pattern: 'rays' | 'orbits' | 'steps';
}
const shield = 'M300 63 L339 80 L333 126 L300 154 L267 126 L261 80Z';
const star =
  'M300 56 L312 89 L348 89 L319 110 L330 145 L300 124 L270 145 L281 110 L252 89 L288 89Z';
const hex =
  'M300 61 L338 83 L338 127 L300 149 L262 127 L262 83Z M300 80 L322 94 L322 118 L300 131 L278 118 L278 94Z';
const blade =
  'M300 51 L312 78 L305 119 L326 126 L322 136 L305 130 L305 151 L295 151 L295 130 L278 136 L274 126 L295 119 L288 78Z';
const crown = 'M256 82 L280 105 L300 66 L320 105 L344 82 L334 139 L266 139Z M272 149 L328 149';
const crystal =
  'M300 53 L331 83 L324 128 L300 153 L276 128 L269 83Z M269 83 L331 83 M300 53 L287 83 L300 153 L313 83Z';
const book =
  'M300 83 Q278 62 256 79 L256 134 Q278 120 300 142 Q322 120 344 134 L344 79 Q322 62 300 83Z M300 83 L300 142';
const flame =
  'M300 53 Q340 90 318 97 Q349 126 319 144 Q271 166 267 127 Q262 100 286 82 Q280 108 300 113 Q319 99 300 53Z';
const compass =
  'M300 52 L314 94 L350 106 L314 118 L300 160 L286 118 L250 106 L286 94Z M300 88 L317 106 L300 124 L283 106Z';
const flask =
  'M285 57 L315 57 L315 67 L310 67 L310 95 L339 134 Q344 151 326 151 L274 151 Q256 151 261 134 L290 95 L290 67 L285 67Z M271 123 L329 123';
const ring =
  'M300 57 A48 48 0 1 1 299.9 57 M300 77 A28 28 0 1 0 300.1 77 M255 105 L345 105 M300 60 L300 150';
const fortress =
  'M263 148 L263 84 L280 84 L280 68 L293 68 L293 84 L307 84 L307 68 L320 68 L320 84 L337 84 L337 148 L310 148 L310 124 L290 124 L290 148Z';
function art(
  theme: string,
  keywords: string[],
  mood: string,
  accent: string,
  emblem: string,
  flavor: string,
  color: string,
  secondary: string,
  backdrop: string,
  emblemPath: string,
  pattern: StyleIllustration['pattern'],
): StyleIllustration {
  return {
    illustrationTheme: theme,
    visualKeywords: keywords,
    backgroundMood: mood,
    accentStyle: accent,
    emblemStyle: emblem,
    shortFlavorText: flavor,
    color,
    secondary,
    backdrop,
    emblemPath,
    pattern,
  };
}
export const STYLE_ILLUSTRATIONS: Record<StyleKey, StyleIllustration> = {
  'steady-guardian': art(
    '별빛 방패의 수호자',
    ['celestial guardian', 'balanced shield', 'silver citadel'],
    '고요한 남색 성채',
    '네이비·실버·샴페인 골드',
    '균형 방패',
    '흔들림 적은 기록이 쌓여 하나의 방패가 된다.',
    '#cddff5',
    '#c7ad76',
    '#152237',
    shield,
    'steps',
  ),
  'peak-mage': art(
    '폭발하는 별의 마도사',
    ['volatile arcane mage', 'crimson energy', 'fractured star'],
    '보랏빛 에너지 균열',
    '바이올렛·크림슨',
    '불꽃 별',
    '높은 봉우리와 깊은 골이 함께 새겨진 기록.',
    '#d8a2ff',
    '#ef789a',
    '#291a39',
    flame,
    'rays',
  ),
  'flexible-strategist': art(
    '별자리 지도의 전략가',
    ['arcane tactician', 'floating chess pieces', 'strategic aura'],
    '푸른 마법 기록 보관소',
    '블루·정제된 골드',
    '다층 육각 문장',
    '서로 다른 보드에서 자신의 길을 찾는다.',
    '#9dceff',
    '#ddc286',
    '#13263b',
    hex,
    'orbits',
  ),
  'dedicated-master': art(
    '한 자루를 연마하는 장인',
    ['master artisan', 'tempered blade', 'quiet forge'],
    '오래된 청동빛 공방',
    '앰버·브론즈',
    '연마된 검',
    '반복된 선택 위에 자신만의 흔적을 남긴다.',
    '#edbf7b',
    '#b88366',
    '#2a221c',
    blade,
    'steps',
  ),
  'late-commander': art(
    '황혼 성채의 지휘관',
    ['ancient commander', 'twilight tower', 'heavy gold'],
    '황혼의 높은 성채',
    '다크 골드·차콜',
    '성채 문장',
    '높은 레벨의 최종 보드가 기록을 채운다.',
    '#d9c38e',
    '#9391ba',
    '#242333',
    fortress,
    'steps',
  ),
  'artifact-artisan': art(
    '빛을 다듬는 아티팩트 장인',
    ['refined artifact', 'crystal workshop', 'precision'],
    '정제된 수정 작업실',
    '청록·아이보리',
    '다면 수정',
    '별과 장비가 정돈된 보드에 모인다.',
    '#a4edda',
    '#d5d0fa',
    '#142e30',
    crystal,
    'orbits',
  ),
  'resilient-warden': art(
    '안개를 견디는 파수꾼',
    ['mist warden', 'layered barrier', 'stone refuge'],
    '안개 낀 돌의 피난처',
    '세이지·스틸',
    '겹겹의 성벽',
    '깊은 저점을 줄이며 기록을 이어 간다.',
    '#b1d6c8',
    '#8bafc6',
    '#192a2c',
    shield,
    'orbits',
  ),
  'bold-adventurer': art(
    '갈림길의 모험가',
    ['wandering adventurer', 'fractured compass', 'storm horizon'],
    '폭풍과 노을의 경계',
    '코랄·인디고',
    '갈림길 나침반',
    '다양한 등수가 모여 굴곡 있는 여정을 이룬다.',
    '#f1b195',
    '#a4a3e5',
    '#2d2334',
    compass,
    'rays',
  ),
  'crown-seeker': art(
    '별의 왕관을 쫓는 기사',
    ['celestial crown', 'champion silhouette', 'dawn'],
    '동이 트는 왕관의 전당',
    '골드·화이트',
    '별의 왕관',
    '기록 속 첫 번째 자리에 자주 이름을 남긴다.',
    '#ffe1a1',
    '#d2ddee',
    '#2f2930',
    crown,
    'rays',
  ),
  'synergy-specialist': art(
    '원소 문양의 연구자',
    ['elemental scholar', 'rune circle', 'specialist'],
    '원소의 룬 서고',
    '에메랄드·골드',
    '원소 고리',
    '익숙한 특성을 중심으로 보드를 엮는다.',
    '#98dfbc',
    '#d8c187',
    '#162b28',
    ring,
    'orbits',
  ),
  'carry-specialist': art(
    '하나의 별을 지키는 조율사',
    ['focal star', 'protective conductor', 'resonance'],
    '한 별을 비추는 푸른 무대',
    '사파이어·실버',
    '중심별 문장',
    '익숙한 장착 유닛을 중심에 둔다.',
    '#afc6ff',
    '#d3b5e3',
    '#1c2340',
    star,
    'rays',
  ),
  'deck-explorer': art(
    '가능성을 담는 연금술사',
    ['alchemist explorer', 'floating vials', 'uncharted map'],
    '빛나는 연금술 정원',
    '민트·라일락',
    '탐험의 유리병',
    '서로 다른 조합이 기록의 지도를 넓힌다.',
    '#a6edcd',
    '#c2a5ef',
    '#1c2b30',
    flask,
    'orbits',
  ),
  balanced: art(
    '기록을 읽는 여행자',
    ['quiet traveler', 'open journal', 'constellations'],
    '차분한 별의 도서관',
    '슬레이트·실버',
    '열린 기록장',
    '하나의 이름으로 담기 어려운 플레이의 기록.',
    '#b7cee6',
    '#b2a7ce',
    '#1b2635',
    book,
    'steps',
  ),
  insufficient: art(
    '아직 펼쳐지지 않은 기록',
    ['unwritten journal', 'soft starlight', 'quiet archive'],
    '희미한 별빛의 서고',
    '중립 그레이·블루',
    '빈 기록장',
    '더 많은 경기 기록이 모이면 성향을 살펴봅니다.',
    '#b3bfd2',
    '#8d9cb4',
    '#1b2330',
    book,
    'steps',
  ),
};
export const playStyleIllustration = (key: StyleKey): StyleIllustration =>
  STYLE_ILLUSTRATIONS[key] ?? STYLE_ILLUSTRATIONS.balanced;
