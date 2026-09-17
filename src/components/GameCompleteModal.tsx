import React, { useState, useEffect } from 'react';
import { PlayerData } from '../types';
import { sound } from '../audio/SoundManager';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Award, RotateCcw, Home, Eye, CheckCircle2, Shield, Heart } from 'lucide-react';

interface GameCompleteModalProps {
  playerData: PlayerData;
  onPlayAgain: () => void;
  onExitToMenu: () => void;
}

export const GameCompleteModal: React.FC<GameCompleteModalProps> = ({
  playerData,
  onPlayAgain,
  onExitToMenu,
}) => {
  const [showJourney, setShowJourney] = useState(false);

  useEffect(() => {
    sound.playQuestFanfare();
    try {
      const end = Date.now() + 3000;
      const colors = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#6366f1'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // ignore
    }
  }, []);

  const artifacts = [
    { name: 'Ancient Forest Relic', found: true, phase: 'Phase 1: Hidden Forest' },
    { name: 'Rainbow Shard', found: playerData.rainbowShard ?? true, phase: 'Phase 2: Rainbow Bridge' },
    { name: 'Dragon Crest', found: playerData.dragonCrest ?? true, phase: 'Phase 3: Castle Place' },
    { name: 'Mystery Relic', found: playerData.mysteryRelic ?? true, phase: 'Phase 4: Mystery Island' },
    { name: 'Guardian Blossom', found: playerData.guardianBlossom ?? true, phase: 'Phase 5: Fairy Garden' },
    { name: 'Golden Dragon Heart', found: true, phase: 'Dragon Valley Restoration' },
  ];

  return (
    <div
      id="game-complete-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in fade-in duration-500 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#0b1329] via-[#090e1c] to-[#04060c] p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-white my-8">
        {/* Luminous glow circles */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-gradient-to-b from-amber-400/20 via-cyan-400/15 to-transparent blur-3xl" />

        <div className="space-y-6 text-center">
          {/* Guardian Icon Emblem */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-500/30 to-amber-900/50 text-amber-300 shadow-xl shadow-amber-500/20 animate-bounce duration-1000">
            <Trophy className="h-10 w-10 text-amber-300" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>The Realm is Restored</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
              The Guardian Has Awakened
            </h1>
            <p className="text-sm sm:text-base font-serif italic text-amber-200/90 max-w-lg mx-auto leading-relaxed pt-1">
              "You did not defeat the guardian. You saved it. The corruption is shattered, and harmony returns to the realm."
            </p>
          </div>

          {/* Journey stats overview */}
          {!showJourney ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
                  <div className="text-xs text-slate-400 font-medium">Phases Completed</div>
                  <div className="text-2xl font-black text-emerald-400">5 / 5</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
                  <div className="text-xs text-slate-400 font-medium">Total EXP</div>
                  <div className="text-2xl font-black text-amber-300">+{playerData.xp}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
                  <div className="text-xs text-slate-400 font-medium">Total Coins</div>
                  <div className="text-2xl font-black text-yellow-300">{playerData.coins}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
                  <div className="text-xs text-slate-400 font-medium">Relics Gathered</div>
                  <div className="text-2xl font-black text-cyan-300">{artifacts.length}</div>
                </div>
              </div>

              {/* Story conclusion callout */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-left flex items-start gap-3.5">
                <Heart className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <span className="font-bold text-cyan-300">A Legend Born: </span>
                  From the overgrown ruins of the Hidden Forest, through the Rainbow Bridge, the forgotten Castle, the glowing Mystery Island, and the serene Fairy Garden, your courage dissolved the dark corruption. The majestic Golden Dragon now watches peacefully over the realm for eternity.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-left animate-in fade-in duration-300 max-h-64 overflow-y-auto pr-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-1">
                Adventure Artifacts & Milestones:
              </div>
              {artifacts.map((art, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white">{art.name}</div>
                      <div className="text-xs text-slate-400">{art.phase}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Restored</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="btn-toggle-journey"
              onClick={() => {
                sound.playInteract();
                setShowJourney((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 cursor-pointer transition-all active:scale-98"
            >
              <Eye className="h-4 w-4 text-cyan-400" />
              <span>{showJourney ? 'Hide Journey' : 'View Journey'}</span>
            </button>

            <button
              id="btn-play-again"
              onClick={() => {
                sound.playInteract();
                onPlayAgain();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer transition-all active:scale-98"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>

            <button
              id="btn-exit-menu"
              onClick={() => {
                sound.playInteract();
                onExitToMenu();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 cursor-pointer transition-all active:scale-98"
            >
              <Home className="h-4 w-4" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
