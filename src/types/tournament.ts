export type PlayerId = 'addy' | 'pg' | 'dave';

export type SportKey =
  | 'cricket'
  | 'basketball'
  | 'bowling'
  | 'table_tennis'
  | 'badminton'
  | 'pool'
  | 'fifa';

export interface ContenderProfile {
  id: PlayerId;
  name: string;
  nickname: string;
  fullTitle: string;
  flatRoom: string;
  signatureMove: string;
  weakness: string;
  accentColor: string;
  badgeBg: string;
}

export const CONTENDERS: Record<PlayerId, ContenderProfile> = {
  addy: {
    id: 'addy',
    name: 'Addy',
    nickname: 'Double ACL',
    fullTitle: 'Addy "Double ACL"',
    flatRoom: 'Flat 2110 · Master Wing',
    signatureMove: 'Surgical Placement & Orthopaedic Grit',
    weakness: 'Sudden lunges without knee sleeves',
    accentColor: '#0F766E',
    badgeBg: '#CCFBF1',
  },
  pg: {
    id: 'pg',
    name: 'PG',
    nickname: 'Koniki Supermodel',
    fullTitle: 'PG "Koniki Supermodel"',
    flatRoom: 'Flat 2110 · Runway Suite',
    signatureMove: 'Effortless Cheekbone Cover Drive',
    weakness: 'Gets distracted when Mia the Beagle begs for belly rubs',
    accentColor: '#B45309',
    badgeBg: '#FEF3C7',
  },
  dave: {
    id: 'dave',
    name: 'Dave',
    nickname: 'Tiger Queen',
    fullTitle: 'Dave "Tiger Queen"',
    flatRoom: 'Flat 2110 · Tiger Den',
    signatureMove: 'Royal Baseline Smash',
    weakness: 'Bai arriving with the broom mid-celebration',
    accentColor: '#BE123C',
    badgeBg: '#FFE4E6',
  },
};

export const PLAYER_IDS: PlayerId[] = ['addy', 'pg', 'dave'];

export interface SportDefinition {
  key: SportKey;
  name: string;
  shortName: string;
  formatLabel: string;
  ruleSummary: string;
  scoringUnit: string;
}

export const SPORTS_DEFINITIONS: Record<SportKey, SportDefinition> = {
  cricket: {
    key: 'cricket',
    name: 'Tri-Series Cricket',
    shortName: 'Cricket',
    formatLabel: '3 Matches · 2 Overs (12 Balls) / Batsman',
    ruleSummary:
      'Win = 3 pts, Draw = 1 pt, Loss = 0 pts. Tiebroken by total runs & strike rate. If a 1-1-1 series tie occurs across all 3 matches, all 3 players receive 1 tournament point each.',
    scoringUnit: 'Runs (12 Balls)',
  },
  basketball: {
    key: 'basketball',
    name: 'Free Throw Basketball',
    shortName: 'Basketball',
    formatLabel: '3 Matches · 10 Shots / Match',
    ruleSummary:
      '3 head-to-head shootout matches, 10 free throws per player per match. Win = 3 pts, Draw = 1 pt, Loss = 0 pts.',
    scoringUnit: 'Buckets / 10',
  },
  bowling: {
    key: 'bowling',
    name: 'Single Session Bowling',
    shortName: 'Bowling',
    formatLabel: 'Single Session · 10 Frames',
    ruleSummary:
      'All 3 flatmates bowl 10 frames in a single session. Highest 10-frame pinfall wins 3 pts; exact tie for highest pinfall awards 1 pt each for a draw.',
    scoringUnit: 'Total Pinfall',
  },
  table_tennis: {
    key: 'table_tennis',
    name: 'Table Tennis',
    shortName: 'Ping Pong',
    formatLabel: '3 H2H Matches · 11-Point Sets',
    ruleSummary: 'Round-robin head-to-head fixtures. Win = 3 pts, Draw = 1 pt, Loss = 0 pts.',
    scoringUnit: 'Set Points',
  },
  badminton: {
    key: 'badminton',
    name: 'Badminton',
    shortName: 'Badminton',
    formatLabel: '3 H2H Matches · 21-Point Court',
    ruleSummary: 'Round-robin head-to-head court clashes. Win = 3 pts, Draw = 1 pt, Loss = 0 pts.',
    scoringUnit: 'Court Points',
  },
  pool: {
    key: 'pool',
    name: '8-Ball Pool',
    shortName: '8-Ball Pool',
    formatLabel: '3 H2H Matches · Best of 3 Frames',
    ruleSummary: 'Round-robin cue battles. Win = 3 pts, Draw = 1 pt, Loss = 0 pts.',
    scoringUnit: 'Frames',
  },
  fifa: {
    key: 'fifa',
    name: 'FIFA Console Derby',
    shortName: 'FIFA',
    formatLabel: '3 H2H Matches · Living Room TV',
    ruleSummary: '90-minute virtual derbies. Win = 3 pts, Draw = 1 pt, Loss = 0 pts.',
    scoringUnit: 'Goals',
  },
};

