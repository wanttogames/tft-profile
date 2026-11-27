import { TREND_PATH, HISTORY_PATH, TREND_PAGES } from '../meta/trends';
import { TIER_LIST_PATH, TIER_PAGES } from '../meta/tierPages';
import { LCK_INTERNATIONAL_PATH } from '../data/lckInternational';
import { resultsPages } from '../data/lckResults';
import { historyPages } from '../data/lckHistory';
import { LCK_DREAM_PATH } from '../data/lckDream';
import { LCK_FA_PATH, LCK_CONTRACTS_PATH } from '../data/lckContracts';
import { LCK_COMPARE_PATH, LCK_TIMELINE_PATH } from '../data/lckChanges';
import { LCK_STOVE_PATH, TEAMS, teamPath } from '../data/lck2027';
export const SITE_URL = 'https://tft-profile.pages.dev';
export const PUBLIC_PAGES = {
  [TIER_LIST_PATH]: {
    title: 'TFT 티어리스트 - 최신 롤토체스 챔피언·아이템·특성 메타 | TFT Profile',
    description: '롤토체스 최근 7일 랭크 집계와 표본 보정을 바탕으로 챔피언, 아이템, 특성의 S~D 티어를 확인하세요.',
  },
  ...Object.fromEntries(Object.values(TIER_PAGES).map(({ name, path }) => [path, {
    title: `롤토체스 ${name} 티어리스트 - TFT 최신 패치 메타 | TFT Profile`,
    description: `롤토체스 ${name}의 평균 등수, TOP4 비율, 1위율과 표본 신뢰도를 반영한 최근 7일 티어리스트입니다.`,
  }])),
  [TREND_PATH]: { title: '롤토체스 패치별 메타 변화 - 챔피언·아이템·특성 | TFT Profile', description: 'TFT 패치별 성적과 사용률을 동일 세트의 최근 7일 관측 집계로 비교하세요.' },
  [HISTORY_PATH]: { title: 'TFT 패치별 통계 이력 | TFT Profile', description: '롤토체스 패치의 일별 관측 및 종료 직전 관측, 표본 수와 패치 확인 방식을 확인하세요.' },
  ...Object.fromEntries(Object.values(TREND_PAGES).map(({label,path})=>[path,{
    title: `롤토체스 패치별 ${label} 메타 변화 | TFT Profile`,
    description: `동일 세트에서 ${label} 평균 등수, TOP4, 사용률과 상대 티어 변화를 비교하세요.`,
  }])),
  ...historyPages(),
  ...resultsPages(),
  [LCK_INTERNATIONAL_PATH]: {
    title: 'LCK 국제대회 명예의 전당 - First Stand·MSI·월즈 우승팀과 준우승팀 | TFT Profile',
    description: '2015년 이후 First Stand, MSI, 롤드컵에서 우승하거나 준우승한 LCK 팀과 해당 시즌 로스터를 확인하세요.',
  },
  [LCK_DREAM_PATH]: {title:'LCK 드림팀 만들기 - 2027 롤 선수 조합·로스터 공유 카드 | TFT Profile',description:'나만의 LCK 드림팀을 만드세요. 탑·정글·미드·원딜·서포터 선수 선택, 랜덤 조합, 카드 테마, PNG 이미지 저장 및 공유 링크를 제공합니다.'},
  [LCK_FA_PATH]: {title:'2027 LCK FA 선수 명단 - 계약 종료·미확정 이적 현황 | TFT Profile',description:'LCK 스토브리그 FA 시장의 계약 종료 선수와 거취 확인 대기 선수를 팀, 포지션, 이름으로 검색하고 공식 발표와 미확정 이적 보도를 구분하세요.'},
  [LCK_CONTRACTS_PATH]: {title:'LCK 선수 계약 만료일 - 2027·2028·2029 페이커·쵸비·팀별 계약 기간 | TFT Profile',description:'LCK 선수의 GCD 계약 만료일, 공개된 계약 연도와 시즌 정보를 검색하세요. T1, 젠지 등 팀별 선수의 계약 기간과 미확인 정보를 확인할 수 있습니다.'},
  [LCK_COMPARE_PATH]: { title: '2026 vs 2027 LCK 로스터 비교 - 팀별 선수 교체·잔류 | TFT Profile', description: 'LCK 10개 팀의 2026 마지막 경기와 2027 발표 로스터를 비교합니다. 탑·정글·미드·원딜·서포터의 유지, 신규 구성, 발표 대기를 확인하세요.' },
  [LCK_TIMELINE_PATH]: { title: '2027 LCK 스토브리그 이적 타임라인 - 영입·재계약·계약 종료 | TFT Profile', description: '2027 LCK 스토브리그의 날짜별 1군 선수 영입, 재계약과 계약 종료 발표를 팀과 선수별로 검색하고 출처를 확인하세요.' },
  [LCK_STOVE_PATH]: {
    title: '2027 LCK 스토브리그 - 팀별 로스터·이적 현황 | TFT Profile',
    description: '2027 LCK 10개 팀의 탑·정글·미드·원딜·서포터 로스터를 비교하고 공식 영입, 재계약, 계약 유지와 미확정 보도를 구분해 확인하세요.',
  },
  ...Object.fromEntries(TEAMS.map(team => [teamPath(team), {
    title: '2027 ' + team.name + ' 로스터 - LCK 스토브리그 이적 현황 | TFT Profile',
    description: '2027 ' + team.name + ' (' + team.code + ') 포지션별 로스터, 영입·재계약·계약 유지 및 미확정 보도. ' + team.note,
  }])),
  '/': {
    title: 'TFT Profile - 롤토체스 전적·메타·계산기 | LCK 스토브리그·역사',
    description:
      '롤토체스 전적 분석, 메타 통계, 리롤·아이템·골드 계산기와 시즌 정보. LCK 스토브리그 이적 현황, 역대 로스터와 우승팀 기록을 한곳에서 확인하세요.',
  },
  '/guide': {
    title: 'TFT Profile 사용 가이드 - 롤토체스 전적 분석 지표 설명',
    description:
      'Riot ID 검색 방법부터 평균 등수, 최근 폼, 선호 아이템과 플레이 스타일까지 실제 분석 지표를 읽는 방법을 설명합니다.',
  },
  '/meta': {
    title: 'TFT 메타 통계 - KR Challenger / Grandmaster 분석',
    description:
      'KR Challenger와 Grandmaster 래더에서 수집한 경기의 챔피언, 아이템, 활성 특성 통계와 표본 수를 비교합니다.',
  },
  '/champions': {
    title: 'TFT 챔피언 통계 - 사용 표본과 TOP4 비율',
    description:
      '수집된 최종 보드의 챔피언 표본, 평균 등수, TOP4 비율, 1위율과 자주 장착한 아이템을 비교하세요.',
  },
  '/items': {
    title: 'TFT 아이템 통계 - 평균 등수와 주요 장착 챔피언',
    description:
      '한 참가자의 중복 장착을 보정한 아이템별 표본, 평균 등수, TOP4 비율과 주요 챔피언 통계입니다.',
  },
  '/traits': {
    title: 'TFT 특성 통계 - 활성 시너지와 성적',
    description:
      '최종 보드에서 활성화된 특성의 사용 표본과 평균 등수, TOP4 및 1위 비율을 살펴보세요.',
  },
  '/tools/reroll-calculator': {
    title: '롤토체스 리롤 확률 계산기 - 2성·3성 확률·레벨별 상점 확률 | TFT Profile',
    description:
      '롤체 리롤 계산기. 레벨·골드·챔피언 코스트·경쟁자 보유 장수를 입력해 2성·3성 확률을 계산하세요. 시즌18 상점 확률표와 공유 풀 정보 제공.',
  },
  '/tools/item-calculator': {
    title: '롤토체스 아이템 조합표·계산기 - 시즌18 롤체 템조합 | TFT Profile',
    description: '롤체 아이템 조합 계산기. 보유 재료로 제작 가능한 완성 아이템과 필요한 다음 재료를 확인하고 시즌18 아이템 조합표 55종을 검색하세요.',
  },
  '/tools/economy-calculator': {
    title: '롤토체스 골드 계산기·레벨업 XP 계산기 - 시즌18 18.7 이자·연승·연패 | TFT Profile',
    description: '롤체 골드 계산기. 보유 골드와 이자, 연승·연패 보너스, 라운드 수입을 계산하고 자연 경험치를 반영해 목표 레벨업 비용을 확인하세요.',
  },
  '/set19': {
    title: '롤토체스 시즌19 프리즘 투어 - 출시일·특성·해금 챔피언 | TFT Profile',
    description:
      '롤토체스 시즌19 프리즘 투어 출시일은 2026년 12월 2일. 신규 음악 특성, 94종 챔피언, 32종 해금 조건과 PBE 변경사항을 정리했습니다.',
  },
  '/set19/unlocks': {
    title: '롤토체스 시즌19 해금 조건 32종 - 챔피언 해금 도감 | TFT Profile',
    description:
      '시즌19 해금 챔피언 32종 전체 목록. 티버·모데카이저·내셔 남작 등 이름, 코스트, 특성으로 검색하고 해금 조건을 체크하세요. 공식 정보와 PBE를 구분합니다.',
  },
  '/set19/unlocks/tibbers': {
    title: '롤토체스 시즌19 티버 해금 조건·방법 | TFT Profile',
    description: '아이템을 장착한 2성 애니가 필요합니다. 공식 해금 조건과 유의사항을 확인하세요.',
  },
  '/set19/unlocks/mordekaiser': {
    title: '롤토체스 시즌19 모데카이저 해금 조건·방법 | TFT Profile',
    description: '펜타킬 챔피언 별 레벨 총합 10을 확인하세요. 공식 해금 조건과 계산 순서를 정리했습니다.',
  },
  '/set19/unlocks/baron-nashor': {
    title: '롤토체스 시즌19 내셔 남작 해금 조건·방법 | TFT Profile',
    description: '신비로운 악기 5종과 말자하의 누적 피해량으로 내셔 남작 해금 준비를 확인하세요.',
  },
  '/set19/unlocks/seraphine': {
    title: '롤토체스 시즌19 세라핀 해금 조건·방법 | TFT Profile',
    description: '2스테이지 공동 선택 전 상점 새로고침 4회의 PBE 해금 조건을 확인하세요.',
  },
  '/set19/unlocks/ashe': {
    title: '롤토체스 시즌19 애쉬 해금 조건·방법 | TFT Profile',
    description: '비치 팝 챔피언에게 아이템 두 개를 장착하는 애쉬 해금 조건을 확인하세요.',
  },
  '/set19/unlocks/kobuko': {
    title: '롤토체스 시즌19 코부코 해금 조건·방법 | TFT Profile',
    description: '2성 직스와 아이템 하나를 활용하는 코부코 해금 방법을 안내합니다.',
  },
  '/set19/unlocks/vayne': {
    title: '롤토체스 시즌19 베인 해금 조건·방법 | TFT Profile',
    description: '락 특성을 활성화하고 전투 3회를 진행하는 베인의 PBE 해금 조건을 확인하세요.',
  },
  '/set19/unlocks/rakan': {
    title: '롤토체스 시즌19 라칸 해금 조건·방법 | TFT Profile',
    description: '8레벨 이후 연승·연패를 포함하는 라칸의 해금 조건을 확인하세요.',
  },
  '/set19/unlocks/smeech': {
    title: '롤토체스 시즌19 스미치 해금 조건·방법 | TFT Profile',
    description: '고유 시너지를 제외한 일반 특성 8종 활성화 조건과 준비법을 확인하세요.',
  },
  '/set19/unlocks/sona': {
    title: '롤토체스 시즌19 소나 해금 조건·방법 | TFT Profile',
    description: '콜라보 영감 발동 15회와 최소 레벨 10의 PBE 해금 조건을 확인하세요.',
  },
  '/about': {
    title: 'TFT Profile 소개 - 데이터와 분석 방식',
    description:
      '회원가입 없이 사용하는 개인 TFT 분석 서비스. 데이터 수집 방식, 자체 분석의 한계, Riot Games와의 관계를 안내합니다.',
  },
  '/privacy': {
    title: '개인정보처리방침 | TFT Profile Analyzer',
    description:
      'TFT Profile의 Riot ID 및 게임 데이터 처리 목적, 저장, 외부 서비스와 개인정보 문의 방법을 안내합니다.',
  },
  '/terms': {
    title: '이용약관 | TFT Profile Analyzer',
    description: 'TFT Profile 서비스 이용 조건, 분석 결과의 한계와 금지 행위를 안내합니다.',
  },
} as const;
export function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}
export function pageMetadata(path: string) {
  return (
    PUBLIC_PAGES[normalizePath(path) as keyof typeof PUBLIC_PAGES] ?? {
      title: '플레이어 프로필 | TFT Profile',
      description: 'Riot ID로 최근 경기의 성적과 플레이 스타일을 확인하세요.',
    }
  );
}
export function updatePageMetadata(path: string) {
  const meta = pageMetadata(path);
  document.title = meta.title;
  const set = (attribute: string, key: string, value: string) => {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, key);
      document.head.append(el);
    }
    el.content = value;
  };
  set('name', 'description', meta.description);
  set('property', 'og:title', meta.title);
  set('property', 'og:description', meta.description);
  const canonical = SITE_URL + (normalizePath(path) === '/profile' ? '/' : normalizePath(path));
  set('property', 'og:url', canonical);
  if (normalizePath(path) === '/profile') set('name', 'robots', 'noindex,follow');
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  link.href = canonical;
}
