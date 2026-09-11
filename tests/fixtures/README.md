# Published response fixture provenance

`riot-match-v5.anonymized.json` is derived from a publicly published TFT Match-V1 response, not our UI demo or generated match data.

- Source: https://github.com/CadeJordan/api-project/blob/main/data
- Source Git blob SHA: `95fd0c2b7dad92316ef4b1821a4d9aa97f757f6c`
- Original downloaded bytes SHA-256: `c42b40560658a4cdc6e30bb70227b2899bb3ee075e83864ffcfddf7a35bef690`
- Retrieved: 2026-09-10
- Match: `NA1_4680870913`
- Original `game_datetime`: `1686525689319` (2023), patch `13.11`, set `8`, data_version `5`, queue `1090` (NORMAL).
- Transformation: replace each PUUID in both metadata.participants and info.participants with `fixture-player-1` through `fixture-player-8`; JSON formatting and removal of the unused historical selection field; other game fields unchanged. Unit fields, missing `items`, itemNames arrays, traits, placements, times, and participant order are preserved.
- Parser tests run directly against all eight original participants. Tests of the ranked-only `toGame` wrapper explicitly create an in-memory **derived variant** with queue_id = 1100. That variant is not presented as a captured ranked response.

The current official DTO reference was separately rechecked at https://developer.riotgames.com/api-details/tft-match-v1 on 2026-09-10. It documents info.participants / puuid and both items and itemNames, but its field table does not establish that both equipment representations are always present.

**Limit:** this is a historical response published by its repository author, not a fresh response fetched by us with the user's API key. The failing user's exact current response was not supplied. New malformed/null/legacy variations in tests are explicitly constructed regression cases rather than captured responses.

## Current ko_kr static-data excerpt (2026-09-11)

`cdragon-ko-kr.excerpt.json` contains selected original records from https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json downloaded on 2026-09-11.

- Original entire response SHA-256: `4627a0e4ded9f884c351e74d929d5da5b5aa403296b4d75dea488973a3c2ebdb`.
- Transformation: filter the original sets/items to those entries, replace setData with an empty array, JSON reformat. Names, IDs, and properties within selected entries are unchanged.
- Production catalog generation uses the complete response, not this test excerpt. The server snapshot is a compact derived index with the retrieval timestamp and source attached.
- New tests containing numeric alias 42, generic `shared` IDs, empty/malformed data, or a derived board are synthetic boundary cases. They are not claimed to be captured game responses.

## Set 18 participant excerpt (retrieved 2026-09-12 UTC)

`riot-set18-participant.anonymized.json` is the actual JSON participant excerpt published by the reporter in https://github.com/RiotGames/developer-relations/issues/1171 (opened 2026-07-29, match `PBE1_4531702063`). Retrieved through the GitHub issue API; original issue API bytes SHA-256: `dad89e7dc270f77ff4d518e4c8cd3a2c95a4720a698ecd79c2346ff088612a1e`.

## 현재 보드 프로필 테스트

증강 기능과 그 전용 테스트·캡처 명령은 제거했습니다. 위 설명 중 증강 테스트/캡처 명령은 이전 버전 이력입니다. 실제 fixture JSON 자체는 원본 증거 보존을 위해 변경하지 않았습니다. `tests/profile.test.ts`는 이 응답의 피해량·처치 필드 보존을 검증합니다. 50경기 점수·7개 성향·중립/부족 결과·반복 아이템·고점/저점 테스트에는 명시적인 합성 경기 표본을 사용합니다. 실제 API를 재호출하지 않습니다.

## Current fixture scope

The historical full-match fixture is a derived response: player identifiers were anonymized and obsolete selection data was removed. Units, equipment, traits, placements and combat counters retain their original values. The static excerpt now retains only unit, item and trait records. Original source checksums above identify the downloaded source, not the filtered fixture bytes.
