// LCK-STOVE-1: manually curated snapshot, checked 2026-11-26 KST.
// Factual names/statuses cross-checked from the sources below; no scraped prose or images.
export const LCK_BASE = '/esports/lck/2027';
export const LCK_STOVE_PATH = LCK_BASE + '/stove-league';
export const LCK_CHECKED = '2026-11-26';
export const POSITIONS = ['탑', '정글', '미드', '원딜', '서포터'] as const;
export type Status = 'signed' | 'renewed' | 'contract' | 'pending';
export type ReportLevel = 'reported' | 'rumor';
export interface Report { player: string; level: ReportLevel; url: string }
export interface Slot { player: string | null; status: Status; report?: Report; extra?: string }
export interface Team { slug: string; code: string; name: string; accent: string; slots: Slot[]; note: string; sources?: {label: string; url: string}[] }
export const SOURCES = [
  { label: 'LoL 스토브 · 공식 발표 취합 (11/26 12:12 KST)', url: 'https://lol-stove.ps-esports.kr/lck' },
  { label: 'JJANG.GG · 계약 및 로스터 현황 (11/26 12:41 KST)', url: 'https://jjang.gg/stove-league' },
  { label: 'Sheep Esports · 이적 보도 및 전망', url: 'https://www.sheepesports.com/kr/all/transfers/lck' },
];
const hub = SOURCES[2].url;
const report = (player: string, url = hub): Report => ({ player, level: 'reported', url });
const rumor = (player: string): Report => ({ player, level: 'rumor', url: hub });
const signed = (player: string, extra?: string): Slot => ({ player, status: 'signed', extra });
const renewed = (player: string, extra?: string): Slot => ({ player, status: 'renewed', extra });
const contract = (player: string, extra?: string, report?: Report): Slot => ({ player, status: 'contract', extra, report });
const pending = (report?: Report): Slot => ({ player: null, status: 'pending', report });
export const STATUS_LABEL: Record<Status, string> = { signed: '영입 발표', renewed: '재계약 발표', contract: '계약 유지', pending: '발표 대기' };
export const TEAMS: Team[] = [
  { slug: 't1', code: 'T1', name: 'T1', accent: '#eb5265',
    slots: [signed('Zeus', '2029년까지 계약'), contract('Oner', '2028년까지 계약'), contract('Faker', '2029년까지 계약'), contract('Peyz', '2028년까지 계약'), contract('Keria', '2029년까지 계약')],
    note: '11월 25일 제우스의 복귀가 공식 발표됐습니다. 2029년까지 3년 계약으로 합류해 다섯 포지션의 구성이 확인됐습니다.', sources: [{label:'연합뉴스 · 11/25 제우스 복귀 발표',url:'https://www.yna.co.kr/amp/view/AKR20261125176800017'}] },
  { slug: 'geng', code: 'GEN', name: '젠지', accent: '#c8aa61',
    slots: [signed('Siwoo'), signed('Sharvel'), contract('Chovy', '2027년까지 계약'), contract('Ruler', '2027년까지 계약'), signed('Cloud')],
    note: '11월 24일 듀로와 결별하고 시우·샤벨·클라우드 영입을 공식 발표했습니다. 쵸비와 룰러를 유지해 다섯 포지션이 확인됐습니다.', sources: [{label:'국민일보 · 11/24 젠지 신규 3인 영입',url:'https://www.kmib.co.kr/article/20261124502119'}] },
  { slug: 'hle', code: 'HLE', name: '한화생명e스포츠', accent: '#ff914d',
    slots: [pending(report('Kiin', 'https://www.sheepesports.com/kr/articles/sources-canyon-expected-to-join-hle-for-lck-2027/kr')), signed('Canyon'), contract('Zeka', '2027년까지 계약'), contract('Gumayusi', '2027년까지 계약'), pending(report('Career', 'https://www.sheepesports.com/us/articles/life-and-s0nstar-join-hanwha-life-esports-coaching-staff-for-2027/en'))],
    note: '11월 24일 캐니언 영입이 공식 발표됐습니다. 제카·구마유시와 함께 세 포지션이 확인됐으며 탑·서포터는 공식 발표를 기다립니다.' },
  { slug: 'dk', code: 'DK', name: '디플러스 기아', accent: '#60d4c7',
    slots: [signed('Doran'), signed('Kanavi', 'Lucid도 기존 계약이 남아 있음 · DRX행 보도'), renewed('ShowMaker'), renewed('Smash'), signed('Delight')],
    note: '11월 23일 딜라이트 영입 발표로 다섯 포지션의 구성원이 모두 확인됐습니다. 도란·카나비 영입과 쇼메이커·스매쉬 재계약이 핵심입니다.',
    sources: [{ label: '엑스포츠뉴스 · 11/23 로스터 발표 보도', url: 'https://www.xportsnews.com/article/2222289' }, { label: '인벤 · 11/20 도란·카나비 영입', url: 'https://www.inven.co.kr/webzine/news/?news=323666&site=yugioh' }] },
  { slug: 'kt', code: 'KT', name: 'kt 롤스터', accent: '#f16f75',
    slots: [renewed('PerfecT'), signed('Raptor'), renewed('Bdd'), signed('Taeyoon'), signed('Kellin')],
    note: '11월 25일 태윤 영입 발표로 다섯 포지션의 구성이 확인됐습니다. 퍼펙트·비디디 재계약과 랩터·켈린 영입에 이어 원딜까지 채웠습니다.' },
  { slug: 'ns', code: 'NS', name: '농심 레드포스', accent: '#ef6574',
    slots: [renewed('Kingen'), signed('Pyosik'), renewed('Calix'), signed('Deft'), signed('Andil')],
    note: '킹겐·칼릭스 재계약에 표식·데프트·안딜 영입을 더했습니다. 기존 선수들의 추가 거취와 실제 선발 여부는 별도로 확인해야 합니다.',
    sources: [{ label: 'Sheep Esports · 표식·안딜 영입 발표 보도', url: 'https://www.sheepesports.com/us/articles/andil-and-pyosik-join-nongshimredforce-for-the-2027-lck-season/en' }] },
  { slug: 'bfx', code: 'BFX', name: 'BNK 피어엑스', accent: '#eccb56',
    slots: [signed('Thanatos', '2028년까지 계약'), signed('Vincenzo'), renewed('VicLa'), signed('Noah'), pending()],
    note: '11월 25일 타나토스의 2028년까지 계약이 공식 발표됐습니다. 빈첸조·빅라·노아와 네 포지션이 확인됐으며 서포터는 발표 대기입니다.' },
  { slug: 'dns', code: 'DNS', name: 'DN 수퍼스', accent: '#78a5f4',
    slots: [renewed('DuDu'), signed('Cuzz'), signed('Ucal'), contract('deokdam', '2027년까지 계약'), signed('Bluffing')],
    note: '두두와 덕담을 유지하고 커즈·유칼·블러핑을 영입해 다섯 자리가 확인됐습니다.' },
  { slug: 'bro', code: 'BRO', name: '한진 브리온', accent: '#59c99d',
    slots: [renewed('Casting'), renewed('GIDEON'), renewed('Roamer', 'SeTab도 영입 발표 · 선발 경쟁'), renewed('Teddy'), renewed('Namgung')],
    note: '기존 다섯 선수와 재계약했고 세탭도 영입했습니다. 미드에 복수의 선수가 있어 실제 선발은 대회 로스터를 확인해야 합니다.' },
  { slug: 'krx', code: 'KRX', name: '키움 DRX', accent: '#698ffa',
    slots: [pending(report('Haetae', 'https://www.sheepesports.com/kr/articles/sources-haetae-set-to-join-kiwoom-drx-ahead-of-2027/kr')), pending(report('Lucid', 'https://www.sheepesports.com/kr/articles/sources-haetae-set-to-join-kiwoom-drx-ahead-of-2027/kr')), pending(rumor('Scout')), pending(rumor('Viper')), pending(rumor('Duro'))],
    note: '11월 26일 13:18 KST 확인 기준 다섯 포지션 모두 구단 공식 영입 발표를 확인하지 못했습니다. 보도 및 전망은 확정 명단과 분리합니다.' },
];
export const teamPath = (team: Team) => LCK_BASE + '/' + team.slug;
export const countConfirmed = (team: Team) => team.slots.filter(s => s.player !== null && s.status !== 'pending').length;
export const rosterSummary = () => ({
  teams: TEAMS.length,
  confirmed: TEAMS.reduce((sum, t) => sum + countConfirmed(t), 0),
  total: TEAMS.reduce((sum, t) => sum + t.slots.length, 0),
  complete: TEAMS.filter(t => countConfirmed(t) === POSITIONS.length).length,
});
export function findTeam(path: string): Team | undefined { return TEAMS.find(t => teamPath(t) === path); }
