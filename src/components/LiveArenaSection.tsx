import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  RotateCcw,
  Trophy,
  Calendar,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import {
  Player,
  SportType,
  SPORTS_CATALOG,
  VALIDATION_CONSTRAINTS,
  calculateEloExchange,
} from '../types';
import { recordMatchAndStats } from '../services/leagueService';
import { SportCourtBadge } from './SportVisuals';

interface LiveArenaSectionProps {
  leagueId: string;
  players: Player[];
  initialPlayerOneId?: string;
  initialPlayerTwoId?: string;
  initialSport?: SportType;
  initialIsChampionship?: boolean;
  onMatchSaved: () => void;
}

export const LiveArenaSection: React.FC<LiveArenaSectionProps> = ({
  leagueId,
  players,
  initialPlayerOneId,
  initialPlayerTwoId,
  initialSport = 'table_tennis',
  initialIsChampionship = false,
  onMatchSaved,
}) => {
  const activePlayers = players.filter((p) => p.status === 'active');

  const [sport, setSport] = useState<SportType>(initialSport);
  const [playerOneId, setPlayerOneId] = useState<string>(
    initialPlayerOneId || activePlayers[0]?.id || ''
  );
  const [playerTwoId, setPlayerTwoId] = useState<string>(
    initialPlayerTwoId || activePlayers[1]?.id || ''
  );
  const [scoreOne, setScoreOne] = useState<number>(0);
  const [scoreTwo, setScoreTwo] = useState<number>(0);
  const [mode, setMode] = useState<'completed' | 'scheduled'>('completed');
  const [isChampionshipMatch, setIsChampionshipMatch] = useState<boolean>(
    initialIsChampionship
  );
  const [stakeNote, setStakeNote] = useState<string>(
    'Official flat championship fixture'
  );
  const [forfeitChore, setForfeitChore] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialPlayerOneId) setPlayerOneId(initialPlayerOneId);
    if (initialPlayerTwoId) setPlayerTwoId(initialPlayerTwoId);
    if (initialSport) setSport(initialSport);
    setIsChampionshipMatch(Boolean(initialIsChampionship));
  }, [initialPlayerOneId, initialPlayerTwoId, initialSport, initialIsChampionship]);

  useEffect(() => {
    if (!playerOneId && activePlayers[0]) {
      setPlayerOneId(activePlayers[0].id);
    }
    if (!playerTwoId && activePlayers[1]) {
      setPlayerTwoId(activePlayers[1].id);
    }
  }, [activePlayers, playerOneId, playerTwoId]);

  const playerOne = activePlayers.find((p) => p.id === playerOneId);
  const playerTwo = activePlayers.find((p) => p.id === playerTwoId);
  const currentSportMeta = SPORTS_CATALOG[sport];

  const swapPlayers = () => {
    setPlayerOneId(playerTwoId);
    setPlayerTwoId(playerOneId);
    setScoreOne(scoreTwo);
    setScoreTwo(scoreOne);
  };

  // Live ELO Projection
  const eloPreview =
    playerOne && playerTwo && playerOne.id !== playerTwo.id
      ? calculateEloExchange(
          playerOne.elo,
          playerTwo.elo,
          scoreOne,
          scoreTwo,
          isChampionshipMatch
        )
      : null;

  const hypotheticalP1Win =
    playerOne && playerTwo && playerOne.id !== playerTwo.id
      ? calculateEloExchange(playerOne.elo, playerTwo.elo, 11, 5, isChampionshipMatch)
      : null;

  const hypotheticalP2Win =
    playerOne && playerTwo && playerOne.id !== playerTwo.id
      ? calculateEloExchange(playerOne.elo, playerTwo.elo, 5, 11, isChampionshipMatch)
      : null;

  const totalPointsPlayed = scoreOne + scoreTwo;
  // In table tennis, serve switches every 2 points
  const currentServer =
    Math.floor(totalPointsPlayed / 2) % 2 === 0
      ? playerOne?.name || 'Player 1'
      : playerTwo?.name || 'Player 2';

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerOne || !playerTwo || playerOne.id === playerTwo.id) {
      setFeedback('Select two distinct flatmates to record an official match.');
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await recordMatchAndStats({
        leagueId,
        sport,
        playerOne,
        playerTwo,
        scoreOne: mode === 'scheduled' ? 0 : scoreOne,
        scoreTwo: mode === 'scheduled' ? 0 : scoreTwo,
        stakeNote:
          stakeNote.trim() || `${currentSportMeta.label} match at ${currentSportMeta.venue}`,
        isChampionshipMatch,
        status: mode,
        autoCreateForfeitTitle: mode === 'completed' ? forfeitChore.trim() : undefined,
      });

      setScoreOne(0);
      setScoreTwo(0);
      setForfeitChore('');
      setFeedback(
        mode === 'completed'
          ? 'Match result logged and flatmate ELO standings updated.'
          : 'Upcoming derby added to the flat fixture schedule.'
      );
      onMatchSaved();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Could not save match.');
    } finally {
      setSubmitting(false);
    }
  };

  if (activePlayers.length < 2) {
    return (
      <section className="bg-white border border-stone-200 rounded-xl p-8">
        <h2 className="text-2xl font-display font-bold text-[#0F1E19] mb-2">
          Live Scoreboard &amp; Match Logger
        </h2>
        <p className="text-sm text-stone-600">
          Add at least two flatmates to your roster in the Standings view before starting a head-to-head match.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Discipline Selector Strip */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
              Live Scoreboard &amp; Official Match Desk
            </h2>
            <p className="text-sm text-stone-600">
              Track points table-side in real time or log a completed flatmate result directly to the ELO ledger.
            </p>
          </div>

          {/* Interactive Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setMode('completed')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'completed'
                  ? 'bg-[#0F2922] text-white'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Live / Final Score
            </button>
            <button
              type="button"
              onClick={() => setMode('scheduled')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'scheduled'
                  ? 'bg-[#0F2922] text-white'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Schedule Future Derby
            </button>
          </div>
        </div>

        {/* Sport Discipline Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(Object.keys(SPORTS_CATALOG) as SportType[]).map((sportKey) => {
            const meta = SPORTS_CATALOG[sportKey];
            const isSelected = sport === sportKey;
            return (
              <button
                key={sportKey}
                type="button"
                onClick={() => setSport(sportKey)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F2922] text-white border-[#0F2922]'
                    : 'bg-stone-50 text-[#0F1E19] border-stone-200 hover:border-stone-400'
                }`}
              >
                <SportCourtBadge sport={sportKey} className="w-8 h-8 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{meta.shortLabel}</div>
                  <div
                    className={`text-[11px] truncate ${
                      isSelected ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    Target {meta.defaultWinScore}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scoreboard Console */}
      <form onSubmit={handleSaveMatch} className="bg-[#0C1713] text-white rounded-xl p-6 lg:p-8 border border-[#1E3A2F]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#1E3A2F]">
          <div className="text-xs text-emerald-300 font-mono tabular-nums">
            <span>{currentSportMeta.label}</span>
            <span className="mx-2">·</span>
            <span>{currentSportMeta.venue}</span>
            <span className="mx-2">·</span>
            <span>{currentSportMeta.scoringUnit}</span>
          </div>

          <div className="flex items-center gap-4">
            {sport === 'table_tennis' && mode === 'completed' && (
              <span className="text-xs font-mono tabular-nums text-amber-300">
                Current Serve: {currentServer}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setScoreOne(0);
                setScoreTwo(0);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-[#152821] hover:bg-[#1E3A2F] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Score
            </button>
          </div>
        </div>

        {/* Two-Sided Scoreboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          {/* Player 1 Console */}
          <div className="lg:col-span-5 bg-[#12231D] border border-[#224236] rounded-xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <label htmlFor="arena-p1" className="text-xs text-stone-400 font-mono">
                HOME CORNER · PLAYER 01
              </label>
              {playerOne && (
                <span className="text-xs font-mono tabular-nums text-emerald-400">
                  {playerOne.elo} ELO · {playerOne.wins}W-{playerOne.losses}L
                </span>
              )}
            </div>

            <select
              id="arena-p1"
              value={playerOneId}
              onChange={(e) => setPlayerOneId(e.target.value)}
              className="w-full bg-[#0C1713] border border-[#2A4D3E] rounded-lg px-3.5 py-2.5 text-base font-semibold text-white mb-5 focus:outline-none focus:border-amber-400"
            >
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.nickname}) — {p.roomLabel}
                </option>
              ))}
            </select>

            {mode === 'completed' && (
              <div className="flex items-center justify-between gap-4">
                <div className="text-6xl sm:text-7xl font-mono font-bold tabular-nums tracking-tight text-white">
                  {String(scoreOne).padStart(2, '0')}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScoreOne((s) => Math.max(0, s - 1))}
                    aria-label="Decrease Player 1 Score"
                    className="w-11 h-11 rounded-lg bg-[#1A332A] hover:bg-[#244539] flex items-center justify-center text-stone-200 transition-colors cursor-pointer"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreOne((s) => Math.min(1000, s + 1))}
                    aria-label="Increase Player 1 Score"
                    className="px-4 h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0C1713] font-bold text-sm flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Point
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreOne(currentSportMeta.defaultWinScore)}
                    className="px-3 h-11 rounded-lg bg-[#1A332A] hover:bg-[#244539] text-xs font-mono tabular-nums text-stone-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Set {currentSportMeta.defaultWinScore}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center Swap & ELO Delta Column */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={swapPlayers}
              title="Swap Sides"
              className="w-10 h-10 rounded-full bg-[#152821] hover:bg-[#1E3A2F] border border-[#2A4D3E] flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-stone-400">VS</span>
          </div>

          {/* Player 2 Console */}
          <div className="lg:col-span-5 bg-[#12231D] border border-[#224236] rounded-xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <label htmlFor="arena-p2" className="text-xs text-stone-400 font-mono">
                AWAY CORNER · PLAYER 02
              </label>
              {playerTwo && (
                <span className="text-xs font-mono tabular-nums text-emerald-400">
                  {playerTwo.elo} ELO · {playerTwo.wins}W-{playerTwo.losses}L
                </span>
              )}
            </div>

            <select
              id="arena-p2"
              value={playerTwoId}
              onChange={(e) => setPlayerTwoId(e.target.value)}
              className="w-full bg-[#0C1713] border border-[#2A4D3E] rounded-lg px-3.5 py-2.5 text-base font-semibold text-white mb-5 focus:outline-none focus:border-amber-400"
            >
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.nickname}) — {p.roomLabel}
                </option>
              ))}
            </select>

            {mode === 'completed' && (
              <div className="flex items-center justify-between gap-4">
                <div className="text-6xl sm:text-7xl font-mono font-bold tabular-nums tracking-tight text-white">
                  {String(scoreTwo).padStart(2, '0')}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScoreTwo((s) => Math.max(0, s - 1))}
                    aria-label="Decrease Player 2 Score"
                    className="w-11 h-11 rounded-lg bg-[#1A332A] hover:bg-[#244539] flex items-center justify-center text-stone-200 transition-colors cursor-pointer"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreTwo((s) => Math.min(1000, s + 1))}
                    aria-label="Increase Player 2 Score"
                    className="px-4 h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0C1713] font-bold text-sm flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Point
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreTwo(currentSportMeta.defaultWinScore)}
                    className="px-3 h-11 rounded-lg bg-[#1A332A] hover:bg-[#244539] text-xs font-mono tabular-nums text-stone-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Set {currentSportMeta.defaultWinScore}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live ELO Exchange Telemetry Bar */}
        {playerOne && playerTwo && playerOne.id !== playerTwo.id && (
          <div className="mt-6 pt-5 border-t border-[#1E3A2F] flex flex-wrap items-center justify-between gap-4 text-xs font-mono tabular-nums text-stone-300">
            <div>
              <span>Stakes Projection: </span>
              {hypotheticalP1Win && (
                <span>
                  If {playerOne.name} wins: +{hypotheticalP1Win.delta} ELO
                </span>
              )}
              <span className="mx-2">·</span>
              {hypotheticalP2Win && (
                <span>
                  If {playerTwo.name} wins: +{hypotheticalP2Win.delta} ELO
                </span>
              )}
            </div>
            {mode === 'completed' && eloPreview && (
              <div className="text-amber-300">
                {eloPreview.winner === 'A'
                  ? `Current Leader: ${playerOne.name} (+${eloPreview.delta} ELO -> ${eloPreview.newEloA})`
                  : eloPreview.winner === 'B'
                  ? `Current Leader: ${playerTwo.name} (+${eloPreview.delta} ELO -> ${eloPreview.newEloB})`
                  : 'Match Tied · Draw Rating Adjustment'}
              </div>
            )}
          </div>
        )}

        {/* Match Metadata & Chore Stake Inputs */}
        <div className="mt-6 pt-6 border-t border-[#1E3A2F] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stake-note" className="block text-xs text-stone-300 mb-1.5">
              Match Report / Fixture Note (max {VALIDATION_CONSTRAINTS.STAKE_NOTE_MAX} chars)
            </label>
            <input
              id="stake-note"
              type="text"
              maxLength={VALIDATION_CONSTRAINTS.STAKE_NOTE_MAX}
              value={stakeNote}
              onChange={(e) => setStakeNote(e.target.value)}
              placeholder="e.g., Deciding set deuce thriller over the dining room table"
              className="w-full bg-[#12231D] border border-[#2A4D3E] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {mode === 'completed' ? (
            <div>
              <label htmlFor="forfeit-chore" className="block text-xs text-stone-300 mb-1.5">
                Auto-Assign Loser Chore Forfeit (optional, max {VALIDATION_CONSTRAINTS.FORFEIT_TITLE_MAX} chars)
              </label>
              <input
                id="forfeit-chore"
                type="text"
                maxLength={VALIDATION_CONSTRAINTS.FORFEIT_TITLE_MAX}
                value={forfeitChore}
                onChange={(e) => setForfeitChore(e.target.value)}
                placeholder="e.g., Empty dishwasher & take out recycling bins"
                className="w-full bg-[#12231D] border border-[#2A4D3E] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          ) : (
            <div className="flex items-end">
              <div className="text-xs text-stone-400 py-2.5">
                Scheduled derbies appear in the Matches tab so flatmates can enter the final score once played.
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2.5 text-sm text-stone-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isChampionshipMatch}
              onChange={(e) => setIsChampionshipMatch(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Championship Cup Match (K-Factor 40 + Awards Cup to Winner)</span>
          </label>

          <button
            type="submit"
            disabled={submitting || playerOneId === playerTwoId}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0C1713] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {mode === 'completed' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Recording Match...' : 'Save Official Result'}
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                {submitting ? 'Scheduling...' : 'Add Fixture to Schedule'}
              </>
            )}
          </button>
        </div>

        {feedback && (
          <div className="mt-4 text-xs font-mono text-amber-300 bg-[#152821] px-4 py-2.5 rounded-lg">
            {feedback}
          </div>
        )}
      </form>
    </div>
  );
};
