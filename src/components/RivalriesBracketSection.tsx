import React, { useState, useMemo } from 'react';
import { Swords, Trophy, Play } from 'lucide-react';
import { Player, MatchRecord, SPORTS_CATALOG, SportType } from '../types';

interface RivalriesBracketSectionProps {
  players: Player[];
  matches: MatchRecord[];
  onLaunchMatchInArena: (
    playerOneId: string,
    playerTwoId: string,
    sport: SportType,
    isChampionship: boolean
  ) => void;
}

export const RivalriesBracketSection: React.FC<RivalriesBracketSectionProps> = ({
  players,
  matches,
  onLaunchMatchInArena,
}) => {
  const activePlayers = useMemo(
    () =>
      [...players]
        .filter((p) => p.status === 'active')
        .sort((a, b) => b.elo - a.elo || b.wins - a.wins),
    [players]
  );

  const [rivalOneId, setRivalOneId] = useState<string>(activePlayers[0]?.id || '');
  const [rivalTwoId, setRivalTwoId] = useState<string>(activePlayers[1]?.id || '');
  const [bracketSport, setBracketSport] = useState<SportType>('table_tennis');

  const effectiveOneId = rivalOneId || activePlayers[0]?.id || '';
  const effectiveTwoId =
    rivalTwoId && rivalTwoId !== effectiveOneId
      ? rivalTwoId
      : activePlayers.find((p) => p.id !== effectiveOneId)?.id || '';

  const rivalOne = activePlayers.find((p) => p.id === effectiveOneId);
  const rivalTwo = activePlayers.find((p) => p.id === effectiveTwoId);

  const h2hStats = useMemo(() => {
    if (!rivalOne || !rivalTwo) return null;
    const sharedMatches = matches.filter(
      (m) =>
        m.status === 'completed' &&
        ((m.playerOneId === rivalOne.id && m.playerTwoId === rivalTwo.id) ||
          (m.playerOneId === rivalTwo.id && m.playerTwoId === rivalOne.id))
    );

    let oneWins = 0;
    let twoWins = 0;
    let draws = 0;
    let onePoints = 0;
    let twoPoints = 0;

    for (const m of sharedMatches) {
      const isOneHome = m.playerOneId === rivalOne.id;
      const s1 = isOneHome ? m.scoreOne : m.scoreTwo;
      const s2 = isOneHome ? m.scoreTwo : m.scoreOne;
      onePoints += s1;
      twoPoints += s2;

      if (m.winnerId === rivalOne.id) oneWins += 1;
      else if (m.winnerId === rivalTwo.id) twoWins += 1;
      else draws += 1;
    }

    return {
      sharedMatches,
      oneWins,
      twoWins,
      draws,
      onePoints,
      twoPoints,
    };
  }, [rivalOne, rivalTwo, matches]);

  const topFour = activePlayers.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Head-to-Head Rivalry Comparison */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
              Head-to-Head Flatmate Rivalry Dossier
            </h2>
            <p className="text-sm text-stone-600">
              Compare direct matchup history, aggregate scoring margins, and ELO differentials between any two flatmates.
            </p>
          </div>

          {rivalOne && rivalTwo && (
            <button
              type="button"
              onClick={() =>
                onLaunchMatchInArena(rivalOne.id, rivalTwo.id, rivalOne.favoriteSport, false)
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Play {rivalOne.name} vs {rivalTwo.name}
            </button>
          )}
        </div>

        {activePlayers.length < 2 ? (
          <p className="text-sm text-stone-600">
            Register at least two flatmates to inspect head-to-head rivalry statistics.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label htmlFor="rival-1" className="block text-xs font-medium text-stone-600 mb-1.5">
                  First Flatmate
                </label>
                <select
                  id="rival-1"
                  value={effectiveOneId}
                  onChange={(e) => setRivalOneId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#0F1E19]"
                >
                  {activePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.nickname}) · {p.elo} ELO
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rival-2" className="block text-xs font-medium text-stone-600 mb-1.5">
                  Second Flatmate
                </label>
                <select
                  id="rival-2"
                  value={effectiveTwoId}
                  onChange={(e) => setRivalTwoId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#0F1E19]"
                >
                  {activePlayers
                    .filter((p) => p.id !== effectiveOneId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.nickname}) · {p.elo} ELO
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {rivalOne && rivalTwo && h2hStats && (
              <div className="space-y-6">
                {/* Summary Comparison Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 px-6 bg-stone-50 border border-stone-200 rounded-xl items-center">
                  <div>
                    <div className="text-xs text-stone-500">
                      {rivalOne.roomLabel} · {SPORTS_CATALOG[rivalOne.favoriteSport].shortLabel}
                    </div>
                    <div className="text-2xl font-display font-bold text-[#0F1E19]">
                      {rivalOne.name}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-stone-600 mt-1">
                      {rivalOne.elo} ELO · {h2hStats.onePoints} pts scored in H2H
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs font-mono text-stone-500 mb-1">
                      DIRECT SERIES RECORD
                    </div>
                    <div className="text-4xl font-mono font-bold tabular-nums text-[#0F1E19]">
                      {h2hStats.oneWins} — {h2hStats.twoWins}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-stone-500 mt-1">
                      {h2hStats.sharedMatches.length} Meetings · {h2hStats.draws} Draws
                    </div>
                  </div>

                  <div className="md:text-right">
                    <div className="text-xs text-stone-500">
                      {rivalTwo.roomLabel} · {SPORTS_CATALOG[rivalTwo.favoriteSport].shortLabel}
                    </div>
                    <div className="text-2xl font-display font-bold text-[#0F1E19]">
                      {rivalTwo.name}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-stone-600 mt-1">
                      {rivalTwo.elo} ELO · {h2hStats.twoPoints} pts scored in H2H
                    </div>
                  </div>
                </div>

                {/* Shared Match History List */}
                {h2hStats.sharedMatches.length === 0 ? (
                  <p className="text-sm text-stone-600 py-4">
                    No completed matches recorded between {rivalOne.name} and {rivalTwo.name} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
                    {h2hStats.sharedMatches.map((m) => (
                      <div
                        key={m.id}
                        className="py-3.5 flex flex-wrap items-center justify-between gap-4 text-sm"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-[#0F1E19]">
                            {m.playerOneName} {m.scoreOne} – {m.scoreTwo} {m.playerTwoName}
                          </span>
                          <span className="mx-2 text-stone-400">·</span>
                          <span className="text-xs text-stone-600">
                            {SPORTS_CATALOG[m.sport].label}
                          </span>
                          <span className="mx-2 text-stone-400">·</span>
                          <span className="text-xs text-stone-500">{m.stakeNote}</span>
                        </div>
                        <div className="text-xs font-mono tabular-nums text-stone-600">
                          ±{m.eloDelta} ELO
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Automated House Cup Knockout Seeding Bracket */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
              House Cup Knockout Seeding (Top 4 Flatmates)
            </h2>
            <p className="text-sm text-stone-600">
              Automatically seeded from live ELO standings (#1 vs #4 and #2 vs #3). Launch any bracket tie directly into the Live Scoreboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="bracket-sport" className="text-xs font-medium text-stone-600">
              Cup Discipline:
            </label>
            <select
              id="bracket-sport"
              value={bracketSport}
              onChange={(e) => setBracketSport(e.target.value as SportType)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0F1E19]"
            >
              {(Object.keys(SPORTS_CATALOG) as SportType[]).map((s) => (
                <option key={s} value={s}>
                  {SPORTS_CATALOG[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {topFour.length < 4 ? (
          <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600">
            Currently {topFour.length} active flatmate(s) on the roster. Add at least 4 flatmates to unlock the full 4-seed semifinal knockout bracket, or launch a 2-player Championship Final below.
            {topFour.length >= 2 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    onLaunchMatchInArena(topFour[0].id, topFour[1].id, bracketSport, true)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg transition-colors cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Launch #1 {topFour[0].name} vs #2 {topFour[1].name} Title Final
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Semifinal A: #1 vs #4 */}
            <div className="border border-stone-200 rounded-xl p-5 flex flex-col justify-between bg-stone-50">
              <div>
                <div className="text-xs font-mono text-stone-500 mb-3">
                  SEMIFINAL 01 · SEED #1 VS SEED #4
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-stone-200">
                    <span className="font-semibold text-sm text-[#0F1E19]">
                      #1 {topFour[0].name}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-stone-600">
                      {topFour[0].elo} ELO
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-sm text-[#0F1E19]">
                      #4 {topFour[3].name}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-stone-600">
                      {topFour[3].elo} ELO
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onLaunchMatchInArena(topFour[0].id, topFour[3].id, bracketSport, false)
                }
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F1E19] bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors cursor-pointer"
              >
                <Swords className="w-3.5 h-3.5" />
                Play Semifinal 1
              </button>
            </div>

            {/* Semifinal B: #2 vs #3 */}
            <div className="border border-stone-200 rounded-xl p-5 flex flex-col justify-between bg-stone-50">
              <div>
                <div className="text-xs font-mono text-stone-500 mb-3">
                  SEMIFINAL 02 · SEED #2 VS SEED #3
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-2 border-b border-stone-200">
                    <span className="font-semibold text-sm text-[#0F1E19]">
                      #2 {topFour[1].name}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-stone-600">
                      {topFour[1].elo} ELO
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-sm text-[#0F1E19]">
                      #3 {topFour[2].name}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-stone-600">
                      {topFour[2].elo} ELO
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onLaunchMatchInArena(topFour[1].id, topFour[2].id, bracketSport, false)
                }
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F1E19] bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors cursor-pointer"
              >
                <Swords className="w-3.5 h-3.5" />
                Play Semifinal 2
              </button>
            </div>

            {/* Championship Final */}
            <div className="border border-[#1E3A2F] rounded-xl p-5 flex flex-col justify-between bg-[#0C1713] text-white">
              <div>
                <div className="text-xs font-mono text-amber-400 mb-3">
                  HOUSE CUP GRAND FINAL · K-FACTOR 40
                </div>
                <div className="text-lg font-display font-bold mb-1">
                  #1 {topFour[0].name} vs #2 {topFour[1].name}
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Top two ELO seeds battle for the House Cup trophy. Winner automatically receives +1 Championship Cup on the flat table.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onLaunchMatchInArena(topFour[0].id, topFour[1].id, bracketSport, true)
                }
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0C1713] bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                Launch Championship Final
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
