/** Server logs only. Never forward these objects to the browser. */
export function metaErrorBody(body: string, secrets: (string | undefined)[]) {
  let text = body;
  for (const secret of secrets.filter((s): s is string => !!s))
    text = text.split(secret).join('[REDACTED]');
  text = text
    .replace(
      /("(?:apikey|authorization|api_key|[^" ]*secret[^" ]*)"\s*:\s*")[^"]*(")/gi,
      '$1[REDACTED]$2',
    )
    .replace(/(?:Bearer\s+)[^\s",}]+/gi, 'Bearer [REDACTED]')
    .replace(/RGAPI-[\w-]+|sb_secret_[\w-]+|eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[REDACTED]');
  return text.slice(0, 8000);
}
export function metaErrorCategory(body: string) {
  let code = '';
  try {
    code = JSON.parse(body).code ?? '';
  } catch {
    /* retain text diagnostics */
  }
  if (code === '57014') return 'query-cancelled-or-statement-timeout';
  if (code === '42501') return 'permission-denied';
  if (['42703', '42P01', '42883', '22P02', '42804'].includes(code)) return 'schema-or-type-error';
  if (code === 'PGRST003') return 'connection-pool-timeout';
  return 'upstream-error';
}
