import React from 'react';
import { Sparkles, Coins, Trees, Play, Compass, Gem } from 'lucide-react';

interface ChallengeModalProps {
  onStart: () => void;
  onDismiss: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({ onStart, onDismiss }) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-lg mx-4 rounded-3xl border border-cyan-500/50 bg-slate-950/95 p-7 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800 shadow-inner">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">EPIC REALM QUEST</div>
            <h2 className="text-xl font-black text-white tracking-tight">RESTORE THE ANCIENT FOREST SHRINE</h2>
          </div>
          <span className="ml-auto rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800">
            CHAPTER I
          </span>
        </div>

        <div className="my-5 space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            The ancient shrine that protects the forest has lost its power. The sacred river channel is dry, the crossing bridge is collapsed, and the dragon gateway remains sealed.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
            <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase">QUEST SEQUENCE</div>
            <div className="flex items-start gap-2 text-slate-200">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-300 font-bold text-[10px] border border-cyan-800">1</span>
              <span><strong>Find 3 Ancient Crystals:</strong> Locate the Azure, Emerald, and Moon energy crystals scattered across the jungle.</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-300 font-bold text-[10px] border border-cyan-800">2</span>
              <span><strong>Restore Water Flow:</strong> Reposition the fallen aqueduct stones so river water flows freely to the shrine.</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-300 font-bold text-[10px] border border-cyan-800">3</span>
              <span><strong>Construct Forest Crossing:</strong> Gather timber logs and ropes, then assemble a sturdy bridge over the river ravine.</span>
            </div>
            <div className="flex items-start gap-2 text-slate-200">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-300 font-bold text-[10px] border border-cyan-800">4</span>
              <span><strong>Activate Forest Shrine:</strong> Insert the 3 crystals into the altar sockets to awaken the divine realm portal!</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
            <span className="text-[11px] font-bold text-amber-300 uppercase">TOTAL EXPEDITION REWARDS</span>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-cyan-400"><Sparkles className="h-3.5 w-3.5" /> 750+ XP</span>
              <span className="flex items-center gap-1 text-yellow-400"><Coins className="h-3.5 w-3.5" /> 375 Coins</span>
              <span className="flex items-center gap-1 text-purple-300"><Gem className="h-3.5 w-3.5" /> Ancient Relic</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onDismiss}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Explore First
          </button>
          <button
            onClick={onStart}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-black text-white shadow-xl hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer active:scale-98"
          >
            <Play className="h-4 w-4 fill-current" />
            BEGIN QUEST SEQUENCE
          </button>
        </div>
      </div>
    </div>
  );
};
