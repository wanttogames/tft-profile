/** Accept either gameName#tagLine or the existing two-field form. The tag is never a server guess. */
export function parseRiotId(input: string, separateTag = '') {
  const parts = input.trim().split('#');
  const gameName = parts[0]?.trim() || '';
  const tagLine = (parts.length === 2 ? parts[1]! : separateTag.trim().replace(/^#/, '')).trim();
  if (
    parts.length > 2 ||
    !gameName ||
    !tagLine ||
    gameName.length > 50 ||
    tagLine.length > 16 ||
    /[\x00-\x1f/#?]/.test(gameName + tagLine)
  )
    throw new Error('Riot ID를 게임이름#태그 형식으로 입력해 주세요.');
  return { gameName, tagLine };
}
