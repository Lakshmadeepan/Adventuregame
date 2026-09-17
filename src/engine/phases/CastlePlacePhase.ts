import * as THREE from 'three';
import { WorldBuildResult } from '../WorldBuilder';
import { sound } from '../../audio/SoundManager';

export interface CastlePlaceInteractionResult {
  handled: boolean;
  message?: string;
  type?: 'success' | 'info' | 'error';
  isPhaseComplete?: boolean;
  muralStoryRevealed?: boolean;
  reward?: {
    xp: number;
    coins: number;
    item: string;
    icon: string;
  };
}

export class CastlePlacePhase {
  public scene: THREE.Scene;
  public obstacles: THREE.Box3[] = [];
  public groundHeightFunc: (x: number, z: number) => number;
  public updateAnimators: ((delta: number, time: number) => void)[] = [];

  // Puzzle & Interactive State
  public gearCollected = false;
  public heldGear = false;
  public gearPlaced = false;
  public gateLeverPulled = false;
  public gateOpen = false;

  // Knight & Bell Interactivity
  public knightShieldCollected = false;
  public knightShieldPlaced = false;
  public knightRotated = false;
  public bellRingCount = 0;
  public bellsRung = [false, false, false];
  public chestsOpened = [false, false];

  // Story & Completion
  public muralExamined = false;
  public phaseCompleted = false;

  // Meshes & Visual Groups
  private gearMesh: THREE.Mesh;
  private ghostGearMesh: THREE.Mesh;
  private portcullisMesh: THREE.Mesh;
  private portcullisObstacleIndex = -1;
  private muralMesh: THREE.Mesh;
  private muralLight: THREE.PointLight;
  private winchGroup: THREE.Group;
  private springboardMesh: THREE.Mesh;
  private knightStatues: THREE.Group[] = [];
  private bellMeshes: THREE.Group[] = [];
  private chestMeshes: THREE.Group[] = [];
  private shieldMesh: THREE.Mesh;
  private fireworksParticles: THREE.Points[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Deep Twilight Sky
    this.scene.fog = new THREE.FogExp2(0x1e293b, 0.018);

    // Castle Moon & Atmospheric Lighting
    const moonLight = new THREE.DirectionalLight(0xbfdbfe, 1.6);
    moonLight.position.set(-25, 45, 35);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    this.scene.add(moonLight);

    const ambLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.9);
    this.scene.add(ambLight);

    // Ground Height: Flat courtyard
    this.groundHeightFunc = () => 0;

