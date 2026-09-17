import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Coins, Trees, Unlock, ArrowRight, Hammer, Award } from 'lucide-react';

export interface RewardModalProps {
  stageTitle?: string;
  questTitle?: string;
  description?: string;
  xp: number;
  coins: number;
  wood?: number;
  materials?: number;
  relic?: string;
  unlockedTitle?: string;
  onContinue: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  stageTitle = 'OBJECTIVE COMPLETE!',
  questTitle = 'ANCIENT REALM ADVANCEMENT',
  description = 'You have accomplished a critical trial in restoring the ancient enchanted realm.',
  xp,
  coins,
  wood,
  materials,
  relic,
  unlockedTitle,
  onContinue,
}) => {
  useEffect(() => {
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#ffd700', '#10b981', '#ffffff', '#a855f7'],
    });
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-4 rounded-3xl border-2 border-emerald-500/50 bg-slate-950/95 p-7 shadow-2xl backdrop-blur-2xl text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-xl shadow-emerald-500/30">
          <span className="text-3xl">🎉</span>
        </div>

        <div className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
          {stageTitle}
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mt-1 uppercase tracking-tight">
          {questTitle}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-300 px-2">
          {description}
        </p>

        {/* Rewards earned */}
        <div className="my-5 grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40 p-2.5">
            <Sparkles className="h-5 w-5 text-cyan-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">XP</span>
            <span className="text-base font-black text-cyan-200">+{xp}</span>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-yellow-500/30 bg-yellow-950/40 p-2.5">
            <Coins className="h-5 w-5 text-yellow-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Coins</span>
            <span className="text-base font-black text-yellow-200">+{coins}</span>
          </div>

          {relic ? (
            <div className="flex flex-col items-center rounded-2xl border border-purple-500/40 bg-purple-950/40 p-2.5">
              <Award className="h-5 w-5 text-purple-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-purple-300">Relic</span>
              <span className="text-xs font-black text-purple-200 truncate max-w-[85px]">{relic}</span>
            </div>
          ) : materials ? (
            <div className="flex flex-col items-center rounded-2xl border border-amber-500/30 bg-amber-950/40 p-2.5">
              <Hammer className="h-5 w-5 text-amber-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Materials</span>
              <span className="text-base font-black text-amber-200">+{materials}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-2.5">
              <Trees className="h-5 w-5 text-emerald-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Wood</span>
              <span className="text-base font-black text-emerald-200">+{wood ?? 3}</span>
            </div>
          )}
        </div>

        {/* Unlocked banner */}
        {unlockedTitle && (
          <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/50 py-2.5 px-4 text-xs font-semibold text-indigo-200">
            <Unlock className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>NEXT TRIAL: <strong className="text-white uppercase">{unlockedTitle}</strong></span>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 py-3 text-sm font-black text-black shadow-xl hover:from-emerald-300 hover:to-cyan-300 transition-all cursor-pointer active:scale-98"
        >
          <span>CONTINUE EXPLORATION</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
