/** Documented DTO subset. Sources and verification date: docs/API.md. */
export interface Account {
  puuid: string;
  gameName?: string;
  tagLine?: string;
}
export interface League {
  queueType: string;
  tier?: string;
  rank?: string;
  leaguePoints?: number;
  wins: number;
  losses: number;
}
export interface Unit {
  character_id: string;
  tier: number;
  rarity: number;
  items: number[];
  itemNames?: string[];
}
export interface Trait {
  name: string;
  num_units: number;
  style: number;
  tier_current: number;
  tier_total: number;
}
export interface Participant {
  puuid: string;
  placement: number;
  level: number;
  last_round: number;
  time_eliminated: number;
  units: Unit[];
  traits: Trait[];
}
/** Wire DTOs differ from normalized application units: legacy items may be absent. */
export interface RiotUnitDto extends Omit<Unit, 'items' | 'itemNames'> {
  items?: number[] | null;
  itemNames?: string[] | null;
}
export interface RiotParticipantDto extends Omit<Participant, 'units'> {
  units: RiotUnitDto[];
}
export interface Match {
  metadata: { match_id: string };
  info: {
    game_datetime: number;
    game_length: number;
    game_version: string;
    queue_id: number;
    tft_set_number: number;
    participants: RiotParticipantDto[];
  };
}
export interface Game {
  id: string;
  date: number;
  duration: number;
  version: string;
  set: number;
  player: Participant;
}
export interface Asset {
  name: string;
  image?: string;
  cost?: number;
}
export interface PlayerData {
  account: Account;
  rank: League | null;
  games: Game[];
  assets: Record<string, Asset>;
  warnings: string[];
  fetchedAt: number;
  scanned: number;
  demo?: boolean;
}
