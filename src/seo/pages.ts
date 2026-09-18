export const SITE_URL = 'https://tft-profile.pages.dev';
export const PUBLIC_PAGES = {
  '/': {
    title: 'TFT Profile - 롤토체스 개인 플레이 분석',
    description:
      '최근 30경기로 살펴보는 평균 등수, TOP4, 선호 유닛과 플레이 스타일. 내 TFT 기록을 분석하고 프로필 카드로 공유하세요.',
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
      description: 'Riot ID로 최근 경기의 플레이 스타일과 프로필 카드를 확인하세요.',
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
