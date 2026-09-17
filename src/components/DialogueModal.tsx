import React, { useState } from 'react';
import { sound } from '../audio/SoundManager';
import { ShieldCheck, ArrowRight, FastForward, Sparkles } from 'lucide-react';

interface DialogueModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

const DIALOGUE_LINES: string[] = [
  "Welcome, brave young hero! You have arrived at the Grand Gate of the Realm.",
  "Beyond this gate lies the enchanted Hidden Forest. A sleeping spell has quieted the realm.",
  "The joyful singing river has stopped, the crossing bridge is broken, and the forest creatures are waiting for help!",
  "Mimi the Forest Fairy will fly right beside you to guide your steps.",
  "Look for the giant beams of colorful light shooting into the sky—they will show you where to go!",
  "Step forward through the gate, wake up the sleeping jungle, and restore the magic!",
];

export const DialogueModal: React.FC<DialogueModalProps> = ({
  onComplete,
  onSkip,
}) => {
  const [lineIndex, setLineIndex] = useState(0);

  const handleNext = () => {
    sound.playDialogueBlip();
    if (lineIndex < DIALOGUE_LINES.length - 1) {
      setLineIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    sound.playInteract();
    onSkip();
  };

  const isLastLine = lineIndex === DIALOGUE_LINES.length - 1;

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center pb-14 bg-black/50 backdrop-blur-[3px]">
      <div className="w-full max-w-2xl mx-4 rounded-3xl border-2 border-cyan-500/50 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Speaker Info */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-black tracking-wide text-cyan-400 text-sm sm:text-base">
                ANCIENT REALM GUARDIAN
              </h3>
              <p className="text-xs text-slate-400">
                Protector of the Grand Gate
              </p>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500">
            {lineIndex + 1} / {DIALOGUE_LINES.length}
          </div>
        </div>

        {/* Dialogue Text */}
        <div className="py-5 min-h-[95px] flex items-center">
          <p className="text-base sm:text-lg leading-relaxed font-serif text-slate-100 tracking-wide">
            &quot;{DIALOGUE_LINES[lineIndex]}&quot;
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <FastForward className="h-3.5 w-3.5" />
            SKIP
          </button>

          <button
            onClick={handleNext}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all cursor-pointer ${
              isLastLine
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-black hover:from-emerald-300 hover:to-cyan-300'
                : 'bg-cyan-500 text-black hover:bg-cyan-400'
            }`}
          >
            {isLastLine ? (
              <>
                <Sparkles className="h-4 w-4" />
                ENTER THE FOREST!
              </>
            ) : (
              <>
                NEXT
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
