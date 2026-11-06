import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  League,
  Player,
  MatchRecord,
  ForfeitTask,
  SportType,
  VALIDATION_CONSTRAINTS,
  sanitizeText,
  calculateEloExchange,
} from '../types';

function generateCleanId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function createLeague(input: {
  name: string;
  flatCode: string;
  seasonName: string;
  houseStake: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be signed in.');

  const leagueId = generateCleanId('league');
  const cleanCode = input.flatCode
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '-')
    .slice(0, VALIDATION_CONSTRAINTS.FLAT_CODE_MAX);
  const validFlatCode = cleanCode.length >= 2 ? cleanCode : 'FLAT-01';

  const payload = {
    ownerId: uid,
    name: sanitizeText(input.name, VALIDATION_CONSTRAINTS.LEAGUE_NAME_MAX, 'Flat Premier League'),
    flatCode: validFlatCode,
    seasonName: sanitizeText(input.seasonName, VALIDATION_CONSTRAINTS.SEASON_NAME_MAX, 'Season 1'),
    houseStake: sanitizeText(
      input.houseStake,
      VALIDATION_CONSTRAINTS.HOUSE_STAKE_MAX,
      'Winner gets Golden Spatula; Last place deep-cleans kitchen'
    ),
    status: 'active' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const path = `leagues/${leagueId}`;
  try {
    await setDoc(doc(db, 'leagues', leagueId), payload);
    return leagueId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLeagueDetails(
  leagueId: string,
  input: {
    name: string;
    flatCode: string;
    seasonName: string;
    houseStake: string;
  }
): Promise<void> {
  const cleanCode = input.flatCode
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '-')
    .slice(0, VALIDATION_CONSTRAINTS.FLAT_CODE_MAX);
  const validFlatCode = cleanCode.length >= 2 ? cleanCode : 'FLAT-01';

  const path = `leagues/${leagueId}`;
  try {
    await updateDoc(doc(db, 'leagues', leagueId), {
      name: sanitizeText(input.name, VALIDATION_CONSTRAINTS.LEAGUE_NAME_MAX, 'Flat Premier League'),
      flatCode: validFlatCode,
      seasonName: sanitizeText(input.seasonName, VALIDATION_CONSTRAINTS.SEASON_NAME_MAX, 'Season 1'),
      houseStake: sanitizeText(
        input.houseStake,
        VALIDATION_CONSTRAINTS.HOUSE_STAKE_MAX,
        'Golden Cup & Kitchen Duty'
      ),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addFlatmatePlayer(input: {
  leagueId: string;
  name: string;
  nickname: string;
  roomLabel: string;
  favoriteSport: SportType;
  avatarColor: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be signed in.');

  const playerId = generateCleanId('player');
  const payload = {
    ownerId: uid,
    leagueId: input.leagueId,
    name: sanitizeText(input.name, VALIDATION_CONSTRAINTS.PLAYER_NAME_MAX, 'Flatmate'),
    nickname: sanitizeText(input.nickname, VALIDATION_CONSTRAINTS.PLAYER_NICKNAME_MAX, 'The Challenger'),
    roomLabel: sanitizeText(input.roomLabel, VALIDATION_CONSTRAINTS.PLAYER_ROOM_MAX, 'Room 1'),
    favoriteSport: input.favoriteSport,
    avatarColor: sanitizeText(input.avatarColor, 24, '#0F766E'),
    elo: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    championships: 0,
    status: 'active' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const path = `players/${playerId}`;
  try {
    await setDoc(doc(db, 'players', playerId), payload);
    return playerId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function awardPlayerCup(player: Player): Promise<void> {
  const path = `players/${player.id}`;
  try {
    await updateDoc(doc(db, 'players', player.id), {
      elo: player.elo,
      wins: player.wins,
      losses: player.losses,
      draws: player.draws,
      streak: player.streak,
      pointsFor: player.pointsFor,
      pointsAgainst: player.pointsAgainst,
      championships: Math.min(1000, player.championships + 1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFlatmatePlayer(playerId: string): Promise<void> {
  const path = `players/${playerId}`;
  try {
    await deleteDoc(doc(db, 'players', playerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordMatchAndStats(input: {
  leagueId: string;
  sport: SportType;
  playerOne: Player;
  playerTwo: Player;
  scoreOne: number;
  scoreTwo: number;
  stakeNote: string;
  isChampionshipMatch: boolean;
  status: 'scheduled' | 'completed';
  autoCreateForfeitTitle?: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be signed in.');

  const matchId = generateCleanId('match');
  const cleanScoreOne = Math.min(1000, Math.max(0, Math.round(input.scoreOne)));
  const cleanScoreTwo = Math.min(1000, Math.max(0, Math.round(input.scoreTwo)));

  const eloCalc =
    input.status === 'completed'
      ? calculateEloExchange(
          input.playerOne.elo,
          input.playerTwo.elo,
          cleanScoreOne,
          cleanScoreTwo,
          input.isChampionshipMatch
        )
      : { newEloA: input.playerOne.elo, newEloB: input.playerTwo.elo, delta: 0, winner: 'draw' as const };

  let winnerId = 'pending';
  if (input.status === 'completed') {
    if (eloCalc.winner === 'A') winnerId = input.playerOne.id;
    else if (eloCalc.winner === 'B') winnerId = input.playerTwo.id;
    else winnerId = 'draw';
  }

  const matchPayload = {
    ownerId: uid,
    leagueId: input.leagueId,
    sport: input.sport,
    playerOneId: input.playerOne.id,
    playerOneName: sanitizeText(input.playerOne.name, VALIDATION_CONSTRAINTS.PLAYER_NAME_MAX, 'Player 1'),
    playerTwoId: input.playerTwo.id,
    playerTwoName: sanitizeText(input.playerTwo.name, VALIDATION_CONSTRAINTS.PLAYER_NAME_MAX, 'Player 2'),
    scoreOne: cleanScoreOne,
    scoreTwo: cleanScoreTwo,
    winnerId,
    eloDelta: eloCalc.delta,
    stakeNote: sanitizeText(
      input.stakeNote,
      VALIDATION_CONSTRAINTS.STAKE_NOTE_MAX,
      'Official house fixture'
    ),
    isChampionshipMatch: Boolean(input.isChampionshipMatch),
    status: input.status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const matchPath = `matches/${matchId}`;
  try {
    await setDoc(doc(db, 'matches', matchId), matchPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, matchPath);
  }

  if (input.status === 'completed') {
    await applyCompletedMatchToPlayers(
      input.playerOne,
      input.playerTwo,
      cleanScoreOne,
      cleanScoreTwo,
      eloCalc.newEloA,
      eloCalc.newEloB,
      eloCalc.winner,
      input.isChampionshipMatch
    );

    if (input.autoCreateForfeitTitle && input.autoCreateForfeitTitle.trim().length > 0 && eloCalc.winner !== 'draw') {
      const loser = eloCalc.winner === 'A' ? input.playerTwo : input.playerOne;
      const winner = eloCalc.winner === 'A' ? input.playerOne : input.playerTwo;
      await createForfeitTask({
        leagueId: input.leagueId,
        assignedToPlayer: loser,
        title: input.autoCreateForfeitTitle,
        reason: `Lost ${Math.max(cleanScoreOne, cleanScoreTwo)}-${Math.min(cleanScoreOne, cleanScoreTwo)} vs ${winner.name}`,
      });
    }
  }

  return matchId;
}

export async function completeScheduledMatch(input: {
  match: MatchRecord;
  playerOne: Player;
  playerTwo: Player;
  scoreOne: number;
  scoreTwo: number;
  stakeNote: string;
}): Promise<void> {
  const cleanScoreOne = Math.min(1000, Math.max(0, Math.round(input.scoreOne)));
  const cleanScoreTwo = Math.min(1000, Math.max(0, Math.round(input.scoreTwo)));

  const eloCalc = calculateEloExchange(
    input.playerOne.elo,
    input.playerTwo.elo,
    cleanScoreOne,
    cleanScoreTwo,
    input.match.isChampionshipMatch
  );

  let winnerId = 'draw';
  if (eloCalc.winner === 'A') winnerId = input.playerOne.id;
  else if (eloCalc.winner === 'B') winnerId = input.playerTwo.id;

  const matchPath = `matches/${input.match.id}`;
  try {
    await updateDoc(doc(db, 'matches', input.match.id), {
      scoreOne: cleanScoreOne,
      scoreTwo: cleanScoreTwo,
      winnerId,
      eloDelta: eloCalc.delta,
      stakeNote: sanitizeText(
        input.stakeNote,
        VALIDATION_CONSTRAINTS.STAKE_NOTE_MAX,
        input.match.stakeNote
      ),
      status: 'completed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, matchPath);
  }

  await applyCompletedMatchToPlayers(
    input.playerOne,
    input.playerTwo,
    cleanScoreOne,
    cleanScoreTwo,
    eloCalc.newEloA,
    eloCalc.newEloB,
    eloCalc.winner,
    input.match.isChampionshipMatch
  );
}

async function applyCompletedMatchToPlayers(
  playerOne: Player,
  playerTwo: Player,
  scoreOne: number,
  scoreTwo: number,
  newEloOne: number,
  newEloTwo: number,
  winner: 'A' | 'B' | 'draw',
  isChampionshipMatch: boolean
): Promise<void> {
  const p1Won = winner === 'A';
  const p2Won = winner === 'B';
  const isDraw = winner === 'draw';

  const nextStreakOne = isDraw
    ? 0
    : p1Won
    ? playerOne.streak >= 0
      ? playerOne.streak + 1
      : 1
    : playerOne.streak <= 0
    ? playerOne.streak - 1
    : -1;

  const nextStreakTwo = isDraw
    ? 0
    : p2Won
    ? playerTwo.streak >= 0
      ? playerTwo.streak + 1
      : 1
    : playerTwo.streak <= 0
    ? playerTwo.streak - 1
    : -1;

  const p1Path = `players/${playerOne.id}`;
  try {
    await updateDoc(doc(db, 'players', playerOne.id), {
      elo: newEloOne,
      wins: Math.min(10000, playerOne.wins + (p1Won ? 1 : 0)),
      losses: Math.min(10000, playerOne.losses + (p2Won ? 1 : 0)),
      draws: Math.min(10000, playerOne.draws + (isDraw ? 1 : 0)),
      streak: Math.max(-1000, Math.min(1000, nextStreakOne)),
      pointsFor: Math.min(1000000, playerOne.pointsFor + scoreOne),
      pointsAgainst: Math.min(1000000, playerOne.pointsAgainst + scoreTwo),
      championships: Math.min(
        1000,
        playerOne.championships + (isChampionshipMatch && p1Won ? 1 : 0)
      ),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, p1Path);
  }

  const p2Path = `players/${playerTwo.id}`;
  try {
    await updateDoc(doc(db, 'players', playerTwo.id), {
      elo: newEloTwo,
      wins: Math.min(10000, playerTwo.wins + (p2Won ? 1 : 0)),
      losses: Math.min(10000, playerTwo.losses + (p1Won ? 1 : 0)),
      draws: Math.min(10000, playerTwo.draws + (isDraw ? 1 : 0)),
      streak: Math.max(-1000, Math.min(1000, nextStreakTwo)),
      pointsFor: Math.min(1000000, playerTwo.pointsFor + scoreTwo),
      pointsAgainst: Math.min(1000000, playerTwo.pointsAgainst + scoreOne),
      championships: Math.min(
        1000,
        playerTwo.championships + (isChampionshipMatch && p2Won ? 1 : 0)
      ),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, p2Path);
  }
}

export async function createForfeitTask(input: {
  leagueId: string;
  assignedToPlayer: Player;
  title: string;
  reason: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User must be signed in.');

  const forfeitId = generateCleanId('forfeit');
  const payload = {
    ownerId: uid,
    leagueId: input.leagueId,
    assignedToPlayerId: input.assignedToPlayer.id,
    assignedToName: sanitizeText(
      input.assignedToPlayer.name,
      VALIDATION_CONSTRAINTS.PLAYER_NAME_MAX,
      'Flatmate'
    ),
    title: sanitizeText(
      input.title,
      VALIDATION_CONSTRAINTS.FORFEIT_TITLE_MAX,
      'Unload Dishwasher & Wipe Counters'
    ),
    reason: sanitizeText(
      input.reason,
      VALIDATION_CONSTRAINTS.FORFEIT_REASON_MAX,
      'Match forfeit penalty'
    ),
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const path = `forfeits/${forfeitId}`;
  try {
    await setDoc(doc(db, 'forfeits', forfeitId), payload);
    return forfeitId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function completeForfeitTask(forfeitId: string): Promise<void> {
  const path = `forfeits/${forfeitId}`;
  try {
    await updateDoc(doc(db, 'forfeits', forfeitId), {
      status: 'completed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteForfeitTask(forfeitId: string): Promise<void> {
  const path = `forfeits/${forfeitId}`;
  try {
    await deleteDoc(doc(db, 'forfeits', forfeitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedSampleFlatLeague(): Promise<string> {
  const leagueId = await createLeague({
    name: 'Flat 4B Premier Federation',
    flatCode: 'FLAT-4B',
    seasonName: 'Autumn House Cup 2026',
    houseStake: 'Champion claims the Brass Cup & balcony hammock; Last place scrubs the oven & takes out recycling for 2 weeks',
  });

  const rosterSpecs: Array<{
    name: string;
    nickname: string;
    roomLabel: string;
    favoriteSport: SportType;
    avatarColor: string;
  }> = [
    {
      name: 'Aditya',
      nickname: 'Topspin Architect',
      roomLabel: 'Room 1 · En-Suite',
      favoriteSport: 'table_tennis',
      avatarColor: '#0F766E',
    },
    {
      name: 'Marcus',
      nickname: 'Backhand Bandit',
      roomLabel: 'Room 2 · Balcony',
      favoriteSport: 'foosball',
      avatarColor: '#B45309',
    },
    {
      name: 'Elena',
      nickname: 'Triple Twenty',
      roomLabel: 'Room 3 · Garden View',
      favoriteSport: 'darts',
      avatarColor: '#BE123C',
    },
    {
      name: 'Sam',
      nickname: 'Corner Pocket',
      roomLabel: 'Room 4 · Loft',
      favoriteSport: 'pool',
      avatarColor: '#1D4ED8',
    },
  ];

  const createdPlayers: Player[] = [];
  const uid = auth.currentUser?.uid || '';

  for (const spec of rosterSpecs) {
    const pid = await addFlatmatePlayer({
      leagueId,
      ...spec,
    });
    createdPlayers.push({
      id: pid,
      ownerId: uid,
      leagueId,
      name: spec.name,
      nickname: spec.nickname,
      roomLabel: spec.roomLabel,
      favoriteSport: spec.favoriteSport,
      avatarColor: spec.avatarColor,
      elo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      championships: 0,
      status: 'active',
    });
  }

  // Helper to update local tracker as we seed sequential matches
  const syncLocalStats = (
    pA: Player,
    pB: Player,
    sA: number,
    sB: number,
    isChamp: boolean
  ) => {
    const calc = calculateEloExchange(pA.elo, pB.elo, sA, sB, isChamp);
    pA.elo = calc.newEloA;
    pB.elo = calc.newEloB;
    pA.pointsFor += sA;
    pA.pointsAgainst += sB;
    pB.pointsFor += sB;
    pB.pointsAgainst += sA;
    if (calc.winner === 'A') {
      pA.wins += 1;
      pB.losses += 1;
      pA.streak = pA.streak >= 0 ? pA.streak + 1 : 1;
      pB.streak = pB.streak <= 0 ? pB.streak - 1 : -1;
      if (isChamp) pA.championships += 1;
    } else if (calc.winner === 'B') {
      pB.wins += 1;
      pA.losses += 1;
      pB.streak = pB.streak >= 0 ? pB.streak + 1 : 1;
      pA.streak = pA.streak <= 0 ? pA.streak - 1 : -1;
      if (isChamp) pB.championships += 1;
    } else {
      pA.draws += 1;
      pB.draws += 1;
      pA.streak = 0;
      pB.streak = 0;
    }
  };

  // Seed 4 completed matches + 1 scheduled derby
  const [pAditya, pMarcus, pElena, pSam] = createdPlayers;

  await recordMatchAndStats({
    leagueId,
    sport: 'table_tennis',
    playerOne: pAditya,
    playerTwo: pMarcus,
    scoreOne: 11,
    scoreTwo: 8,
    stakeNote: 'Edge-ball winner on match point over the dining table net',
    isChampionshipMatch: false,
    status: 'completed',
  });
  syncLocalStats(pAditya, pMarcus, 11, 8, false);

  await recordMatchAndStats({
    leagueId,
    sport: 'darts',
    playerOne: pElena,
    playerTwo: pSam,
    scoreOne: 3,
    scoreTwo: 1,
    stakeNote: 'Double-16 checkout with Sam waiting on 32',
    isChampionshipMatch: false,
    status: 'completed',
  });
  syncLocalStats(pElena, pSam, 3, 1, false);

  await recordMatchAndStats({
    leagueId,
    sport: 'foosball',
    playerOne: pMarcus,
    playerTwo: pSam,
    scoreOne: 10,
    scoreTwo: 4,
    stakeNote: 'No spinning rule enforced strictly; loser handles kitchen bin run',
    isChampionshipMatch: false,
    status: 'completed',
    autoCreateForfeitTitle: 'Take out kitchen bins & glass recycling crate',
  });
  syncLocalStats(pMarcus, pSam, 10, 4, false);

  await recordMatchAndStats({
    leagueId,
    sport: 'table_tennis',
    playerOne: pAditya,
    playerTwo: pElena,
    scoreOne: 12,
    scoreTwo: 10,
    stakeNote: 'Deuce thriller for the October Mini-Shield',
    isChampionshipMatch: true,
    status: 'completed',
  });
  syncLocalStats(pAditya, pElena, 12, 10, true);

  await recordMatchAndStats({
    leagueId,
    sport: 'video_game',
    playerOne: pElena,
    playerTwo: pMarcus,
    scoreOne: 0,
    scoreTwo: 0,
    stakeNote: 'Friday 21:00 Living Room Derby · Loser brews Saturday morning coffee',
    isChampionshipMatch: false,
    status: 'scheduled',
  });

  await createForfeitTask({
    leagueId,
    assignedToPlayer: pMarcus,
    title: 'Brew Saturday morning flat-whites for the whole flat',
    reason: 'Lost dining-table ping pong opener 11-8',
  });

  return leagueId;
}
