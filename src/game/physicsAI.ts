import * as THREE from 'three';
import { commentary } from './commentary';
import { sound } from './audio';
import { GeneratedTrackData } from './trackGenerator';
import { Country, RacerState } from '../types';

export function initializeRacers(countries: Country[], track: GeneratedTrackData): RacerState[] {
  const racers: RacerState[] = [];
  const startPt = track.points[0];

  countries.forEach((country, index) => {
    // Grid staggered start (2x2 or 3x3 lanes)
    const row = Math.floor(index / 3);
    const col = (index % 3) - 1; // -1, 0, 1

    const initialProgress = Math.max(0, 0.005 - row * 0.004);
    const laneOffset = col * 0.55;

    const ptIndex = Math.min(track.points.length - 1, Math.floor(initialProgress * track.points.length));
    const pt = track.points[ptIndex] || track.points[0];

    const posX = pt.x + pt.binormal.x * (laneOffset * (pt.width * 0.4));
    const posY = pt.y + 0.1;
    const posZ = pt.z + pt.binormal.z * (laneOffset * (pt.width * 0.4));

    racers.push({
      country,
      position: { x: posX, y: posY, z: posZ },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.atan2(pt.tangent.x, pt.tangent.z), z: 0 },
      trackProgress: initialProgress,
      currentSegmentIndex: 0,
      lastCheckpointIndex: 0,
      laneOffset: laneOffset,
      targetLaneOffset: laneOffset,
      speed: 0,
      isGrounded: true,
      isJumping: false,
      isFalling: false,
      isRecovering: false,
      recoveryTimer: 0,
      finished: false,
      finishTime: null,
      currentRank: index + 1,
      previousRank: index + 1,
      emotion: 'determined',
      legPhase: Math.random() * Math.PI * 2,
      armPhase: Math.random() * Math.PI * 2,
      stamina: 100,
      surgeTimer: Math.random() * 5,
      airborneTime: 0,
      totalDistanceTraveled: 0,
      stuckTimer: 0,
      boostTimer: 0,
      isEliminated: false,
      stats: {
        overtakes: 0,
        checkpointsHit: 0,
        timesKnockedOff: 0,
        highestPosition: index + 1,
      },
    });
  });

  return racers;
}

