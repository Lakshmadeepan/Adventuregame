import React from 'react';
import { X, Gamepad2, Move, RotateCw, Hand, Eye } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-lg mx-4 rounded-3xl border border-cyan-500/40 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="h-5 w-5 text-cyan-400" />
            <h3 className="font-bold text-white tracking-wide">HOW TO PLAY</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-5 space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <Move className="h-4 w-4" /> Movement
              </div>
              <div><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-white">WASD</kbd> Move explorer</div>
              <div><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-white">Space</kbd> Jump over rocks</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <Eye className="h-4 w-4" /> Camera Look
              </div>
              <div><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-white">Mouse Drag</kbd> Orbit camera</div>
              <div>Click &apos;Lock Mouse Look&apos; for free FPS-style control</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Hand className="h-4 w-4" /> Interact & Pick Up
              </div>
              <div><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-amber-300">E</kbd> Talk to NPC</div>
              <div><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-amber-300">E</kbd> Pick up movable logs / rocks</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <RotateCw className="h-4 w-4" /> Rotate & Place
              </div>
              <div><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-300">R</kbd> Rotate held item 45°</div>
              <div><kbd className="rounded bg-emerald-900 px-1.5 py-0.5 font-mono text-white">Left Click</kbd> Place object</div>
              <div><kbd className="rounded bg-red-900 px-1.5 py-0.5 font-mono text-white">Right Click</kbd> Cancel</div>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5">
            <h4 className="font-bold text-cyan-300 text-xs mb-1">THE ENVIRONMENT IS THE PUZZLE</h4>
            <p className="leading-relaxed text-slate-300">
              The fallen realm cannot be crossed normally. You must physically inspect broken paths, pick up materials, rotate them to bridge spans, and align them with mystical target zones to restore the realm!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-black hover:bg-cyan-400 transition-colors"
        >
          GOT IT, LET&apos;S ADVENTURE!
        </button>
      </div>
    </div>
  );
};
