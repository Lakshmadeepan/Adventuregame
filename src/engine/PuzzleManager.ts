import * as THREE from 'three';
import { ForestQuestStage, PlayerData, QuestData } from '../types';
import { sound } from '../audio/SoundManager';
import { WorldBuilder } from './WorldBuilder';
import { PlayerController } from './PlayerController';
import { ElderDialogueData } from '../components/ElderSageModal';

export interface PuzzleInteractionResult {
  handled: boolean;
  message?: string;
  type?: 'success' | 'error' | 'info';
  isElderDialogue?: boolean;
  elderDialogue?: ElderDialogueData;
  isPhaseComplete?: boolean;
  reward?: {
    xp: number;
    coins: number;
    wood?: number;
    materials?: number;
    relic?: string;
    stageTitle: string;
    questTitle: string;
    description: string;
    unlockedTitle?: string;
  };
}

export class PuzzleManager {
  private scene: THREE.Scene;
  public currentStage: ForestQuestStage = 'CRYSTALS';

  // ----------------------------------------------------
  // STAGE 1: ANCIENT CRYSTALS (Azure, Emerald, Moon)
  // ----------------------------------------------------
  public crystals: {
    id: 'azure' | 'emerald' | 'moon';
    name: string;
    position: [number, number, number];
    color: number;
    emissive: number;
    mesh: THREE.Group;
    collected: boolean;
  }[] = [];

  // ----------------------------------------------------
  // STAGE 2: WATER FLOW (Channel Stones & Targets)
  // ----------------------------------------------------
  public waterStones: {
    id: string;
    name: string;
    currentPos: THREE.Vector3;
    rotationY: number;
    mesh: THREE.Group;
    placed: boolean;
    locked: boolean;
  }[] = [];

  public waterTargets: {
    id: string;
    pos: THREE.Vector3;
    mesh: THREE.Group;
    completed: boolean;
  }[] = [];

  public waterChannelMesh: THREE.Group;
  public waterFlowStream: THREE.Mesh;
  public isWaterFlowRestored: boolean = false;

  // Manipulation State for movable water channel stones
  public heldObjectId: string | null = null;
  public ghostMesh: THREE.Group | null = null;
  public heldRotationY: number = 0;

  // ----------------------------------------------------
  // STAGE 3: BRIDGE MATERIALS GATHERING
  // ----------------------------------------------------
  public scatteredLogs: {
    id: string;
    name: string;
    pos: THREE.Vector3;
    mesh: THREE.Group;
    collected: boolean;
  }[] = [];

  public scatteredRopes: {
    id: string;
    name: string;
    pos: THREE.Vector3;
    mesh: THREE.Group;
    collected: boolean;
  }[] = [];

  // ----------------------------------------------------
  // STAGE 4: INTERACTIVE BRIDGE CONSTRUCTION
  // ----------------------------------------------------
  public bridgeSlots: {
    id: string;
    pos: THREE.Vector3;
    mesh: THREE.Group;
    placed: boolean;
  }[] = [];

  public bridgeRopeAnchors: {
    id: string;
    pos: THREE.Vector3;
    mesh: THREE.Group;
    attached: boolean;
  }[] = [];

  public bridgeFullMesh: THREE.Group;
  public isBridgeComplete: boolean = false;
  public pathBlockerBox: THREE.Box3;
  public pathBlockerMesh: THREE.Group;

  // ----------------------------------------------------
  // STAGE 5: ANCIENT SHRINE CRYSTAL SOCKETS
  // ----------------------------------------------------
  public shrineSockets: {
    id: 'azure' | 'emerald' | 'moon';
    name: string;
    pos: THREE.Vector3;
    mesh: THREE.Group;
    insertedCrystalMesh: THREE.Mesh;
    light: THREE.PointLight;
    inserted: boolean;
  }[] = [];

  public shrineBeam: THREE.Mesh;
  public isShrineRestored: boolean = false;

  // ----------------------------------------------------
  // STAGE 6: DRAGON VALLEY GATEWAY
  // ----------------------------------------------------
  public dragonGateGroup: THREE.Group;
  public dragonGateLeftDoor: THREE.Mesh;
  public dragonGateRightDoor: THREE.Mesh;
  public dragonGateCollider: THREE.Box3;
  public isDragonGateOpen: boolean = false;

  // ----------------------------------------------------
  // SAGE ELDRIN (WISE OLD AGED MAN GUIDE FOR ALL 5 LEVELS)
  // ----------------------------------------------------
  public oldSageGroup: THREE.Group = new THREE.Group();
  public oldSageAnimator: ((time: number) => void) | null = null;
  public oldSagePos: THREE.Vector3 = new THREE.Vector3(3.5, 0.2, 4);
  public isNearOldSage: boolean = false;

  // ----------------------------------------------------
  // LEVEL 5: DRAGON VALLEY BRAZIERS & GOLDEN TOTEM
  // ----------------------------------------------------
  public dragonValleyGroup: THREE.Group = new THREE.Group();
  public dragonBraziers: {
    id: string;
    pos: THREE.Vector3;
    lit: boolean;
    light: THREE.PointLight;
    flameMesh: THREE.Mesh;
  }[] = [];
  public dragonTotemMesh: THREE.Group = new THREE.Group();
  public dragonOrbMesh: THREE.Mesh | null = null;
  public dragonOrbLight: THREE.PointLight | null = null;
  public isDragonAwakened: boolean = false;

  // ----------------------------------------------------
  // HAZARDS & SURVIVAL OBJECTS
  // ----------------------------------------------------
  public thornBrambles: { pos: THREE.Vector3; radius: number; mesh: THREE.Group }[] = [];
  public berryBushes: { id: string; pos: THREE.Vector3; hasBerries: boolean; mesh: THREE.Group; cooldown: number }[] = [];

  // ----------------------------------------------------
  // SKY BEACONS & 3D FAIRY COMPANION (MIMI)
  // ----------------------------------------------------
  public skyBeaconsGroup: THREE.Group = new THREE.Group();
  public mimiFairyGroup: THREE.Group = new THREE.Group();
  private mimiWings: THREE.Mesh[] = [];
  private mimiLight: THREE.PointLight | null = null;
  private mimiSparkles: THREE.Mesh[] = [];
  private beaconMap: Map<string, THREE.Group> = new Map();

