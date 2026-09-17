import * as THREE from 'three';
import { WorldBuildResult } from '../WorldBuilder';
import { sound } from '../../audio/SoundManager';
import { PlayerData } from '../../types';

export interface Phase5InteractionResult {
  handled: boolean;
  message?: string;
  type?: 'success' | 'info' | 'error';
  isFairyGardenComplete?: boolean;
  isGameComplete?: boolean;
  reward?: {
    xp: number;
    coins: number;
    item: string;
    icon: string;
  };
}

export class FairyGardenAndDragonValleyPhase {
  public scene: THREE.Scene;
  public obstacles: THREE.Box3[] = [];
  public groundHeightFunc: (x: number, z: number) => number;
  public updateAnimators: ((delta: number, time: number) => void)[] = [];

  // Stage state: 'FAIRY_GARDEN' or 'DRAGON_VALLEY'
  public subPhase: 'FAIRY_GARDEN' | 'DRAGON_VALLEY' = 'FAIRY_GARDEN';

  // Fairy Garden States
  public fountainRestored = false;
  public pathCleared = false;
  public seedsCollected = 0;
  public seedsPlanted = false;
  public treeActivated = false;
  public guardianBlossomObtained = false;

  // Dragon Valley States
  public tower1Active = false; // Fire Pillar
  public tower2Active = false; // Ice Pillar
  public tower3Active = false; // Nature Pillar
  public altarPurified = false; // Guardian Altar
  public corruptionStoneRemoved = false;
  public dragonPurified = false;
  public gameComplete = false;

  // Meshes & Lighting
  private fountainCoreMesh: THREE.Mesh;
  private fountainWaterMesh: THREE.Mesh;
  private fairySeeds: { mesh: THREE.Mesh; collected: boolean; pos: THREE.Vector3 }[] = [];
  private gardenBedMesh: THREE.Mesh;
  private blossomItemMesh: THREE.Mesh;
  private dragonGroup: THREE.Group;
  private dragonMat: THREE.MeshStandardMaterial;
  private corruptionStoneMesh: THREE.Mesh;
  private valleySkyLight: THREE.DirectionalLight;
  private valleyAmbLight: THREE.HemisphereLight;
  private towerBeams: THREE.Mesh[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.buildFairyGardenScene();
  }

  // ========================================================
  // 1. FAIRY GARDEN SCENE
  // ========================================================
  public buildFairyGardenScene() {
    this.subPhase = 'FAIRY_GARDEN';
    this.scene.clear();
    this.obstacles = [];
    this.updateAnimators = [];

    this.scene.background = new THREE.Color(0xdbeafe); // Soft daylight fairy pastel sky
    this.scene.fog = new THREE.FogExp2(0xf0fdf4, 0.015);

    // Warm Sun & Fairy Glow
    const sun = new THREE.DirectionalLight(0xfef08a, 1.8);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x86efac, 0xdbeafe, 1.0);
    this.scene.add(hemi);

    // Ground: lush vibrant grass
    this.groundHeightFunc = (x: number, z: number) => {
      return Math.sin(x * 0.15) * 0.3 + Math.cos(z * 0.15) * 0.3;
    };

    const groundGeo = new THREE.PlaneGeometry(80, 80, 25, 25);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.7,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 1. Fairy Fountain at (0, 0, 0)
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(4.0, 4.5, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
    );
    fountainBase.position.set(0, 0.6, 0);
    this.scene.add(fountainBase);
    this.obstacles.push(new THREE.Box3().setFromObject(fountainBase));

