# Published response fixture provenance

`riot-match-v5.anonymized.json` is derived from a publicly published TFT Match-V1 response, not our UI demo or generated match data.

- Source: https://github.com/CadeJordan/api-project/blob/main/data
- Source Git blob SHA: `95fd0c2b7dad92316ef4b1821a4d9aa97f757f6c`
- Original downloaded bytes SHA-256: `c42b40560658a4cdc6e30bb70227b2899bb3ee075e83864ffcfddf7a35bef690`
- Retrieved: 2026-09-10
- Match: `NA1_4680870913`
- Original `game_datetime`: `1686525689319` (2023), patch `13.11`, set `8`, data_version `5`, queue `1090` (NORMAL).
- Transformation: replace each PUUID in both metadata.participants and info.participants with `fixture-player-1` through `fixture-player-8`; JSON formatting only otherwise. Unit fields, missing `items`, itemNames arrays, traits, placements, times, and participant order are preserved.
- Parser tests run directly against all eight original participants. Tests of the ranked-only `toGame` wrapper explicitly create an in-memory **derived variant** with queue_id = 1100. That variant is not presented as a captured ranked response.

The original response has `itemNames` and no `items` on its units. This reproduces the prior parser rejection. It also contains historical `augments`; absence of a field from today's documentation is not proof it never existed in responses. This patch does not add augment analysis.

The current official DTO reference was separately rechecked at https://developer.riotgames.com/api-details/tft-match-v1 on 2026-09-10. It documents info.participants / puuid and both items and itemNames, but its field table does not establish that both equipment representations are always present.

**Limit:** this is a historical response published by its repository author, not a fresh response fetched by us with the user's API key. The failing user's exact current response was not supplied. New malformed/null/legacy variations in tests are explicitly constructed regression cases rather than captured responses.
