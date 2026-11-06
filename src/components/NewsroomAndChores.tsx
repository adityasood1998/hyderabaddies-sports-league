import React, { useState } from 'react';
import {
  Newspaper,
  Sparkles,
  RotateCw,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  TournamentState,
  CONTENDERS,
  PLAYER_IDS,
  PlayerId,
} from '../types/tournament';
import { playWheelTick, playMortalKombatAnnouncer } from '../utils/audioEffects';

interface NewsroomAndChoresProps {
  state: TournamentState;
  onGenerateBreakingNews: (topic: string) => Promise<void>;
  isGeneratingNews: boolean;
  onUpdateState: (updater: (prev: TournamentState) => TournamentState) => Promise<void>;
}

const WHEEL_CHORES = [
  'Make Masala Chai for Bai & Wash Protein Shakers',
  'Evening Walk & Treat Duty for Mia the Beagle',
  'Deep-Clean Air Fryer & Kitchen Countertops',
  'Sponsor Next Swiggy Instamart Beverage Order',
  'Scrub Flat 2110 Balcony & Living Room Floor',
  'Polish All Trophies & Set Up Next Match Court',
];

export const NewsroomAndChores: React.FC<NewsroomAndChoresProps> = ({
  state,
  onGenerateBreakingNews,
  isGeneratingNews,
  onUpdateState,
}) => {
  const [newsTopic, setNewsTopic] = useState<string>('');
  const [spinning, setSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [selectedWheelPlayer, setSelectedWheelPlayer] = useState<PlayerId>('dave');
  const [landedChore, setLandedChore] = useState<string | null>(null);

  const handleTriggerNews = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerateBreakingNews(newsTopic);
    setNewsTopic('');
  };

  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setLandedChore(null);

    // Play rapid wheel ticks
    let ticks = 0;
    const tickInterval = window.setInterval(() => {
      playWheelTick();
      ticks += 1;
      if (ticks > 12) window.clearInterval(tickInterval);
    }, 160);

    const prizeIdx = Math.floor(Math.random() * WHEEL_CHORES.length);
    const segmentAngle = 360 / WHEEL_CHORES.length;
    const extraSpins = 360 * 5;
    const nextRot = wheelRotation + extraSpins + (360 - prizeIdx * segmentAngle);
    setWheelRotation(nextRot);

    window.setTimeout(async () => {
      window.clearInterval(tickInterval);
      const chosenChore = WHEEL_CHORES[prizeIdx];
      setLandedChore(chosenChore);
      setSpinning(false);
      playMortalKombatAnnouncer('FATALITY!');

      const newChoreItem = {
        id: `chore-${Date.now()}`,
        playerId: selectedWheelPlayer,
        choreTitle: chosenChore,
        reason: `Assigned by the Flat 2110 Wheel of Chores`,
        completed: false,
        timestamp: new Date().toISOString(),
      };

      await onUpdateState((prev) => ({
        ...prev,
        chores: [newChoreItem, ...prev.chores],
      }));
    }, 2400);
  };

  const handleToggleChoreDone = async (id: string) => {
    await onUpdateState((prev) => ({
      ...prev,
      chores: prev.chores.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      ),
    }));
  };

  const handleDeleteChore = async (id: string) => {
    await onUpdateState((prev) => ({
      ...prev,
      chores: prev.chores.filter((c) => c.id !== id),
    }));
  };

  const leadStory = state.news[0];
  const secondaryStories = state.news.slice(1);

  return (
    <div className="space-y-8">
      {/* 1. NEWSROOM SPORTS TABLOID */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="border-b-2 border-[#0F1E19] pb-5 mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-stone-500">
              FLAT 2110 OFFICIAL PRESS · THE HYBERABADDIES GAZETTE
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[#0F1E19]">
              Flat 2110 Sports Tabloid &amp; AI Newsroom
            </h2>
          </div>

          <form
            onSubmit={handleTriggerNews}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto"
          >
            <input
              type="text"
              value={newsTopic}
              onChange={(e) => setNewsTopic(e.target.value)}
              placeholder="Optional angle (e.g., Dave's bowling choke)..."
              className="flex-1 sm:w-64 bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#0F1E19]"
            />
            <button
              type="submit"
              disabled={isGeneratingNews}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] disabled:opacity-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isGeneratingNews ? 'Writing Scoop...' : 'Generate AI Breaking News'}
            </button>
          </form>
        </div>

        {leadStory && (
          <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl mb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-rose-700 mb-2">
              <Newspaper className="w-4 h-4" />
              <span>{leadStory.category}</span>
              <span>·</span>
              <span className="text-stone-500">By {leadStory.author}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#0F1E19] leading-tight mb-2">
              {leadStory.headline}
            </h3>
            <p className="text-sm font-semibold text-stone-700 mb-3">
              {leadStory.subheadline}
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">{leadStory.body}</p>
          </div>
        )}

        {secondaryStories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondaryStories.map((story) => (
              <article
                key={story.id}
                className="p-5 border border-stone-200 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] font-mono text-stone-500 mb-1">
                    {story.category} · {story.author}
                  </div>
                  <h4 className="text-lg font-display font-bold text-[#0F1E19] mb-1.5">
                    {story.headline}
                  </h4>
                  <p className="text-xs font-semibold text-stone-700 mb-2">
                    {story.subheadline}
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed">{story.body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 2. WHEEL OF CHORES FOR PENALTY ASSIGNMENTS */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Spinning Wheel */}
          <div className="lg:col-span-6 bg-[#0C1713] text-white border border-[#1E3A2F] rounded-xl p-6 flex flex-col items-center text-center">
            <div className="text-xs font-mono text-amber-400 mb-1">
              FLAT 2110 PENALTY ROULETTE
            </div>
            <h3 className="text-2xl font-display font-bold mb-4">
              The Wheel of Chores
            </h3>

            {/* Target Player Selector */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-mono text-stone-300">Penalty Victim:</span>
              <select
                value={selectedWheelPlayer}
                onChange={(e) => setSelectedWheelPlayer(e.target.value as PlayerId)}
                className="bg-[#12231D] border border-[#2A4D3E] rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              >
                {PLAYER_IDS.map((pid) => (
                  <option key={pid} value={pid}>
                    {CONTENDERS[pid].fullTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* SVG Wheel */}
            <div className="relative w-64 h-64 mb-6">
              {/* Top Pointer Arrow */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-14 border-l-transparent border-r-transparent border-t-amber-400" />
              </div>

              <svg
                viewBox="0 0 200 200"
                className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-xl"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning
                    ? 'transform 2.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    : 'none',
                }}
              >
                {WHEEL_CHORES.map((_, idx) => {
                  const colors = [
                    '#0F766E',
                    '#B45309',
                    '#BE123C',
                    '#1D4ED8',
                    '#15803D',
                    '#6D28D9',
                  ];
                  const startAngle = (idx * 60 * Math.PI) / 180;
                  const endAngle = ((idx + 1) * 60 * Math.PI) / 180;
                  const x1 = 100 + 100 * Math.sin(startAngle);
                  const y1 = 100 - 100 * Math.cos(startAngle);
                  const x2 = 100 + 100 * Math.sin(endAngle);
                  const y2 = 100 - 100 * Math.cos(endAngle);
                  const midAngle = idx * 60 + 30;

                  return (
                    <g key={idx}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                        fill={colors[idx % colors.length]}
                        stroke="#0C1713"
                        strokeWidth="1.5"
                      />
                      <text
                        x="100"
                        y="36"
                        transform={`rotate(${midAngle} 100 100)`}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="7.5"
                        fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        CHORE 0{idx + 1}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="18" fill="#0C1713" stroke="#F59E0B" strokeWidth="3" />
              </svg>
            </div>

            <button
              type="button"
              disabled={spinning}
              onClick={handleSpinWheel}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0C1713] font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
              {spinning
                ? 'Spinning Wheel of Chores...'
                : `Spin Chore for ${CONTENDERS[selectedWheelPlayer].name}`}
            </button>

            {landedChore && (
              <div className="mt-4 p-3 bg-[#152821] border border-amber-400/50 rounded-lg text-xs text-amber-300 font-mono">
                FATALITY! {CONTENDERS[selectedWheelPlayer].fullTitle} landed on: “{landedChore}”
              </div>
            )}
          </div>

          {/* Right Column: Active Chore Assignments */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <h3 className="text-2xl font-display font-bold text-[#0F1E19]">
                Flat 2110 Chore Penalty Queue
              </h3>
              <p className="text-sm text-stone-600">
                Every wheel spin automatically logs an official chore obligation below. Bai inspects completion daily.
              </p>
            </div>

            <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {state.chores.map((chore) => {
                const profile = CONTENDERS[chore.playerId];
                return (
                  <div
                    key={chore.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-stone-500">
                        <span className="font-bold text-[#0F1E19]">
                          {profile.fullTitle}
                        </span>
                        <span className="mx-2">·</span>
                        <span>{chore.completed ? 'Completed' : 'Pending Duty'}</span>
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          chore.completed
                            ? 'line-through text-stone-400'
                            : 'text-[#0F1E19]'
                        }`}
                      >
                        {chore.choreTitle}
                      </div>
                      <div className="text-xs text-stone-500">{chore.reason}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleChoreDone(chore.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {chore.completed ? 'Undo' : 'Done'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChore(chore.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
