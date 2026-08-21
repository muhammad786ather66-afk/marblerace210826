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
  private stadiumPropsGroup: THREE.Group = new THREE.Group();
  private searchlightsGroup: THREE.Group = new THREE.Group();
  private searchlightBeams: { mesh: THREE.Mesh; pivot: THREE.Object3D; baseSpeed: number; offset: number }[] = [];

  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private stadiumAccentLight1: THREE.PointLight;
  private stadiumAccentLight2: THREE.PointLight;

  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private elapsedTime: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0055);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.2, 800);
    this.camera.position.set(0, 18, -25);
    this.cameraSystem = new CinematicCameraSystem(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    container.appendChild(this.renderer.domElement);

    // 4. Enhanced Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(60, 110, 70);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 350;
    this.dirLight.shadow.camera.left = -60;
    this.dirLight.shadow.camera.right = 60;
    this.dirLight.shadow.camera.top = 60;
    this.dirLight.shadow.camera.bottom = -60;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // Stadium Stage Colored Accent Lights
    this.stadiumAccentLight1 = new THREE.PointLight(0x0284c7, 3, 120);
    this.stadiumAccentLight1.position.set(-30, 20, 40);
    this.scene.add(this.stadiumAccentLight1);

    this.stadiumAccentLight2 = new THREE.PointLight(0xf59e0b, 2.5, 120);
    this.stadiumAccentLight2.position.set(30, 20, -20);
    this.scene.add(this.stadiumAccentLight2);

    this.scene.add(this.particleGroup);
    this.scene.add(this.stadiumPropsGroup);
    this.scene.add(this.searchlightsGroup);

    // 5. Build Environment Sky Dome, Sci-Fi Cityscape & Arena Props
    this.createAtmosphericSkyAndCityscape();
    this.createArenaSearchlights();

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

  private createAtmosphericSkyAndCityscape() {
    // Dynamic Sky Dome with Deep Space Gradient
    const skyGeo = new THREE.SphereGeometry(450, 32, 20);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x050811,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.stadiumPropsGroup.add(sky);

    // Distant Nebula / Star Cloud field
    const starsCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPos: number[] = [];
    const starColors: number[] = [];
    const colorChoices = [
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfacc15),
      new THREE.Color(0xa855f7),
      new THREE.Color(0x34d399),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < starsCount; i++) {
      const radius = 260 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45; // Top hemisphere
      starPos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) + 30,
        radius * Math.sin(phi) * Math.sin(theta)
      );

      const col = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      starColors.push(col.r, col.g, col.b);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    this.stadiumPropsGroup.add(starPoints);

    // High-Tech Cyber Stadium Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(600, 600);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -22;
    floor.receiveShadow = true;
    this.stadiumPropsGroup.add(floor);

    // Glowing Arena Hexagonal / Grid Matrix
    const grid = new THREE.GridHelper(500, 70, 0x0284c7, 0x111c33);
    grid.position.y = -21.8;
    this.stadiumPropsGroup.add(grid);

    // Secondary Accent Glow Grid
    const innerGrid = new THREE.GridHelper(200, 25, 0x38bdf8, 0x1e293b);
    innerGrid.position.y = -21.5;
    this.stadiumPropsGroup.add(innerGrid);

    // Distant Futuristic Cityscape & Stadium Perimeter Towers
    this.buildCityscapeAndStadiumTowers();
  }

  private buildCityscapeAndStadiumTowers() {
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.5,
      metalness: 0.6,
    });
    const buildingMatAccent = new THREE.MeshStandardMaterial({
      color: 0x111c38,
      roughness: 0.4,
      metalness: 0.7,
    });
    const windowGlowMatCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const windowGlowMatAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const windowGlowMatRose = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    // Perimeter Buildings Circle around the track arena
    const buildingCount = 38;
    const perimeterRadius = 140;

    for (let i = 0; i < buildingCount; i++) {
      const angle = (i / buildingCount) * Math.PI * 2 + (Math.random() * 0.08);
      const dist = perimeterRadius + (Math.random() * 50 - 20);
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;
      const bWidth = 14 + Math.random() * 16;
      const bDepth = 14 + Math.random() * 16;
      const bHeight = 45 + Math.random() * 85;

      const buildingGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMat = i % 2 === 0 ? buildingMatDark : buildingMatAccent;
      const building = new THREE.Mesh(buildingGeo, bMat);
      building.position.set(bx, bHeight / 2 - 22, bz);
      building.castShadow = true;
      building.receiveShadow = true;
      this.stadiumPropsGroup.add(building);

      // Add Glowing Neon Trim or Roof Spire
      if (i % 3 === 0) {
        const spireGeo = new THREE.CylinderGeometry(0.3, 1.2, 18, 8);
        const spireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(bx, bHeight - 13, bz);
        this.stadiumPropsGroup.add(spire);

        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 8, 8),
          i % 6 === 0 ? windowGlowMatAmber : windowGlowMatRose
        );
        beacon.position.set(bx, bHeight - 4, bz);
        this.stadiumPropsGroup.add(beacon);
      }

      // Glowing Horizontal Light Bands on building facades
      const bandCount = 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < bandCount; b++) {
        const bandGeo = new THREE.BoxGeometry(bWidth + 0.3, 0.8, bDepth + 0.3);
        const bandMat = i % 2 === 0 ? windowGlowMatCyan : windowGlowMatAmber;
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.set(bx, 10 + b * 20 + Math.random() * 5, bz);
        this.stadiumPropsGroup.add(band);
      }
    }

    // High Stadium Overhang Trusses / Halo Arches spanning above the arena
    for (let archIdx = 0; archIdx < 4; archIdx++) {
      const archAngle = (archIdx / 4) * Math.PI * 2;
      const archRadius = 80;
      const archGroup = new THREE.Group();

      const archCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-archRadius, -20, 0),
        new THREE.Vector3(0, 70, 0),
        new THREE.Vector3(archRadius, -20, 0)
      );
      const tubeGeo = new THREE.TubeGeometry(archCurve, 32, 1.2, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.6,
        roughness: 0.3,
      });
      const archMesh = new THREE.Mesh(tubeGeo, tubeMat);
      archGroup.add(archMesh);

      // Glowing Accent Ring along the arch
      const glowTubeGeo = new THREE.TubeGeometry(archCurve, 32, 0.4, 6, false);
      const glowTubeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      const glowMesh = new THREE.Mesh(glowTubeGeo, glowTubeMat);
      glowMesh.position.y += 0.5;
      archGroup.add(glowMesh);

      archGroup.rotation.y = archAngle;
      this.stadiumPropsGroup.add(archGroup);
    }
  }

  private createArenaSearchlights() {
    const lightPositions = [
      { x: -55, z: -55, color: 0x38bdf8 },
      { x: 55, z: -55, color: 0xf59e0b },
      { x: -55, z: 55, color: 0x10b981 },
      { x: 55, z: 55, color: 0xec4899 },
    ];

    lightPositions.forEach((pos, idx) => {
      const towerGeo = new THREE.CylinderGeometry(0.8, 1.5, 30, 8);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(pos.x, -7, pos.z);
      this.searchlightsGroup.add(tower);

      const pivot = new THREE.Object3D();
      pivot.position.set(pos.x, 8, pos.z);
      this.searchlightsGroup.add(pivot);

      // Volumetric Light Cone
      const coneGeo = new THREE.ConeGeometry(8, 70, 16, 1, true);
      coneGeo.translate(0, 35, 0);
      coneGeo.rotateX(Math.PI / 2);

      const coneMat = new THREE.MeshBasicMaterial({
        color: pos.color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const cone = new THREE.Mesh(coneGeo, coneMat);
      pivot.add(cone);

      this.searchlightBeams.push({
        mesh: cone,
        pivot,
        baseSpeed: 0.8 + idx * 0.2,
        offset: idx * Math.PI * 0.5,
      });
    });
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

    // Generate new procedural track with enhanced stadium props
    const trackData = generateTrack(levelConfig);
    this.currentTrackData = trackData;
    this.scene.add(trackData.trackMeshGroup);

    // Theme atmosphere and lighting adjustment
    if (levelConfig.theme === 'sunset_canyon') {
      this.scene.background = new THREE.Color(0x1a0b22);
      this.scene.fog = new THREE.FogExp2(0x1a0b22, 0.006);
      this.hemiLight.color.setHex(0xfb923c);
      this.dirLight.color.setHex(0xfef08a);
      this.stadiumAccentLight1.color.setHex(0xe11d48);
      this.stadiumAccentLight2.color.setHex(0xf97316);
    } else if (levelConfig.theme === 'cyber_circuit') {
      this.scene.background = new THREE.Color(0x041816);
      this.scene.fog = new THREE.FogExp2(0x041816, 0.006);
      this.hemiLight.color.setHex(0x34d399);
      this.dirLight.color.setHex(0xa7f3d0);
      this.stadiumAccentLight1.color.setHex(0x10b981);
      this.stadiumAccentLight2.color.setHex(0x06b6d4);
    } else if (levelConfig.theme === 'gold_arena' || levelConfig.isFinal) {
      this.scene.background = new THREE.Color(0x161308);
      this.scene.fog = new THREE.FogExp2(0x161308, 0.0055);
      this.hemiLight.color.setHex(0xfacc15);
      this.dirLight.color.setHex(0xfffbeb);
      this.stadiumAccentLight1.color.setHex(0xf59e0b);
      this.stadiumAccentLight2.color.setHex(0xfacc15);
    } else if (levelConfig.theme === 'sky_peaks') {
      this.scene.background = new THREE.Color(0x0c1527);
      this.scene.fog = new THREE.FogExp2(0x0c1527, 0.0055);
      this.hemiLight.color.setHex(0x93c5fd);
      this.dirLight.color.setHex(0xe0f2fe);
      this.stadiumAccentLight1.color.setHex(0x38bdf8);
      this.stadiumAccentLight2.color.setHex(0x818cf8);
    } else {
      this.scene.background = new THREE.Color(0x070b16);
      this.scene.fog = new THREE.FogExp2(0x070b16, 0.006);
      this.hemiLight.color.setHex(0x7dd3fc);
      this.dirLight.color.setHex(0xffffff);
      this.stadiumAccentLight1.color.setHex(0x0284c7);
      this.stadiumAccentLight2.color.setHex(0x6366f1);
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
    this.elapsedTime += delta;

    // Update characters' 3D positions and cartoon limb animations
    racers.forEach(racer => {
      const rig = this.characterRigs.get(racer.country.id);
      if (rig) {
        rig.updateAnimation(racer, delta);
      }
    });

    // Animate stadium searchlights sweeping across the sky
    this.searchlightBeams.forEach(sl => {
      const t = this.elapsedTime * sl.baseSpeed + sl.offset;
      sl.pivot.rotation.x = Math.sin(t * 0.7) * 0.45 - 0.2;
      sl.pivot.rotation.y = Math.cos(t * 0.9) * 0.8;
      sl.pivot.rotation.z = Math.sin(t * 0.5) * 0.3;
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