export const ALL_SPORT_KEYS: SportKey[] = [
  'cricket',
  'basketball',
  'bowling',
  'table_tennis',
  'badminton',
  'pool',
  'fifa',
];

export interface CricketMatch {
  id: string;
  label: string;
  playerA: PlayerId;
  playerB: PlayerId;
  runsA: number;
  ballsA: number; // Max 12 balls (2 overs)
  runsB: number;
  ballsB: number; // Max 12 balls (2 overs)
  completed: boolean;
  note: string;
}

export interface StandardH2HMatch {
  id: string;
  sport: Exclude<SportKey, 'cricket' | 'bowling'>;
  label: string;
  playerA: PlayerId;
  playerB: PlayerId;
  scoreA: number;
  scoreB: number;
  completed: boolean;
  note: string;
}

export interface BowlingSession {
  completed: boolean;
  frames: Record<PlayerId, number[]>; // 10 frames per player
  totalPins: Record<PlayerId, number>;
  note: string;
}

export interface ExcuseEntry {
  id: string;
  playerId: PlayerId;
  sport: SportKey;
  quote: string;
  thartharLevel: number; // 1 to 100 panic/tremble rating
  upvotes: number;
  timestamp: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  subheadline: string;
  body: string;
  category: string;
  author: string;
  timestamp: string;
}

export interface ChoreAssignment {
  id: string;
  playerId: PlayerId;
  choreTitle: string;
  reason: string;
  completed: boolean;
  timestamp: string;
}

export interface PredictionEntry {
  id: string;
  predictorName: string;
  predictedChampion: PlayerId;
  predictedWoodenSpoon: PlayerId;
  predictedCricketKing: PlayerId;
  predictedBowlingKing: PlayerId;
  boldCall: string;
  timestamp: string;
}

export interface TrophyAward {
  id: string;
  title: string;
  subtitle: string;
  criteria: string;
  iconType: 'crown' | 'acl' | 'supermodel' | 'tiger' | 'broom' | 'puppy';
  overrideWinnerId?: PlayerId | null;
}

export interface TournamentState {
  version: number;
  lastUpdated: string;
  tournamentTitle: string;
  flatName: string;
  seasonSubtitle: string;
  goldenBets: Record<PlayerId, SportKey>;
  cricketMatches: CricketMatch[];
  h2hMatches: StandardH2HMatch[];
  bowling: BowlingSession;
  excuses: ExcuseEntry[];
  news: NewsArticle[];
  chores: ChoreAssignment[];
  predictions: PredictionEntry[];
  trophies: TrophyAward[];
  sheruLastQuip: string;
}

export interface ComputedPlayerStanding {
  playerId: PlayerId;
  profile: ContenderProfile;
  basePoints: number;
  goldenBonusPoints: number;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  normalizedDiff: number; // Wins minus Losses (W - L)
  goldenSport: SportKey;
  goldenBetWon: boolean;
  sportPointsBreakdown: Record<SportKey, { base: number; bonus: number; total: number }>;
  cricketStats: {
    runs: number;
    balls: number;
    strikeRate: number;
    wins: number;
    losses: number;
    draws: number;
  };
}

