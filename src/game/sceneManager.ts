import * as THREE from 'three';
import { CharacterMeshHandle, createCartoonMarbleRacer } from './characterRig';
import { CinematicCameraSystem } from './cameraSystem';
import { GeneratedTrackData, generateTrack } from './trackGenerator';
import { Country, LevelConfig, RacerState } from '../types';

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cameraSystem: CinematicCameraSystem;

  private currentTrackData: GeneratedTrackData | null = null;
  private characterRigs: Map<string, CharacterMeshHandle> = new Map();
  private particleGroup: THREE.Group = new THREE.Group();

  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;

  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.007);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.2, 500);
    this.camera.position.set(0, 15, -20);
    this.cameraSystem = new CinematicCameraSystem(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.6);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(40, 80, 50);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 250;
    this.dirLight.shadow.camera.left = -40;
    this.dirLight.shadow.camera.right = 40;
    this.dirLight.shadow.camera.top = 40;
    this.dirLight.shadow.camera.bottom = -40;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    this.scene.add(this.particleGroup);

    // 5. Build Environment Sky Dome & Distant Grid
    this.createAtmosphericSky();

    // 6. Responsive Resize Observer
    this.resizeObserver = new ResizeObserver(() => {
      if (this.isDestroyed) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width > 0 && height > 0) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    });
    this.resizeObserver.observe(this.container);
  }

  private createAtmosphericSky() {
    // Dynamic Sky Dome with horizon glow
    const skyGeo = new THREE.SphereGeometry(300, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x070b14,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Distant Star / Particle field
    const starsCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPos: number[] = [];
    for (let i = 0; i < starsCount; i++) {
      const radius = 180 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // Top hemisphere
      starPos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) + 20,
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 1.8, transparent: true, opacity: 0.8 });
    const starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(starPoints);

    // Distant Floor Grid
    const grid = new THREE.GridHelper(300, 50, 0x0284c7, 0x0f172a);
    grid.position.y = -15;
    this.scene.add(grid);
  }

  public loadTrackAndRacers(levelConfig: LevelConfig, countries: Country[]): GeneratedTrackData {
    // Clean up previous track
    if (this.currentTrackData) {
      this.scene.remove(this.currentTrackData.trackMeshGroup);
    }

    // Clean up previous character rigs
    this.characterRigs.forEach(rig => {
      this.scene.remove(rig.root);
    });
    this.characterRigs.clear();

    // Generate new procedural track
    const trackData = generateTrack(levelConfig);
    this.currentTrackData = trackData;
    this.scene.add(trackData.trackMeshGroup);

    // Theme lighting adjustment
    if (levelConfig.theme === 'sunset_canyon') {
      this.scene.background = new THREE.Color(0x180b1e);
      this.scene.fog = new THREE.FogExp2(0x180b1e, 0.007);
      this.hemiLight.color.setHex(0xfb923c);
      this.dirLight.color.setHex(0xfef08a);
    } else if (levelConfig.theme === 'cyber_circuit') {
      this.scene.background = new THREE.Color(0x061814);
      this.scene.fog = new THREE.FogExp2(0x061814, 0.007);
      this.hemiLight.color.setHex(0x34d399);
      this.dirLight.color.setHex(0xa7f3d0);
    } else if (levelConfig.theme === 'gold_arena' || levelConfig.isFinal) {
      this.scene.background = new THREE.Color(0x131109);
      this.scene.fog = new THREE.FogExp2(0x131109, 0.006);
      this.hemiLight.color.setHex(0xfacc15);
      this.dirLight.color.setHex(0xfffbeb);
    } else {
      this.scene.background = new THREE.Color(0x090d16);
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.007);
      this.hemiLight.color.setHex(0x7dd3fc);
      this.dirLight.color.setHex(0xffffff);
    }

    // Create 3D cartoon characters for each racer
    countries.forEach(country => {
      const rig = createCartoonMarbleRacer(country);
      this.characterRigs.set(country.id, rig);
      this.scene.add(rig.root);
    });

    return trackData;
  }

  public update(delta: number, racers: RacerState[], racePhase: string) {
    if (!this.currentTrackData) return;

    // Update characters' 3D positions and cartoon limb animations
    racers.forEach(racer => {
      const rig = this.characterRigs.get(racer.country.id);
      if (rig) {
        rig.updateAnimation(racer, delta);
      }
    });

    // Update dynamic obstacle animations (e.g. rotating sweepers)
    this.currentTrackData.obstacleMeshes.forEach(({ instance, mesh }) => {
      if (instance.type === 'sweeper') {
        mesh.rotation.y += delta * instance.speed;
        instance.rotation.y = mesh.rotation.y;
      }
    });

    // Update camera system
    this.cameraSystem.update(delta, racers, this.currentTrackData, racePhase);

    // Render 3D Frame
    this.renderer.render(this.scene, this.camera);
  }

  public getCameraSystem(): CinematicCameraSystem {
    return this.cameraSystem;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
