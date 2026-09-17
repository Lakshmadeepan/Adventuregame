import React, { useState, useEffect } from 'react';
import { GuardianTransitionData } from '../types';
import { sound } from '../audio/SoundManager';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowRight, Shield, Award, CheckCircle2, ChevronRight, Compass } from 'lucide-react';

interface GuardianTransitionModalProps {
  data: GuardianTransitionData;
  onContinue: () => void;
}

export const GuardianTransitionModal: React.FC<GuardianTransitionModalProps> = ({
  data,
  onContinue,
}) => {
  const [step, setStep] = useState<'REWARD' | 'GUARDIAN_GUIDANCE' | 'NEXT_PHASE'>('REWARD');
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    sound.playQuestFanfare();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#f43f5e'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleNextDialogue = () => {
    sound.playInteract();
    if (quoteIndex < data.guardianQuotes.length - 1) {
      setQuoteIndex((prev) => prev + 1);
    } else {
      setStep('NEXT_PHASE');
    }
  };

  return (
    <div
      id="guardian-transition-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#040711] p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-white">
        {/* Mystic ambient background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* STEP 1: PHASE COMPLETION & REWARD */}
        {step === 'REWARD' && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Phase {data.completedPhase} Complete</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 drop-shadow">
                {data.completedPhaseName} Restored
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                You have solved the ancient mechanisms and brought stability back to this sanctuary.
              </p>
            </div>

            {/* Rewards showcase cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3 text-center">
                <div className="text-xs text-amber-300/80 font-medium">EXP Earned</div>
                <div className="text-xl font-bold text-amber-300">+{data.reward.xp} XP</div>
              </div>
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/30 p-3 text-center">
                <div className="text-xs text-yellow-300/80 font-medium">Coins</div>
                <div className="text-xl font-bold text-yellow-300">+{data.reward.coins}</div>
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-3 text-center ring-1 ring-cyan-500/30">
                <div className="text-xs text-cyan-300/80 font-medium">Story Artifact</div>
                <div className="text-sm font-bold text-cyan-200 truncate">{data.reward.item}</div>
              </div>
            </div>

            <div className="pt-4">
              <button
                id="btn-hear-guardian"
                onClick={() => {
                  sound.playInteract();
                  setStep('GUARDIAN_GUIDANCE');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-8 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-98"
              >
                <span>Hear the Guardian's Guidance</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GUARDIAN GUIDANCE DIALOGUE */}
        {step === 'GUARDIAN_GUIDANCE' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-900/40 text-amber-300 shadow-md">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                  Ancient Realm Guardian
                </div>
                <h3 className="text-lg font-bold text-white font-serif">Echo of the Protector</h3>
              </div>
            </div>

            {/* Cinematic Speech Bubble */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-5 sm:p-6 shadow-inner relative">
              <p className="text-lg sm:text-xl font-medium leading-relaxed text-slate-100 italic font-serif">
                "{data.guardianQuotes[quoteIndex]}"
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <span>
                  Wisdom {quoteIndex + 1} of {data.guardianQuotes.length}
                </span>
                <span className="text-amber-400/80">Listen closely to the ancient path...</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="btn-next-guardian-quote"
                onClick={handleNextDialogue}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all active:scale-98"
              >
                <span>{quoteIndex < data.guardianQuotes.length - 1 ? 'Next Guidance' : 'Continue'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: NEXT PHASE UNLOCKED PREVIEW */}
        {step === 'NEXT_PHASE' && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span>Phase {data.nextPhase} Unlocked</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-100 to-cyan-300">
                {data.nextPhasePreview.title}
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                {data.nextPhasePreview.description}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left flex items-start gap-3">
              <Compass className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold uppercase text-cyan-300">Next Objective</div>
                <div className="text-sm text-slate-200 font-medium">
                  Travel into {data.nextPhaseName} and uncover its ancient secrets.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-begin-next-phase"
                onClick={() => {
                  sound.playInteract();
                  onContinue();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 cursor-pointer transition-all active:scale-98"
              >
                <span>Enter {data.nextPhaseName}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