export interface ComputedTournamentSummary {
  standings: ComputedPlayerStanding[];
  sportLeaders: Record<SportKey, PlayerId | 'tie' | null>;
  isCricketThreeWayTie: boolean;
  h2hMatrix: Record<PlayerId, Record<PlayerId, { wins: number; draws: number; losses: number }>>;
}

export function createInitialTournamentState(): TournamentState {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    tournamentTitle: 'Hyberabaddies — Sportsman of the House Championship',
    flatName: 'Flat 2110',
    seasonSubtitle: 'Addy "Double ACL" vs PG "Koniki Supermodel" vs Dave "Tiger Queen"',
    goldenBets: {
      addy: 'cricket',
      pg: 'basketball',
      dave: 'table_tennis',
    },
    cricketMatches: [
      {
        id: 'crick-1',
        label: 'Tri-Series Match 1: Addy vs PG',
        playerA: 'addy',
        playerB: 'pg',
        runsA: 28,
        ballsA: 12,
        runsB: 22,
        ballsB: 12,
        completed: true,
        note: 'Addy dispatched two hallway sixes despite the knee brace.',
      },
      {
        id: 'crick-2',
        label: 'Tri-Series Match 2: PG vs Dave',
        playerA: 'pg',
        playerB: 'dave',
        runsA: 26,
        ballsA: 12,
        runsB: 19,
        ballsB: 12,
        completed: true,
        note: 'PG played the Koniki cover drive while Mia cheered from the sofa.',
      },
      {
        id: 'crick-3',
        label: 'Tri-Series Match 3: Dave vs Addy',
        playerA: 'dave',
        playerB: 'addy',
        runsA: 24,
        ballsA: 12,
        runsB: 31,
        ballsB: 12,
        completed: true,
        note: 'Addy clinched the Tri-Series 2-0 with 258.3 SR.',
      },
    ],
    h2hMatches: [
      // Free Throw Basketball (3 matches, 10 shots per match)
      {
        id: 'bball-1',
        sport: 'basketball',
        label: 'Free Throw Shootout 1 (10 Shots)',
        playerA: 'addy',
        playerB: 'pg',
        scoreA: 6,
        scoreB: 8,
        completed: true,
        note: 'PG drained 8/10 clean swishes.',
      },
      {
        id: 'bball-2',
        sport: 'basketball',
        label: 'Free Throw Shootout 2 (10 Shots)',
        playerA: 'pg',
        playerB: 'dave',
        scoreA: 7,
        scoreB: 5,
        completed: true,
        note: 'PG locked in the Golden Sport Basketball title.',
      },
      {
        id: 'bball-3',
        sport: 'basketball',
        label: 'Free Throw Shootout 3 (10 Shots)',
        playerA: 'dave',
        playerB: 'addy',
        scoreA: 7,
        scoreB: 7,
        completed: true,
        note: 'Sudden pressure draw at 7/10 each.',
      },
      // Table Tennis
      {
        id: 'tt-1',
        sport: 'table_tennis',
        label: 'Table Tennis Clash 1',
        playerA: 'addy',
        playerB: 'pg',
        scoreA: 11,
        scoreB: 9,
        completed: true,
        note: 'Edge-table winner at 10-9.',
      },
      {
        id: 'tt-2',
        sport: 'table_tennis',
        label: 'Table Tennis Clash 2',
        playerA: 'pg',
        playerB: 'dave',
        scoreA: 8,
        scoreB: 11,
        completed: true,
        note: 'Dave unleashed the Tiger Queen forehand smash.',
      },
      {
        id: 'tt-3',
        sport: 'table_tennis',
        label: 'Table Tennis Clash 3',
        playerA: 'dave',
        playerB: 'addy',
        scoreA: 11,
        scoreB: 7,
        completed: true,
        note: 'Dave swept Table Tennis to cash his 2x Golden Bet!',
      },
      // Badminton
      {
        id: 'bad-1',
        sport: 'badminton',
        label: 'Badminton Court Battle 1',
        playerA: 'addy',
        playerB: 'pg',
        scoreA: 21,
        scoreB: 18,
        completed: true,
        note: 'Drop-shot clinic from Addy.',
      },
      {
        id: 'bad-2',
        sport: 'badminton',
        label: 'Badminton Court Battle 2',
        playerA: 'pg',
        playerB: 'dave',
        scoreA: 21,
        scoreB: 16,
        completed: true,
        note: 'PG covered every corner of the court.',
      },
      {
        id: 'bad-3',
        sport: 'badminton',
        label: 'Badminton Court Battle 3',
        playerA: 'dave',
        playerB: 'addy',
        scoreA: 0,
        scoreB: 0,
        completed: false,
        note: 'Upcoming evening court decider.',
      },
      // 8-Ball Pool
      {
        id: 'pool-1',
        sport: 'pool',
        label: '8-Ball Pool Frame Series 1',
        playerA: 'addy',
        playerB: 'pg',
        scoreA: 2,
        scoreB: 1,
        completed: true,
        note: 'Bank shot on the black ball in Frame 3.',
      },
      {
        id: 'pool-2',
        sport: 'pool',
        label: '8-Ball Pool Frame Series 2',
        playerA: 'pg',
        playerB: 'dave',
        scoreA: 0,
        scoreB: 0,
        completed: false,
        note: 'Scheduled club table fixture.',
      },
      {
        id: 'pool-3',
        sport: 'pool',
        label: '8-Ball Pool Frame Series 3',
        playerA: 'dave',
        playerB: 'addy',
        scoreA: 0,
        scoreB: 0,
        completed: false,
        note: 'Scheduled club table fixture.',
      },
      // FIFA Derby
      {
        id: 'fifa-1',
        sport: 'fifa',
        label: 'FIFA Living Room Derby 1',
        playerA: 'addy',
        playerB: 'pg',
        scoreA: 2,
        scoreB: 2,
        completed: true,
        note: '90th-minute equalizer in Flat 2110.',
      },
      {
        id: 'fifa-2',
        sport: 'fifa',
        label: 'FIFA Living Room Derby 2',
        playerA: 'pg',
        playerB: 'dave',
        scoreA: 1,
        scoreB: 3,
        completed: true,
        note: 'Dave celebrated until Bai scolded him.',
      },
      {
        id: 'fifa-3',
        sport: 'fifa',
        label: 'FIFA Living Room Derby 3',
        playerA: 'dave',
        playerB: 'addy',
        scoreA: 0,
        scoreB: 0,
        completed: false,
        note: 'Controller check pending.',
      },
    ],
    bowling: {
      completed: true,
      frames: {
        addy: [12, 15, 14, 18, 11, 13, 16, 14, 15, 17],
        pg: [14, 13, 16, 15, 17, 14, 15, 18, 16, 19],
        dave: [11, 14, 12, 15, 13, 16, 14, 13, 15, 16],
      },
      totalPins: {
        addy: 145,
        pg: 157,
        dave: 139,
      },
      note: 'PG bowled two late strikes in Frames 8 & 10 to take the 10-frame session crown!',
    },
    excuses: [
      {
        id: 'exc-1',
        playerId: 'addy',
        sport: 'basketball',
        quote: 'Bro both my ACLs were clicking on the free-throw line, otherwise that is 10/10.',
        thartharLevel: 84,
        upvotes: 12,
        timestamp: '2026-10-30T19:30:00.000Z',
      },
      {
        id: 'exc-2',
        playerId: 'dave',
        sport: 'cricket',
        quote: 'Bai walked right past the crease waving her jhadu while I was facing the second over!',
        thartharLevel: 92,
        upvotes: 19,
        timestamp: '2026-10-30T21:15:00.000Z',
      },
      {
        id: 'exc-3',
        playerId: 'pg',
        sport: 'table_tennis',
        quote: 'The balcony cross-breeze ruined my Koniki hair parting and curved the ping pong ball.',
        thartharLevel: 78,
        upvotes: 15,
        timestamp: '2026-10-31T14:20:00.000Z',
      },
    ],
    news: [
      {
        id: 'news-1',
        headline: 'DOUBLE ACL DEFIES MEDICAL SCIENCE IN HALLWAY CRICKET MASTERCLASS!',
        subheadline: 'Addy smashes 59 runs across 24 balls to cash his 2x Golden Cricket Bet while Dave blames Bai.',
        body: 'FLAT 2110 — In scenes that baffled orthopaedic surgeons across Hyderabad, Addy "Double ACL" clinched the Tri-Series Cricket crown with an blistering 245.83 strike rate. Meanwhile, PG "Koniki Supermodel" dominated the 10-shot Free Throw line and the 10-frame Bowling lane, leaving Dave "Tiger Queen" relying on his 2x Table Tennis Golden Bet to stay within striking distance.',
        category: 'BREAKING CHAMPIONSHIP DESK',
        author: 'Sheru Chief Correspondent',
        timestamp: '2026-10-31T18:00:00.000Z',
      },
      {
        id: 'news-2',
        headline: 'THARTHAROMETER HITS 92% IN TIGER DEN AFTER BAI CONFISCATES DAVE’S SLIPPERS',
        subheadline: 'Flat 2110 seismographs register heavy trembling ahead of the Badminton & Pool deciders.',
        body: 'Sources inside Flat 2110 confirm that Bai stormed into the living room at 9:15 AM demanding to know who left three unwashed protein shakers near the TV. While Mia the Beagle immediately ran to PG for protection, Dave "Tiger Queen" was seen retreating to his room.',
        category: 'FLAT 2110 GOSSIP GAZETTE',
        author: 'Hyberabaddies Wire',
        timestamp: '2026-10-31T20:30:00.000Z',
      },
    ],
    chores: [
      {
        id: 'chore-1',
        playerId: 'dave',
        choreTitle: 'Make Masala Chai for Bai & Wash All Protein Shakers',
        reason: 'Lost Tri-Series Cricket 0-2 and triggered 92% on the Thartharometer',
        completed: false,
        timestamp: '2026-10-31T12:00:00.000Z',
      },
      {
        id: 'chore-2',
        playerId: 'addy',
        choreTitle: 'Evening Walk Duty for Mia the Beagle',
        reason: 'Runner-up in Free Throw Basketball Shootout vs PG',
        completed: true,
        timestamp: '2026-10-30T22:00:00.000Z',
      },
    ],
    predictions: [
      {
        id: 'pred-1',
        predictorName: 'Sheru the Tiger',
        predictedChampion: 'addy',
        predictedWoodenSpoon: 'dave',
        predictedCricketKing: 'addy',
        predictedBowlingKing: 'pg',
        boldCall: 'Dave will register at least 3 more excuses blaming controller lag before Sunday.',
        timestamp: '2026-10-29T10:00:00.000Z',
      },
    ],
    trophies: [
      {
        id: 'trophy-crown',
        title: 'Sportsman of the House Crown',
        subtitle: 'Overall #1 Flat 2110 Champion',
        criteria: 'Awarded to the #1 contender on Total Points & Normalized Match Differential.',
        iconType: 'crown',
        overrideWinnerId: null,
      },
      {
        id: 'trophy-acl',
        title: 'The Titanium Double-ACL Medallion',
        subtitle: 'Tri-Series Sixes & Grit Award',
        criteria: 'Highest Strike Rate & Runs in Flat 2110 Tri-Series Cricket.',
        iconType: 'acl',
        overrideWinnerId: 'addy',
      },
      {
        id: 'trophy-supermodel',
        title: 'The Koniki Golden Mirror',
        subtitle: 'Precision Shooting & Pinfall Elegance',
        criteria: 'Best combined accuracy in Free Throw Basketball & 10-Frame Bowling.',
        iconType: 'supermodel',
        overrideWinnerId: 'pg',
      },
      {
        id: 'trophy-tiger',
        title: 'Tiger Queen’s Reflex Blade',
        subtitle: 'Table Tennis & Console Supremacy',
        criteria: 'Undefeated table-top reflex king of Flat 2110.',
        iconType: 'tiger',
        overrideWinnerId: 'dave',
      },
      {
        id: 'trophy-broom',
        title: 'Bai’s Golden Jhadu of Fear',
        subtitle: 'Highest Thartharometer Excuse Rating',
        criteria: 'Held by the flatmate with the highest panic & excuse score.',
        iconType: 'broom',
        overrideWinnerId: 'dave',
      },
      {
        id: 'trophy-puppy',
        title: 'Mia’s Best Belly-Rub VIP Pass',
        subtitle: 'Unconditional Beagle Loyalty Award',
        criteria: 'Forever awarded to PG ("Koniki Supermodel").',
        iconType: 'puppy',
        overrideWinnerId: 'pg',
      },
    ],
    sheruLastQuip:
      'ROAR! Welcome to Flat 2110! Addy is flexing on one knee, PG is posing with Mia the Beagle, and Dave is hiding from Bai’s broom!',
  };
}

