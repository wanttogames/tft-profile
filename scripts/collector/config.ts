export function config(env = process.env) {
  const required = (key: string) => {
    const value = env[key]?.trim();
    if (!value) throw new Error(`Missing environment variable: ${key}`);
    return value;
  };
  const number = (key: string, fallback: number, min: number, max: number) => {
    const value = Number(env[key] ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const url = required('SUPABASE_URL');
  if (new URL(url).protocol !== 'https:') throw new Error('SUPABASE_URL must use HTTPS');
  return {
    riotKey: required('RIOT_API_KEY'),
    url,
    secret: required('SUPABASE_SECRET_KEY'),
    playersLimit: number('PLAYERS_LIMIT', 2, 1, 1000),
    matchesPerPlayer: number('MATCHES_PER_PLAYER', 2, 1, 100),
    delayMs: number('RIOT_REQUEST_DELAY_MS', 1400, 1200, 60000),
  };
}