export function updatePhysicsAndAI(
  racers: RacerState[],
  track: GeneratedTrackData,
  delta: number,
  raceTime: number,
  isCountdown: boolean
): { finishCount: number; leadChanged: boolean; newLeader?: RacerState } {
  if (isCountdown) {
    // Just idle bouncing in place during countdown
    racers.forEach((r, idx) => {
      r.legPhase += delta * 4;
      r.armPhase += delta * 4;
    });
    return { finishCount: 0, leadChanged: false };
  }

  const baseSpeedScale = 14.5;
  let finishCount = 0;
  let leadChanged = false;
  let previousLeaderId = racers.find(r => r.currentRank === 1)?.country.id;

  // Step 1: Autonomous AI Decision & Kinematics
  racers.forEach((racer, idx) => {
    if (racer.finished) {
      finishCount++;
      racer.emotion = racer.currentRank <= 3 ? 'celebrating' : 'running';
      return;
    }

    if (racer.isRecovering) {
      racer.recoveryTimer -= delta;
      if (racer.recoveryTimer <= 0) {
        racer.isRecovering = false;
        racer.isFalling = false;
        racer.emotion = 'running';
      } else {
        racer.speed = 0;
        return;
      }
    }

    // Dynamic Surge & Stamina AI
    racer.surgeTimer -= delta;
    if (racer.surgeTimer <= 0) {
      racer.surgeTimer = 4 + Math.random() * 8;
      // 35% chance to trigger a comeback speed surge
      if (Math.random() < 0.4) {
        racer.boostTimer = 1.8 + Math.random() * 1.5;
        racer.emotion = 'excited';
      }
    }

    if (racer.boostTimer > 0) {
      racer.boostTimer -= delta;
    }

    // Target Speed calculation with country traits
    const countryTrait = racer.country.baseSpeed * (0.95 + Math.random() * 0.1);
    const boostMultiplier = racer.boostTimer > 0 ? 1.35 : 1.0;
    const targetSpeed = baseSpeedScale * countryTrait * boostMultiplier;

    // Smooth acceleration
    racer.speed = THREE.MathUtils.lerp(racer.speed, targetSpeed, delta * 3.5 * racer.country.acceleration);

    // AI Lane Choice & Overtaking Maneuvers
    if (Math.random() < delta * 1.5) {
      // Look for racers ahead in same lane to overtake
      const aheadInLane = racers.find(
        other =>
          other !== racer &&
          !other.finished &&
          other.trackProgress > racer.trackProgress &&
          other.trackProgress - racer.trackProgress < 0.04 &&
          Math.abs(other.laneOffset - racer.laneOffset) < 0.4
      );

      if (aheadInLane) {
        // Shift lane to overtake
        racer.targetLaneOffset = racer.laneOffset > 0 ? -0.55 : 0.55;
        racer.emotion = 'excited';
      } else if (Math.random() < 0.2) {
        // Natural racing line exploration
        racer.targetLaneOffset = (Math.random() * 2 - 1) * 0.65;
      }
    }

    // Interpolate lane offset smoothly
    racer.laneOffset = THREE.MathUtils.lerp(racer.laneOffset, racer.targetLaneOffset, delta * 2.8 * racer.country.agility);

    // Advance track progress
    const progressDelta = (racer.speed / track.totalLength) * delta;
    racer.trackProgress += progressDelta;
    racer.totalDistanceTraveled += racer.speed * delta;

    // Clamp / Finish Detection
    if (racer.trackProgress >= 0.985 && !racer.finished) {
      racer.finished = true;
      racer.finishTime = raceTime;
      finishCount++;
      racer.trackProgress = 1.0;
      racer.emotion = racer.currentRank <= 3 ? 'celebrating' : 'running';
      sound.playCrowdCheer(0.9);
    }

    // Get track point and compute 3D coordinate
    const clampedProgress = Math.min(1.0, Math.max(0.0, racer.trackProgress));
    const ptIdxFloat = clampedProgress * (track.points.length - 1);
    const ptIdx = Math.floor(ptIdxFloat);
    const nextPtIdx = Math.min(track.points.length - 1, ptIdx + 1);
    const alpha = ptIdxFloat - ptIdx;

    const p1 = track.points[ptIdx] || track.points[0];
    const p2 = track.points[nextPtIdx] || p1;

    // Spline interpolated track position
    const trackX = THREE.MathUtils.lerp(p1.x, p2.x, alpha);
    const trackY = THREE.MathUtils.lerp(p1.y, p2.y, alpha);
    const trackZ = THREE.MathUtils.lerp(p1.z, p2.z, alpha);

    const binormalX = THREE.MathUtils.lerp(p1.binormal.x, p2.binormal.x, alpha);
    const binormalY = THREE.MathUtils.lerp(p1.binormal.y, p2.binormal.y, alpha);
    const binormalZ = THREE.MathUtils.lerp(p1.binormal.z, p2.binormal.z, alpha);

    const tangentX = THREE.MathUtils.lerp(p1.tangent.x, p2.tangent.x, alpha);
    const tangentY = THREE.MathUtils.lerp(p1.tangent.y, p2.tangent.y, alpha);
    const tangentZ = THREE.MathUtils.lerp(p1.tangent.z, p2.tangent.z, alpha);

    const laneDist = racer.laneOffset * (p1.width * 0.42);

    // Base target on road
    const targetX = trackX + binormalX * laneDist;
    const targetY = trackY + 0.1;
    const targetZ = trackZ + binormalZ * laneDist;

    // Checkpoint gate triggers
    track.checkpoints.forEach(cp => {
      if (racer.trackProgress >= cp.trackProgress && racer.lastCheckpointIndex < cp.index) {
        racer.lastCheckpointIndex = cp.index;
        racer.stats.checkpointsHit++;
        if (racer.currentRank === 1) {
          commentary.onCheckpoint(cp.index, cp.totalCheckpoints, racer.country.name, racer.country.flagEmoji);
        }
      }
    });

    // Jump & Vertical Arc Dynamics (e.g. Ramp crests or Air gaps)
    const isSlopeDrop = p2.y < p1.y - 0.4 && p1.tangent.y > -0.1;
    if (isSlopeDrop && racer.isGrounded && Math.random() < 0.8) {
      racer.isGrounded = false;
      racer.isJumping = true;
      racer.velocity.y = 5.5 * racer.country.jumpPower;
      racer.emotion = 'jumping';
      sound.playJump();
    }

    if (!racer.isGrounded) {
      racer.airborneTime += delta;
      racer.velocity.y -= 18.0 * delta; // Gravity
      racer.position.y += racer.velocity.y * delta;

      if (racer.position.y <= targetY) {
        // Landed
        racer.position.y = targetY;
        racer.isGrounded = true;
        racer.isJumping = false;
        racer.airborneTime = 0;
        racer.velocity.y = 0;
        racer.emotion = 'running';
        sound.playLand();
      }
    } else {
      racer.position.y = THREE.MathUtils.lerp(racer.position.y, targetY, delta * 15);
    }

    // Set position and rotation
    racer.position.x = targetX;
    racer.position.z = targetZ;

    // Face travel direction
    const heading = Math.atan2(tangentX, tangentZ);
    racer.rotation.y = heading;

    // Animation phases
    racer.legPhase += racer.speed * delta * 1.6;
    racer.armPhase += racer.speed * delta * 1.6;
    if (Math.random() < delta * 6) {
      sound.playFootstep();
    }

    // Obstacle Hit Detection (Sweepers & Bumpers)
    track.obstacles.forEach(obs => {
      if (!obs.active) return;
      const dist = Math.hypot(racer.position.x - obs.position.x, racer.position.z - obs.position.z);

      if (obs.type === 'sweeper' && dist < 2.4 && Math.abs(racer.position.y - obs.position.y) < 1.4) {
        // Hit by rotating sweeper
        sound.playBumperHit();
        racer.speed *= 0.35;
        racer.laneOffset = (Math.random() > 0.5 ? 1 : -1) * 0.7;
        racer.emotion = 'worried';
        commentary.onHazardKnockoff(racer.country.name, racer.country.flagEmoji, 'Sweeper Bar');

        // Knock-off fall chance if outside edge
        if (Math.abs(racer.laneOffset) > 0.85) {
          triggerRespawnAtCheckpoint(racer, track);
        }
      } else if (obs.type === 'bumper' && dist < 1.2) {
        sound.playBumperHit();
        racer.speed *= 0.5;
        racer.laneOffset = -racer.laneOffset * 1.2;
        racer.emotion = 'worried';
      } else if (obs.type === 'boost_pad' && dist < 1.6) {
        sound.playBoost();
        racer.boostTimer = 2.0;
        racer.emotion = 'excited';
      }
    });

    // Fall Off Track Abyss Protection / Respawn Check
    if (racer.position.y < -12.0) {
      triggerRespawnAtCheckpoint(racer, track);
    }
  });

  // Step 2: Marble-to-Marble Collision Impulses (elastic jostling)
  for (let i = 0; i < racers.length; i++) {
    for (let j = i + 1; j < racers.length; j++) {
      const rA = racers[i];
      const rB = racers[j];
      if (rA.finished || rB.finished || rA.isFalling || rB.isFalling) continue;

      const dx = rB.position.x - rA.position.x;
      const dz = rB.position.z - rA.position.z;
      const dist = Math.hypot(dx, dz);
      const minDistance = 0.95; // Radius of both cartoon marbles combined

      if (dist < minDistance && dist > 0.001) {
        const overlap = (minDistance - dist) * 0.5;
        const nx = dx / dist;
        const nz = dz / dist;

        // Push lane offsets slightly apart
        rA.laneOffset -= nx * overlap * 0.5;
        rB.laneOffset += nx * overlap * 0.5;
        rA.laneOffset = Math.max(-0.9, Math.min(0.9, rA.laneOffset));
        rB.laneOffset = Math.max(-0.9, Math.min(0.9, rB.laneOffset));
      }
    }
  }

  // Step 3: Sort and update Live Championship Rankings
  const sortedRacers = [...racers].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTime || 0) - (b.finishTime || 0);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.trackProgress - a.trackProgress;
  });

  sortedRacers.forEach((r, rankIdx) => {
    const newRank = rankIdx + 1;
    r.previousRank = r.currentRank;
    r.currentRank = newRank;

    if (newRank < r.stats.highestPosition) {
      r.stats.highestPosition = newRank;
    }

    // Overtake commentary detection
    if (r.previousRank > newRank && !r.finished) {
      r.stats.overtakes++;
      const overtaken = sortedRacers[rankIdx + 1];
      if (overtaken && newRank <= 3 && Math.random() < 0.35) {
        commentary.onOvertake(r.country.name, overtaken.country.name, r.country.flagEmoji);
      }
    }
  });

  const currentLeader = sortedRacers[0];
  if (currentLeader && currentLeader.country.id !== previousLeaderId && !currentLeader.finished) {
    leadChanged = true;
    commentary.onLeadChange(currentLeader.country.name, currentLeader.country.flagEmoji);
    return { finishCount, leadChanged: true, newLeader: currentLeader };
  }

  return { finishCount, leadChanged: false };
}

function triggerRespawnAtCheckpoint(racer: RacerState, track: GeneratedTrackData) {
  racer.isFalling = true;
  racer.isRecovering = true;
  racer.recoveryTimer = 1.4;
  racer.stats.timesKnockedOff++;
  racer.emotion = 'falling';

  // Teleport back to last checkpoint or start
  const cpIdx = racer.lastCheckpointIndex;
  let respawnProgress = 0.01;
  if (cpIdx > 0 && track.checkpoints[cpIdx - 1]) {
    respawnProgress = track.checkpoints[cpIdx - 1].trackProgress;
  }

  racer.trackProgress = respawnProgress;
  const ptIdx = Math.floor(respawnProgress * (track.points.length - 1));
  const pt = track.points[ptIdx] || track.points[0];

  racer.position.x = pt.x;
  racer.position.y = pt.y + 0.2;
  racer.position.z = pt.z;
  racer.velocity.x = 0;
  racer.velocity.y = 0;
  racer.velocity.z = 0;
  racer.speed = 4.0;
  racer.laneOffset = 0;
  racer.targetLaneOffset = 0;
}
