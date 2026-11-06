import React, { useState } from 'react';
import { Trophy, Award, Plus } from 'lucide-react';
import {
  TournamentState,
  ComputedTournamentSummary,
  CONTENDERS,
  PLAYER_IDS,
  PlayerId,
} from '../types/tournament';
import { playMortalKombatAnnouncer } from '../utils/audioEffects';

interface PredictionsAndHallOfFameProps {
  state: TournamentState;
  summary: ComputedTournamentSummary;
  isAdminUnlocked: boolean;
  onRequireUnlock: () => void;
  onUpdateState: (updater: (prev: TournamentState) => TournamentState) => Promise<void>;
}

export const PredictionsAndHallOfFame: React.FC<PredictionsAndHallOfFameProps> = ({
  state,
  summary,
  isAdminUnlocked,
  onRequireUnlock,
  onUpdateState,
}) => {
  const [predictorName, setPredictorName] = useState<string>('');
  const [predictedChampion, setPredictedChampion] = useState<PlayerId>('addy');
  const [predictedWoodenSpoon, setPredictedWoodenSpoon] = useState<PlayerId>('dave');
  const [predictedCricketKing, setPredictedCricketKing] = useState<PlayerId>('addy');
  const [predictedBowlingKing, setPredictedBowlingKing] = useState<PlayerId>('pg');
  const [boldCall, setBoldCall] = useState<string>('');

  const currentLeader = summary.standings[0]?.playerId || 'addy';
  const currentSpoon = summary.standings[2]?.playerId || 'dave';
  const currentCricketLeader =
    summary.sportLeaders.cricket && summary.sportLeaders.cricket !== 'tie'
      ? summary.sportLeaders.cricket
      : 'addy';
  const currentBowlingLeader =
    summary.sportLeaders.bowling && summary.sportLeaders.bowling !== 'tie'
      ? summary.sportLeaders.bowling
      : 'pg';

  const handleAddPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predictorName.trim()) return;

    const newEntry = {
      id: `pred-${Date.now()}`,
      predictorName: predictorName.trim(),
      predictedChampion,
      predictedWoodenSpoon,
      predictedCricketKing,
      predictedBowlingKing,
      boldCall: boldCall.trim() || 'Flat 2110 title goes down to the wire!',
      timestamp: new Date().toISOString(),
    };

    await onUpdateState((prev) => ({
      ...prev,
      predictions: [newEntry, ...prev.predictions],
    }));

    setPredictorName('');
    setBoldCall('');
  };

  const handleAssignTrophyWinner = async (trophyId: string, winnerId: PlayerId | null) => {
    if (!isAdminUnlocked) {
      onRequireUnlock();
      return;
    }
    playMortalKombatAnnouncer('FLAWLESS VICTORY');
    await onUpdateState((prev) => ({
      ...prev,
      trophies: prev.trophies.map((t) =>
        t.id === trophyId ? { ...t, overrideWinnerId: winnerId } : t
      ),
    }));
  };

  return (
    <div className="space-y-8">
      {/* 1. HALL OF FAME TROPHIES ROOM */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono text-stone-500">
              FLAT 2110 SILVERWARE CABINET · OFFICIAL HONOURS
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
              Hall of Fame Trophies Room
            </h2>
          </div>
          <div className="text-xs text-stone-600">
            Overall Crown tracks live #1 seed automatically · Admin PIN 7777 can bestow specialty honours
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.trophies.map((trophy) => {
            const effectiveHolderId: PlayerId =
              trophy.id === 'trophy-crown'
                ? currentLeader
                : trophy.overrideWinnerId || currentLeader;
            const holder = CONTENDERS[effectiveHolderId];

            return (
              <div
                key={trophy.id}
                className="p-6 bg-[#0C1713] text-white border border-[#1E3A2F] rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-amber-400">
                      HOLDER: {holder.name.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-white">
                    {trophy.title}
                  </h3>
                  <div className="text-xs text-emerald-300 font-medium mt-0.5 mb-2">
                    {trophy.subtitle}
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed mb-4">
                    {trophy.criteria}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1E3A2F] flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-amber-300 truncate">
                    {holder.fullTitle}
                  </div>

                  {trophy.id !== 'trophy-crown' && (
                    <select
                      aria-label={`Assign ${trophy.title}`}
                      value={effectiveHolderId}
                      onChange={(e) =>
                        handleAssignTrophyWinner(trophy.id, e.target.value as PlayerId)
                      }
                      className="bg-[#152821] border border-[#2A4D3E] rounded px-2 py-1 text-[11px] font-mono text-stone-200"
                    >
                      {PLAYER_IDS.map((pid) => (
                        <option key={pid} value={pid}>
                          {CONTENDERS[pid].name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. PREDICTION LEAGUE */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Submit Prediction Form */}
          <form
            onSubmit={handleAddPrediction}
            className="lg:col-span-5 bg-stone-50 border border-stone-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0F2922]" />
              <h3 className="text-xl font-display font-bold text-[#0F1E19]">
                Flat 2110 Prediction League
              </h3>
            </div>
            <p className="text-xs text-stone-600">
              Lock in your crystal-ball calls for Overall Champion, Wooden Spoon, Cricket King, and Bowling King. Each accurate call earns +25 Oracle Points.
            </p>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Your Name / Flatmate Alias
              </label>
              <input
                type="text"
                required
                value={predictorName}
                onChange={(e) => setPredictorName(e.target.value)}
                placeholder="e.g., Addy / Guest Pundit"
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Overall Champion
                </label>
                <select
                  value={predictedChampion}
                  onChange={(e) => setPredictedChampion(e.target.value as PlayerId)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs"
                >
                  {PLAYER_IDS.map((pid) => (
                    <option key={pid} value={pid}>
                      {CONTENDERS[pid].fullTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Wooden Spoon (Last)
                </label>
                <select
                  value={predictedWoodenSpoon}
                  onChange={(e) => setPredictedWoodenSpoon(e.target.value as PlayerId)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs"
                >
                  {PLAYER_IDS.map((pid) => (
                    <option key={pid} value={pid}>
                      {CONTENDERS[pid].fullTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Tri-Series Cricket King
                </label>
                <select
                  value={predictedCricketKing}
                  onChange={(e) => setPredictedCricketKing(e.target.value as PlayerId)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs"
                >
                  {PLAYER_IDS.map((pid) => (
                    <option key={pid} value={pid}>
                      {CONTENDERS[pid].fullTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  10-Frame Bowling King
                </label>
                <select
                  value={predictedBowlingKing}
                  onChange={(e) => setPredictedBowlingKing(e.target.value as PlayerId)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-xs"
                >
                  {PLAYER_IDS.map((pid) => (
                    <option key={pid} value={pid}>
                      {CONTENDERS[pid].fullTitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Bold Flat 2110 Prophecy
              </label>
              <input
                type="text"
                value={boldCall}
                onChange={(e) => setBoldCall(e.target.value)}
                placeholder="e.g., PG wins Bowling by 15+ pins while Mia naps..."
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Lock In Prediction Slip
            </button>
          </form>

          {/* Prediction Slips & Live Accuracy Scoreboard */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className="text-2xl font-display font-bold text-[#0F1E19]">
                Oracle Prediction Standings
              </h3>
              <p className="text-sm text-stone-600">
                Scored live against current leaders (#1 {CONTENDERS[currentLeader].name}, Spoon {CONTENDERS[currentSpoon].name}, Cricket {CONTENDERS[currentCricketLeader].name}, Bowling {CONTENDERS[currentBowlingLeader].name}).
              </p>
            </div>

            <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {state.predictions.map((pred) => {
                let score = 0;
                if (pred.predictedChampion === currentLeader) score += 25;
                if (pred.predictedWoodenSpoon === currentSpoon) score += 25;
                if (pred.predictedCricketKing === currentCricketLeader) score += 25;
                if (pred.predictedBowlingKing === currentBowlingLeader) score += 25;

                return (
                  <div key={pred.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-sm text-[#0F1E19]">
                        {pred.predictorName}
                      </span>
                      <span className="font-mono tabular-nums text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                        Oracle Score: {score} / 100
                      </span>
                    </div>

                    <div className="text-xs text-stone-600">
                      <span>Champion: {CONTENDERS[pred.predictedChampion].name}</span>
                      <span className="mx-2">·</span>
                      <span>Spoon: {CONTENDERS[pred.predictedWoodenSpoon].name}</span>
                      <span className="mx-2">·</span>
                      <span>Cricket: {CONTENDERS[pred.predictedCricketKing].name}</span>
                      <span className="mx-2">·</span>
                      <span>Bowling: {CONTENDERS[pred.predictedBowlingKing].name}</span>
                    </div>

                    <div className="text-xs italic text-stone-500">
                      Prophecy: “{pred.boldCall}”
                    </div>
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
