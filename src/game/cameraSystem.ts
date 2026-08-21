import * as THREE from 'three';
import { CameraMode, RacerState } from '../types';
import { GeneratedTrackData } from './trackGenerator';

export class CinematicCameraSystem {
  private camera: THREE.PerspectiveCamera;
  private currentMode: CameraMode = 'broadcast';
  private targetCountryId: string | null = null;
  private directorTimer: number = 0;
  private directorSubMode: 'leader' | 'pack' | 'overtake' | 'hazard' | 'finish' = 'leader';

  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private currentCamPos: THREE.Vector3 = new THREE.Vector3(0, 15, -20);

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public setMode(mode: CameraMode, countryId?: string) {
    this.currentMode = mode;
    if (countryId) {
      this.targetCountryId = countryId;
    }
  }

  public getMode(): CameraMode {
    return this.currentMode;
  }

  public setTargetCountry(countryId: string | null) {
    this.targetCountryId = countryId;
    if (countryId) {
      this.currentMode = 'manual_follow';
    }
  }

  public update(
    delta: number,
    racers: RacerState[],
    track: GeneratedTrackData,
    racePhase: string
  ) {
    if (racers.length === 0) return;

    // Director sub-mode switching in Auto Broadcast mode
    if (this.currentMode === 'broadcast') {
      this.directorTimer += delta;
      if (this.directorTimer > 5.5) {
        this.directorTimer = 0;

        // Check if close to finish
        const leader = racers.find(r => r.currentRank === 1) || racers[0];
        if (leader.trackProgress > 0.88) {
          this.directorSubMode = 'finish';
        } else if (Math.random() < 0.35 && racers.length > 2) {
          this.directorSubMode = 'overtake';
        } else if (Math.random() < 0.3) {
          this.directorSubMode = 'pack';
        } else {
          this.directorSubMode = 'leader';
        }
      }
    }

    let targetPos = new THREE.Vector3();
    let lookAtPos = new THREE.Vector3();
    const lerpSpeed = Math.min(1.0, delta * 5.0);

    // Selected Target Racer
    let focusRacer = racers.find(r => r.currentRank === 1) || racers[0];
    if (this.currentMode === 'manual_follow' && this.targetCountryId) {
      const found = racers.find(r => r.country.id === this.targetCountryId);
      if (found) focusRacer = found;
    }

    const racerPos = new THREE.Vector3(focusRacer.position.x, focusRacer.position.y, focusRacer.position.z);
    const racerHeading = focusRacer.rotation.y;
    const forwardVec = new THREE.Vector3(Math.sin(racerHeading), 0, Math.cos(racerHeading)).normalize();
    const rightVec = new THREE.Vector3(Math.cos(racerHeading), 0, -Math.sin(racerHeading)).normalize();

    // Mode Calculations
    const effectiveMode = this.currentMode === 'broadcast' ? this.directorSubMode : this.currentMode;

    switch (effectiveMode) {
      case 'fpv': {
        // First Person Rollercoaster
        targetPos.copy(racerPos).add(new THREE.Vector3(0, 0.9, 0)).add(forwardVec.clone().multiplyScalar(0.4));
        lookAtPos.copy(racerPos).add(new THREE.Vector3(0, 0.9, 0)).add(forwardVec.clone().multiplyScalar(15));
        break;
      }
      case 'overtake': {
        // Side dynamic battle view
        const p2 = racers.find(r => r.currentRank === 2) || focusRacer;
        const midPoint = new THREE.Vector3(
          (focusRacer.position.x + p2.position.x) * 0.5,
          (focusRacer.position.y + p2.position.y) * 0.5,
          (focusRacer.position.z + p2.position.z) * 0.5
        );
        targetPos.copy(midPoint)
          .add(new THREE.Vector3(0, 3.2, 0))
          .add(rightVec.clone().multiplyScalar(6.5))
          .add(forwardVec.clone().multiplyScalar(-3));
        lookAtPos.copy(midPoint).add(new THREE.Vector3(0, 0.8, 0));
        break;
      }
      case 'hazard': {
        // High 3/4 angle ahead
        targetPos.copy(racerPos)
          .add(new THREE.Vector3(0, 7.5, 0))
          .add(forwardVec.clone().multiplyScalar(9.0));
        lookAtPos.copy(racerPos).add(new THREE.Vector3(0, 0.5, 0));
        break;
      }
      case 'wide':
      case 'pack': {
        // Sweeping aerial pack view
        // Average position of all racers
        let avgX = 0, avgY = 0, avgZ = 0;
        racers.forEach(r => {
          avgX += r.position.x;
          avgY += r.position.y;
          avgZ += r.position.z;
        });
        avgX /= racers.length;
        avgY /= racers.length;
        avgZ /= racers.length;

        const packCenter = new THREE.Vector3(avgX, avgY, avgZ);
        targetPos.copy(packCenter)
          .add(new THREE.Vector3(0, 12, 0))
          .add(forwardVec.clone().multiplyScalar(-14));
        lookAtPos.copy(packCenter).add(new THREE.Vector3(0, 0.5, 0));
        break;
      }
      case 'finish': {
        // Fixed finish line spectator camera
        const finishPt = track.finishPosition;
        targetPos.set(finishPt.x - 6, finishPt.y + 4, finishPt.z - 8);
        lookAtPos.set(finishPt.x, finishPt.y + 1, finishPt.z);
        break;
      }
      case 'leader':
      default: {
        // Standard Elevated Third-Person Chase
        targetPos.copy(racerPos)
          .add(new THREE.Vector3(0, 4.2, 0))
          .add(forwardVec.clone().multiplyScalar(-6.5));
        lookAtPos.copy(racerPos).add(new THREE.Vector3(0, 1.1, 0)).add(forwardVec.clone().multiplyScalar(3.5));
        break;
      }
    }

    // Smooth Interpolation
    this.currentCamPos.lerp(targetPos, lerpSpeed);
    this.currentLookAt.lerp(lookAtPos, lerpSpeed);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);
  }
}
