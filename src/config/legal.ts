export const CONTACT_EMAIL = 'wanttogames@gmail.com';
export const SERVICE_NAME = 'TFT Profile Analyzer';
export const EFFECTIVE_DATE = '2026-09-12';
export const RIOT_DISCLAIMER = [
  "TFT Profile Analyzer isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.",
  'Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
];
export function legalPage(path: string) {
  const normalized = path.replace(/\/+$/, '') || '/';
  return normalized === '/privacy' ? 'privacy' : normalized === '/terms' ? 'terms' : null;
}
