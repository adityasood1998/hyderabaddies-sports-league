import { Timestamp } from 'firebase/firestore';

export type SportType =
  | 'table_tennis'
  | 'foosball'
  | 'darts'
  | 'pool'
  | 'video_game'
  | 'board_game';

export interface SportMetadata {
  id: SportType;
  label: string;
  shortLabel: string;
  venue: string;
  scoringUnit: string;
  defaultWinScore: number;
}

export const SPORTS_CATALOG: Record<SportType, SportMetadata> = {
  table_tennis: {
    id: 'table_tennis',
    label: 'Table Tennis',
    shortLabel: 'Ping Pong',
    venue: 'Dining Table Arena',
    scoringUnit: 'Points (11-pt Set)',
    defaultWinScore: 11,
  },
  foosball: {
    id: 'foosball',
    label: 'Table Football',
    shortLabel: 'Foosball',
    venue: 'Hallway Pitch',
    scoringUnit: 'Goals (First to 10)',
    defaultWinScore: 10,
  },
  darts: {
    id: 'darts',
    label: '501 Darts',
    shortLabel: 'Darts',
    venue: 'Kitchen Door Oche',
    scoringUnit: 'Legs Won',
    defaultWinScore: 3,
  },
  pool: {
    id: 'pool',
    label: '8-Ball Pool',
    shortLabel: '8-Ball',
    venue: 'Local Pub / Rec Room',
    scoringUnit: 'Frames Won',
    defaultWinScore: 3,
  },
  video_game: {
    id: 'video_game',
    label: 'Console Derby (FIFA / Kart)',
    shortLabel: 'Console',
    venue: 'Living Room Sofa',
    scoringUnit: 'Goals / Races',
    defaultWinScore: 3,
  },
  board_game: {
    id: 'board_game',
    label: 'Tabletop Strategy',
    shortLabel: 'Tabletop',
    venue: 'Coffee Table',
    scoringUnit: 'Victory Points',
    defaultWinScore: 10,
  },
};

export interface League {
  id: string;
  ownerId: string;
  name: string;
  flatCode: string;
  seasonName: string;
  houseStake: string;
  status: 'active' | 'archived';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Player {
  id: string;
  ownerId: string;
  leagueId: string;
  name: string;
  nickname: string;
  roomLabel: string;
  favoriteSport: SportType;
  avatarColor: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  pointsFor: number;
  pointsAgainst: number;
  championships: number;
  status: 'active' | 'retired';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MatchRecord {
  id: string;
  ownerId: string;
  leagueId: string;
  sport: SportType;
  playerOneId: string;
  playerOneName: string;
  playerTwoId: string;
  playerTwoName: string;
  scoreOne: number;
  scoreTwo: number;
  winnerId: string;
  eloDelta: number;
  stakeNote: string;
  isChampionshipMatch: boolean;
  status: 'scheduled' | 'completed';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ForfeitTask {
  id: string;
  ownerId: string;
  leagueId: string;
  assignedToPlayerId: string;
  assignedToName: string;
  title: string;
  reason: string;
  status: 'pending' | 'completed';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// Validation Constraints matching firebase-blueprint.json & firestore.rules verbatim
export const VALIDATION_CONSTRAINTS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  ID_MAX_LEN: 128,
  LEAGUE_NAME_MAX: 80,
  FLAT_CODE_MIN: 2,
  FLAT_CODE_MAX: 24,
  SEASON_NAME_MAX: 80,
  HOUSE_STAKE_MAX: 160,
  PLAYER_NAME_MAX: 50,
  PLAYER_NICKNAME_MAX: 50,
  PLAYER_ROOM_MAX: 40,
  STAKE_NOTE_MAX: 140,
  FORFEIT_TITLE_MAX: 100,
  FORFEIT_REASON_MAX: 140,
} as const;

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  return cleaned.length > 0 ? cleaned : 'id-default';
}

export function sanitizeText(raw: string, maxLength: number, fallback: string): string {
  const trimmed = raw.trim().slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function calculateEloExchange(
  eloA: number,
  eloB: number,
  scoreA: number,
  scoreB: number,
  isChampionshipMatch = false
): { newEloA: number; newEloB: number; delta: number; winner: 'A' | 'B' | 'draw' } {
  const K = isChampionshipMatch ? 40 : 28;
  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  const expectedB = 1 - expectedA;

  let actualA = 0.5;
  let actualB = 0.5;
  let winner: 'A' | 'B' | 'draw' = 'draw';

  if (scoreA > scoreB) {
    actualA = 1;
    actualB = 0;
    winner = 'A';
  } else if (scoreB > scoreA) {
    actualA = 0;
    actualB = 1;
    winner = 'B';
  }

  const rawDeltaA = Math.round(K * (actualA - expectedA));
  const rawDeltaB = Math.round(K * (actualB - expectedB));
  const delta = Math.abs(rawDeltaA);

  const newEloA = Math.min(5000, Math.max(100, eloA + rawDeltaA));
  const newEloB = Math.min(5000, Math.max(100, eloB + rawDeltaB));

  return { newEloA, newEloB, delta, winner };
}
