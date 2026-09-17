import React, { useState } from 'react';
import { sound } from '../audio/SoundManager';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  BookOpen,
  Gem,
  Droplets,
  Trees,
  Compass,
  HelpCircle,
  Play,
  X
} from 'lucide-react';

interface StoryModalProps {
  onStart: () => void;
  onDismiss: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  onStart,
  onDismiss,
}) => {
  const [activeTab, setActiveTab] = useState<'story' | 'steps' | 'controls'>('story');

  const handleStart = () => {
    sound.playCheer();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#ffd700', '#10b981', '#f43f5e', '#a855f7'],
    });
    onStart();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border-2 border-emerald-500/50 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header: Mimi Avatar, Title & Close */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/30">
              <span className="text-2xl animate-bounce">🧚</span>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-black">
                ✨
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
                  MIMI'S ADVENTURE STORY
                </span>
                <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700">
                  Kids & Explorer Guide
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                The Secret of the Sleeping Forest
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => {
              sound.playDialogueBlip();
              setActiveTab('story');
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'story'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>1. The Story</span>
          </button>

          <button
            onClick={() => {
              sound.playDialogueBlip();
              setActiveTab('steps');
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'steps'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>2. What To Do (4 Steps)</span>
          </button>

          <button
            onClick={() => {
              sound.playDialogueBlip();
              setActiveTab('controls');
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>3. Easy Controls</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 text-xs text-slate-300">
          {/* TAB 1: STORY */}
          {activeTab === 'story' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-teal-950/40 p-4.5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🧚‍♀️</span>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-200 leading-relaxed">
                      "Hello little explorer! I am Mimi, the fairy of this magical forest!"
                    </p>
                    <p className="leading-relaxed text-slate-200">
                      Once upon a time, this forest was filled with singing rivers, cheerful deer, and sweet flowers. But an ancient sleeping spell made the entire forest fall asleep!
                    </p>
                    <p className="leading-relaxed text-slate-200">
                      The river is dry, the crossing bridge has collapsed, and the sacred altar is silent. Will you be our kind hero and help wake up the magical forest?
                    </p>
                  </div>
                </div>
              </div>

              {/* Kid-friendly Sky Beacons tip */}
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/30 p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-900/80 text-cyan-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-cyan-300 text-xs">
                    🌟 Mimi's Secret Trick: Sky Light Beacons!
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    You will never get lost! Giant glowing beams of colored light shoot straight up into the sky over every objective! Just look up at the sky and walk toward the glowing light!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 4 EASY STEPS */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                4 Simple Steps to Awaken the Forest:
              </div>

              {/* Step 1 */}
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-950 text-cyan-300 font-black border border-cyan-700 text-sm">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-cyan-200 text-xs">
                    <Gem className="h-4 w-4 text-cyan-400" />
                    <span>Find 3 Magic Crystals</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                    Find the 3 glowing crystals: Blue (Stone Ruins), Green (Waterfall), and Purple (Mossy Hill). Walk up to each and press [E] to collect!
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-blue-500/30 bg-slate-900/80 p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-blue-300 font-black border border-blue-700 text-sm">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-blue-200 text-xs">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <span>Restore the Water Canal (2 Stones)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                    Pick up the 2 fallen stones with [E] and place them into the gaps along the stone canal. The refreshing river will immediately flow!
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-950 text-amber-300 font-black border border-amber-700 text-sm">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-amber-200 text-xs">
                    <Trees className="h-4 w-4 text-amber-400" />
                    <span>Build the River Crossing Bridge</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                    Gather 3 fallen tree logs and 2 strong rope bundles. Approach the river and press [E] to build a safe, walkable wooden bridge!
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-3.5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-950 text-purple-300 font-black border border-purple-700 text-sm">
                  4
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-purple-200 text-xs">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>Awaken the Forest Shrine Altar</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                    Walk across your new bridge, place the 3 crystals onto the sacred stone altar pedestals, and watch the legendary Dragon Gate open!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                Super Easy Game Controls:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 flex items-center gap-3">
                  <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-slate-800 font-mono font-black text-cyan-300 border border-slate-700 text-sm">
                    WASD
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Walk / Run</div>
                    <div className="text-[10px] text-slate-400">Move your character anywhere</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 flex items-center gap-3">
                  <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-slate-800 font-mono font-black text-cyan-300 border border-slate-700 text-sm">
                    Space
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Jump</div>
                    <div className="text-[10px] text-slate-400">Hop over rocks and river banks</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3 flex items-center gap-3">
                  <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-emerald-500 font-mono font-black text-black text-base shadow">
                    E
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300 text-xs">Interact / Pick Up</div>
                    <div className="text-[10px] text-slate-300">Collect crystals, stones, bridge logs</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-3 flex items-center gap-3">
                  <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-amber-500 font-mono font-black text-black text-base shadow">
                    H
                  </div>
                  <div>
                    <div className="font-bold text-amber-300 text-xs">Story & Mimi Hint</div>
                    <div className="text-[10px] text-slate-300">Open this guide anytime with [H]</div>
                  </div>
                </div>
              </div>

              {/* Mouse pointer look note */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-300 flex items-center gap-2.5">
                <Compass className="h-5 w-5 text-cyan-400 shrink-0" />
                <span>
                  Move your mouse to look around freely! Click "Lock Mouse Look" in top right for smooth mouse steering.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between gap-3">
          <button
            onClick={onDismiss}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Explore First
          </button>

          <button
            onClick={handleStart}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-xl hover:from-emerald-400 hover:to-cyan-400 transition-all cursor-pointer active:scale-98"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>LET'S SAVE THE FOREST! 🧚</span>
          </button>
        </div>

      </div>
    </div>
  );
};