/**
 * Computes the complete tournament standings, normalized match differential (W - L),
 * Tri-Series 1-1-1 tie rule, Single Session Bowling winner/tie rule, and 2x Golden Sport multiplier.
 */
export function computeTournamentSummary(state: TournamentState): ComputedTournamentSummary {
  const baseSportPoints: Record<PlayerId, Record<SportKey, number>> = {
    addy: { cricket: 0, basketball: 0, bowling: 0, table_tennis: 0, badminton: 0, pool: 0, fifa: 0 },
    pg: { cricket: 0, basketball: 0, bowling: 0, table_tennis: 0, badminton: 0, pool: 0, fifa: 0 },
    dave: { cricket: 0, basketball: 0, bowling: 0, table_tennis: 0, badminton: 0, pool: 0, fifa: 0 },
  };

  const overallCounts: Record<
    PlayerId,
    { played: number; wins: number; draws: number; losses: number }
  > = {
    addy: { played: 0, wins: 0, draws: 0, losses: 0 },
    pg: { played: 0, wins: 0, draws: 0, losses: 0 },
    dave: { played: 0, wins: 0, draws: 0, losses: 0 },
  };

  const h2hMatrix: Record<
    PlayerId,
    Record<PlayerId, { wins: number; draws: number; losses: number }>
  > = {
    addy: {
      addy: { wins: 0, draws: 0, losses: 0 },
      pg: { wins: 0, draws: 0, losses: 0 },
      dave: { wins: 0, draws: 0, losses: 0 },
    },
    pg: {
      addy: { wins: 0, draws: 0, losses: 0 },
      pg: { wins: 0, draws: 0, losses: 0 },
      dave: { wins: 0, draws: 0, losses: 0 },
    },
    dave: {
      addy: { wins: 0, draws: 0, losses: 0 },
      pg: { wins: 0, draws: 0, losses: 0 },
      dave: { wins: 0, draws: 0, losses: 0 },
    },
  };

  const cricketStats: Record<
    PlayerId,
    { runs: number; balls: number; strikeRate: number; wins: number; losses: number; draws: number }
  > = {
    addy: { runs: 0, balls: 0, strikeRate: 0, wins: 0, losses: 0, draws: 0 },
    pg: { runs: 0, balls: 0, strikeRate: 0, wins: 0, losses: 0, draws: 0 },
    dave: { runs: 0, balls: 0, strikeRate: 0, wins: 0, losses: 0, draws: 0 },
  };

  // 1. Evaluate Tri-Series Cricket (3 matches, 2 overs / 12 balls per batsman)
  const completedCricket = state.cricketMatches.filter((m) => m.completed);
  for (const m of completedCricket) {
    const pA = m.playerA;
    const pB = m.playerB;
    cricketStats[pA].runs += m.runsA;
    cricketStats[pA].balls += m.ballsA;
    cricketStats[pB].runs += m.runsB;
    cricketStats[pB].balls += m.ballsB;

    overallCounts[pA].played += 1;
    overallCounts[pB].played += 1;

    // Strike rate for single-match tiebreak if runs are equal
    const srA = m.ballsA > 0 ? (m.runsA / m.ballsA) * 100 : 0;
    const srB = m.ballsB > 0 ? (m.runsB / m.ballsB) * 100 : 0;

    if (m.runsA > m.runsB || (m.runsA === m.runsB && srA > srB)) {
      cricketStats[pA].wins += 1;
      cricketStats[pB].losses += 1;
      overallCounts[pA].wins += 1;
      overallCounts[pB].losses += 1;
      h2hMatrix[pA][pB].wins += 1;
      h2hMatrix[pB][pA].losses += 1;
      baseSportPoints[pA].cricket += 3;
    } else if (m.runsB > m.runsA || (m.runsA === m.runsB && srB > srA)) {
      cricketStats[pB].wins += 1;
      cricketStats[pA].losses += 1;
      overallCounts[pB].wins += 1;
      overallCounts[pA].losses += 1;
      h2hMatrix[pB][pA].wins += 1;
      h2hMatrix[pA][pB].losses += 1;
      baseSportPoints[pB].cricket += 3;
    } else {
      cricketStats[pA].draws += 1;
      cricketStats[pB].draws += 1;
      overallCounts[pA].draws += 1;
      overallCounts[pB].draws += 1;
      h2hMatrix[pA][pB].draws += 1;
      h2hMatrix[pB][pA].draws += 1;
      baseSportPoints[pA].cricket += 1;
      baseSportPoints[pB].cricket += 1;
    }
  }

  for (const pid of PLAYER_IDS) {
    const st = cricketStats[pid];
    st.strikeRate = st.balls > 0 ? Number(((st.runs / st.balls) * 100).toFixed(1)) : 0;
  }

  // Check Tri-Series Cricket 1-1-1 Tie Rule:
  // "If a 1-1-1 tie occurs, all 3 players receive 1 point."
  const isCricketThreeWayTie =
    completedCricket.length === 3 &&
    cricketStats.addy.wins === 1 &&
    cricketStats.pg.wins === 1 &&
    cricketStats.dave.wins === 1;

  if (isCricketThreeWayTie) {
    baseSportPoints.addy.cricket = 1;
    baseSportPoints.pg.cricket = 1;
    baseSportPoints.dave.cricket = 1;
  }

  // 2. Evaluate Standard H2H Sports (Basketball, Table Tennis, Badminton, Pool, FIFA)
  for (const m of state.h2hMatches) {
    if (!m.completed) continue;
    const pA = m.playerA;
    const pB = m.playerB;
    overallCounts[pA].played += 1;
    overallCounts[pB].played += 1;

    if (m.scoreA > m.scoreB) {
      overallCounts[pA].wins += 1;
      overallCounts[pB].losses += 1;
      h2hMatrix[pA][pB].wins += 1;
      h2hMatrix[pB][pA].losses += 1;
      baseSportPoints[pA][m.sport] += 3;
    } else if (m.scoreB > m.scoreA) {
      overallCounts[pB].wins += 1;
      overallCounts[pA].losses += 1;
      h2hMatrix[pB][pA].wins += 1;
      h2hMatrix[pA][pB].losses += 1;
      baseSportPoints[pB][m.sport] += 3;
    } else {
      overallCounts[pA].draws += 1;
      overallCounts[pB].draws += 1;
      h2hMatrix[pA][pB].draws += 1;
      h2hMatrix[pB][pA].draws += 1;
      baseSportPoints[pA][m.sport] += 1;
      baseSportPoints[pB][m.sport] += 1;
    }
  }

  // 3. Evaluate Single Session Bowling (10 frames, highest pinfall wins 3 pts; exact tie awards 1 pt each for a draw)
  if (state.bowling.completed) {
    const pins = state.bowling.totalPins;
    const maxPinfall = Math.max(pins.addy, pins.pg, pins.dave);
    if (maxPinfall > 0) {
      const topBowlers = PLAYER_IDS.filter((pid) => pins[pid] === maxPinfall);
      for (const pid of PLAYER_IDS) {
        overallCounts[pid].played += 1;
      }

      if (topBowlers.length === 1) {
        const winner = topBowlers[0];
        baseSportPoints[winner].bowling = 3;
        overallCounts[winner].wins += 1;
        for (const pid of PLAYER_IDS) {
          if (pid !== winner) {
            overallCounts[pid].losses += 1;
          }
        }
      } else {
        // Exact tie for highest pinfall awards 1 point each for a draw
        for (const pid of PLAYER_IDS) {
          if (topBowlers.includes(pid)) {
            baseSportPoints[pid].bowling = 1;
            overallCounts[pid].draws += 1;
          } else {
            overallCounts[pid].losses += 1;
          }
        }
      }
    }
  }

  // 4. Determine Leader for Each Sport (for Golden Sport 2x Multiplier)
  const sportLeaders: Record<SportKey, PlayerId | 'tie' | null> = {
    cricket: null,
    basketball: null,
    bowling: null,
    table_tennis: null,
    badminton: null,
    pool: null,
    fifa: null,
  };

  for (const sk of ALL_SPORT_KEYS) {
    const scores = PLAYER_IDS.map((pid) => ({ pid, pts: baseSportPoints[pid][sk] }));
    const maxPts = Math.max(...scores.map((s) => s.pts));
    if (maxPts <= 0) {
      sportLeaders[sk] = null;
      continue;
    }
    const leaders = scores.filter((s) => s.pts === maxPts);
    if (leaders.length === 1) {
      sportLeaders[sk] = leaders[0].pid;
    } else if (sk === 'cricket' && !isCricketThreeWayTie) {
      // Cricket tiebreak by runs, then strike rate
      const sortedCricket = [...leaders].sort((a, b) => {
        const cA = cricketStats[a.pid];
        const cB = cricketStats[b.pid];
        if (cB.runs !== cA.runs) return cB.runs - cA.runs;
        return cB.strikeRate - cA.strikeRate;
      });
      const first = cricketStats[sortedCricket[0].pid];
      const second = cricketStats[sortedCricket[1].pid];
      if (first.runs !== second.runs || first.strikeRate !== second.strikeRate) {
        sportLeaders[sk] = sortedCricket[0].pid;
      } else {
        sportLeaders[sk] = 'tie';
      }
    } else {
      sportLeaders[sk] = 'tie';
    }
  }

  // 5. Build ComputedPlayerStanding with 2x Golden Sport Multiplier and Normalized Match Differential (W - L)
  const standings: ComputedPlayerStanding[] = PLAYER_IDS.map((pid) => {
    const goldenSport = state.goldenBets[pid];
    const goldenBetWon = sportLeaders[goldenSport] === pid;

    const sportPointsBreakdown = {} as Record<
      SportKey,
      { base: number; bonus: number; total: number }
    >;

    let basePoints = 0;
    let goldenBonusPoints = 0;

    for (const sk of ALL_SPORT_KEYS) {
      const base = baseSportPoints[pid][sk];
      const isGoldenWinner = sk === goldenSport && goldenBetWon;
      const bonus = isGoldenWinner ? base : 0; // 2x multiplier doubles all points in that sport
      sportPointsBreakdown[sk] = {
        base,
        bonus,
        total: base + bonus,
      };
      basePoints += base;
      goldenBonusPoints += bonus;
    }

    const counts = overallCounts[pid];
    const normalizedDiff = counts.wins - counts.losses;

    return {
      playerId: pid,
      profile: CONTENDERS[pid],
      basePoints,
      goldenBonusPoints,
      totalPoints: basePoints + goldenBonusPoints,
      matchesPlayed: counts.played,
      wins: counts.wins,
      draws: counts.draws,
      losses: counts.losses,
      normalizedDiff,
      goldenSport,
      goldenBetWon,
      sportPointsBreakdown,
      cricketStats: cricketStats[pid],
    };
  });

  // Sort by Total Points DESC, then Normalized Match Differential (Wins - Losses) DESC, then Wins DESC
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.normalizedDiff !== a.normalizedDiff) return b.normalizedDiff - a.normalizedDiff;
    return b.wins - a.wins;
  });

  return {
    standings,
    sportLeaders,
    isCricketThreeWayTie,
    h2hMatrix,
  };
}