    this.buildCastleCourtyard();
    this.buildInteractiveKnights();
    this.buildHeraldBells();
    this.buildTreasureChests();
    this.buildSpringboard();
    this.buildGearPuzzle();
    this.buildMuralChamber();
    this.buildRoyalBannersAndDecorations();
  }

  private buildCastleCourtyard() {
    // Flagstone Paved Ground
    const groundGeo = new THREE.PlaneGeometry(90, 90, 20, 20);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x2e3d30, roughness: 0.85 });

    // Outer Fortress Walls (North, West, East, South Gate Entrance)
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(80, 16, 3.5), stoneMat);
    wallN.position.set(0, 8, -38);
    this.scene.add(wallN);
    this.obstacles.push(new THREE.Box3().setFromObject(wallN));

    const wallW = new THREE.Mesh(new THREE.BoxGeometry(3.5, 16, 80), stoneMat);
    wallW.position.set(-38, 8, 0);
    this.scene.add(wallW);
    this.obstacles.push(new THREE.Box3().setFromObject(wallW));

    const wallE = new THREE.Mesh(new THREE.BoxGeometry(3.5, 16, 80), stoneMat);
    wallE.position.set(38, 8, 0);
    this.scene.add(wallE);
    this.obstacles.push(new THREE.Box3().setFromObject(wallE));

    // South Courtyard Wall with Walkway
    const wallSW = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 3.5), stoneMat);
    wallSW.position.set(-24, 7, 36);
    this.scene.add(wallSW);
    this.obstacles.push(new THREE.Box3().setFromObject(wallSW));

    const wallSE = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 3.5), stoneMat);
    wallSE.position.set(24, 7, 36);
    this.scene.add(wallSE);
    this.obstacles.push(new THREE.Box3().setFromObject(wallSE));

    // 4 Grand Watchtowers
    const towerGeo = new THREE.CylinderGeometry(4.5, 5, 22, 16);
    const roofGeo = new THREE.ConeGeometry(5.5, 6, 16);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.6 });

    [
      [-34, -34],
      [34, -34],
      [-34, 34],
      [34, 34],
    ].forEach(([tx, tz]) => {
      const tower = new THREE.Mesh(towerGeo, mossMat);
      tower.position.set(tx, 11, tz);
      tower.castShadow = true;
      this.scene.add(tower);
      this.obstacles.push(new THREE.Box3().setFromObject(tower));

      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(tx, 25, tz);
      this.scene.add(roof);
    });

    // Castle Inner Dividing Rampart Wall at z = -6 with center Portcullis Opening
    const innerWallLeft = new THREE.Mesh(new THREE.BoxGeometry(28, 14, 3.5), stoneMat);
    innerWallLeft.position.set(-20, 7, -6);
    this.scene.add(innerWallLeft);
    this.obstacles.push(new THREE.Box3().setFromObject(innerWallLeft));

    const innerWallRight = new THREE.Mesh(new THREE.BoxGeometry(28, 14, 3.5), stoneMat);
    innerWallRight.position.set(20, 7, -6);
    this.scene.add(innerWallRight);
    this.obstacles.push(new THREE.Box3().setFromObject(innerWallRight));

    // Gate Arch Overhead Beam
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 3.8), darkStoneMat);
    archTop.position.set(0, 12, -6);
    this.scene.add(archTop);

    // Movable Portcullis / Heavy Iron Gate at (0, 4.5, -6)
    const gateGeo = new THREE.BoxGeometry(10.5, 9, 0.8);
    const ironGateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.35,
    });
    this.portcullisMesh = new THREE.Mesh(gateGeo, ironGateMat);
    this.portcullisMesh.position.set(0, 4.5, -6);
    this.portcullisMesh.castShadow = true;
    this.scene.add(this.portcullisMesh);

    // Gate collision box
    const gateBox = new THREE.Box3().setFromObject(this.portcullisMesh);
    this.obstacles.push(gateBox);
    this.portcullisObstacleIndex = this.obstacles.length - 1;

    // Glowing Royal Torches & Braziers
    [
      [-7, 1.2, -4],
      [7, 1.2, -4],
      [-7, 1.2, -8],
      [7, 1.2, -8],
      [-16, 1.2, 14],
      [16, 1.2, 14],
      [-6, 1.2, -20],
      [6, 1.2, -20],
    ].forEach(([bx, by, bz], i) => {
      const brazier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.35, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      brazier.position.set(bx, by, bz);
      this.scene.add(brazier);

      const fireColor = i % 2 === 0 ? 0x38bdf8 : 0xf59e0b;
      const fireMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: fireColor })
      );
      fireMesh.position.set(bx, by + 0.9, bz);
      this.scene.add(fireMesh);

      const fireLight = new THREE.PointLight(fireColor, 2.2, 10);
      fireLight.position.set(bx, by + 1.1, bz);
      this.scene.add(fireLight);

      this.updateAnimators.push((_, time) => {
        fireLight.intensity = 2.0 + Math.sin(time * 6.0 + bx + i) * 0.5;
        fireMesh.scale.setScalar(1 + Math.sin(time * 8.0 + i) * 0.15);
      });
    });
  }

  private buildSpringboard() {
    // Fun Bounce Pad / Royal Catapult Trampoline in Courtyard at (0, 0, 18)
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.7 })
    );
    base.position.set(0, 0.2, 18);
    this.scene.add(base);

    const padMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });
    this.springboardMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 16), padMat);
    this.springboardMesh.position.set(0, 0.4, 18);
    this.scene.add(this.springboardMesh);

    // Glowing Ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.1, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ring.rotateX(Math.PI / 2);
    ring.position.set(0, 0.45, 18);
    this.scene.add(ring);

    this.updateAnimators.push((_, time) => {
      this.springboardMesh.position.y = 0.4 + Math.sin(time * 5) * 0.08;
      ring.scale.setScalar(1.0 + Math.sin(time * 4) * 0.05);
    });
  }

  private buildInteractiveKnights() {
    // 3 Knight Statues in the Courtyard
    const knightPositions: [number, number, number, number][] = [
      [-14, 0, 8, 0.4], // Knight 1: Left
      [14, 0, 8, -0.4], // Knight 2: Right (Missing Shield)
      [-14, 0, 22, 1.2], // Knight 3: South West
    ];

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.3,
    });

    knightPositions.forEach(([kx, ky, kz, rotY], idx) => {
      const knightGroup = new THREE.Group();
      knightGroup.position.set(kx, ky, kz);
      knightGroup.rotation.y = rotY;

      // Pedestal
      const ped = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      ped.position.y = 0.4;
      knightGroup.add(ped);

      // Body / Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.7), armorMat);
      torso.position.y = 1.9;
      knightGroup.add(torso);

      // Helmet
      const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.9, 12), armorMat);
      helmet.position.y = 2.9;
      knightGroup.add(helmet);

      // Golden Plume
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 8), goldTrimMat);
      plume.position.set(0, 3.4, 0);
      knightGroup.add(plume);

      // Sword
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.2), goldTrimMat);
      blade.position.set(0.6, 2.0, 0.4);
      knightGroup.add(blade);

      this.scene.add(knightGroup);
      this.obstacles.push(new THREE.Box3().setFromObject(ped).translate(new THREE.Vector3(kx, ky, kz)));
      this.knightStatues.push(knightGroup);
    });

    // Loose Royal Shield placed at (-22, 0, 26) on a weapons rack
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.8, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 })
    );
    rack.position.set(-22, 0.9, 26);
    this.scene.add(rack);
    this.obstacles.push(new THREE.Box3().setFromObject(rack));

    const shieldGeo = new THREE.BoxGeometry(0.8, 1.2, 0.15);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.3,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.set(-22, 1.8, 26);
    this.scene.add(this.shieldMesh);
  }

  private buildHeraldBells() {
    // 3 Herald Bells on the North Wall Arches at (-12, 6, -5), (0, 8, -5), (12, 6, -5)
    const bellGeo = new THREE.ConeGeometry(0.7, 1.2, 12);
    const bellMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });

    [
      [-12, 5.5, -4],
      [0, 8.5, -4],
      [12, 5.5, -4],
    ].forEach(([bx, by, bz], i) => {
      const bellGroup = new THREE.Group();
      bellGroup.position.set(bx, by, bz);

      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.rotation.x = Math.PI;
      bellGroup.add(bell);

      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xd97706 })
      );
      rope.position.y = -2.0;
      bellGroup.add(rope);

      this.scene.add(bellGroup);
      this.bellMeshes.push(bellGroup);

      this.updateAnimators.push((_, time) => {
        if (this.bellsRung[i]) {
          bellGroup.rotation.z = Math.sin(time * 12) * 0.25;
        }
      });
    });
  }

  private buildTreasureChests() {
    // 2 Royal Treasure Chests in Courtyard corners at (-28, 0, -20) and (28, 0, 20)
    [
      [-28, 0, -20],
      [28, 0, 20],
    ].forEach(([cx, cy, cz]) => {
      const chestGroup = new THREE.Group();
      chestGroup.position.set(cx, cy, cz);

      // Base
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.0, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
      );
      base.position.y = 0.5;
      chestGroup.add(base);

      // Gold Trim
      const goldTrim = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
      );
      goldTrim.position.y = 1.0;
      chestGroup.add(goldTrim);

      // Lid
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 1.6, 12, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
      );
      lid.rotateZ(Math.PI / 2);
      lid.position.set(0, 1.0, 0);
      chestGroup.add(lid);

      this.scene.add(chestGroup);
      this.obstacles.push(new THREE.Box3().setFromObject(base).translate(new THREE.Vector3(cx, cy, cz)));
      this.chestMeshes.push(chestGroup);
    });
  }

  private buildGearPuzzle() {
    // 1. Missing Stone Gear sitting on an armory anvil at (-18, 0, 12)
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
    );
    crate.position.set(-18, 0.8, 12);
    this.scene.add(crate);
    this.obstacles.push(new THREE.Box3().setFromObject(crate));

    const gearGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 14);
    const gearMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.3,
    });
    this.gearMesh = new THREE.Mesh(gearGeo, gearMat);
    this.gearMesh.rotateX(Math.PI / 2);
    this.gearMesh.position.set(-18, 1.9, 12);
    this.scene.add(this.gearMesh);

    // 2. The Winch Mechanism next to the gate at (7.5, 0, -5)
    this.winchGroup = new THREE.Group();
    this.winchGroup.position.set(7.5, 0, -5);

    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.6, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    stand.position.y = 1.3;
    this.winchGroup.add(stand);

    // Empty gear socket with pulsating holographic outline
    this.ghostGearMesh = new THREE.Mesh(
      gearGeo,
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.7 })
    );
    this.ghostGearMesh.rotateX(Math.PI / 2);
    this.ghostGearMesh.position.set(0, 1.7, 0.65);
    this.winchGroup.add(this.ghostGearMesh);

    // Winch Lever
    const leverHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    leverHandle.position.set(0.65, 2.1, 0);
    leverHandle.rotation.z = -0.5;
    this.winchGroup.add(leverHandle);

    this.scene.add(this.winchGroup);
    this.obstacles.push(new THREE.Box3().setFromObject(stand).translate(new THREE.Vector3(7.5, 0, -5)));
  }

  private buildMuralChamber() {
    // Mural Chamber behind the portcullis gate (z between -10 and -36)
    // Ancient Mural Frame at (0, 5, -30)
    const muralFrame = new THREE.Mesh(
      new THREE.BoxGeometry(12, 7.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.6, metalness: 0.4 })
    );
    muralFrame.position.set(0, 5.2, -30);
    this.scene.add(muralFrame);

    // Glowing Mural Relief
    const muralGeo = new THREE.PlaneGeometry(11, 6.6);
    const muralMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.5,
      roughness: 0.3,
    });
    this.muralMesh = new THREE.Mesh(muralGeo, muralMat);
    this.muralMesh.position.set(0, 5.2, -29.65);
    this.scene.add(this.muralMesh);

    this.muralLight = new THREE.PointLight(0xfbbf24, 4.0, 16);
    this.muralLight.position.set(0, 5.2, -27);
    this.scene.add(this.muralLight);

    // Ancient Dragon Crest Pedestal in front of the mural at (0, 0, -22)
    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7 })
    );
    altar.position.set(0, 0.6, -22);
    this.scene.add(altar);
    this.obstacles.push(new THREE.Box3().setFromObject(altar));

    // Dragon Crest Relic floating on altar
    const crestGeo = new THREE.TorusGeometry(0.7, 0.18, 12, 24);
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 2.2,
      metalness: 0.95,
    });
    const crestMesh = new THREE.Mesh(crestGeo, crestMat);
    crestMesh.position.set(0, 2.0, -22);
    this.scene.add(crestMesh);

    this.updateAnimators.push((_, time) => {
      crestMesh.rotation.y = time * 1.8;
      crestMesh.position.y = 2.0 + Math.sin(time * 2.5) * 0.15;
      this.muralLight.intensity = 3.5 + Math.sin(time * 3.5) * 0.8;
    });
  }

  private buildRoyalBannersAndDecorations() {
    // Royal Silk Banners on Courtyard Walls
    const bannerGeo = new THREE.PlaneGeometry(3, 8);
    const bannerMat = new THREE.MeshStandardMaterial({
      color: 0x4338ca,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    [
      [-10, 8, -5.8],
      [10, 8, -5.8],
      [-26, 8, -5.8],
      [26, 8, -5.8],
    ].forEach(([bx, by, bz]) => {
      const banner = new THREE.Mesh(bannerGeo, bannerMat);
      banner.position.set(bx, by, bz);
      this.scene.add(banner);
    });
  }

  public getInteractionPrompt(playerPos: THREE.Vector3): string | null {
    if (this.phaseCompleted) return null;

    // 1. Inspect Dragon Mural / Claim Dragon Crest
    if (this.gateOpen && playerPos.distanceTo(new THREE.Vector3(0, 1, -22)) < 4.0) {
      return 'UNVEIL SACRED DRAGON MURAL [E]';
    }

    // 2. Springboard
    if (playerPos.distanceTo(new THREE.Vector3(0, 0, 18)) < 2.5) {
      return 'BOUNCE ON ROYAL SPRINGBOARD [E]';
    }

    // 3. Knight Statue 2 (Shield placement)
    if (this.knightShieldCollected && !this.knightShieldPlaced && playerPos.distanceTo(new THREE.Vector3(14, 0, 8)) < 3.0) {
      return 'EQUIP KNIGHT WITH ROYAL SHIELD [E]';
    }

    // 4. Collect Royal Shield
    if (!this.knightShieldCollected && playerPos.distanceTo(new THREE.Vector3(-22, 1, 26)) < 2.8) {
      return 'TAKE ROYAL KNIGHT SHIELD [E]';
    }

    // 5. Knight Statue 1 / 3 Salute
    if (playerPos.distanceTo(new THREE.Vector3(-14, 0, 8)) < 2.8) {
      return 'SALUTE GUARDIAN KNIGHT [E]';
    }

    // 6. Ring Herald Bells
    for (let i = 0; i < 3; i++) {
      const bellPos = this.bellMeshes[i].position;
      if (playerPos.distanceTo(bellPos) < 4.0) {
        return `RING HERALDIC BELL #${i + 1} [E]`;
      }
    }

    // 7. Open Treasure Chests
    if (!this.chestsOpened[0] && playerPos.distanceTo(new THREE.Vector3(-28, 0, -20)) < 3.0) {
      return 'OPEN ROYAL TREASURE CHEST [E]';
    }
    if (!this.chestsOpened[1] && playerPos.distanceTo(new THREE.Vector3(28, 0, 20)) < 3.0) {
      return 'OPEN COURTYARD CHEST [E]';
    }

    // 8. Pick up Gear
    if (!this.gearCollected && !this.gearPlaced && playerPos.distanceTo(new THREE.Vector3(-18, 1, 12)) < 3.0) {
      return 'PICK UP GOLDEN GEAR [E]';
    }

    // 9. Place Gear in Winch
    if (this.heldGear && !this.gearPlaced && playerPos.distanceTo(new THREE.Vector3(7.5, 1, -5)) < 3.5) {
      return 'INSERT GEAR INTO GATE WINCH [E]';
    }

    // 10. Pull Winch Lever
    if (this.gearPlaced && !this.gateOpen && playerPos.distanceTo(new THREE.Vector3(7.5, 1, -5)) < 3.5) {
      return 'PULL WINCH LEVER TO OPEN GATE [E]';
    }

    return null;
  }

  public handleInteract(playerPos: THREE.Vector3): CastlePlaceInteractionResult {
    // 1. Inspect Mural & Claim Crest (Phase Complete)
    if (this.gateOpen && playerPos.distanceTo(new THREE.Vector3(0, 1, -22)) < 4.5) {
      this.phaseCompleted = true;
      this.muralExamined = true;
      sound.playQuestFanfare();
      return {
        handled: true,
        isPhaseComplete: true,
        muralStoryRevealed: true,
        message: '📜 MURAL DISCOVERED: The dragon was never an enemy — it was the kingdom’s beloved guardian!',
        type: 'success',
        reward: {
          xp: 350,
          coins: 200,
          item: 'Dragon Crest',
          icon: 'Shield',
        },
      };
    }

    // 2. Springboard Super Bounce
    if (playerPos.distanceTo(new THREE.Vector3(0, 0, 18)) < 2.8) {
      sound.playJump();
      sound.playFairyChime();
      return {
        handled: true,
        message: '🚀 BOOOING! The royal springboard launches you into the air with playful energy!',
        type: 'info',
      };
    }

    // 3. Take Royal Shield
    if (!this.knightShieldCollected && playerPos.distanceTo(new THREE.Vector3(-22, 1, 26)) < 3.0) {
      this.knightShieldCollected = true;
      this.shieldMesh.visible = false;
      sound.playPickup();
      return {
        handled: true,
        message: '🛡️ Picked up Royal Knight Shield! Bring it to the unequipped knight statue on the east side.',
        type: 'info',
      };
    }

    // 4. Equip Knight with Shield
    if (this.knightShieldCollected && !this.knightShieldPlaced && playerPos.distanceTo(new THREE.Vector3(14, 0, 8)) < 3.2) {
      this.knightShieldPlaced = true;
      // Attach shield to knight statue 2
      const knight2 = this.knightStatues[1];
      if (knight2) {
        const equippedShield = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.2, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 })
        );
        equippedShield.position.set(-0.6, 2.0, 0.2);
        knight2.add(equippedShield);
      }
      sound.playPlaceSuccess();
      return {
        handled: true,
        message: '✨ The knight statue stands proud with its shield, shining with royal blessing!',
        type: 'success',
      };
    }

    // 5. Salute Guardian Knight 1
    if (playerPos.distanceTo(new THREE.Vector3(-14, 0, 8)) < 3.0) {
      sound.playInteract();
      return {
        handled: true,
        message: '⚔️ Knight Valen whispers: "Honor and courage! The gate winch requires the golden gear from the armory."',
        type: 'info',
      };
    }

    // 6. Ring Herald Bells
    for (let i = 0; i < 3; i++) {
      const bellPos = this.bellMeshes[i].position;
      if (playerPos.distanceTo(bellPos) < 4.5) {
        this.bellsRung[i] = true;
        this.bellRingCount++;
        sound.playFairyChime();
        return {
          handled: true,
          message: `🔔 DING-DONG! Heraldic Bell #${i + 1} chimes across the castle ramparts!`,
          type: 'success',
        };
      }
    }

    // 7. Open Treasure Chest 1 (North West)
    if (!this.chestsOpened[0] && playerPos.distanceTo(new THREE.Vector3(-28, 0, -20)) < 3.2) {
      this.chestsOpened[0] = true;
      const lid = this.chestMeshes[0].children[2];
      if (lid) lid.rotation.x = -Math.PI / 3;
      sound.playPickup();
      sound.playCheer();
      return {
        handled: true,
        message: '💎 Unlocked Royal Treasure Chest! Obtained 50 Gold Coins and Ancient Gemstones!',
        type: 'success',
      };
    }

    // 8. Open Treasure Chest 2 (South East)
    if (!this.chestsOpened[1] && playerPos.distanceTo(new THREE.Vector3(28, 0, 20)) < 3.2) {
      this.chestsOpened[1] = true;
      const lid = this.chestMeshes[1].children[2];
      if (lid) lid.rotation.x = -Math.PI / 3;
      sound.playPickup();
      sound.playCheer();
      return {
        handled: true,
        message: '👑 Unlocked Courtyard Chest! Found 40 Gold Coins and a Royal Ruby!',
        type: 'success',
      };
    }

    // 9. Pick up Gear
    if (!this.gearCollected && !this.gearPlaced && playerPos.distanceTo(new THREE.Vector3(-18, 1, 12)) < 3.2) {
      this.gearCollected = true;
      this.heldGear = true;
      this.gearMesh.visible = false;
      sound.playPickup();
      return {
        handled: true,
        message: '⚙️ Picked up Golden Gear! Carry it to the winch stand beside the castle portcullis.',
        type: 'info',
      };
    }

    // 10. Place Gear in Winch
    if (this.heldGear && !this.gearPlaced && playerPos.distanceTo(new THREE.Vector3(7.5, 1, -5)) < 3.8) {
      this.heldGear = false;
      this.gearPlaced = true;
      this.ghostGearMesh.visible = false;

      // Fix gear in winch socket
      this.gearMesh.visible = true;
      this.gearMesh.position.set(7.5, 1.7, -4.35);
      sound.playPlaceSuccess();
      return {
        handled: true,
        message: '✓ Golden Gear locked into winch! Press [E] to pull the lever and raise the portcullis.',
        type: 'success',
      };
    }

    // 11. Pull Winch Lever
    if (this.gearPlaced && !this.gateOpen && playerPos.distanceTo(new THREE.Vector3(7.5, 1, -5)) < 3.8) {
      this.gateOpen = true;
      this.gateLeverPulled = true;

      // Raise Portcullis
      this.portcullisMesh.position.y = 12.0;
      if (this.portcullisObstacleIndex >= 0 && this.obstacles[this.portcullisObstacleIndex]) {
        this.obstacles[this.portcullisObstacleIndex].makeEmpty();
      }

      // Rotate lever
      const lever = this.winchGroup.children[2];
      if (lever) lever.rotation.z = 0.5;

      sound.playQuestFanfare();
      return {
        handled: true,
        message: '🏰 PORTCULLIS RAISED! Enter the inner sanctum to unveil the Dragon Mural!',
        type: 'success',
      };
    }

    return { handled: false };
  }

  public updateHeldPosition(playerPos: THREE.Vector3, playerRotY: number) {
    if (this.heldGear) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
      this.gearMesh.position.copy(playerPos).add(forward.multiplyScalar(1.2)).add(new THREE.Vector3(0, 1.0, 0));
      this.gearMesh.visible = true;
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
