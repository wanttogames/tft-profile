/**
 * TFT Set 19 (Prismatic Tour) source register.
 * Official: 2026-11-17 Riot Games Korean overview.
 * Other unlock conditions: PBE observations dated 2026-11-20. These can change.
 * This is a manually reviewed editorial snapshot, NOT live game state.
 */
export type Set19UnlockStatus = 'official' | 'pbe';
export interface Set19Unlock {
  slug: string;
  name: string;
  cost: number;
  traits: string[];
  condition: string;
  minLevel: number | null;
  status: Set19UnlockStatus;
}
export interface Set19Guide {
  intent: string;
  intro: string;
  steps: string[];
  checks: string[];
}
export const SET19_RELEASE_DATE = '2026-12-02';
export const SET19_PBE_VERIFIED_DATE = '2026-11-20';
export const SET19_RIOT_SOURCE =
  'https://teamfighttactics.leagueoflegends.com/ko-kr/news/media/tft-set-19-prismatic-tour-overview/';
export const SET19_PBE_SOURCE =
  'https://senseos.gg/guides/tft/set-19-unlocks/';
export const SET19_UNLOCKS: Set19Unlock[] = [
  {
    "slug": "kobuko",
    "name": "코부코",
    "cost": 1,
    "traits": [
      "하이퍼팝",
      "선봉대"
    ],
    "condition": "아이템을 장착한 2성 직스를 마련한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "ashe",
    "name": "애쉬",
    "cost": 2,
    "traits": [
      "비치 팝",
      "기동타격대"
    ],
    "condition": "비치 팝 챔피언 한 명에게 아이템 2개를 장착한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "lulu",
    "name": "룰루",
    "cost": 2,
    "traits": [
      "하이퍼팝",
      "안무가"
    ],
    "condition": "하이퍼팝 활성 상태에서 해당 챔피언들이 스킬을 총 10회 사용한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "samira",
    "name": "사미라",
    "cost": 2,
    "traits": [
      "클래식",
      "배반자",
      "트릭샷"
    ],
    "condition": "클래식·배반자·트릭샷 중 해당하는 챔피언 한 명에게 아이템 2개를 장착한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "seraphine",
    "name": "세라핀",
    "cost": 2,
    "traits": [
      "인디"
    ],
    "condition": "2스테이지 공동 선택 이전에 상점을 4회 새로고침한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "tristana",
    "name": "트리스타나",
    "cost": 2,
    "traits": [
      "하이퍼팝",
      "히트메이커"
    ],
    "condition": "하이퍼팝 활성 상태에서 적 처치 5회를 기록한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "evelynn",
    "name": "이블린",
    "cost": 3,
    "traits": [
      "K/DA",
      "배반자"
    ],
    "condition": "K/DA 또는 배반자 소속의 서로 다른 챔피언 3종을 확보한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "tibbers",
    "name": "티버",
    "cost": 3,
    "traits": [
      "IONIC SPARK",
      "경호대"
    ],
    "condition": "아이템을 장착한 2성 애니를 전장에 배치한다",
    "minLevel": null,
    "status": "official"
  },
  {
    "slug": "alistar",
    "name": "알리스타",
    "cost": 4,
    "traits": [
      "컨트리"
    ],
    "condition": "시전자 또는 원거리 공격수 역할의 챔피언에게 쇠사슬 조끼를 장착한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "alune",
    "name": "알룬",
    "cost": 4,
    "traits": [
      "HEARTSTEEL",
      "매니저",
      "신동"
    ],
    "condition": "HEARTSTEEL 또는 신동 챔피언을 서로 다른 4종 확보한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "jinx",
    "name": "징크스",
    "cost": 4,
    "traits": [
      "IONIC SPARK",
      "히트메이커"
    ],
    "condition": "IONIC SPARK 또는 히트메이커 챔피언 한 명에게 아이템 3개를 장착한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "kayle",
    "name": "케일",
    "cost": 4,
    "traits": [
      "펜타킬",
      "속전속결"
    ],
    "condition": "펜타킬 또는 속전속결 챔피언을 서로 다른 4종 확보한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "thresh",
    "name": "쓰레쉬",
    "cost": 4,
    "traits": [
      "클래식",
      "선봉대"
    ],
    "condition": "클래식 특성으로 적을 매혹한 누적 시간을 275초 달성한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "vayne",
    "name": "베인",
    "cost": 4,
    "traits": [
      "락",
      "트릭샷"
    ],
    "condition": "락 특성을 활성화한 상태로 플레이어 전투 3회를 진행한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "wukong",
    "name": "오공",
    "cost": 4,
    "traits": [
      "고풍"
    ],
    "condition": "자야를 배치한 상태에서 아군이 누적 피해량 25,000을 기록한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "yasuo",
    "name": "야스오",
    "cost": 4,
    "traits": [
      "TRUE DAMAGE",
      "학살자"
    ],
    "condition": "서로 다른 TRUE DAMAGE 또는 학살자 챔피언의 별 레벨 총합 6을 달성한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "zac",
    "name": "자크",
    "cost": 4,
    "traits": [
      "비치 팝",
      "돌격대"
    ],
    "condition": "비치 팝 또는 돌격대 챔피언을 서로 다른 5종 확보한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "aphelios",
    "name": "아펠리오스",
    "cost": 5,
    "traits": [
      "HEARTSTEEL"
    ],
    "condition": "알룬 또는 요네를 2성으로 만든다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "gwen",
    "name": "그웬",
    "cost": 5,
    "traits": [
      "IONIC SPARK",
      "멜로딕 하트"
    ],
    "condition": "IONIC SPARK 팬의 응원 효과를 누적 250회 달성한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "janna",
    "name": "잔나",
    "cost": 5,
    "traits": [
      "고풍",
      "바람의 축복",
      "신동"
    ],
    "condition": "자야를 배치한 상태에서 이자로 총 25골드를 획득한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "akali-kda",
    "name": "K/DA 아칼리",
    "cost": 5,
    "traits": [
      "K/DA"
    ],
    "condition": "TRUE DAMAGE 아칼리를 아직 해금하지 않은 상태에서 K/DA 챔피언 별 레벨 총합 12를 달성한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "lee-sin",
    "name": "리 신",
    "cost": 5,
    "traits": [
      "고풍"
    ],
    "condition": "자야를 배치한 상태로 상대 플레이어에게 누적 40의 피해를 준다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "mordekaiser",
    "name": "모데카이저",
    "cost": 5,
    "traits": [
      "펜타킬"
    ],
    "condition": "서로 다른 펜타킬 챔피언의 별 레벨 총합 10을 달성한다",
    "minLevel": null,
    "status": "official"
  },
  {
    "slug": "pyke",
    "name": "파이크",
    "cost": 5,
    "traits": [
      "락",
      "배반자"
    ],
    "condition": "전투 종료 시 골드 85 이상을 보유한다",
    "minLevel": 7,
    "status": "pbe"
  },
  {
    "slug": "taliyah",
    "name": "탈리야",
    "cost": 5,
    "traits": [
      "비치 팝",
      "앙코르"
    ],
    "condition": "비치 팝 악기 칸에 각 코스트 챔피언을 한 명씩 배치한 상태로 전투를 시작한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "teemo",
    "name": "티모",
    "cost": 5,
    "traits": [
      "하이퍼팝",
      "하이프 맨"
    ],
    "condition": "하이퍼팝 열광을 누적 900 획득한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "akali-true-damage",
    "name": "TRUE DAMAGE 아칼리",
    "cost": 5,
    "traits": [
      "TRUE DAMAGE"
    ],
    "condition": "K/DA 아칼리가 잠겨 있는 동안 TRUE DAMAGE 블링을 누적 350 획득한다",
    "minLevel": null,
    "status": "pbe"
  },
  {
    "slug": "vladimir",
    "name": "블라디미르",
    "cost": 5,
    "traits": [
      "클래식",
      "비전 마법사"
    ],
    "condition": "전장 앞쪽 두 줄에 챔피언을 단 한 명만 배치한다",
    "minLevel": 8,
    "status": "pbe"
  },
  {
    "slug": "baron-nashor",
    "name": "내셔 남작",
    "cost": 7,
    "traits": [
      "원 몬스터 밴드",
      "작곡가"
    ],
    "condition": "말자하의 작곡가 특성으로 신비로운 악기 5종을 수집하고 말자하의 요구 피해량을 달성한다 (PBE 60,000)",
    "minLevel": null,
    "status": "official"
  },
  {
    "slug": "rakan",
    "name": "라칸",
    "cost": 7,
    "traits": [
      "보이 밴드",
      "안무가"
    ],
    "condition": "8레벨 이상에서 4연승과 3연패 조건을 각각 충족한다",
    "minLevel": 8,
    "status": "pbe"
  },
  {
    "slug": "smeech",
    "name": "스미치",
    "cost": 7,
    "traits": [
      "재즈",
      "학살자"
    ],
    "condition": "고유 단일 특성을 제외한 특성 8개 이상을 동시에 활성화한다",
    "minLevel": 9,
    "status": "pbe"
  },
  {
    "slug": "sona",
    "name": "소나",
    "cost": 7,
    "traits": [
      "프로듀서",
      "콜라보"
    ],
    "condition": "플레이어 전투 중 콜라보 챔피언들의 영감 발동을 누적 15회 달성한다",
    "minLevel": 10,
    "status": "pbe"
  }
];
export const SET19_GUIDES: Record<string,Set19Guide> = {
  "tibbers": {
    "intent": "2성 애니가 있어도 티버가 보이지 않을 때 확인할 조건",
    "intro": "티버는 시즌19의 해금 규칙을 가장 간단하게 익힐 수 있는 사례입니다. 핵심은 단순히 애니를 보유하는 것이 아니라, 2성 애니에 아이템을 장착한 채 전장에 내보내는 것입니다.",
    "steps": [
      "애니 3장을 모아 2성으로 합칩니다.",
      "완성 아이템 또는 조건에 해당하는 아이템을 애니에게 장착합니다.",
      "애니를 대기석이 아닌 전장에 배치하고 다음 상점을 확인합니다."
    ],
    "checks": [
      "애니가 실제 2성인지 확인하세요.",
      "2성 애니를 전장에 배치했는지 확인하세요.",
      "일반 상점이 아닌 특수 슬롯에서는 표시 방식이 다를 수 있습니다."
    ]
  },
  "mordekaiser": {
    "intent": "펜타킬 챔피언 별 레벨 합계 10을 빠르게 확인하는 법",
    "intro": "모데카이저는 펜타킬 조합을 어느 정도 완성해야 얻을 수 있는 5코스트 보상형 챔피언입니다. 공식 발표에서 제시된 '서로 다른 펜타킬 유닛의 별 레벨 총합 10'이 핵심입니다.",
    "steps": [
      "먼저 여러 종류의 펜타킬 챔피언을 전장에 확보합니다.",
      "각 펜타킬 챔피언의 별 레벨을 따로 적고 합계가 10 이상인지 확인합니다.",
      "합계를 채운 뒤 다음 상점에서 해금 여부를 확인합니다."
    ],
    "checks": [
      "동일 챔피언 복제본을 여러 번 세지 마세요. '서로 다른' 유닛 조건입니다.",
      "별 10개짜리 단일 챔피언이 아니라 여러 유닛의 별 레벨 합계입니다.",
      "공식 발표는 해금 기준을 설명하지만 세부 예외는 정식 패치 노트에서 재확인해야 합니다."
    ]
  },
  "baron-nashor": {
    "intent": "내셔 남작을 여는 신비로운 악기와 말자하 조건 정리",
    "intro": "내셔 남작은 작곡가 말자하 중심으로 준비하는 고난도 해금 챔피언입니다. 악기 5종을 모으는 과정과 말자하 피해량 조건을 둘 다 살펴야 합니다.",
    "steps": [
      "작곡가 말자하를 중심으로 게임 계획을 세웁니다.",
      "상점에 등장할 수 있는 신비로운 악기를 다섯 종류 모두 확보합니다.",
      "말자하의 피해량 요구 조건을 충족한 뒤 다음 상점을 확인합니다."
    ],
    "checks": [
      "PBE 자료에 기재된 피해량은 60,000으로, 공식 발표에는 구체적인 수치가 적혀 있지 않습니다.",
      "내셔 남작은 전장에 배치할 때 팀 슬롯 2개를 사용합니다.",
      "악기 다섯 개와 피해량 조건 중 하나만 충족해서는 해금되지 않습니다."
    ]
  },
  "seraphine": {
    "intent": "세라핀을 위해 2스테이지 공동 선택 전에 확인할 사항",
    "intro": "세라핀은 다른 해금 유닛과 달리 매우 이른 시점의 상점 새로고침 횟수를 요구합니다. 초반 경제 운영과 연결되는 조건이라, 시작 전에 리롤 계획을 정하는 편이 좋습니다.",
    "steps": [
      "2스테이지 공동 선택 이전이라는 제한을 먼저 기억합니다.",
      "해당 시점 전에 상점 새로고침을 4번 진행합니다.",
      "해금 표시를 확인하되 골드 소비가 다른 운영에 미치는 영향도 고려합니다."
    ],
    "checks": [
      "무료 새로고침 인정 여부는 PBE 조건 설명만으로 확정하지 않습니다.",
      "공동 선택 이후에 리롤하면 해금 시한을 놓칠 수 있습니다.",
      "골드 투자로 생기는 손해가 커질 수 있으므로 항상 쫓을 필요는 없습니다."
    ]
  },
  "ashe": {
    "intent": "비치 팝 아이템 2개 장착 조건 체크",
    "intro": "애쉬의 PBE 해금 조건은 특정 챔피언을 2성으로 만드는 대신 비치 팝 챔피언 한 명에게 아이템 두 개를 장착하는 것입니다. 평소 아이템 분배 방식에 따라 자연스럽게 달성할 수도 있습니다.",
    "steps": [
      "비치 팝 특성의 챔피언을 확보합니다.",
      "같은 비치 팝 챔피언 한 명에게 아이템 두 개를 장착합니다.",
      "장착 조건을 만족했다면 다음 상점에서 해금 여부를 확인합니다."
    ],
    "checks": [
      "두 챔피언에게 하나씩 나눠 장착하는 방식과 구분하세요.",
      "현재는 PBE 기준이며 정식 출시 전에 수량이 바뀔 수 있습니다.",
      "무리한 아이템 배분이 전체 보드 전투력을 떨어뜨리지 않는지 확인하세요."
    ]
  },
  "kobuko": {
    "intent": "1코스트 코부코를 해금하는 직스 2성 조건",
    "intro": "코부코는 1코스트 해금 대상으로, 고코스트 챔피언을 오래 모으기보다 초반 직스를 활용할 때 달성 가능한 조건으로 소개됩니다.",
    "steps": [
      "초반에 직스 3장을 확보해 2성을 만듭니다.",
      "2성 직스에게 아이템 하나를 장착합니다.",
      "해금된 코부코가 다음 상점에 나타나는지 확인합니다."
    ],
    "checks": [
      "직스 1성이나 아이템을 장착하지 않은 2성은 조건을 채우지 못합니다.",
      "초반 직스 구매에만 집착하면 이자 운영이 손상될 수 있습니다.",
      "코부코의 코스트와 조건은 출시 전 PBE 자료이므로 변경 가능성을 확인하세요."
    ]
  },
  "vayne": {
    "intent": "락 특성으로 베인을 해금하기 위한 전투 횟수",
    "intro": "베인은 특정 아이템이나 별 등급 대신 락 특성을 활성화한 상태로 전투에 참가한 횟수를 보는 방식입니다. 단순히 락 유닛을 가지고 있는 것과는 구분할 필요가 있습니다.",
    "steps": [
      "락 특성을 활성화할 수 있는 조합을 갖춥니다.",
      "락 특성이 켜진 상태로 플레이어 전투 3회를 진행합니다.",
      "요구 전투가 끝난 뒤 해금 여부를 확인합니다."
    ],
    "checks": [
      "락 특성이 실제로 활성화되었는지 확인하세요.",
      "전투마다 특성이 꺼지지 않았는지 살펴보세요.",
      "최소 7레벨 조건은 PBE 기준으로 확인된 수치입니다."
    ]
  },
  "rakan": {
    "intent": "8레벨 이후 라칸 연승·연패 조건 해석",
    "intro": "라칸은 시즌19에서 특히 까다로운 연속 전투 결과를 요구하는 해금 대상으로 분류됩니다. PBE 문구에는 8레벨 이상의 4연승과 3연패가 함께 나타나므로 경기 운영 과정에서 계획적으로 살펴야 합니다.",
    "steps": [
      "8레벨 이상 도달을 기본 전제로 삼습니다.",
      "해금 상태창에서 연승·연패 진행 조건을 확인합니다.",
      "전투 결과 기록을 추적하며 요구 연속 횟수를 충족했는지 점검합니다."
    ],
    "checks": [
      "PBE 표기는 4연승과 3연패 모두를 요구하는 것으로 읽히지만 정식 적용 전 검증이 필요합니다.",
      "일부러 연패를 만들면 체력을 크게 잃을 수 있습니다.",
      "라칸은 일반적인 안정적 운영보다 조건 도전을 선택한 판에 적합할 수 있습니다."
    ]
  },
  "smeech": {
    "intent": "고유 특성을 제외한 8개 시너지를 동시에 활성화",
    "intro": "스미치는 대규모 특성 조합을 이용한 해금 과제입니다. 서로 다른 유닛을 많이 배치하는 것보다 실제로 활성화된 특성의 종류를 세는 것이 중요합니다.",
    "steps": [
      "전장의 활성 특성 목록을 확인합니다.",
      "한 명의 챔피언만으로 활성화되는 고유 특성은 합계에서 제외합니다.",
      "동시에 활성화된 일반 특성이 8종 이상인지 확인합니다."
    ],
    "checks": [
      "보유 챔피언에 붙은 비활성 특성은 계산에 포함하지 않습니다.",
      "PBE 기준 최소 레벨은 9이며 출시 때 변동될 수 있습니다.",
      "시너지 수를 늘리는 과정에서 메인 딜러와 탱커 성능도 확인하세요."
    ]
  },
  "sona": {
    "intent": "콜라보 영감 15회와 최소 레벨 조건",
    "intro": "소나 해금은 콜라보 특성의 전투 중 발동을 누적하는 방식입니다. 필드에 콜라보 챔피언이 있다는 사실만으로 끝나지 않고, 실제 전투에서 영감이 발생해야 합니다.",
    "steps": [
      "콜라보 챔피언이 배정된 조합을 확인합니다.",
      "플레이어 전투에서 영감 발동 횟수를 늘립니다.",
      "누적 15회 및 최소 레벨 조건을 확인한 뒤 다음 상점을 봅니다."
    ],
    "checks": [
      "PBE 기준 최소 10레벨이 표시되어 있으며 정식 출시 전에 달라질 수 있습니다.",
      "각 전투에서 단순 특성 활성과 영감 발동은 별개의 조건입니다.",
      "빠른 종료 경기에서는 목표치에 도달하기 어려울 수 있습니다."
    ]
  }
};
export const SET19_FEATURED_SLUGS = ["tibbers","mordekaiser","baron-nashor","seraphine","ashe","kobuko","vayne","rakan","smeech","sona"] as const;
export const SET19_TRAITS = [
  {name:'K/DA',summary:'챔피언 별 등급의 총합에 따라 신곡이 등장하는 음악 특성'},
  {name:'펜타킬',summary:'공격력·주문력 강화 및 특정 체력 이하 적 처형 효과'},
  {name:'HEARTSTEEL',summary:'최애 멤버 선택으로 챔피언 스킬을 강화하는 특성'},
  {name:'IONIC SPARK',summary:'팬들의 선물로 회복·능력치 향상과 보상을 얻는 특성'},
  {name:'TRUE DAMAGE',summary:'전투 결과에 따라 블링을 모아 보상을 선택하는 특성'},
  {name:'비치 팝',summary:'전장의 악기를 배치해 인접 아군을 지원하는 특성'},
  {name:'하이퍼팝',summary:'전투의 별 등급과 처치 관여로 열광을 모으는 특성'},
  {name:'재즈',summary:'활성화된 일반 특성이 많을수록 아군에게 추가 능력치를 주는 특성'},
] as const;
export function findSet19Unlock(slug: string): Set19Unlock | undefined {
  return SET19_UNLOCKS.find(entry=>entry.slug===slug);
}
