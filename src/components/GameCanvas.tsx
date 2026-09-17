import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LocationId, PlayerData, QuestData, GameProgress, GuardianTransitionData } from '../types';
import { PlayerController } from '../engine/PlayerController';
import { InputManager } from '../engine/InputManager';
import { WorldBuilder, WorldBuildResult } from '../engine/WorldBuilder';
import { PuzzleManager } from '../engine/PuzzleManager';
import { RainbowBridgePhase } from '../engine/phases/RainbowBridgePhase';
import { CastlePlacePhase } from '../engine/phases/CastlePlacePhase';
import { MysteryIslandPhase } from '../engine/phases/MysteryIslandPhase';
import { FairyGardenAndDragonValleyPhase } from '../engine/phases/FairyGardenAndDragonValleyPhase';
import { HUD } from './HUD';
import { DialogueModal } from './DialogueModal';
import { ChallengeModal } from './ChallengeModal';
import { RewardModal, RewardModalProps } from './RewardModal';
import { StoryModal } from './StoryModal';
import { ElderSageModal, ElderDialogueData } from './ElderSageModal';
import { GuardianTransitionModal } from './GuardianTransitionModal';
import { GameCompleteModal } from './GameCompleteModal';
import { sound } from '../audio/SoundManager';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface GameCanvasProps {
  playerData: PlayerData;
  questData: QuestData;
  currentLocation: LocationId;
  progress?: GameProgress;
  onUpdatePlayerData: React.Dispatch<React.SetStateAction<PlayerData>>;
  onUpdateQuestData: React.Dispatch<React.SetStateAction<QuestData>>;
  onUpdateProgress?: React.Dispatch<React.SetStateAction<GameProgress>>;
  onChangeLocation: (location: LocationId) => void;
  onSaveProgress: () => void;
  onExitToMenu: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerData,
  questData,
  currentLocation,
  progress,
  onUpdatePlayerData,
  onUpdateQuestData,
  onUpdateProgress,
  onChangeLocation,
  onSaveProgress,
  onExitToMenu,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const worldRef = useRef<WorldBuildResult | null>(null);
  const puzzleRef = useRef<PuzzleManager | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Phase controller refs
  const rainbowPhaseRef = useRef<RainbowBridgePhase | null>(null);
  const castlePhaseRef = useRef<CastlePlacePhase | null>(null);
  const islandPhaseRef = useRef<MysteryIslandPhase | null>(null);
  const phase5Ref = useRef<FairyGardenAndDragonValleyPhase | null>(null);

  // State refs to avoid tearing down the Three.js loop on React state changes
  const currentLocationRef = useRef<LocationId>(currentLocation);
  currentLocationRef.current = currentLocation;

  const questDataRef = useRef<QuestData>(questData);
  questDataRef.current = questData;

  const playerDataRef = useRef<PlayerData>(playerData);
  playerDataRef.current = playerData;

  const onUpdatePlayerDataRef = useRef(onUpdatePlayerData);
  onUpdatePlayerDataRef.current = onUpdatePlayerData;

  const onUpdateQuestDataRef = useRef(onUpdateQuestData);
  onUpdateQuestDataRef.current = onUpdateQuestData;

  const onSaveProgressRef = useRef(onSaveProgress);
  onSaveProgressRef.current = onSaveProgress;

  // Narrative State
  const [showStoryModal, setShowStoryModal] = useState(false);
  const hasShownStoryModalRef = useRef(false);

  // Modals & UI state
  const [showDialogue, setShowDialogue] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showElderModal, setShowElderModal] = useState(false);
  const [elderDialogueData, setElderDialogueData] = useState<ElderDialogueData | null>(null);
  const [rewardModalData, setRewardModalData] = useState<Omit<RewardModalProps, 'onContinue'>>({
    xp: 100,
    coins: 50,
  });
  const [guardianTransitionData, setGuardianTransitionData] = useState<GuardianTransitionData | null>(null);
  const [showGameComplete, setShowGameComplete] = useState(false);
  const [interactionText, setInteractionText] = useState<string | null>(null);
  const [heldObjectName, setHeldObjectName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [targetInfo, setTargetInfo] = useState<any>(null);

  // Keep modal flags in refs for the 60fps render loop
  const modalsOpenRef = useRef({
    dialogue: false,
    challenge: false,
    reward: false,
    story: false,
    elder: false,
    guardianTransition: false,
    gameComplete: false,
  });
  modalsOpenRef.current = {
    dialogue: showDialogue,
    challenge: showChallengeModal,
    reward: showRewardModal,
    story: showStoryModal,
    elder: showElderModal,
    guardianTransition: Boolean(guardianTransitionData),
    gameComplete: showGameComplete,
  };

  const interactionTextRef = useRef<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const lastTargetCheckTimeRef = useRef<number>(0);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback({ text, type });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 3200);
  }, []);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Helper to sync quest state into React UI
  const syncQuestState = useCallback(() => {
    const puzzle = puzzleRef.current;
    if (!puzzle) return;
    const crystalsCount = puzzle.crystals.filter((c) => c.collected).length;
    const stonesCount = puzzle.waterTargets.filter((t) => t.completed).length;
    const logsGathered = puzzle.scatteredLogs.filter((l) => l.collected).length;
    const ropesGathered = puzzle.scatteredRopes.filter((r) => r.collected).length;
    const bridgeLogsPlaced = puzzle.bridgeSlots.filter((s) => s.placed).length;
    const bridgeRopesAttached = puzzle.bridgeRopeAnchors.filter((r) => r.attached).length;
    const shrineCrystalsInserted = puzzle.shrineSockets.filter((s) => s.inserted).length;
    const dragonBraziersLit = puzzle.dragonBraziers.filter((b) => b.lit).length;
    const dragonAwakened = puzzle.isDragonAwakened;
    const levelNumber = puzzle.getLevelNumber();

    let objectiveText = '';
    if (puzzle.currentStage === 'CRYSTALS') {
      objectiveText = `Level 1: Find 3 Ancient Energy Crystals in the jungle (${crystalsCount}/3). Sage Eldrin guides you.`;
    } else if (puzzle.currentStage === 'WATER_FLOW') {
      objectiveText = `Level 2: Restore the aqueduct water flow by placing the 2 stones into the gaps (${stonesCount}/2).`;
    } else if (puzzle.currentStage === 'GATHER_MATERIALS') {
      objectiveText = `Level 3: Gather bridge materials: 3 timber logs (${logsGathered}/3) and 2 sturdy ropes (${ropesGathered}/2).`;
    } else if (puzzle.currentStage === 'BUILD_BRIDGE') {
      objectiveText = `Level 3: Construct the bridge crossing (${bridgeLogsPlaced}/3 logs, ${bridgeRopesAttached}/2 ropes).`;
    } else if (puzzle.currentStage === 'SHRINE_CRYSTALS') {
      objectiveText = `Level 4: Cross the bridge to the Ancient Shrine and insert the 3 crystals into the altar sockets (${shrineCrystalsInserted}/3).`;
    } else if (puzzle.currentStage === 'DRAGON_VALLEY') {
      objectiveText = `Level 5: Enter Dragon Valley! Ignite both Dragon Braziers (${dragonBraziersLit}/2) and awaken the Golden Dragon Totem!`;
    } else {
      objectiveText = `All 5 Levels Conquered! Peace has returned to the realm and the Golden Dragon reigns supreme!`;
    }

    onUpdateQuestDataRef.current((prev) => ({
      ...prev,
      currentQuest: puzzle.currentStage === 'DRAGON_VALLEY' || puzzle.currentStage === 'COMPLETED' 
        ? 'TRIALS OF DRAGON VALLEY' 
        : 'RESTORE THE ANCIENT FOREST SHRINE',
      questStatus: puzzle.currentStage === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
      objective: objectiveText,
      stage: puzzle.currentStage,
      levelNumber,
      crystalsFound: crystalsCount,
      hasAzure: puzzle.crystals.find((c) => c.id === 'azure')?.collected,
      hasEmerald: puzzle.crystals.find((c) => c.id === 'emerald')?.collected,
      hasMoon: puzzle.crystals.find((c) => c.id === 'moon')?.collected,
      waterStonesPlaced: stonesCount,
      logsGathered,
      ropesGathered,
      bridgeLogsPlaced,
      bridgeRopesAttached,
      shrineCrystalsInserted,
      dragonBraziersLit,
      dragonAwakened,
    }));
  }, []);

  // Build/Switch location world scene
  const switchWorldScene = useCallback((loc: LocationId) => {
    const player = playerRef.current;
    if (!player) return;

    // Clear existing phase references
    puzzleRef.current = null;
    rainbowPhaseRef.current = null;
    castlePhaseRef.current = null;
    islandPhaseRef.current = null;

    // Build World Scene
    let world: WorldBuildResult;
    if (loc === 'GRAND_GATE') {
      world = WorldBuilder.buildGrandGate();
      world.scene.add(player.group);
      player.groundHeightFunc = world.groundHeightFunc;
      player.collisionObstacles = world.obstacles;
      player.teleport(0, 0, 10, 0);

      onUpdateQuestDataRef.current((prev) => ({
        ...prev,
        phase: 1,
        currentQuest: 'APPROACH THE GRAND GATE',
        questStatus: 'ACTIVE',
        objective: 'Speak with Guardian Aurelius at the Grand Gate to begin your pilgrimage.',
        stage: 'CRYSTALS',
        reward: { xp: 50, coins: 20, wood: 0 },
      }));
    } else if (loc === 'HIDDEN_FOREST') {
      world = WorldBuilder.buildHiddenForest();
      world.scene.add(player.group);

      // Initialize Unified Multi-Stage Adventure Puzzle Manager
      const puzzle = new PuzzleManager(world.scene);
      puzzleRef.current = puzzle;

      // Dynamic ground height that accounts for the physical walkable bridge deck across the river
      const baseGroundFunc = world.groundHeightFunc;
      player.groundHeightFunc = (x: number, z: number) => {
        // When the bridge is complete, provide solid walking collision deck at y = 0.35 across river
        if (puzzleRef.current?.isBridgeComplete && Math.abs(x) <= 2.2 && z >= -16.0 && z <= -8.0) {
          return 0.35;
        }
        return baseGroundFunc(x, z);
      };

      // Combine world obstacles with puzzle blocker box and dragon gate collider
      world.obstacles.push(puzzle.pathBlockerBox);
      world.obstacles.push(puzzle.dragonGateCollider);
      player.collisionObstacles = world.obstacles;

      // Spawn at forest pathway facing north
      player.teleport(0, 0, 14, 0);

      // Initialize quest data for Phase 1
      onUpdateQuestDataRef.current((prev) => ({
        ...prev,
        phase: 1,
        currentQuest: 'PHASE 1: RESTORE THE ANCIENT FOREST SHRINE',
        questStatus: 'ACTIVE',
        objective: 'Find 3 Ancient Energy Crystals hidden in the jungle (0/3).',
        stage: 'CRYSTALS',
        crystalsFound: 0,
        reward: { xp: 100, coins: 50, wood: 0 },
      }));

      // Automatically show the charming fairy storybook on first arrival in the Hidden Forest!
      if (!hasShownStoryModalRef.current) {
        hasShownStoryModalRef.current = true;
        setShowStoryModal(true);
        sound.playFairyChime();
      }
    } else if (loc === 'RAINBOW_BRIDGE') {
      const res = WorldBuilder.buildRainbowBridge();
      rainbowPhaseRef.current = res.phase;
      world = res.world;
      world.scene.add(player.group);
      player.groundHeightFunc = world.groundHeightFunc;
      player.collisionObstacles = world.obstacles;
      player.teleport(0, 0, 14, 0);

      onUpdateQuestDataRef.current((prev) => ({
        ...prev,
        phase: 2,
        currentQuest: 'PHASE 2: RECONSTRUCT THE RAINBOW BRIDGE',
        questStatus: 'ACTIVE',
        objective: 'Activate the 3 optical mechanisms and position the optical prism to bridge the abyss.',
        stage: 'BUILD_BRIDGE',
        reward: { xp: 250, coins: 150, wood: 0 },
      }));
      showToastRef.current('Phase 2: Rainbow Bridge. Activate the optical levers and position the prism!', 'info');
    } else if (loc === 'CASTLE_PLACE') {
      const res = WorldBuilder.buildCastlePlace();
      castlePhaseRef.current = res.phase;
      world = res.world;
      world.scene.add(player.group);
      player.groundHeightFunc = world.groundHeightFunc;
      player.collisionObstacles = world.obstacles;
      player.teleport(0, 0, 20, 0);

      onUpdateQuestDataRef.current((prev) => ({
        ...prev,
        phase: 3,
        currentQuest: 'PHASE 3: EXPLORE CASTLE PLACE',
        questStatus: 'ACTIVE',
        objective: 'Find the missing stone gear, raise the portcullis, and inspect the Dragon Mural in the sanctum.',
        stage: 'CRYSTALS',
        reward: { xp: 300, coins: 200, wood: 0 },
      }));
      showToastRef.current('Phase 3: Castle Place. Search the fortress courtyard for the missing winch gear!', 'info');
    } else if (loc === 'MYSTERY_ISLAND' || (loc as string) === 'MYSTERY_CAVE') {
      const res = WorldBuilder.buildMysteryIsland();
      islandPhaseRef.current = res.phase;
      world = res.world;
      world.scene.add(player.group);
      player.groundHeightFunc = world.groundHeightFunc;
      player.collisionObstacles = world.obstacles;
      player.teleport(0, 0, 16, 0);

      onUpdateQuestDataRef.current((prev) => ({
        ...prev,
        phase: 4,
        currentQuest: 'PHASE 4: THE MYSTERY ISLAND',
        questStatus: 'ACTIVE',
        objective: 'Collect the 3 Sun Emblems along the tropical trails, activate the Sun Temple Altar, and examine the Golden Dragon Mural.',
        stage: 'SHRINE_CRYSTALS',
        reward: { xp: 400, coins: 250, wood: 0 },
      }));
      showToastRef.current('Phase 4: Mystery Island. Collect the 3 Sun Emblems along the paved trails to unlock the Sun Temple!', 'info');
    } else if (loc === 'FAIRY_GARDEN') {
      const res = WorldBuilder.buildFairyGarden();
      phase5Ref.current = res.phase;
      world = res.world;
      world.scene.add(player.group);
      player.groundHeightFunc = world.groundHeightFunc;
      player.collisionObstacles = world.obstacles;
      player.teleport(0, 0, 16, 0);

      onUpdateQuestDataRef.current((prev) => ({
        ...prev,
        phase: 5,
        currentQuest: 'PHASE 5: RESTORE THE FAIRY GARDEN',
        questStatus: 'ACTIVE',
        objective: 'Restore the Celestial Fountain, plant the fairy seeds, and bloom the sacred Guardian Blossom.',
        stage: 'WATER_FLOW',
        reward: { xp: 500, coins: 300, wood: 0 },
      }));
      showToastRef.current('Phase 5: Fairy Garden. Restore the fountain and collect the fairy seeds!', 'info');
    } else {
      // DRAGON_VALLEY
      const res = WorldBuilder.buildDragonValley(phase5Ref.current ?? undefined);
      phase5Ref.current = res.phase;
      world = res.world;
      world.scene.add(player.group);
      player.groundHeightFunc = world.groundHeightFunc;
      player.collisionObstacles = world.obstacles;
      player.teleport(0, 0, 24, 0);

      onUpdateQuestDataRef.current((prev) => ({
        ...prev,
        phase: 5,
        currentQuest: 'FINAL CLIMAX: SAVE THE GUARDIAN DRAGON',
        questStatus: 'ACTIVE',
        objective: 'Infuse all 3 elemental towers with your relics, place the blossom upon the altar, and shatter the corruption stone!',
        stage: 'DRAGON_VALLEY',
        reward: { xp: 1000, coins: 500, wood: 0 },
      }));
      showToastRef.current('Dragon Valley Climax: Infuse the 3 towers to shatter the dark corruption barrier!', 'info');
    }

    worldRef.current = world;
    sound.startAmbient(loc);
  }, []);

  // Track location to prevent duplicate rebuilding
  const activeLocationRef = useRef<LocationId | null>(null);

  // Update scene when currentLocation prop changes
  useEffect(() => {
    if (rendererRef.current && playerRef.current && activeLocationRef.current !== currentLocation) {
      activeLocationRef.current = currentLocation;
      switchWorldScene(currentLocation);
    }
  }, [currentLocation, switchWorldScene]);

  // Main Three.js Lifecycle (Runs ONCE on mount)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch (err) {
      console.error('WebGLRenderer initialization failed:', err);
      setWebglError('Unable to initialize WebGL context. Please check hardware acceleration or browser settings.');
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    cameraRef.current = camera;

    const player = new PlayerController(camera);
    player.onStatsChange = (health: number, stamina: number) => {
      onUpdatePlayerDataRef.current((prev) => {
        if (
          Math.round(prev.health ?? 100) === Math.round(health) &&
          Math.round(prev.stamina ?? 100) === Math.round(stamina)
        ) {
          return prev;
        }
        return {
          ...prev,
          health: Math.round(health),
          stamina: Math.round(stamina),
        };
      });
    };

    player.onTakeDamage = (amount: number, source: string) => {
      showToastRef.current(`⚠️ Took ${amount} damage from ${source}!`, 'error');
    };
    playerRef.current = player;

    const input = new InputManager();
    input.attach(renderer.domElement);
    inputRef.current = input;

    // Load initial location if not already active
    activeLocationRef.current = currentLocationRef.current;
    switchWorldScene(currentLocationRef.current);

    // Context loss handling
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost. Pausing rendering...');
    };
    const handleContextRestored = () => {
      console.info('WebGL context restored. Reloading scene...');
      switchWorldScene(currentLocationRef.current);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Global Key shortcut 'H' for Mimi's Story Book
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH' || e.key === 'h' || e.key === 'H') {
        setShowStoryModal((prev) => {
          if (!prev) sound.playFairyChime();
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Setup Game Interaction Callbacks
    input.setCallbacks({
      onInteract: () => {
        const curPlayer = playerRef.current;
        const curLoc = currentLocationRef.current;
        if (!curPlayer) return;

        // In Grand Gate: Check Guardian NPC
        if (curLoc === 'GRAND_GATE') {
          const guardianPos = worldRef.current?.guardianPosition;
          if (guardianPos && curPlayer.position.distanceTo(guardianPos) < 3.8) {
            setShowDialogue(true);
            sound.playInteract();
          }
        }

        // In Hidden Forest: Handle multi-stage puzzle interactions
        if (curLoc === 'HIDDEN_FOREST') {
          const puzzle = puzzleRef.current;
          if (!puzzle) return;
          const res = puzzle.handleInteract(
            curPlayer.position,
            playerDataRef.current,
            questDataRef.current
          );

          if (res.handled) {
            if (res.isElderDialogue && res.elderDialogue) {
              setElderDialogueData(res.elderDialogue);
              setShowElderModal(true);
            }

            if (res.message) {
              showToastRef.current(res.message, res.type ?? 'info');
            }

            if (res.reward) {
              setRewardModalData(res.reward);
              setShowRewardModal(true);

              onUpdatePlayerDataRef.current((prev) => ({
                ...prev,
                xp: prev.xp + res.reward!.xp,
                coins: prev.coins + res.reward!.coins,
                wood: prev.wood + (res.reward!.wood ?? 0),
                buildingMaterials: (prev.buildingMaterials ?? 0) + (res.reward!.materials ?? 0),
                ancientRelics: (prev.ancientRelics ?? 0) + (res.reward!.relic ? 1 : 0),
                level: Math.floor((prev.xp + res.reward!.xp) / 100) + 1,
              }));
              onSaveProgressRef.current();
            }

            // Phase 1 Completion -> Trigger Guardian Transition to Phase 2
            if (res.isPhaseComplete) {
              sound.playQuestFanfare();
              setGuardianTransitionData({
                completedPhase: 1,
                completedPhaseName: 'Hidden Forest',
                nextPhase: 2,
                nextPhaseName: 'Rainbow Bridge',
                nextLocation: 'RAINBOW_BRIDGE',
                reward: {
                  xp: 200,
                  coins: 100,
                  item: 'Ancient Forest Relic',
                  icon: 'TreePine',
                },
                guardianQuotes: [
                  'You have restored harmony to the ancient grove. The sacred springs flow and the jungle shrine radiates divine light once more.',
                  'Beyond this forest lies the Rainbow Bridge — long broken and forgotten, cleaving the sky road across the great canyon.',
                  'Reconstruct the three mechanical gear systems, realign the optical prism, and let the rainbow light carry you forward!',
                ],
                nextPhasePreview: {
                  title: 'Phase 2: Rainbow Bridge',
                  description: 'Reconstruct the three mechanical gear systems, realign the optical prism, and cross the majestic rainbow bridge.',
                },
              });
            }

            syncQuestState();
          }

          setHeldObjectName(puzzle.heldObjectId ? 'Ancient Channel Stone' : null);
        }

        // In Rainbow Bridge: Handle Phase 2 interactions
        if (curLoc === 'RAINBOW_BRIDGE') {
          const rb = rainbowPhaseRef.current;
          if (!rb) return;
          const res = rb.handleInteract(curPlayer.position);
          if (res.handled) {
            if (res.message) {
              showToastRef.current(res.message, res.type ?? 'info');
            }
            if (res.isPhaseComplete) {
              onUpdatePlayerDataRef.current((prev) => ({
                ...prev,
                rainbowShard: true,
                xp: prev.xp + 250,
                coins: prev.coins + 150,
                level: Math.floor((prev.xp + 250) / 100) + 1,
              }));
              onSaveProgressRef.current();

              setGuardianTransitionData({
                completedPhase: 2,
                completedPhaseName: 'Rainbow Bridge',
                nextPhase: 3,
                nextPhaseName: 'Castle Place',
                nextLocation: 'CASTLE_PLACE',
                reward: {
                  xp: 250,
                  coins: 150,
                  item: 'Rainbow Shard',
                  icon: 'Sparkles',
                },
                guardianQuotes: [
                  'Magnificent! The Rainbow Bridge spans the great chasm once more, its chromatic energy humming through the stone.',
                  'Across the gorge sits Castle Place — an ancient citadel whose massive iron gates have remained locked for centuries.',
                  'Search the fortress courtyard for the missing mechanism gear, raise the portcullis, and unveil the truth etched within the Dragon Mural.',
                ],
                nextPhasePreview: {
                  title: 'Phase 3: Castle Place',
                  description: 'Explore the ancient fortress, find the missing winch gear, and inspect the sacred Dragon Mural.',
                },
              });
            }
          }
        }

        // In Castle Place: Handle Phase 3 interactions
        if (curLoc === 'CASTLE_PLACE') {
          const cp = castlePhaseRef.current;
          if (!cp) return;
          const res = cp.handleInteract(curPlayer.position);
          if (res.handled) {
            if (res.message) {
              showToastRef.current(res.message, res.type ?? 'info');
            }
            if (res.isPhaseComplete) {
              onUpdatePlayerDataRef.current((prev) => ({
                ...prev,
                dragonCrest: true,
                xp: prev.xp + 300,
                coins: prev.coins + 200,
                level: Math.floor((prev.xp + 300) / 100) + 1,
              }));
              onSaveProgressRef.current();

              setGuardianTransitionData({
                completedPhase: 3,
                completedPhaseName: 'Castle Place',
                nextPhase: 4,
                nextPhaseName: 'Mystery Island',
                nextLocation: 'MYSTERY_ISLAND',
                reward: {
                  xp: 300,
                  coins: 200,
                  item: 'Dragon Crest',
                  icon: 'Shield',
                },
                guardianQuotes: [
                  'The mural revealed what legend had forgotten: the Dragon was never a monster, but our kingdom’s ancient guardian.',
                  'Beyond the sea lies an island that remembers everything. But its memory has been broken.',
                  'Observe the island carefully. The world itself will show you the way. Discover the secret of Mystery Island.',
                ],
                nextPhasePreview: {
                  title: 'Phase 4: Mystery Island',
                  description: 'Discover the ancient symbols, understand the sequence, and reveal the hidden path.',
                },
              });
            }
          }
        }

        // In Mystery Island: Handle Phase 4 interactions
        if (curLoc === 'MYSTERY_ISLAND' || (curLoc as string) === 'MYSTERY_CAVE') {
          const mc = islandPhaseRef.current;
          if (!mc) return;
          const res = mc.handleInteract(curPlayer.position);
          if (res.handled) {
            if (res.message) {
              showToastRef.current(res.message, res.type ?? 'info');
            }
            if (res.isPhaseComplete) {
              onUpdatePlayerDataRef.current((prev) => ({
                ...prev,
                mysteryRelic: true,
                xp: prev.xp + 400,
                coins: prev.coins + 250,
                level: Math.floor((prev.xp + 400) / 100) + 1,
              }));
              onSaveProgressRef.current();

              setGuardianTransitionData({
                completedPhase: 4,
                completedPhaseName: 'Mystery Island',
                nextPhase: 5,
                nextPhaseName: 'Fairy Garden',
                nextLocation: 'FAIRY_GARDEN',
                reward: {
                  xp: 400,
                  coins: 250,
                  item: 'Mystery Relic',
                  icon: 'Gem',
                },
                guardianQuotes: [
                  'You have uncovered the truth. The island\'s memory has been restored.',
                  'The dragon still lives. The corruption came from the stone, twisting its noble spirit.',
                  'But the path to it is hidden beyond the ancient garden. Prepare yourself for the Fairy Garden.',
                ],
                nextPhasePreview: {
                  title: 'Phase 5: Fairy Garden',
                  description: 'Revive the Celestial Fountain, plant the fairy seeds, and harvest the legendary Guardian Blossom.',
                },
              });
            }
          }
        }

        // In Fairy Garden: Handle Phase 5 Garden interactions
        if (curLoc === 'FAIRY_GARDEN') {
          const p5 = phase5Ref.current;
          if (!p5) return;
          const res = p5.handleInteract(curPlayer.position);
          if (res.handled) {
            if (res.message) {
              showToastRef.current(res.message, res.type ?? 'info');
            }
            if (res.isFairyGardenComplete) {
              onUpdatePlayerDataRef.current((prev) => ({
                ...prev,
                guardianBlossom: true,
                xp: prev.xp + 500,
                coins: prev.coins + 300,
                level: Math.floor((prev.xp + 500) / 100) + 1,
              }));
              onSaveProgressRef.current();

              setGuardianTransitionData({
                completedPhase: 5,
                completedPhaseName: 'Fairy Garden Restoration',
                nextPhase: 5,
                nextPhaseName: 'Dragon Valley Climax',
                nextLocation: 'DRAGON_VALLEY',
                reward: {
                  xp: 500,
                  coins: 300,
                  item: 'Guardian Blossom',
                  icon: 'Heart',
                },
                guardianQuotes: [
                  'The Guardian Blossom radiates with boundless life and peace. Nature itself watches your courage with reverence.',
                  'Dragon Valley lies ahead. The skies are dark with tempest clouds, and the tormented dragon cries out from the summit.',
                  'Infuse the three elemental towers with your relics, place the blossom on the altar to dispel the barrier, and shatter the corruption stone on the dragon’s chest. Save our guardian!',
                ],
                nextPhasePreview: {
                  title: 'Final Climax: Dragon Valley',
                  description: 'Infuse the elemental towers, activate the purification altar, and shatter the corruption stone to save the dragon!',
                },
              });
            }
          }
        }

        // In Dragon Valley: Handle Final Climax interactions
        if (curLoc === 'DRAGON_VALLEY') {
          const p5 = phase5Ref.current;
          if (!p5) return;
          const res = p5.handleInteract(curPlayer.position);
          if (res.handled) {
            if (res.message) {
              showToastRef.current(res.message, res.type ?? 'info');
            }
            if (res.isGameComplete) {
              onUpdatePlayerDataRef.current((prev) => ({
                ...prev,
                xp: prev.xp + 1000,
                coins: prev.coins + 500,
                level: Math.floor((prev.xp + 1000) / 100) + 1,
              }));
              onSaveProgressRef.current();
              setShowGameComplete(true);
            }
          }
        }
      },
      onRotate: () => {
        const puzzle = puzzleRef.current;
        if (puzzle && puzzle.heldObjectId) {
          puzzle.rotateHeld(Math.PI / 4);
        }
      },
      onLeftClick: () => {
        const curPlayer = playerRef.current;
        const puzzle = puzzleRef.current;
        if (puzzle && puzzle.heldObjectId && curPlayer) {
          const res = puzzle.attemptPlacement(curPlayer.position);
          if (res.message) {
            showToastRef.current(res.message, res.correct ? 'success' : 'error');
          }

          if (res.success) {
            setHeldObjectName(null);
            if (res.stageAdvanced && res.reward) {
              setRewardModalData(res.reward);
              setShowRewardModal(true);

              onUpdatePlayerDataRef.current((prev) => ({
                ...prev,
                xp: prev.xp + res.reward.xp,
                coins: prev.coins + res.reward.coins,
                level: Math.floor((prev.xp + res.reward.xp) / 100) + 1,
              }));
              onSaveProgressRef.current();
            }
            syncQuestState();
          }
        }
      },
      onRightClick: () => {
        const curPlayer = playerRef.current;
        const puzzle = puzzleRef.current;
        if (puzzle && puzzle.heldObjectId && curPlayer) {
          puzzle.cancelHolding(curPlayer.position);
          setHeldObjectName(null);
          showToastRef.current('Cancelled stone placement', 'info');
        }
      },
    });

    // Render loop
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const inputState = input.getState();
      setIsPointerLocked((prev) => (prev !== inputState.pointerLocked ? inputState.pointerLocked : prev));

      const curPlayer = playerRef.current;
      const curWorld = worldRef.current;
      const curPuzzle = puzzleRef.current;
      const curLoc = currentLocationRef.current;

      // Update Player (Movement paused if any modal is open)
      const canMove =
        !modalsOpenRef.current.dialogue &&
        !modalsOpenRef.current.challenge &&
        !modalsOpenRef.current.reward &&
        !modalsOpenRef.current.story &&
        !modalsOpenRef.current.elder &&
        !modalsOpenRef.current.guardianTransition &&
        !modalsOpenRef.current.gameComplete;

      if (curPlayer) {
        curPlayer.update(delta, inputState, canMove);

        // Survival Hazards & Healing Loop in Hidden Forest
        if (curLoc === 'HIDDEN_FOREST' && curPuzzle) {
          curPuzzle.checkHazardsAndHealing(curPlayer.position, curPlayer, delta);
        }

        // Update held object positions
        if (curLoc === 'HIDDEN_FOREST' && curPuzzle && curPuzzle.heldObjectId) {
          curPuzzle.updateHeldPosition(curPlayer.position, curPlayer.group.rotation.y);
        }
        if (curLoc === 'RAINBOW_BRIDGE' && rainbowPhaseRef.current) {
          rainbowPhaseRef.current.updateHeldPosition(curPlayer.position, curPlayer.group.rotation.y);
        }
        if (curLoc === 'CASTLE_PLACE' && castlePhaseRef.current) {
          castlePhaseRef.current.updateHeldPosition(curPlayer.position, curPlayer.group.rotation.y);
        }

        // Active held item name tracking for HUD
        if (curLoc === 'HIDDEN_FOREST' && curPuzzle?.heldObjectId) {
          setHeldObjectName('Ancient Channel Stone');
        } else if (curLoc === 'RAINBOW_BRIDGE' && rainbowPhaseRef.current?.heldPrism) {
          setHeldObjectName('Optical Prism');
        } else if (curLoc === 'CASTLE_PLACE' && castlePhaseRef.current?.heldGear) {
          setHeldObjectName('Stone Gear');
        } else {
          setHeldObjectName(null);
        }

        // Proximity detection for HUD prompts
        let nextPrompt: string | null = null;
        if (curLoc === 'GRAND_GATE') {
          const guardianPos = curWorld?.guardianPosition;
          if (guardianPos && curPlayer.position.distanceTo(guardianPos) < 3.8) {
            nextPrompt = 'TALK TO THE GUARDIAN [E]';
          }
        } else if (curLoc === 'HIDDEN_FOREST' && curPuzzle) {
          nextPrompt = curPuzzle.getInteractionPrompt(curPlayer.position, playerDataRef.current);
        } else if (curLoc === 'RAINBOW_BRIDGE' && rainbowPhaseRef.current) {
          nextPrompt = rainbowPhaseRef.current.getInteractionPrompt(curPlayer.position);
        } else if (curLoc === 'CASTLE_PLACE' && castlePhaseRef.current) {
          nextPrompt = castlePhaseRef.current.getInteractionPrompt(curPlayer.position);
        } else if ((curLoc === 'MYSTERY_ISLAND' || (curLoc as string) === 'MYSTERY_CAVE') && islandPhaseRef.current) {
          nextPrompt = islandPhaseRef.current.getInteractionPrompt(curPlayer.position);
        } else if ((curLoc === 'FAIRY_GARDEN' || curLoc === 'DRAGON_VALLEY') && phase5Ref.current) {
          nextPrompt = phase5Ref.current.getInteractionPrompt(curPlayer.position);
        }

        if (nextPrompt !== interactionTextRef.current) {
          interactionTextRef.current = nextPrompt;
          setInteractionText(nextPrompt);
        }

        // Periodically sample active waypoint target for HUD compass
        if (currentTime - lastTargetCheckTimeRef.current > 120) {
          lastTargetCheckTimeRef.current = currentTime;
          if (curLoc === 'HIDDEN_FOREST' && curPuzzle) {
            const info = curPuzzle.getCurrentTargetInfo(curPlayer.position);
            setTargetInfo(info);
          } else if (curLoc === 'RAINBOW_BRIDGE' && rainbowPhaseRef.current) {
            const rb = rainbowPhaseRef.current;
            if (!rb.isBridgeRestored) {
              if (!rb.mechanism1Active) setTargetInfo({ name: 'West Optical Lever', position: [-14, 0, 4] });
              else if (!rb.mechanism2Active) setTargetInfo({ name: 'East Optical Lever', position: [14, 0, 4] });
              else if (!rb.mechanism3Active) setTargetInfo({ name: 'Central Resonator', position: [0, 0, 8] });
              else if (!rb.prismPlaced) setTargetInfo({ name: 'Bridge Prism Pedestal', position: [0, 0.3, -1.8] });
            } else {
              setTargetInfo({ name: 'Rainbow Summit Pedestal', position: [0, 0.85, -36] });
            }
          } else if (curLoc === 'CASTLE_PLACE' && castlePhaseRef.current) {
            const cp = castlePhaseRef.current;
            if (!cp.gearCollected) setTargetInfo({ name: 'Golden Gear (Anvil)', position: [-18, 1, 12] });
            else if (!cp.gateOpen) setTargetInfo({ name: 'Castle Gate Winch', position: [7.5, 1, -5] });
            else setTargetInfo({ name: 'Ancient Dragon Mural', position: [0, 2, -22] });
          } else if ((curLoc === 'MYSTERY_ISLAND' || (curLoc as string) === 'MYSTERY_CAVE') && islandPhaseRef.current) {
            const mc = islandPhaseRef.current;
            if (!mc.puzzleSolved) {
              setTargetInfo({ name: 'Golden Sun Lever', position: [10, 0, 10] });
            } else if (mc.caveOpened && !mc.muralRevealed) {
              setTargetInfo({ name: 'Hidden Cave Mural', position: [-20, 6, -50] });
            } else {
              setTargetInfo(null);
            }
          } else if (curLoc === 'FAIRY_GARDEN' && phase5Ref.current) {
            const p5 = phase5Ref.current;
            if (!p5.fountainRestored) setTargetInfo({ name: 'Celestial Fountain', position: [0, 0.5, 0] });
            else if (p5.seedsCollected < 3) setTargetInfo({ name: 'Fairy Seeds', position: [-12, 0.3, -6] });
            else if (!p5.seedsPlanted) setTargetInfo({ name: 'Garden Bed', position: [8, 0, -10] });
            else setTargetInfo({ name: 'Grand Healing Tree', position: [0, 0, -20] });
          } else if (curLoc === 'DRAGON_VALLEY' && phase5Ref.current) {
            const p5 = phase5Ref.current;
            if (!p5.tower1Active) setTargetInfo({ name: 'Rainbow Tower', position: [-16, 0, 0] });
            else if (!p5.tower2Active) setTargetInfo({ name: 'Dragon Crest Tower', position: [16, 0, 0] });
            else if (!p5.tower3Active) setTargetInfo({ name: 'Corruption Tower', position: [0, 0, 16] });
            else if (!p5.altarPurified) setTargetInfo({ name: 'Purification Altar', position: [0, 0.6, -6] });
            else setTargetInfo({ name: 'Corrupted Dragon Stone', position: [0, 2, -19] });
          } else {
            setTargetInfo(null);
          }
        }
      }

      // Update world animations (torches, runes, relic, particles)
      if (curWorld) {
        const t = currentTime / 1000;
        curWorld.updateAnimators.forEach((fn) => fn(delta, t));
      }

      // Update puzzle target animations, sky beacons & fairy companion
      if (curPuzzle) {
        curPuzzle.update(delta, currentTime / 1000, curPlayer ? curPlayer.position : undefined);
      }

      // Reset input deltas for frame
      input.resetDeltas();

      // Render Three.js Scene
      if (rendererRef.current && curWorld && cameraRef.current) {
        rendererRef.current.render(curWorld.scene, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      input.detach();
      renderer.dispose();
      sound.stopAmbient();
    };
  }, [switchWorldScene, syncQuestState]);

  // Handle Dialogue Completion / Skip
  const handleDialogueCompleteOrSkip = () => {
    setShowDialogue(false);
    showToast('Journey begins beyond the gate! Entering Hidden Forest...', 'info');

    // Fade and switch to Hidden Forest
    setTimeout(() => {
      onChangeLocation('HIDDEN_FOREST');
      setTimeout(() => {
        setShowChallengeModal(true);
      }, 900);
    }, 600);
  };

  const togglePointerLock = () => {
    if (inputRef.current) {
      if (isPointerLocked) {
        inputRef.current.exitPointerLock();
      } else {
        inputRef.current.requestPointerLock();
      }
    }
  };

  if (webglError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-8 text-center text-white">
        <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
        <h2 className="text-xl font-bold text-slate-100">3D Graphics Notice</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">{webglError}</p>
        <button
          onClick={onExitToMenu}
          className="mt-6 flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Return to Title Menu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-black">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="h-full w-full cursor-crosshair" />

      {/* Interactive In-Game HUD */}
      <HUD
        playerData={playerData}
        questData={questData}
        currentLocation={currentLocation}
        interactionText={interactionText}
        heldObjectName={heldObjectName}
        feedbackMessage={feedback}
        onTogglePointerLock={togglePointerLock}
        isPointerLocked={isPointerLocked}
        onExitToMenu={onExitToMenu}
        onOpenStory={() => {
          setShowStoryModal(true);
          sound.playFairyChime();
        }}
        targetInfo={targetInfo}
      />

      {/* Mimi's Story Book Modal (Illustrated Guide) */}
      {showStoryModal && (
        <StoryModal
          onStart={() => {
            sound.playFairyChime();
            setShowStoryModal(false);
            showToast(
              'Adventure begins! Follow the magical sky light beams into the jungle!',
              'success'
            );
          }}
          onDismiss={() => setShowStoryModal(false)}
        />
      )}

      {/* Guardian Dialogue Modal */}
      {showDialogue && (
        <DialogueModal
          onComplete={handleDialogueCompleteOrSkip}
          onSkip={handleDialogueCompleteOrSkip}
        />
      )}

      {/* Challenge / Quest Sequence Intro Modal */}
      {showChallengeModal && (
        <ChallengeModal
          onStart={() => {
            sound.playInteract();
            setShowChallengeModal(false);
            showToast('Quest Active: Search the jungle for the 3 Ancient Energy Crystals!', 'info');
          }}
          onDismiss={() => setShowChallengeModal(false)}
        />
      )}

      {/* Multi-Stage Quest Completion Reward Modal */}
      {showRewardModal && (
        <RewardModal
          {...rewardModalData}
          onContinue={() => {
            sound.playInteract();
            setShowRewardModal(false);
            showToast('Objective completed! Check your Quest Tracker for the next trial.', 'success');
          }}
        />
      )}

      {/* Elder Sage Eldrin Guide Modal */}
      {showElderModal && elderDialogueData && (
        <ElderSageModal
          dialogueData={elderDialogueData}
          onDismiss={() => {
            sound.playInteract();
            setShowElderModal(false);
          }}
        />
      )}

      {/* Phase Guardian Transition Modal */}
      {guardianTransitionData && (
        <GuardianTransitionModal
          data={guardianTransitionData}
          onContinue={() => {
            sound.playInteract();
            const nextLoc = guardianTransitionData.nextLocation;
            const nextPhase = guardianTransitionData.nextPhase;
            setGuardianTransitionData(null);
            if (onUpdateProgress) {
              onUpdateProgress((prev) => ({
                ...prev,
                currentLocation: nextLoc,
                currentPhase: nextPhase,
                unlockedPhases: prev.unlockedPhases.includes(nextPhase)
                  ? prev.unlockedPhases
                  : [...prev.unlockedPhases, nextPhase],
              }));
            }
            onChangeLocation(nextLoc);
          }}
        />
      )}

      {/* Final Victory / Game Complete Modal */}
      {showGameComplete && (
        <GameCompleteModal
          playerData={playerData}
          onPlayAgain={() => {
            sound.playInteract();
            setShowGameComplete(false);
            if (onUpdateProgress) {
              onUpdateProgress((prev) => ({
                ...prev,
                currentLocation: 'GRAND_GATE',
                currentPhase: 1,
              }));
            }
            onChangeLocation('GRAND_GATE');
          }}
          onExitToMenu={() => {
            sound.playInteract();
            setShowGameComplete(false);
            onExitToMenu();
          }}
        />
      )}
    </div>
  );
};
