import * as THREE from 'three';
import { RainbowBridgePhase } from './phases/RainbowBridgePhase';
import { CastlePlacePhase } from './phases/CastlePlacePhase';
import { MysteryIslandPhase } from './phases/MysteryIslandPhase';
import { FairyGardenAndDragonValleyPhase } from './phases/FairyGardenAndDragonValleyPhase';

export interface WorldBuildResult {
  scene: THREE.Scene;
  obstacles: THREE.Box3[];
  groundHeightFunc: (x: number, z: number) => number;
  guardianMesh?: THREE.Group;
  guardianPosition?: THREE.Vector3;
  updateAnimators: ((delta: number, time: number) => void)[];
}

export class WorldBuilder {
  // Shared materials for memory efficiency & performance
  private static stoneMat = new THREE.MeshStandardMaterial({
    color: 0x475549, // Weathered ancient jungle stone
    roughness: 0.85,
    metalness: 0.1,
  });

  private static darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x2e3b32,
    roughness: 0.9,
  });

  private static mossStoneMat = new THREE.MeshStandardMaterial({
    color: 0x3b5838, // Moss-coated ancient stone
    roughness: 0.88,
  });

  private static woodTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x3d2716, // Rich jungle bark
    roughness: 0.92,
  });

  private static leafMatDark = new THREE.MeshStandardMaterial({
    color: 0x163820, // Deep canopy green
    roughness: 0.75,
  });

  private static leafMatMedium = new THREE.MeshStandardMaterial({
    color: 0x255d32, // Lush tropical leaf green
    roughness: 0.7,
  });

  private static leafMatBright = new THREE.MeshStandardMaterial({
    color: 0x3c7e3f, // Fresh sunlit jungle foliage
    roughness: 0.65,
  });

  private static vineMat = new THREE.MeshStandardMaterial({
    color: 0x2a4f26,
    roughness: 0.8,
  });

  private static crystalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.1,
  });

  private static runeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x00d4ff,
    emissiveIntensity: 2.6,
    roughness: 0.2,
  });

  private static flameMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
  });

  /**
   * Builds the Grand Gate environment in a lush, magical jungle
   */
  public static buildGrandGate(): WorldBuildResult {
    const scene = new THREE.Scene();
    
    // Cinematic daytime jungle atmosphere
    scene.background = new THREE.Color(0x274d39);
    scene.fog = new THREE.FogExp2(0x274d39, 0.018); // Soft sunlit jungle mist

    const obstacles: THREE.Box3[] = [];
    const updateAnimators: ((delta: number, time: number) => void)[] = [];

    // 1. LIGHTING
    // Ambient fill - lush green jungle bounce
    const ambientLight = new THREE.AmbientLight(0x2d523b, 1.4);
    scene.add(ambientLight);

    // Hemisphere light (sky canopy down, mossy ground up)
    const hemiLight = new THREE.HemisphereLight(0xc6f6d5, 0x1c381f, 1.2);
    scene.add(hemiLight);

    // Warm tropical sunlight filtering down through canopy
    const sunLight = new THREE.DirectionalLight(0xfff1c2, 2.3);
    sunLight.position.set(24, 45, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 110;
    sunLight.shadow.bias = -0.0004;
    const d = 32;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Soft secondary fill light
    const fillLight = new THREE.DirectionalLight(0x407c57, 0.6);
    fillLight.position.set(-20, 25, -15);
    scene.add(fillLight);

    // 2. SCULPTED TERRAIN
    const groundHeightFunc = (x: number, z: number) => {
      // Natural boundary mountain slopes
      const distBorderX = Math.abs(x);
      const distBorderZ = Math.abs(z);
      if (distBorderX > 22 || z > 20 || z < -24) {
        const borderDist = Math.max(
          Math.max(0, distBorderX - 20),
          Math.max(0, z - 18),
          Math.max(0, -22 - z)
        );
        return borderDist * 2.0;
      }
      // Gentle natural undulating jungle knolls
      return (
        Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.45 +
        Math.sin(x * 0.06 + 1.2) * 0.3
      );
    };

    const terrain = WorldBuilder.createJungleGround(85, 85, 45, groundHeightFunc, 0x1e3a24);
    scene.add(terrain);

    // 3. ANCIENT MOSSY FLAGSTONE PATHWAY LEADING TO GATE
    const pathGroup = new THREE.Group();
    for (let pz = 18; pz >= -14; pz -= 1.8) {
      const pWidth = 4.8 + Math.sin(pz * 0.4) * 0.4;
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(pWidth, 0.18, 1.6),
        Math.random() > 0.4 ? WorldBuilder.stoneMat : WorldBuilder.mossStoneMat
      );
      const py = groundHeightFunc(0, pz) + 0.08;
      stepMesh.position.set((Math.random() - 0.5) * 0.2, py, pz);
      stepMesh.rotation.y = (Math.random() - 0.5) * 0.05;
      stepMesh.receiveShadow = true;
      pathGroup.add(stepMesh);
    }
    scene.add(pathGroup);

    // 4. THE GRAND GATE (Monumental Ancient Jungle Portal at z = -16)
    const gateZ = -16;
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, gateZ);

    // Stepped Monumental Foundation Platform
    const baseGeo = new THREE.BoxGeometry(22, 1.4, 7);
    const gateBase = new THREE.Mesh(baseGeo, WorldBuilder.darkStoneMat);
    gateBase.position.set(0, 0.7, 0);
    gateBase.castShadow = true;
    gateBase.receiveShadow = true;
    gateGroup.add(gateBase);

    // Giant Stepped Pylons / Towers (Left & Right)
    [-7.5, 7.5].forEach((px) => {
      // Pylon Lower Tier
      const lowerPylon = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 11, 4.2),
        WorldBuilder.stoneMat
      );
      lowerPylon.position.set(px, 6.2, 0);
      lowerPylon.castShadow = true;
      lowerPylon.receiveShadow = true;
      gateGroup.add(lowerPylon);

      // Pylon Upper Tier with Carved Capital
      const upperPylon = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 9, 3.6),
        WorldBuilder.stoneMat
      );
      upperPylon.position.set(px, 15.5, 0);
      upperPylon.castShadow = true;
      gateGroup.add(upperPylon);

      // Pylon Spire Crown
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(2.4, 4.5, 4),
        WorldBuilder.darkStoneMat
      );
      spire.position.set(px, 21.5, 0);
      spire.rotation.y = Math.PI / 4;
      spire.castShadow = true;
      gateGroup.add(spire);

      // Glowing Vertical Runic Channels
      const runeStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 14, 0.2),
        WorldBuilder.runeMat
      );
      runeStrip.position.set(px, 10, 2.15);
      gateGroup.add(runeStrip);

      // Hanging Jungle Vines draped over the Pylons
      WorldBuilder.addDrapingVines(gateGroup, px, 18, 2.0, 5);
      WorldBuilder.addDrapingVines(gateGroup, px + (px > 0 ? -1.8 : 1.8), 12, 1.8, 4);

      // Colliders for pylons
      const pylonBox = new THREE.Box3();
      pylonBox.setFromCenterAndSize(
        new THREE.Vector3(px, 8, gateZ),
        new THREE.Vector3(4.5, 18, 4.5)
      );
      obstacles.push(pylonBox);
    });

    // Massive Carved Stone Archway & Arch Lintel
    const archLintel = new THREE.Mesh(
      new THREE.BoxGeometry(19, 3.2, 4.4),
      WorldBuilder.stoneMat
    );
    archLintel.position.set(0, 18.5, 0);
    archLintel.castShadow = true;
    gateGroup.add(archLintel);

    // Ancient Sun Medallion / Celestial Keystones in center of Arch
    const sunMedallion = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.6, 16),
      WorldBuilder.darkStoneMat
    );
    sunMedallion.rotateX(Math.PI / 2);
    sunMedallion.position.set(0, 18.5, 2.3);
    gateGroup.add(sunMedallion);

    const sunCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 1),
      WorldBuilder.runeMat
    );
    sunCore.position.set(0, 18.5, 2.6);
    gateGroup.add(sunCore);

    // Creeping Vines hanging down from the archway
    for (let vx = -4.5; vx <= 4.5; vx += 1.8) {
      WorldBuilder.addDrapingVines(gateGroup, vx, 17, 2.1, 3 + Math.floor(Math.abs(vx)));
    }

    // Mystical Portal Energy Shimmer
    const portalGeo = new THREE.PlaneGeometry(10.5, 16.5);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, 9.6, 0);
    gateGroup.add(portal);

    // Glowing Runic Rings orbiting inside portal
    const runeRingGeo = new THREE.TorusGeometry(3.5, 0.12, 8, 32);
    const runeRing = new THREE.Mesh(runeRingGeo, WorldBuilder.runeMat);
    runeRing.position.set(0, 9.6, 0.1);
    gateGroup.add(runeRing);

    const runeRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.1, 8, 24),
      WorldBuilder.runeMat
    );
    runeRing2.position.set(0, 9.6, 0.15);
    gateGroup.add(runeRing2);

    // Grand Gate Point Light (mystical cyan bloom)
    const gateGlowLight = new THREE.PointLight(0x00e5ff, 3.2, 24);
    gateGlowLight.position.set(0, 9.6, 1.5);
    gateGroup.add(gateGlowLight);

    // Flanking Giant Ancient Statues
    // Left Statue: Intact ancient stone beast guardian
    const leftStatue = WorldBuilder.createGuardianStatue(false);
    leftStatue.position.set(-11.5, 1.4, 2);
    leftStatue.rotation.y = Math.PI * 0.25;
    gateGroup.add(leftStatue);
    obstacles.push(new THREE.Box3().setFromObject(leftStatue).translate(new THREE.Vector3(0, 0, gateZ)));

    // Right Statue: Weathered & broken ancient statue with vine overgrowth
    const rightStatue = WorldBuilder.createGuardianStatue(true);
    rightStatue.position.set(11.5, 1.4, 2);
    rightStatue.rotation.y = -Math.PI * 0.25;
    gateGroup.add(rightStatue);
    obstacles.push(new THREE.Box3().setFromObject(rightStatue).translate(new THREE.Vector3(0, 0, gateZ)));

    // Ancient Stone Braziers with burning golden fire
    const torchLights: THREE.PointLight[] = [];
    [-4.6, 4.6].forEach((bx) => {
      const brazier = WorldBuilder.createStoneBrazier();
      brazier.position.set(bx, 1.4, 2.8);
      gateGroup.add(brazier);

      const bLight = new THREE.PointLight(0xff9900, 2.5, 14);
      bLight.position.set(bx, 3.2, 2.8);
      gateGroup.add(bLight);
      torchLights.push(bLight);
    });

    scene.add(gateGroup);

    // Gate passage barrier obstacle (prevents walking into portal before trigger)
    const gateCollider = new THREE.Box3();
    gateCollider.setFromCenterAndSize(
      new THREE.Vector3(0, 8, gateZ),
      new THREE.Vector3(11, 16, 2.5)
    );
    obstacles.push(gateCollider);

    // 5. ANCIENT RUINS & COLONNADES LINING THE APPROACH
    const pillarPositions: [number, number, boolean][] = [
      [-6.5, 8, false], [6.5, 8, true],
      [-7.2, 0, true],  [7.2, 0, false],
      [-6.8, -8, false],[6.8, -8, true],
      [-13, 4, true],   [13, 4, false],
    ];

    pillarPositions.forEach(([px, pz, isBroken]) => {
      const py = groundHeightFunc(px, pz);
      const pillar = WorldBuilder.createAncientPillar(4.5 + (isBroken ? -1.8 : 0), isBroken);
      pillar.position.set(px, py, pz);
      scene.add(pillar);
      obstacles.push(new THREE.Box3().setFromObject(pillar));
    });

    // 6. DENSE TROPICAL JUNGLE CANOPY TREES & VEGETATION
    const jungleTreePositions: [number, number, number, 'banyan' | 'palm' | 'treeFern'][] = [
      // Close flanks
      [-14, 12, 1.2, 'banyan'],
      [14, 14, 1.1, 'banyan'],
      [-16, 2, 1.3, 'banyan'],
      [16, -2, 1.2, 'banyan'],
      [-12, -10, 1.0, 'palm'],
      [13, -12, 1.1, 'palm'],
      [-10, 16, 0.9, 'palm'],
      [11, 18, 0.9, 'palm'],
      [-8.5, 6, 1.0, 'treeFern'],
      [8.5, 4, 1.0, 'treeFern'],
      [-8.5, -4, 1.0, 'treeFern'],
      [8.5, -6, 1.0, 'treeFern'],
      // Perimeter thicket
      [-22, 18, 1.4, 'banyan'],
      [22, 20, 1.3, 'banyan'],
      [-24, 0, 1.4, 'banyan'],
      [24, 2, 1.4, 'banyan'],
      [-22, -18, 1.5, 'banyan'],
      [22, -18, 1.5, 'banyan'],
      [-18, -26, 1.3, 'banyan'],
      [18, -26, 1.3, 'banyan'],
      [0, -26, 1.4, 'banyan'],
    ];

    jungleTreePositions.forEach(([tx, tz, scale, type]) => {
      const ty = groundHeightFunc(tx, tz);
      let treeGroup: THREE.Group;
      if (type === 'banyan') {
        treeGroup = WorldBuilder.createBanyanTree(scale);
      } else if (type === 'palm') {
        treeGroup = WorldBuilder.createTropicalPalm(scale);
      } else {
        treeGroup = WorldBuilder.createTreeFern(scale);
      }
      treeGroup.position.set(tx, ty, tz);
      scene.add(treeGroup);

      // Add trunk obstacle
      const treeObstacle = new THREE.Box3();
      treeObstacle.setFromCenterAndSize(
        new THREE.Vector3(tx, ty + 3, tz),
        new THREE.Vector3(1.6 * scale, 6 * scale, 1.6 * scale)
      );
      obstacles.push(treeObstacle);
    });

    // Moss-covered jungle boulders
    const rockLocations: [number, number, number, number][] = [
      [-5.5, 10, 1.4, 0.8],
      [6.2, 12, 1.6, 1.2],
      [-9.5, -2, 2.2, 1.6],
      [10.2, 1, 1.8, 1.4],
      [-4.8, -11, 1.2, 0.9],
      [5.4, -10, 1.5, 1.1],
      [-15, 15, 2.6, 2.0],
      [15, 16, 2.8, 2.2],
    ];

    rockLocations.forEach(([rx, rz, sx, sy]) => {
      const ry = groundHeightFunc(rx, rz);
      const rock = WorldBuilder.createMossyRock(sx, sy);
      rock.position.set(rx, ry + sy * 0.35, rz);
      scene.add(rock);
      obstacles.push(new THREE.Box3().setFromObject(rock));
    });

    // Clusters of glowing blue crystals around the ruins
    const crystalClusters: [number, number][] = [
      [-5.8, -12],
      [5.8, -12],
      [-8.2, 2],
      [8.2, -4],
      [-6.2, 14],
      [6.0, 15],
    ];

    crystalClusters.forEach(([cx, cz]) => {
      const cy = groundHeightFunc(cx, cz);
      const cluster = WorldBuilder.createGlowingCrystalCluster();
      cluster.position.set(cx, cy, cz);
      scene.add(cluster);
    });

    // 7. CINEMATIC SUNBEAMS / GOD RAYS
    const sunbeamGroup = new THREE.Group();
    [
      [-4, 18, 2],
      [5, 16, -3],
      [-8, 15, -10],
      [7, 17, 8],
    ].forEach(([sx, sy, sz]) => {
      const beamGeo = new THREE.CylinderGeometry(0.3, 2.8, 18, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfff3c4,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(sx, sy, sz);
      beam.rotation.x = 0.25;
      beam.rotation.z = -0.35;
      sunbeamGroup.add(beam);
    });
    scene.add(sunbeamGroup);

    // 8. FLOATING MAGICAL PARTICLES / JUNGLE SPORES
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 44;
      pPositions[i * 3 + 1] = 0.8 + Math.random() * 10;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x7dd3fc, // Glowing cyan motes
      size: 0.2,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, pMat);
    scene.add(particles);

    // 9. GUARDIAN NPC
    // Stationed on an ancient carved stone dais near the gate
    const guardianDais = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 0.4, 16),
      WorldBuilder.stoneMat
    );
    const guardianPos = new THREE.Vector3(2.6, groundHeightFunc(2.6, -10), -10);
    guardianDais.position.copy(guardianPos);
    guardianDais.position.y += 0.2;
    guardianDais.receiveShadow = true;
    scene.add(guardianDais);

    const guardian = WorldBuilder.buildGuardianNPC();
    guardian.root.position.copy(guardianPos);
    guardian.root.position.y += 0.4;
    guardian.root.rotation.y = Math.PI * 0.85;
    scene.add(guardian.root);

    // 10. NATURAL PERIMETER BOUNDARIES
    // Solid boundary walls around the lush jungle area to keep player bounded
    const wallMat = new THREE.MeshBasicMaterial({ visible: false });
    const boundaryWalls = [
      { pos: [-23, 8, 0], size: [3, 16, 60] },
      { pos: [23, 8, 0], size: [3, 16, 60] },
      { pos: [0, 8, 22], size: [50, 16, 3] },
      { pos: [0, 8, -24], size: [50, 16, 3] },
    ];
    boundaryWalls.forEach(({ pos, size }) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), wallMat);
      wall.position.set(pos[0], pos[1], pos[2]);
      obstacles.push(new THREE.Box3().setFromObject(wall));
    });

    // Animators
    updateAnimators.push((delta, time) => {
      // Flickering ancient brazier flames
      torchLights.forEach((tl, i) => {
        tl.intensity = 2.2 + Math.sin(time * 12 + i * 2) * 0.4 + (Math.random() - 0.5) * 0.15;
      });

      // Portal energy pulse & rotation
      portalMat.opacity = 0.42 + Math.sin(time * 2.8) * 0.12;
      runeRing.rotation.z += delta * 0.4;
      runeRing2.rotation.z -= delta * 0.6;
      sunCore.rotation.y += delta * 0.8;
      sunCore.rotation.x = Math.sin(time * 1.5) * 0.2;
      gateGlowLight.intensity = 3.0 + Math.sin(time * 3.2) * 0.8;

      // Guardian idle staff & breathing
      guardian.update(time);

      // Drifting floating motes
      const pArr = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pArr[i * 3 + 1] += delta * 0.35;
        pArr[i * 3] += Math.sin(time + i) * 0.005;
        if (pArr[i * 3 + 1] > 12) {
          pArr[i * 3 + 1] = 0.8;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
    });

    return {
      scene,
      obstacles,
      groundHeightFunc,
      guardianMesh: guardian.root,
      guardianPosition: guardianPos,
      updateAnimators,
    };
  }

  /**
   * Builds the Hidden Forest environment with river ravine, distant waterfall,
   * lush tropical flora, and Challenge 01: The Blocked Path
   */
  public static buildHiddenForest(): WorldBuildResult {
    const scene = new THREE.Scene();
    
    // Lush tropical jungle atmosphere
    scene.background = new THREE.Color(0x244c38);
    scene.fog = new THREE.FogExp2(0x244c38, 0.019);

    const obstacles: THREE.Box3[] = [];
    const updateAnimators: ((delta: number, time: number) => void)[] = [];

    // 1. LIGHTING
    const ambientLight = new THREE.AmbientLight(0x285038, 1.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbbf7d0, 0x193820, 1.3);
    scene.add(hemiLight);

    // Warm golden sun filtering through the jungle canopy
    const sunLight = new THREE.DirectionalLight(0xfff3c4, 2.4);
    sunLight.position.set(22, 44, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0004;
    const d = 34;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x407c57, 0.6);
    fillLight.position.set(-18, 22, -12);
    scene.add(fillLight);

    // 2. SCULPTED TERRAIN WITH RIVER RAVINE (z = -12)
    const groundHeightFunc = (x: number, z: number) => {
      // River Ravine Channel across z = -12
      let y = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.45;

      if (z > -16.5 && z < -7.5) {
        // Natural curved riverbed depression
        const ravineFactor = Math.sin(((z - -16.5) / 9) * Math.PI);
        y -= ravineFactor * 1.55;
      }

      // Mountain borders
      const borderDistX = Math.abs(x);
      if (borderDistX > 22 || z > 22 || z < -62) {
        const borderDist = Math.max(
          Math.max(0, borderDistX - 20),
          Math.max(0, z - 20),
          Math.max(0, -60 - z)
        );
        y += borderDist * 2.2;
      }
      return y;
    };

    const terrain = WorldBuilder.createJungleGround(95, 140, 60, groundHeightFunc, 0x1b3822);
    scene.add(terrain);

    // 3. RIVER STREAM WATER (flowing along z = -12 from waterfall at x = 26 to west at x = -26)
    const waterGeo = new THREE.PlaneGeometry(65, 8.5, 24, 8);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x14b8a6, // Shimmering tropical emerald water
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.78,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, -0.68, -12);
    scene.add(water);

    // River bed stones & water lily pads
    for (let lx = -18; lx <= 18; lx += 3.5) {
      if (Math.abs(lx) > 3.0) { // Keep center bridge channel open
        const lily = new THREE.Mesh(
          new THREE.CircleGeometry(0.35 + Math.random() * 0.25, 8),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
        );
        lily.rotateX(-Math.PI / 2);
        lily.position.set(lx + (Math.random() - 0.5), -0.65, -12 + (Math.random() - 0.5) * 2.5);
        scene.add(lily);
      }
    }

    // 4. MAJESTIC WATERFALL IN THE DISTANCE (East end of river at x = 24, z = -12)
    const waterfallGroup = new THREE.Group();
    waterfallGroup.position.set(24, 0, -12);

    // Tall Mossy Gorge Cliff
    const cliffGeo = new THREE.BoxGeometry(6, 18, 12);
    const cliff = new THREE.Mesh(cliffGeo, WorldBuilder.darkStoneMat);
    cliff.position.set(2.5, 8, 0);
    waterfallGroup.add(cliff);
    obstacles.push(new THREE.Box3().setFromObject(cliff).translate(new THREE.Vector3(24, 0, -12)));

    // Cascading Water Sheeting Plane
    const fallGeo = new THREE.PlaneGeometry(4.2, 16, 8, 16);
    const fallMat = new THREE.MeshBasicMaterial({
      color: 0xccfbf1,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const fallMesh = new THREE.Mesh(fallGeo, fallMat);
    fallMesh.position.set(0.2, 7.5, 0);
    fallMesh.rotation.y = -Math.PI / 2;
    waterfallGroup.add(fallMesh);

    // Frothing White Foam at Waterfall Base
    const foamGeo = new THREE.CylinderGeometry(2.5, 3.2, 0.4, 16);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xf0fdfa,
      transparent: true,
      opacity: 0.8,
    });
    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.position.set(0.2, -0.5, 0);
    waterfallGroup.add(foam);

    // Rising Mist Cloud / Spray from Waterfall
    const mistGeo = new THREE.SphereGeometry(2.8, 8, 8);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xccfbf1,
      transparent: true,
      opacity: 0.25,
    });
    const mistCloud = new THREE.Mesh(mistGeo, mistMat);
    mistCloud.position.set(0.5, 1.2, 0);
    waterfallGroup.add(mistCloud);

    scene.add(waterfallGroup);

    // 5. STONE PATHWAYS
    // South Pathway (Player approach towards river)
    const southPath = WorldBuilder.createCurvedPath(4.5, 26, 0.08, 0, 16, 0, 3);
    scene.add(southPath);

    // North Pathway (From river crossing onwards to Ancient Shrine)
    const northPath = WorldBuilder.createCurvedPath(4.5, 20, 0.08, 0, -15, 0, -26);
    scene.add(northPath);

    // 6. ANCIENT FOREST SHRINE (z = -30)
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(0, 0, -30);

    // Stepped Circular Temple Platform
    const shrineBase = new THREE.Mesh(
      new THREE.CylinderGeometry(6.2, 6.8, 1.4, 20),
      WorldBuilder.stoneMat
    );
    shrineBase.position.y = 0.7;
    shrineBase.castShadow = true;
    shrineBase.receiveShadow = true;
    shrineGroup.add(shrineBase);

    // Ancient Ruined Colonnade around Shrine
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
      const cx = Math.cos(angle) * 5.0;
      const cz = Math.sin(angle) * 5.0;
      const pillar = WorldBuilder.createAncientPillar(5.2, angle > Math.PI);
      pillar.position.set(cx, 1.4, cz);
      shrineGroup.add(pillar);
      obstacles.push(new THREE.Box3().setFromObject(pillar).translate(new THREE.Vector3(0, 0, -30)));
    }

    // Shrine Altar Pedestal
    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.7, 1.8, 12),
      WorldBuilder.darkStoneMat
    );
    altar.position.y = 2.0;
    altar.castShadow = true;
    shrineGroup.add(altar);

    // Floating Ancient Sun Relic
    const relicMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 2.0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const relic = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), relicMat);
    relic.position.y = 3.6;
    shrineGroup.add(relic);

    // Relic Point Light
    const relicLight = new THREE.PointLight(0xf59e0b, 3.2, 14);
    relicLight.position.y = 3.6;
    shrineGroup.add(relicLight);

    // Shrine Torches / Braziers
    [-3.2, 3.2].forEach((bx) => {
      const brazier = WorldBuilder.createStoneBrazier();
      brazier.position.set(bx, 1.4, 2.5);
      shrineGroup.add(brazier);

      const bLight = new THREE.PointLight(0xff9900, 2.2, 10);
      bLight.position.set(bx, 3.0, 2.5);
      shrineGroup.add(bLight);
    });

    scene.add(shrineGroup);

    // 7. DENSE JUNGLE TREES THROUGHOUT VALLEY
    const jungleTrees: [number, number, number, 'banyan' | 'palm' | 'treeFern'][] = [
      [-10, 14, 1.3, 'banyan'],
      [11, 15, 1.2, 'banyan'],
      [-14, 6, 1.4, 'banyan'],
      [14, 4, 1.3, 'banyan'],
      [-12, -4, 1.2, 'banyan'],
      [13, -5, 1.2, 'banyan'],
      [-15, -20, 1.4, 'banyan'],
      [16, -22, 1.3, 'banyan'],
      [-10, -32, 1.4, 'banyan'],
      [11, -34, 1.4, 'banyan'],
      // Palms along river
      [-8, -8, 1.1, 'palm'],
      [8, -8, 1.0, 'palm'],
      [-7, -16, 1.1, 'palm'],
      [8, -16, 1.1, 'palm'],
      [-16, -11, 1.2, 'palm'],
      [16, -11, 1.2, 'palm'],
      // Tree ferns in understory
      [-5.5, 8, 1.0, 'treeFern'],
      [5.5, 6, 1.0, 'treeFern'],
      [-6.0, -1, 1.0, 'treeFern'],
      [6.2, -2, 1.0, 'treeFern'],
      [-5.8, -24, 1.0, 'treeFern'],
      [6.0, -25, 1.0, 'treeFern'],
    ];

    jungleTrees.forEach(([tx, tz, scale, type]) => {
      const ty = groundHeightFunc(tx, tz);
      let treeMesh: THREE.Group;
      if (type === 'banyan') {
        treeMesh = WorldBuilder.createBanyanTree(scale);
      } else if (type === 'palm') {
        treeMesh = WorldBuilder.createTropicalPalm(scale);
      } else {
        treeMesh = WorldBuilder.createTreeFern(scale);
      }
      treeMesh.position.set(tx, ty, tz);
      scene.add(treeMesh);

      const treeBox = new THREE.Box3();
      treeBox.setFromCenterAndSize(
        new THREE.Vector3(tx, ty + 3, tz),
        new THREE.Vector3(1.6 * scale, 6 * scale, 1.6 * scale)
      );
      obstacles.push(treeBox);
    });

    // 8. GLOWING RIVER CRYSTALS & MOSSY ROCKS
    const riverCrystals: [number, number][] = [
      [-6.2, -10],
      [5.8, -10],
      [-5.0, -14],
      [5.2, -14],
      [-12, -13],
      [12, -13],
      [-3.8, -26],
      [4.0, -27],
    ];

    riverCrystals.forEach(([cx, cz]) => {
      const cy = groundHeightFunc(cx, cz);
      const cluster = WorldBuilder.createGlowingCrystalCluster();
      cluster.position.set(cx, cy, cz);
      scene.add(cluster);
    });

    // Mossy River Boulders
    const riverRocks: [number, number, number, number][] = [
      [-4.8, -12, 1.6, 1.0],
      [4.8, -12, 1.8, 1.1],
      [-8.5, -11, 2.2, 1.4],
      [9.0, -13, 2.4, 1.5],
      [-2.5, 4, 1.4, 0.9],
      [3.0, 5, 1.3, 0.8],
      [-3.0, -22, 1.5, 1.0],
      [3.2, -21, 1.4, 0.9],
    ];

    riverRocks.forEach(([rx, rz, sx, sy]) => {
      const ry = groundHeightFunc(rx, rz);
      const rock = WorldBuilder.createMossyRock(sx, sy);
      rock.position.set(rx, ry + sy * 0.35, rz);
      scene.add(rock);
      obstacles.push(new THREE.Box3().setFromObject(rock));
    });

    // 9. DUST PARTICLES & SPORES
    const motesCount = 140;
    const motesGeo = new THREE.BufferGeometry();
    const motesPos = new Float32Array(motesCount * 3);
    for (let i = 0; i < motesCount; i++) {
      motesPos[i * 3] = (Math.random() - 0.5) * 44;
      motesPos[i * 3 + 1] = 0.5 + Math.random() * 8;
      motesPos[i * 3 + 2] = (Math.random() - 0.5) * 55;
    }
    motesGeo.setAttribute('position', new THREE.BufferAttribute(motesPos, 3));
    const motesMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.8,
    });
    const motes = new THREE.Points(motesGeo, motesMat);
    scene.add(motes);

    // 10. NATURAL BOUNDARIES
    const boundaryWalls = [
      { pos: [-24, 8, -20], size: [3, 16, 95] },
      { pos: [24, 8, -20], size: [3, 16, 95] },
      { pos: [0, 8, 24], size: [50, 16, 3] },
      { pos: [0, 8, -62], size: [50, 16, 3] },
      { pos: [-14, 8, -38], size: [21, 16, 3] },
      { pos: [14, 8, -38], size: [21, 16, 3] },
    ];
    const wallMat = new THREE.MeshBasicMaterial({ visible: false });
    boundaryWalls.forEach(({ pos, size }) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), wallMat);
      wall.position.set(pos[0], pos[1], pos[2]);
      obstacles.push(new THREE.Box3().setFromObject(wall));
    });

    // Animators
    updateAnimators.push((delta, time) => {
      // Rotate Shrine Relic
      relic.rotation.y += delta * 0.9;
      relic.rotation.x = Math.sin(time * 1.6) * 0.2;
      relic.position.y = 3.6 + Math.sin(time * 2.2) * 0.15;
      relicLight.intensity = 2.8 + Math.sin(time * 3) * 0.6;

      // Waterfall animation: oscillate fall opacity and mist bob
      fallMat.opacity = 0.78 + Math.sin(time * 8) * 0.12;
      foam.scale.set(
        1 + Math.sin(time * 6) * 0.08,
        1,
        1 + Math.cos(time * 6) * 0.08
      );
      mistCloud.scale.set(
        1 + Math.sin(time * 2) * 0.12,
        1 + Math.cos(time * 2.5) * 0.15,
        1 + Math.sin(time * 2) * 0.12
      );

      // Water subtle shimmer
      waterMat.opacity = 0.76 + Math.sin(time * 2) * 0.04;

      // Bob floating motes
      const mArr = motesGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < motesCount; i++) {
        mArr[i * 3 + 1] += Math.sin(time * 2 + i) * 0.006;
      }
      motesGeo.attributes.position.needsUpdate = true;
    });

    return {
      scene,
      obstacles,
      groundHeightFunc,
      updateAnimators,
    };
  }

  // ==========================================
  // PROCEDURAL JUNGLE GENERATORS
  // ==========================================

  /**
   * Creates a textured, undulating jungle terrain mesh
   */
  private static createJungleGround(
    width: number,
    depth: number,
    segments: number,
    heightFunc: (x: number, z: number) => number,
    baseColorHex: number
  ): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(width, depth, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cBase = new THREE.Color(baseColorHex);
    const cLush = new THREE.Color(0x2d6332);
    const cSoil = new THREE.Color(0x261d14);
    const cStone = new THREE.Color(0x424e44);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = heightFunc(x, z);
      pos.setY(i, y);

      // Vertex color variation: stone path near center, lush green, soil edges
      const distCenter = Math.abs(x);
      let vColor: THREE.Color;
      if (z < -36) {
        // Volcanic Dragon Valley (obsidian rock & glowing ember cracks)
        vColor = (Math.sin(x * 0.4) * Math.cos(z * 0.4) > 0.4) ? new THREE.Color(0xd97706) : new THREE.Color(0x18181b);
      } else if (distCenter < 2.5 && Math.abs(z) < 20) {
        vColor = cStone;
      } else if (y < -0.2) {
        vColor = cSoil;
      } else if (Math.sin(x * 0.3) * Math.cos(z * 0.3) > 0) {
        vColor = cLush;
      } else {
        vColor = cBase;
      }

      colors[i * 3] = vColor.r;
      colors[i * 3 + 1] = vColor.g;
      colors[i * 3 + 2] = vColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.receiveShadow = true;
    return groundMesh;
  }

  /**
   * Giant Banyan / Kapok Jungle Tree with massive buttress roots and multi-tiered canopy
   */
  private static createBanyanTree(scale: number = 1.0): THREE.Group {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);

    const trunkHeight = 10;
    // Main Trunk
    const trunkGeo = new THREE.CylinderGeometry(1.1, 1.8, trunkHeight, 10);
    const trunk = new THREE.Mesh(trunkGeo, WorldBuilder.woodTrunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Spreading Buttress Roots
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const rootGeo = new THREE.BoxGeometry(0.5, 3.5, 3.2);
      rootGeo.translate(0, 1.6, 1.8);
      const rootMesh = new THREE.Mesh(rootGeo, WorldBuilder.woodTrunkMat);
      rootMesh.rotation.y = angle;
      rootMesh.castShadow = true;
      group.add(rootMesh);
    }

    // Multi-layered Broadleaf Canopy Domes
    const canopyTiers = [
      { y: 8.5, radius: 5.2, height: 3.5, mat: WorldBuilder.leafMatDark },
      { y: 11.0, radius: 4.4, height: 3.2, mat: WorldBuilder.leafMatMedium },
      { y: 13.2, radius: 3.4, height: 2.8, mat: WorldBuilder.leafMatBright },
    ];

    canopyTiers.forEach((tier) => {
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(tier.radius, tier.height, 9),
        tier.mat
      );
      leaves.position.y = tier.y;
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      group.add(leaves);
    });

    // Hanging Aerial Roots & Lianas
    for (let a = 0; a < 4; a++) {
      const angle = (a / 4) * Math.PI * 2 + 0.3;
      const lianaX = Math.cos(angle) * 3.2;
      const lianaZ = Math.sin(angle) * 3.2;
      WorldBuilder.addDrapingVines(group, lianaX, 8.5, 0.4, 4);
    }

    return group;
  }

  /**
   * Tropical Palm with curved trunk and radiating fronds
   */
  private static createTropicalPalm(scale: number = 1.0): THREE.Group {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);

    const trunkHeight = 8;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, trunkHeight, 8),
      WorldBuilder.woodTrunkMat
    );
    trunk.position.set(0.4, trunkHeight / 2, 0);
    trunk.rotation.z = -0.08; // Gentle tropical slant
    trunk.castShadow = true;
    group.add(trunk);

    // Radiating Palm Fronds
    const crown = new THREE.Group();
    crown.position.set(0.75, trunkHeight, 0);

    const frondCount = 9;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.7, 3.8, 4);
      frondGeo.translate(0, 1.8, 0);
      frondGeo.rotateX(Math.PI / 2.8);
      const frond = new THREE.Mesh(frondGeo, WorldBuilder.leafMatBright);
      frond.rotation.y = angle;
      frond.castShadow = true;
      crown.add(frond);
    }

    // Coconut cluster
    for (let c = 0; c < 3; c++) {
      const coconut = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 6, 6),
        WorldBuilder.darkStoneMat
      );
      coconut.position.set(
        Math.cos((c / 3) * Math.PI * 2) * 0.35,
        -0.2,
        Math.sin((c / 3) * Math.PI * 2) * 0.35
      );
      crown.add(coconut);
    }

    group.add(crown);
    return group;
  }

  /**
   * Lush Jungle Tree Fern
   */
  private static createTreeFern(scale: number = 1.0): THREE.Group {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);

    const h = 4.5;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.32, h, 6),
      WorldBuilder.woodTrunkMat
    );
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const crown = new THREE.Group();
    crown.position.y = h;
    for (let f = 0; f < 8; f++) {
      const angle = (f / 8) * Math.PI * 2;
      const frondGeo = new THREE.BoxGeometry(0.4, 0.08, 2.6);
      frondGeo.translate(0, -0.1, 1.2);
      frondGeo.rotateX(-0.35);
      const frond = new THREE.Mesh(frondGeo, WorldBuilder.leafMatMedium);
      frond.rotation.y = angle;
      frond.castShadow = true;
      crown.add(frond);
    }
    group.add(crown);

    return group;
  }

  /**
   * Hanging Vines / Lianas draped from an anchor point
   */
  private static addDrapingVines(
    parent: THREE.Group,
    x: number,
    topY: number,
    spreadZ: number,
    segments: number
  ) {
    const vineGroup = new THREE.Group();
    let currY = topY;
    let currZ = spreadZ;

    for (let s = 0; s < segments; s++) {
      const segLen = 0.8 + Math.random() * 0.4;
      const vineSeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.05, segLen, 5),
        WorldBuilder.vineMat
      );
      vineSeg.position.set(x + (Math.random() - 0.5) * 0.15, currY - segLen / 2, currZ);
      vineSeg.rotation.z = (Math.random() - 0.5) * 0.2;
      vineSeg.rotation.x = (Math.random() - 0.5) * 0.2;
      vineGroup.add(vineSeg);

      // Leaf sprout on vine
      if (s % 2 === 0) {
        const sprout = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.04, 0.24),
          WorldBuilder.leafMatBright
        );
        sprout.position.set(vineSeg.position.x, vineSeg.position.y, vineSeg.position.z + 0.1);
        vineGroup.add(sprout);
      }

      currY -= segLen * 0.92;
      currZ += (Math.random() - 0.5) * 0.1;
    }
    parent.add(vineGroup);
  }

  /**
   * Moss-covered jungle boulder
   */
  private static createMossyRock(sizeX: number, sizeY: number): THREE.Group {
    const group = new THREE.Group();
    const rockGeo = new THREE.DodecahedronGeometry(sizeX * 0.7, 1);
    const rock = new THREE.Mesh(rockGeo, WorldBuilder.darkStoneMat);
    rock.scale.set(1.0, sizeY / sizeX, 0.9);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);

    // Moss layer on top of rock
    const mossGeo = new THREE.ConeGeometry(sizeX * 0.72, sizeY * 0.45, 7);
    const moss = new THREE.Mesh(mossGeo, WorldBuilder.mossStoneMat);
    moss.position.y = sizeY * 0.35;
    group.add(moss);

    return group;
  }

  /**
   * Weathered ancient stone pillar with carved details and creeping ivy
   */
  private static createAncientPillar(height: number, isBroken: boolean = false): THREE.Group {
    const group = new THREE.Group();

    // Base plinth
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 1.4),
      WorldBuilder.darkStoneMat
    );
    plinth.position.y = 0.2;
    plinth.castShadow = true;
    group.add(plinth);

    // Fluted Column Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.56, height, 10),
      WorldBuilder.stoneMat
    );
    shaft.position.y = height / 2 + 0.4;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    if (!isBroken) {
      // Intact Capital Block
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.45, 1.3),
        WorldBuilder.stoneMat
      );
      cap.position.y = height + 0.6;
      cap.castShadow = true;
      group.add(cap);
    } else {
      // Tumbled stone chunk on the ground beside the pillar
      const brokenChunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.54, 1.4, 8),
        WorldBuilder.stoneMat
      );
      brokenChunk.rotateZ(Math.PI / 2.2);
      brokenChunk.position.set(0.9, 0.4, 0.2);
      brokenChunk.castShadow = true;
      group.add(brokenChunk);
    }

    // Creeping ivy wrap
    WorldBuilder.addDrapingVines(group, 0.55, height * 0.75, 0, 3);

    return group;
  }

  /**
   * Ancient Carved Stone Brazier / Fire Basin
   */
  private static createStoneBrazier(): THREE.Group {
    const group = new THREE.Group();

    // Ornate Pedestal
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.6, 0.8, 8),
      WorldBuilder.darkStoneMat
    );
    base.position.y = 0.4;
    base.castShadow = true;
    group.add(base);

    // Fire Bowl Basin
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.4, 0.5, 8),
      WorldBuilder.stoneMat
    );
    bowl.position.y = 1.0;
    bowl.castShadow = true;
    group.add(bowl);

    // Glowing Hot Coals
    const coals = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4500 })
    );
    coals.position.y = 1.22;
    group.add(coals);

    // Flame Mesh
    const flameGeo = new THREE.ConeGeometry(0.35, 0.9, 6);
    const flame = new THREE.Mesh(flameGeo, WorldBuilder.flameMat);
    flame.position.y = 1.7;
    group.add(flame);

    return group;
  }

  /**
   * Guardian Beast Statue flanking the Grand Gate
   */
  private static createGuardianStatue(isBroken: boolean): THREE.Group {
    const statue = new THREE.Group();

    // Carved Stepped Pedestal
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.2, 3.2),
      WorldBuilder.darkStoneMat
    );
    base.position.y = 0.6;
    base.castShadow = true;
    statue.add(base);

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 2.4),
      WorldBuilder.stoneMat
    );
    body.position.set(0, 1.9, 0);
    body.castShadow = true;
    statue.add(body);

    if (!isBroken) {
      // Beast Head with Glowing Eyes
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 1.4),
        WorldBuilder.stoneMat
      );
      head.position.set(0, 3.1, 0.8);
      head.castShadow = true;
      statue.add(head);

      const eyeL = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      eyeL.position.set(-0.35, 3.2, 1.52);
      statue.add(eyeL);

      const eyeR = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      eyeR.position.set(0.35, 3.2, 1.52);
      statue.add(eyeR);
    } else {
      // Broken tumbled head lying mossy on pedestal
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.0, 1.3),
        WorldBuilder.mossStoneMat
      );
      head.position.set(0.4, 1.6, 1.2);
      head.rotation.set(0.4, 0.5, 0.8);
      statue.add(head);

      // Creepers wrapping over the ruined shoulders
      WorldBuilder.addDrapingVines(statue, -0.4, 2.6, 0.2, 3);
    }

    return statue;
  }

  /**
   * Cluster of faceted glowing blue/cyan magical crystals
   */
  private static createGlowingCrystalCluster(): THREE.Group {
    const cluster = new THREE.Group();
    const count = 4 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const h = 0.9 + Math.random() * 0.8;
      const r = 0.14 + Math.random() * 0.12;
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 5),
        WorldBuilder.crystalMat
      );
      crystal.position.set(
        (Math.random() - 0.5) * 0.7,
        h / 2,
        (Math.random() - 0.5) * 0.7
      );
      crystal.rotation.x = (Math.random() - 0.5) * 0.35;
      crystal.rotation.z = (Math.random() - 0.5) * 0.35;
      crystal.castShadow = true;
      cluster.add(crystal);
    }

    const light = new THREE.PointLight(0x00e5ff, 1.6, 7);
    light.position.y = 0.9;
    cluster.add(light);

    return cluster;
  }

  /**
   * Creates a stone pathway between two coordinates
   */
  private static createCurvedPath(
    width: number,
    steps: number,
    stepHeight: number,
    startX: number,
    startZ: number,
    endX: number,
    endZ: number
  ): THREE.Group {
    const group = new THREE.Group();
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const px = startX + (endX - startX) * t;
      const pz = startZ + (endZ - startZ) * t;
      const stone = new THREE.Mesh(
        new THREE.BoxGeometry(width + (Math.random() - 0.5) * 0.4, stepHeight, 1.2),
        Math.random() > 0.4 ? WorldBuilder.stoneMat : WorldBuilder.mossStoneMat
      );
      stone.position.set(px, stepHeight / 2 + 0.02, pz);
      stone.rotation.y = (Math.random() - 0.5) * 0.08;
      stone.receiveShadow = true;
      group.add(stone);
    }
    return group;
  }

  /**
   * Stylized Guardian NPC model with flowing robes & celestial crystal staff
   */
  private static buildGuardianNPC() {
    const root = new THREE.Group();

    // Robe body
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x164e63, roughness: 0.55 }); // Mystical teal robe
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const robeGeo = new THREE.ConeGeometry(0.85, 2.4, 12);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 1.2;
    robe.castShadow = true;
    root.add(robe);

    // Robe golden collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.25, 12), goldMat);
    collar.position.y = 2.2;
    root.add(collar);

    // Hood / Head
    const hoodGeo = new THREE.SphereGeometry(0.48, 12, 12);
    const hood = new THREE.Mesh(hoodGeo, robeMat);
    hood.position.y = 2.55;
    root.add(hood);

    // Glowing Eyes under hood
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), eyeMat);
    eyeL.position.set(-0.14, 2.55, 0.42);
    root.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), eyeMat);
    eyeR.position.set(0.14, 2.55, 0.42);
    root.add(eyeR);

    // Staff
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.85, 0, 0.4);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 })
    );
    shaft.position.y = 1.6;
    shaft.castShadow = true;
    staffGroup.add(shaft);

    const headpiece = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 16), goldMat);
    headpiece.position.y = 3.1;
    headpiece.rotation.y = Math.PI / 4;
    staffGroup.add(headpiece);

    // Glowing Crystal Orb on Staff
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), trimMat);
    orb.position.y = 3.1;
    staffGroup.add(orb);

    const staffLight = new THREE.PointLight(0x38bdf8, 2.2, 9);
    staffLight.position.y = 3.1;
    staffGroup.add(staffLight);

    root.add(staffGroup);

    return {
      root,
      update: (time: number) => {
        // Subtle breathing
        robe.scale.y = 1 + Math.sin(time * 2) * 0.015;
        // Staff floating bob & light flicker
        orb.rotation.y += 0.03;
        orb.position.y = 3.1 + Math.sin(time * 2.5) * 0.08;
        staffLight.intensity = 1.8 + Math.sin(time * 4) * 0.5;
      },
    };
  }

  /**
   * Stylized Wise Old Sage NPC (Elder Guide across all 5 Levels)
   * Warm elder robes, long flowing silver beard, gnarled staff & hanging lantern
   */
  public static buildOldSageNPC() {
    const root = new THREE.Group();

    // Materials
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 }); // Warm earthy terracotta monk robe
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.8,
    });
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.95 }); // Flowing silver-white beard
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.8 }); // Weathered gentle face
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x27170b, roughness: 0.9 }); // Gnarled oak staff

    // Robe lower body (cone)
    const robeGeo = new THREE.ConeGeometry(0.8, 2.1, 12);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 1.05;
    robe.castShadow = true;
    root.add(robe);

    // Warm sash & golden waistband
    const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.22, 12), trimMat);
    sash.position.y = 1.45;
    root.add(sash);

    // Shoulders & Cowl
    const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 10), robeMat);
    cowl.position.y = 2.05;
    cowl.scale.set(1.1, 0.7, 1.0);
    root.add(cowl);

    // Elder Head & Hood
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), skinMat);
    head.position.set(0, 2.3, 0.05);
    root.add(head);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 12), robeMat);
    hood.position.set(0, 2.38, -0.04);
    hood.scale.set(1.05, 1.1, 1.15);
    root.add(hood);

    // Long Flowing Silver-White Beard
    const beardGroup = new THREE.Group();
    beardGroup.position.set(0, 2.15, 0.28);

    // Main long tapering beard cone
    const beardMain = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 8), beardMat);
    beardMain.rotation.x = -0.22;
    beardMain.position.y = -0.45;
    beardGroup.add(beardMain);

    // Mustache curls
    [-0.12, 0.12].forEach((mx) => {
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), beardMat);
      stache.position.set(mx, 0.02, 0.05);
      stache.rotation.z = mx > 0 ? -0.25 : 0.25;
      beardGroup.add(stache);
    });

    root.add(beardGroup);

    // Soft Gentle Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    [-0.1, 0.1].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), eyeMat);
      eye.position.set(ex, 2.34, 0.38);
      root.add(eye);
    });

    // Gnarled Walking Staff with Hanging Warm Lantern
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.75, 0, 0.35);

    // Tall bent wooden staff
    const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.9, 7), woodMat);
    staffShaft.position.y = 1.45;
    staffShaft.castShadow = true;
    staffGroup.add(staffShaft);

    // Curved hook at top of staff
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12, Math.PI), woodMat);
    hook.position.set(-0.1, 2.85, 0);
    hook.rotation.z = Math.PI * 0.1;
    staffGroup.add(hook);

    // Hanging Bronze Lantern
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(-0.25, 2.65, 0);

    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    chain.position.y = 0.11;
    lanternGroup.add(chain);

    const lanternHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.12, 0.28, 6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.8, roughness: 0.3 })
    );
    lanternHousing.castShadow = true;
    lanternGroup.add(lanternHousing);

    // Glowing warm glass core
    const lanternGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.09, 0.18, 6),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lanternGroup.add(lanternGlow);

    const lanternLight = new THREE.PointLight(0xfbbf24, 2.5, 8);
    lanternGroup.add(lanternLight);

    staffGroup.add(lanternGroup);
    root.add(staffGroup);

    // Gentle Golden Wisdom Aura on the ground
    const auraMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.4, 16),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      })
    );
    auraMesh.rotateX(-Math.PI / 2);
    auraMesh.position.y = 0.03;
    root.add(auraMesh);

    return {
      root,
      lanternLight,
      update: (time: number) => {
        // Breathing
        robe.scale.y = 1 + Math.sin(time * 1.8) * 0.018;
        beardGroup.rotation.z = Math.sin(time * 1.5) * 0.02;
        // Gentle lantern pendulum swing in breeze
        lanternGroup.rotation.z = Math.sin(time * 2.2) * 0.12;
        lanternGroup.rotation.x = Math.cos(time * 1.8) * 0.08;
        // Warm flickering light
        lanternLight.intensity = 2.2 + Math.sin(time * 5.0) * 0.3 + (Math.random() - 0.5) * 0.1;
        // Pulsing aura ring
        auraMesh.rotation.z += 0.005;
        (auraMesh.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(time * 2.5) * 0.08;
      },
    };
  }

  // ====================================================
  // PHASE ENGINE BUILDERS (Phases 2 to 5)
  // ====================================================
  public static buildRainbowBridge(): { phase: RainbowBridgePhase; world: WorldBuildResult } {
    const phase = new RainbowBridgePhase();
    return { phase, world: phase.toWorldBuildResult() };
  }

  public static buildCastlePlace(): { phase: CastlePlacePhase; world: WorldBuildResult } {
    const phase = new CastlePlacePhase();
    return { phase, world: phase.toWorldBuildResult() };
  }

  public static buildMysteryIsland(): { phase: MysteryIslandPhase; world: WorldBuildResult } {
    const phase = new MysteryIslandPhase();
    return { phase, world: phase.toWorldBuildResult() };
  }

  public static buildFairyGarden(): { phase: FairyGardenAndDragonValleyPhase; world: WorldBuildResult } {
    const phase = new FairyGardenAndDragonValleyPhase();
    return { phase, world: phase.toWorldBuildResult() };
  }

  public static buildDragonValley(existingPhase?: FairyGardenAndDragonValleyPhase): { phase: FairyGardenAndDragonValleyPhase; world: WorldBuildResult } {
    const phase = existingPhase ?? new FairyGardenAndDragonValleyPhase();
    phase.buildDragonValleyScene();
    return { phase, world: phase.toWorldBuildResult() };
  }
}
