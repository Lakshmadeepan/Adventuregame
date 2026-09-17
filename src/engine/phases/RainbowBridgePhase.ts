import * as THREE from 'three';
import { WorldBuildResult } from '../WorldBuilder';
import { PlayerData, QuestData } from '../../types';
import { sound } from '../../audio/SoundManager';

export interface RainbowBridgeInteractionResult {
  handled: boolean;
  message?: string;
  type?: 'success' | 'info' | 'error';
  isPhaseComplete?: boolean;
  reward?: {
    xp: number;
    coins: number;
    item: string;
    icon: string;
  };
}

export class RainbowBridgePhase {
  public scene: THREE.Scene;
  public obstacles: THREE.Box3[] = [];
  public groundHeightFunc: (x: number, z: number) => number;
  public updateAnimators: ((delta: number, time: number) => void)[] = [];

  // Puzzle State
  public mechanism1Active = false;
  public mechanism2Active = false;
  public mechanism3Active = false;
  public prismPlaced = false;
  public heldPrism = false;
  public isBridgeRestored = false;
  public phaseCompleted = false;

  // Meshes
  private ghostMesh: THREE.Mesh | null = null;
  private prismMesh: THREE.Mesh;
  private lever1Mesh: THREE.Group;
  private lever2Mesh: THREE.Group;
  private lever3Mesh: THREE.Group;
  private bridgeSegments: THREE.Mesh[] = [];
  private bridgeGlowLight: THREE.PointLight;
  private rainbowBeams: THREE.Mesh[] = [];
  private summitPedestal: THREE.Group;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.015);

    // Sky & Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x38bdf8, 1.2);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    dirLight.position.set(25, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const d = 40;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Terrain: Two massive cliff sides separated by a deep canyon at z between -5 and -25
    this.groundHeightFunc = (x: number, z: number) => {
      // If bridge is restored, provide a smooth walkable path across the canyon
      if (this.isBridgeRestored && Math.abs(x) <= 3.5 && z >= -27 && z <= -3) {
        return 0.5;
      }

      // South Starting Cliff (z > -4)
      if (z > -4) {
        return Math.sin(x * 0.15) * 0.4 + Math.cos(z * 0.15) * 0.3;
      }

      // North Summit Cliff (z < -26)
      if (z < -26) {
        return 0.8 + Math.sin(x * 0.2) * 0.5;
      }

      // Deep Canyon Abyss
      return -18.0;
    };

    this.buildEnvironment();
    this.buildMechanisms();
    this.buildRainbowBridge();
  }

  private buildEnvironment() {
    // South Cliff Ground
    const southGeo = new THREE.BoxGeometry(70, 20, 30);
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
    });
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7,
    });

    const southCliff = new THREE.Mesh(southGeo, cliffMat);
    southCliff.position.set(0, -10, 10);
    southCliff.receiveShadow = true;
    this.scene.add(southCliff);

    const southTop = new THREE.Mesh(new THREE.PlaneGeometry(70, 30, 20, 10), grassMat);
    southTop.rotateX(-Math.PI / 2);
    southTop.position.set(0, 0.05, 10);
    southTop.receiveShadow = true;
    this.scene.add(southTop);

    // North Summit Cliff
    const northCliff = new THREE.Mesh(southGeo, cliffMat);
    northCliff.position.set(0, -9.2, -40);
    northCliff.receiveShadow = true;
    this.scene.add(northCliff);

    const northTop = new THREE.Mesh(new THREE.PlaneGeometry(70, 30, 20, 10), grassMat);
    northTop.rotateX(-Math.PI / 2);
    northTop.position.set(0, 0.85, -40);
    northTop.receiveShadow = true;
    this.scene.add(northTop);

    // Floating magical rocks in the canyon mist
    const rockGeo = new THREE.DodecahedronGeometry(1.5, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 12 + (i % 3) * 4;
      rock.position.set(Math.cos(angle) * radius, -6 + Math.sin(i) * 3, -15 + Math.sin(angle) * 8);
      rock.castShadow = true;
      this.scene.add(rock);

      const floatOffset = i;
      this.updateAnimators.push((_, time) => {
        rock.position.y = -6 + Math.sin(time * 0.8 + floatOffset) * 0.8;
        rock.rotation.y += 0.005;
      });
    }

    // Distant Cascading Waterfalls
    const fallGeo = new THREE.PlaneGeometry(6, 30);
    const fallMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const fall1 = new THREE.Mesh(fallGeo, fallMat);
    fall1.position.set(-28, -5, -15);
    this.scene.add(fall1);

    const fall2 = new THREE.Mesh(fallGeo, fallMat);
    fall2.position.set(28, -5, -15);
    this.scene.add(fall2);

    // Ancient Ruined Arches on South Side
    const archMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 7, 8), archMat);
    pillar1.position.set(-5, 3.5, -2);
    pillar1.castShadow = true;
    this.scene.add(pillar1);
    this.obstacles.push(new THREE.Box3().setFromObject(pillar1));

    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 7, 8), archMat);
    pillar2.position.set(5, 3.5, -2);
    pillar2.castShadow = true;
    this.scene.add(pillar2);
    this.obstacles.push(new THREE.Box3().setFromObject(pillar2));

    // Summit Ancient Crest Shrine on North Side (Destination)
    this.summitPedestal = new THREE.Group();
    this.summitPedestal.position.set(0, 0.85, -36);

    const shrineBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3.0, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    shrineBase.position.y = 0.3;
    shrineBase.receiveShadow = true;
    this.summitPedestal.add(shrineBase);

    // Floating Rainbow Shard Relic at the Summit
    const shardGeo = new THREE.OctahedronGeometry(0.8, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.5,
      metalness: 0.3,
      roughness: 0.1,
    });
    const shardMesh = new THREE.Mesh(shardGeo, shardMat);
    shardMesh.position.y = 2.4;
    this.summitPedestal.add(shardMesh);

    const shardLight = new THREE.PointLight(0x38bdf8, 3, 10);
    shardLight.position.y = 2.4;
    this.summitPedestal.add(shardLight);

    this.updateAnimators.push((_, time) => {
      shardMesh.rotation.y = time * 1.5;
      shardMesh.position.y = 2.4 + Math.sin(time * 2.5) * 0.2;
    });

    this.scene.add(this.summitPedestal);
  }

  private createLever(pos: THREE.Vector3, color: number): THREE.Group {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base Pedestal
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.9, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
    );
    base.position.y = 0.4;
    base.castShadow = true;
    group.add(base);

    // Lever Handle
    const handleGroup = new THREE.Group();
    handleGroup.position.y = 0.8;

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    stick.position.y = 0.5;
    handleGroup.add(stick);

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5 })
    );
    knob.position.y = 1.0;
    handleGroup.add(knob);

    handleGroup.rotation.z = -0.4; // Unactivated tilt
    group.add(handleGroup);

    return group;
  }

  private buildMechanisms() {
    // Mechanism 1: West Resonator Lever
    this.lever1Mesh = this.createLever(new THREE.Vector3(-14, 0, 4), 0x38bdf8);
    this.scene.add(this.lever1Mesh);

    // Mechanism 2: East Gear Lever
    this.lever2Mesh = this.createLever(new THREE.Vector3(14, 0, 4), 0xfbbf24);
    this.scene.add(this.lever2Mesh);

    // Mechanism 3: Central Alignment Wheel
    this.lever3Mesh = this.createLever(new THREE.Vector3(0, 0, 8), 0xa855f7);
    this.scene.add(this.lever3Mesh);

    // Pickable Optical Prism Block on stone table at (-8, 0, 12)
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.0, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
    );
    table.position.set(-8, 0.5, 12);
    table.castShadow = true;
    this.scene.add(table);
    this.obstacles.push(new THREE.Box3().setFromObject(table));

    const prismGeo = new THREE.OctahedronGeometry(0.6, 1);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x67e8f9,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    this.prismMesh = new THREE.Mesh(prismGeo, prismMat);
    this.prismMesh.position.set(-8, 1.5, 12);
    this.prismMesh.castShadow = true;
    this.scene.add(this.prismMesh);

    // Target Socket for the Prism near the bridge abutment at (0, 0, -1.8)
    const socketBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    socketBase.position.set(0, 0.3, -1.8);
    socketBase.castShadow = true;
    this.scene.add(socketBase);

    // Ghost placement preview
    this.ghostMesh = new THREE.Mesh(
      prismGeo,
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
    );
    this.ghostMesh.position.set(0, 1.2, -1.8);
    this.scene.add(this.ghostMesh);

    this.updateAnimators.push((_, time) => {
      if (!this.heldPrism && !this.prismPlaced) {
        this.prismMesh.rotation.y = time * 1.2;
        this.prismMesh.position.y = 1.5 + Math.sin(time * 2.0) * 0.1;
      }
      if (this.ghostMesh) {
        this.ghostMesh.rotation.y = time * 0.8;
      }
    });
  }

  private buildRainbowBridge() {
    // 7 Radiant Segments spanning the 22-unit canyon gap (z = -4 to -26)
    const colors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0xa855f7];
    const segmentCount = 11;
    const startZ = -4;
    const endZ = -26;

    for (let i = 0; i < segmentCount; i++) {
      const t = i / (segmentCount - 1);
      const z = startZ + (endZ - startZ) * t;
      const col = colors[i % colors.length];

      const segGeo = new THREE.BoxGeometry(6.0, 0.5, 1.8);
      const segMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.2, // dim when unpowered
        roughness: 0.2,
        transparent: true,
        opacity: 0.25, // ghostly until activated
      });

      const segment = new THREE.Mesh(segGeo, segMat);
      segment.position.set(0, 0.4, z);
      segment.receiveShadow = true;
      this.scene.add(segment);
      this.bridgeSegments.push(segment);
    }

    // Glowing Bridge Core Light
    this.bridgeGlowLight = new THREE.PointLight(0xffffff, 0, 30);
    this.bridgeGlowLight.position.set(0, 3, -15);
    this.scene.add(this.bridgeGlowLight);

    // Floating magical particles along the bridge path
    this.updateAnimators.push((_, time) => {
      if (this.isBridgeRestored) {
        this.bridgeSegments.forEach((seg, idx) => {
          seg.position.y = 0.4 + Math.sin(time * 2.5 + idx * 0.5) * 0.08;
          const mat = seg.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 2.0 + Math.sin(time * 3.0 + idx) * 0.5;
        });
      }
    });
  }

  public activateBridge() {
    this.isBridgeRestored = true;
    if (this.ghostMesh) this.ghostMesh.visible = false;
    this.bridgeGlowLight.intensity = 5.0;

    this.bridgeSegments.forEach((seg) => {
      const mat = seg.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.95;
      mat.emissiveIntensity = 2.2;
    });

    sound.playQuestFanfare();
  }

  public getInteractionPrompt(playerPos: THREE.Vector3): string | null {
    if (this.phaseCompleted) return null;

    // Check Summit finish line
    if (this.isBridgeRestored && playerPos.distanceTo(new THREE.Vector3(0, 0.85, -36)) < 4.0) {
      return 'CLAIM RAINBOW SHARD [E]';
    }

    // Check Prism pickup
    if (!this.heldPrism && !this.prismPlaced && playerPos.distanceTo(new THREE.Vector3(-8, 0.5, 12)) < 3.0) {
      return 'PICK UP OPTICAL PRISM [E]';
    }

    // Check Prism placement
    if (this.heldPrism && playerPos.distanceTo(new THREE.Vector3(0, 0.3, -1.8)) < 3.5) {
      return 'INSERT PRISM INTO BRIDGE PEDESTAL [E]';
    }

    // Check Lever 1
    if (!this.mechanism1Active && playerPos.distanceTo(new THREE.Vector3(-14, 0, 4)) < 2.5) {
      return 'ACTIVATE WEST HYDRAULIC LEVER [E]';
    }

    // Check Lever 2
    if (!this.mechanism2Active && playerPos.distanceTo(new THREE.Vector3(14, 0, 4)) < 2.5) {
      return 'ACTIVATE EAST OPTICAL LEVER [E]';
    }

    // Check Lever 3
    if (!this.mechanism3Active && playerPos.distanceTo(new THREE.Vector3(0, 0, 8)) < 2.5) {
      return 'ACTIVATE CENTRAL RESONATOR LEVER [E]';
    }

    return null;
  }

  public handleInteract(playerPos: THREE.Vector3): RainbowBridgeInteractionResult {
    // 1. Check Summit Completion
    if (this.isBridgeRestored && playerPos.distanceTo(new THREE.Vector3(0, 0.85, -36)) < 4.5) {
      this.phaseCompleted = true;
      sound.playQuestFanfare();
      return {
        handled: true,
        isPhaseComplete: true,
        message: '🌈 RAINBOW BRIDGE CONQUERED! The ancient Rainbow Shard is yours!',
        type: 'success',
        reward: {
          xp: 250,
          coins: 150,
          item: 'Rainbow Shard',
          icon: 'Sparkles',
        },
      };
    }

    // 2. Pick up Prism
    if (!this.heldPrism && !this.prismPlaced && playerPos.distanceTo(new THREE.Vector3(-8, 0.5, 12)) < 3.2) {
      this.heldPrism = true;
      this.prismMesh.visible = false;
      sound.playPickup();
      return {
        handled: true,
        message: 'Picked up the Optical Prism! Carry it to the bridge pedestal.',
        type: 'info',
      };
    }

    // 3. Place Prism
    if (this.heldPrism && playerPos.distanceTo(new THREE.Vector3(0, 0.3, -1.8)) < 3.8) {
      this.heldPrism = false;
      this.prismPlaced = true;
      this.prismMesh.visible = true;
      this.prismMesh.position.set(0, 1.2, -1.8);
      sound.playPlaceSuccess();

      this.checkAllMechanisms();
      return {
        handled: true,
        message: '✓ Optical Prism slotted into the core pedestal!',
        type: 'success',
      };
    }

    // 4. Lever 1
    if (!this.mechanism1Active && playerPos.distanceTo(new THREE.Vector3(-14, 0, 4)) < 2.8) {
      this.mechanism1Active = true;
      const handle = this.lever1Mesh.children[1];
      if (handle) handle.rotation.z = 0.4; // Pull forward
      sound.playPlaceSuccess();
      this.checkAllMechanisms();
      return {
        handled: true,
        message: '⚙️ West Hydraulic Lever engaged (1/3 mechanisms)!',
        type: 'success',
      };
    }

    // 5. Lever 2
    if (!this.mechanism2Active && playerPos.distanceTo(new THREE.Vector3(14, 0, 4)) < 2.8) {
      this.mechanism2Active = true;
      const handle = this.lever2Mesh.children[1];
      if (handle) handle.rotation.z = 0.4;
      sound.playPlaceSuccess();
      this.checkAllMechanisms();
      return {
        handled: true,
        message: '⚙️ East Optical Lever engaged (2/3 mechanisms)!',
        type: 'success',
      };
    }

    // 6. Lever 3
    if (!this.mechanism3Active && playerPos.distanceTo(new THREE.Vector3(0, 0, 8)) < 2.8) {
      this.mechanism3Active = true;
      const handle = this.lever3Mesh.children[1];
      if (handle) handle.rotation.z = 0.4;
      sound.playPlaceSuccess();
      this.checkAllMechanisms();
      return {
        handled: true,
        message: '⚙️ Central Resonator Lever engaged (3/3 mechanisms)!',
        type: 'success',
      };
    }

    return { handled: false };
  }

  private checkAllMechanisms() {
    if (
      this.mechanism1Active &&
      this.mechanism2Active &&
      this.mechanism3Active &&
      this.prismPlaced &&
      !this.isBridgeRestored
    ) {
      this.activateBridge();
    }
  }

  public updateHeldPosition(playerPos: THREE.Vector3, playerRotY: number) {
    if (this.heldPrism) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
      this.prismMesh.position.copy(playerPos).add(forward.multiplyScalar(1.2)).add(new THREE.Vector3(0, 1.2, 0));
      this.prismMesh.visible = true;
    }
  }

  public toWorldBuildResult(): WorldBuildResult {
    return {
      scene: this.scene,
      obstacles: this.obstacles,
      groundHeightFunc: this.groundHeightFunc,
      updateAnimators: this.updateAnimators,
    };
  }
}