    this.fountainCoreMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 })
    );
    this.fountainCoreMesh.position.set(0, 2.5, 0);
    this.scene.add(this.fountainCoreMesh);

    this.fountainWaterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.1 })
    );
    this.fountainWaterMesh.position.set(0, 1.0, 0);
    this.scene.add(this.fountainWaterMesh);

    // 2. Grand Healing Tree at (0, 0, -20)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(0, 0, -20);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 3.2, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    trunk.position.y = 5;
    treeGroup.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(6, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.2, roughness: 0.4 })
    );
    foliage.position.y = 12;
    treeGroup.add(foliage);

    // Floating Guardian Blossom Item beneath tree
    this.blossomItemMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.MeshStandardMaterial({ color: 0xfb7185, emissive: 0xf43f5e, emissiveIntensity: 2.5 })
    );
    this.blossomItemMesh.position.set(0, 2.8, -16);
    this.scene.add(this.blossomItemMesh);

    this.scene.add(treeGroup);
    this.obstacles.push(new THREE.Box3().setFromObject(trunk).translate(new THREE.Vector3(0, 0, -20)));

    // 3. Fairy Seeds Scatter
    const seedPositions: [number, number, number][] = [
      [-15, 0.5, 10],
      [15, 0.5, 10],
      [-12, 0.5, -8],
    ];

    this.fairySeeds = seedPositions.map((pos) => {
      const sMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfacc15,
          emissiveIntensity: 2.2,
        })
      );
      sMesh.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(sMesh);

      const sLight = new THREE.PointLight(0xfacc15, 1.5, 5);
      sLight.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(sLight);

      return { mesh: sMesh, collected: false, pos: new THREE.Vector3(...pos) };
    });

    // 4. Planting Bed at (8, 0, -10)
    const bedGeo = new THREE.BoxGeometry(4, 0.4, 4);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.9 });
    this.gardenBedMesh = new THREE.Mesh(bedGeo, bedMat);
    this.gardenBedMesh.position.set(8, 0.2, -10);
    this.scene.add(this.gardenBedMesh);

    this.updateAnimators.push((_, time) => {
      if (this.blossomItemMesh) {
        this.blossomItemMesh.rotation.y = time * 1.5;
        this.blossomItemMesh.position.y = 2.8 + Math.sin(time * 2.0) * 0.15;
      }
      this.fairySeeds.forEach((s) => {
        if (!s.collected) {
          s.mesh.position.y = 0.5 + Math.sin(time * 3.0) * 0.1;
        }
      });
    });
  }

  // ========================================================
  // 2. REDESIGNED DRAGON VALLEY SCENE (Epic Final Sanctuary)
  // ========================================================
  public buildDragonValleyScene() {
    this.subPhase = 'DRAGON_VALLEY';
    this.scene.clear();
    this.obstacles = [];
    this.updateAnimators = [];
    this.towerBeams = [];

    // Dark dramatic cosmic sky
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x1e1b4b, 0.015);

    this.valleySkyLight = new THREE.DirectionalLight(0xc084fc, 2.0);
    this.valleySkyLight.position.set(20, 50, 10);
    this.scene.add(this.valleySkyLight);

    this.valleyAmbLight = new THREE.HemisphereLight(0x818cf8, 0x0f172a, 1.2);
    this.scene.add(this.valleyAmbLight);

    // Volcanic Stone Ground
    this.groundHeightFunc = (x: number, z: number) => {
      return Math.sin(x * 0.1) * 0.4 + Math.cos(z * 0.1) * 0.4;
    };

    const groundGeo = new THREE.PlaneGeometry(90, 90, 30, 30);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark basalt stone
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Glowing Lava / Magic Streams on ground
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 1.5 });
    const lavaPath = new THREE.Mesh(new THREE.PlaneGeometry(8, 50), pathMat);
    lavaPath.rotation.x = -Math.PI / 2;
    lavaPath.position.set(0, 0.05, -5);
    this.scene.add(lavaPath);

    // 3 High Light Towers
    const towersData = [
      { x: -20, z: -5, col: 0xef4444, name: 'Fire Pillar' },
      { x: 20, z: -5, col: 0x38bdf8, name: 'Ice Pillar' },
      { x: 0, z: 15, col: 0x22c55e, name: 'Nature Pillar' },
    ];

    towersData.forEach((t) => {
      const tower = new THREE.Group();
      tower.position.set(t.x, 0, t.z);

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 2.5, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
      );
      pillar.position.y = 6;
      tower.add(pillar);

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshStandardMaterial({
          color: t.col,
          emissive: t.col,
          emissiveIntensity: 2.0,
        })
      );
      orb.position.y = 13.5;
      tower.add(orb);

      // Sky Beam
      const beamGeo = new THREE.CylinderGeometry(0.8, 1.5, 45, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: t.col,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 35;
      tower.add(beam);
      this.towerBeams.push(beam);

      this.scene.add(tower);
      this.obstacles.push(new THREE.Box3().setFromObject(pillar).translate(new THREE.Vector3(t.x, 0, t.z)));

      this.updateAnimators.push((_, time) => {
        orb.position.y = 13.5 + Math.sin(time * 3) * 0.3;
      });
    });

    // Central Dragon Altar at (0, 0, -8)
    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4.0, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
    );
    altar.position.set(0, 0.75, -8);
    this.scene.add(altar);
    this.obstacles.push(new THREE.Box3().setFromObject(altar));

    // THE MAJESTIC DRAGON at (0, 0, -25)
    this.dragonGroup = new THREE.Group();
    this.dragonGroup.position.set(0, 0, -25);

    this.dragonMat = new THREE.MeshStandardMaterial({
      color: 0x581c87, // Corrupted deep purple
      emissive: 0x3b0764,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.5,
    });

    // Dragon Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 4.0, 8, 12), this.dragonMat);
    body.position.y = 6;
    body.rotation.x = 0.2;
    this.dragonGroup.add(body);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.2, 6, 12), this.dragonMat);
    neck.position.set(0, 11, 2.0);
    neck.rotation.x = -0.3;
    this.dragonGroup.add(neck);

    const head = new THREE.Mesh(new THREE.ConeGeometry(2.0, 4.5, 8), this.dragonMat);
    head.position.set(0, 13.5, 3.8);
    head.rotation.x = -Math.PI / 2 + 0.2;
    this.dragonGroup.add(head);

    // Glowing Cyan Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), eyeMat);
    eyeL.position.set(-0.9, 14.0, 4.0);
    this.dragonGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), eyeMat);
    eyeR.position.set(0.9, 14.0, 4.0);
    this.dragonGroup.add(eyeR);

    // Wings
    const wingGeo = new THREE.BoxGeometry(12, 0.5, 5);
    const wingL = new THREE.Mesh(wingGeo, this.dragonMat);
    wingL.position.set(-7.5, 8.0, -1.0);
    wingL.rotation.z = 0.35;
    this.dragonGroup.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, this.dragonMat);
    wingR.position.set(7.5, 8.0, -1.0);
    wingR.rotation.z = -0.35;
    this.dragonGroup.add(wingR);

    // Corruption Crystal embedded in chest
    const stoneGeo = new THREE.OctahedronGeometry(1.4, 2);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 3.0,
    });
    this.corruptionStoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
    this.corruptionStoneMesh.position.set(0, 6.0, 3.5);
    this.dragonGroup.add(this.corruptionStoneMesh);

    const stoneLight = new THREE.PointLight(0xa855f7, 4, 12);
    stoneLight.position.set(0, 6.0, 3.5);
    this.dragonGroup.add(stoneLight);

    this.scene.add(this.dragonGroup);
    this.obstacles.push(new THREE.Box3().setFromObject(body).translate(new THREE.Vector3(0, 0, -25)));

    this.updateAnimators.push((_, time) => {
      body.scale.y = 1 + Math.sin(time * 1.5) * 0.04;
      wingL.rotation.z = 0.35 + Math.sin(time * 1.8) * 0.08;
      wingR.rotation.z = -0.35 - Math.sin(time * 1.8) * 0.08;

      if (!this.corruptionStoneRemoved) {
        this.corruptionStoneMesh.rotation.y = time * 2.5;
        stoneLight.intensity = 4.0 + Math.sin(time * 6.0) * 1.5;
      }
    });
  }

  // ========================================================
  // PURIFY DRAGON (Grand Transformation)
  // ========================================================
  public purifyDragon() {
    this.corruptionStoneRemoved = true;
    this.dragonPurified = true;
    this.corruptionStoneMesh.visible = false;

    // Transform Dragon to Majestic Celestial Gold
    this.dragonMat.color.setHex(0xfacc15);
    this.dragonMat.emissive.setHex(0xeab308);
    this.dragonMat.emissiveIntensity = 2.5;

    // Restore Sky to Radiant Golden Sunrise
    this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
    this.scene.fog = new THREE.FogExp2(0xe0f2fe, 0.008);
    this.valleySkyLight.color.setHex(0xfffbeb);
    this.valleyAmbLight.color.setHex(0x38bdf8);
    this.valleyAmbLight.groundColor.setHex(0x22c55e);

    // Pillars shoot golden light
    this.towerBeams.forEach((b) => {
      (b.material as THREE.MeshBasicMaterial).color.setHex(0xfacc15);
      (b.material as THREE.MeshBasicMaterial).opacity = 0.9;
    });

    sound.playQuestFanfare();
  }

  // ========================================================
  // INTERACTION PROMPTS
  // ========================================================
  public getInteractionPrompt(playerPos: THREE.Vector3, _playerData?: PlayerData): string | null {
    if (this.gameComplete) return null;

    // FAIRY GARDEN PROMPTS
    if (this.subPhase === 'FAIRY_GARDEN') {
      if (!this.fountainRestored && playerPos.distanceTo(new THREE.Vector3(0, 0.5, 0)) < 4.0) {
        return 'RESTORE FAIRY FOUNTAIN [E]';
      }

      for (let i = 0; i < this.fairySeeds.length; i++) {
        if (!this.fairySeeds[i].collected && playerPos.distanceTo(this.fairySeeds[i].pos) < 3.0) {
          return `COLLECT FAIRY SEED (${this.seedsCollected}/3) [E]`;
        }
      }

      if (this.seedsCollected >= 3 && !this.seedsPlanted && playerPos.distanceTo(new THREE.Vector3(8, 0, -10)) < 3.5) {
        return 'PLANT FAIRY SEEDS IN GARDEN BED [E]';
      }

      if (this.seedsPlanted && !this.guardianBlossomObtained && playerPos.distanceTo(new THREE.Vector3(0, 0, -20)) < 4.5) {
        return 'COMMUNE WITH HEALING TREE & CLAIM BLOSSOM [E]';
      }

      return null;
    }

    // DRAGON VALLEY PROMPTS
    if (this.subPhase === 'DRAGON_VALLEY') {
      // Fire Pillar
      if (!this.tower1Active && playerPos.distanceTo(new THREE.Vector3(-20, 0, -5)) < 4.0) {
        return 'ACTIVATE FIRE PILLAR [1/3] [E]';
      }

      // Ice Pillar
      if (!this.tower2Active && playerPos.distanceTo(new THREE.Vector3(20, 0, -5)) < 4.0) {
        return 'ACTIVATE ICE PILLAR [2/3] [E]';
      }

      // Nature Pillar
      if (!this.tower3Active && playerPos.distanceTo(new THREE.Vector3(0, 0, 15)) < 4.0) {
        return 'ACTIVATE NATURE PILLAR [3/3] [E]';
      }

      // Central Dragon Altar
      if (
        this.tower1Active &&
        this.tower2Active &&
        this.tower3Active &&
        !this.altarPurified &&
        playerPos.distanceTo(new THREE.Vector3(0, 1, -8)) < 4.0
      ) {
        return 'PLACE GUARDIAN BLOSSOM AT ALTAR [E]';
      }

      // Dragon Corruption Stone
      if (this.altarPurified && !this.corruptionStoneRemoved && playerPos.distanceTo(new THREE.Vector3(0, 2, -22)) < 6.0) {
        return 'REMOVE CORRUPTION CRYSTAL & PURIFY DRAGON! [E]';
      }

      return null;
    }

    return null;
  }

  // ========================================================
  // INTERACTION HANDLER
  // ========================================================
  public handleInteract(playerPos: THREE.Vector3): Phase5InteractionResult {
    // ----------------------------------------------------
    // FAIRY GARDEN LOGIC
    // ----------------------------------------------------
    if (this.subPhase === 'FAIRY_GARDEN') {
      if (!this.fountainRestored && playerPos.distanceTo(new THREE.Vector3(0, 0.5, 0)) < 4.0) {
        this.fountainRestored = true;
        this.fountainCoreMesh.scale.set(1.4, 1.4, 1.4);
        (this.fountainWaterMesh.material as THREE.MeshStandardMaterial).opacity = 0.95;
        sound.playPlaceSuccess();
        return {
          handled: true,
          message: '🌸 Fairy Fountain restored! Pure celestial water now nourishes the garden.',
          type: 'success',
        };
      }

      for (const s of this.fairySeeds) {
        if (!s.collected && playerPos.distanceTo(s.pos) < 3.0) {
          s.collected = true;
          s.mesh.visible = false;
          this.seedsCollected++;
          sound.playPickup();

          if (this.seedsCollected === 3) {
            return {
              handled: true,
              message: '✨ All 3 Fairy Seeds gathered! Plant them in the garden bed.',
              type: 'success',
            };
          }
          return {
            handled: true,
            message: `🌱 Fairy Seed collected (${this.seedsCollected}/3)`,
            type: 'info',
          };
        }
      }

      if (this.seedsCollected >= 3 && !this.seedsPlanted && playerPos.distanceTo(new THREE.Vector3(8, 0, -10)) < 3.5) {
        this.seedsPlanted = true;
        sound.playPlaceSuccess();
        return {
          handled: true,
          message: '🌺 Seeds planted! Vibrant blossoms flourish, awakening the Grand Healing Tree.',
          type: 'success',
        };
      }

      if (this.seedsPlanted && !this.guardianBlossomObtained && playerPos.distanceTo(new THREE.Vector3(0, 0, -20)) < 4.5) {
        this.guardianBlossomObtained = true;
        if (this.blossomItemMesh) this.blossomItemMesh.visible = false;
        sound.playQuestFanfare();
        return {
          handled: true,
          isFairyGardenComplete: true,
          message: '🌷 GUARDIAN BLOSSOM RECEIVED! Enter the Portal to Dragon Valley!',
          type: 'success',
          reward: {
            xp: 500,
            coins: 300,
            item: 'Guardian Blossom',
            icon: 'Heart',
          },
        };
      }

      return { handled: false };
    }

    // ----------------------------------------------------
    // DRAGON VALLEY LOGIC
    // ----------------------------------------------------
    if (this.subPhase === 'DRAGON_VALLEY') {
      // Fire Pillar
      if (!this.tower1Active && playerPos.distanceTo(new THREE.Vector3(-20, 0, -5)) < 4.0) {
        this.tower1Active = true;
        if (this.towerBeams[0]) (this.towerBeams[0].material as THREE.MeshBasicMaterial).opacity = 0.9;
        sound.playPlaceSuccess();
        return {
          handled: true,
          message: '🔥 Fire Pillar Empowered! (1/3 Pillars Active)',
          type: 'success',
        };
      }

      // Ice Pillar
      if (!this.tower2Active && playerPos.distanceTo(new THREE.Vector3(20, 0, -5)) < 4.0) {
        this.tower2Active = true;
        if (this.towerBeams[1]) (this.towerBeams[1].material as THREE.MeshBasicMaterial).opacity = 0.9;
        sound.playPlaceSuccess();
        return {
          handled: true,
          message: '❄️ Ice Pillar Empowered! (2/3 Pillars Active)',
          type: 'success',
        };
      }

      // Nature Pillar
      if (!this.tower3Active && playerPos.distanceTo(new THREE.Vector3(0, 0, 15)) < 4.0) {
        this.tower3Active = true;
        if (this.towerBeams[2]) (this.towerBeams[2].material as THREE.MeshBasicMaterial).opacity = 0.9;
        sound.playPlaceSuccess();
        return {
          handled: true,
          message: '🌿 Nature Pillar Empowered! (3/3 Pillars Active)',
          type: 'success',
        };
      }

      // Central Altar
      if (
        this.tower1Active &&
        this.tower2Active &&
        this.tower3Active &&
        !this.altarPurified &&
        playerPos.distanceTo(new THREE.Vector3(0, 1, -8)) < 4.0
      ) {
        this.altarPurified = true;
        sound.playQuestFanfare();
        return {
          handled: true,
          message: '🌸 Guardian Altar Activated! Approach the Dragon to remove the corruption crystal!',
          type: 'success',
        };
      }

      // Remove Corruption Crystal
      if (this.altarPurified && !this.corruptionStoneRemoved && playerPos.distanceTo(new THREE.Vector3(0, 2, -22)) < 6.0) {
        this.purifyDragon();
        this.gameComplete = true;
        return {
          handled: true,
          isGameComplete: true,
          message: '🏆 THE ANCIENT DRAGON IS SAVED! You have restored peace to the entire realm!',
          type: 'success',
          reward: {
            xp: 1000,
            coins: 500,
            item: 'Golden Dragon Heart',
            icon: 'Trophy',
          },
        };
      }
    }

    return { handled: false };
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
