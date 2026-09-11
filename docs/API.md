# 현재 분석 범위

사용자가 현재 실제 응답에 증강 선택 기록이 없음을 확인하여 증강 분석·UI·진단 명령을 제거했습니다. 현재 구현·점수 기준은 README의 보드 분석과 TFT PLAYER PROFILE 절을 따릅니다.

Participant 파서는 PUUID로 참가자를 선택하고 `players_eliminated`, `total_damage_to_players`를 추가 보존합니다. 공개 실제 Match fixture에서 해당 키를 확인했으며, 누락 또는 비정상 값은 undefined로 유지합니다. 등수/보드 분석에 영향을 주지 않습니다. 정적 데이터 요청은 유닛·아이템·특성만 수행합니다.

# Riot API 확인 기록

확인일: 2026-09-10. 웹 검색으로 공식 Portal을 확인하고, Portal이 사용하는 공식 `/api-details/...` 문서 응답의 DTO 표를 직접 읽었습니다. 인증 키가 없어 실제 플레이어 응답은 수집하지 않았습니다.

| 단계                 | 공식 경로                                                     | 라우팅 |
| -------------------- | ------------------------------------------------------------- | ------ |
| Riot ID → AccountDto | `/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`   | asia   |
| 리그                 | `/tft/league/v1/by-puuid/{puuid}`                             | kr     |
| 경기 ID              | `/tft/match/v1/matches/by-puuid/{puuid}/ids?start=0&count=30` | asia   |
| 경기 상세            | `/tft/match/v1/matches/{matchId}`                             | asia   |

참고: 기존 summonerId 기반 league 경로를 사용하지 않습니다. 경기 목록 endpoint의 공식 Query Parameters는 start/endTime/startTime/count이며 queue 필터를 추측해서 추가하지 않았습니다. 상세 응답의 queue_id로 필터링합니다.

## 참조 원문 URL

- https://developer.riotgames.com/apis
- https://developer.riotgames.com/api-details/account-v1
- https://developer.riotgames.com/api-details/tft-league-v1
- https://developer.riotgames.com/api-details/tft-match-v1
- https://developer.riotgames.com/docs/tft

## 읽는 DTO 필드

AccountDto: puuid, gameName, tagLine (이름/태그는 누락될 수 있어 입력값을 표시용으로 보완).

LeagueEntryDTO: queueType, tier, rank, leaguePoints, wins, losses. `RANKED_TFT`만 선택합니다. 랭크 W/L 필드의 원뜻을 바꾸어 1등/8등으로 해석하지 않습니다. 자체 1등률은 Match placement로 계산합니다.

MatchDto: metadata.match_id, info.game_datetime, game_length, game_version, queue_id, tft_set_number, participants. queueId는 deprecated이므로 읽지 않습니다.

ParticipantDto: puuid, placement, level, last_round, time_eliminated, units, traits. level은 플레이어 최종 레벨이며 활성 유닛 수가 아닙니다. time_eliminated는 참가자가 탈락할 때까지의 초입니다.

UnitDto: character_id, tier(별 등급), rarity(비용과 다름), items(숫자 ID), itemNames(문자열 식별자). UnitDto.name은 빈 값일 수 있으므로 표시 이름으로 의존하지 않습니다.

TraitDto: name, num_units, style, tier_current, tier_total. 활성 판단은 tier_current > 0입니다.

## Data Dragon

공식 versions.json에서 경기 버전과 같은 major.minor의 최신 버전을 선택합니다. 각 patch의 ko_KR/tft-champion.json, tft-trait.json, tft-item.json의 data 항목에서 name / id / image.full / image.group을 읽습니다. 챔피언 데이터의 tier만 cost로 보관하며 현재 코스트 분석에는 사용하지 않습니다. 이름 데이터 실패는 경기 조회를 중단하지 않습니다. 추측한 최신 세트 명칭이나 비공식 메타 덱 매핑은 포함하지 않았습니다.

## 정책 설계

완료 경기의 자가 회고를 위한 통계입니다. 실시간 경기/상대 scouting API는 호출하지 않습니다. 독립적인 MMR/실력 순위나 증강체 승률을 생성하지 않습니다. Production 자가 통계 사용 사례의 RSO 요구는 정식 출시 전에 별도로 충족해야 합니다.

## 2026-09-10 participant 호환성 수정

최신 공식 `/api-details/tft-match-v1`의 ParticipantDto, UnitDto 표를 다시 읽었습니다. 표에는 `items`와 `itemNames`가 모두 있지만 둘 다 항상 존재한다는 required 제약은 없습니다. 공개된 data_version 5 실응답은 itemNames만 포함합니다. 이 차이를 반영해 wire DTO의 두 장비 필드를 선택적으로 선언하고, 파서에서 한쪽 표현이 유효하면 다른 쪽 생략을 허용합니다. PUUID는 info.participants에서 직접 비교합니다. 단순 형변환으로 누락된 수치를 만들지 않습니다.

실응답 fixture는 `tests/fixtures/riot-match-v5.anonymized.json`이며 2023년 과거 응답입니다. 원본 출처·해시·익명화·파생 테스트 범위는 동봉 README에 기록했습니다. 최신 실응답을 직접 조회했다는 의미는 아닙니다. 최신 실패 경기의 정확한 응답이 제공되면 이 테스트군에 추가할 수 있습니다.
