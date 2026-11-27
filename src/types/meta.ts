import type { AssetMap } from '../static-data/catalog';
export type MetaKind = 'item' | 'champion' | 'trait';
export type MetaSort = 'sample_count' | 'avg_placement' | 'top4_rate' | 'win_rate';
export interface MetaRow {
  item_name?: string;
  character_id?: string;
  trait_name?: string;
  sample_count: number;
  avg_placement: number;
  top4_rate: number;
  win_rate: number;
  avg_star_level?: number;
  avg_tier_current?: number;
  common_champions?: { id: string; sample_count: number; rate: number }[];
  common_items?: { id: string; sample_count: number }[];
  tier_samples?: { tier_current: number; sample_count: number }[];
}
export interface MetaData {
  rows: MetaRow[];
  summary: {
    generation?: number;
    aggregate_set_number?: number | null;
    match_count: number;
    participant_count: number;
    player_count: number;
    latest_collected_at: string | null;
    current_patch?: string | null;
    patch_source?: 'match' | 'official' | null;
    external_boundary_at?: string | null;
    external_source_url?: string | null;
    retention_days?: number;
    as_of?: string | null;
    refreshed_at?: string | null;
    scope_ready?: boolean;
    stored_match_count?: number;
    unresolved_match_count?: number;
    confirmed_match_count?: number;
    external_eligible_count?: number;
    confirm_min_samples?: number;
    detected_patch?: string | null;
    external_patch?: string | null;
    preview_set_number?: number | null;
    preview_patch?: string | null;
    boundary_basis?: 'verified' | 'schedule-estimate' | 'first-observed' | null;
    scheduled_date?: string | null;
    next_scheduled_date?: string | null;
    next_cutoff_at?: string | null;
    verification_url?: string | null;
    latest_stored_at?: string | null;
  };
  minSampleSize: number;
  hasMore: boolean;
  page: number;
  assets: AssetMap;
}
