import * as THREE from 'three';
import { InputState } from './InputManager';
import { sound } from '../audio/SoundManager';

export class PlayerController {
  public group: THREE.Group;
  public camera: THREE.PerspectiveCamera;
  
  // Character body parts for animation
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private head: THREE.Group;
  private torso: THREE.Mesh;

  // Movement & Physics
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public isGrounded: boolean = true;
  private walkSpeed: number = 7.5;
  private sprintSpeed: number = 11.5;
  private jumpForce: number = 10.0;
  private gravity: number = 24.0;
  private walkAnimTime: number = 0;
  private footstepTimer: number = 0;

  // Health, Stamina & Survival Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public stamina: number = 100;
  public maxStamina: number = 100;
  public isSprinting: boolean = false;
  public isExhausted: boolean = false;
  private highestAirY: number = 0;
  private damageInvulnTimer: number = 0;

  public onTakeDamage?: (amount: number, reason: string) => void;
  public onStatsChange?: (health: number, stamina: number) => void;

  // Camera Orbit
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.25; // slight downward angle
  private cameraDistance: number = 5.2;
  private cameraTargetOffset: THREE.Vector3 = new THREE.Vector3(0, 1.6, 0);
  private currentLookTarget: THREE.Vector3 = new THREE.Vector3();

  // Bounds & Environment Colliders
  public groundHeightFunc: (x: number, z: number) => number = () => 0;
  public collisionObstacles: THREE.Box3[] = [];

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.group = new THREE.Group();

    // Build stylized Human Explorer
    const explorer = this.buildHumanoidModel();
    this.group.add(explorer.root);

    this.leftLeg = explorer.leftLeg;
    this.rightLeg = explorer.rightLeg;
    this.leftArm = explorer.leftArm;
    this.rightArm = explorer.rightArm;
    this.head = explorer.head;
    this.torso = explorer.torso;

