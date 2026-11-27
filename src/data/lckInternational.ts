import { historyRoster, historyTeamPath } from './lckHistory';

export const LCK_INTERNATIONAL_PATH = '/esports/lck/history/international';
export const INTERNATIONAL_EVENTS = {
  'first-stand': 'First Stand',
  msi: 'MSI',
  worlds: '월즈',
} as const;

export type InternationalEvent = keyof typeof INTERNATIONAL_EVENTS;
export type InternationalFilter = 'all' | InternationalEvent;

interface InternationalResult {
  year: number;
  event: InternationalEvent;
  team: string;
  name: string;
  place: 1 | 2;
}

const internationalSources = {
  'first-stand': 'https://lol.fandom.com/wiki/First_Stand',
  msi: 'https://www.strafe.com/articles/read/league-of-legends-msi-winners-list/',
  worlds: 'https://www.luckyquack.com/esports/league-of-legends/lol-worlds/',
} satisfies Record<InternationalEvent, string>;

type RecordRow = [
  year: number,
  event: InternationalEvent,
  team: string,
  name: string,
  place: 1 | 2,
];

// Team names reflect the final. Team slugs follow the roster archive's franchise grouping.
const rows: RecordRow[] = [
  [2026, 'worlds', 'geng', 'Gen.G', 2],
  [2026, 'msi', 'hle', 'Hanwha Life Esports', 1],
  [2025, 'worlds', 't1', 'T1', 1],
  [2025, 'worlds', 'kt', 'KT Rolster', 2],
  [2025, 'msi', 'geng', 'Gen.G', 1],
  [2025, 'msi', 't1', 'T1', 2],
  [2025, 'first-stand', 'hle', 'Hanwha Life Esports', 1],
  [2024, 'worlds', 't1', 'T1', 1],
  [2024, 'msi', 'geng', 'Gen.G', 1],
  [2023, 'worlds', 't1', 'T1', 1],
  [2022, 'worlds', 'krx', 'DRX', 1],
  [2022, 'worlds', 't1', 'T1', 2],
  [2022, 'msi', 't1', 'T1', 2],
  [2021, 'worlds', 'dk', 'DWG KIA', 2],
  [2021, 'msi', 'dk', 'DWG KIA', 2],
  [2020, 'worlds', 'dk', 'DAMWON Gaming', 1],
  [2018, 'msi', 'krx', 'Kingzone DragonX', 2],
  [2017, 'worlds', 'geng', 'Samsung Galaxy', 1],
  [2017, 'worlds', 't1', 'SK Telecom T1', 2],
  [2017, 'msi', 't1', 'SK Telecom T1', 1],
  [2016, 'worlds', 't1', 'SK Telecom T1', 1],
  [2016, 'worlds', 'geng', 'Samsung Galaxy', 2],
  [2016, 'msi', 't1', 'SK Telecom T1', 1],
  [2015, 'worlds', 't1', 'SK Telecom T1', 1],
  [2015, 'worlds', 'hle', 'KOO Tigers', 2],
  [2015, 'msi', 't1', 'SK Telecom T1', 2],
];

export const INTERNATIONAL_RESULTS: readonly InternationalResult[] = rows.map(
  ([year, event, team, name, place]) => ({ year, event, team, name, place }),
);

export function internationalResultId({ year, event, team }: InternationalResult) {
  return `${year}-${event}-${team}`;
}

export function internationalSource({ year, event }: InternationalResult) {
  if (year === 2026 && event === 'worlds')
    return 'https://lolesports.com/en-US/tournament/115660540725177488/stage/115660540725570707';
  if (year === 2026 && event === 'msi')
    return 'https://lolesports.com/en-US/leagues/first_stand%2Clta_cross%2Cmsi%2Cworlds';
  return internationalSources[event];
}

export function internationalRosterLink({ year, team }: InternationalResult) {
  return historyRoster(year, team) ? `${historyTeamPath(team)}#roster-${year}` : null;
}

export const internationalPlaceLabel = (place: InternationalResult['place']) =>
  place === 1 ? '우승' : '준우승';
