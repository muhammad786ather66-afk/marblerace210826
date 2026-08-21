import { Country, LevelConfig, RaceResults, TournamentProgress, TrackSegmentType } from '../types';
import { getAllCountries } from './countries';

export function createTournament(): TournamentProgress {
  const allCountries = getAllCountries();
  // Shuffle starting seeds for fresh tournament order
  const shuffled = [...allCountries].sort(() => Math.random() - 0.5);

  return {
    currentLevel: 1,
    totalLevels: 50,
    allCountries: shuffled,
    activeCountries: shuffled,
    eliminatedCountries: [],
    history: [],
    champion: null,
    runnerUp: null,
    thirdPlace: null,
  };
}

export function getLevelConfig(levelNumber: number, tournament: TournamentProgress): LevelConfig {
  const isFinal = levelNumber === 50;

  // Levels 1-10: Round 1 Heats (100 -> 60)
  if (levelNumber <= 10) {
    const heatIdx = levelNumber;
    const segmentPool: TrackSegmentType[][] = [
      ['straight', 'right_curve', 'ramp_up', 'left_curve', 'straight', 'ramp_down', 'chicane'],
      ['straight', 'left_curve', 'mega_jump', 'straight', 'right_curve', 'straight'],
      ['straight', 'right_curve', 'hairpin_left', 'ramp_up', 'straight', 'ramp_down'],
      ['straight', 'left_curve', 'speed_tunnel', 'right_curve', 'straight', 'chicane'],
      ['straight', 'ramp_up', 'right_curve', 'left_curve', 'straight', 'ramp_down'],
    ];

    return {
      levelNumber,
      totalLevels: 50,
      name: `Sunset Coast Circuit - Heat ${heatIdx}/10`,
      theme: 'sunset_canyon',
      stageDescription: 'Opening Round: 10 Nations compete, Top 6 Qualify for Round 2!',
      roundName: `Round 1 - Heat ${heatIdx}`,
      difficulty: 'easy',
      segmentTypes: segmentPool[(levelNumber - 1) % segmentPool.length],
      qualifyingCount: 6,
      totalRacers: 10,
      isFinal: false,
    };
  }

  // Levels 11-20: Round 2 Heats (60 -> 36)
  if (levelNumber <= 20) {
    const heatIdx = levelNumber - 10;
    const segmentPool: TrackSegmentType[][] = [
      ['straight', 'rotating_sweepers', 'right_curve', 'narrow_bridge', 'left_curve', 'ramp_down', 'chicane'],
      ['straight', 'left_curve', 'bumping_field', 'mega_jump', 'right_curve', 'speed_tunnel'],
      ['straight', 'hairpin_right', 'ramp_up', 'rotating_sweepers', 'hairpin_left', 'straight'],
      ['straight', 'speed_tunnel', 'narrow_bridge', 'right_curve', 'bumping_field', 'left_curve'],
    ];

    return {
      levelNumber,
      totalLevels: 50,
      name: `Neon Skyway - Qualifier Heat ${heatIdx}/6`,
      theme: 'neon_city',
      stageDescription: 'Second Round: High obstacles, Top 6 Qualify for Quarter-Finals!',
      roundName: `Round 2 - Heat ${heatIdx}`,
      difficulty: 'medium',
      segmentTypes: segmentPool[(levelNumber - 11) % segmentPool.length],
      qualifyingCount: 6,
      totalRacers: 10,
      isFinal: false,
    };
  }

  // Levels 21-30: Quarter-Finals (36 -> 16)
  if (levelNumber <= 30) {
    const heatIdx = levelNumber - 20;
    const segmentPool: TrackSegmentType[][] = [
      ['straight', 'spiral_down', 'right_curve', 'rotating_sweepers', 'mega_jump', 'bumping_field', 'chicane'],
      ['straight', 'hairpin_left', 'narrow_bridge', 'speed_tunnel', 'rotating_sweepers', 'spiral_down'],
      ['straight', 'bumping_field', 'ramp_up', 'hairpin_right', 'rotating_sweepers', 'narrow_bridge', 'mega_jump'],
    ];

    return {
      levelNumber,
      totalLevels: 50,
      name: `Cyber Canyon - Quarter-Final ${heatIdx}/4`,
      theme: 'cyber_circuit',
      stageDescription: 'Quarter-Finals: Brutal spirals & sweepers, Top 4 Advance to Semi-Finals!',
      roundName: `Quarter-Final ${heatIdx}`,
      difficulty: 'hard',
      segmentTypes: segmentPool[(levelNumber - 21) % segmentPool.length],
      qualifyingCount: 4,
      totalRacers: 9,
      isFinal: false,
    };
  }

  // Levels 31-40: Semi-Finals & Consolidation (16 -> 8)
  if (levelNumber <= 40) {
    const heatIdx = levelNumber - 30;
    const segmentPool: TrackSegmentType[][] = [
      ['straight', 'spiral_down', 'rotating_sweepers', 'narrow_bridge', 'bumping_field', 'speed_tunnel', 'mega_jump', 'chicane'],
      ['straight', 'hairpin_left', 'speed_tunnel', 'rotating_sweepers', 'spiral_down', 'narrow_bridge', 'bumping_field'],
    ];

    return {
      levelNumber,
      totalLevels: 50,
      name: `Thunder Peak - Semi-Final Battle ${heatIdx}/2`,
      theme: 'sky_peaks',
      stageDescription: 'Semi-Finals: Only the elite remain, Top 4 Advance to the Super 8!',
      roundName: `Semi-Final ${heatIdx}`,
      difficulty: 'very_hard',
      segmentTypes: segmentPool[(levelNumber - 31) % segmentPool.length],
      qualifyingCount: 4,
      totalRacers: 8,
      isFinal: false,
    };
  }

  // Levels 41-45: Super 8 Elite Knockout Series (8 -> 3)
  if (levelNumber <= 45) {
    const stageIdx = levelNumber - 40;
    const activeCount = 9 - stageIdx; // 8, 7, 6, 5, 4
    return {
      levelNumber,
      totalLevels: 50,
      name: `Cosmic Stadium - Super 8 Knockout Stage ${stageIdx}/5`,
      theme: 'cosmic_stadium',
      stageDescription: `Elite Knockout: Last place gets eliminated immediately! (${activeCount} racers)`,
      roundName: `Super 8 - Stage ${stageIdx}`,
      difficulty: 'elite',
      segmentTypes: ['straight', 'spiral_down', 'speed_tunnel', 'rotating_sweepers', 'mega_jump', 'bumping_field', 'hairpin_right', 'chicane'],
      qualifyingCount: activeCount - 1,
      totalRacers: activeCount,
      isFinal: false,
    };
  }

  // Levels 46-49: Final 3 Placement & Showdown Series (3 Racers)
  if (levelNumber <= 49) {
    const showdownIdx = levelNumber - 45;
    return {
      levelNumber,
      totalLevels: 50,
      name: `Championship Showdown - Leg ${showdownIdx}/4`,
      theme: 'gold_arena',
      stageDescription: 'The Final 3 compete for pole position in the Grand Final!',
      roundName: `Final 3 Showdown ${showdownIdx}`,
      difficulty: 'elite',
      segmentTypes: ['straight', 'speed_tunnel', 'rotating_sweepers', 'spiral_down', 'mega_jump', 'narrow_bridge', 'bumping_field', 'chicane'],
      qualifyingCount: 3,
      totalRacers: 3,
      isFinal: false,
    };
  }

  // Level 50: GRAND FINAL WORLD CHAMPIONSHIP
  return {
    levelNumber: 50,
    totalLevels: 50,
    name: '🌟 GRAND FINAL WORLD CHAMPIONSHIP 🌟',
    theme: 'gold_arena',
    stageDescription: 'THE ULTIMATE RACE: 3 COUNTRIES • 1 WORLD CHAMPION CROWN!',
    roundName: 'GRAND FINAL',
    difficulty: 'grand_final',
    segmentTypes: [
      'straight',
      'speed_tunnel',
      'spiral_down',
      'rotating_sweepers',
      'mega_jump',
      'narrow_bridge',
      'bumping_field',
      'hairpin_left',
      'speed_tunnel',
      'grand_stadium_finish'
    ],
    qualifyingCount: 1,
    totalRacers: 3,
    isFinal: true,
  };
}

