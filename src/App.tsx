import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Lock,
  Unlock,
  Volume2,
  Database,
  Swords,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { auth } from './firebase';
import {
  TournamentState,
  createInitialTournamentState,
  computeTournamentSummary,
  CONTENDERS,
  PLAYER_IDS,
  PlayerId,
  SportKey,
  ALL_SPORT_KEYS,
  SPORTS_DEFINITIONS,
} from './types/tournament';
import {
  playMortalKombatAnnouncer,
  MKPhrase,
} from './utils/audioEffects';
import {
  SheruMascotBanner,
  FloatingMascotButtons,
} from './components/MascotOverlayAndBanner';
import { SportsFixturesAndAnalytics } from './components/SportsFixturesAndAnalytics';
import { TrophyRaceAndExcuses } from './components/TrophyRaceAndExcuses';
import { NewsroomAndChores } from './components/NewsroomAndChores';
import { PredictionsAndHallOfFame } from './components/PredictionsAndHallOfFame';
import {
  AdminPinModal,
  DataBackupModal,
} from './components/DataBackupAndAdminModal';

type NavTab =
  | 'leaderboard'
  | 'fixtures'
  | 'race_excuses'
  | 'news_chores'
  | 'hall_of_fame';

const MK_PHRASES: MKPhrase[] = [
  'ROUND 1',
  'FIGHT!',
  'FATALITY!',
  'FLAWLESS VICTORY',
];

