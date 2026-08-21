import * as THREE from 'three';
import { Country, RacerEmotion, RacerState } from '../types';

export interface CharacterMeshHandle {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  leftPupil: THREE.Mesh;
  rightPupil: THREE.Mesh;
  leftEyebrow: THREE.Mesh;
  rightEyebrow: THREE.Mesh;
  mouth: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  nameTag: THREE.Sprite;
  shadowMesh: THREE.Mesh;
  country: Country;
  updateAnimation: (state: RacerState, delta: number) => void;
}

// Generate country flag sphere texture on HTML canvas
export function createCountryTexture(country: Country): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base background
  ctx.fillStyle = country.primaryColor;
  ctx.fillRect(0, 0, 512, 256);

  // Patterns
  switch (country.pattern) {
    case 'stripes-h':
    case 'tricolor-h': {
      ctx.fillStyle = country.secondaryColor;
      ctx.fillRect(0, 85, 512, 85);
      ctx.fillStyle = country.accentColor;
      ctx.fillRect(0, 170, 512, 86);
      break;
    }
    case 'stripes-v':
    case 'tricolor-v': {
      ctx.fillStyle = country.primaryColor;
      ctx.fillRect(0, 0, 170, 256);
      ctx.fillStyle = country.secondaryColor;
      ctx.fillRect(170, 0, 172, 256);
      ctx.fillStyle = country.accentColor;
      ctx.fillRect(342, 0, 170, 256);
      break;
    }
    case 'bicolor-h': {
      ctx.fillStyle = country.secondaryColor;
      ctx.fillRect(0, 128, 512, 128);
      break;
    }
    case 'bicolor-v': {
      ctx.fillStyle = country.secondaryColor;
      ctx.fillRect(256, 0, 256, 256);
      break;
    }
    case 'circle':
    case 'sun': {
      ctx.fillStyle = country.secondaryColor;
      ctx.beginPath();
      ctx.arc(256, 128, 65, 0, Math.PI * 2);
      ctx.fill();
      if (country.accentColor !== country.secondaryColor) {
        ctx.fillStyle = country.accentColor;
        ctx.beginPath();
        ctx.arc(256, 128, 40, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cross': {
      ctx.fillStyle = country.secondaryColor;
      ctx.fillRect(0, 108, 512, 40);
      ctx.fillRect(180, 0, 40, 256);
      if (country.accentColor !== country.secondaryColor) {
        ctx.fillStyle = country.accentColor;
        ctx.fillRect(0, 118, 512, 20);
        ctx.fillRect(190, 0, 20, 256);
      }
      break;
    }
    case 'stars': {
      ctx.fillStyle = country.secondaryColor;
      ctx.fillRect(0, 0, 200, 128);
      ctx.fillStyle = country.accentColor;
      for (let i = 0; i < 5; i++) {
        const x = 40 + (i % 3) * 60;
        const y = 35 + Math.floor(i / 3) * 55;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'diagonal': {
      ctx.fillStyle = country.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(512, 256);
      ctx.lineTo(512, 210);
      ctx.lineTo(0, -46);
      ctx.fill();
      break;
    }
    default: {
      // Solid or decorative sheen
      ctx.fillStyle = country.secondaryColor;
      ctx.beginPath();
      ctx.arc(256, 128, 50, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Add glossy cartoon sheen overlay
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Create Name Tag / Flag Badge Sprite
function createNameTagSprite(country: Country): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 70;
  const ctx = canvas.getContext('2d')!;

  // Background pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(10, 8, 236, 54, 27);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = country.primaryColor;
  ctx.stroke();

  // Flag emoji and name
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${country.flagEmoji} ${country.name}`, 128, 36);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.5, 0.42, 1);
  sprite.position.set(0, 1.4, 0);
  return sprite;
}

export function createCartoonMarbleRacer(country: Country): CharacterMeshHandle {
  const root = new THREE.Group();

  // 1. Marble Body (Sphere)
  const bodyRadius = 0.55;
  const bodyGeo = new THREE.SphereGeometry(bodyRadius, 32, 32);
  const bodyTex = createCountryTexture(country);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: bodyTex,
    roughness: 0.15,
    metalness: 0.25,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.position.y = 0.65;
  root.add(bodyMesh);

  // 2. Eyes
  const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.16, 0.12, 0.48);
  bodyMesh.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.16, 0.12, 0.48);
  bodyMesh.add(rightEye);

  // Pupils
  const pupilGeo = new THREE.SphereGeometry(0.065, 16, 16);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(0, 0, 0.08);
  leftEye.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0, 0, 0.08);
  rightEye.add(rightPupil);

  // Eye highlights
  const highlightGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftHL = new THREE.Mesh(highlightGeo, highlightMat);
  leftHL.position.set(-0.02, 0.02, 0.05);
  leftPupil.add(leftHL);
  const rightHL = new THREE.Mesh(highlightGeo, highlightMat);
  rightHL.position.set(-0.02, 0.02, 0.05);
  rightPupil.add(rightHL);

  // 3. Eyebrows
  const browGeo = new THREE.BoxGeometry(0.14, 0.035, 0.04);
  const browMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  const leftEyebrow = new THREE.Mesh(browGeo, browMat);
  leftEyebrow.position.set(-0.16, 0.26, 0.47);
  leftEyebrow.rotation.z = 0.05;
  bodyMesh.add(leftEyebrow);

  const rightEyebrow = new THREE.Mesh(browGeo, browMat);
  rightEyebrow.position.set(0.16, 0.26, 0.47);
  rightEyebrow.rotation.z = -0.05;
  bodyMesh.add(rightEyebrow);

  // 4. Mouth
  const mouthGeo = new THREE.TorusGeometry(0.09, 0.025, 8, 16, Math.PI);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.rotation.x = Math.PI * 0.5;
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.15, 0.5);
  bodyMesh.add(mouth);

  // 5. Cartoon Arms & Hands
  const armMat = new THREE.MeshStandardMaterial({ color: country.primaryColor, roughness: 0.4 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.52, 0.0, 0.0);
  bodyMesh.add(leftArm);

  const leftUpperArmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.32, 12);
  const leftUpperArm = new THREE.Mesh(leftUpperArmGeo, armMat);
  leftUpperArm.position.y = -0.16;
  leftArm.add(leftUpperArm);

  const leftGloveGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const leftGlove = new THREE.Mesh(leftGloveGeo, gloveMat);
  leftGlove.position.y = -0.32;
  leftArm.add(leftGlove);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.52, 0.0, 0.0);
  bodyMesh.add(rightArm);

  const rightUpperArmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.32, 12);
  const rightUpperArm = new THREE.Mesh(rightUpperArmGeo, armMat);
  rightUpperArm.position.y = -0.16;
  rightArm.add(rightUpperArm);

  const rightGloveGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const rightGlove = new THREE.Mesh(rightGloveGeo, gloveMat);
  rightGlove.position.y = -0.32;
  rightArm.add(rightGlove);

  // 6. Cartoon Legs & Running Shoes
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: country.secondaryColor || 0xffffff, roughness: 0.3 });

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.25, 0);
  root.add(leftLeg);

  const leftThighGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.28, 12);
  const leftThigh = new THREE.Mesh(leftThighGeo, legMat);
  leftThigh.position.y = -0.14;
  leftLeg.add(leftThigh);

  const leftShoeGeo = new THREE.BoxGeometry(0.14, 0.1, 0.24);
  const leftShoe = new THREE.Mesh(leftShoeGeo, shoeMat);
  leftShoe.position.set(0, -0.28, 0.05);
  leftShoe.castShadow = true;
  leftLeg.add(leftShoe);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.25, 0);
  root.add(rightLeg);

  const rightThighGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.28, 12);
  const rightThigh = new THREE.Mesh(rightThighGeo, legMat);
  rightThigh.position.y = -0.14;
  rightLeg.add(rightThigh);

  const rightShoeGeo = new THREE.BoxGeometry(0.14, 0.1, 0.24);
  const rightShoe = new THREE.Mesh(rightShoeGeo, shoeMat);
  rightShoe.position.set(0, -0.28, 0.05);
  rightShoe.castShadow = true;
  rightLeg.add(rightShoe);

  // 7. Ground Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(0.48, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI * 0.5;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // 8. Name Tag
  const nameTag = createNameTagSprite(country);
  root.add(nameTag);

  // Animation Updater Function
  const updateAnimation = (state: RacerState, delta: number) => {
    root.position.set(state.position.x, state.position.y, state.position.z);
    root.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);

    // Update emotions & facial gestures
    switch (state.emotion) {
      case 'jumping':
      case 'excited': {
        leftEyebrow.rotation.z = -0.25;
        rightEyebrow.rotation.z = 0.25;
        leftEyebrow.position.y = 0.32;
        rightEyebrow.position.y = 0.32;
        mouth.scale.set(1.2, 1.2, 1.2);
        mouth.rotation.x = Math.PI * 0.3; // Open smiling mouth
        break;
      }
      case 'falling':
      case 'worried': {
        leftEyebrow.rotation.z = 0.35;
        rightEyebrow.rotation.z = -0.35;
        leftEyebrow.position.y = 0.28;
        rightEyebrow.position.y = 0.28;
        mouth.scale.set(0.8, 1.4, 0.8);
        mouth.rotation.x = 0; // 'O' gasp shape
        break;
      }
      case 'celebrating': {
        leftEyebrow.rotation.z = -0.15;
        rightEyebrow.rotation.z = 0.15;
        mouth.scale.set(1.4, 1.3, 1.3);
        mouth.rotation.x = Math.PI * 0.6;
        break;
      }
      case 'sad': {
        leftEyebrow.rotation.z = 0.25;
        rightEyebrow.rotation.z = -0.25;
        leftEyebrow.position.y = 0.22;
        rightEyebrow.position.y = 0.22;
        mouth.rotation.z = 0; // Frown
        mouth.scale.set(0.9, 0.7, 0.9);
        break;
      }
      default: {
        // Normal Running / Determined
        leftEyebrow.rotation.z = 0.08;
        rightEyebrow.rotation.z = -0.08;
        leftEyebrow.position.y = 0.26;
        rightEyebrow.position.y = 0.26;
        mouth.scale.set(1, 1, 1);
        mouth.rotation.x = Math.PI * 0.5;
        mouth.rotation.z = Math.PI;
      }
    }

    // Running / Jumping / Falling limb kinematics
    if (state.isFalling) {
      // Windmilling arms and flailing legs
      leftArm.rotation.x = Math.sin(state.armPhase * 4) * 1.5;
      rightArm.rotation.x = -Math.sin(state.armPhase * 4) * 1.5;
      leftArm.rotation.z = -0.8;
      rightArm.rotation.z = 0.8;

      leftLeg.rotation.x = Math.cos(state.legPhase * 3) * 0.8;
      rightLeg.rotation.x = -Math.cos(state.legPhase * 3) * 0.8;
      bodyMesh.position.y = 0.65;
      shadowMesh.scale.set(0.5, 0.5, 0.5);
      shadowMesh.material.opacity = 0.15;
    } else if (state.isJumping) {
      // Jump posture: arms up & back, knees tucked
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      leftArm.rotation.z = -0.6;
      rightArm.rotation.z = 0.6;

      leftLeg.rotation.x = -0.6;
      rightLeg.rotation.x = -0.4;
      bodyMesh.position.y = 0.65;
      shadowMesh.scale.set(0.7, 0.7, 0.7);
      shadowMesh.material.opacity = 0.25;
    } else if (state.emotion === 'celebrating') {
      // Winner victory arms in the air
      leftArm.rotation.x = -2.4 + Math.sin(Date.now() * 0.01) * 0.3;
      rightArm.rotation.x = -2.4 - Math.sin(Date.now() * 0.01) * 0.3;
      leftArm.rotation.z = -0.4;
      rightArm.rotation.z = 0.4;
      bodyMesh.position.y = 0.65 + Math.abs(Math.sin(Date.now() * 0.012)) * 0.25;
    } else if (state.emotion === 'sad') {
      // Sad eliminated posture
      leftArm.rotation.x = 0.4;
      rightArm.rotation.x = 0.4;
      leftArm.rotation.z = -0.1;
      rightArm.rotation.z = 0.1;
      bodyMesh.position.y = 0.5;
    } else {
      // Natural Cartoon Running
      const runSpeed = state.speed > 0.05 ? state.speed : 1.0;
      const legAngle = Math.sin(state.legPhase) * 0.85;
      const armAngle = Math.cos(state.armPhase) * 0.75;

      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;

      leftArm.rotation.x = -armAngle;
      rightArm.rotation.x = armAngle;
      leftArm.rotation.z = -0.2;
      rightArm.rotation.z = 0.2;

      // Cute body bounce
      const bounce = Math.abs(Math.sin(state.legPhase * 2)) * 0.08;
      bodyMesh.position.y = 0.65 + bounce;

      // Shadow squish
      shadowMesh.scale.set(1 - bounce * 1.5, 1 - bounce * 1.5, 1 - bounce * 1.5);
      shadowMesh.material.opacity = 0.45;
    }
  };

  return {
    root,
    bodyMesh,
    leftEye,
    rightEye,
    leftPupil,
    rightPupil,
    leftEyebrow,
    rightEyebrow,
    mouth,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    nameTag,
    shadowMesh,
    country,
    updateAnimation,
  };
}