export function getRacersForLevel(levelNumber: number, tournament: TournamentProgress): Country[] {
  const config = getLevelConfig(levelNumber, tournament);

  // Round 1 (Levels 1-10): 10 heats of 10 from the 100 countries
  if (levelNumber <= 10) {
    const startIndex = (levelNumber - 1) * 10;
    return tournament.allCountries.slice(startIndex, startIndex + 10);
  }

  // Round 2 (Levels 11-20): from active countries
  if (levelNumber <= 20) {
    const heatIdx = (levelNumber - 11) % 6;
    const startIndex = heatIdx * 10;
    const pool = tournament.activeCountries.length >= 10 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 10);
  }

  // Quarter-Finals (Levels 21-30)
  if (levelNumber <= 30) {
    const heatIdx = (levelNumber - 21) % 4;
    const startIndex = heatIdx * 9;
    const pool = tournament.activeCountries.length >= 9 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 9);
  }

  // Semi-Finals (Levels 31-40)
  if (levelNumber <= 40) {
    const heatIdx = (levelNumber - 31) % 2;
    const startIndex = heatIdx * 8;
    const pool = tournament.activeCountries.length >= 8 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 8);
  }

  // Super 8 Knockout (Levels 41-45)
  if (levelNumber <= 45) {
    const count = 9 - (levelNumber - 40);
    return tournament.activeCountries.slice(0, count);
  }

  // Final 3 and Grand Final (Levels 46-50)
  return tournament.activeCountries.slice(0, 3);
}

export function advanceTournament(
  tournament: TournamentProgress,
  results: RaceResults
): TournamentProgress {
  const updatedHistory = [...tournament.history, results];
  const eliminatedIds = new Set(results.eliminatedCountries.map(c => c.id));
  const newActive = tournament.activeCountries.filter(c => !eliminatedIds.has(c.id));
  const newEliminated = [...tournament.eliminatedCountries, ...results.eliminatedCountries];

  let champion = tournament.champion;
  let runnerUp = tournament.runnerUp;
  let thirdPlace = tournament.thirdPlace;

  if (results.levelNumber === 50 && results.standings.length >= 3) {
    champion = results.standings[0].racer.country;
    runnerUp = results.standings[1].racer.country;
    thirdPlace = results.standings[2].racer.country;
  }

  return {
    ...tournament,
    currentLevel: Math.min(50, tournament.currentLevel + 1),
    activeCountries: newActive.length > 0 ? newActive : tournament.activeCountries,
    eliminatedCountries: newEliminated,
    history: updatedHistory,
    champion,
    runnerUp,
    thirdPlace,
  };
}
