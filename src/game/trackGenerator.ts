import * as THREE from 'three';
import { CheckpointGate, LevelConfig, ObstacleInstance, TrackPoint, TrackSegmentType } from '../types';

export interface GeneratedTrackData {
  points: TrackPoint[];
  curve: THREE.CatmullRomCurve3;
  trackMeshGroup: THREE.Group;
  checkpoints: CheckpointGate[];
  obstacles: ObstacleInstance[];
  obstacleMeshes: { instance: ObstacleInstance; mesh: THREE.Object3D }[];
  startPosition: THREE.Vector3;
  finishPosition: THREE.Vector3;
  totalLength: number;
}

export function generateTrack(levelConfig: LevelConfig): GeneratedTrackData {
  const group = new THREE.Group();
  const rawWaypoints: THREE.Vector3[] = [];
  const checkpoints: CheckpointGate[] = [];
  const obstacles: ObstacleInstance[] = [];
  const obstacleMeshes: { instance: ObstacleInstance; mesh: THREE.Object3D }[] = [];

  // Theme Palette
  let roadColor = 0x111827;
  let curbColor = 0x38bdf8;
  let railColor = 0x0ea5e9;
  let supportColor = 0x1e293b;
  let pillarGlow = 0x0284c7;
  let chevronColor = 0x38bdf8;

  if (levelConfig.theme === 'sunset_canyon') {
    roadColor = 0x1f1724;
    curbColor = 0xf97316;
    railColor = 0xfb923c;
    pillarGlow = 0xe11d48;
    supportColor = 0x2d1a33;
    chevronColor = 0xfacc15;
  } else if (levelConfig.theme === 'cyber_circuit') {
    roadColor = 0x06141c;
    curbColor = 0x10b981;
    railColor = 0x34d399;
    pillarGlow = 0x06b6d4;
    supportColor = 0x0f2922;
    chevronColor = 0x22d3ee;
  } else if (levelConfig.theme === 'cosmic_stadium' || levelConfig.theme === 'gold_arena' || levelConfig.isFinal) {
    roadColor = 0x131109;
    curbColor = 0xeab308;
    railColor = 0xfacc15;
    pillarGlow = 0xca8a04;
    supportColor = 0x28230f;
    chevronColor = 0xfef08a;
  }

  // Build Procedural Waypoints from Segments
  let curPos = new THREE.Vector3(0, 6, 0);
  let curDir = new THREE.Vector3(0, 0, 1);
  let curAngle = 0; // heading angle in radians

  rawWaypoints.push(curPos.clone());

  // Starting straight grid
  for (let i = 1; i <= 3; i++) {
    curPos.add(curDir.clone().multiplyScalar(16));
    rawWaypoints.push(curPos.clone());
  }

  const segments = levelConfig.segmentTypes;
  const totalSegs = segments.length;

  segments.forEach((segType) => {
    switch (segType) {
      case 'straight': {
        curPos.add(curDir.clone().multiplyScalar(30));
        rawWaypoints.push(curPos.clone());
        break;
      }
      case 'left_curve': {
        for (let step = 0; step < 3; step++) {
          curAngle += (Math.PI * 0.25) / 3;
          curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
          curPos.add(curDir.clone().multiplyScalar(15));
          rawWaypoints.push(curPos.clone());
        }
        break;
      }
      case 'right_curve': {
        for (let step = 0; step < 3; step++) {
          curAngle -= (Math.PI * 0.25) / 3;
          curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
          curPos.add(curDir.clone().multiplyScalar(15));
          rawWaypoints.push(curPos.clone());
        }
        break;
      }
      case 'hairpin_left': {
        for (let step = 0; step < 4; step++) {
          curAngle += (Math.PI * 0.45) / 4;
          curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
          curPos.add(curDir.clone().multiplyScalar(12));
          rawWaypoints.push(curPos.clone());
        }
        break;
      }
      case 'hairpin_right': {
        for (let step = 0; step < 4; step++) {
          curAngle -= (Math.PI * 0.45) / 4;
          curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
          curPos.add(curDir.clone().multiplyScalar(12));
          rawWaypoints.push(curPos.clone());
        }
        break;
      }
      case 'ramp_up': {
        curPos.add(curDir.clone().multiplyScalar(20)).add(new THREE.Vector3(0, 6.5, 0));
        rawWaypoints.push(curPos.clone());
        curPos.add(curDir.clone().multiplyScalar(20));
        rawWaypoints.push(curPos.clone());
        break;
      }
      case 'ramp_down': {
        curPos.add(curDir.clone().multiplyScalar(20)).add(new THREE.Vector3(0, -6.5, 0));
        rawWaypoints.push(curPos.clone());
        curPos.add(curDir.clone().multiplyScalar(20));
        rawWaypoints.push(curPos.clone());
        break;
      }
      case 'mega_jump': {
        // Launch crest
        curPos.add(curDir.clone().multiplyScalar(15)).add(new THREE.Vector3(0, 5, 0));
        rawWaypoints.push(curPos.clone());
        // Air gap
        curPos.add(curDir.clone().multiplyScalar(24)).add(new THREE.Vector3(0, -3.5, 0));
        rawWaypoints.push(curPos.clone());
        // Landing pad
        curPos.add(curDir.clone().multiplyScalar(20)).add(new THREE.Vector3(0, -3.5, 0));
        rawWaypoints.push(curPos.clone());
        break;
      }
      case 'narrow_bridge': {
        curPos.add(curDir.clone().multiplyScalar(34));
        rawWaypoints.push(curPos.clone());
        break;
      }
      case 'spiral_down': {
        for (let step = 0; step < 6; step++) {
          curAngle += (Math.PI * 0.35);
          curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
          curPos.add(curDir.clone().multiplyScalar(13)).add(new THREE.Vector3(0, -2.0, 0));
          rawWaypoints.push(curPos.clone());
        }
        break;
      }
      case 'chicane': {
        curAngle += 0.38;
        curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
        curPos.add(curDir.clone().multiplyScalar(18));
        rawWaypoints.push(curPos.clone());

        curAngle -= 0.76;
        curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
        curPos.add(curDir.clone().multiplyScalar(20));
        rawWaypoints.push(curPos.clone());

        curAngle += 0.38;
        curDir.set(Math.sin(curAngle), 0, Math.cos(curAngle)).normalize();
        curPos.add(curDir.clone().multiplyScalar(18));
        rawWaypoints.push(curPos.clone());
        break;
      }
      case 'rotating_sweepers':
      case 'bumping_field':
      case 'moving_platforms':
      case 'speed_tunnel': {
        curPos.add(curDir.clone().multiplyScalar(32));
        rawWaypoints.push(curPos.clone());
        break;
      }
      default: {
        curPos.add(curDir.clone().multiplyScalar(26));
        rawWaypoints.push(curPos.clone());
      }
    }
  });

  // Final Straightaway toward Grand Finish Arch
  curPos.add(curDir.clone().multiplyScalar(38));
  rawWaypoints.push(curPos.clone());

  // Create Smooth Catmull-Rom Spline Curve
  const spline = new THREE.CatmullRomCurve3(rawWaypoints, false, 'centripetal', 0.5);
  const totalLength = spline.getLength();
  const sampleCount = Math.max(280, Math.floor(totalLength / 1.8));
  const points: TrackPoint[] = [];

  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const pt = spline.getPoint(t);
    const tangent = spline.getTangent(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    points.push({
      x: pt.x,
      y: pt.y,
      z: pt.z,
      tangent: { x: tangent.x, y: tangent.y, z: tangent.z },
      normal: { x: normal.x, y: normal.y, z: normal.z },
      binormal: { x: binormal.x, y: binormal.y, z: binormal.z },
      width: 5.6,
      hasRails: true,
    });
  }

  // --- Build 3D Road Mesh Ribbon with Sub-Road Scaffolding ---
  const roadGeo = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const railGeoLeft = new THREE.BufferGeometry();
  const railGeoRight = new THREE.BufferGeometry();
  const railVertsL: number[] = [];
  const railVertsR: number[] = [];
  const lowerGlowL: number[] = [];
  const lowerGlowR: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const halfW = p.width * 0.5;

    // Road left & right edge
    const lx = p.x - p.binormal.x * halfW;
    const ly = p.y - p.binormal.y * halfW;
    const lz = p.z - p.binormal.z * halfW;

    const rx = p.x + p.binormal.x * halfW;
    const ry = p.y + p.binormal.y * halfW;
    const rz = p.z + p.binormal.z * halfW;

    vertices.push(lx, ly, lz);
    normals.push(p.normal.x, p.normal.y, p.normal.z);
    uvs.push(0, i / 4);

    vertices.push(rx, ry, rz);
    normals.push(p.normal.x, p.normal.y, p.normal.z);
    uvs.push(1, i / 4);

    // High Neon guard rails
    railVertsL.push(lx, ly + 0.45, lz);
    railVertsR.push(rx, ry + 0.45, rz);

    // Lower Energy Trim
    lowerGlowL.push(lx, ly - 0.2, lz);
    lowerGlowR.push(rx, ry - 0.2, rz);

    if (i < points.length - 1) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;

      indices.push(v0, v1, v2);
      indices.push(v1, v3, v2);
    }
  }

  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);

  const roadMat = new THREE.MeshStandardMaterial({
    color: roadColor,
    roughness: 0.35,
    metalness: 0.45,
    side: THREE.DoubleSide,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Guard rails line / tube
  const railMat = new THREE.MeshBasicMaterial({ color: railColor });
  const curbMat = new THREE.MeshStandardMaterial({ color: curbColor, roughness: 0.2, emissive: curbColor, emissiveIntensity: 0.6 });
  const lowerGlowMat = new THREE.MeshBasicMaterial({ color: pillarGlow });

  // Neon Curbs (Left & Right)
  railGeoLeft.setAttribute('position', new THREE.Float32BufferAttribute(railVertsL, 3));
  const curbLineL = new THREE.Line(railGeoLeft, curbMat);
  group.add(curbLineL);

  railGeoRight.setAttribute('position', new THREE.Float32BufferAttribute(railVertsR, 3));
  const curbLineR = new THREE.Line(railGeoRight, curbMat);
  group.add(curbLineR);

  // Runway Edge Studs / Glowing LED Markers along track borders
  const studGeo = new THREE.BoxGeometry(0.25, 0.15, 0.6);
  const studMatL = new THREE.MeshBasicMaterial({ color: curbColor });
  const studMatR = new THREE.MeshBasicMaterial({ color: chevronColor });

  for (let i = 2; i < points.length - 2; i += 3) {
    const pt = points[i];
    const halfW = pt.width * 0.5 - 0.15;

    // Left LED stud
    const sL = new THREE.Mesh(studGeo, studMatL);
    sL.position.set(pt.x - pt.binormal.x * halfW, pt.y + 0.08, pt.z - pt.binormal.z * halfW);
    const lookT = new THREE.Vector3(pt.x + pt.tangent.x, pt.y + pt.tangent.y, pt.z + pt.tangent.z);
    sL.lookAt(lookT);
    group.add(sL);

    // Right LED stud
    const sR = new THREE.Mesh(studGeo, studMatR);
    sR.position.set(pt.x + pt.binormal.x * halfW, pt.y + 0.08, pt.z + pt.binormal.z * halfW);
    sR.lookAt(lookT);
    group.add(sR);
  }

  // Lower Energy Conduits
  const lowGeoL = new THREE.BufferGeometry();
  lowGeoL.setAttribute('position', new THREE.Float32BufferAttribute(lowerGlowL, 3));
  const lowLineL = new THREE.Line(lowGeoL, lowerGlowMat);
  group.add(lowLineL);

  const lowGeoR = new THREE.BufferGeometry();
  lowGeoR.setAttribute('position', new THREE.Float32BufferAttribute(lowerGlowR, 3));
  const lowLineR = new THREE.Line(lowGeoR, lowerGlowMat);
  group.add(lowLineR);

  // High-Production Metallic Truss Pillars & Energy Pylons beneath track
  const pillarMat = new THREE.MeshStandardMaterial({ color: supportColor, roughness: 0.5, metalness: 0.7 });
  const glowRingMat = new THREE.MeshBasicMaterial({ color: pillarGlow });
  const chevronMat = new THREE.MeshBasicMaterial({ color: chevronColor });

  for (let i = 6; i < points.length - 6; i += 10) {
    const pt = points[i];
    const pillarHeight = pt.y + 22;

    if (pillarHeight > 1) {
      // Main Support Column
      const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, pillarHeight, 16);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pt.x, (pt.y - 22) / 2, pt.z);
      pillar.castShadow = true;
      group.add(pillar);

      // Cyber Glowing Ring Collar
      const ringGeo = new THREE.TorusGeometry(1.2, 0.12, 8, 16);
      const ring = new THREE.Mesh(ringGeo, glowRingMat);
      ring.position.set(pt.x, pt.y - 0.4, pt.z);
      ring.rotation.x = Math.PI * 0.5;
      group.add(ring);

      // Support Cross-Truss Beam
      const crossBeamGeo = new THREE.BoxGeometry(pt.width + 1.2, 0.5, 0.5);
      const crossBeam = new THREE.Mesh(crossBeamGeo, pillarMat);
      crossBeam.position.set(pt.x, pt.y - 0.3, pt.z);
      const lookAtPt = new THREE.Vector3(pt.x + pt.tangent.x, pt.y + pt.tangent.y, pt.z + pt.tangent.z);
      crossBeam.lookAt(lookAtPt);
      crossBeam.rotateY(Math.PI / 2);
      group.add(crossBeam);

      // High-Gantry Trackside Floodlights (illuminating track surface)
      if (i % 16 === 0) {
        const gantry = createTracksideFloodlightGantry(pt, curbColor);
        group.add(gantry);
      }

      // Neon Holographic Overhead Sponsor Rings
      if (i % 36 === 0) {
        const holoRing = createHoloSponsorRing(pt, levelConfig.theme);
        group.add(holoRing);
      }
    }
  }

  // --- Place Checkpoint Gates (4-6 Checkpoints) ---
  const checkpointInterval = Math.floor(points.length / 5);
  for (let cpIdx = 1; cpIdx <= 4; cpIdx++) {
    const ptIdx = cpIdx * checkpointInterval;
    if (ptIdx < points.length) {
      const pt = points[ptIdx];
      const gateObj = createCheckpointArch(cpIdx, 4, curbColor);
      gateObj.position.set(pt.x, pt.y, pt.z);

      const lookTarget = new THREE.Vector3(pt.x + pt.tangent.x, pt.y + pt.tangent.y, pt.z + pt.tangent.z);
      gateObj.lookAt(lookTarget);
      group.add(gateObj);

      checkpoints.push({
        index: cpIdx,
        totalCheckpoints: 4,
        position: { x: pt.x, y: pt.y, z: pt.z },
        rotation: { x: gateObj.rotation.x, y: gateObj.rotation.y, z: gateObj.rotation.z },
        trackProgress: ptIdx / points.length,
        width: pt.width,
      });

      // Mid-sector elevated viewing grandstand along checkpoints
      if (cpIdx === 2 || cpIdx === 3) {
        const sectorStand = createSectorSpectatorStand(pt, curbColor);
        group.add(sectorStand);
      }
    }
  }

  // --- Start Gate & Finish Line Gate ---
  const startPt = points[2];
  const startArch = createStartGate(levelConfig);
  startArch.position.set(startPt.x, startPt.y, startPt.z);
  startArch.lookAt(startPt.x + startPt.tangent.x, startPt.y + startPt.tangent.y, startPt.z + startPt.tangent.z);
  group.add(startArch);

  const finishPt = points[points.length - 3];
  const finishArch = createFinishArch(levelConfig, curbColor);
  finishArch.position.set(finishPt.x, finishPt.y, finishPt.z);
  finishArch.lookAt(finishPt.x + finishPt.tangent.x, finishPt.y + finishPt.tangent.y, finishPt.z + finishPt.tangent.z);
  group.add(finishArch);

  // Stadium grandstand crowds along finish stretch
  const stadiumFinish = createGrandFinalStadium(finishPt, points, levelConfig.isFinal);
  group.add(stadiumFinish);

  // --- Place Dynamic Obstacles Based on Level Segments ---
  segments.forEach((segType, idx) => {
    const segT = (idx + 0.5) / totalSegs;
    const ptIdx = Math.floor(segT * (points.length - 20)) + 10;
    const pt = points[ptIdx];
    if (!pt) return;

    if (segType === 'rotating_sweepers') {
      const sweeper = createSweeperObstacle();
      sweeper.mesh.position.set(pt.x, pt.y + 0.8, pt.z);
      group.add(sweeper.mesh);
      obstacles.push({
        id: `sweeper_${idx}`,
        type: 'sweeper',
        position: { x: pt.x, y: pt.y + 0.8, z: pt.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        trackProgress: ptIdx / points.length,
        active: true,
        speed: 2.4,
        phase: Math.random() * Math.PI,
      });
      obstacleMeshes.push({ instance: obstacles[obstacles.length - 1], mesh: sweeper.mesh });
    } else if (segType === 'bumping_field') {
      // 3 Pinball Bumpers
      for (let b = -1; b <= 1; b++) {
        const bumper = createBumperObstacle();
        const bx = pt.x + pt.binormal.x * (b * 1.5);
        const by = pt.y + 0.4;
        const bz = pt.z + pt.binormal.z * (b * 1.5);
        bumper.position.set(bx, by, bz);
        group.add(bumper);

        obstacles.push({
          id: `bumper_${idx}_${b}`,
          type: 'bumper',
          position: { x: bx, y: by, z: bz },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          trackProgress: ptIdx / points.length,
          active: true,
          speed: 1.0,
          phase: 0,
        });
        obstacleMeshes.push({ instance: obstacles[obstacles.length - 1], mesh: bumper });
      }
    } else if (segType === 'speed_tunnel') {
      // 3 Turbo Booster Rings
      for (let r = 0; r < 3; r++) {
        const ringPt = points[ptIdx + r * 3];
        if (!ringPt) continue;
        const booster = createSpeedBoosterRing();
        booster.position.set(ringPt.x, ringPt.y + 1.2, ringPt.z);
        booster.lookAt(ringPt.x + ringPt.tangent.x, ringPt.y + ringPt.tangent.y, ringPt.z + ringPt.tangent.z);
        group.add(booster);

        obstacles.push({
          id: `boost_${idx}_${r}`,
          type: 'boost_pad',
          position: { x: ringPt.x, y: ringPt.y + 1.2, z: ringPt.z },
          rotation: { x: booster.rotation.x, y: booster.rotation.y, z: booster.rotation.z },
          scale: { x: 1, y: 1, z: 1 },
          trackProgress: (ptIdx + r * 3) / points.length,
          active: true,
          speed: 0,
          phase: 0,
        });
      }
    }
  });

  return {
    points,
    curve: spline,
    trackMeshGroup: group,
    checkpoints,
    obstacles,
    obstacleMeshes,
    startPosition: new THREE.Vector3(startPt.x, startPt.y, startPt.z),
    finishPosition: new THREE.Vector3(finishPt.x, finishPt.y, finishPt.z),
    totalLength,
  };
}

