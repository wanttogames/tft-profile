// Set 18, checked 2026-11-24. Names and icon URLs: repository CommunityDragon ko_kr snapshot.
// Recipe cross-check: https://noxutft.com/tft-cheat-sheet and https://metabot.gg/en/TFT/18/items/cheat-sheet
// Keep set-specific recipes separate when Set 19 releases. Do not infer from item IDs.
export interface ItemAsset { id: string; name: string; image: string }
export type ItemRole = 'AD' | 'AP' | '탱커' | '지원' | '공용' | '상징';
export interface ItemRecipe extends ItemAsset { parts: [number, number]; role: ItemRole; note: string }
export const COMPONENTS: ItemAsset[] = [
  {
    "id": "TFT_Item_BFSword",
    "name": "B.F. 대검",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_bfsword.png"
  },
  {
    "id": "TFT_Item_RecurveBow",
    "name": "곡궁",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_recurvebow.png"
  },
  {
    "id": "TFT_Item_NeedlesslyLargeRod",
    "name": "쓸데없이 큰 지팡이",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_needlesslylargerod.png"
  },
  {
    "id": "TFT_Item_TearOfTheGoddess",
    "name": "여신의 눈물",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_tearofthegoddess.png"
  },
  {
    "id": "TFT_Item_ChainVest",
    "name": "쇠사슬 조끼",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_chainvest.png"
  },
  {
    "id": "TFT_Item_NegatronCloak",
    "name": "음전자 망토",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_negatroncloak.png"
  },
  {
    "id": "TFT_Item_GiantsBelt",
    "name": "거인의 허리띠",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_giantsbelt.png"
  },
  {
    "id": "TFT_Item_SparringGloves",
    "name": "연습용 장갑",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_sparringgloves.png"
  },
  {
    "id": "TFT_Item_FryingPan",
    "name": "프라이팬",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_fryingpan.png"
  },
  {
    "id": "TFT_Item_Spatula",
    "name": "뒤집개",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_spatula.png"
  }
];
export const RECIPES: ItemRecipe[] = [
  {
    "id": "TFT_Item_Deathblade",
    "name": "죽음의 검",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_deathblade.png",
    "parts": [
      0,
      0
    ],
    "role": "AD",
    "note": "공격력 중심"
  },
  {
    "id": "TFT_Item_MadredsBloodrazor",
    "name": "거인 학살자",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_madredsbloodrazor.png",
    "parts": [
      0,
      1
    ],
    "role": "AD",
    "note": "탱커 상대 피해"
  },
  {
    "id": "TFT_Item_RapidFireCannon",
    "name": "붉은 덩굴정령",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_rapidfirecannon.png",
    "parts": [
      1,
      1
    ],
    "role": "공용",
    "note": "회복 감소"
  },
  {
    "id": "TFT_Item_HextechGunblade",
    "name": "마법공학 총검",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_hextechgunblade.png",
    "parts": [
      0,
      2
    ],
    "role": "공용",
    "note": "피해 기반 회복"
  },
  {
    "id": "TFT_Item_GuinsoosRageblade",
    "name": "구인수의 격노검",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_guinsoosrageblade.png",
    "parts": [
      1,
      2
    ],
    "role": "AD",
    "note": "공격 속도 누적"
  },
  {
    "id": "TFT_Item_RabadonsDeathcap",
    "name": "라바돈의 죽음모자",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_rabadonsdeathcap.png",
    "parts": [
      2,
      2
    ],
    "role": "AP",
    "note": "주문력 중심"
  },
  {
    "id": "TFT_Item_SpearOfShojin",
    "name": "쇼진의 창",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_spearofshojin.png",
    "parts": [
      0,
      3
    ],
    "role": "AP",
    "note": "스킬 사용 보조"
  },
  {
    "id": "TFT_Item_StatikkShiv",
    "name": "공허의 지팡이",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_voidstaff.png",
    "parts": [
      1,
      3
    ],
    "role": "지원",
    "note": "마법 저항력 감소"
  },
  {
    "id": "TFT_Item_ArchangelsStaff",
    "name": "대천사의 지팡이",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_archangelsstaff.png",
    "parts": [
      2,
      3
    ],
    "role": "AP",
    "note": "시간에 따른 주문력 증가"
  },
  {
    "id": "TFT_Item_BlueBuff",
    "name": "푸른 파수꾼",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_bluebuff.png",
    "parts": [
      3,
      3
    ],
    "role": "AP",
    "note": "마나 활용"
  },
  {
    "id": "TFT_Item_GuardianAngel",
    "name": "밤의 끝자락",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_guardianangel.png",
    "parts": [
      0,
      4
    ],
    "role": "AD",
    "note": "생존 보조"
  },
  {
    "id": "TFT_Item_TitansResolve",
    "name": "거인의 결의",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_titansresolve.png",
    "parts": [
      1,
      4
    ],
    "role": "AD",
    "note": "전투 중 능력치 누적"
  },
  {
    "id": "TFT_Item_Crownguard",
    "name": "크라운가드",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_crownguard.png",
    "parts": [
      2,
      4
    ],
    "role": "탱커",
    "note": "초반 보호막"
  },
  {
    "id": "TFT_Item_FrozenHeart",
    "name": "수호자의 맹세",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_frozenheart.png",
    "parts": [
      3,
      4
    ],
    "role": "탱커",
    "note": "마나와 생존"
  },
  {
    "id": "TFT_Item_BrambleVest",
    "name": "덤불 조끼",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_bramblevest.png",
    "parts": [
      4,
      4
    ],
    "role": "탱커",
    "note": "기본 공격 방어"
  },
  {
    "id": "TFT_Item_Bloodthirster",
    "name": "피바라기",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_bloodthirster.png",
    "parts": [
      0,
      5
    ],
    "role": "AD",
    "note": "회복과 보호막"
  },
  {
    "id": "TFT_Item_RunaansHurricane",
    "name": "크라켄의 분노",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_krakenslayer.png",
    "parts": [
      1,
      5
    ],
    "role": "AD",
    "note": "공격력 누적"
  },
  {
    "id": "TFT_Item_IonicSpark",
    "name": "이온 충격기",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_ionicspark.png",
    "parts": [
      2,
      5
    ],
    "role": "지원",
    "note": "주변 마법 저항력 감소"
  },
  {
    "id": "TFT_Item_AdaptiveHelm",
    "name": "적응형 투구",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_adaptivehelm.png",
    "parts": [
      3,
      5
    ],
    "role": "공용",
    "note": "마나와 역할별 능력치"
  },
  {
    "id": "TFT_Item_GargoyleStoneplate",
    "name": "가고일 돌갑옷",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_gargoylestoneplate.png",
    "parts": [
      4,
      5
    ],
    "role": "탱커",
    "note": "집중 공격 방어"
  },
  {
    "id": "TFT_Item_DragonsClaw",
    "name": "용의 발톱",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_dragonsclaw.png",
    "parts": [
      5,
      5
    ],
    "role": "탱커",
    "note": "마법 피해 방어와 회복"
  },
  {
    "id": "TFT_Item_SteraksGage",
    "name": "스테락의 도전",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_steraksgage.png",
    "parts": [
      0,
      6
    ],
    "role": "AD",
    "note": "체력과 공격력"
  },
  {
    "id": "TFT_Item_Leviathan",
    "name": "내셔의 이빨",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_leviathan.png",
    "parts": [
      1,
      6
    ],
    "role": "AP",
    "note": "공격 기반 마나 보조"
  },
  {
    "id": "TFT_Item_Morellonomicon",
    "name": "모렐로노미콘",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_morellonomicon.png",
    "parts": [
      2,
      6
    ],
    "role": "지원",
    "note": "화상과 회복 감소"
  },
  {
    "id": "TFT_Item_Redemption",
    "name": "정령의 형상",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_spiritvisagerr.png",
    "parts": [
      3,
      6
    ],
    "role": "탱커",
    "note": "지속 생존"
  },
  {
    "id": "TFT_Item_RedBuff",
    "name": "태양불꽃 망토",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_redbuff.png",
    "parts": [
      4,
      6
    ],
    "role": "지원",
    "note": "화상과 회복 감소"
  },
  {
    "id": "TFT_Item_SpectralGauntlet",
    "name": "저녁갑주",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_spectralgauntlet.png",
    "parts": [
      5,
      6
    ],
    "role": "지원",
    "note": "주변 방어력 감소"
  },
  {
    "id": "TFT_Item_WarmogsArmor",
    "name": "워모그의 갑옷",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_warmogsarmor.png",
    "parts": [
      6,
      6
    ],
    "role": "탱커",
    "note": "최대 체력"
  },
  {
    "id": "TFT_Item_InfinityEdge",
    "name": "무한의 대검",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_infinityedge.png",
    "parts": [
      0,
      7
    ],
    "role": "AD",
    "note": "스킬 치명타"
  },
  {
    "id": "TFT_Item_LastWhisper",
    "name": "최후의 속삭임",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_lastwhisper.png",
    "parts": [
      1,
      7
    ],
    "role": "지원",
    "note": "방어력 감소"
  },
  {
    "id": "TFT_Item_JeweledGauntlet",
    "name": "보석 건틀릿",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_jeweledgauntlet.png",
    "parts": [
      2,
      7
    ],
    "role": "AP",
    "note": "스킬 치명타"
  },
  {
    "id": "TFT_Item_UnstableConcoction",
    "name": "정의의 손길",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_unstableconcoction.png",
    "parts": [
      3,
      7
    ],
    "role": "공용",
    "note": "공격 능력치와 회복"
  },
  {
    "id": "TFT_Item_NightHarvester",
    "name": "굳건한 심장",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_nightharvester.png",
    "parts": [
      4,
      7
    ],
    "role": "탱커",
    "note": "피해 완화"
  },
  {
    "id": "TFT_Item_Quicksilver",
    "name": "수은",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_quicksilver.png",
    "parts": [
      5,
      7
    ],
    "role": "AD",
    "note": "군중 제어 대응"
  },
  {
    "id": "TFT_Item_PowerGauntlet",
    "name": "타격대의 철퇴",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_powergauntlet.png",
    "parts": [
      6,
      7
    ],
    "role": "공용",
    "note": "전투 중 피해 강화"
  },
  {
    "id": "TFT_Item_ThiefsGloves",
    "name": "도적의 장갑",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_thiefsgloves.png",
    "parts": [
      7,
      7
    ],
    "role": "공용",
    "note": "무작위 장비"
  },
  {
    "id": "DA_18_EmblemHunter",
    "name": "사냥꾼 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_hunter.png",
    "parts": [
      0,
      8
    ],
    "role": "상징",
    "note": "사냥꾼 특성"
  },
  {
    "id": "DA_18_EmblemRapidfire",
    "name": "속사포 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_rapidfire.png",
    "parts": [
      1,
      8
    ],
    "role": "상징",
    "note": "속사포 특성"
  },
  {
    "id": "DA_18_EmblemSpellweaver",
    "name": "주문술사 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_spellweaver.png",
    "parts": [
      2,
      8
    ],
    "role": "상징",
    "note": "주문술사 특성"
  },
  {
    "id": "DA_18_EmblemInvoker",
    "name": "기원자 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_invoker.png",
    "parts": [
      3,
      8
    ],
    "role": "상징",
    "note": "기원자 특성"
  },
  {
    "id": "DA_18_EmblemVanguard",
    "name": "선봉대 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_vanguard.png",
    "parts": [
      4,
      8
    ],
    "role": "상징",
    "note": "선봉대 특성"
  },
  {
    "id": "DA_18_EmblemSlayer",
    "name": "약탈자 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_ravager.png",
    "parts": [
      5,
      8
    ],
    "role": "상징",
    "note": "약탈자 특성"
  },
  {
    "id": "DA_18_EmblemBrawler",
    "name": "싸움꾼 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_brawler.png",
    "parts": [
      6,
      8
    ],
    "role": "상징",
    "note": "싸움꾼 특성"
  },
  {
    "id": "DA_18_EmblemExecutioner",
    "name": "처형자 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_executioner.png",
    "parts": [
      7,
      8
    ],
    "role": "상징",
    "note": "처형자 특성"
  },
  {
    "id": "TFT_Item_TacticiansScepter",
    "name": "전략가의 방패",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_tacticiansscepter.png",
    "parts": [
      8,
      8
    ],
    "role": "상징",
    "note": "전략가 아이템"
  },
  {
    "id": "DA_18_EmblemFae",
    "name": "요정 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_fae.png",
    "parts": [
      0,
      9
    ],
    "role": "상징",
    "note": "요정 특성"
  },
  {
    "id": "DA_18_EmblemInferno",
    "name": "지옥불 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_inferno.png",
    "parts": [
      1,
      9
    ],
    "role": "상징",
    "note": "지옥불 특성"
  },
  {
    "id": "DA_18_EmblemBlossom",
    "name": "개화 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_blossom.png",
    "parts": [
      2,
      9
    ],
    "role": "상징",
    "note": "개화 특성"
  },
  {
    "id": "DA_18_EmblemLunar",
    "name": "달빛 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_lunar.png",
    "parts": [
      3,
      9
    ],
    "role": "상징",
    "note": "달빛 특성"
  },
  {
    "id": "DA_18_EmblemElderwood",
    "name": "나무정령 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_elderwood.png",
    "parts": [
      4,
      9
    ],
    "role": "상징",
    "note": "나무정령 특성"
  },
  {
    "id": "DA_18_EmblemSprykin",
    "name": "날렵이 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_sprykin.png",
    "parts": [
      5,
      9
    ],
    "role": "상징",
    "note": "날렵이 특성"
  },
  {
    "id": "DA_18_EmblemBlackthorn",
    "name": "검은 가시 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_blackthorn.png",
    "parts": [
      6,
      9
    ],
    "role": "상징",
    "note": "검은 가시 특성"
  },
  {
    "id": "DA_18_EmblemPrimal",
    "name": "원시 상징",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/particles/tft/item_icons/traits/spatula/set18/tft18_emblem_primal.png",
    "parts": [
      7,
      9
    ],
    "role": "상징",
    "note": "원시 특성"
  },
  {
    "id": "TFT_Item_TacticiansRing",
    "name": "전략가의 망토",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_tacticiansring.png",
    "parts": [
      8,
      9
    ],
    "role": "상징",
    "note": "전략가 아이템"
  },
  {
    "id": "TFT_Item_ForceOfNature",
    "name": "전략가의 왕관",
    "image": "https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/items/hexcore/tft_item_forceofnature.png",
    "parts": [
      9,
      9
    ],
    "role": "상징",
    "note": "전략가 아이템"
  }
];