    this.currentLookTarget.copy(this.position).add(this.cameraTargetOffset);
  }

  private buildHumanoidModel() {
    const root = new THREE.Group();

    // Materials - Rich Adventurer Expedition Palette:
    // Weathered khaki canvas, saddle leather, forest cargo green, brass accents, warm skin
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf3cca3, roughness: 0.55 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xb58852, roughness: 0.7 }); // Safari explorer khaki/tan jacket
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3d5a45, roughness: 0.8 }); // Forest olive under-shirt
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc25b38, roughness: 0.75 }); // Terracotta expedition neckerchief
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4a2c17, roughness: 0.65 }); // Saddle leather straps & boots
    const leatherLightMat = new THREE.MeshStandardMaterial({ color: 0x6e4526, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334433, roughness: 0.85 }); // Rugged cargo pants
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xdfab35, metalness: 0.85, roughness: 0.25 }); // Brass buckles & rivets
    const canteenMat = new THREE.MeshStandardMaterial({ color: 0x7c8c99, metalness: 0.6, roughness: 0.35 }); // Brushed aluminum flask
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.75 }); // Classic expedition fedora
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x24180e, roughness: 0.9 });
    const woolMat = new THREE.MeshStandardMaterial({ color: 0xc8baa5, roughness: 0.95 }); // Wool boot socks

    // 1. Torso & Explorer Jacket
    const torsoGeo = new THREE.BoxGeometry(0.66, 0.76, 0.42);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    torso.receiveShadow = true;
    root.add(torso);

    // Inner shirt chest panel
    const shirtPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.5, 0.44),
      shirtMat
    );
    shirtPanel.position.set(0, 0.08, 0.01);
    torso.add(shirtPanel);

    // Explorer neck scarf / bandana
    const scarfGeo = new THREE.BoxGeometry(0.38, 0.14, 0.46);
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.set(0, 0.34, 0.02);
    torso.add(scarf);

    // Utility belt
    const beltGeo = new THREE.BoxGeometry(0.7, 0.13, 0.45);
    const belt = new THREE.Mesh(beltGeo, leatherMat);
    belt.position.y = -0.31;
    torso.add(belt);

    // Brass belt buckle
    const buckleGeo = new THREE.BoxGeometry(0.18, 0.16, 0.47);
    const buckle = new THREE.Mesh(buckleGeo, goldMat);
    buckle.position.y = -0.31;
    torso.add(buckle);

    // Side pouch on right hip
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.16), leatherLightMat);
    pouch.position.set(-0.35, -0.28, 0.02);
    torso.add(pouch);

    // Canteen flask on left hip
    const canteenGroup = new THREE.Group();
    canteenGroup.position.set(0.36, -0.28, 0.02);
    const canteenBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), canteenMat);
    const canteenCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8), goldMat);
    canteenCap.position.y = 0.11;
    canteenGroup.add(canteenBody);
    canteenGroup.add(canteenCap);
    torso.add(canteenGroup);

    // Backpack - High detail explorer rucksack
    const packGroup = new THREE.Group();
    packGroup.position.set(0, 0.04, -0.32);

    const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.32), leatherLightMat);
    packMain.castShadow = true;
    packGroup.add(packMain);

    // Backpack outer pouch pocket
    const outerPouch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.12), leatherMat);
    outerPouch.position.set(0, -0.08, -0.2);
    packGroup.add(outerPouch);

    // Leather straps over shoulders
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.44), leatherMat);
    strapL.position.set(0.2, 0.02, 0.12);
    packGroup.add(strapL);

    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.44), leatherMat);
    strapR.position.set(-0.2, 0.02, 0.12);
    packGroup.add(strapR);

    // Bedroll on backpack top
    const rollGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.58, 10);
    rollGeo.rotateZ(Math.PI / 2);
    const roll = new THREE.Mesh(rollGeo, new THREE.MeshStandardMaterial({ color: 0x556b4f, roughness: 0.9 }));
    roll.position.set(0, 0.36, 0.02);
    packGroup.add(roll);

    // Leather tie rings on bedroll
    const tie1 = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12), leatherMat);
    tie1.position.set(-0.16, 0.36, 0.02);
    tie1.rotation.y = Math.PI / 2;
    packGroup.add(tie1);

    const tie2 = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12), leatherMat);
    tie2.position.set(0.16, 0.36, 0.02);
    tie2.rotation.y = Math.PI / 2;
    packGroup.add(tie2);

    torso.add(packGroup);

    // 2. Head & Neck
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.78, 0);

    const headGeo = new THREE.BoxGeometry(0.42, 0.45, 0.42);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.45, 0.18, 0.45);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.18;
    headGroup.add(hair);

    // Explorer Fedora Hat
    const brimGeo = new THREE.CylinderGeometry(0.52, 0.54, 0.05, 14);
    const brim = new THREE.Mesh(brimGeo, hatMat);
    brim.position.y = 0.27;
    headGroup.add(brim);

    const crownGeo = new THREE.CylinderGeometry(0.32, 0.37, 0.3, 14);
    const crown = new THREE.Mesh(crownGeo, hatMat);
    crown.position.y = 0.42;
    headGroup.add(crown);

    const hatBandGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.07, 14);
    const hatBand = new THREE.Mesh(hatBandGeo, leatherMat);
    hatBand.position.y = 0.32;
    headGroup.add(hatBand);

    const hatPin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.36), goldMat);
    hatPin.position.set(0.24, 0.33, 0);
    headGroup.add(hatPin);

    root.add(headGroup);

    // 3. Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.45, 1.55, 0);

    // Jacket sleeve
    const sleeveGeo = new THREE.BoxGeometry(0.22, 0.36, 0.22);
    sleeveGeo.translate(0, -0.15, 0);
    const leftSleeve = new THREE.Mesh(sleeveGeo, jacketMat);
    leftSleeve.castShadow = true;
    leftArmGroup.add(leftSleeve);

    // Bare forearm
    const armGeo = new THREE.BoxGeometry(0.18, 0.35, 0.18);
    armGeo.translate(0, -0.38, 0);
    const leftForearm = new THREE.Mesh(armGeo, skinMat);
    leftForearm.castShadow = true;
    leftArmGroup.add(leftForearm);

    // Explorer leather wrist cuff / compass
    const wristCuff = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.2), leatherMat);
    wristCuff.position.set(0, -0.48, 0);
    leftArmGroup.add(wristCuff);

    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), leatherLightMat);
    leftGlove.position.set(0, -0.6, 0);
    leftArmGroup.add(leftGlove);
    root.add(leftArmGroup);

    // 4. Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.45, 1.55, 0);

    const rightSleeve = new THREE.Mesh(sleeveGeo, jacketMat);
    rightSleeve.castShadow = true;
    rightArmGroup.add(rightSleeve);

    const rightForearm = new THREE.Mesh(armGeo, skinMat);
    rightForearm.castShadow = true;
    rightArmGroup.add(rightForearm);

    const rightWristCuff = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.2), leatherMat);
    rightWristCuff.position.set(0, -0.48, 0);
    rightArmGroup.add(rightWristCuff);

    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), leatherLightMat);
    rightGlove.position.set(0, -0.6, 0);
    rightArmGroup.add(rightGlove);
    root.add(rightArmGroup);

    // 5. Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0.21, 0.88, 0);
    const legGeo = new THREE.BoxGeometry(0.25, 0.65, 0.25);
    legGeo.translate(0, -0.32, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);

    // Wool sock cuff
    const sockGeo = new THREE.BoxGeometry(0.27, 0.08, 0.27);
    sockGeo.translate(0, -0.64, 0);
    const leftSock = new THREE.Mesh(sockGeo, woolMat);
    leftLegGroup.add(leftSock);

    // Heavy leather explorer boot
    const bootGeo = new THREE.BoxGeometry(0.27, 0.24, 0.38);
    bootGeo.translate(0, -0.76, 0.05);
    const leftBoot = new THREE.Mesh(bootGeo, leatherMat);
    leftBoot.castShadow = true;
    leftLegGroup.add(leftBoot);
    root.add(leftLegGroup);

    // 6. Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-0.21, 0.88, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);

    const rightSock = new THREE.Mesh(sockGeo, woolMat);
    rightLegGroup.add(rightSock);

    const rightBoot = new THREE.Mesh(bootGeo, leatherMat);
    rightBoot.castShadow = true;
    rightLegGroup.add(rightBoot);
    root.add(rightLegGroup);

    return {
      root,
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      head: headGroup,
      torso,
    };
  }

  public teleport(x: number, y: number, z: number, yaw: number = 0) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.group.position.set(x, y, z);
    this.group.rotation.y = yaw;
    this.cameraYaw = yaw;
    this.cameraPitch = 0.25;
    this.updateCameraImmediate();
  }

  public update(delta: number, input: InputState, canMove: boolean = true) {
    // 1. Camera Look Rotation (orbit around player)
    const sens = 0.003;
    if (input.mouseDeltaX !== 0 || input.mouseDeltaY !== 0) {
      this.cameraYaw -= input.mouseDeltaX * sens;
      this.cameraPitch += input.mouseDeltaY * sens;
      // Clamp vertical pitch to avoid flipping over
      this.cameraPitch = Math.max(-0.4, Math.min(1.2, this.cameraPitch));
    }

    // 2. Player Input Movement direction relative to camera
    const moveDir = new THREE.Vector3();
    if (canMove) {
      if (input.forward) moveDir.z -= 1;
      if (input.backward) moveDir.z += 1;
      if (input.left) moveDir.x -= 1;
      if (input.right) moveDir.x += 1;
    }

    const isMoving = moveDir.lengthSq() > 0.001;

    // Sprint & Stamina Mechanics
    const wantsSprint = canMove && input.sprint && isMoving && !this.isExhausted && this.stamina > 4;
    if (wantsSprint) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - 20 * delta);
      if (this.stamina <= 0) {
        this.isExhausted = true;
        sound.playExhausted();
      }
    } else {
      this.isSprinting = false;
      if (!isMoving) {
        // Recover while resting/standing still (+35/sec)
        this.stamina = Math.min(this.maxStamina, this.stamina + 35 * delta);
      } else {
        // Recover steadily while walking normally (+18/sec)
        this.stamina = Math.min(this.maxStamina, this.stamina + 18 * delta);
      }
      if (this.isExhausted && this.stamina >= 20) {
        this.isExhausted = false;
      }
    }

    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      moveDir.normalize();
      // Rotate move direction according to camera yaw
      const forwardAngle = this.cameraYaw;
      const moveAngle = Math.atan2(moveDir.x, moveDir.z) + forwardAngle;

      const targetX = Math.sin(moveAngle) * currentSpeed;
      const targetZ = Math.cos(moveAngle) * currentSpeed;

      this.velocity.x = targetX;
      this.velocity.z = targetZ;

      // Smoothly rotate player mesh to face movement direction
      const currentRot = this.group.rotation.y;
      // Shortest angle difference
      let diff = (moveAngle - currentRot) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * Math.min(1, delta * 12);

      // Walk / Sprint animation
      const animRate = this.isSprinting ? 15 : 10;
      this.walkAnimTime += delta * animRate;
      const legAngle = Math.sin(this.walkAnimTime) * (this.isSprinting ? 0.85 : 0.6);
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = -legAngle * 0.7;
      this.rightArm.rotation.x = legAngle * 0.7;
      this.torso.position.y = 1.25 + Math.abs(Math.sin(this.walkAnimTime * 2)) * 0.05;

      // Footstep audio
      this.footstepTimer += delta;
      const stepInterval = this.isSprinting ? 0.22 : 0.35;
      if (this.footstepTimer > stepInterval && this.isGrounded) {
        sound.playFootstep();
        this.footstepTimer = 0;
      }
    } else {
      // Idle deceleration
      this.velocity.x *= Math.max(0, 1 - delta * 12);
      this.velocity.z *= Math.max(0, 1 - delta * 12);

      // Return limbs smoothly to idle
      this.leftLeg.rotation.x *= 0.85;
      this.rightLeg.rotation.x *= 0.85;
      this.leftArm.rotation.x *= 0.85;
      this.rightArm.rotation.x *= 0.85;
      this.torso.position.y = 1.25 + Math.sin(Date.now() * 0.003) * 0.02; // breathing
    }

    // 3. Jump and Gravity
    if (canMove && input.jump && this.isGrounded) {
      if (this.stamina >= 10) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.highestAirY = this.position.y;
        this.stamina = Math.max(0, this.stamina - 10);
        sound.playJump();
      } else {
        sound.playExhausted();
      }
    }

    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
      this.highestAirY = Math.max(this.highestAirY, this.position.y);
    }

    // 4. Position Integration & Ground Collision
    const nextPos = this.position.clone();
    nextPos.x += this.velocity.x * delta;
    nextPos.z += this.velocity.z * delta;
    nextPos.y += this.velocity.y * delta;

    // Check environment obstacles collision (AABB)
    const playerRadius = 0.5;
    let hitObstacle = false;
    for (const box of this.collisionObstacles) {
      if (box.isEmpty()) continue;
      if (
        nextPos.x + playerRadius > box.min.x &&
        nextPos.x - playerRadius < box.max.x &&
        nextPos.z + playerRadius > box.min.z &&
        nextPos.z - playerRadius < box.max.z &&
        nextPos.y < box.max.y &&
        nextPos.y + 1.8 > box.min.y
      ) {
        hitObstacle = true;
        break;
      }
    }

    if (!hitObstacle) {
      this.position.x = nextPos.x;
      this.position.z = nextPos.z;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Ground height check & Fall damage calculation
    const groundY = this.groundHeightFunc(this.position.x, this.position.z);
    if (nextPos.y <= groundY) {
      if (!this.isGrounded) {
        // Just touched down from air
        const fallDistance = this.highestAirY - groundY;
        if (fallDistance > 4.5) {
          const fallDmg = Math.min(45, Math.round((fallDistance - 4.5) * 8 + 12));
          this.takeDamage(fallDmg, 'Fall Impact');
        }
        this.highestAirY = groundY;
      }
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextPos.y;
      this.isGrounded = false;
    }

    // Damage cooldown timer
    if (this.damageInvulnTimer > 0) {
      this.damageInvulnTimer = Math.max(0, this.damageInvulnTimer - delta);
    }

    // Notify state listener
    this.onStatsChange?.(Math.round(this.health), Math.round(this.stamina));

    // Update character model position
    this.group.position.copy(this.position);

    // 5. Camera Update (Third-Person Over-The-Shoulder follow)
    this.updateCamera(delta);
  }

  public takeDamage(amount: number, reason: string = 'Hazard') {
    if (this.damageInvulnTimer > 0) return;
    this.damageInvulnTimer = 0.85; // 0.85s grace period
    this.health = Math.max(0, this.health - amount);
    sound.playHurt();
    this.onTakeDamage?.(amount, reason);
    this.onStatsChange?.(Math.round(this.health), Math.round(this.stamina));
  }

  public heal(amount: number) {
    if (this.health >= this.maxHealth) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
    sound.playHeal();
    this.onStatsChange?.(Math.round(this.health), Math.round(this.stamina));
  }

  private updateCamera(delta: number) {
    const targetLook = this.position.clone().add(this.cameraTargetOffset);
    this.currentLookTarget.lerp(targetLook, Math.min(1, delta * 14));

    // Spherical coordinates from yaw & pitch
    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    const camX = this.currentLookTarget.x + this.cameraDistance * cosPitch * sinYaw;
    const camY = this.currentLookTarget.y + this.cameraDistance * sinPitch;
    const camZ = this.currentLookTarget.z + this.cameraDistance * cosPitch * cosYaw;

    // Ensure camera stays above ground
    const camGround = this.groundHeightFunc(camX, camZ) + 0.6;
    const finalCamY = Math.max(camY, camGround);

    this.camera.position.set(camX, finalCamY, camZ);
    this.camera.lookAt(this.currentLookTarget);
  }

  private updateCameraImmediate() {
    const targetLook = this.position.clone().add(this.cameraTargetOffset);
    this.currentLookTarget.copy(targetLook);

    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    const camX = this.currentLookTarget.x + this.cameraDistance * cosPitch * sinYaw;
    const camY = this.currentLookTarget.y + this.cameraDistance * sinPitch;
    const camZ = this.currentLookTarget.z + this.cameraDistance * cosPitch * cosYaw;
    const camGround = this.groundHeightFunc(camX, camZ) + 0.6;

    this.camera.position.set(camX, Math.max(camY, camGround), camZ);
    this.camera.lookAt(this.currentLookTarget);
  }
}
