import React, { useState } from 'react';
import { sound } from '../audio/SoundManager';
import { Flame, ArrowRight, Sparkles, Heart, Zap, CheckCircle2 } from 'lucide-react';

export interface ElderDialogueData {
  levelNumber: number;
  levelTitle: string;
  stageName: string;
  lines: string[];
  tip?: string;
}

interface ElderSageModalProps {
  dialogueData: ElderDialogueData;
  onDismiss: () => void;
}

export const ElderSageModal: React.FC<ElderSageModalProps> = ({
  dialogueData,
  onDismiss,
}) => {
  const [lineIndex, setLineIndex] = useState(0);

  const handleNext = () => {
    sound.playDialogueBlip();
    if (lineIndex < dialogueData.lines.length - 1) {
      setLineIndex((prev) => prev + 1);
    } else {
      sound.playElderVoice();
      onDismiss();
    }
  };

  const isLastLine = lineIndex === dialogueData.lines.length - 1;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-12 sm:pb-16 bg-black/60 backdrop-blur-[4px]">
      <div className="w-full max-w-2xl mx-4 rounded-3xl border-2 border-amber-500/60 bg-stone-950/95 p-6 shadow-2xl shadow-amber-950/40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header: Sage Portrait & Level Pill */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 shadow-lg shadow-amber-500/30 text-white font-black text-xl">
              🧙‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black tracking-wide text-amber-400 text-sm sm:text-base">
                  SAGE ELDRIN
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Level {dialogueData.levelNumber} Guide
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Wise Elder of the Ancient Realms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-stone-900 border border-stone-800 px-3 py-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span className="text-[11px] font-semibold text-stone-300">
              {lineIndex + 1} / {dialogueData.lines.length}
            </span>
          </div>
        </div>

        {/* Level Progression Indicator (1 to 5) */}
        <div className="mt-3 flex items-center justify-between gap-1 px-1">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const isCompleted = lvl < dialogueData.levelNumber;
            const isCurrent = lvl === dialogueData.levelNumber;
            return (
              <div
                key={lvl}
                className={`flex-1 flex items-center justify-center py-1 rounded-lg text-[10px] font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                    : isCurrent
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30 font-black'
                    : 'bg-stone-900 text-stone-500 border border-stone-800'
                }`}
              >
                {isCompleted ? '✓ ' : ''}Lvl {lvl}
              </div>
            );
          })}
        </div>

        {/* Spoken Advice */}
        <div className="mt-4 min-h-[90px] rounded-2xl bg-stone-900/80 p-4.5 border border-stone-800/80">
          <p className="text-sm sm:text-base leading-relaxed text-stone-100 font-medium">
            "{dialogueData.lines[lineIndex]}"
          </p>

          {dialogueData.tip && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-300">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <span>{dialogueData.tip}</span>
            </div>
          )}
        </div>

        {/* Aura Benefit Reminder */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <Heart className="h-3 w-3 fill-emerald-400" /> Healing Aura Active
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="h-3 w-3 fill-amber-400" /> Stamina Restores
            </span>
          </div>
          <span className="text-stone-500">Press [Space] or click to advance</span>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span>{isLastLine ? 'Thank You, Elder Sage!' : 'Continue'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
