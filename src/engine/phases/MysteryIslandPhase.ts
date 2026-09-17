import * as THREE from 'three';
import { WorldBuildResult } from '../WorldBuilder';
import { sound } from '../../audio/SoundManager';

export interface MysteryIslandInteractionResult {
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

export type KeyId = 'WATERFALL' | 'OAK' | 'LIGHTHOUSE';

export class MysteryIslandPhase {
  public scene: THREE.Scene;
  public obstacles: THREE.Box3[] = [];
  public groundHeightFunc: (x: number, z: number) => number;
  public updateAnimators: ((delta: number, time: number) => void)[] = [];

  // Keys & Collectibles State
  public keysCollected: number = 0;
  public collectedKeys: Record<KeyId, boolean> = {
    WATERFALL: false,
    OAK: false,
    LIGHTHOUSE: false,
  };

  // Backwards-compatibility state for HUD & canvas
  public relicsCollected: number = 0;
  public collectedRelics = { WATER: false, FIRE: false, NATURE: false, MOON: false };
  public cluesDiscovered = { WATER: false, FIRE: false, NATURE: false, MOON: false };
  
  // Puzzle & Gate State
  public puzzleSolved = false;
  public caveOpened = false;
  public muralRevealed = false;
  public phaseCompleted = false;

  // 3D Groups and Elements
  private islandGroup: THREE.Group;
  private keyGroups: Record<KeyId, THREE.Group> = {} as any;
  private keyBeacons: Record<KeyId, THREE.Mesh> = {} as any;
  private templeDoor: THREE.Mesh;
  private doorObstacleIndex: number = -1;
  private templeLight: THREE.PointLight;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Bright sunny tropical blue sky
    this.scene.fog = new THREE.FogExp2(0xe0f2fe, 0.004); // Soft bright tropical atmosphere

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    sunLight.position.set(40, 60, -20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    const ambLight = new THREE.HemisphereLight(0xbae6fd, 0x34d399, 1.8);
    this.scene.add(ambLight);

    // Smooth sloping terrain height function
    this.groundHeightFunc = (x: number, z: number) => {
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 55) return -2; // Ocean surrounding island
      if (z < -20 && Math.abs(x) < 20) return 6; // Raised temple plateau
      return Math.max(0, 10 - dist * 0.18); // Gentle island slope
    };

    this.islandGroup = new THREE.Group();
    this.scene.add(this.islandGroup);

    this.buildTerrain();
    this.buildOcean();
    this.buildMainPaths();
    this.buildSunKeys();
    this.buildSunAltarAndTemple();
  }

