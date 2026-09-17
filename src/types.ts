export type LocationId =
  | 'GRAND_GATE'
  | 'HIDDEN_FOREST'
  | 'RAINBOW_BRIDGE'
  | 'CASTLE_PLACE'
  | 'MYSTERY_ISLAND'
  | 'FAIRY_GARDEN'
  | 'DRAGON_VALLEY';

export type GamePhase = 1 | 2 | 3 | 4 | 5;

export type QuestStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED';

export type PuzzleState = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export type ForestQuestStage =
  | 'CRYSTALS'         // Stage 1: Find Azure, Emerald, Moon crystals
  | 'WATER_FLOW'       // Stage 2: Restore broken water channel with 2 stones
  | 'GATHER_MATERIALS' // Stage 3: Collect 3 logs & 2 ropes
  | 'BUILD_BRIDGE'     // Stage 4: Place 3 logs & attach 2 ropes across ravine
  | 'SHRINE_CRYSTALS'  // Stage 5: Insert 3 crystals into shrine sockets
  | 'COMPLETED'        // Shrine activated, gate open
  | 'DRAGON_VALLEY';   // Legacy stage

export interface PlayerData {
  name: string;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  coins: number;
  wood: number;
  level: number;
  // Adventure inventory items
  azureCrystal?: boolean;
  emeraldCrystal?: boolean;
  moonCrystal?: boolean;
  logsCollected?: number;
  ropesCollected?: number;
  buildingMaterials?: number;
  ancientRelics?: number;
  // Key Phase Story Artifacts
  rainbowShard?: boolean;
  dragonCrest?: boolean;
  mysteryRelic?: boolean;
  guardianBlossom?: boolean;
  dragonPurified?: boolean;
}

export interface GameProgress {
  currentLocation: LocationId;
  currentPhase: GamePhase;
  unlockedPhases: GamePhase[];
  guardianDialogueCompleted: boolean;
  hiddenForestUnlocked: boolean;
  challenge01Started: boolean;
  challenge01Completed: boolean;
  challenge02Unlocked: boolean;
  dragonValleyUnlocked: boolean;
  gameCompleted: boolean;
  // Phase completion flags
  phase1Completed?: boolean;
  phase2Completed?: boolean;
  phase3Completed?: boolean;
  phase4Completed?: boolean;
  phase5Completed?: boolean;
  // Detailed Forest quest tracking
  forestStage?: ForestQuestStage;
  crystalsFound?: number;
  waterRestored?: boolean;
  bridgeCompleted?: boolean;
  shrineActivated?: boolean;
}

export interface QuestData {
  currentQuest: string;
  questStatus: QuestStatus;
  objective: string;
  phase?: GamePhase;
  phaseName?: string;
  subtasks?: { id: string; label: string; done: boolean }[];
  reward: {
    xp: number;
    coins: number;
    wood: number;
    materials?: number;
    relic?: string;
    phaseItem?: string;
  };
  // Multi-stage quest progress details
  stage?: ForestQuestStage;
  levelNumber?: number; // 1 to 5
  crystalsFound?: number;
  hasAzure?: boolean;
  hasEmerald?: boolean;
  hasMoon?: boolean;
  waterStonesPlaced?: number;
  logsGathered?: number;
  ropesGathered?: number;
  bridgeLogsPlaced?: number;
  bridgeRopesAttached?: number;
  shrineCrystalsInserted?: number;
  dragonBraziersLit?: number;
  dragonAwakened?: boolean;
}

export interface GuardianTransitionData {
  completedPhase: GamePhase;
  completedPhaseName: string;
  nextPhase: GamePhase;
  nextPhaseName: string;
  nextLocation: LocationId;
  reward: {
    xp: number;
    coins: number;
    item: string;
    icon: string;
  };
  guardianQuotes: string[];
  nextPhasePreview: {
    title: string;
    description: string;
  };
}

export interface PuzzleTarget {
  id: string;
  name: string;
  targetType: 'water_stone' | 'bridge_log' | 'shrine_socket';
  position: [number, number, number];
  targetRotationY: number; // in radians
  toleranceRadius: number;
  toleranceAngle: number; // in radians
  completed: boolean;
}

export interface MovableObjectState {
  id: string;
  name: string;
  type: 'water_stone' | 'bridge_log';
  currentPosition: [number, number, number];
  currentRotationY: number; // in radians
  placed: boolean;
  locked: boolean;
  initialPosition: [number, number, number];
  initialRotationY: number;
}

export interface WorldState {
  placedObjects: string[];
  completedTargets: string[];
  puzzleObjects: MovableObjectState[];
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  invertY: boolean;
}

export interface InteractionPrompt {
  visible: boolean;
  text: string;
  key: string;
  action: () => void;
  type: 'NPC' | 'MOVABLE' | 'GATE' | 'CHALLENGE' | 'CRYSTAL' | 'RESOURCE' | 'SHRINE';
}
