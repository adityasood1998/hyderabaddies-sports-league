import React, { useState } from 'react';
import { Flag, Gauge, ThumbsUp, Plus } from 'lucide-react';
import {
  TournamentState,
  ComputedTournamentSummary,
  CONTENDERS,
  PLAYER_IDS,
  PlayerId,
  SportKey,
  ALL_SPORT_KEYS,
  SPORTS_DEFINITIONS,
} from '../types/tournament';

interface TrophyRaceAndExcusesProps {
  state: TournamentState;
  summary: ComputedTournamentSummary;
  onUpdateState: (updater: (prev: TournamentState) => TournamentState) => Promise<void>;
}

export const TrophyRaceAndExcuses: React.FC<TrophyRaceAndExcusesProps> = ({
  state,
  summary,
  onUpdateState,
}) => {
  const [excusePlayer, setExcusePlayer] = useState<PlayerId>('dave');
  const [excuseSport, setExcuseSport] = useState<SportKey>('cricket');
  const [excuseQuote, setExcuseQuote] = useState<string>('');
  const [thartharLevel, setThartharLevel] = useState<number>(85);

  const maxTargetPoints = Math.max(
    30,
    ...summary.standings.map((s) => s.totalPoints + 6)
  );

  // Compute Thartharometer Pressure per flatmate
  const playerPressure = PLAYER_IDS.map((pid) => {
    const playerExcuses = state.excuses.filter((e) => e.playerId === pid);
    const avgLevel =
      playerExcuses.length > 0
        ? Math.round(
            playerExcuses.reduce((acc, item) => acc + item.thartharLevel, 0) /
              playerExcuses.length
          )
        : 25;
    const totalUpvotes = playerExcuses.reduce((acc, item) => acc + item.upvotes, 0);
    const compositePressure = Math.min(100, avgLevel + Math.min(15, totalUpvotes));
    return {
      playerId: pid,
      profile: CONTENDERS[pid],
      excuseCount: playerExcuses.length,
      pressure: compositePressure,
    };
  }).sort((a, b) => b.pressure - a.pressure);

  const flatOverallPressure =
    playerPressure.length > 0
      ? Math.round(
          playerPressure.reduce((acc, p) => acc + p.pressure, 0) / playerPressure.length
        )
      : 50;

  const handleAddExcuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseQuote.trim()) return;

    const newExcuse = {
      id: `exc-${Date.now()}`,
      playerId: excusePlayer,
      sport: excuseSport,
      quote: excuseQuote.trim(),
      thartharLevel: Math.min(100, Math.max(10, thartharLevel)),
      upvotes: 1,
      timestamp: new Date().toISOString(),
    };

    await onUpdateState((prev) => ({
      ...prev,
      excuses: [newExcuse, ...prev.excuses],
    }));

    setExcuseQuote('');
  };

  const handleUpvoteExcuse = async (id: string) => {
    await onUpdateState((prev) => ({
      ...prev,
      excuses: prev.excuses.map((ex) =>
        ex.id === id
          ? {
              ...ex,
              upvotes: ex.upvotes + 1,
              thartharLevel: Math.min(100, ex.thartharLevel + 2),
            }
          : ex
      ),
    }));
  };

  return (
    <div className="space-y-8">
      {/* 1. TROPHY RACE TRACK */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono text-stone-500">
              FLAT 2110 CHAMPIONSHIP GRAND PRIX · LIVE POINTS PROGRESSION
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
              Sportsman of the House Trophy Race Track
            </h2>
          </div>
          <div className="text-xs font-mono tabular-nums text-stone-600">
            Finish Line Scale: {maxTargetPoints} Tournament Pts
          </div>
        </div>

        <div className="space-y-6 bg-[#0C1713] text-white p-6 rounded-xl border border-[#1E3A2F]">
          {summary.standings.map((st, idx) => {
            const pct = Math.min(
              96,
              Math.max(8, Math.round((st.totalPoints / maxTargetPoints) * 100))
            );
            return (
              <div key={st.playerId} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-amber-400 font-bold mr-2">LANE 0{idx + 1}</span>
                    <span className="font-bold text-white">{st.profile.fullTitle}</span>
                    <span className="mx-2 text-stone-500">·</span>
                    <span className="text-stone-300">
                      Base {st.basePoints} + Golden Bonus {st.goldenBonusPoints}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-amber-300">
                    {st.totalPoints} PTS ({st.normalizedDiff >= 0 ? `+${st.normalizedDiff}` : st.normalizedDiff} W-L)
                  </div>
                </div>

                {/* Race Lane Track */}
                <div className="relative h-11 bg-[#142620] border border-[#25463A] rounded-lg overflow-hidden flex items-center">
                  {/* Track Yard Lines */}
                  <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={i} className="border-r border-[#1E3A2F]/60 h-full" />
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div
                    className="h-full transition-all duration-500 flex items-center justify-end pr-3 rounded-r-lg"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: st.profile.accentColor,
                    }}
                  >
                    <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
                      {st.profile.name} · {st.totalPoints}p
                    </span>
                  </div>

                  {/* Finish Flag at Right */}
                  <div className="ml-auto pr-3 text-amber-400 z-10">
                    <Flag className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. EXCUSE LEADERBOARD & THARTHAROMETER PRESSURE GAUGE */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Thartharometer Pressure Gauge & Contender Tremble Levels */}
          <div className="lg:col-span-5 bg-[#0C1713] text-white border border-[#1E3A2F] rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-rose-400">
                  OFFICIAL FLAT 2110 SEISMOGRAPH
                </div>
                <h3 className="text-2xl font-display font-bold text-white">
                  The Thartharometer Gauge
                </h3>
              </div>
              <Gauge className="w-7 h-7 text-rose-400" />
            </div>

            {/* SVG Pressure Dial */}
            <div className="flex flex-col items-center py-4 bg-[#12231D] rounded-xl border border-[#224236]">
              <svg viewBox="0 0 200 115" className="w-52 h-28">
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#1E3A2F"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * flatOverallPressure) / 100}
                />
                <text
                  x="100"
                  y="85"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="26"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {flatOverallPressure}%
                </text>
                <text
                  x="100"
                  y="104"
                  textAnchor="middle"
                  fill="#FDA4AF"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  HOUSE TREMBLING INDEX
                </text>
              </svg>
            </div>

            {/* Per-Player Thartharometer Bars */}
            <div className="space-y-3">
              {playerPressure.map((pp) => (
                <div key={pp.playerId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-200">
                      {pp.profile.fullTitle} ({pp.excuseCount} excuses)
                    </span>
                    <span className="text-rose-400 font-bold">{pp.pressure}% Panic</span>
                  </div>
                  <div className="h-2.5 bg-[#152821] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${pp.pressure}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Log New Excuse Form */}
            <form onSubmit={handleAddExcuse} className="pt-4 border-t border-[#1E3A2F] space-y-3">
              <div className="text-xs font-mono text-amber-400">
                LOG NEW FLAT 2110 EXCUSE
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={excusePlayer}
                  onChange={(e) => setExcusePlayer(e.target.value as PlayerId)}
                  className="bg-[#12231D] border border-[#2A4D3E] rounded-lg px-2.5 py-2 text-xs text-white"
                >
                  {PLAYER_IDS.map((pid) => (
                    <option key={pid} value={pid}>
                      {CONTENDERS[pid].fullTitle}
                    </option>
                  ))}
                </select>

                <select
                  value={excuseSport}
                  onChange={(e) => setExcuseSport(e.target.value as SportKey)}
                  className="bg-[#12231D] border border-[#2A4D3E] rounded-lg px-2.5 py-2 text-xs text-white"
                >
                  {ALL_SPORT_KEYS.map((sk) => (
                    <option key={sk} value={sk}>
                      {SPORTS_DEFINITIONS[sk].shortName}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                required
                value={excuseQuote}
                onChange={(e) => setExcuseQuote(e.target.value)}
                placeholder='e.g., "My Double ACL flared up right on the 9th bowling frame!"'
                className="w-full bg-[#12231D] border border-[#2A4D3E] rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500"
              />

              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-mono text-stone-300">
                  Tharthar Level: {thartharLevel}%
                </label>
                <input
                  type="range"
                  min={15}
                  max={100}
                  value={thartharLevel}
                  onChange={(e) => setThartharLevel(Number(e.target.value))}
                  className="w-32 accent-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#0C1713] bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register Official Excuse
              </button>
            </form>
          </div>

          {/* Right Column: Excuse Leaderboard */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className="text-2xl font-display font-bold text-[#0F1E19]">
                Certified Excuse Leaderboard
              </h3>
              <p className="text-sm text-stone-600">
                Every time Addy blames his knees, PG blames hair wind-resistance, or Dave blames Bai’s broom, Flat 2110 records it for posterity.
              </p>
            </div>

            <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {state.excuses.map((ex) => {
                const profile = CONTENDERS[ex.playerId];
                const sportDef = SPORTS_DEFINITIONS[ex.sport];
                return (
                  <div
                    key={ex.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-stone-500">
                        <span className="font-bold text-[#0F1E19]">
                          {profile.fullTitle}
                        </span>
                        <span className="mx-2">·</span>
                        <span>{sportDef.name}</span>
                        <span className="mx-2">·</span>
                        <span className="font-mono text-rose-700 font-semibold">
                          Thartharometer: {ex.thartharLevel}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#0F1E19]">
                        “{ex.quote}”
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvoteExcuse(ex.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg self-start sm:self-center whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cope +1 ({ex.upvotes})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