// Trackside Floodlight Gantry
function createTracksideFloodlightGantry(pt: TrackPoint, lightColor: number): THREE.Group {
  const gantry = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: lightColor });

  // Left Post
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 7, 8), metalMat);
  p1.position.set(pt.x - pt.binormal.x * 4.2, pt.y + 3.5, pt.z - pt.binormal.z * 4.2);
  gantry.add(p1);

  // Right Post
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 7, 8), metalMat);
  p2.position.set(pt.x + pt.binormal.x * 4.2, pt.y + 3.5, pt.z + pt.binormal.z * 4.2);
  gantry.add(p2);

  // Top Light Bar
  const bar = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.4, 0.4), metalMat);
  bar.position.set(pt.x, pt.y + 7.0, pt.z);
  const lookTarget = new THREE.Vector3(pt.x + pt.tangent.x, pt.y + pt.tangent.y, pt.z + pt.tangent.z);
  bar.lookAt(lookTarget);
  bar.rotateY(Math.PI / 2);
  gantry.add(bar);

  // 4 Spotlight Fixtures
  for (let s = -3; s <= 3; s += 2) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bulbMat);
    bulb.position.set(pt.x + pt.binormal.x * s, pt.y + 6.8, pt.z + pt.binormal.z * s);
    gantry.add(bulb);
  }

  return gantry;
}

