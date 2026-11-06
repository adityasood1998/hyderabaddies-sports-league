import React, { useState } from 'react';
import { CheckCircle2, Trash2, Plus } from 'lucide-react';
import {
  Player,
  ForfeitTask,
  VALIDATION_CONSTRAINTS,
} from '../types';
import {
  createForfeitTask,
  completeForfeitTask,
  deleteForfeitTask,
} from '../services/leagueService';

interface ForfeitsSectionProps {
  leagueId: string;
  houseStake: string;
  players: Player[];
  forfeits: ForfeitTask[];
}

export const ForfeitsSection: React.FC<ForfeitsSectionProps> = ({
  leagueId,
  houseStake,
  players,
  forfeits,
}) => {
  const activePlayers = players.filter((p) => p.status === 'active');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    activePlayers[0]?.id || ''
  );
  const [title, setTitle] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const effectivePlayerId = selectedPlayerId || activePlayers[0]?.id || '';

  const handleCreateForfeit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlayer = activePlayers.find((p) => p.id === effectivePlayerId);
    if (!targetPlayer || !title.trim()) return;

    setSubmitting(true);
    try {
      await createForfeitTask({
        leagueId,
        assignedToPlayer: targetPlayer,
        title: title.trim(),
        reason: reason.trim() || 'Match forfeit stake',
      });
      setTitle('');
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredForfeits = forfeits.filter((f) =>
    filter === 'all' ? true : f.status === filter
  );

  return (
    <div className="space-y-8">
      {/* Season Stake Banner & Chore Tally by Flatmate */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div>
            <div className="text-xs font-mono text-stone-500 mb-1">
              OFFICIAL HOUSEHOLD CONSTITUTION &amp; WOODEN SPOON PENALTY
            </div>
            <h2 className="text-2xl font-display font-bold text-[#0F1E19]">
              {houseStake}
            </h2>
          </div>
          <div className="text-xs font-mono tabular-nums text-stone-600 shrink-0">
            Pending Chores: {forfeits.filter((f) => f.status === 'pending').length} · Completed:{' '}
            {forfeits.filter((f) => f.status === 'completed').length}
          </div>
        </div>

        {/* Per-Flatmate Chore Debt Tally */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {activePlayers.map((player) => {
            const pendingCount = forfeits.filter(
              (f) => f.assignedToPlayerId === player.id && f.status === 'pending'
            ).length;
            const completedCount = forfeits.filter(
              (f) => f.assignedToPlayerId === player.id && f.status === 'completed'
            ).length;
            return (
              <div
                key={player.id}
                className="p-4 bg-stone-50 border border-stone-200 rounded-lg"
              >
                <div className="text-sm font-semibold text-[#0F1E19] truncate">
                  {player.name}
                </div>
                <div className="text-xs text-stone-500 truncate mb-2">
                  {player.roomLabel}
                </div>
                <div className="text-xs font-mono tabular-nums text-stone-700">
                  {pendingCount} Owed · {completedCount} Cleared
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Issue New Forfeit + Active Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form: Assign New Chore Forfeit */}
        <form
          onSubmit={handleCreateForfeit}
          className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-xl font-display font-bold text-[#0F1E19]">
            Assign House Chore Forfeit
          </h3>
          <p className="text-xs text-stone-600">
            Log a household chore stake owed from a match defeat or weekly bottom-of-the-table finish.
          </p>

          <div>
            <label htmlFor="forfeit-player" className="block text-xs font-medium text-stone-700 mb-1">
              Flatmate Owed By
            </label>
            <select
              id="forfeit-player"
              value={effectivePlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#0F1E19]"
            >
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.roomLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="forfeit-task-title" className="block text-xs font-medium text-stone-700 mb-1">
              Chore / Penalty Task (max {VALIDATION_CONSTRAINTS.FORFEIT_TITLE_MAX} chars)
            </label>
            <input
              id="forfeit-task-title"
              type="text"
              required
              maxLength={VALIDATION_CONSTRAINTS.FORFEIT_TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Unload dishwasher & wipe kitchen counters"
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#0F1E19]"
            />
          </div>

          <div>
            <label htmlFor="forfeit-reason" className="block text-xs font-medium text-stone-700 mb-1">
              Match / Standing Reason (max {VALIDATION_CONSTRAINTS.FORFEIT_REASON_MAX} chars)
            </label>
            <input
              id="forfeit-reason"
              type="text"
              required
              maxLength={VALIDATION_CONSTRAINTS.FORFEIT_REASON_MAX}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Lost Friday evening Foosball derby 10-3"
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#0F1E19]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || activePlayers.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Issuing Forfeit...' : 'Issue Chore Forfeit'}
          </button>
        </form>

        {/* Forfeit Tasks List */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-display font-bold text-[#0F1E19]">
              Chore &amp; Forfeit Ledger
            </h3>

            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
              {(['all', 'pending', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === tab
                      ? 'bg-white text-[#0F1E19] shadow-xs'
                      : 'text-stone-600 hover:text-[#0F1E19]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredForfeits.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-500">
              No chore forfeits matching this filter.
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {filteredForfeits.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                      <span className="font-semibold text-[#0F1E19]">
                        {item.assignedToName}
                      </span>
                      <span>·</span>
                      <span>
                        {item.status === 'completed' ? 'Completed' : 'Pending Duty'}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        item.status === 'completed'
                          ? 'line-through text-stone-400'
                          : 'text-[#0F1E19]'
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">{item.reason}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => completeForfeitTask(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Done
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteForfeitTask(item.id)}
                      title="Delete Forfeit"
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
