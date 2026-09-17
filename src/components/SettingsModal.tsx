import React from 'react';
import { X, Volume2, Music, Sliders } from 'lucide-react';
import { GameSettings } from '../types';
import { sound } from '../audio/SoundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleMusicChange = (val: number) => {
    const updated = { ...settings, musicVolume: val };
    onUpdateSettings(updated);
    sound.setVolumes(val, settings.sfxVolume);
  };

  const handleSfxChange = (val: number) => {
    const updated = { ...settings, sfxVolume: val };
    onUpdateSettings(updated);
    sound.setVolumes(settings.musicVolume, val);
    sound.playInteract();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-md mx-4 rounded-3xl border border-slate-700/60 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h3 className="font-bold text-white tracking-wide">SETTINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-6 space-y-6">
          {/* Music Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2 font-medium">
                <Music className="h-4 w-4 text-cyan-400" /> Music Volume
              </span>
              <span className="font-mono text-cyan-400">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-slate-800 accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Sound Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2 font-medium">
                <Volume2 className="h-4 w-4 text-amber-400" /> Sound Volume
              </span>
              <span className="font-mono text-amber-400">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg bg-slate-800 accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-100 hover:bg-slate-700 transition-colors"
        >
          BACK
        </button>
      </div>
    </div>
  );
};