// Holographic Floating Sponsor Ring
function createHoloSponsorRing(pt: TrackPoint, theme: string): THREE.Group {
  const group = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(5.2, 0.15, 8, 32);
  const ringCol = theme === 'gold_arena' ? 0xfacc15 : theme === 'cyber_circuit' ? 0x10b981 : 0x38bdf8;
  const ringMat = new THREE.MeshBasicMaterial({ color: ringCol, wireframe: true });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(pt.x, pt.y + 5.5, pt.z);
  const lookTarget = new THREE.Vector3(pt.x + pt.tangent.x, pt.y + pt.tangent.y, pt.z + pt.tangent.z);
  ring.lookAt(lookTarget);
  group.add(ring);

  // Holographic Ad Banner Sprite
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(6, 9, 19, 0.85)';
  ctx.roundRect(10, 10, 492, 108, 16);
  ctx.fill();
  ctx.strokeStyle = theme === 'gold_arena' ? '#facc15' : '#38bdf8';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = '900 36px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡ WORLD MARBLE GP ⚡', 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const bannerSprite = new THREE.Sprite(spriteMat);
  bannerSprite.scale.set(6.4, 1.6, 1);
  bannerSprite.position.set(pt.x, pt.y + 5.5, pt.z);
  group.add(bannerSprite);

  return group;
}

