export interface Country {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: 'stripes-h' | 'stripes-v' | 'circle' | 'cross' | 'bicolor-h' | 'bicolor-v' | 'tricolor-h' | 'tricolor-v' | 'diagonal' | 'stars' | 'sun' | 'solid';
  continent: 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania';
  baseSpeed: number;     // 0.85 - 1.15
  acceleration: number;  // 0.85 - 1.15
  jumpPower: number;     // 0.85 - 1.15
  agility: number;       // 0.85 - 1.15
  stability: number;     // resistance to obstacles
}

export type RacerEmotion = 'running' | 'excited' | 'worried' | 'jumping' | 'falling' | 'celebrating' | 'sad' | 'determined';

export interface RacerState {
  country: Country;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  trackProgress: number; // 0.0 to 1.0 along spline
  currentSegmentIndex: number;
  lastCheckpointIndex: number;
  laneOffset: number; // -1 to 1 lateral track offset
  targetLaneOffset: number;
  speed: number;
  isGrounded: boolean;
  isJumping: boolean;
  isFalling: boolean;
  isRecovering: boolean;
  recoveryTimer: number;
  finished: boolean;
  finishTime: number | null;
  currentRank: number;
  previousRank: number;
  emotion: RacerEmotion;
  legPhase: number;
  armPhase: number;
  stamina: number;
  surgeTimer: number;
  airborneTime: number;
  totalDistanceTraveled: number;
  stuckTimer: number;
  boostTimer: number;
  isEliminated: boolean;
  stats: {
    overtakes: number;
    checkpointsHit: number;
    timesKnockedOff: number;
    highestPosition: number;
  };
}

export type TrackSegmentType = 
  | 'straight'
  | 'left_curve'
  | 'right_curve'
  | 'hairpin_left'
  | 'hairpin_right'
  | 'ramp_up'
  | 'ramp_down'
  | 'mega_jump'
  | 'narrow_bridge'
  | 'split_lanes'
  | 'spiral_down'
  | 'speed_tunnel'
  | 'moving_platforms'
  | 'rotating_sweepers'
  | 'bumping_field'
  | 'chicane'
  | 'checkpoint'
  | 'grand_stadium_finish';

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
  tangent: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  binormal: { x: number; y: number; z: number };
  width: number;
  hasRails: boolean;
  isSpeedZone?: boolean;
}

export interface ObstacleInstance {
  id: string;
  type: 'sweeper' | 'bumper' | 'moving_platform' | 'rolling_boulder' | 'swinging_hammer' | 'boost_pad';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  trackProgress: number;
  active: boolean;
  speed: number;
  phase: number;
}

export interface CheckpointGate {
  index: number;
  totalCheckpoints: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  trackProgress: number;
  width: number;
}

export interface LevelConfig {
  levelNumber: number;
  totalLevels: number;
  name: string;
  theme: 'neon_city' | 'sky_peaks' | 'sunset_canyon' | 'cyber_circuit' | 'cosmic_stadium' | 'gold_arena';
  stageDescription: string;
  roundName: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' | 'elite' | 'grand_final';
  segmentTypes: TrackSegmentType[];
  qualifyingCount: number; // How many countries advance from this race
  totalRacers: number;
  isFinal: boolean;
}

export type CameraMode = 'broadcast' | 'leader' | 'overtake' | 'hazard' | 'wide' | 'finish' | 'fpv' | 'manual_follow';

export interface RaceResults {
  levelNumber: number;
  roundName: string;
  qualifyingCount: number;
  standings: {
    racer: RacerState;
    rank: number;
    finishTime: number;
    qualified: boolean;
  }[];
  eliminatedCountries: Country[];
  qualifiedCountries: Country[];
}

export interface TournamentProgress {
  currentLevel: number;
  totalLevels: number;
  allCountries: Country[];
  activeCountries: Country[];
  eliminatedCountries: Country[];
  history: RaceResults[];
  champion: Country | null;
  runnerUp: Country | null;
  thirdPlace: Country | null;
}

export type RacePhase = 'countdown' | 'racing' | 'finishing' | 'results' | 'ceremony';
