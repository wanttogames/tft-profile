// LCK-STOVE-1: manually curated snapshot, checked 2026-11-24 KST.
// Factual names/statuses cross-checked from the sources below; no scraped prose or images.
export const LCK_BASE = '/esports/lck/2027';
export const LCK_STOVE_PATH = LCK_BASE + '/stove-league';
export const LCK_CHECKED = '2026-11-24';
export const POSITIONS = ['탑', '정글', '미드', '원딜', '서포터'] as const;
export type Status = 'signed' | 'renewed' | 'contract' | 'pending';
export type ReportLevel = 'reported' | 'rumor';
export interface Report { player: string; level: ReportLevel; url: string }
export interface Slot { player: string | null; status: Status; report?: Report; extra?: string }
export interface Team { slug: string; code: string; name: string; accent: string; slots: Slot[]; note: string; sources?: {label: string; url: string}[] }
export const SOURCES = [
  { label: 'LoL 스토브 · 공식 발표 취합 (11/23 23:12 KST)', url: 'https://lol-stove.ps-esports.kr/lck' },
  { label: 'JJANG.GG · 계약 및 로스터 현황 (11/24)', url: 'https://jjang.gg/stove-league' },
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
    slots: [pending(report('Zeus', 'https://www.sheepesports.com/us/articles/sources-zeus-set-to-return-to-t1-ahead-of-lck-2027/kr')), contract('Oner', '2028년까지 계약'), contract('Faker', '2029년까지 계약'), contract('Peyz', '2028년까지 계약'), contract('Keria', '2029년까지 계약')],
    note: '정글부터 서포터까지 기존 계약이 남아 있습니다. 도란의 DK 합류 이후 탑 자리는 발표 대기이며 제우스 복귀는 보도 단계입니다.' },
  { slug: 'geng', code: 'GEN', name: '젠지', accent: '#c8aa61',
    slots: [pending(report('Siwoo', 'https://www.sheepesports.com/us/articles/siwoo-set-to-join-gen-g-for-lck-2027-season/en')), pending(rumor('Sharvel')), contract('Chovy', '2027년까지 계약'), contract('Ruler', '2027년까지 계약'), contract('Duro', '2027년까지 계약 · 거취 변동 가능', report('Cloud', 'https://www.sheepesports.com/en/articles/sources-cloud-joins-gen-g-in-the-lck/kr'))],
    note: '기인과 캐니언의 이탈 이후 상체 구성이 변경될 전망입니다. 듀로는 계약이 남아 있지만 클라우드 영입 보도가 있어 최종 선발은 별도로 확인해야 합니다.' },
  { slug: 'hle', code: 'HLE', name: '한화생명e스포츠', accent: '#ff914d',
    slots: [pending(report('Kiin', 'https://www.sheepesports.com/kr/articles/sources-canyon-expected-to-join-hle-for-lck-2027/kr')), pending(report('Canyon', 'https://www.sheepesports.com/kr/articles/sources-canyon-expected-to-join-hle-for-lck-2027/kr')), contract('Zeka', '2027년까지 계약'), contract('Gumayusi', '2027년까지 계약'), pending(report('Career', 'https://www.sheepesports.com/us/articles/life-and-s0nstar-join-hanwha-life-esports-coaching-staff-for-2027/en'))],
    note: '제카와 구마유시의 계약은 남아 있습니다. 탑·정글·서포터의 신규 조합은 매체 보도 단계이므로 발표와 구분합니다.' },
  { slug: 'dk', code: 'DK', name: '디플러스 기아', accent: '#60d4c7',
    slots: [signed('Doran'), signed('Kanavi', 'Lucid도 기존 계약이 남아 있음 · DRX행 보도'), renewed('ShowMaker'), renewed('Smash'), signed('Delight')],
    note: '11월 23일 딜라이트 영입 발표로 다섯 포지션의 구성원이 모두 확인됐습니다. 도란·카나비 영입과 쇼메이커·스매쉬 재계약이 핵심입니다.',
    sources: [{ label: '엑스포츠뉴스 · 11/23 로스터 발표 보도', url: 'https://www.xportsnews.com/article/2222289' }, { label: '인벤 · 11/20 도란·카나비 영입', url: 'https://www.inven.co.kr/webzine/news/?news=323666&site=yugioh' }] },
  { slug: 'kt', code: 'KT', name: 'kt 롤스터', accent: '#f16f75',
    slots: [renewed('PerfecT'), signed('Raptor'), renewed('Bdd'), pending(report('Taeyoon')), signed('Kellin')],
    note: '퍼펙트와 비디디의 재계약, 랩터와 켈린 영입으로 네 자리가 확인됐습니다. 원딜은 매체 이적 현황을 참고하되 공식 발표를 기다립니다.' },
  { slug: 'ns', code: 'NS', name: '농심 레드포스', accent: '#ef6574',
    slots: [renewed('Kingen'), signed('Pyosik'), renewed('Calix'), signed('Deft'), signed('Andil')],
    note: '킹겐·칼릭스 재계약에 표식·데프트·안딜 영입을 더했습니다. 기존 선수들의 추가 거취와 실제 선발 여부는 별도로 확인해야 합니다.',
    sources: [{ label: 'Sheep Esports · 표식·안딜 영입 발표 보도', url: 'https://www.sheepesports.com/us/articles/andil-and-pyosik-join-nongshimredforce-for-the-2027-lck-season/en' }] },
  { slug: 'bfx', code: 'BFX', name: 'BNK 피어엑스', accent: '#eccb56',
    slots: [pending(report('Thanatos')), signed('Vincenzo'), renewed('VicLa'), signed('Noah'), pending()],
    note: '빈첸조, 빅라, 노아가 확인됐습니다. 타나토스 합류는 보도 단계이며 서포터는 확인 가능한 발표가 없습니다.' },
  { slug: 'dns', code: 'DNS', name: 'DN 수퍼스', accent: '#78a5f4',
    slots: [renewed('DuDu'), signed('Cuzz'), signed('Ucal'), contract('deokdam', '2027년까지 계약'), signed('Bluffing')],
    note: '두두와 덕담을 유지하고 커즈·유칼·블러핑을 영입해 다섯 자리가 확인됐습니다.' },
  { slug: 'bro', code: 'BRO', name: '한진 브리온', accent: '#59c99d',
    slots: [renewed('Casting'), renewed('GIDEON'), renewed('Roamer', 'SeTab도 영입 발표 · 선발 경쟁'), renewed('Teddy'), renewed('Namgung')],
    note: '기존 다섯 선수와 재계약했고 세탭도 영입했습니다. 미드에 복수의 선수가 있어 실제 선발은 대회 로스터를 확인해야 합니다.' },
  { slug: 'krx', code: 'KRX', name: '키움 DRX', accent: '#698ffa',
    slots: [pending(report('Haetae', 'https://www.sheepesports.com/kr/articles/sources-haetae-set-to-join-kiwoom-drx-ahead-of-2027/kr')), pending(report('Lucid', 'https://www.sheepesports.com/kr/articles/sources-haetae-set-to-join-kiwoom-drx-ahead-of-2027/kr')), pending(rumor('Scout')), pending(rumor('Viper')), pending(rumor('Duro'))],
    note: '다섯 포지션의 공식 확인이 아직 부족합니다. 해태·루시드 이적 보도와 나머지 포지션의 미확정 전망을 구분했습니다.' },
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
