export interface ApiEnv {
  RIOT_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  MIN_SAMPLE_SIZE?: string;
  TFT_STATIC_VERSION?: string;
}
// Minimal structural Pages context; runtime bindings are never assigned to process.env.
export interface ApiContext {
  request: Request;
  env: ApiEnv;
}