export default function App() {
  const [tournamentState, setTournamentState] = useState<TournamentState>(() =>
    createInitialTournamentState()
  );
  const [connectedClients, setConnectedClients] = useState<number>(1);
  const [backupTimestamp, setBackupTimestamp] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<NavTab>('leaderboard');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);

  const [isGeneratingSheru, setIsGeneratingSheru] = useState<boolean>(false);
  const [isGeneratingNews, setIsGeneratingNews] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Firebase Auth listener for Cloud Backup inside DataBackupModal
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Initial REST fetch + Real-time SSE Subscription (/api/events)
  useEffect(() => {
    let isMounted = true;

    fetch('/api/tournament-data')
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.state) {
          setTournamentState(data.state);
        }
        if (data?.backupTimestamp) {
          setBackupTimestamp(data.backupTimestamp);
        }
        if (typeof data?.connectedClients === 'number') {
          setConnectedClients(data.connectedClients);
        }
      })
      .catch((err) => console.error('Initial tournament fetch error:', err));

    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      if (isMounted) setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.state) {
          setTournamentState(parsed.state);
        }
        if (typeof parsed?.connectedClients === 'number') {
          setConnectedClients(parsed.connectedClients);
        }
      } catch {
        // Ignore heartbeat or malformed frame
      }
    };

    eventSource.onerror = () => {
      if (isMounted) setSseConnected(false);
    };

    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, []);

  // Persist state to Express server (/api/tournament-data) -> writes primary + backup JSON & broadcasts via SSE
  const persistTournamentState = useCallback(async (nextState: TournamentState) => {
    setTournamentState(nextState);
    try {
      const res = await fetch('/api/tournament-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState }),
      });
      const data = await res.json();
      if (data?.state) {
        setTournamentState(data.state);
      }
    } catch (err) {
      console.error('Failed persisting state to server:', err);
    }
  }, []);

  const handleUpdateState = useCallback(
    async (updater: (prev: TournamentState) => TournamentState) => {
      const next = updater(tournamentState);
      await persistTournamentState(next);
    },
    [tournamentState, persistTournamentState]
  );

  // Request new Sheru the Tiger Mascot Quip from /api/gemini/sheru-quip
  const handleRequestSheruQuip = async () => {
    setIsGeneratingSheru(true);
    try {
      const res = await fetch('/api/gemini/sheru-quip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data?.quip) {
        setTournamentState((prev) => ({
          ...prev,
          sheruLastQuip: data.quip,
        }));
      }
    } catch (err) {
      console.error('Sheru quip error:', err);
    } finally {
      setIsGeneratingSheru(false);
    }
  };

  // Request AI Breaking News from /api/gemini/newsroom
  const handleGenerateBreakingNews = async (topic: string) => {
    setIsGeneratingNews(true);
    try {
      const res = await fetch('/api/gemini/newsroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data?.state) {
        setTournamentState(data.state);
      }
    } catch (err) {
      console.error('Newsroom generation error:', err);
    } finally {
      setIsGeneratingNews(false);
    }
  };

  const handleRestoreServerBackup = async () => {
    const res = await fetch('/api/tournament-data/restore-backup', {
      method: 'POST',
    });
    const data = await res.json();
    if (data?.state) {
      setTournamentState(data.state);
    }
  };

  const handleResetToDefault = async () => {
    const res = await fetch('/api/tournament-data/reset', {
      method: 'POST',
    });
    const data = await res.json();
    if (data?.state) {
      setTournamentState(data.state);
    }
  };

  const handleChangeGoldenBet = async (playerId: PlayerId, sport: SportKey) => {
    if (!isAdminUnlocked) {
      setShowPinModal(true);
      return;
    }
    playMortalKombatAnnouncer('ROUND 1');
    await handleUpdateState((prev) => ({
      ...prev,
      goldenBets: {
        ...prev.goldenBets,
        [playerId]: sport,
      },
    }));
  };

  const summary = useMemo(
    () => computeTournamentSummary(tournamentState),
    [tournamentState]
  );

  const leader = summary.standings[0];
  const activeGoldenBetsCashed = summary.standings.filter((s) => s.goldenBetWon).length;
  const totalCompletedFixtures =
    tournamentState.cricketMatches.filter((m) => m.completed).length +
    tournamentState.h2hMatches.filter((m) => m.completed).length +
    (tournamentState.bowling.completed ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#0F1E19]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-10 py-4 bg-white border-b border-stone-200 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#leaderboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('leaderboard');
          }}
          className="text-2xl font-display font-bold tracking-tight text-[#0F1E19] whitespace-nowrap shrink-0"
        >
          Hyberabaddies 2110
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          <a
            href="#leaderboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('leaderboard');
            }}
            className={`hover:text-[#0F1E19] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'leaderboard'
                ? 'text-[#0F1E19] font-semibold underline underline-offset-8 decoration-2 decoration-[#0F2922]'
                : ''
            }`}
          >
            Leaderboard
          </a>
          <a
            href="#fixtures"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('fixtures');
            }}
            className={`hover:text-[#0F1E19] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'fixtures'
                ? 'text-[#0F1E19] font-semibold underline underline-offset-8 decoration-2 decoration-[#0F2922]'
                : ''
            }`}
          >
            Sports &amp; Analytics
          </a>
          <a
            href="#race-excuses"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('race_excuses');
            }}
            className={`hover:text-[#0F1E19] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'race_excuses'
                ? 'text-[#0F1E19] font-semibold underline underline-offset-8 decoration-2 decoration-[#0F2922]'
                : ''
            }`}
          >
            Race &amp; Excuses
          </a>
          <a
            href="#news-chores"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('news_chores');
            }}
            className={`hover:text-[#0F1E19] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'news_chores'
                ? 'text-[#0F1E19] font-semibold underline underline-offset-8 decoration-2 decoration-[#0F2922]'
                : ''
            }`}
          >
            News &amp; Chores
          </a>
          <a
            href="#hall-of-fame"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('hall_of_fame');
            }}
            className={`hover:text-[#0F1E19] transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'hall_of_fame'
                ? 'text-[#0F1E19] font-semibold underline underline-offset-8 decoration-2 decoration-[#0F2922]'
                : ''
            }`}
          >
            Hall of Fame
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowBackupModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Backup &amp; Sync
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-6 py-2.5 bg-white border-b border-stone-200">
        {(
          [
            ['leaderboard', 'Leaderboard'],
            ['fixtures', 'Sports & Analytics'],
            ['race_excuses', 'Race & Excuses'],
            ['news_chores', 'News & Chores'],
            ['hall_of_fame', 'Hall of Fame'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === id
                ? 'bg-[#0F2922] text-white'
                : 'text-stone-600 hover:text-[#0F1E19]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-10 py-8 space-y-8 pb-24">
        {/* Workspace Control Bar: SSE Status, Mortal Kombat Announcer Soundboard, & Admin PIN 7777 Lock */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-200 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-stone-600 font-mono">
            <span className="font-bold text-[#0F1E19]">FLAT 2110</span>
            <span>·</span>
            <span>
              {sseConnected ? 'SSE Real-Time Sync Connected' : 'Reconnecting SSE...'}
            </span>
            <span>·</span>
            <span>{connectedClients} Active Device(s)</span>
            <span>·</span>
            <span>Dual-Disk JSON Active</span>
          </div>

          {/* Mortal Kombat Synthesized Announcer Bar + Admin Passcode Control */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg">
              {MK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => playMortalKombatAnnouncer(phrase)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold text-[#0F1E19] bg-white hover:bg-amber-400 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  {phrase}
                </button>
              ))}
            </div>

            {isAdminUnlocked ? (
              <button
                type="button"
                onClick={() => setIsAdminUnlocked(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                Admin Unlocked (Lock)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin Locked (PIN 7777)
              </button>
            )}
          </div>
        </div>

        {/* Sheru the Tiger Mascot Interactive Banner */}
        <SheruMascotBanner
          quip={tournamentState.sheruLastQuip}
          onRequestNewQuip={handleRequestSheruQuip}
          isGenerating={isGeneratingSheru}
        />

        {/* VIEW 1: OVERALL LEADERBOARD, GOLDEN BETS, & HEAD-TO-HEAD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8">
            {/* 2-Column Hero Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-stone-500 mb-2">
                    FLAT 2110 OFFICIAL CHAMPIONSHIP · PARITY SCORING SYSTEM
                  </div>
                  <h1
                    className="font-display font-bold tracking-tight text-[#0F1E19] mb-4"
                    style={{
                      fontSize: 'clamp(2.25rem, 3.8vw, 3.35rem)',
                      lineHeight: 1.05,
                      textWrap: 'balance',
                    }}
                  >
                    Hyberabaddies — Sportsman of the House Championship
                  </h1>
                  <p className="text-sm text-stone-600 leading-relaxed mb-6">
                    Three Flat 2110 icons — <strong>Addy "Double ACL"</strong>,{' '}
                    <strong>PG "Koniki Supermodel"</strong>, and{' '}
                    <strong>Dave "Tiger Queen"</strong> — battle across 7 sports. Every match awards Win = 3, Draw = 1, Loss = 0, ranked by Total Points and{' '}
                    <strong>Normalized Match Differential (Wins minus Losses)</strong> so high-scoring bowling or cricket never overpowers low-scoring sports.
                  </p>
                </div>

                <div className="pt-5 border-t border-stone-200 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('fixtures')}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0F2922] hover:bg-[#163C32] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Log Match Scores
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('race_excuses')}
                    className="px-4 py-2.5 text-xs font-semibold text-[#0F1E19] bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Trophy Race &amp; Thartharometer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('news_chores')}
                    className="px-4 py-2.5 text-xs font-semibold text-stone-700 hover:text-[#0F1E19] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Spin Wheel of Chores
                  </button>
                </div>
              </div>

              {/* Current #1 Leader Card */}
              <div className="lg:col-span-5 bg-[#0C1713] text-white border border-[#1E3A2F] rounded-xl p-6 lg:p-8 flex flex-col justify-between">
                {leader && (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-2">
                        <span>CURRENT #1 SEED · HOUSE LEADER</span>
                        <span>{leader.totalPoints} TOTAL PTS</span>
                      </div>
                      <div className="text-3xl font-display font-bold tracking-tight text-white">
                        {leader.profile.fullTitle}
                      </div>
                      <div className="text-xs text-stone-300 mt-1">
                        {leader.profile.flatRoom} · {leader.profile.signatureMove}
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-4 py-4 border-t border-b border-[#1E3A2F] font-mono tabular-nums">
                        <div>
                          <div className="text-[11px] text-stone-400">BASE + 2X BONUS</div>
                          <div className="text-lg font-bold text-white">
                            {leader.basePoints} + {leader.goldenBonusPoints}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-stone-400">NORM DIFF (W-L)</div>
                          <div className="text-lg font-bold text-emerald-400">
                            {leader.normalizedDiff >= 0
                              ? `+${leader.normalizedDiff}`
                              : leader.normalizedDiff}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-stone-400">RECORD (W-D-L)</div>
                          <div className="text-lg font-bold text-amber-400">
                            {leader.wins}-{leader.draws}-{leader.losses}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs font-mono text-stone-300">
                      <span>
                        Golden Sport: {SPORTS_DEFINITIONS[leader.goldenSport].name}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {leader.goldenBetWon ? '2X MULTIPLIER ACTIVE' : 'IN CONTENTION'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Full-Width 4-Column KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="text-xs text-stone-500 mb-1">Championship Leader</div>
                <div className="text-2xl font-display font-bold text-[#0F1E19] truncate">
                  {leader?.profile.fullTitle}
                </div>
                <div className="text-xs font-mono tabular-nums text-stone-500 mt-1">
                  {leader?.totalPoints} Pts · Diff{' '}
                  {leader && leader.normalizedDiff >= 0
                    ? `+${leader.normalizedDiff}`
                    : leader?.normalizedDiff}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="text-xs text-stone-500 mb-1">Golden 2x Bets Cashed</div>
                <div className="text-3xl font-mono font-bold tabular-nums text-[#0F1E19]">
                  {activeGoldenBetsCashed} / 3
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  2x points in chosen Golden Sport
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="text-xs text-stone-500 mb-1">Fixtures Completed</div>
                <div className="text-3xl font-mono font-bold tabular-nums text-[#0F1E19]">
                  {totalCompletedFixtures} / 19
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Across 7 Flat 2110 disciplines
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="text-xs text-stone-500 mb-1"> excuses Logged</div>
                <div className="text-3xl font-mono font-bold tabular-nums text-[#0F1E19]">
                  {tournamentState.excuses.length}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Tracked on Thartharometer
                </div>
              </div>
            </div>

            {/* Official Overall Leaderboard Table */}
            <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
                    Overall Championship Leaderboard
                  </h2>
                  <p className="text-xs text-stone-500">
                    Ranked by Total Points (Base + Golden 2x Bonus), then Normalized Match Differential (Wins minus Losses)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBackupModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F1E19] bg-stone-100 hover:bg-stone-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  Data Backup &amp; Cloud Sync
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-mono text-stone-500">
                      <th className="py-3.5 px-4">RANK</th>
                      <th className="py-3.5 px-4">CONTENDER</th>
                      <th className="py-3.5 px-4">GOLDEN SPORT (2X BET)</th>
                      <th className="py-3.5 px-3 text-right">P</th>
                      <th className="py-3.5 px-3 text-right">W</th>
                      <th className="py-3.5 px-3 text-right">D</th>
                      <th className="py-3.5 px-3 text-right">L</th>
                      <th className="py-3.5 px-3 text-right">NORM DIFF (W-L)</th>
                      <th className="py-3.5 px-3 text-right">BASE PTS</th>
                      <th className="py-3.5 px-3 text-right">2X BONUS</th>
                      <th className="py-3.5 px-4 text-right">TOTAL PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-sm">
                    {summary.standings.map((st, idx) => (
                      <tr key={st.playerId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-4 px-4 font-mono tabular-nums font-bold text-xs text-stone-700">
                          0{idx + 1}
                          {idx === 0 && ' · LEADER'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white shrink-0"
                              style={{ backgroundColor: st.profile.accentColor }}
                            >
                              {st.profile.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F1E19]">
                                {st.profile.fullTitle}
                              </div>
                              <div className="text-xs text-stone-500">
                                {st.profile.signatureMove}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          <span className="font-semibold text-[#0F1E19]">
                            {SPORTS_DEFINITIONS[st.goldenSport].name}
                          </span>
                          <span className="mx-1.5 text-stone-400">·</span>
                          <span
                            className={`font-mono ${
                              st.goldenBetWon
                                ? 'text-emerald-700 font-bold'
                                : 'text-stone-500'
                            }`}
                          >
                            {st.goldenBetWon ? '2x Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-xs text-stone-600">
                          {st.matchesPlayed}
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-xs font-bold text-emerald-700">
                          {st.wins}
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-xs text-stone-500">
                          {st.draws}
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-xs text-rose-700">
                          {st.losses}
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-xs font-bold text-[#0F1E19]">
                          {st.normalizedDiff >= 0
                            ? `+${st.normalizedDiff}`
                            : st.normalizedDiff}
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-xs text-stone-700">
                          {st.basePoints}
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-xs font-bold text-amber-700">
                          +{st.goldenBonusPoints}
                        </td>
                        <td className="py-4 px-4 text-right font-mono tabular-nums text-base font-bold text-[#0F1E19]">
                          {st.totalPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Golden Sport Double-Down Bet (2x Multiplier) Cards */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-[#0F1E19]">
                    Golden Sport Double-Down Bets (2x Multiplier)
                  </h2>
                  <p className="text-xs text-stone-600">
                    Each flatmate selects 1 Golden Sport. Winning that sport doubles all tournament points earned in that discipline!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summary.standings.map((st) => {
                  const chosenDef = SPORTS_DEFINITIONS[st.goldenSport];
                  const breakdown = st.sportPointsBreakdown[st.goldenSport];
                  return (
                    <div
                      key={st.playerId}
                      className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono text-stone-500 mb-2">
                          <span>{st.profile.fullTitle.toUpperCase()}</span>
                          <span
                            className={
                              st.goldenBetWon
                                ? 'text-emerald-700 font-bold'
                                : 'text-amber-700'
                            }
                          >
                            {st.goldenBetWon ? '2X MULTIPLIER CASHED' : 'AWAITING SPORT LEAD'}
                          </span>
                        </div>

                        <div className="text-xl font-display font-bold text-[#0F1E19] mb-1">
                          Golden Pick: {chosenDef.name}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-stone-600">
                          Base Sport Points: {breakdown.base} pts · 2x Bonus: +{breakdown.bonus} pts · Total: {breakdown.total} pts
                        </div>
                      </div>

                      <div className="pt-4 border-t border-stone-200">
                        <label className="block text-[11px] font-mono text-stone-500 mb-1.5">
                          CHANGE GOLDEN SPORT (REQUIRES ADMIN PIN 7777)
                        </label>
                        <select
                          value={st.goldenSport}
                          onChange={(e) =>
                            handleChangeGoldenBet(st.playerId, e.target.value as SportKey)
                          }
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold text-[#0F1E19]"
                        >
                          {ALL_SPORT_KEYS.map((sk) => (
                            <option key={sk} value={sk}>
                              {SPORTS_DEFINITIONS[sk].name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Direct Head-to-Head Records Matrix */}
            <section className="bg-white border border-stone-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Swords className="w-5 h-5 text-[#0F2922]" />
                <h2 className="text-2xl font-display font-bold text-[#0F1E19]">
                  Direct Head-to-Head Matchup Records
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    ['addy', 'pg'],
                    ['pg', 'dave'],
                    ['dave', 'addy'],
                  ] as const
                ).map(([p1, p2]) => {
                  const rec = summary.h2hMatrix[p1][p2];
                  const c1 = CONTENDERS[p1];
                  const c2 = CONTENDERS[p2];
                  return (
                    <div
                      key={`${p1}-${p2}`}
                      className="p-5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs text-stone-500">{c1.nickname}</div>
                        <div className="text-lg font-display font-bold text-[#0F1E19]">
                          {c1.name}
                        </div>
                      </div>

                      <div className="text-center font-mono tabular-nums">
                        <div className="text-2xl font-bold text-[#0F1E19]">
                          {rec.wins} — {rec.losses}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {rec.draws} Draw(s)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-stone-500">{c2.nickname}</div>
                        <div className="text-lg font-display font-bold text-[#0F1E19]">
                          {c2.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: SPORTS FIXTURES LOGGERS & RESULTS ANALYTICS */}
        {activeTab === 'fixtures' && (
          <SportsFixturesAndAnalytics
            state={tournamentState}
            summary={summary}
            isAdminUnlocked={isAdminUnlocked}
            onRequireUnlock={() => setShowPinModal(true)}
            onUpdateState={handleUpdateState}
          />
        )}

        {/* VIEW 3: TROPHY RACE TRACK & EXCUSE LEADERBOARD WITH THARTHAROMETER */}
        {activeTab === 'race_excuses' && (
          <TrophyRaceAndExcuses
            state={tournamentState}
            summary={summary}
            onUpdateState={handleUpdateState}
          />
        )}

        {/* VIEW 4: NEWSROOM SPORTS TABLOID & WHEEL OF CHORES */}
        {activeTab === 'news_chores' && (
          <NewsroomAndChores
            state={tournamentState}
            onGenerateBreakingNews={handleGenerateBreakingNews}
            isGeneratingNews={isGeneratingNews}
            onUpdateState={handleUpdateState}
          />
        )}

        {/* VIEW 5: HALL OF FAME TROPHIES ROOM & PREDICTION LEAGUE */}
        {activeTab === 'hall_of_fame' && (
          <PredictionsAndHallOfFame
            state={tournamentState}
            summary={summary}
            isAdminUnlocked={isAdminUnlocked}
            onRequireUnlock={() => setShowPinModal(true)}
            onUpdateState={handleUpdateState}
          />
        )}
      </main>

      {/* Floating Mascot Action Buttons: 🐶 Mia the Beagle & 🧹 Bai the Maid */}
      <FloatingMascotButtons />

      {/* Admin PIN 7777 Unlock Modal */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onUnlocked={() => setIsAdminUnlocked(true)}
      />

      {/* Data Backup, Snapshot Recovery & Firebase Cloud Sync Modal */}
      <DataBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        state={tournamentState}
        backupTimestamp={backupTimestamp}
        user={user}
        onImportState={persistTournamentState}
        onRestoreServerBackup={handleRestoreServerBackup}
        onResetToDefault={handleResetToDefault}
      />

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 lg:px-10 py-6 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          Hyberabaddies — Sportsman of the House Championship · Flat 2110 (Addy, PG &amp; Dave)
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowBackupModal(true)}
            className="hover:text-[#0F1E19] cursor-pointer"
          >
            Backup &amp; Cloud Sync
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="hover:text-[#0F1E19] cursor-pointer"
          >
            Commissioner PIN (7777)
          </button>
        </div>
      </footer>
    </div>
  );
}
