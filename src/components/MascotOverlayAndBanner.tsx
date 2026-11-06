import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import {
  playTigerRoar,
  playPuppySqueak,
  playMaidScoldSound,
} from '../utils/audioEffects';

interface SheruBannerProps {
  quip: string;
  onRequestNewQuip: () => Promise<void>;
  isGenerating: boolean;
}

export const SheruMascotBanner: React.FC<SheruBannerProps> = ({
  quip,
  onRequestNewQuip,
  isGenerating,
}) => {
  const handleSheruClick = async () => {
    playTigerRoar();
    if (!isGenerating) {
      await onRequestNewQuip();
    }
  };

  return (
    <div
      onClick={handleSheruClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSheruClick();
        }
      }}
      className="bg-[#0C1713] border border-[#1E3A2F] hover:border-amber-500/80 text-white rounded-xl p-5 transition-colors cursor-pointer select-none"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          {/* Sheru Tiger SVG Emblem */}
          <div className="w-14 h-14 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden="true">
              <circle cx="32" cy="34" r="22" fill="#F59E0B" />
              <circle cx="16" cy="18" r="7" fill="#D97706" />
              <circle cx="48" cy="18" r="7" fill="#D97706" />
              {/* Tiger Stripes */}
              <path d="M22 18 L28 24 M42 18 L36 24" stroke="#0C1713" strokeWidth="3" strokeLinecap="round" />
              <path d="M12 32 L20 34 M52 32 L44 34" stroke="#0C1713" strokeWidth="3" strokeLinecap="round" />
              <path d="M14 40 L21 40 M50 40 L43 40" stroke="#0C1713" strokeWidth="2.5" strokeLinecap="round" />
              {/* Eyes */}
              <circle cx="24" cy="31" r="3" fill="#0C1713" />
              <circle cx="40" cy="31" r="3" fill="#0C1713" />
              {/* Snout */}
              <ellipse cx="32" cy="40" rx="8" ry="6" fill="#FEF3C7" />
              <polygon points="32,36 28,40 36,40" fill="#BE123C" />
              <path d="M28 43 Q32 46 36 43" stroke="#0C1713" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <span>SHERU THE TIGER MASCOT · OFFICIAL FLAT 2110 COMMENTATOR</span>
              <span>·</span>
              <span className="text-emerald-300">CLICK TO ROAR &amp; ROAST STANDINGS</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-stone-100 leading-snug">
              “{quip}”
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 text-[#0C1713] text-xs font-bold whitespace-nowrap">
            {isGenerating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Sheru Thinking...
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                Roar &amp; Quip
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

const BAI_SCOLD_QUOTES = [
  'ARRE DAVE BHAIYA! Calling yourself "Tiger Queen" while leaving 4 unwashed protein shakers in the sink?! First win a match against Addy & PG!',
  'DAVE! Wet towel on the Flat 2110 sofa AGAIN?! Even Mia the puppy has better house manners than you! Pick it up before I swing this jhadu!',
  'OHO TIGER QUEEN! Zero clean plates in the kitchen and you are busy checking Normalized Match Differential?! Go chop onions right now!',
];

export const FloatingMascotButtons: React.FC = () => {
  const [miaActive, setMiaActive] = useState<boolean>(false);
  const [miaRecalling, setMiaRecalling] = useState<boolean>(false);
  const [baiActive, setBaiActive] = useState<boolean>(false);
  const [baiRecalling, setBaiRecalling] = useState<boolean>(false);
  const [baiQuoteIndex, setBaiQuoteIndex] = useState<number>(0);

  const miaTimerRef = useRef<number | null>(null);
  const baiTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (miaTimerRef.current) window.clearTimeout(miaTimerRef.current);
      if (baiTimerRef.current) window.clearTimeout(baiTimerRef.current);
    };
  }, []);

  const handleToggleMia = () => {
    if (miaActive) {
      // Clicking again calls her back and ends animation early
      if (miaTimerRef.current) window.clearTimeout(miaTimerRef.current);
      setMiaRecalling(true);
      playPuppySqueak();
      miaTimerRef.current = window.setTimeout(() => {
        setMiaActive(false);
        setMiaRecalling(false);
      }, 350);
      return;
    }

    setMiaRecalling(false);
    setMiaActive(true);
    playPuppySqueak();

    miaTimerRef.current = window.setTimeout(() => {
      setMiaActive(false);
      setMiaRecalling(false);
    }, 6500);
  };

  const handleToggleBai = () => {
    if (baiActive) {
      // Clicking again calls her back and ends animation early
      if (baiTimerRef.current) window.clearTimeout(baiTimerRef.current);
      setBaiRecalling(true);
      playMaidScoldSound();
      baiTimerRef.current = window.setTimeout(() => {
        setBaiActive(false);
        setBaiRecalling(false);
      }, 350);
      return;
    }

    setBaiQuoteIndex((prev) => (prev + 1) % BAI_SCOLD_QUOTES.length);
    setBaiRecalling(false);
    setBaiActive(true);
    playMaidScoldSound();

    baiTimerRef.current = window.setTimeout(() => {
      setBaiActive(false);
      setBaiRecalling(false);
    }, 7500);
  };

  return (
    <>
      {/* Mia the Beagle Stage Overlay — Running to love PG ("Koniki Supermodel") */}
      {miaActive && (
        <div
          className="fixed inset-x-0 bottom-24 z-40 pointer-events-none flex justify-center px-4"
          aria-live="polite"
        >
          <div
            className={`max-w-xl w-full bg-[#0C1713]/95 border-2 border-amber-400 text-white rounded-2xl p-5 shadow-2xl transition-all duration-300 pointer-events-auto ${
              miaRecalling ? 'opacity-0 translate-x-24 scale-95' : 'opacity-100 translate-x-0 scale-100'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Beagle SVG + Floating Hearts */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 64 64" className="w-14 h-14" aria-label="Mia the Beagle">
                    {/* Floppy Beagle Ears */}
                    <ellipse cx="14" cy="34" rx="7" ry="14" fill="#78350F" />
                    <ellipse cx="50" cy="34" rx="7" ry="14" fill="#78350F" />
                    {/* Head */}
                    <circle cx="32" cy="30" r="16" fill="#FDE68A" />
                    <path d="M24 15 Q32 28 40 15" fill="#92400E" />
                    {/* White Blaze & Snout */}
                    <ellipse cx="32" cy="36" rx="9" ry="7" fill="#FFFFFF" />
                    <circle cx="25" cy="28" r="2.8" fill="#1C1917" />
                    <circle cx="39" cy="28" r="2.8" fill="#1C1917" />
                    <ellipse cx="32" cy="34" rx="4" ry="3" fill="#1C1917" />
                    {/* Happy Tongue */}
                    <path d="M29 40 Q32 47 35 40" fill="#FB7185" />
                  </svg>
                  <span className="absolute -top-2 -right-1 text-rose-500 text-lg font-bold animate-bounce">
                    ♥
                  </span>
                  <span className="absolute -top-3 left-1 text-rose-400 text-sm font-bold animate-bounce">
                    ♥
                  </span>
                </div>

                <div>
                  <div className="text-xs font-mono text-amber-400">
                    MIA THE BEAGLE SPRINTED ACROSS FLAT 2110 TO PG!
                  </div>
                  <div className="text-base font-display font-bold text-white mt-0.5">
                    *Squeak! Tail Wag!* Mia showers PG “Koniki Supermodel” with unconditional beagle love! ♥ ♥ ♥
                  </div>
                  <div className="text-xs text-stone-300 mt-1">
                    PG receives +100 Moral Support · Click 🐶 again to call Mia back early.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bai the Maid Stage Overlay — Running to scold Dave ("Tiger Queen") with Static Comic Speech Bubbles */}
      {baiActive && (
        <div
          className="fixed inset-x-0 bottom-28 z-40 pointer-events-none flex justify-center px-4"
          aria-live="polite"
        >
          <div
            className={`max-w-2xl w-full bg-white border-2 border-[#0F1E19] text-[#0F1E19] rounded-2xl p-5 shadow-2xl transition-all duration-300 pointer-events-auto ${
              baiRecalling ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Bai SVG Avatar with Jhadu (Broom) */}
              <div className="w-16 h-16 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 64 64" className="w-14 h-14" aria-label="Bai the Maid">
                  {/* Hair bun & Bindi */}
                  <circle cx="32" cy="14" r="8" fill="#1C1917" />
                  <circle cx="32" cy="30" r="15" fill="#D97706" />
                  <circle cx="32" cy="24" r="2" fill="#E11D48" />
                  {/* Stern Eyes & Eyebrows */}
                  <line x1="22" y1="25" x2="28" y2="27" stroke="#1C1917" strokeWidth="2.5" />
                  <line x1="42" y1="25" x2="36" y2="27" stroke="#1C1917" strokeWidth="2.5" />
                  <circle cx="25" cy="29" r="2.2" fill="#1C1917" />
                  <circle cx="39" cy="29" r="2.2" fill="#1C1917" />
                  {/* Scolding Mouth */}
                  <rect x="27" y="36" width="10" height="4" rx="2" fill="#7F1D1D" />
                  {/* Broom (Jhadu) */}
                  <line x1="48" y1="12" x2="58" y2="54" stroke="#78350F" strokeWidth="3.5" />
                  <polygon points="44,14 54,8 52,22" fill="#F59E0B" />
                </svg>
              </div>

              {/* Static Comic Speech Bubble */}
              <div className="flex-1 bg-amber-50 border-2 border-[#0F1E19] rounded-xl p-4 relative">
                <div className="text-[11px] font-mono font-bold text-rose-700 mb-1">
                  BAI STORMS INTO DAVE “TIGER QUEEN”’S ROOM · COMIC SCOLDING BUBBLE
                </div>
                <p className="text-sm font-bold text-[#0F1E19] leading-snug">
                  “{BAI_SCOLD_QUOTES[baiQuoteIndex]}”
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-stone-600">
                  <span>TARGET: DAVE "TIGER QUEEN" · THARTHAROMETER +15%</span>
                  <span>CLICK 🧹 AGAIN TO CALL BAI BACK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleToggleMia}
          title={
            miaActive
              ? 'Call Mia the Beagle back'
              : 'Send Mia the Beagle to love PG ("Koniki Supermodel")'
          }
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full border-2 font-semibold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer ${
            miaActive
              ? 'bg-amber-400 text-[#0C1713] border-[#0C1713]'
              : 'bg-[#0C1713] text-white border-amber-400/70 hover:border-amber-400'
          }`}
        >
          <span className="text-base" aria-hidden="true">
            🐶
          </span>
          <span className="whitespace-nowrap">
            {miaActive ? 'Recall Mia' : 'Mia -> Love PG'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleBai}
          title={
            baiActive
              ? 'Call Bai back to the kitchen'
              : 'Send Bai to scold Dave ("Tiger Queen")'
          }
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full border-2 font-semibold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer ${
            baiActive
              ? 'bg-rose-600 text-white border-[#0C1713]'
              : 'bg-[#0C1713] text-white border-rose-400/70 hover:border-rose-400'
          }`}
        >
          <span className="text-base" aria-hidden="true">
            🧹
          </span>
          <span className="whitespace-nowrap">
            {baiActive ? 'Recall Bai' : 'Bai -> Scold Dave'}
          </span>
        </button>
      </div>
    </>
  );
};