  // Shared Materials
  private stoneMat = new THREE.MeshStandardMaterial({ color: 0x475549, roughness: 0.85 });
  private darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x2e3b32, roughness: 0.9 });
  private mossStoneMat = new THREE.MeshStandardMaterial({ color: 0x3b5838, roughness: 0.88 });
  private woodBarkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
  private woodPlankMat = new THREE.MeshStandardMaterial({ color: 0x6e4624, roughness: 0.8 });
  private ropeMat = new THREE.MeshStandardMaterial({ color: 0xb5935b, roughness: 0.85 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pathBlockerBox = new THREE.Box3();
    this.pathBlockerMesh = new THREE.Group();
    this.waterChannelMesh = new THREE.Group();
    this.bridgeFullMesh = new THREE.Group();
    this.dragonGateGroup = new THREE.Group();

    // Build all interactive puzzle objects
    this.buildStage1Crystals();
    this.buildStage2WaterFlow();
    this.buildStage3Resources();
    this.buildStage4BridgeConstruction();
    this.buildStage5ShrineSockets();
    this.buildStage6DragonGate();

    // Build Sage Eldrin Guide, Dragon Valley Trials, and Hazards
    this.buildOldSageGuide();
    this.buildDragonValleyTrials();
    this.buildHazardsAndBerries();

    // Build Sky Beacons and Mimi the Forest Fairy Guide
    this.buildSkyBeacons();
    this.buildMimiFairy();
  }

  // ====================================================
  // 1. STAGE 1: ANCIENT CRYSTALS
  // ====================================================
  private buildStage1Crystals() {
    const crystalDefs = [
      {
        id: 'azure' as const,
        name: 'Azure Crystal',
        pos: [-12, 0.45, 4] as [number, number, number],
        color: 0x00f0ff,
        emissive: 0x0099cc,
      },
      {
        id: 'emerald' as const,
        name: 'Emerald Crystal',
        pos: [20, 0.45, -11] as [number, number, number],
        color: 0x10b981,
        emissive: 0x059669,
      },
      {
        id: 'moon' as const,
        name: 'Moon Crystal',
        pos: [-10, 0.45, -4] as [number, number, number],
        color: 0xe0e7ff,
        emissive: 0x6366f1,
      },
    ];

    crystalDefs.forEach((def) => {
      const group = new THREE.Group();
      group.position.set(...def.pos);

      // Carved Ancient Stone Pedestal
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.55, 0.4, 8),
        this.darkStoneMat
      );
      pedestal.position.y = 0.2;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      // Glowing floating crystal octahedron
      const crystalGeo = new THREE.OctahedronGeometry(0.32, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: 2.2,
        roughness: 0.15,
        metalness: 0.1,
      });
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      crystalMesh.position.y = 0.75;
      group.add(crystalMesh);

      // Point light
      const pLight = new THREE.PointLight(def.color, 1.8, 6);
      pLight.position.y = 0.75;
      group.add(pLight);

      // Orbiting particles ring
      const ringGeo = new THREE.TorusGeometry(0.45, 0.02, 6, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: def.color });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.75;
      ring.rotation.x = Math.PI / 3;
      group.add(ring);

      this.scene.add(group);

      this.crystals.push({
        id: def.id,
        name: def.name,
        position: def.pos,
        color: def.color,
        emissive: def.emissive,
        mesh: group,
        collected: false,
      });
    });
  }

  // ====================================================
  // 2. STAGE 2: WATER CHANNEL & MOVABLE STONES
  // ====================================================
  private buildStage2WaterFlow() {
    // Ancient stone aqueduct flume spanning along z = -7.5, x: -4 to 4
    const channelBed = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 0.3, 1.0),
      this.darkStoneMat
    );
    channelBed.position.set(0, 0.1, -7.5);
    this.waterChannelMesh.add(channelBed);

    // Channel walls
    [-0.55, 0.55].forEach((offsetZ) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 0.4, 0.2),
        this.stoneMat
      );
      wall.position.set(0, 0.3, -7.5 + offsetZ);
      this.waterChannelMesh.add(wall);
    });

    // Flowing water stream inside channel (initially hidden)
    const streamGeo = new THREE.PlaneGeometry(8.2, 0.7);
    streamGeo.rotateX(-Math.PI / 2);
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0099cc,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    this.waterFlowStream = new THREE.Mesh(streamGeo, streamMat);
    this.waterFlowStream.position.set(0, 0.26, -7.5);
    this.waterFlowStream.visible = false;
    this.waterChannelMesh.add(this.waterFlowStream);

    this.scene.add(this.waterChannelMesh);

    // 2 Target Slots in the aqueduct gaps
    const targetPositions: [string, [number, number, number]][] = [
      ['water_target_1', [-1.8, 0.25, -7.5]],
      ['water_target_2', [1.8, 0.25, -7.5]],
    ];

    targetPositions.forEach(([id, pos]) => {
      const ringGroup = new THREE.Group();
      ringGroup.position.set(...pos);

      const runeRing = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.55, 12),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
        })
      );
      runeRing.rotateX(-Math.PI / 2);
      ringGroup.add(runeRing);

      this.scene.add(ringGroup);
      this.waterTargets.push({
        id,
        pos: new THREE.Vector3(...pos),
        mesh: ringGroup,
        completed: false,
      });
    });

    // 2 Movable Fallen Channel Stones
    const stonePositions: [string, string, [number, number, number]][] = [
      ['water_stone_1', 'Ancient Channel Stone (West)', [-5.5, 0.3, -6.5]],
      ['water_stone_2', 'Ancient Channel Stone (East)', [4.8, 0.3, -6.2]],
    ];

    stonePositions.forEach(([id, name, pos]) => {
      const mesh = this.createChannelStoneMesh(false);
      mesh.position.set(...pos);
      this.scene.add(mesh);

      this.waterStones.push({
        id,
        name,
        currentPos: new THREE.Vector3(...pos),
        rotationY: 0,
        mesh,
        placed: false,
        locked: false,
      });
    });
  }

  private createChannelStoneMesh(isGhost: boolean): THREE.Group {
    const group = new THREE.Group();
    const mat = isGhost
      ? new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
      : this.mossStoneMat;

    // Carved interlocking block
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), mat);
    block.position.y = 0.25;
    block.castShadow = !isGhost;
    block.receiveShadow = !isGhost;
    group.add(block);

    // Carved aqueduct rune groove
    if (!isGhost) {
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.08, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
        })
      );
      groove.position.set(0, 0.51, 0);
      group.add(groove);
    }
    return group;
  }

  // ====================================================
  // 3. STAGE 3: RESOURCE GATHERING (Logs & Ropes)
  // ====================================================
  private buildStage3Resources() {
    // 3 Fallen Hardwood Logs
    const logLocations: [string, string, [number, number, number]][] = [
      ['log_item_1', 'Fallen Hardwood Log (Meadow)', [-6.5, 0.25, 8.0]],
      ['log_item_2', 'Fallen Hardwood Log (East Ridge)', [7.0, 0.25, 6.5]],
      ['log_item_3', 'Fallen Hardwood Log (Riverside)', [-3.5, 0.25, -1.0]],
    ];

    logLocations.forEach(([id, name, pos]) => {
      const group = new THREE.Group();
      group.position.set(...pos);

      // Wooden log mesh
      const trunkGeo = new THREE.CylinderGeometry(0.28, 0.32, 2.8, 7);
      trunkGeo.rotateZ(Math.PI / 2);
      const trunk = new THREE.Mesh(trunkGeo, this.woodBarkMat);
      trunk.position.y = 0.28;
      trunk.castShadow = true;
      group.add(trunk);

      // Subtle sparkle aura
      const aura = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.5, 8),
        new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      );
      aura.rotateX(-Math.PI / 2);
      aura.position.y = 0.05;
      group.add(aura);

      this.scene.add(group);
      this.scatteredLogs.push({
        id,
        name,
        pos: new THREE.Vector3(...pos),
        mesh: group,
        collected: false,
      });
    });

    // 2 Sturdy Rope Bundles
    const ropeLocations: [string, string, [number, number, number]][] = [
      ['rope_item_1', 'Expedition Rope Bundle (Outpost)', [5.5, 0.35, 1.5]],
      ['rope_item_2', 'Expedition Rope Bundle (Ruins)', [-8.5, 0.35, 2.0]],
    ];

    ropeLocations.forEach(([id, name, pos]) => {
      const group = new THREE.Group();
      group.position.set(...pos);

      // Coiled rope coil
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.12, 8, 12),
        this.ropeMat
      );
      coil.rotateX(Math.PI / 2);
      coil.position.y = 0.2;
      coil.castShadow = true;
      group.add(coil);

      const aura = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.45, 8),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      );
      aura.rotateX(-Math.PI / 2);
      aura.position.y = 0.05;
      group.add(aura);

      this.scene.add(group);
      this.scatteredRopes.push({
        id,
        name,
        pos: new THREE.Vector3(...pos),
        mesh: group,
        collected: false,
      });
    });
  }

  // ====================================================
  // 4. STAGE 4: INTERACTIVE BRIDGE CONSTRUCTION
  // ====================================================
  private buildStage4BridgeConstruction() {
    // 1. River Ravine Passage Blocker (prevents jumping or walking across river before bridge)
    this.pathBlockerBox.setFromCenterAndSize(
      new THREE.Vector3(0, 1.0, -12),
      new THREE.Vector3(12, 4, 4.5)
    );

    // Visual rubble barrier in riverbed
    for (let rx = -4.5; rx <= 4.5; rx += 1.5) {
      const rubble = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.65, 0),
        this.darkStoneMat
      );
      rubble.position.set(rx + (Math.random() - 0.5) * 0.3, 0.2, -12);
      this.pathBlockerMesh.add(rubble);
    }
    this.scene.add(this.pathBlockerMesh);

    // 3 Ghost Log Slots spanning across ravine at z = -12
    const slotX = [-1.3, 0.0, 1.3];
    slotX.forEach((sx, idx) => {
      const slotGroup = new THREE.Group();
      slotGroup.position.set(sx, 0.15, -12);

      // Ghost timber preview
      const ghostTimber = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 5.8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          wireframe: true,
          transparent: true,
          opacity: 0.4,
        })
      );
      ghostTimber.rotateX(Math.PI / 2); // align along Z across river
      slotGroup.add(ghostTimber);

      this.scene.add(slotGroup);
      this.bridgeSlots.push({
        id: `bridge_slot_${idx + 1}`,
        pos: new THREE.Vector3(sx, 0.15, -12),
        mesh: slotGroup,
        placed: false,
      });
    });

    // 2 Rope Anchor Posts on Riverbanks
    const anchorDefs: [string, [number, number, number]][] = [
      ['rope_anchor_left', [-2.0, 0.3, -12]],
      ['rope_anchor_right', [2.0, 0.3, -12]],
    ];

    anchorDefs.forEach(([id, pos]) => {
      const postGroup = new THREE.Group();
      postGroup.position.set(...pos);

      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 1.2, 6),
        this.woodBarkMat
      );
      post.position.y = 0.6;
      postGroup.add(post);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.4, 8),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      );
      ring.rotateX(-Math.PI / 2);
      ring.position.y = 0.05;
      postGroup.add(ring);

      this.scene.add(postGroup);
      this.bridgeRopeAnchors.push({
        id,
        pos: new THREE.Vector3(...pos),
        mesh: postGroup,
        attached: false,
      });
    });

    // Pre-build Bridge Structure (hidden until constructed)
    this.bridgeFullMesh.position.set(0, 0.15, -12);

    // 3 Main Heavy Log Beams
    [-1.3, 0.0, 1.3].forEach((bx) => {
      const logMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.35, 6.2, 8),
        this.woodBarkMat
      );
      logMesh.rotateX(Math.PI / 2);
      logMesh.position.x = bx;
      logMesh.castShadow = true;
      this.bridgeFullMesh.add(logMesh);
    });

    // Transverse Wooden Planks
    for (let pz = -2.7; pz <= 2.7; pz += 0.45) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.1, 0.38),
        this.woodPlankMat
      );
      plank.position.set((Math.random() - 0.5) * 0.06, 0.34, pz);
      plank.castShadow = true;
      plank.receiveShadow = true;
      this.bridgeFullMesh.add(plank);
    }

    // Side Rope Railings
    [-1.75, 1.75].forEach((rx) => {
      const ropeRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 6.0, 6),
        this.ropeMat
      );
      ropeRail.rotateX(Math.PI / 2);
      ropeRail.position.set(rx, 0.9, 0);
      this.bridgeFullMesh.add(ropeRail);

      // Support posts along railing
      [-2.4, 0, 2.4].forEach((pz) => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.1, 1.1, 6),
          this.woodBarkMat
        );
        post.position.set(rx, 0.55, pz);
        this.bridgeFullMesh.add(post);
      });
    });

    this.bridgeFullMesh.visible = false;
    this.scene.add(this.bridgeFullMesh);
  }

  // ====================================================
  // 5. STAGE 5: ANCIENT SHRINE CRYSTAL SOCKETS
  // ====================================================
  private buildStage5ShrineSockets() {
    const socketDefs: ['azure' | 'emerald' | 'moon', string, [number, number, number], number][] = [
      ['azure', 'Azure Crystal Socket', [-2.4, 1.4, -28.8], 0x00f0ff],
      ['emerald', 'Emerald Crystal Socket', [0, 1.4, -32.2], 0x10b981],
      ['moon', 'Moon Crystal Socket', [2.4, 1.4, -28.8], 0xe0e7ff],
    ];

    socketDefs.forEach(([id, name, pos, color]) => {
      const group = new THREE.Group();
      group.position.set(...pos);

      // Carved Pedestal Pillar
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.55, 1.4, 8),
        this.darkStoneMat
      );
      pedestal.position.y = 0.7;
      pedestal.castShadow = true;
      group.add(pedestal);

      // Carved Socket Basin
      const basin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.4, 0.35, 8),
        this.stoneMat
      );
      basin.position.y = 1.45;
      group.add(basin);

      // Glowing Runic Glyph
      const rune = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.32, 6),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      );
      rune.rotateX(-Math.PI / 2);
      rune.position.y = 1.63;
      group.add(rune);

      // Crystal inside socket (hidden until inserted)
      const crystalMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 2.8,
          roughness: 0.1,
        })
      );
      crystalMesh.position.y = 1.85;
      crystalMesh.visible = false;
      group.add(crystalMesh);

      // Crystal radiance light
      const pLight = new THREE.PointLight(color, 0, 8);
      pLight.position.y = 1.85;
      group.add(pLight);

      this.scene.add(group);

      this.shrineSockets.push({
        id,
        name,
        pos: new THREE.Vector3(...pos),
        mesh: group,
        insertedCrystalMesh: crystalMesh,
        light: pLight,
        inserted: false,
      });
    });

    // Divine Skyward Beam of Light from center of Shrine
    const beamGeo = new THREE.CylinderGeometry(0.8, 2.5, 36, 12);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.shrineBeam = new THREE.Mesh(beamGeo, beamMat);
    this.shrineBeam.position.set(0, 18, -30);
    this.scene.add(this.shrineBeam);
  }

  // ====================================================
  // 6. STAGE 6: DRAGON VALLEY GATEWAY
  // ====================================================
  private buildStage6DragonGate() {
    this.dragonGateGroup.position.set(0, 0, -38);

    // Monumental Stone Gateway Pylons
    [-6.5, 6.5].forEach((px) => {
      const pylon = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 16, 3.5),
        this.darkStoneMat
      );
      pylon.position.set(px, 8, 0);
      pylon.castShadow = true;
      this.dragonGateGroup.add(pylon);

      // Dragon Brazier Fire
      const brazier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.6, 1.2, 8),
        this.stoneMat
      );
      brazier.position.set(px, 16.6, 0);
      this.dragonGateGroup.add(brazier);
    });

    // Dragon Stone Arch Lintel
    const arch = new THREE.Mesh(
      new THREE.BoxGeometry(16.5, 3.5, 4.0),
      this.stoneMat
    );
    arch.position.set(0, 17.5, 0);
    arch.castShadow = true;
    this.dragonGateGroup.add(arch);

    // Left & Right Stone Doors
    const doorGeo = new THREE.BoxGeometry(4.6, 14, 0.6);
    this.dragonGateLeftDoor = new THREE.Mesh(doorGeo, this.stoneMat);
    this.dragonGateLeftDoor.position.set(-2.4, 7, 0);
    this.dragonGateGroup.add(this.dragonGateLeftDoor);

    this.dragonGateRightDoor = new THREE.Mesh(doorGeo, this.stoneMat);
    this.dragonGateRightDoor.position.set(2.4, 7, 0);
    this.dragonGateGroup.add(this.dragonGateRightDoor);

    // Volcanic / Dragon Mist in distance beyond gate
    const mistGeo = new THREE.PlaneGeometry(28, 14);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const mist = new THREE.Mesh(mistGeo, mistMat);
    mist.position.set(0, 7, -10);
    this.dragonGateGroup.add(mist);

    this.scene.add(this.dragonGateGroup);

    // Mountain Gate Barrier Collider
    this.dragonGateCollider = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 8, -38),
      new THREE.Vector3(12, 16, 3)
    );
  }

  // ====================================================
  // SAGE ELDRIN GUIDE (WISE OLD AGED MAN NPC)
  // ====================================================
  private buildOldSageGuide() {
    const sage = WorldBuilder.buildOldSageNPC();
    this.oldSageGroup = sage.root;
    this.oldSageAnimator = sage.update;
    this.updateSagePosition();
    this.scene.add(this.oldSageGroup);
  }

  public getLevelNumber(): number {
    switch (this.currentStage) {
      case 'CRYSTALS':
        return 1;
      case 'WATER_FLOW':
        return 2;
      case 'GATHER_MATERIALS':
      case 'BUILD_BRIDGE':
        return 3;
      case 'SHRINE_CRYSTALS':
        return 4;
      case 'DRAGON_VALLEY':
      case 'COMPLETED':
      default:
        return 5;
    }
  }

  public updateSagePosition() {
    const lvl = this.getLevelNumber();
    let target = new THREE.Vector3(3.5, 0.2, 4);
    let rotY = -Math.PI / 4;
    if (lvl === 2) {
      target = new THREE.Vector3(-3.2, 0.2, -6.5);
      rotY = Math.PI / 3;
    } else if (lvl === 3) {
      target = new THREE.Vector3(2.5, 0.35, -11.5);
      rotY = -Math.PI / 2;
    } else if (lvl === 4) {
      target = new THREE.Vector3(3.5, 1.4, -29);
      rotY = -Math.PI * 0.65;
    } else if (lvl === 5) {
      target = new THREE.Vector3(-3.2, 0.4, -51);
      rotY = Math.PI / 4;
    }
    this.oldSagePos.copy(target);
    this.oldSageGroup.position.copy(target);
    this.oldSageGroup.rotation.y = rotY;
  }

  public getElderDialogue(): ElderDialogueData {
    const lvl = this.getLevelNumber();
    switch (lvl) {
      case 1:
        return {
          levelNumber: 1,
          levelTitle: 'Awakening & The 3 Ancient Crystals',
          stageName: 'CRYSTALS',
          lines: [
            "Greetings, traveler! I am Sage Eldrin. The ancient jungle holds great forgotten powers.",
            "Three sacred elemental crystals—Azure, Emerald, and Moon—lie scattered across these enchanted grounds.",
            "Gather all 3 crystals. Their elemental energy will allow us to restore life to the valley!",
          ],
          tip: 'Hold [Shift] to sprint! Watch your stamina bar. Stand near me anytime for full healing!',
        };
      case 2:
        return {
          levelNumber: 2,
          levelTitle: 'Aqueduct Restoration',
          stageName: 'WATER_FLOW',
          lines: [
            "Splendid work! The crystals hum with gentle warmth in your hands.",
            "Ahead lies the ancient water channel. Two heavy masonry blocks were dislodged during the great tremors.",
            "Pick up the channel stones with [E] and place them into the canal gaps to let the fresh waters flow again!",
          ],
          tip: 'Carry the stones to the glowing gaps. Press [Q] to rotate if needed.',
        };
      case 3:
        return {
          levelNumber: 3,
          levelTitle: 'Forest Bridge Construction',
          stageName: 'BUILD_BRIDGE',
          lines: [
            "Listen to the river! The waters flow once more through the sacred ravine.",
            "Now look across the raging torrent. To reach the ancient shrine, we must forge a crossing!",
            "Gather 3 sturdy timber logs and 2 vine ropes from the jungle floor, then construct the bridge across the river chasm.",
          ],
          tip: 'Careful not to fall into the torrential river! Stepping into the rapids will wash you back and drain your HP.',
        };
      case 4:
        return {
          levelNumber: 4,
          levelTitle: 'The Sacred Altar Trial',
          stageName: 'SHRINE_CRYSTALS',
          lines: [
            "The bridge stands firm and true! You have the makings of a master builder, adventurer.",
            "Cross over the bridge into the deep sanctuary. The ancient altar waits in silence.",
            "Insert your Azure, Emerald, and Moon crystals into the 3 pedestals to activate the celestial beacon and unlock the Dragon Valley Gateway!",
          ],
          tip: 'Approach each pedestal and press [E] to insert the matching crystal.',
        };
      case 5:
      default:
        return {
          levelNumber: 5,
          levelTitle: 'The Forbidden Dragon Valley',
          stageName: 'DRAGON_VALLEY',
          lines: [
            "Behold, the Dragon Valley! The forbidden realm has slumbered for a thousand years.",
            "Flanking the sanctum are two ancient Dragon Braziers. Walk up to each brazier and ignite them with [E]!",
            "Once both flames burn bright, touch the Golden Dragon Totem to awaken the slumbering dragon spirit and claim the legendary Sun Relic!",
          ],
          tip: 'Watch out for hot volcanic magma vents on the obsidian ground!',
        };
    }
  }

  // ====================================================
  // LEVEL 5: DRAGON VALLEY EXPEDITION & TOTEM
  // ====================================================
  private buildDragonValleyTrials() {
    this.dragonValleyGroup = new THREE.Group();

    // 1. Dragon Braziers
    const brazierPositions: [string, THREE.Vector3][] = [
      ['brazier_left', new THREE.Vector3(-4.5, 0.4, -47)],
      ['brazier_right', new THREE.Vector3(4.5, 0.4, -47)],
    ];

    brazierPositions.forEach(([id, pos]) => {
      const brazierGroup = new THREE.Group();
      brazierGroup.position.copy(pos);

      // Stone base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.8, 8), this.darkStoneMat);
      base.position.y = 0.4;
      brazierGroup.add(base);

      // Bronze bowl
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.6, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.8, roughness: 0.3 })
      );
      bowl.position.y = 0.95;
      brazierGroup.add(bowl);

      // Flame Mesh (hidden until lit)
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 0.9, 8),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 })
      );
      flame.position.y = 1.45;
      flame.visible = false;
      brazierGroup.add(flame);

      // Light (intensity 0 until lit)
      const light = new THREE.PointLight(0xf97316, 0, 10);
      light.position.y = 1.5;
      brazierGroup.add(light);

      this.dragonValleyGroup.add(brazierGroup);

      this.dragonBraziers.push({
        id,
        pos,
        lit: false,
        light,
        flameMesh: flame,
      });
    });

    // 2. The Great Golden Dragon Totem
    this.dragonTotemMesh = new THREE.Group();
    this.dragonTotemMesh.position.set(0, 0.4, -54);

    // Multi-tiered obsidian stepped dais
    [
      { rTop: 3.2, rBot: 3.5, h: 0.35, y: 0.17 },
      { rTop: 2.2, rBot: 2.5, h: 0.4, y: 0.55 },
      { rTop: 1.4, rBot: 1.6, h: 0.5, y: 1.0 },
    ].forEach((tier) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(tier.rTop, tier.rBot, tier.h, 12),
        this.darkStoneMat
      );
      m.position.y = tier.y;
      m.castShadow = true;
      this.dragonTotemMesh.add(m);
    });

    // Dragon Horn Pillars flanking altar
    [-1.2, 1.2].forEach((px) => {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 2.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 })
      );
      horn.position.set(px, 2.1, 0);
      horn.rotation.z = px < 0 ? 0.25 : -0.25;
      this.dragonTotemMesh.add(horn);
    });

    // Floating Golden Dragon Orb
    const orbGeo = new THREE.OctahedronGeometry(0.55, 2);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.15,
    });
    this.dragonOrbMesh = new THREE.Mesh(orbGeo, orbMat);
    this.dragonOrbMesh.position.set(0, 2.2, 0);
    this.dragonTotemMesh.add(this.dragonOrbMesh);

    this.dragonOrbLight = new THREE.PointLight(0xfbbf24, 2.2, 12);
    this.dragonOrbLight.position.set(0, 2.2, 0);
    this.dragonTotemMesh.add(this.dragonOrbLight);

    this.dragonValleyGroup.add(this.dragonTotemMesh);
    this.scene.add(this.dragonValleyGroup);
  }

  // ====================================================
  // HAZARDS (THORNY BRAMBLES) & HEALING GLOW BERRIES
  // ====================================================
  private buildHazardsAndBerries() {
    // 1. Thorny Bramble Patches
    const brambleCoords = [
      new THREE.Vector3(-6, 0.1, 8),
      new THREE.Vector3(9, 0.1, 7),
      new THREE.Vector3(-8, 0.1, -22),
      new THREE.Vector3(8, 0.1, -24),
    ];

    const thornMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.9 });
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });

    brambleCoords.forEach((pos) => {
      const g = new THREE.Group();
      g.position.copy(pos);

      // Bramble mound
      const mound = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.35, 8), thornMat);
      mound.position.y = 0.15;
      g.add(mound);

      // Thorny spikes
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 6), spikeMat);
        spike.position.set(Math.cos(angle) * 1.1, 0.45, Math.sin(angle) * 1.1);
        spike.rotation.x = Math.sin(angle) * 0.3;
        spike.rotation.z = -Math.cos(angle) * 0.3;
        g.add(spike);
      }

      this.scene.add(g);
      this.thornBrambles.push({
        pos,
        radius: 2.0,
        mesh: g,
      });
    });

    // 2. Healing Glow Berry Bushes
    const berryCoords: [string, THREE.Vector3][] = [
      ['berries_1', new THREE.Vector3(-4, 0.2, 5)],
      ['berries_2', new THREE.Vector3(5, 0.2, -20)],
    ];

    const bushMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      emissiveIntensity: 0.9,
    });

    berryCoords.forEach(([id, pos]) => {
      const g = new THREE.Group();
      g.position.copy(pos);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), bushMat);
      foliage.position.y = 0.65;
      foliage.scale.set(1.2, 0.85, 1.1);
      g.add(foliage);

      // Glowing berries cluster
      const berriesGroup = new THREE.Group();
      [-0.35, 0, 0.35].forEach((bx, idx) => {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), berryMat);
        berry.position.set(bx, 0.8 + (idx % 2) * 0.15, 0.45);
        berriesGroup.add(berry);
      });
      g.add(berriesGroup);

      const berryLight = new THREE.PointLight(0xf43f5e, 1.4, 4);
      berryLight.position.set(0, 0.9, 0.4);
      g.add(berryLight);

      this.scene.add(g);

      this.berryBushes.push({
        id,
        pos,
        hasBerries: true,
        mesh: g,
        cooldown: 0,
      });
    });
  }

  public checkHazardsAndHealing(
    playerPos: THREE.Vector3,
    playerController: PlayerController,
    delta: number
  ) {
    // 1. Sage Eldrin Healing Aura (When within 4.5m of Old Sage)
    const distToSage = playerPos.distanceTo(this.oldSagePos);
    this.isNearOldSage = distToSage < 4.5;
    if (this.isNearOldSage) {
      // Heal 12 HP per second & boost stamina
      if (playerController.health < playerController.maxHealth) {
        playerController.health = Math.min(
          playerController.maxHealth,
          playerController.health + 12 * delta
        );
      }
      playerController.stamina = Math.min(
        playerController.maxStamina,
        playerController.stamina + 25 * delta
      );
    }

    // 2. Thorny Bramble Hazards
    for (const bramble of this.thornBrambles) {
      if (playerPos.distanceTo(bramble.pos) < bramble.radius) {
        playerController.takeDamage(10, 'Thorny Brambles');
        break;
      }
    }

    // 3. Torrential River Rapids Hazard (if walking into deep river without using the bridge)
    if (playerPos.z > -15.8 && playerPos.z < -8.2 && playerPos.y < 0.1) {
      // If bridge is not complete or player stepped off bridge (abs(x) > 2.0)
      if (!this.isBridgeComplete || Math.abs(playerPos.x) > 2.0) {
        playerController.takeDamage(15, 'River Rapids');
        // Wash safely back to south bank
        playerController.position.set(0, 0.4, -6.5);
        playerController.velocity.set(0, 0, 0);
        sound.playHurt();
      }
    }

    // 4. Volcanic Magma Vents in Dragon Valley (z < -40)
    if (playerPos.z < -40) {
      const vents = [
        new THREE.Vector3(-6, 0, -48),
        new THREE.Vector3(6, 0, -48),
        new THREE.Vector3(-3, 0, -56),
        new THREE.Vector3(3, 0, -56),
      ];
      for (const vent of vents) {
        if (playerPos.distanceTo(vent) < 2.0) {
          playerController.takeDamage(15, 'Volcanic Magma Vent');
          break;
        }
      }
    }

    // 5. Cooldown for Berry Bushes
    for (const bush of this.berryBushes) {
      if (bush.cooldown > 0) {
        bush.cooldown -= delta;
        if (bush.cooldown <= 0) {
          bush.hasBerries = true;
          bush.mesh.children[1].visible = true; // Show berries again
        }
      }
    }

    // 6. Defeat recovery: If player health drops to 0, revive at Sage Eldrin's sanctuary
    if (playerController.health <= 0) {
      playerController.health = 100;
      playerController.stamina = 100;
      playerController.isExhausted = false;
      playerController.position.copy(this.oldSagePos).add(new THREE.Vector3(0, 0.2, 1.5));
      playerController.velocity.set(0, 0, 0);
      sound.playHeal();
    }
  }

  // ====================================================
  // SKY BEACONS (Tall Vertical Light Columns in the Sky)
  // ====================================================
  private createBeaconMesh(color: number): THREE.Group {
    const group = new THREE.Group();

    // Outer translucent aura cylinder (36 units tall)
    const outerGeo = new THREE.CylinderGeometry(0.35, 0.55, 36, 12, 1, true);
    outerGeo.translate(0, 18, 0);
    const outerMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    group.add(outer);

    // Inner bright core laser column
    const innerGeo = new THREE.CylinderGeometry(0.08, 0.08, 36, 8, 1, false);
    innerGeo.translate(0, 18, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    // Glowing base ring on ground
    const ringGeo = new THREE.RingGeometry(0.5, 1.3, 16);
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.translate(0, 0.08, 0);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    return group;
  }

  private buildSkyBeacons() {
    this.skyBeaconsGroup = new THREE.Group();

    // Stage 1: Crystals
    const c1 = this.createBeaconMesh(0x00f0ff);
    c1.position.set(-12, 0, 4);
    this.beaconMap.set('azure', c1);
    this.skyBeaconsGroup.add(c1);

    const c2 = this.createBeaconMesh(0x10b981);
    c2.position.set(20, 0, -11);
    this.beaconMap.set('emerald', c2);
    this.skyBeaconsGroup.add(c2);

    const c3 = this.createBeaconMesh(0xa855f7);
    c3.position.set(-10, 0, -4);
    this.beaconMap.set('moon', c3);
    this.skyBeaconsGroup.add(c3);

    // Stage 2: Water stones & Canal
    const ws1 = this.createBeaconMesh(0xfbbf24);
    ws1.position.set(-5.5, 0, -6.5);
    this.beaconMap.set('water_stone_1', ws1);
    this.skyBeaconsGroup.add(ws1);

    const ws2 = this.createBeaconMesh(0xfbbf24);
    ws2.position.set(4.8, 0, -6.2);
    this.beaconMap.set('water_stone_2', ws2);
    this.skyBeaconsGroup.add(ws2);

    const wSlot = this.createBeaconMesh(0x38bdf8);
    wSlot.position.set(0, 0, -7.5);
    this.beaconMap.set('water_canal', wSlot);
    this.skyBeaconsGroup.add(wSlot);

    // Stage 3: Logs & Ropes
    const l1 = this.createBeaconMesh(0xf59e0b);
    l1.position.set(-6.5, 0, 8.0);
    this.beaconMap.set('log_item_1', l1);
    this.skyBeaconsGroup.add(l1);

    const l2 = this.createBeaconMesh(0xf59e0b);
    l2.position.set(7.0, 0, 6.5);
    this.beaconMap.set('log_item_2', l2);
    this.skyBeaconsGroup.add(l2);

    const l3 = this.createBeaconMesh(0xf59e0b);
    l3.position.set(-3.5, 0, -1.0);
    this.beaconMap.set('log_item_3', l3);
    this.skyBeaconsGroup.add(l3);

    const r1 = this.createBeaconMesh(0xfacc15);
    r1.position.set(5.5, 0, 1.5);
    this.beaconMap.set('rope_item_1', r1);
    this.skyBeaconsGroup.add(r1);

    const r2 = this.createBeaconMesh(0xfacc15);
    r2.position.set(-8.5, 0, 2.0);
    this.beaconMap.set('rope_item_2', r2);
    this.skyBeaconsGroup.add(r2);

    // Stage 4: Bridge crossing
    const br = this.createBeaconMesh(0x06b6d4);
    br.position.set(0, 0, -12);
    this.beaconMap.set('bridge', br);
    this.skyBeaconsGroup.add(br);

    // Stage 5: Shrine altar
    const sh = this.createBeaconMesh(0xc084fc);
    sh.position.set(0, 0, -30);
    this.beaconMap.set('shrine', sh);
    this.skyBeaconsGroup.add(sh);

    // Stage 6: Dragon Gate
    const dg = this.createBeaconMesh(0x10b981);
    dg.position.set(0, 0, -38);
    this.beaconMap.set('dragongate', dg);
    this.skyBeaconsGroup.add(dg);

    this.scene.add(this.skyBeaconsGroup);
  }

  // ====================================================
  // 3D COMPANION FAIRY (MIMI)
  // ====================================================
  private buildMimiFairy() {
    this.mimiFairyGroup = new THREE.Group();
    this.mimiFairyGroup.position.set(1.2, 2.2, 13);

    // Cute glowing fairy head / body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xfff0a8,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bodyMat);
    this.mimiFairyGroup.add(head);

    // Cute blush cheeks
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.7 });
    [-0.09, 0.09].forEach((bx) => {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blushMat);
      blush.position.set(bx, -0.04, 0.16);
      this.mimiFairyGroup.add(blush);
    });

    // Cute fairy crown / halo
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 6, 12), crownMat);
    crown.rotateX(Math.PI / 2);
    crown.position.y = 0.22;
    this.mimiFairyGroup.add(crown);

    // Translucent fairy wings
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    [-1, 1].forEach((side) => {
      const wingGeo = new THREE.PlaneGeometry(0.38, 0.5);
      wingGeo.translate(side * 0.18, 0.1, -0.06);
      const wing = new THREE.Mesh(wingGeo, wingMat);
      this.mimiFairyGroup.add(wing);
      this.mimiWings.push(wing);
    });

    // Warm friendly point light
    this.mimiLight = new THREE.PointLight(0xffea75, 1.8, 6.0);
    this.mimiFairyGroup.add(this.mimiLight);

    // Orbiting magic sparkles
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 3; i++) {
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), sparkMat);
      this.mimiFairyGroup.add(spark);
      this.mimiSparkles.push(spark);
    }

    this.scene.add(this.mimiFairyGroup);
  }

  // ====================================================
  // SKY BEACONS UPDATE
  // ====================================================
  private updateSkyBeacons(time: number) {
    // Hide all by default, then enable active ones
    this.beaconMap.forEach((beacon) => {
      beacon.visible = false;
    });

    const pulseScale = 1.0 + Math.sin(time * 3.0) * 0.08;

    if (this.currentStage === 'CRYSTALS') {
      this.crystals.forEach((c) => {
        if (!c.collected) {
          const b = this.beaconMap.get(c.id);
          if (b) {
            b.visible = true;
            b.scale.set(pulseScale, 1, pulseScale);
          }
        }
      });
    } else if (this.currentStage === 'WATER_FLOW') {
      if (this.heldObjectId) {
        // Show beacon over aqueduct canal target
        const b = this.beaconMap.get('water_canal');
        if (b) {
          b.visible = true;
          b.scale.set(pulseScale, 1, pulseScale);
        }
      } else {
        // Show beacons over unplaced stones
        this.waterStones.forEach((ws) => {
          if (!ws.placed) {
            const b = this.beaconMap.get(ws.id);
            if (b) {
              b.visible = true;
              b.scale.set(pulseScale, 1, pulseScale);
            }
          }
        });
      }
    } else if (this.currentStage === 'GATHER_MATERIALS') {
      this.scatteredLogs.forEach((l) => {
        if (!l.collected) {
          const b = this.beaconMap.get(l.id);
          if (b) {
            b.visible = true;
            b.scale.set(pulseScale, 1, pulseScale);
          }
        }
      });
      this.scatteredRopes.forEach((r) => {
        if (!r.collected) {
          const b = this.beaconMap.get(r.id);
          if (b) {
            b.visible = true;
            b.scale.set(pulseScale, 1, pulseScale);
          }
        }
      });
    } else if (this.currentStage === 'BUILD_BRIDGE') {
      const b = this.beaconMap.get('bridge');
      if (b) {
        b.visible = true;
        b.scale.set(pulseScale, 1, pulseScale);
      }
    } else if (this.currentStage === 'SHRINE_CRYSTALS') {
      const b = this.beaconMap.get('shrine');
      if (b) {
        b.visible = true;
        b.scale.set(pulseScale, 1, pulseScale);
      }
    } else {
      const b = this.beaconMap.get('dragongate');
      if (b) {
        b.visible = true;
        b.scale.set(pulseScale, 1, pulseScale);
      }
    }
  }

  // ====================================================
  // MIMI FAIRY COMPANION 60FPS FLIGHT & WING FLUTTER
  // ====================================================
  private updateMimiFairy(delta: number, time: number, playerPos?: THREE.Vector3) {
    if (!this.mimiFairyGroup) return;

    // Flutter wings gracefully
    if (this.mimiWings.length >= 2) {
      const wingAngle = Math.sin(time * 18.0) * 0.45;
      this.mimiWings[0].rotation.y = wingAngle;
      this.mimiWings[1].rotation.y = -wingAngle;
    }

    // Spin sparkles
    this.mimiSparkles.forEach((spark, idx) => {
      const angle = time * 3.0 + (idx * Math.PI * 2) / 3;
      spark.position.set(Math.cos(angle) * 0.35, Math.sin(time * 2 + idx) * 0.1, Math.sin(angle) * 0.35);
    });

    if (playerPos) {
      // Float gracefully near player's right shoulder
      const targetPos = new THREE.Vector3(
        playerPos.x + 1.2,
        playerPos.y + 1.7 + Math.sin(time * 3.5) * 0.12,
        playerPos.z + 0.8
      );
      this.mimiFairyGroup.position.lerp(targetPos, delta * 3.2);

      // Face toward active objective to guide player!
      const targetInfo = this.getCurrentTargetInfo(playerPos);
      if (targetInfo) {
        const lookDir = targetInfo.pos.clone().sub(this.mimiFairyGroup.position);
        lookDir.y = 0;
        if (lookDir.lengthSq() > 0.01) {
          const targetRotY = Math.atan2(lookDir.x, lookDir.z);
          this.mimiFairyGroup.rotation.y = THREE.MathUtils.lerp(
            this.mimiFairyGroup.rotation.y,
            targetRotY,
            delta * 4.0
          );
        }
      }
    }
  }

  // ====================================================
  // GET ACTIVE OBJECTIVE INFO (English Only)
  // ====================================================
  public getCurrentTargetInfo(playerPos: THREE.Vector3): {
    id: string;
    name: string;
    nameEn: string;
    pos: THREE.Vector3;
    icon: string;
    color: string;
    hint: string;
    hintEn: string;
    distance: number;
  } {
    // Stage 1: Crystals
    if (this.currentStage === 'CRYSTALS') {
      const remaining = this.crystals.filter((c) => !c.collected);
      if (remaining.length > 0) {
        remaining.sort((a, b) => {
          const pa = new THREE.Vector3(...a.position);
          const pb = new THREE.Vector3(...b.position);
          return playerPos.distanceTo(pa) - playerPos.distanceTo(pb);
        });
        const target = remaining[0];
        const targetPos = new THREE.Vector3(...target.position);
        const dist = Math.round(playerPos.distanceTo(targetPos));

        if (target.id === 'azure') {
          return {
            id: 'azure',
            name: 'Azure Sun Crystal',
            nameEn: 'Azure Sun Crystal',
            pos: targetPos,
            icon: '💎',
            color: '#00f0ff',
            hint: 'Look towards the ancient stone ruins on your left! Press [E] to collect.',
            hintEn: 'Look towards the ancient stone ruins on your left! Press [E] to collect.',
            distance: dist,
          };
        } else if (target.id === 'emerald') {
          return {
            id: 'emerald',
            name: 'Emerald Water Crystal',
            nameEn: 'Emerald Water Crystal',
            pos: targetPos,
            icon: '💎',
            color: '#10b981',
            hint: 'Head to the roaring waterfall on the right! Press [E] to collect.',
            hintEn: 'Head to the roaring waterfall on the right! Press [E] to collect.',
            distance: dist,
          };
        } else {
          return {
            id: 'moon',
            name: 'Moon Altar Crystal',
            nameEn: 'Moon Altar Crystal',
            pos: targetPos,
            icon: '💎',
            color: '#a855f7',
            hint: 'Climb the mossy stone mound on the left! Press [E] to collect.',
            hintEn: 'Climb the mossy stone mound on the left! Press [E] to collect.',
            distance: dist,
          };
        }
      }
    }

    // Stage 2: Water Flow
    if (this.currentStage === 'WATER_FLOW') {
      if (this.heldObjectId) {
        const emptyTarget = this.waterTargets.find((t) => !t.completed);
        const targetPos = emptyTarget ? emptyTarget.pos : new THREE.Vector3(0, 0.3, -7.5);
        const dist = Math.round(playerPos.distanceTo(targetPos));
        return {
          id: 'water_slot',
          name: 'Aqueduct Canal Slot',
          nameEn: 'Aqueduct Canal Slot',
          pos: targetPos,
          icon: '💧',
          color: '#38bdf8',
          hint: 'Walk to the canal slot and press [E] or Left-Click to place stone!',
          hintEn: 'Walk to the canal slot and press [E] or Left-Click to place stone!',
          distance: dist,
        };
      } else {
        const unplaced = this.waterStones.filter((s) => !s.placed);
        if (unplaced.length > 0) {
          unplaced.sort((a, b) => playerPos.distanceTo(a.currentPos) - playerPos.distanceTo(b.currentPos));
          const target = unplaced[0];
          const dist = Math.round(playerPos.distanceTo(target.currentPos));
          return {
            id: target.id,
            name: 'Fallen Canal Stone',
            nameEn: 'Fallen Canal Stone',
            pos: target.currentPos,
            icon: '🪨',
            color: '#fbbf24',
            hint: 'Walk to the glowing stone and press [E] to pick it up!',
            hintEn: 'Walk to the glowing stone and press [E] to pick it up!',
            distance: dist,
          };
        }
      }
    }

    // Stage 3: Gather Materials
    if (this.currentStage === 'GATHER_MATERIALS') {
      const remainingLogs = this.scatteredLogs.filter((l) => !l.collected);
      const remainingRopes = this.scatteredRopes.filter((r) => !r.collected);
      const allItems: { pos: THREE.Vector3; type: 'log' | 'rope' }[] = [
        ...remainingLogs.map((l) => ({ pos: l.pos, type: 'log' as const })),
        ...remainingRopes.map((r) => ({ pos: r.pos, type: 'rope' as const })),
      ];
      if (allItems.length > 0) {
        allItems.sort((a, b) => playerPos.distanceTo(a.pos) - playerPos.distanceTo(b.pos));
        const item = allItems[0];
        const dist = Math.round(playerPos.distanceTo(item.pos));
        if (item.type === 'log') {
          return {
            id: 'timber_log',
            name: 'Hardwood Timber Log',
            nameEn: 'Hardwood Timber Log',
            pos: item.pos,
            icon: '🪵',
            color: '#f59e0b',
            hint: 'Pick up the glowing wooden log with [E]!',
            hintEn: 'Pick up the glowing wooden log with [E]!',
            distance: dist,
          };
        } else {
          return {
            id: 'rope',
            name: 'Sturdy Rope Bundle',
            nameEn: 'Sturdy Rope Bundle',
            pos: item.pos,
            icon: '🪢',
            color: '#fbbf24',
            hint: 'Collect the sturdy rope bundle with [E]!',
            hintEn: 'Collect the sturdy rope bundle with [E]!',
            distance: dist,
          };
        }
      }
    }

    // Stage 4: Build Bridge
    if (this.currentStage === 'BUILD_BRIDGE') {
      const bridgePos = new THREE.Vector3(0, 0.4, -12);
      const dist = Math.round(playerPos.distanceTo(bridgePos));
      return {
        id: 'bridge_crossing',
        name: 'River Crossing Bridge',
        nameEn: 'River Crossing Bridge',
        pos: bridgePos,
        icon: '🌉',
        color: '#06b6d4',
        hint: 'Walk to the glowing river crossing and press [E] to build the wooden bridge!',
        hintEn: 'Walk to the glowing river crossing and press [E] to build the wooden bridge!',
        distance: dist,
      };
    }

    // Stage 5: Shrine Sockets
    if (this.currentStage === 'SHRINE_CRYSTALS') {
      const shrinePos = new THREE.Vector3(0, 1.4, -30);
      const dist = Math.round(playerPos.distanceTo(shrinePos));
      return {
        id: 'shrine_altar',
        name: 'Sacred Forest Altar',
        nameEn: 'Sacred Forest Altar',
        pos: shrinePos,
        icon: '⛩️',
        color: '#c084fc',
        hint: 'Cross the wooden bridge and press [E] at the altar to insert the crystals!',
        hintEn: 'Cross the wooden bridge and press [E] at the altar to insert the crystals!',
        distance: dist,
      };
    }

    // Completed: Dragon Valley Gate
    const gatePos = new THREE.Vector3(0, 1.0, -38);
    const dist = Math.round(playerPos.distanceTo(gatePos));
    return {
      id: 'dragon_gate',
      name: 'Dragon Valley Gate',
      nameEn: 'Dragon Valley Gate',
      pos: gatePos,
      icon: '🐉',
      color: '#f59e0b',
      hint: 'The magical portal is open! Walk through the doors into Dragon Valley!',
      hintEn: 'The magical portal is open! Walk through the doors into Dragon Valley!',
      distance: dist,
    };
  }

  // ====================================================
  // PROXIMITY DETECTION FOR HUD PROMPTS
  // ====================================================
  public getInteractionPrompt(playerPos: THREE.Vector3, playerData: PlayerData): string | null {
    // 0. Sage Eldrin (Wise Old Guide across all levels)
    if (playerPos.distanceTo(this.oldSagePos) < 3.8) {
      return `SPEAK WITH SAGE ELDRIN [E]`;
    }

    // 0b. Healing Glow Berries
    for (const bush of this.berryBushes) {
      if (bush.hasBerries && playerPos.distanceTo(bush.pos) < 2.5) {
        return 'EAT HEALING BERRIES (+25 HP) [E]';
      }
    }

    // 1. Check Crystals (Stage 1)
    if (this.currentStage === 'CRYSTALS') {
      for (const crystal of this.crystals) {
        if (!crystal.collected && playerPos.distanceTo(new THREE.Vector3(...crystal.position)) < 3.2) {
          return `COLLECT ${crystal.name.toUpperCase()}`;
        }
      }
    }

    // 2. Check Water Channel Stones (Stage 2)
    if (this.currentStage === 'WATER_FLOW') {
      if (!this.heldObjectId) {
        for (const stone of this.waterStones) {
          if (!stone.locked && playerPos.distanceTo(stone.currentPos) < 3.0) {
            return `PICK UP ${stone.name.toUpperCase()}`;
          }
        }
      } else {
        for (const target of this.waterTargets) {
          if (!target.completed && playerPos.distanceTo(target.pos) < 4.0) {
            return 'PLACE STONE INTO CANAL GAP';
          }
        }
      }
    }

    // 3. Check Bridge Materials (Stage 3)
    if (this.currentStage === 'GATHER_MATERIALS') {
      for (const log of this.scatteredLogs) {
        if (!log.collected && playerPos.distanceTo(log.pos) < 3.0) {
          return `COLLECT ${log.name.toUpperCase()}`;
        }
      }
      for (const rope of this.scatteredRopes) {
        if (!rope.collected && playerPos.distanceTo(rope.pos) < 3.0) {
          return `COLLECT ${rope.name.toUpperCase()}`;
        }
      }
    }

    // 4. Check Bridge Construction (Stage 4)
    if (this.currentStage === 'BUILD_BRIDGE') {
      const bridgeCenter = new THREE.Vector3(0, 0.5, -12);
      if (playerPos.distanceTo(bridgeCenter) < 5.0) {
        const unplacedSlot = this.bridgeSlots.find((s) => !s.placed);
        if (unplacedSlot) {
          const placedCount = this.bridgeSlots.filter((s) => s.placed).length;
          return `PLACE BRIDGE LOG (${placedCount + 1}/3)`;
        }
        const unattachedRope = this.bridgeRopeAnchors.find((r) => !r.attached);
        if (unattachedRope) {
          const ropeCount = this.bridgeRopeAnchors.filter((r) => r.attached).length;
          return `SECURE BRIDGE WITH ROPE (${ropeCount + 1}/2)`;
        }
      }
    }

    // 5. Check Shrine Crystal Sockets (Stage 5)
    if (this.currentStage === 'SHRINE_CRYSTALS') {
      for (const socket of this.shrineSockets) {
        if (!socket.inserted && playerPos.distanceTo(socket.pos) < 3.2) {
          return `INSERT ${socket.name.toUpperCase()}`;
        }
      }
    }

    // 6. Dragon Valley Gateway (Stage 6) & Level 5 Trials
    if (this.currentStage === 'DRAGON_VALLEY' || this.currentStage === 'COMPLETED') {
      // Braziers
      for (const b of this.dragonBraziers) {
        if (!b.lit && playerPos.distanceTo(b.pos) < 3.2) {
          return 'IGNITE DRAGON BRAZIER [E]';
        }
      }
      // Totem
      const totemPos = new THREE.Vector3(0, 1.0, -54);
      if (playerPos.distanceTo(totemPos) < 3.8 && !this.isDragonAwakened) {
        return 'AWAKEN GOLDEN DRAGON TOTEM [E]';
      }

      const gatePos = new THREE.Vector3(0, 2, -38);
      if (playerPos.distanceTo(gatePos) < 5.0) {
        return 'ENTER RAINBOW BRIDGE (PHASE 2) [E]';
      }
    }

    return null;
  }

  // ====================================================
  // PRIMARY INTERACTION HANDLER (E Key)
  // ====================================================
  public handleInteract(
    playerPos: THREE.Vector3,
    playerData: PlayerData,
    questData: QuestData
  ): PuzzleInteractionResult {
    // --------------------------------------------------
    // 0. SPEAK WITH SAGE ELDRIN (Wise Elder Guide)
    // --------------------------------------------------
    if (playerPos.distanceTo(this.oldSagePos) < 3.8) {
      sound.playElderVoice();
      return {
        handled: true,
        isElderDialogue: true,
        elderDialogue: this.getElderDialogue(),
        message: 'Speaking with Sage Eldrin',
        type: 'info',
      };
    }

    // --------------------------------------------------
    // 0b. EAT HEALING GLOW BERRIES (+25 Health)
    // --------------------------------------------------
    for (const bush of this.berryBushes) {
      if (bush.hasBerries && playerPos.distanceTo(bush.pos) < 2.5) {
        bush.hasBerries = false;
        bush.cooldown = 30;
        bush.mesh.children[1].visible = false;
        sound.playHeal();
        return {
          handled: true,
          message: '🫐 Consumed Healing Glow Berries! Restored +25 Health.',
          type: 'success',
          reward: {
            xp: 15,
            coins: 5,
            stageTitle: 'HEALING BERRIES HARVESTED',
            questTitle: "NATURE'S BLESSING",
            description: 'The sweet magical berries restored your vitality and energized your spirit.',
          },
        };
      }
    }

    // --------------------------------------------------
    // 1. COLLECT CRYSTALS (Stage 1)
    // --------------------------------------------------
    if (this.currentStage === 'CRYSTALS') {
      for (const crystal of this.crystals) {
        if (!crystal.collected && playerPos.distanceTo(new THREE.Vector3(...crystal.position)) < 3.2) {
          crystal.collected = true;
          crystal.mesh.visible = false;
          sound.playPickup();

          // Count collected
          const collectedCount = this.crystals.filter((c) => c.collected).length;
          if (collectedCount === 3) {
            // All 3 crystals collected!
            this.currentStage = 'WATER_FLOW';
            this.updateSagePosition();
            sound.playQuestFanfare();

            return {
              handled: true,
              message: '✨ All 3 Ancient Crystals collected! Quest updated.',
              type: 'success',
              reward: {
                xp: 100,
                coins: 50,
                stageTitle: 'STAGE 1 COMPLETE!',
                questTitle: 'ANCIENT CRYSTALS DISCOVERED',
                description: 'You found the Azure, Emerald, and Moon Crystals hidden across the enchanted jungle!',
                unlockedTitle: 'RESTORE THE WATER FLOW',
              },
            };
          }

          return {
            handled: true,
            message: `+ Collected ${crystal.name} (${collectedCount}/3)`,
            type: 'success',
          };
        }
      }
    }

    // --------------------------------------------------
    // 2. WATER FLOW STONES (Stage 2)
    // --------------------------------------------------
    if (this.currentStage === 'WATER_FLOW') {
      if (!this.heldObjectId) {
        for (const stone of this.waterStones) {
          if (!stone.locked && playerPos.distanceTo(stone.currentPos) < 3.0) {
            this.heldObjectId = stone.id;
            this.heldRotationY = stone.rotationY;
            stone.mesh.visible = false;

            // Ghost preview
            if (this.ghostMesh) this.scene.remove(this.ghostMesh);
            this.ghostMesh = this.createChannelStoneMesh(true);
            this.scene.add(this.ghostMesh);

            sound.playPickup();
            return {
              handled: true,
              message: `Holding ${stone.name}. Walk to the glowing gap and press [E] or Left-Click!`,
              type: 'info',
            };
          }
        }
      } else {
        const placeRes = this.attemptPlacement(playerPos);
        if (placeRes.success) {
          return {
            handled: true,
            message: placeRes.message,
            type: 'success',
            reward: placeRes.reward,
          };
        }
      }
    }

    // --------------------------------------------------
    // 3. COLLECT BRIDGE MATERIALS (Stage 3)
    // --------------------------------------------------
    if (this.currentStage === 'GATHER_MATERIALS') {
      // Collect Logs
      for (const log of this.scatteredLogs) {
        if (!log.collected && playerPos.distanceTo(log.pos) < 3.0) {
          log.collected = true;
          log.mesh.visible = false;
          sound.playPickup();

          const logsCount = this.scatteredLogs.filter((l) => l.collected).length;
          const ropesCount = this.scatteredRopes.filter((r) => r.collected).length;

          if (logsCount === 3 && ropesCount === 2) {
            this.currentStage = 'BUILD_BRIDGE';
            return {
              handled: true,
              message: '🪵 Materials Ready! Approach the river crossing to construct the bridge.',
              type: 'success',
            };
          }
          return {
            handled: true,
            message: `+ Collected Wooden Log (${logsCount}/3)`,
            type: 'success',
          };
        }
      }

      // Collect Ropes
      for (const rope of this.scatteredRopes) {
        if (!rope.collected && playerPos.distanceTo(rope.pos) < 3.0) {
          rope.collected = true;
          rope.mesh.visible = false;
          sound.playPickup();

          const logsCount = this.scatteredLogs.filter((l) => l.collected).length;
          const ropesCount = this.scatteredRopes.filter((r) => r.collected).length;

          if (logsCount === 3 && ropesCount === 2) {
            this.currentStage = 'BUILD_BRIDGE';
            return {
              handled: true,
              message: '🪵 Materials Ready! Approach the river crossing to construct the bridge.',
              type: 'success',
            };
          }
          return {
            handled: true,
            message: `+ Collected Sturdy Rope (${ropesCount}/2)`,
            type: 'success',
          };
        }
      }
    }

    // --------------------------------------------------
    // 4. INTERACTIVE BRIDGE CONSTRUCTION (Stage 4)
    // --------------------------------------------------
    if (this.currentStage === 'BUILD_BRIDGE') {
      const bridgeCenter = new THREE.Vector3(0, 0.5, -12);
      if (playerPos.distanceTo(bridgeCenter) < 5.5) {
        // Place logs first
        const unplacedSlot = this.bridgeSlots.find((s) => !s.placed);
        if (unplacedSlot) {
          unplacedSlot.placed = true;
          unplacedSlot.mesh.visible = false; // Hide ghost
          sound.playPlaceSuccess();

          const placedLogs = this.bridgeSlots.filter((s) => s.placed).length;
          if (placedLogs === 3) {
            this.bridgeFullMesh.visible = true; // Show full wooden beams
            return {
              handled: true,
              message: '🪵 All 3 timber logs positioned! Now secure the anchor ropes.',
              type: 'success',
            };
          }
          return {
            handled: true,
            message: `✓ Bridge timber positioned (${placedLogs}/3)`,
            type: 'success',
          };
        }

        // Attach ropes next
        const unattachedRope = this.bridgeRopeAnchors.find((r) => !r.attached);
        if (unattachedRope) {
          unattachedRope.attached = true;
          sound.playPlaceSuccess();

          const ropeCount = this.bridgeRopeAnchors.filter((r) => r.attached).length;
          if (ropeCount === 2) {
            // Bridge fully completed & walkable!
            this.isBridgeComplete = true;
            this.scene.remove(this.pathBlockerMesh);
            this.pathBlockerBox.makeEmpty(); // Clear river crossing blocker

            this.currentStage = 'SHRINE_CRYSTALS';
            this.updateSagePosition();
            sound.playQuestFanfare();

            return {
              handled: true,
              message: '🌉 FOREST CROSSING RESTORED! The bridge is now solid and walkable.',
              type: 'success',
              reward: {
                xp: 200,
                coins: 100,
                materials: 5,
                stageTitle: 'STAGE 3 COMPLETE!',
                questTitle: 'FOREST CROSSING RESTORED',
                description: 'You engineered a sturdy wooden bridge across the torrential river ravine!',
                unlockedTitle: 'ACTIVATE THE ANCIENT SHRINE',
              },
            };
          }

          return {
            handled: true,
            message: `✓ Rope anchor secured (${ropeCount}/2)`,
            type: 'success',
          };
        }
      }
    }

    // --------------------------------------------------
    // 5. INSERT CRYSTALS INTO SHRINE SOCKETS (Stage 5)
    // --------------------------------------------------
    if (this.currentStage === 'SHRINE_CRYSTALS') {
      for (const socket of this.shrineSockets) {
        if (!socket.inserted && playerPos.distanceTo(socket.pos) < 3.2) {
          socket.inserted = true;
          socket.insertedCrystalMesh.visible = true;
          socket.light.intensity = 2.4;
          sound.playPlaceSuccess();

          const insertedCount = this.shrineSockets.filter((s) => s.inserted).length;
          if (insertedCount === 3) {
            // Complete shrine activation & open Level 5: Dragon Valley!
            this.isShrineRestored = true;
            this.currentStage = 'DRAGON_VALLEY';
            this.updateSagePosition();

            // Activate skyward divine light beam
            (this.shrineBeam.material as THREE.MeshBasicMaterial).opacity = 0.65;

            // Open Dragon Valley gateway
            this.openDragonGate();
            sound.playQuestFanfare();

            return {
              handled: true,
              message: '✨ ANCIENT SHRINE RESTORED! Dragon Valley Gateway has opened for Level 5!',
              type: 'success',
              reward: {
                xp: 300,
                coins: 150,
                relic: 'Ancient Sun Relic',
                stageTitle: 'LEVEL 4 COMPLETE!',
                questTitle: 'ANCIENT SHRINE RESTORED',
                description: 'The ancient divine shrine resonates with pure elemental energy. The sealed gates to Dragon Valley are now open!',
                unlockedTitle: 'LEVEL 5: DRAGON VALLEY EXPEDITION',
              },
            };
          }

          return {
            handled: true,
            message: `✓ Crystal accepted: ${socket.name} activated (${insertedCount}/3)`,
            type: 'success',
          };
        }
      }
    }

    // --------------------------------------------------
    // 6. DRAGON VALLEY EXPEDITION (Level 5 Final Trials)
    // --------------------------------------------------
    if (this.currentStage === 'DRAGON_VALLEY') {
      // 1. Dragon Braziers
      for (const brazier of this.dragonBraziers) {
        if (!brazier.lit && playerPos.distanceTo(brazier.pos) < 3.2) {
          brazier.lit = true;
          brazier.flameMesh.visible = true;
          brazier.light.intensity = 3.2;
          sound.playPlaceSuccess();

          const litCount = this.dragonBraziers.filter((b) => b.lit).length;
          if (litCount === 2) {
            return {
              handled: true,
              message: '🔥 Both Dragon Braziers roaring with eternal flame! Now touch the Golden Dragon Totem!',
              type: 'success',
            };
          }
          return {
            handled: true,
            message: `🔥 Dragon Brazier ignited (${litCount}/2)`,
            type: 'success',
          };
        }
      }

      // 2. The Golden Dragon Totem
      const totemPos = new THREE.Vector3(0, 1.0, -54);
      if (playerPos.distanceTo(totemPos) < 3.8) {
        const litCount = this.dragonBraziers.filter((b) => b.lit).length;
        if (litCount < 2) {
          sound.playPlaceWrong();
          return {
            handled: true,
            message: `The Golden Dragon Totem is slumbering. Ignite both Dragon Braziers first (${litCount}/2)!`,
            type: 'error',
          };
        }

        if (!this.isDragonAwakened) {
          this.isDragonAwakened = true;
          this.currentStage = 'COMPLETED';
          if (this.dragonOrbLight) this.dragonOrbLight.intensity = 5.0;
          this.updateSagePosition();
          sound.playQuestFanfare();

          return {
            handled: true,
            message: '👑 LEVEL 5 CONQUERED! The Golden Dragon Spirit has awakened!',
            type: 'success',
            reward: {
              xp: 500,
              coins: 300,
              relic: 'Legendary Golden Dragon Orb',
              stageTitle: 'ALL 5 LEVELS CONQUERED!',
              questTitle: 'AWAKENING OF THE GOLDEN DRAGON',
              description: 'You restored the crystals, revived the aqueduct, built the grand bridge, activated the divine altar, and conquered Dragon Valley! Sage Eldrin crowns you Master Champion of the Realm!',
              unlockedTitle: 'MASTER CHAMPION OF THE REALM',
            },
          };
        }
      }
    }

    // --------------------------------------------------
    // 7. GATE TO PHASE 2 (RAINBOW BRIDGE)
    // --------------------------------------------------
    const gatePos = new THREE.Vector3(0, 2, -38);
    if ((this.isShrineRestored || this.currentStage === 'DRAGON_VALLEY') && playerPos.distanceTo(gatePos) < 5.2) {
      return {
        handled: true,
        isPhaseComplete: true,
        message: 'The mystical gate hums with prismatic light leading to the Rainbow Bridge...',
        type: 'success',
      };
    }

    return { handled: false };
  }

  // ====================================================
  // OBJECT PLACEMENT (Stage 2 Channel Stones)
  // ====================================================
  public attemptPlacement(playerPos: THREE.Vector3): {
    success: boolean;
    correct: boolean;
    message: string;
    stageAdvanced: boolean;
    reward?: any;
  } {
    if (!this.heldObjectId || !this.ghostMesh) {
      return { success: false, correct: false, message: '', stageAdvanced: false };
    }

    const stone = this.waterStones.find((s) => s.id === this.heldObjectId);
    if (!stone) return { success: false, correct: false, message: '', stageAdvanced: false };

    const placePos = this.ghostMesh.position.clone();
    let matchedTarget: (typeof this.waterTargets)[0] | null = null;

    // Check proximity to uncompleted water target (generous for accessibility/kids)
    for (const target of this.waterTargets) {
      if (!target.completed && (placePos.distanceTo(target.pos) < 2.5 || playerPos.distanceTo(target.pos) < 3.8)) {
        matchedTarget = target;
        break;
      }
    }

    if (matchedTarget) {
      // Correct placement in water channel!
      matchedTarget.completed = true;
      stone.locked = true;
      stone.placed = true;
      stone.currentPos.copy(matchedTarget.pos);
      stone.mesh.position.copy(matchedTarget.pos);
      stone.mesh.rotation.y = 0;
      stone.mesh.visible = true;

      // Clean up ghost
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
      this.heldObjectId = null;

      sound.playPlaceSuccess();

      // Check if both water stones are placed
      const allPlaced = this.waterTargets.every((t) => t.completed);
      if (allPlaced) {
        this.isWaterFlowRestored = true;
        this.waterFlowStream.visible = true; // Stream rushes!
        this.currentStage = 'GATHER_MATERIALS';
        this.updateSagePosition();
        sound.playQuestFanfare();

        return {
          success: true,
          correct: true,
          message: '🌊 WATER FLOW RESTORED! Pristine stream flowing towards shrine.',
          stageAdvanced: true,
          reward: {
            xp: 150,
            coins: 75,
            stageTitle: 'STAGE 2 COMPLETE!',
            questTitle: 'WATER FLOW RESTORED',
            description: 'You repositioned the ancient aqueduct stones. The sacred river flows freely once more!',
            unlockedTitle: 'BUILD THE FOREST CROSSING',
          },
        };
      }

      return {
        success: true,
        correct: true,
        message: '✓ Channel stone secured in position (1/2)',
        stageAdvanced: false,
      };
    } else {
      // Incorrect placement
      sound.playPlaceWrong();
      return {
        success: false,
        correct: false,
        message: "The stone doesn't fit here.",
        stageAdvanced: false,
      };
    }
  }

  public rotateHeld(amountRad: number = Math.PI / 4) {
    if (!this.heldObjectId) return;
    this.heldRotationY = (this.heldRotationY + amountRad) % (Math.PI * 2);
    sound.playRotate();
  }

  public updateHeldPosition(playerPos: THREE.Vector3, playerYaw: number) {
    if (!this.heldObjectId || !this.ghostMesh) return;
    const dist = 2.4;
    const px = playerPos.x - Math.sin(playerYaw) * dist;
    const pz = playerPos.z - Math.cos(playerYaw) * dist;
    this.ghostMesh.position.set(px, 0.25, pz);
    this.ghostMesh.rotation.y = this.heldRotationY;
  }

  public cancelHolding(playerPos: THREE.Vector3) {
    if (!this.heldObjectId) return;
    const stone = this.waterStones.find((s) => s.id === this.heldObjectId);
    if (stone) {
      stone.mesh.visible = true;
    }
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }
    this.heldObjectId = null;
  }

  // ====================================================
  // DRAGON GATEWAY OPENING
  // ====================================================
  public openDragonGate() {
    this.isDragonGateOpen = true;
    this.dragonGateCollider.makeEmpty(); // Remove gate passage obstacle
  }

  // ====================================================
  // 60FPS UPDATE ANIMATORS
  // ====================================================
  public update(delta: number, time: number, playerPos?: THREE.Vector3) {
    // 0. Update Sky Beacons & Mimi the Forest Fairy Guide
    this.updateSkyBeacons(time);
    this.updateMimiFairy(delta, time, playerPos);

    // 1. Crystal bobs & particle spins
    this.crystals.forEach((c, idx) => {
      if (!c.collected) {
        c.mesh.children[1].rotation.y += delta * 0.8;
        c.mesh.children[1].position.y = 0.75 + Math.sin(time * 2.5 + idx) * 0.08;
      }
    });

    // 2. Pulsing water target glyphs
    if (this.currentStage === 'WATER_FLOW') {
      this.waterTargets.forEach((wt, idx) => {
        if (!wt.completed) {
          wt.mesh.scale.setScalar(1 + Math.sin(time * 3 + idx) * 0.06);
        } else {
          wt.mesh.visible = false;
        }
      });
    }

    // 3. Water flow stream oscillation
    if (this.isWaterFlowRestored && this.waterFlowStream) {
      (this.waterFlowStream.material as THREE.MeshStandardMaterial).opacity =
        0.82 + Math.sin(time * 4) * 0.08;
    }

    // 4. Shrine Sockets Crystal floating glow
    this.shrineSockets.forEach((sock) => {
      if (sock.inserted) {
        sock.insertedCrystalMesh.rotation.y += delta * 0.9;
        sock.insertedCrystalMesh.position.y = 1.85 + Math.sin(time * 2) * 0.04;
      }
    });

    // 5. Shrine divine beam pulsing
    if (this.isShrineRestored && this.shrineBeam) {
      this.shrineBeam.rotation.y += delta * 0.4;
      (this.shrineBeam.material as THREE.MeshBasicMaterial).opacity =
        0.65 + Math.sin(time * 3) * 0.15;
    }

    // 6. Dragon gate doors swinging open smoothly
    if (this.isDragonGateOpen) {
      if (this.dragonGateLeftDoor.rotation.y > -Math.PI / 2.2) {
        this.dragonGateLeftDoor.rotation.y -= delta * 0.8;
      }
      if (this.dragonGateRightDoor.rotation.y < Math.PI / 2.2) {
        this.dragonGateRightDoor.rotation.y += delta * 0.8;
      }
    }

    // 7. Sage Eldrin breathing & lantern sway
    this.oldSageAnimator?.(time);

    // 8. Level 5 Dragon Valley Braziers flicker & Totem Orb animation
    this.dragonBraziers.forEach((b, i) => {
      if (b.lit) {
        b.light.intensity = 2.8 + Math.sin(time * 12 + i * 2) * 0.5;
        b.flameMesh.scale.set(
          1 + Math.sin(time * 10 + i) * 0.1,
          1 + Math.cos(time * 14 + i) * 0.15,
          1 + Math.sin(time * 10 + i) * 0.1
        );
      }
    });

    if (this.dragonOrbMesh) {
      this.dragonOrbMesh.rotation.y += delta * 1.2;
      this.dragonOrbMesh.rotation.x = Math.sin(time * 1.5) * 0.15;
      this.dragonOrbMesh.position.y = 2.2 + Math.sin(time * 2.5) * 0.12;
      if (this.isDragonAwakened && this.dragonOrbLight) {
        this.dragonOrbLight.intensity = 4.5 + Math.sin(time * 6) * 1.0;
      }
    }
  }
}
