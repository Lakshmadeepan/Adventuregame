import React, { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { LocationId, PlayerData, QuestData, GameProgress, GameSettings } from './types';
import { HomeScreen } from './components/HomeScreen';
import { GameCanvas } from './components/GameCanvas';
import { InstructionsModal } from './components/InstructionsModal';
import { SettingsModal } from './components/SettingsModal';
import { sound } from './audio/SoundManager';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('aqw_player_v2');
      localStorage.removeItem('aqw_quest_v2');
      localStorage.removeItem('aqw_progress_v2');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#070b14] p-8 text-center text-white">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-serif">Realm Rift Encountered</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            The adventure encountered an unexpected issue while rendering the 3D scene.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart Adventure Realm</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DEFAULT_PLAYER: PlayerData = {
  name: 'Explorer Robin',
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  xp: 0,
  coins: 0,
  wood: 0,
  level: 1,
};

const DEFAULT_QUEST: QuestData = {
  currentQuest: 'SPEAK WITH THE REALM GUARDIAN',
  questStatus: 'ACTIVE',
  objective: 'Approach the Grand Gate and speak with the Guardian to learn about the realm.',
  reward: { xp: 100, coins: 50, wood: 3 },
};

const DEFAULT_PROGRESS: GameProgress = {
  currentLocation: 'GRAND_GATE',
  currentPhase: 1,
  unlockedPhases: [1],
  guardianDialogueCompleted: false,
  hiddenForestUnlocked: false,
  challenge01Started: false,
  challenge01Completed: false,
  challenge02Unlocked: false,
  dragonValleyUnlocked: false,
  gameCompleted: false,
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.45,
  sfxVolume: 0.75,
  mouseSensitivity: 1.0,
  invertY: false,
};

export default function App() {
  const [view, setView] = useState<'HOME' | 'GAME'>('HOME');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved state or use defaults
  const [playerData, setPlayerData] = useState<PlayerData>(() => {
    try {
      const saved = localStorage.getItem('aqw_player_v2');
      return saved ? JSON.parse(saved) : DEFAULT_PLAYER;
    } catch {
      return DEFAULT_PLAYER;
    }
  });

  const [questData, setQuestData] = useState<QuestData>(() => {
    try {
      const saved = localStorage.getItem('aqw_quest_v2');
      return saved ? JSON.parse(saved) : DEFAULT_QUEST;
    } catch {
      return DEFAULT_QUEST;
    }
  });

  const [progress, setProgress] = useState<GameProgress>(() => {
    try {
      const saved = localStorage.getItem('aqw_progress_v2');
      return saved ? JSON.parse(saved) : DEFAULT_PROGRESS;
    } catch {
      return DEFAULT_PROGRESS;
    }
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('aqw_settings_v2');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [currentLocation, setCurrentLocation] = useState<LocationId>(progress.currentLocation);

  // Sync settings with SoundManager
  useEffect(() => {
    sound.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings]);

  // Check if saved game exists
  const hasSavedGame = Boolean(
    progress.guardianDialogueCompleted || progress.challenge01Completed || playerData.xp > 0
  );

  // Save Progress
  const handleSaveProgress = useCallback(() => {
    try {
      localStorage.setItem('aqw_player_v2', JSON.stringify(playerData));
      localStorage.setItem('aqw_quest_v2', JSON.stringify(questData));
      localStorage.setItem('aqw_progress_v2', JSON.stringify(progress));
      localStorage.setItem('aqw_settings_v2', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [playerData, questData, progress, settings]);

  useEffect(() => {
    handleSaveProgress();
  }, [playerData, questData, progress, settings, handleSaveProgress]);

  // Start or Continue Game
  const handlePlay = (isContinue: boolean) => {
    sound.playInteract();

    if (!isContinue) {
      // New Game: Reset state
      setPlayerData(DEFAULT_PLAYER);
      setQuestData(DEFAULT_QUEST);
      setProgress(DEFAULT_PROGRESS);
      setCurrentLocation('GRAND_GATE');
    } else {
      // Continue from saved location
      setCurrentLocation(progress.currentLocation);
    }

    setView('GAME');
  };

  // Change location callback
  const handleChangeLocation = (loc: LocationId) => {
    setCurrentLocation(loc);
    setProgress((prev) => ({
      ...prev,
      currentLocation: loc,
      hiddenForestUnlocked: loc === 'HIDDEN_FOREST' ? true : prev.hiddenForestUnlocked,
    }));
  };

  return (
    <ErrorBoundary>
      <div className="relative h-full w-full min-h-screen overflow-hidden bg-black font-sans text-slate-100">
        {view === 'HOME' ? (
          <HomeScreen
            hasSavedGame={hasSavedGame}
            onPlay={handlePlay}
            onHowToPlay={() => {
              sound.playInteract();
              setShowInstructions(true);
            }}
            onSettings={() => {
              sound.playInteract();
              setShowSettings(true);
            }}
          />
        ) : (
          <GameCanvas
            playerData={playerData}
            questData={questData}
            currentLocation={currentLocation}
            progress={progress}
            onUpdatePlayerData={setPlayerData}
            onUpdateQuestData={setQuestData}
            onUpdateProgress={setProgress}
            onChangeLocation={handleChangeLocation}
            onSaveProgress={handleSaveProgress}
            onExitToMenu={() => {
              sound.playInteract();
              setView('HOME');
            }}
          />
        )}

        {/* Global Modals from Home Menu */}
        {showInstructions && (
          <InstructionsModal
            onClose={() => {
              sound.playInteract();
              setShowInstructions(false);
            }}
          />
        )}

        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={setSettings}
            onClose={() => {
              sound.playInteract();
              setShowSettings(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
