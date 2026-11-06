import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Flame,
  BarChart3,
  RotateCcw,
} from 'lucide-react';
import {
  TournamentState,
  ComputedTournamentSummary,
  SportKey,
  ALL_SPORT_KEYS,
  SPORTS_DEFINITIONS,
  CONTENDERS,
  PLAYER_IDS,
  PlayerId,
} from '../types/tournament';
import { playMortalKombatAnnouncer } from '../utils/audioEffects';

interface SportsFixturesAndAnalyticsProps {
  state: TournamentState;
  summary: ComputedTournamentSummary;
  isAdminUnlocked: boolean;
  onRequireUnlock: () => void;
  onUpdateState: (updater: (prev: TournamentState) => TournamentState) => Promise<void>;
}

export const SportsFixturesAndAnalytics: React.FC<SportsFixturesAndAnalyticsProps> = ({
  state,
  summary,
  isAdminUnlocked,
  onRequireUnlock,
  onUpdateState,
}) => {
  const [selectedSport, setSelectedSport] = useState<SportKey>('cricket');
  const [viewMode, setViewMode] = useState<'fixtures' | 'analytics'>('fixtures');

  const handleUpdateCricketMatch = async (
    matchId: string,
    field: 'runsA' | 'ballsA' | 'runsB' | 'ballsB' | 'completed' | 'note',
    value: number | boolean | string
  ) => {
    if (!isAdminUnlocked) {
      onRequireUnlock();
      return;
    }

    if (field === 'completed' && value === true) {
      playMortalKombatAnnouncer('FIGHT!');
    }

    await onUpdateState((prev) => ({
      ...prev,
      cricketMatches: prev.cricketMatches.map((m) => {
        if (m.id !== matchId) return m;
        const updated = { ...m, [field]: value };
        updated.ballsA = Math.min(12, Math.max(1, Number(updated.ballsA) || 12));
        updated.ballsB = Math.min(12, Math.max(1, Number(updated.ballsB) || 12));
        updated.runsA = Math.max(0, Math.min(144, Number(updated.runsA) || 0));
        updated.runsB = Math.max(0, Math.min(144, Number(updated.runsB) || 0));
        return updated;
      }),
    }));
  };

  const handleUpdateH2HMatch = async (
    matchId: string,
    field: 'scoreA' | 'scoreB' | 'completed' | 'note',
    value: number | boolean | string
  ) => {
    if (!isAdminUnlocked) {
      onRequireUnlock();
      return;
    }

    await onUpdateState((prev) => ({
      ...prev,
      h2hMatches: prev.h2hMatches.map((m) => {
        if (m.id !== matchId) return m;
        const updated = { ...m, [field]: value };
        if (m.sport === 'basketball') {
          // 10 shots per match cap
          updated.scoreA = Math.min(10, Math.max(0, Number(updated.scoreA) || 0));
          updated.scoreB = Math.min(10, Math.max(0, Number(updated.scoreB) || 0));
        } else {
          updated.scoreA = Math.max(0, Math.min(200, Number(updated.scoreA) || 0));
          updated.scoreB = Math.max(0, Math.min(200, Number(updated.scoreB) || 0));
        }
        if (field === 'completed' && value === true) {
          const diff = Math.abs(updated.scoreA - updated.scoreB);
          playMortalKombatAnnouncer(diff >= 5 ? 'FLAWLESS VICTORY' : 'FATALITY!');
        }
        return updated;
      }),
    }));
  };

  const handleUpdateBowlingFrame = async (
    playerId: PlayerId,
    frameIndex: number,
    pinVal: number
  ) => {
    if (!isAdminUnlocked) {
      onRequireUnlock();
      return;
    }
    const cleanPin = Math.min(30, Math.max(0, Math.round(pinVal) || 0));

    await onUpdateState((prev) => {
      const nextFrames = [...prev.bowling.frames[playerId]];
      nextFrames[frameIndex] = cleanPin;
      const nextTotal = nextFrames.reduce((acc, v) => acc + v, 0);

      return {
        ...prev,
        bowling: {
          ...prev.bowling,
          frames: {
            ...prev.bowling.frames,
            [playerId]: nextFrames,
          },
          totalPins: {
            ...prev.bowling.totalPins,
            [playerId]: nextTotal,
          },
        },
      };
    });
  };

  const handleUpdateBowlingTotalDirect = async (playerId: PlayerId, totalVal: number) => {
    if (!isAdminUnlocked) {
      onRequireUnlock();
      return;
    }
    const cleanTotal = Math.min(300, Math.max(0, Math.round(totalVal) || 0));
    const basePerFrame = Math.floor(cleanTotal / 10);
    const remainder = cleanTotal % 10;
    const newFrames = Array.from({ length: 10 }, (_, idx) =>
      idx === 9 ? basePerFrame + remainder : basePerFrame
    );

    await onUpdateState((prev) => ({
      ...prev,
      bowling: {
        ...prev.bowling,
        frames: {
          ...prev.bowling.frames,
          [playerId]: newFrames,
        },
        totalPins: {
          ...prev.bowling.totalPins,
          [playerId]: cleanTotal,
        },
      },
    }));
  };

  const handleToggleBowlingCompleted = async (completed: boolean) => {
    if (!isAdminUnlocked) {
      onRequireUnlock();
      return;
    }
    if (completed) {
      playMortalKombatAnnouncer('FLAWLESS VICTORY');
    }
    await onUpdateState((prev) => ({
      ...prev,
      bowling: {
        ...prev.bowling,
        completed,
      },
    }));
  };

  const currentSportDef = SPORTS_DEFINITIONS[selectedSport];

  return (
    <div className="space-y-8">
      {/* Sub-Navigation & Admin Lock Indicator */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
              Sports Fixtures Loggers &amp; Results Analytics
            </h2>
            <p className="text-sm text-stone-600">
              All sports award Win = 3 pts, Draw = 1 pt, Loss = 0 pts. Overall ranking uses Normalized Match Differential (W - L).
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('fixtures')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'fixtures'
                    ? 'bg-[#0F2922] text-white'
                    : 'text-stone-700 hover:text-[#0F1E19]'
                }`}
              >
                Sports Fixtures Loggers
              </button>
              <button
                type="button"
                onClick={() => setViewMode('analytics')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'analytics'
                    ? 'bg-[#0F2922] text-white'
                    : 'text-stone-700 hover:text-[#0F1E19]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
                Results Analytics
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'fixtures' && (
          <>
            {/* Sport Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-100 rounded-xl mb-6">
              {ALL_SPORT_KEYS.map((sk) => {
                const def = SPORTS_DEFINITIONS[sk];
                const leader = summary.sportLeaders[sk];
                const isSelected = selectedSport === sk;
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => setSelectedSport(sk)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F2922] text-white'
                        : 'text-stone-700 hover:bg-white'
                    }`}
                  >
                    <span>{def.name}</span>
                    {leader && leader !== 'tie' && (
                      <span
                        className={`ml-1.5 font-mono text-[10px] ${
                          isSelected ? 'text-amber-300' : 'text-stone-500'
                        }`}
                      >
                        · {CONTENDERS[leader].name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Sport Rule Header */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-mono text-stone-500">
                  {currentSportDef.formatLabel} · UNIT: {currentSportDef.scoringUnit}
                </div>
                <div className="text-lg font-display font-bold text-[#0F1E19] mt-0.5">
                  {currentSportDef.name}
                </div>
                <p className="text-xs text-stone-600 mt-0.5">{currentSportDef.ruleSummary}</p>
              </div>

              {!isAdminUnlocked && (
                <button
                  type="button"
                  onClick={onRequireUnlock}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Unlock Admin (PIN 7777) to Edit Scores
                </button>
              )}
            </div>

            {/* 1. TRI-SERIES CRICKET LOGGER */}
            {selectedSport === 'cricket' && (
              <div className="space-y-6">
                {summary.isCricketThreeWayTie && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs font-mono text-amber-900">
                    1-1-1 TRI-SERIES TIE RULE ACTIVE: All 3 players won 1 match each, so all 3 players are awarded 1 tournament point each! Tiebreaker standings sorted by total runs &amp; strike rate below.
                  </div>
                )}

                {/* Cricket Summary Table (Runs, Balls, Strike Rate) */}
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-mono text-stone-500">
                        <th className="py-2.5 px-4">BATSMAN</th>
                        <th className="py-2.5 px-3 text-right">W-D-L</th>
                        <th className="py-2.5 px-3 text-right">TOTAL RUNS</th>
                        <th className="py-2.5 px-3 text-right">BALLS (2 OVERS/M)</th>
                        <th className="py-2.5 px-3 text-right">STRIKE RATE</th>
                        <th className="py-2.5 px-4 text-right">TOURNAMENT PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {summary.standings.map((st) => {
                        const c = st.cricketStats;
                        const sp = st.sportPointsBreakdown.cricket;
                        return (
                          <tr key={st.playerId}>
                            <td className="py-3 px-4 font-semibold text-[#0F1E19]">
                              {st.profile.fullTitle}
                              {st.goldenSport === 'cricket' && (
                                <span className="ml-2 text-xs font-mono text-amber-700">
                                  · 2x Golden Pick
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                              {c.wins}-{c.draws}-{c.losses}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                              {c.runs}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-stone-600">
                              {c.balls}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-emerald-700 font-semibold">
                              {c.strikeRate.toFixed(1)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0F1E19]">
                              {sp.total} pts
                              {sp.bonus > 0 && (
                                <span className="text-xs text-amber-700 ml-1">
                                  ({sp.base}+{sp.bonus} 2x)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 3 Tri-Series Matches */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {state.cricketMatches.map((m) => {
                    const pA = CONTENDERS[m.playerA];
                    const pB = CONTENDERS[m.playerB];
                    const srA = m.ballsA > 0 ? ((m.runsA / m.ballsA) * 100).toFixed(1) : '0.0';
                    const srB = m.ballsB > 0 ? ((m.runsB / m.ballsB) * 100).toFixed(1) : '0.0';

                    return (
                      <div
                        key={m.id}
                        className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-[#0F1E19]">
                            {m.label}
                          </span>
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.completed}
                              onChange={(e) =>
                                handleUpdateCricketMatch(m.id, 'completed', e.target.checked)
                              }
                              className="w-4 h-4 accent-[#0F2922] cursor-pointer"
                            />
                            <span>{m.completed ? 'Completed' : 'Pending'}</span>
                          </label>
                        </div>

                        {/* Player A Row */}
                        <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#0F1E19]">{pA.fullTitle}</span>
                            <span className="font-mono tabular-nums text-emerald-700">
                              SR: {srA}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono text-stone-500">
                                RUNS
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={144}
                                value={m.runsA}
                                onChange={(e) =>
                                  handleUpdateCricketMatch(
                                    m.id,
                                    'runsA',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-sm font-mono tabular-nums font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-stone-500">
                                BALLS (MAX 12)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={m.ballsA}
                                onChange={(e) =>
                                  handleUpdateCricketMatch(
                                    m.id,
                                    'ballsA',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-sm font-mono tabular-nums"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Player B Row */}
                        <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#0F1E19]">{pB.fullTitle}</span>
                            <span className="font-mono tabular-nums text-emerald-700">
                              SR: {srB}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono text-stone-500">
                                RUNS
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={144}
                                value={m.runsB}
                                onChange={(e) =>
                                  handleUpdateCricketMatch(
                                    m.id,
                                    'runsB',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-sm font-mono tabular-nums font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-stone-500">
                                BALLS (MAX 12)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={m.ballsB}
                                onChange={(e) =>
                                  handleUpdateCricketMatch(
                                    m.id,
                                    'ballsB',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-sm font-mono tabular-nums"
                              />
                            </div>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={m.note}
                          onChange={(e) =>
                            handleUpdateCricketMatch(m.id, 'note', e.target.value)
                          }
                          placeholder="Match commentary..."
                          className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. SINGLE SESSION BOWLING LOGGER (10 Frames) */}
            {selectedSport === 'bowling' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-xs font-mono text-stone-700">
                    10-Frame Single Session Status:{' '}
                    <strong>{state.bowling.completed ? 'Official Result' : 'In Progress'}</strong> ·
                    Winner receives 3 pts (Exact tie for highest pinfall awards 1 pt each).
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F1E19] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.bowling.completed}
                      onChange={(e) => handleToggleBowlingCompleted(e.target.checked)}
                      className="w-4 h-4 accent-[#0F2922] cursor-pointer"
                    />
                    <span>Mark 10-Frame Bowling Session Completed</span>
                  </label>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 font-mono text-stone-500">
                        <th className="py-3 px-4">BOWLER</th>
                        {Array.from({ length: 10 }, (_, idx) => (
                          <th key={idx} className="py-3 px-2 text-center">
                            F{idx + 1}
                          </th>
                        ))}
                        <th className="py-3 px-4 text-right">TOTAL PINFALL</th>
                        <th className="py-3 px-4 text-right">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {PLAYER_IDS.map((pid) => {
                        const contender = CONTENDERS[pid];
                        const frames = state.bowling.frames[pid] || Array(10).fill(0);
                        const totalPins = state.bowling.totalPins[pid] || 0;
                        const standing = summary.standings.find((s) => s.playerId === pid);
                        const bowlPts = standing?.sportPointsBreakdown.bowling;

                        return (
                          <tr key={pid}>
                            <td className="py-3 px-4 font-semibold text-sm text-[#0F1E19] whitespace-nowrap">
                              {contender.fullTitle}
                            </td>
                            {frames.map((fVal, fIdx) => (
                              <td key={fIdx} className="py-2 px-1 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={30}
                                  value={fVal}
                                  onChange={(e) =>
                                    handleUpdateBowlingFrame(
                                      pid,
                                      fIdx,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-12 text-center bg-stone-50 border border-stone-300 rounded py-1 font-mono tabular-nums text-xs"
                                />
                              </td>
                            ))}
                            <td className="py-3 px-4 text-right">
                              <input
                                type="number"
                                min={0}
                                max={300}
                                value={totalPins}
                                onChange={(e) =>
                                  handleUpdateBowlingTotalDirect(pid, Number(e.target.value))
                                }
                                className="w-20 text-right bg-amber-50 border border-amber-300 rounded px-2 py-1 font-mono tabular-nums text-sm font-bold text-[#0F1E19]"
                              />
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-sm font-bold text-[#0F1E19]">
                              {bowlPts?.total || 0} pts
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. STANDARD H2H & FREE THROW BASKETBALL LOGGERS */}
            {selectedSport !== 'cricket' && selectedSport !== 'bowling' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {state.h2hMatches
                  .filter((m) => m.sport === selectedSport)
                  .map((m) => {
                    const pA = CONTENDERS[m.playerA];
                    const pB = CONTENDERS[m.playerB];
                    const isBasketball = m.sport === 'basketball';

                    return (
                      <div
                        key={m.id}
                        className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-[#0F1E19]">
                            {m.label}
                          </span>
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.completed}
                              onChange={(e) =>
                                handleUpdateH2HMatch(m.id, 'completed', e.target.checked)
                              }
                              className="w-4 h-4 accent-[#0F2922] cursor-pointer"
                            />
                            <span>{m.completed ? 'Completed' : 'Scheduled'}</span>
                          </label>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3 p-3 bg-white border border-stone-200 rounded-lg">
                            <div>
                              <div className="text-sm font-bold text-[#0F1E19]">
                                {pA.fullTitle}
                              </div>
                              <div className="text-[11px] font-mono text-stone-500">
                                {isBasketball ? 'Shots Made / 10' : currentSportDef.scoringUnit}
                              </div>
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={isBasketball ? 10 : 200}
                              value={m.scoreA}
                              onChange={(e) =>
                                handleUpdateH2HMatch(m.id, 'scoreA', Number(e.target.value))
                              }
                              className="w-20 text-right bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 font-mono tabular-nums text-lg font-bold"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 p-3 bg-white border border-stone-200 rounded-lg">
                            <div>
                              <div className="text-sm font-bold text-[#0F1E19]">
                                {pB.fullTitle}
                              </div>
                              <div className="text-[11px] font-mono text-stone-500">
                                {isBasketball ? 'Shots Made / 10' : currentSportDef.scoringUnit}
                              </div>
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={isBasketball ? 10 : 200}
                              value={m.scoreB}
                              onChange={(e) =>
                                handleUpdateH2HMatch(m.id, 'scoreB', Number(e.target.value))
                              }
                              className="w-20 text-right bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 font-mono tabular-nums text-lg font-bold"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          value={m.note}
                          onChange={(e) => handleUpdateH2HMatch(m.id, 'note', e.target.value)}
                          placeholder="Match note..."
                          className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-600"
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}

        {/* RESULTS ANALYTICS VIEW */}
        {viewMode === 'analytics' && (
          <div className="space-y-6">
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 leading-relaxed">
              <strong>Normalized Parity Guarantee:</strong> Every sport converts match outcomes strictly into Tournament Points (Win = 3, Draw = 1, Loss = 0), and tiebreaks use <strong>Normalized Match Differential (Wins minus Losses)</strong> rather than raw pinfall or cricket runs. Winning your picked Golden Sport doubles (2x) all points earned in that sport.
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 font-mono text-stone-500">
                    <th className="py-3 px-4">CONTENDER</th>
                    {ALL_SPORT_KEYS.map((sk) => (
                      <th key={sk} className="py-3 px-3 text-right">
                        {SPORTS_DEFINITIONS[sk].shortName.toUpperCase()}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right">BASE PTS</th>
                    <th className="py-3 px-3 text-right">2X BONUS</th>
                    <th className="py-3 px-3 text-right">NORM DIFF (W-L)</th>
                    <th className="py-3 px-4 text-right">TOTAL PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-sm">
                  {summary.standings.map((st) => (
                    <tr key={st.playerId}>
                      <td className="py-3.5 px-4 font-semibold text-[#0F1E19] whitespace-nowrap">
                        {st.profile.fullTitle}
                      </td>
                      {ALL_SPORT_KEYS.map((sk) => {
                        const cell = st.sportPointsBreakdown[sk];
                        const isGolden = st.goldenSport === sk;
                        return (
                          <td
                            key={sk}
                            className={`py-3.5 px-3 text-right font-mono tabular-nums ${
                              isGolden ? 'bg-amber-50 font-bold text-amber-900' : 'text-stone-700'
                            }`}
                          >
                            {cell.total}
                            {isGolden && (
                              <span className="block text-[10px] text-amber-700">
                                {cell.bonus > 0 ? `2x (${cell.base}+${cell.bonus})` : 'Golden'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-stone-600">
                        {st.basePoints}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-amber-700 font-semibold">
                        +{st.goldenBonusPoints}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold">
                        {st.normalizedDiff >= 0 ? `+${st.normalizedDiff}` : st.normalizedDiff}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-base text-[#0F1E19]">
                        {st.totalPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
