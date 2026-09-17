import React, { useState } from 'react';
import { Play, HelpCircle, Settings, LogOut, Compass, Sparkles, RotateCcw } from 'lucide-react';
import { sound } from '../audio/SoundManager';

interface HomeScreenProps {
  hasSavedGame: boolean;
  onPlay: (isContinue: boolean) => void;
  onHowToPlay: () => void;
  onSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  hasSavedGame,
  onPlay,
  onHowToPlay,
  onSettings,
}) => {
  const [exitMessage, setExitMessage] = useState<string | null>(null);

  const handleStart = (isContinue: boolean) => {
    sound.playInteract();
    onPlay(isContinue);
  };

  const handleExit = () => {
    sound.playInteract();
    setExitMessage('Thanks for playing Adventure Quest World! See you on your next journey, explorer.');
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#070b14] via-[#0d1627] to-[#09111f] p-8 text-white select-none">
      {/* Mystical background accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Top Banner */}
      <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-950/60 px-5 py-1.5 backdrop-blur-md">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-semibold tracking-widest text-cyan-300">
          3D THIRD-PERSON ADVENTURE PROTOTYPE
        </span>
      </div>

      {/* Main Title Hero */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 shadow-2xl backdrop-blur-md">
          <Compass className="h-10 w-10 text-cyan-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-cinzel">
          ADVENTURE QUEST WORLD
        </h1>
        <div className="mt-2 text-sm md:text-base font-bold tracking-[0.25em] text-amber-400">
          RESTORE THE REALM
        </div>
        <p className="mt-4 max-w-md text-xs md:text-sm text-slate-400 leading-relaxed">
          The realm has shattered under an ancient corruption. As a human explorer, discover broken paths, manipulate 3D terrain, and physically restore the fallen world.
        </p>

        {/* Buttons List */}
        <div className="mt-8 flex flex-col items-center gap-3 w-72">
          {hasSavedGame && (
            <button
              onClick={() => handleStart(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>CONTINUE ADVENTURE</span>
            </button>
          )}

          <button
            onClick={() => handleStart(false)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3 text-sm font-bold text-slate-950 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{hasSavedGame ? 'NEW GAME' : 'PLAY'}</span>
          </button>

          <button
            onClick={onHowToPlay}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 text-xs font-bold text-slate-200 shadow-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>

          <button
            onClick={onSettings}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 text-xs font-bold text-slate-200 shadow-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={handleExit}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800/60 bg-transparent py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>EXIT</span>
          </button>
        </div>
      </div>

      {/* Exit dialog toast */}
      {exitMessage && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl text-center max-w-md">
          <p className="text-sm font-bold text-slate-100">{exitMessage}</p>
          <button
            onClick={() => setExitMessage(null)}
            className="mt-2 text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
          >
            Return to Menu
          </button>
        </div>
      )}

      {/* Footer Details */}
      <div className="flex items-center justify-between w-full text-[11px] text-slate-500">
        <span>WASD • Mouse Orbit • Space Jump • [E] Interact & Manipulate</span>
        <span>Adventure Quest World v1.0 • Browser 3D Engine</span>
      </div>
    </div>
  );
};