  private createBeaconBeam(color: number, height: number = 35): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(0.8, 2, height, 16, 1, true);
    geo.translate(0, height / 2, 0);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  private buildTerrain() {
    // Island Ground Mesh
    const geo = new THREE.PlaneGeometry(120, 120, 48, 48);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.groundHeightFunc(x, z));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Bright tropical green grass
      roughness: 0.6,
    });
    const island = new THREE.Mesh(geo, mat);
    island.receiveShadow = true;
    this.islandGroup.add(island);

    // Decorative Palm Trees
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 6, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x854d0e });
    const leavesGeo = new THREE.ConeGeometry(3.5, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });

    const treePositions: [number, number][] = [
      [-35, -10], [-30, 20], [35, -5], [30, 25],
      [-15, 30], [15, 30], [-40, 10], [40, 10],
      [-10, -10], [10, -10], [-20, 5], [20, 5]
    ];

    treePositions.forEach(([x, z]) => {
      const y = this.groundHeightFunc(x, z);
      const tree = new THREE.Group();
      tree.position.set(x, y, z);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3;
      tree.add(trunk);

      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.y = 7;
      tree.add(leaves);

      this.islandGroup.add(tree);
      this.obstacles.push(new THREE.Box3().setFromObject(trunk));
    });
  }

  private buildOcean() {
    const oceanGeo = new THREE.PlaneGeometry(300, 300, 16, 16);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Clear turquoise tropical ocean
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.2,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.y = -1;
    this.islandGroup.add(ocean);

    this.updateAnimators.push((_, time) => {
      ocean.position.y = -1 + Math.sin(time * 1.5) * 0.15;
    });
  }

  private buildMainPaths() {
    // Cobblestone Main Trail
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 }); // Golden sand path

    const pathPoints: [number, number, number, number][] = [
      [0, 0, 10, 40],     // South to Center path
      [0, -15, 8, 30],    // Center to Temple path
      [-15, -10, 25, 6],  // West Waterfall branch
      [15, -10, 25, 6],   // East Oak branch
    ];

    pathPoints.forEach(([x, z, w, d]) => {
      const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
      pathMesh.rotation.x = -Math.PI / 2;
      pathMesh.position.set(x, this.groundHeightFunc(x, z) + 0.05, z);
      this.islandGroup.add(pathMesh);
    });
  }

  private buildSunKeys() {
    const keyData: { id: KeyId; name: string; color: number; pos: [number, number, number] }[] = [
      { id: 'WATERFALL', name: 'Waterfall Sun Emblem', color: 0x00e5ff, pos: [-25, 5, -10] },
      { id: 'OAK', name: 'Ancient Oak Sun Emblem', color: 0x22c55e, pos: [25, 5, -10] },
      { id: 'LIGHTHOUSE', name: 'Lighthouse Sun Emblem', color: 0xfacc15, pos: [0, 3, 30] },
    ];

    keyData.forEach(({ id, name, color, pos }) => {
      const group = new THREE.Group();
      group.position.set(pos[0], pos[1], pos[2]);

      // Base pedestal
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
      );
      pedestal.position.y = 1;
      group.add(pedestal);
      this.obstacles.push(new THREE.Box3().setFromObject(pedestal));

      // Floating Sun Emblem Crystal
      const emblemGeo = new THREE.OctahedronGeometry(1.2);
      const emblemMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.0,
        roughness: 0.1,
      });
      const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
      emblemMesh.position.y = 3.5;
      group.add(emblemMesh);

      // Light Beacon
      const beacon = this.createBeaconBeam(color, 35);
      beacon.position.y = 2;
      group.add(beacon);

      this.islandGroup.add(group);
      this.keyGroups[id] = group;
      this.keyBeacons[id] = beacon;

      this.updateAnimators.push((_, time) => {
        if (!this.collectedKeys[id]) {
          emblemMesh.rotation.y = time * 2;
          emblemMesh.position.y = 3.5 + Math.sin(time * 3) * 0.25;
        }
      });
    });
  }

  private buildSunAltarAndTemple() {
    const templeGroup = new THREE.Group();
    templeGroup.position.set(0, 6, -30);

    // Temple Building Structure
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }); // White limestone marble
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    // Front Pillars
    [-8, -4, 4, 8].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 12, 12), wallMat);
      pillar.position.set(px, 6, 0);
      templeGroup.add(pillar);
      this.obstacles.push(new THREE.Box3().setFromObject(pillar));
    });

    // Roof Pediment
    const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 3, 10), goldMat);
    roof.position.set(0, 13.5, 0);
    templeGroup.add(roof);

    // Central Sun Altar (where player places keys)
    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.5, 2, 16),
      goldMat
    );
    altar.position.set(0, 1, 8);
    templeGroup.add(altar);
    this.obstacles.push(new THREE.Box3().setFromObject(altar));

    // Floating Golden Sun Orb on Altar
    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 2.5 })
    );
    sunOrb.position.set(0, 3.5, 8);
    templeGroup.add(sunOrb);

    // Temple Gate / Door (Blocks entrance until altar activated)
    this.templeDoor = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })
    );
    this.templeDoor.position.set(0, 5, -2);
    templeGroup.add(this.templeDoor);

    const doorBox = new THREE.Box3().setFromObject(this.templeDoor);
    this.obstacles.push(doorBox);
    this.doorObstacleIndex = this.obstacles.length - 1;

    // Inside Temple: Golden Dragon Mural
    const mural = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfacc15, emissiveIntensity: 2.0 })
    );
    mural.position.set(0, 5, -12);
    templeGroup.add(mural);

    this.templeLight = new THREE.PointLight(0xfacc15, 2, 25);
    this.templeLight.position.set(0, 6, -8);
    templeGroup.add(this.templeLight);

    this.islandGroup.add(templeGroup);

    this.updateAnimators.push((delta, time) => {
      sunOrb.rotation.y = time;

      // Animate door opening when solved
      if (this.puzzleSolved && this.templeDoor.position.y > -5) {
        this.templeDoor.position.y -= delta * 3;
        if (this.doorObstacleIndex >= 0 && this.obstacles[this.doorObstacleIndex]) {
          this.obstacles[this.doorObstacleIndex].makeEmpty();
        }
      }
    });
  }

  public getInteractionPrompt(playerPos: THREE.Vector3): string | null {
    if (this.phaseCompleted) return null;

    // 1. Key Pickups
    if (!this.collectedKeys.WATERFALL && playerPos.distanceTo(new THREE.Vector3(-25, 5, -10)) < 6) {
      return `COLLECT WATERFALL SUN EMBLEM (${this.keysCollected}/3) [E]`;
    }
    if (!this.collectedKeys.OAK && playerPos.distanceTo(new THREE.Vector3(25, 5, -10)) < 6) {
      return `COLLECT OAK SUN EMBLEM (${this.keysCollected}/3) [E]`;
    }
    if (!this.collectedKeys.LIGHTHOUSE && playerPos.distanceTo(new THREE.Vector3(0, 3, 30)) < 6) {
      return `COLLECT LIGHTHOUSE SUN EMBLEM (${this.keysCollected}/3) [E]`;
    }

    // 2. Sun Altar Activation
    if (!this.puzzleSolved && playerPos.distanceTo(new THREE.Vector3(0, 7, -22)) < 6) {
      if (this.keysCollected >= 3) {
        return 'ACTIVATE SUN ALTAR & UNLOCK TEMPLE [E]';
      } else {
        return `SUN ALTAR (REQUIRES 3 SUN EMBLEMS - CURRENT: ${this.keysCollected}/3) [E]`;
      }
    }

    // 3. Examine Dragon Mural Inside Temple
    if (this.caveOpened && !this.muralRevealed && playerPos.distanceTo(new THREE.Vector3(0, 7, -38)) < 6) {
      return 'EXAMINE GOLDEN DRAGON MURAL [E]';
    }

    return null;
  }

  public handleInteract(playerPos: THREE.Vector3): MysteryIslandInteractionResult {
    // 1. Collect Sun Keys
    const collectKey = (id: KeyId, name: string): MysteryIslandInteractionResult => {
      this.collectedKeys[id] = true;
      this.keysCollected += 1;

      // Update HUD compatibility state
      this.relicsCollected = this.keysCollected;
      this.collectedRelics.WATER = this.collectedKeys.WATERFALL;
      this.collectedRelics.FIRE = this.collectedKeys.OAK;
      this.collectedRelics.NATURE = this.collectedKeys.LIGHTHOUSE;

      if (this.keyGroups[id]) this.keyGroups[id].visible = false;
      if (this.keyBeacons[id]) this.keyBeacons[id].visible = false;

      sound.playPickup();

      if (this.keysCollected >= 3) {
        sound.playQuestFanfare();
        return {
          handled: true,
          message: '✨ ALL 3 SUN EMBLEMS COLLECTED! Head to the Sun Temple Altar at the North Plateau!',
          type: 'success',
          reward: { xp: 150, coins: 50, item: name, icon: 'Sun' }
        };
      }

      return {
        handled: true,
        message: `✨ Collected ${name} (${this.keysCollected}/3)! Find remaining emblems.`,
        type: 'info',
        reward: { xp: 50, coins: 25, item: name, icon: 'Sun' }
      };
    };

    if (!this.collectedKeys.WATERFALL && playerPos.distanceTo(new THREE.Vector3(-25, 5, -10)) < 6) return collectKey('WATERFALL', 'Waterfall Sun Emblem');
    if (!this.collectedKeys.OAK && playerPos.distanceTo(new THREE.Vector3(25, 5, -10)) < 6) return collectKey('OAK', 'Oak Sun Emblem');
    if (!this.collectedKeys.LIGHTHOUSE && playerPos.distanceTo(new THREE.Vector3(0, 3, 30)) < 6) return collectKey('LIGHTHOUSE', 'Lighthouse Sun Emblem');

    // 2. Activate Sun Altar
    if (!this.puzzleSolved && playerPos.distanceTo(new THREE.Vector3(0, 7, -22)) < 6) {
      if (this.keysCollected >= 3) {
        this.puzzleSolved = true;
        this.caveOpened = true; // Opens temple gate
        this.templeLight.intensity = 8;
        sound.playQuestFanfare();

        return {
          handled: true,
          message: '🌟 SUN TEMPLE UNLOCKED! The ancient temple doors slide open!',
          type: 'success',
          reward: { xp: 250, coins: 150, item: 'Sun Altar Key', icon: 'Key' }
        };
      } else {
        return {
          handled: true,
          message: `🔒 The Sun Altar needs 3 Sun Emblems! You currently have ${this.keysCollected}/3. Follow the light beacons!`,
          type: 'error'
        };
      }
    }

    // 3. Examine Final Dragon Mural
    if (this.caveOpened && !this.muralRevealed && playerPos.distanceTo(new THREE.Vector3(0, 7, -38)) < 6) {
      this.muralRevealed = true;
      this.phaseCompleted = true;
      sound.playQuestFanfare();

      return {
        handled: true,
        isPhaseComplete: true,
        message: '📜 DRAGON MURAL REVEALED: The noble dragon was corrupted by dark magic. You must save it!',
        type: 'success',
        reward: {
          xp: 400,
          coins: 250,
          item: 'Mystery Relic',
          icon: 'Gem'
        }
      };
    }

    return { handled: false };
  }

  public getCurrentTargetInfo(playerPos: THREE.Vector3): { name: string; position: [number, number, number] } | null {
    if (this.phaseCompleted) return null;

    if (!this.collectedKeys.WATERFALL) return { name: 'Waterfall Sun Emblem', position: [-25, 5, -10] };
    if (!this.collectedKeys.OAK) return { name: 'Oak Sun Emblem', position: [25, 5, -10] };
    if (!this.collectedKeys.LIGHTHOUSE) return { name: 'Lighthouse Sun Emblem', position: [0, 3, 30] };

    if (!this.puzzleSolved) {
      return { name: 'Sun Temple Altar', position: [0, 7, -22] };
    }

    if (this.caveOpened && !this.muralRevealed) {
      return { name: 'Golden Dragon Mural', position: [0, 7, -38] };
    }

    return null;
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
