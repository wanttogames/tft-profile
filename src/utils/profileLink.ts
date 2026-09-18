import { parseRiotId } from './riotId';
import { SITE_URL } from '../seo/pages';
export function profileLink(gameName: string, tagLine: string, demo = false): string {
  if (demo) return SITE_URL + '/?demo=1';
  const id = parseRiotId(gameName, tagLine);
  return SITE_URL + '/profile?' + new URLSearchParams(id).toString();
}
export function profileFromQuery(query: string) {
  const params = new URLSearchParams(query);
  return parseRiotId(params.get('gameName') ?? '', params.get('tagLine') ?? '');
}
