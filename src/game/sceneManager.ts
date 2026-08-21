import * as THREE from 'three';
import { CharacterMeshHandle, createCartoonMarbleRacer } from './characterRig';
import { CinematicCameraSystem } from './cameraSystem';
import { GeneratedTrackData, generateTrack } from './trackGenerator';
import { Country, LevelConfig, RacerState } from '../types';

interface AnimatedHoloCrowdMember {
  mesh: THREE.Object3D;
  baseY: number;
  phase: number;
  speed: number;
  armLeft?: THREE.Object3D;
  armRight?: THREE.Object3D;
}

interface FloatingNeonRing {
  group: THREE.Group;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  bobFreq: number;
  bobAmp: number;
  baseY: number;
}

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
  private neonRingsGroup: THREE.Group = new THREE.Group();
  private holoAudienceGroup: THREE.Group = new THREE.Group();
  private tracksideLightsGroup: THREE.Group = new THREE.Group();

  private searchlightBeams: { mesh: THREE.Mesh; pivot: THREE.Object3D; baseSpeed: number; offset: number }[] = [];
  private floatingRings: FloatingNeonRing[] = [];
  private animatedCrowd: AnimatedHoloCrowdMember[] = [];
  private jumbotrons: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture; mesh: THREE.Mesh }[] = [];
  private flyingSkyVehicles: { mesh: THREE.Group; radius: number; speed: number; angle: number; y: number }[] = [];

  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private stadiumAccentLight1: THREE.PointLight;
  private stadiumAccentLight2: THREE.PointLight;
  private stadiumAccentLight3: THREE.PointLight;
  private stadiumAccentLight4: THREE.PointLight;

  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private elapsedTime: number = 0;
  private jumbotronUpdateTimer: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060914);
    this.scene.fog = new THREE.FogExp2(0x060914, 0.0042);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.2, 900);
    this.camera.position.set(0, 18, -25);
    this.cameraSystem = new CinematicCameraSystem(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    container.appendChild(this.renderer.domElement);

    // 4. Multi-Source High-Production Lighting Setup (No dark empty voids)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(70, 120, 80);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 400;
    this.dirLight.shadow.camera.left = -90;
    this.dirLight.shadow.camera.right = 90;
    this.dirLight.shadow.camera.top = 90;
    this.dirLight.shadow.camera.bottom = -90;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // 4 Quad Stadium Accent Flood Lights covering the entire arena basin
    this.stadiumAccentLight1 = new THREE.PointLight(0x0284c7, 3.5, 180, 1.2);
    this.stadiumAccentLight1.position.set(-60, 35, 60);
    this.scene.add(this.stadiumAccentLight1);

    this.stadiumAccentLight2 = new THREE.PointLight(0xf59e0b, 3.2, 180, 1.2);
    this.stadiumAccentLight2.position.set(60, 35, -60);
    this.scene.add(this.stadiumAccentLight2);

    this.stadiumAccentLight3 = new THREE.PointLight(0x10b981, 3.0, 180, 1.2);
    this.stadiumAccentLight3.position.set(-60, 35, -60);
    this.scene.add(this.stadiumAccentLight3);

    this.stadiumAccentLight4 = new THREE.PointLight(0xa855f7, 3.2, 180, 1.2);
    this.stadiumAccentLight4.position.set(60, 35, 60);
    this.scene.add(this.stadiumAccentLight4);

    this.scene.add(this.particleGroup);
    this.scene.add(this.stadiumPropsGroup);
    this.scene.add(this.searchlightsGroup);
    this.scene.add(this.neonRingsGroup);
    this.scene.add(this.holoAudienceGroup);
    this.scene.add(this.tracksideLightsGroup);

    // 5. Build Environment Sky Dome, Sci-Fi Cityscape & Arena Props
    this.createAtmosphericSkyAndCityscape();
    this.createFloatingNeonStadiumRings();
    this.createHolographicAudienceAndJumbotrons();
    this.createArenaSearchlights();
    this.createSkylineTraffic();

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
    const skyGeo = new THREE.SphereGeometry(500, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x050814,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.stadiumPropsGroup.add(sky);

    // Distant Nebula / Star Cloud field
    const starsCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos: number[] = [];
    const starColors: number[] = [];
    const colorChoices = [
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfacc15),
      new THREE.Color(0xa855f7),
      new THREE.Color(0x34d399),
      new THREE.Color(0xf43f5e),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < starsCount; i++) {
      const radius = 280 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.46; // Top hemisphere
      starPos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) + 20,
        radius * Math.sin(phi) * Math.sin(theta)
      );

      const col = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      starColors.push(col.r, col.g, col.b);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    this.stadiumPropsGroup.add(starPoints);

    // High-Tech Cyber Stadium Floor with illuminated matrix grid
    const floorGeo = new THREE.PlaneGeometry(750, 750);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080e1a,
      roughness: 0.75,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -22;
    floor.receiveShadow = true;
    this.stadiumPropsGroup.add(floor);

    // Glowing Arena Concentric Matrix Circles
    for (let radius = 40; radius <= 220; radius += 35) {
      const ringGeo = new THREE.RingGeometry(radius - 0.4, radius + 0.4, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: radius % 70 === 0 ? 0x0284c7 : 0x1e293b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const groundRing = new THREE.Mesh(ringGeo, ringMat);
      groundRing.rotation.x = -Math.PI / 2;
      groundRing.position.y = -21.9;
      this.stadiumPropsGroup.add(groundRing);
    }

    // Glowing Arena Hexagonal / Grid Matrix
    const grid = new THREE.GridHelper(600, 80, 0x0284c7, 0x13233f);
    grid.position.y = -21.7;
    this.stadiumPropsGroup.add(grid);

    // Radial Neon Laser Accents from stadium center outward
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const rayGeo = new THREE.PlaneGeometry(1.2, 280);
      const rayMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x0284c7 : 0x06b6d4,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.rotation.x = -Math.PI / 2;
      ray.rotation.z = angle;
      ray.position.set(Math.cos(angle) * 140, -21.6, Math.sin(angle) * 140);
      this.stadiumPropsGroup.add(ray);
    }

    // Build layered futuristic cityscape
    this.buildCityscapeAndStadiumTowers();
  }

  private buildCityscapeAndStadiumTowers() {
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      roughness: 0.4,
      metalness: 0.7,
    });
    const buildingMatAccent = new THREE.MeshStandardMaterial({
      color: 0x101b33,
      roughness: 0.35,
      metalness: 0.8,
    });
    const buildingMatGlass = new THREE.MeshStandardMaterial({
      color: 0x0f2942,
      roughness: 0.1,
      metalness: 0.9,
    });

    const windowGlowMatCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const windowGlowMatAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const windowGlowMatRose = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const windowGlowMatEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const windowGlowMatPurple = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

    // Layer 1: Mid-Distance Cyber Skyscraper Ring
    const buildingCount = 46;
    const perimeterRadius = 145;

    for (let i = 0; i < buildingCount; i++) {
      const angle = (i / buildingCount) * Math.PI * 2 + (Math.random() * 0.05);
      const dist = perimeterRadius + (Math.random() * 45 - 15);
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;
      const bWidth = 14 + Math.random() * 18;
      const bDepth = 14 + Math.random() * 18;
      const bHeight = 55 + Math.random() * 95;

      const buildingGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMat = i % 3 === 0 ? buildingMatGlass : i % 2 === 0 ? buildingMatDark : buildingMatAccent;
      const building = new THREE.Mesh(buildingGeo, bMat);
      building.position.set(bx, bHeight / 2 - 22, bz);
      building.castShadow = true;
      building.receiveShadow = true;
      this.stadiumPropsGroup.add(building);

      // Glowing Neon Rooftop Spires / Antennas
      if (i % 2 === 0) {
        const spireHeight = 16 + Math.random() * 22;
        const spireGeo = new THREE.CylinderGeometry(0.25, 1.0, spireHeight, 8);
        const spireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(bx, bHeight - 22 + spireHeight / 2, bz);
        this.stadiumPropsGroup.add(spire);

        const beaconCol = i % 4 === 0 ? windowGlowMatAmber : i % 4 === 1 ? windowGlowMatRose : i % 4 === 2 ? windowGlowMatCyan : windowGlowMatEmerald;
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), beaconCol);
        beacon.position.set(bx, bHeight - 22 + spireHeight, bz);
        this.stadiumPropsGroup.add(beacon);
      }

      // Neon Horizontal Energy Bands & Grid Window Panels
      const bandCount = 2 + Math.floor(Math.random() * 4);
      for (let b = 0; b < bandCount; b++) {
        const bandGeo = new THREE.BoxGeometry(bWidth + 0.35, 1.0, bDepth + 0.35);
        const bandMat = i % 4 === 0 ? windowGlowMatCyan : i % 4 === 1 ? windowGlowMatAmber : i % 4 === 2 ? windowGlowMatPurple : windowGlowMatEmerald;
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.set(bx, -10 + b * 22 + Math.random() * 6, bz);
        this.stadiumPropsGroup.add(band);
      }

      // Skybridge connectors between adjacent towers
      if (i % 5 === 0) {
        const nextAngle = ((i + 1) / buildingCount) * Math.PI * 2;
        const nextDist = perimeterRadius + 15;
        const nbx = Math.cos(nextAngle) * nextDist;
        const nbz = Math.sin(nextAngle) * nextDist;
        const bridgeY = 25 + Math.random() * 30;

        const bridgeVec = new THREE.Vector3(nbx - bx, 0, nbz - bz);
        const bridgeLen = bridgeVec.length();
        const bridgeGeo = new THREE.BoxGeometry(3.5, 2.5, bridgeLen);
        const bridge = new THREE.Mesh(bridgeGeo, buildingMatAccent);
        bridge.position.set((bx + nbx) / 2, bridgeY, (bz + nbz) / 2);
        bridge.lookAt(nbx, bridgeY, nbz);
        this.stadiumPropsGroup.add(bridge);

        const bridgeGlowGeo = new THREE.BoxGeometry(3.8, 0.4, bridgeLen);
        const bridgeGlow = new THREE.Mesh(bridgeGlowGeo, windowGlowMatCyan);
        bridgeGlow.position.set((bx + nbx) / 2, bridgeY - 1.2, (bz + nbz) / 2);
        bridgeGlow.lookAt(nbx, bridgeY - 1.2, nbz);
        this.stadiumPropsGroup.add(bridgeGlow);
      }
    }

    // Layer 2: Far Horizon Mega-Structure Silhouettes
    const horizonCount = 32;
    const horizonRadius = 240;
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x030712 });

    for (let h = 0; h < horizonCount; h++) {
      const hAngle = (h / horizonCount) * Math.PI * 2;
      const hDist = horizonRadius + (Math.random() * 40 - 20);
      const hx = Math.cos(hAngle) * hDist;
      const hz = Math.sin(hAngle) * hDist;
      const hWidth = 25 + Math.random() * 35;
      const hDepth = 25 + Math.random() * 35;
      const hHeight = 110 + Math.random() * 140;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(hWidth, hHeight, hDepth), horizonMat);
      tower.position.set(hx, hHeight / 2 - 22, hz);
      this.stadiumPropsGroup.add(tower);

      // Mega Pyramid or Spire top
      if (h % 3 === 0) {
        const topCone = new THREE.Mesh(new THREE.ConeGeometry(hWidth * 0.6, 35, 4), horizonMat);
        topCone.position.set(hx, hHeight - 22 + 17.5, hz);
        topCone.rotation.y = Math.PI / 4;
        this.stadiumPropsGroup.add(topCone);
      }
    }

    // Grand Halo Arches spanning above the stadium
    for (let archIdx = 0; archIdx < 4; archIdx++) {
      const archAngle = (archIdx / 4) * Math.PI * 2;
      const archRadius = 92;
      const archGroup = new THREE.Group();

      const archCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-archRadius, -20, 0),
        new THREE.Vector3(0, 85, 0),
        new THREE.Vector3(archRadius, -20, 0)
      );
      const tubeGeo = new THREE.TubeGeometry(archCurve, 40, 1.4, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.7,
        roughness: 0.3,
      });
      const archMesh = new THREE.Mesh(tubeGeo, tubeMat);
      archGroup.add(archMesh);

      // Glowing Accent Ring along the arch
      const glowTubeGeo = new THREE.TubeGeometry(archCurve, 40, 0.45, 6, false);
      const glowTubeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      const glowMesh = new THREE.Mesh(glowTubeGeo, glowTubeMat);
      glowMesh.position.y += 0.6;
      archGroup.add(glowMesh);

      // Floodlights mounted on arch apex
      const lampGeo = new THREE.BoxGeometry(3.0, 1.2, 1.5);
      const lampMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(0, 84, 0);
      archGroup.add(lamp);

      archGroup.rotation.y = archAngle;
      this.stadiumPropsGroup.add(archGroup);
    }
  }

  // --- Floating Neon Stadium Rings (Gigantic Concentric Overhead Halos) ---
  private createFloatingNeonStadiumRings() {
    // Halo Ring 1: Primary Outer High-Tech Neon Ring
    const ring1Group = new THREE.Group();
    const ring1Radius = 110;
    const ring1Geo = new THREE.TorusGeometry(ring1Radius, 1.0, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 2;
    ring1Group.add(ring1Mesh);

    // Segmented neon blocks along Ring 1
    const nodeCount1 = 24;
    for (let i = 0; i < nodeCount1; i++) {
      const nodeAngle = (i / nodeCount1) * Math.PI * 2;
      const nodeGeo = new THREE.BoxGeometry(2.5, 1.8, 4.0);
      const nodeMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x38bdf8 : 0x06b6d4 });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(nodeAngle) * ring1Radius, 0, Math.sin(nodeAngle) * ring1Radius);
      node.rotation.y = -nodeAngle;
      ring1Group.add(node);
    }
    ring1Group.position.set(0, 78, 0);
    this.neonRingsGroup.add(ring1Group);
    this.floatingRings.push({
      group: ring1Group,
      rotSpeedX: 0,
      rotSpeedY: 0.12,
      rotSpeedZ: 0,
      bobFreq: 0.6,
      bobAmp: 2.2,
      baseY: 78,
    });

    // Halo Ring 2: Mid Concentric Halo tilted at dramatic angle
    const ring2Group = new THREE.Group();
    const ring2Radius = 75;
    const ring2Geo = new THREE.TorusGeometry(ring2Radius, 0.8, 16, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.x = Math.PI / 2 + 0.18;
    ring2Group.add(ring2Mesh);

    const nodeCount2 = 16;
    for (let i = 0; i < nodeCount2; i++) {
      const nodeAngle = (i / nodeCount2) * Math.PI * 2;
      const nodeGeo = new THREE.ConeGeometry(1.2, 3.5, 6);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(nodeAngle) * ring2Radius, Math.sin(nodeAngle) * 6, Math.sin(nodeAngle) * ring2Radius);
      node.rotation.z = -Math.PI / 2;
      node.rotation.y = -nodeAngle;
      ring2Group.add(node);
    }
    ring2Group.position.set(0, 92, 0);
    this.neonRingsGroup.add(ring2Group);
    this.floatingRings.push({
      group: ring2Group,
      rotSpeedX: 0.04,
      rotSpeedY: -0.18,
      rotSpeedZ: 0.02,
      bobFreq: 0.8,
      bobAmp: 3.0,
      baseY: 92,
    });

    // Halo Ring 3: Inner Fast-Pulsing Target Ring
    const ring3Group = new THREE.Group();
    const ring3Radius = 45;
    const ring3Geo = new THREE.TorusGeometry(ring3Radius, 0.6, 12, 36);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ring3Mesh = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3Mesh.rotation.x = Math.PI / 2 - 0.15;
    ring3Group.add(ring3Mesh);

    ring3Group.position.set(0, 68, 0);
    this.neonRingsGroup.add(ring3Group);
    this.floatingRings.push({
      group: ring3Group,
      rotSpeedX: -0.03,
      rotSpeedY: 0.25,
      rotSpeedZ: 0.05,
      bobFreq: 1.1,
      bobAmp: 1.8,
      baseY: 68,
    });
  }

  // --- Holographic Animated Crowd Elements & Floating Stadium Jumbotrons ---
  private createHolographicAudienceAndJumbotrons() {
    // 1. Floating Hologram Stadium Viewing Pods (4 pods placed in track viewing quadrants)
    const podLocations = [
      { x: -50, y: 32, z: 45, angle: Math.PI * 0.25, color: 0x38bdf8 },
      { x: 50, y: 36, z: -45, angle: Math.PI * 1.25, color: 0xf59e0b },
      { x: -48, y: 34, z: -48, angle: Math.PI * 0.75, color: 0x10b981 },
      { x: 48, y: 30, z: 48, angle: Math.PI * 1.75, color: 0xa855f7 },
    ];

    podLocations.forEach((loc, podIdx) => {
      const podGroup = new THREE.Group();
      podGroup.position.set(loc.x, loc.y, loc.z);

      // Pod Floating Platform Base
      const baseGeo = new THREE.CylinderGeometry(8.5, 6.5, 2.5, 24);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      const podBase = new THREE.Mesh(baseGeo, baseMat);
      podGroup.add(podBase);

      // Pod Neon Glow Ring Trim
      const glowGeo = new THREE.TorusGeometry(8.6, 0.25, 8, 32);
      const glowMat = new THREE.MeshBasicMaterial({ color: loc.color });
      const podGlow = new THREE.Mesh(glowGeo, glowMat);
      podGlow.rotation.x = Math.PI / 2;
      podGlow.position.y = 1.2;
      podGroup.add(podGlow);

      // Glass Barrier
      const glassGeo = new THREE.CylinderGeometry(8.4, 8.4, 2.2, 24, 1, true);
      const glassMat = new THREE.MeshBasicMaterial({
        color: loc.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.y = 2.4;
      podGroup.add(glass);

      // Under-pod Volumetric Thruster Glow
      const thrusterGeo = new THREE.ConeGeometry(4.0, 10, 16, 1, true);
      const thrusterMat = new THREE.MeshBasicMaterial({
        color: loc.color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      thruster.position.y = -6.0;
      podGroup.add(thruster);

      // Populate Pod with Animated Holographic Fans
      const crowdInPod = 14;
      for (let c = 0; c < crowdInPod; c++) {
        const cAngle = (c / crowdInPod) * Math.PI * 2;
        const cDist = 2.5 + Math.random() * 4.5;
        const cx = Math.cos(cAngle) * cDist;
        const cz = Math.sin(cAngle) * cDist;

        const fan = this.createHoloFanMesh(loc.color, podIdx * 10 + c);
        fan.root.position.set(cx, 1.4, cz);
        fan.root.lookAt(0, 1.4, 0); // look inward/outward
        fan.root.rotation.y += Math.PI;
        podGroup.add(fan.root);

        this.animatedCrowd.push({
          mesh: fan.root,
          baseY: 1.4,
          phase: c * 0.45 + podIdx,
          speed: 3.2 + (c % 3) * 0.8,
          armLeft: fan.armLeft,
          armRight: fan.armRight,
        });
      }

      this.holoAudienceGroup.add(podGroup);
    });

    // 2. Giant Floating Stadium Jumbotrons (4 screens high in the air showing live race telemetry)
    const jumbotronConfigs = [
      { x: 0, y: 48, z: -65, rotY: 0 },
      { x: 0, y: 48, z: 65, rotY: Math.PI },
      { x: -65, y: 48, z: 0, rotY: Math.PI / 2 },
      { x: 65, y: 48, z: 0, rotY: -Math.PI / 2 },
    ];

    jumbotronConfigs.forEach(cfg => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      this.renderJumbotronFeed(ctx, 'STAGE BROADCAST', 'LEADERBOARD ACTIVE', 0);
      const texture = new THREE.CanvasTexture(canvas);

      const screenGeo = new THREE.PlaneGeometry(24, 12);
      const screenMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);

      // Frame Housing
      const frameGeo = new THREE.BoxGeometry(25.5, 13.5, 1.5);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.z = -0.8;
      screenMesh.add(frame);

      // Glowing Neon Border
      const borderGeo = new THREE.BoxGeometry(25.8, 13.8, 0.4);
      const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.z = -0.75;
      screenMesh.add(border);

      screenMesh.position.set(cfg.x, cfg.y, cfg.z);
      screenMesh.rotation.y = cfg.rotY;

      this.holoAudienceGroup.add(screenMesh);
      this.jumbotrons.push({ canvas, ctx, texture, mesh: screenMesh });
    });
  }

  // Create a stylized holographic fan character
  private createHoloFanMesh(colorHex: number, seed: number): { root: THREE.Group; armLeft?: THREE.Object3D; armRight?: THREE.Object3D } {
    const root = new THREE.Group();
    const fanMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
    });

    // Holographic Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.3, 8), fanMat);
    torso.position.y = 0.65;
    root.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), fanMat);
    head.position.y = 1.6;
    root.add(head);

    // Left Arm with Cheering Fan Light Stick
    const armLeft = new THREE.Group();
    armLeft.position.set(-0.45, 1.2, 0);
    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), fanMat);
    armLMesh.position.y = 0.35;
    armLeft.add(armLMesh);

    // Glowing Cheering Light Stick
    if (seed % 2 === 0) {
      const stickMat = new THREE.MeshBasicMaterial({ color: seed % 4 === 0 ? 0xfacc15 : 0xf43f5e });
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), stickMat);
      stick.position.set(0, 0.75, 0);
      armLeft.add(stick);
    }
    root.add(armLeft);

    // Right Arm
    const armRight = new THREE.Group();
    armRight.position.set(0.45, 1.2, 0);
    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), fanMat);
    armRMesh.position.y = 0.35;
    armRight.add(armRMesh);
    root.add(armRight);

    return { root, armLeft, armRight };
  }

  // Draw simulated high-tech live jumbotron visuals
  private renderJumbotronFeed(ctx: CanvasRenderingContext2D, header: string, sub: string, time: number) {
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, 512, 256);

    // Scanlines
    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 512, 2);
    }

    // Header Bar
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(10, 10, 492, 45);

    ctx.font = '900 24px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('⚡ WORLD MARBLE GP TELEMETRY ⚡', 24, 42);

    // Simulated Graphic Waveform / Race Track Visualizer
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 20; x < 490; x += 10) {
      const wave = Math.sin((x * 0.04) + time * 3) * 25 + 130;
      if (x === 20) ctx.moveTo(x, wave);
      else ctx.lineTo(x, wave);
    }
    ctx.stroke();

    // Bottom Status Boxes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(20, 175, 225, 65);
    ctx.fillRect(265, 175, 225, 65);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('STAGE STATUS', 32, 198);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText('LIVE BATTLE', 32, 226);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ARENA CAPACITY', 277, 198);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('100,000 FANS', 277, 226);
  }

  private createSkylineTraffic() {
    // Distant flying sky-cars streaming between buildings
    for (let i = 0; i < 8; i++) {
      const vehicleGroup = new THREE.Group();
      const carMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x38bdf8 : 0xf43f5e });
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.0, 1.8), carMat);
      vehicleGroup.add(body);

      // Light trail
      const trailMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x0284c7 : 0xe11d48,
        transparent: true,
        opacity: 0.6,
      });
      const trail = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.4, 0.8), trailMat);
      trail.position.x = -6.0;
      vehicleGroup.add(trail);

      const radius = 175 + i * 8;
      const speed = 0.25 + (i % 3) * 0.1;
      const y = 35 + (i % 4) * 18;

      this.stadiumPropsGroup.add(vehicleGroup);
      this.flyingSkyVehicles.push({
        mesh: vehicleGroup,
        radius,
        speed,
        angle: (i / 8) * Math.PI * 2,
        y,
      });
    }
  }

  private createArenaSearchlights() {
    const lightPositions = [
      { x: -65, z: -65, color: 0x38bdf8 },
      { x: 65, z: -65, color: 0xf59e0b },
      { x: -65, z: 65, color: 0x10b981 },
      { x: 65, z: 65, color: 0xec4899 },
      { x: 0, z: -85, color: 0x06b6d4 },
      { x: 0, z: 85, color: 0xa855f7 },
    ];

    lightPositions.forEach((pos, idx) => {
      const towerGeo = new THREE.CylinderGeometry(0.9, 1.8, 35, 8);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(pos.x, -5, pos.z);
      this.searchlightsGroup.add(tower);

      const pivot = new THREE.Object3D();
      pivot.position.set(pos.x, 12, pos.z);
      this.searchlightsGroup.add(pivot);

      // Volumetric Light Cone
      const coneGeo = new THREE.ConeGeometry(9, 85, 16, 1, true);
      coneGeo.translate(0, 42.5, 0);
      coneGeo.rotateX(Math.PI / 2);

      const coneMat = new THREE.MeshBasicMaterial({
        color: pos.color,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const cone = new THREE.Mesh(coneGeo, coneMat);
      pivot.add(cone);

      this.searchlightBeams.push({
        mesh: cone,
        pivot,
        baseSpeed: 0.75 + idx * 0.15,
        offset: idx * Math.PI * 0.35,
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

    // Generate new procedural track with enhanced stadium props and edge lights
    const trackData = generateTrack(levelConfig);
    this.currentTrackData = trackData;
    this.scene.add(trackData.trackMeshGroup);

    // Theme atmosphere and lighting adjustment
    if (levelConfig.theme === 'sunset_canyon') {
      this.scene.background = new THREE.Color(0x180b20);
      this.scene.fog = new THREE.FogExp2(0x180b20, 0.0045);
      this.hemiLight.color.setHex(0xfb923c);
      this.dirLight.color.setHex(0xfef08a);
      this.stadiumAccentLight1.color.setHex(0xe11d48);
      this.stadiumAccentLight2.color.setHex(0xf97316);
      this.stadiumAccentLight3.color.setHex(0xfacc15);
      this.stadiumAccentLight4.color.setHex(0xdb2777);
    } else if (levelConfig.theme === 'cyber_circuit') {
      this.scene.background = new THREE.Color(0x041716);
      this.scene.fog = new THREE.FogExp2(0x041716, 0.0045);
      this.hemiLight.color.setHex(0x34d399);
      this.dirLight.color.setHex(0xa7f3d0);
      this.stadiumAccentLight1.color.setHex(0x10b981);
      this.stadiumAccentLight2.color.setHex(0x06b6d4);
      this.stadiumAccentLight3.color.setHex(0x3b82f6);
      this.stadiumAccentLight4.color.setHex(0x059669);
    } else if (levelConfig.theme === 'gold_arena' || levelConfig.isFinal) {
      this.scene.background = new THREE.Color(0x181408);
      this.scene.fog = new THREE.FogExp2(0x181408, 0.0042);
      this.hemiLight.color.setHex(0xfacc15);
      this.dirLight.color.setHex(0xfffbeb);
      this.stadiumAccentLight1.color.setHex(0xf59e0b);
      this.stadiumAccentLight2.color.setHex(0xfacc15);
      this.stadiumAccentLight3.color.setHex(0xd97706);
      this.stadiumAccentLight4.color.setHex(0xfbbf24);
    } else if (levelConfig.theme === 'sky_peaks') {
      this.scene.background = new THREE.Color(0x0a1426);
      this.scene.fog = new THREE.FogExp2(0x0a1426, 0.0042);
      this.hemiLight.color.setHex(0x93c5fd);
      this.dirLight.color.setHex(0xe0f2fe);
      this.stadiumAccentLight1.color.setHex(0x38bdf8);
      this.stadiumAccentLight2.color.setHex(0x818cf8);
      this.stadiumAccentLight3.color.setHex(0x60a5fa);
      this.stadiumAccentLight4.color.setHex(0x3b82f6);
    } else {
      this.scene.background = new THREE.Color(0x060914);
      this.scene.fog = new THREE.FogExp2(0x060914, 0.0042);
      this.hemiLight.color.setHex(0x7dd3fc);
      this.dirLight.color.setHex(0xffffff);
      this.stadiumAccentLight1.color.setHex(0x0284c7);
      this.stadiumAccentLight2.color.setHex(0x6366f1);
      this.stadiumAccentLight3.color.setHex(0x0ea5e9);
      this.stadiumAccentLight4.color.setHex(0x8b5cf6);
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

    // 1. Update characters' 3D positions and cartoon limb animations
    racers.forEach(racer => {
      const rig = this.characterRigs.get(racer.country.id);
      if (rig) {
        rig.updateAnimation(racer, delta);
      }
    });

    // 2. Animate stadium searchlights sweeping across the sky
    this.searchlightBeams.forEach(sl => {
      const t = this.elapsedTime * sl.baseSpeed + sl.offset;
      sl.pivot.rotation.x = Math.sin(t * 0.7) * 0.45 - 0.2;
      sl.pivot.rotation.y = Math.cos(t * 0.9) * 0.8;
      sl.pivot.rotation.z = Math.sin(t * 0.5) * 0.3;
    });

    // 3. Animate Floating Concentric Neon Stadium Rings
    this.floatingRings.forEach(ring => {
      ring.group.rotation.x += delta * ring.rotSpeedX;
      ring.group.rotation.y += delta * ring.rotSpeedY;
      ring.group.rotation.z += delta * ring.rotSpeedZ;
      ring.group.position.y = ring.baseY + Math.sin(this.elapsedTime * ring.bobFreq) * ring.bobAmp;
    });

    // 4. Animate Holographic Audience Cheering Motions
    this.animatedCrowd.forEach(fan => {
      const bounce = Math.sin(this.elapsedTime * fan.speed + fan.phase) * 0.25;
      fan.mesh.position.y = fan.baseY + Math.max(0, bounce);

      if (fan.armLeft) {
        fan.armLeft.rotation.z = Math.sin(this.elapsedTime * fan.speed * 1.5 + fan.phase) * 0.6 - 0.4;
      }
      if (fan.armRight) {
        fan.armRight.rotation.z = -Math.sin(this.elapsedTime * fan.speed * 1.5 + fan.phase) * 0.6 + 0.4;
      }
    });

    // 5. Update Jumbotron Screens periodically (every 0.15s)
    this.jumbotronUpdateTimer += delta;
    if (this.jumbotronUpdateTimer > 0.15) {
      this.jumbotronUpdateTimer = 0;
      const leader = racers.find(r => r.currentRank === 1);
      const leaderName = leader ? leader.country.name : 'RACING';
      this.jumbotrons.forEach(jb => {
        this.renderJumbotronFeed(jb.ctx, leaderName.toUpperCase(), 'LAP IN PROGRESS', this.elapsedTime);
        jb.texture.needsUpdate = true;
      });
    }

    // 6. Animate Sky Traffic streaming
    this.flyingSkyVehicles.forEach(veh => {
      veh.angle += delta * veh.speed * 0.5;
      const vx = Math.cos(veh.angle) * veh.radius;
      const vz = Math.sin(veh.angle) * veh.radius;
      veh.mesh.position.set(vx, veh.y, vz);
      veh.mesh.lookAt(
        Math.cos(veh.angle + 0.1) * veh.radius,
        veh.y,
        Math.sin(veh.angle + 0.1) * veh.radius
      );
    });

    // 7. Update dynamic obstacle animations (e.g. rotating sweepers)
    this.currentTrackData.obstacleMeshes.forEach(({ instance, mesh }) => {
      if (instance.type === 'sweeper') {
        mesh.rotation.y += delta * instance.speed;
        instance.rotation.y = mesh.rotation.y;
      }
    });

    // 8. Update camera system
    this.cameraSystem.update(delta, racers, this.currentTrackData, racePhase);

    // 9. Render 3D Frame
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