// --- Checkpoint Arch with 3D Banner ---
function createCheckpointArch(index: number, total: number, color: number): THREE.Group {
  const group = new THREE.Group();

  const archMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.5 });
  const neonMat = new THREE.MeshBasicMaterial({ color });

  // Left & Right Pillars
  const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 5.2, 16);
  const leftPillar = new THREE.Mesh(pillarGeo, archMat);
  leftPillar.position.set(-3.2, 2.6, 0);
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, archMat);
  rightPillar.position.set(3.2, 2.6, 0);
  group.add(rightPillar);

  // Top Crossbeam
  const beamGeo = new THREE.BoxGeometry(6.8, 0.5, 0.5);
  const beam = new THREE.Mesh(beamGeo, archMat);
  beam.position.set(0, 5.0, 0);
  group.add(beam);

  // Neon Arch Frame
  const neonRingGeo = new THREE.TorusGeometry(3.3, 0.1, 8, 24, Math.PI);
  const neonArch = new THREE.Mesh(neonRingGeo, neonMat);
  neonArch.position.set(0, 1.7, 0);
  group.add(neonArch);

  // Checkpoint Text Canvas Sprite
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.roundRect(5, 5, 246, 54, 12);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SECTOR CP ${index}/${total}`, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const bannerSprite = new THREE.Sprite(spriteMat);
  bannerSprite.scale.set(4.0, 1.0, 1);
  bannerSprite.position.set(0, 5.8, 0);
  group.add(bannerSprite);

  return group;
}

// --- Start Gate ---
function createStartGate(levelConfig: LevelConfig): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 6, 16), mat);
  left.position.set(-3.5, 3.0, 0);
  group.add(left);

  const right = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 6, 16), mat);
  right.position.set(3.5, 3.0, 0);
  group.add(right);

  const top = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.7, 0.7), mat);
  top.position.set(0, 5.8, 0);
  group.add(top);

  // Banner
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(8, 8, 496, 112);

  ctx.font = '900 42px sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`STAGE ${levelConfig.levelNumber} START`, 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(5.8, 1.45, 1);
  sprite.position.set(0, 6.8, 0);
  group.add(sprite);

  return group;
}

// --- Finish Arch ---
function createFinishArch(levelConfig: LevelConfig, color: number): THREE.Group {
  const group = new THREE.Group();
  const archMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.6 });

  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 7, 16), archMat);
  left.position.set(-3.6, 3.5, 0);
  group.add(left);

  const right = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 7, 16), archMat);
  right.position.set(3.6, 3.5, 0);
  group.add(right);

  const top = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.9, 0.9), archMat);
  top.position.set(0, 6.8, 0);
  group.add(top);

  // Chequered Finish Banner
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < 128; y += 32) {
    for (let x = 0; x < 512; x += 32) {
      ctx.fillStyle = (x / 32 + y / 32) % 2 === 0 ? '#FFFFFF' : '#000000';
      ctx.fillRect(x, y, 32, 32);
    }
  }

  ctx.fillStyle = levelConfig.isFinal ? '#eab308' : '#38bdf8';
  ctx.fillRect(40, 20, 432, 88);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(46, 26, 420, 76);

  ctx.font = '900 44px sans-serif';
  ctx.fillStyle = levelConfig.isFinal ? '#facc15' : '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(levelConfig.isFinal ? '🏆 GRAND FINAL FINISH 🏆' : '🏁 FINISH LINE 🏁', 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(6.6, 1.65, 1);
  sprite.position.set(0, 7.8, 0);
  group.add(sprite);

  return group;
}

// --- Obstacle Builders ---

function createSweeperObstacle(): { mesh: THREE.Group } {
  const group = new THREE.Group();

  const pivotGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.9, 16);
  const pivotMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
  const pivot = new THREE.Mesh(pivotGeo, pivotMat);
  group.add(pivot);

  const barGeo = new THREE.BoxGeometry(5.0, 0.4, 0.4);
  const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.5 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.y = 0.25;
  group.add(bar);

  // Warning Stripes
  const warningGeo = new THREE.BoxGeometry(1.3, 0.42, 0.42);
  const warningMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const wL = new THREE.Mesh(warningGeo, warningMat);
  wL.position.set(-1.85, 0.25, 0);
  group.add(wL);
  const wR = new THREE.Mesh(warningGeo, warningMat);
  wR.position.set(1.85, 0.25, 0);
  group.add(wR);

  return { mesh: group };
}

function createBumperObstacle(): THREE.Mesh {
  const bumperGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.65, 24);
  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    roughness: 0.1,
    metalness: 0.5,
    emissive: 0xdb2777,
    emissiveIntensity: 0.5,
  });
  const mesh = new THREE.Mesh(bumperGeo, bumperMat);
  mesh.castShadow = true;
  return mesh;
}

function createSpeedBoosterRing(): THREE.Group {
  const group = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(2.5, 0.2, 12, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  group.add(ring);

  for (let i = 0; i < 4; i++) {
    const arrowGeo = new THREE.ConeGeometry(0.35, 0.7, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    const ang = (i * Math.PI) / 2;
    arrow.position.set(Math.cos(ang) * 2.1, Math.sin(ang) * 2.1, 0);
    arrow.rotation.z = ang - Math.PI * 0.5;
    group.add(arrow);
  }

  return group;
}

// --- Grand Final Stadium / Trackside Grandstand Audience ---
function createGrandFinalStadium(finishPt: TrackPoint, points: TrackPoint[], isFinal: boolean): THREE.Group {
  const stadium = new THREE.Group();
  const standMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.4 });
  const seatMat1 = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
  const seatMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
  const seatMat3 = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  const seatMat4 = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  // Stadium Stands along final stretch
  [-11, 11].forEach(offsetX => {
    const standGeo = new THREE.BoxGeometry(7, 5, 55);
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(finishPt.x + finishPt.binormal.x * offsetX, finishPt.y + 1.8, finishPt.z + finishPt.binormal.z * offsetX);
    stadium.add(stand);

    // Spectators
    for (let row = 0; row < 3; row++) {
      for (let col = -10; col < 10; col++) {
        const crowdMat = (row + col) % 4 === 0 ? seatMat1 : (row + col) % 4 === 1 ? seatMat2 : (row + col) % 4 === 2 ? seatMat3 : seatMat4;
        const personGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
        const person = new THREE.Mesh(personGeo, crowdMat);
        person.position.set(
          finishPt.x + finishPt.binormal.x * (offsetX + (offsetX > 0 ? -row * 1.3 : row * 1.3)),
          finishPt.y + 3.8 + row * 1.1,
          finishPt.z + col * 2.4
        );
        stadium.add(person);
      }
    }
  });

  // Trackside Tower Floodlights
  [-14, 14].forEach(offsetX => {
    for (let zOffset of [-18, 0, 18]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 14, 8), standMat);
      tower.position.set(finishPt.x + finishPt.binormal.x * offsetX, finishPt.y + 7, finishPt.z + zOffset);
      stadium.add(tower);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.2), new THREE.MeshBasicMaterial({ color: isFinal ? 0xfef08a : 0xffffff }));
      lamp.position.set(finishPt.x + finishPt.binormal.x * offsetX, finishPt.y + 14, finishPt.z + zOffset);
      stadium.add(lamp);
    }
  });

  return stadium;
}

// --- Sector Mid-Track Spectator Pod ---
function createSectorSpectatorStand(pt: TrackPoint, color: number): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  const neonMat = new THREE.MeshBasicMaterial({ color });

  const crowdColors = [
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
    new THREE.MeshBasicMaterial({ color: 0x10b981 }),
    new THREE.MeshBasicMaterial({ color: 0xec4899 }),
  ];

  // Elevated spectator deck on outside of track
  const deckGeo = new THREE.BoxGeometry(6.5, 1.2, 16.0);
  const deck = new THREE.Mesh(deckGeo, metalMat);
  deck.position.set(pt.x + pt.binormal.x * 7.5, pt.y + 2.5, pt.z + pt.binormal.z * 7.5);
  const lookTarget = new THREE.Vector3(pt.x + pt.tangent.x, pt.y + pt.tangent.y, pt.z + pt.tangent.z);
  deck.lookAt(lookTarget);
  deck.rotateY(Math.PI / 2);
  group.add(deck);

  // Deck Glow Trim
  const trimGeo = new THREE.BoxGeometry(6.7, 0.25, 16.2);
  const trim = new THREE.Mesh(trimGeo, neonMat);
  trim.position.copy(deck.position);
  trim.rotation.copy(deck.rotation);
  group.add(trim);

  // Spectators on deck
  for (let r = 0; r < 2; r++) {
    for (let c = -3; c <= 3; c++) {
      const pMat = crowdColors[Math.abs(r * 3 + c) % crowdColors.length];
      const person = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), pMat);
      person.position.set(
        pt.x + pt.binormal.x * (6.5 + r * 1.5) + pt.tangent.x * (c * 1.8),
        pt.y + 3.5,
        pt.z + pt.binormal.z * (6.5 + r * 1.5) + pt.tangent.z * (c * 1.8)
      );
      group.add(person);
    }
  }

  // Floodlight on stand
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 8, 8), metalMat);
  pole.position.set(pt.x + pt.binormal.x * 9.5, pt.y + 6.0, pt.z + pt.binormal.z * 9.5);
  group.add(pole);

  const floodlight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  floodlight.position.set(pt.x + pt.binormal.x * 9.5, pt.y + 10.0, pt.z + pt.binormal.z * 9.5);
  group.add(floodlight);

  return group;
}

