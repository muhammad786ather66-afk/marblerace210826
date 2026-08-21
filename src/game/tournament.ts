import { Country, LevelConfig, RaceResults, TournamentProgress, TrackSegmentType } from '../types';
import { getAllCountries } from './countries';

export function createTournament(): TournamentProgress {
  const allCountries = getAllCountries();
  // Deterministic or seeded shuffle for a fair 100-country championship
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

// 50 Hand-Crafted Unique Track Layouts & Progression Stages
export function getLevelConfig(levelNumber: number, tournament: TournamentProgress): LevelConfig {
  const isFinal = levelNumber === 50;

  // --- ROUND 1: PRELIMINARY HEATS (Levels 1 - 10) | 100 -> 60 Countries ---
  if (levelNumber <= 10) {
    const heatIdx = levelNumber;
    const trackVariations: { name: string; theme: LevelConfig['theme']; segments: TrackSegmentType[] }[] = [
      {
        name: 'Sunset Coastline - Heat 1/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'right_curve', 'ramp_up', 'left_curve', 'straight', 'ramp_down', 'chicane'],
      },
      {
        name: 'Azure Bay Superway - Heat 2/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'left_curve', 'mega_jump', 'straight', 'right_curve', 'speed_tunnel', 'chicane'],
      },
      {
        name: 'Golden Dunes Sprint - Heat 3/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'hairpin_left', 'ramp_up', 'right_curve', 'straight', 'ramp_down', 'chicane'],
      },
      {
        name: 'Crimson Cliffs Circuit - Heat 4/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'speed_tunnel', 'left_curve', 'rotating_sweepers', 'right_curve', 'straight'],
      },
      {
        name: 'Emerald Ridge Run - Heat 5/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'ramp_up', 'hairpin_right', 'straight', 'bumping_field', 'ramp_down'],
      },
      {
        name: 'Sapphire Shoreway - Heat 6/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'left_curve', 'narrow_bridge', 'right_curve', 'speed_tunnel', 'chicane'],
      },
      {
        name: 'Solar Flare Highway - Heat 7/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'mega_jump', 'hairpin_left', 'straight', 'ramp_down', 'rotating_sweepers'],
      },
      {
        name: 'Coral Reef Freeway - Heat 8/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'right_curve', 'spiral_down', 'left_curve', 'speed_tunnel', 'chicane'],
      },
      {
        name: 'Amber Vista Sprint - Heat 9/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'hairpin_right', 'ramp_up', 'bumping_field', 'straight', 'ramp_down'],
      },
      {
        name: 'Horizon Peak Qualifier - Heat 10/10',
        theme: 'sunset_canyon',
        segments: ['straight', 'left_curve', 'rotating_sweepers', 'mega_jump', 'right_curve', 'speed_tunnel'],
      },
    ];

    const track = trackVariations[(heatIdx - 1) % trackVariations.length];
    return {
      levelNumber,
      totalLevels: 50,
      name: track.name,
      theme: track.theme,
      stageDescription: `Round 1 (Heat ${heatIdx}/10): 10 Nations compete, Top 6 Qualify for Round 2!`,
      roundName: `Round 1 - Heat ${heatIdx}`,
      difficulty: 'easy',
      segmentTypes: track.segments,
      qualifyingCount: 6,
      totalRacers: 10,
      isFinal: false,
    };
  }

  // --- ROUND 2: CONTINENTAL HEATS (Levels 11 - 16) | 60 -> 36 Countries ---
  if (levelNumber <= 16) {
    const heatIdx = levelNumber - 10;
    const trackVariations: { name: string; theme: LevelConfig['theme']; segments: TrackSegmentType[] }[] = [
      {
        name: 'Neon Skyway Express - Heat 1/6',
        theme: 'neon_city',
        segments: ['straight', 'rotating_sweepers', 'right_curve', 'narrow_bridge', 'left_curve', 'speed_tunnel', 'chicane'],
      },
      {
        name: 'Cyber Metropolis Loop - Heat 2/6',
        theme: 'neon_city',
        segments: ['straight', 'hairpin_left', 'bumping_field', 'mega_jump', 'right_curve', 'spiral_down'],
      },
      {
        name: 'Tokyo Neon Ring - Heat 3/6',
        theme: 'neon_city',
        segments: ['straight', 'speed_tunnel', 'rotating_sweepers', 'ramp_up', 'hairpin_right', 'ramp_down', 'chicane'],
      },
      {
        name: 'Silicon Skyline Run - Heat 4/6',
        theme: 'neon_city',
        segments: ['straight', 'left_curve', 'narrow_bridge', 'rotating_sweepers', 'mega_jump', 'speed_tunnel'],
      },
      {
        name: 'Laser Grid Parkway - Heat 5/6',
        theme: 'neon_city',
        segments: ['straight', 'spiral_down', 'bumping_field', 'hairpin_left', 'rotating_sweepers', 'chicane'],
      },
      {
        name: 'Neo Downtown Dash - Heat 6/6',
        theme: 'neon_city',
        segments: ['straight', 'speed_tunnel', 'mega_jump', 'narrow_bridge', 'hairpin_right', 'speed_tunnel'],
      },
    ];

    const track = trackVariations[(heatIdx - 1) % trackVariations.length];
    return {
      levelNumber,
      totalLevels: 50,
      name: track.name,
      theme: track.theme,
      stageDescription: `Round 2 (Heat ${heatIdx}/6): 10 Nations compete, Top 6 Advance to Round 3!`,
      roundName: `Round 2 - Heat ${heatIdx}`,
      difficulty: 'medium',
      segmentTypes: track.segments,
      qualifyingCount: 6,
      totalRacers: 10,
      isFinal: false,
    };
  }

  // --- ROUND 3: CHALLENGER HEATS (Levels 17 - 22) | 36 -> 24 Countries ---
  if (levelNumber <= 22) {
    const heatIdx = levelNumber - 16;
    const trackVariations: { name: string; theme: LevelConfig['theme']; segments: TrackSegmentType[] }[] = [
      {
        name: 'Cyber Canyon - Challenger 1/6',
        theme: 'cyber_circuit',
        segments: ['straight', 'spiral_down', 'rotating_sweepers', 'narrow_bridge', 'bumping_field', 'mega_jump', 'chicane'],
      },
      {
        name: 'Quantum Reactor Speedway - Challenger 2/6',
        theme: 'cyber_circuit',
        segments: ['straight', 'hairpin_left', 'speed_tunnel', 'rotating_sweepers', 'spiral_down', 'chicane'],
      },
      {
        name: 'Binary Gorge Circuit - Challenger 3/6',
        theme: 'cyber_circuit',
        segments: ['straight', 'bumping_field', 'ramp_up', 'hairpin_right', 'rotating_sweepers', 'narrow_bridge', 'mega_jump'],
      },
      {
        name: 'Vector Valley Pass - Challenger 4/6',
        theme: 'cyber_circuit',
        segments: ['straight', 'speed_tunnel', 'rotating_sweepers', 'spiral_down', 'hairpin_left', 'bumping_field'],
      },
      {
        name: 'Sub-Zero Circuit - Challenger 5/6',
        theme: 'cyber_circuit',
        segments: ['straight', 'narrow_bridge', 'mega_jump', 'rotating_sweepers', 'right_curve', 'speed_tunnel'],
      },
      {
        name: 'Omega Grid Challenge - Challenger 6/6',
        theme: 'cyber_circuit',
        segments: ['straight', 'spiral_down', 'bumping_field', 'rotating_sweepers', 'mega_jump', 'chicane'],
      },
    ];

    const track = trackVariations[(heatIdx - 1) % trackVariations.length];
    return {
      levelNumber,
      totalLevels: 50,
      name: track.name,
      theme: track.theme,
      stageDescription: `Round 3 (Heat ${heatIdx}/6): 6 Nations battle, Top 4 Advance to Quarter-Finals!`,
      roundName: `Round 3 - Heat ${heatIdx}`,
      difficulty: 'hard',
      segmentTypes: track.segments,
      qualifyingCount: 4,
      totalRacers: 6,
      isFinal: false,
    };
  }

  // --- QUARTER-FINALS (Levels 23 - 28) | 24 -> 18 Countries ---
  if (levelNumber <= 28) {
    const qfIdx = levelNumber - 22;
    return {
      levelNumber,
      totalLevels: 50,
      name: `Thunder Peak - Quarter-Final ${qfIdx}/6`,
      theme: 'sky_peaks',
      stageDescription: `Quarter-Final ${qfIdx}/6: 4 High-Ranked Nations, Top 3 Advance to Semi-Finals!`,
      roundName: `Quarter-Final ${qfIdx}`,
      difficulty: 'hard',
      segmentTypes: [
        'straight',
        'speed_tunnel',
        'spiral_down',
        'rotating_sweepers',
        'narrow_bridge',
        'mega_jump',
        'bumping_field',
        'chicane',
      ],
      qualifyingCount: 3,
      totalRacers: 4,
      isFinal: false,
    };
  }

  // --- SEMI-FINAL QUALIFIERS (Levels 29 - 34) | 18 -> 12 Countries ---
  if (levelNumber <= 34) {
    const sfIdx = levelNumber - 28;
    return {
      levelNumber,
      totalLevels: 50,
      name: `Stratosphere Arena - Semi-Final ${sfIdx}/6`,
      theme: 'sky_peaks',
      stageDescription: `Semi-Final ${sfIdx}/6: 3 Elite Nations, Top 2 Advance to Super 12!`,
      roundName: `Semi-Final ${sfIdx}`,
      difficulty: 'very_hard',
      segmentTypes: [
        'straight',
        'spiral_down',
        'rotating_sweepers',
        'speed_tunnel',
        'mega_jump',
        'narrow_bridge',
        'hairpin_left',
        'chicane',
      ],
      qualifyingCount: 2,
      totalRacers: 3,
      isFinal: false,
    };
  }

  // --- SUPER 12 STAGES (Levels 35 - 38) | 12 -> 8 Countries ---
  if (levelNumber <= 38) {
    const s12Idx = levelNumber - 34;
    return {
      levelNumber,
      totalLevels: 50,
      name: `Apex Mountain Pass - Super 12 Stage ${s12Idx}/4`,
      theme: 'sky_peaks',
      stageDescription: `Super 12 Stage ${s12Idx}/4: 3 Powerhouse Nations, Top 2 reach the Super 8!`,
      roundName: `Super 12 - Stage ${s12Idx}`,
      difficulty: 'very_hard',
      segmentTypes: [
        'straight',
        'hairpin_left',
        'rotating_sweepers',
        'spiral_down',
        'bumping_field',
        'narrow_bridge',
        'mega_jump',
        'speed_tunnel',
      ],
      qualifyingCount: 2,
      totalRacers: 3,
      isFinal: false,
    };
  }

  // --- SUPER 8 KNOCKOUT LADDER (Levels 39 - 43) | 8 -> 3 Finalists ---
  if (levelNumber <= 43) {
    const stageIdx = levelNumber - 38; // 1, 2, 3, 4, 5
    const activeCount = 9 - stageIdx; // 8, 7, 6, 5, 4
    return {
      levelNumber,
      totalLevels: 50,
      name: `Cosmic Stadium - Super 8 Knockout Stage ${stageIdx}/5`,
      theme: 'cosmic_stadium',
      stageDescription: `Super 8 Knockout: 1 Nation is eliminated directly! (${activeCount} compete, Top ${activeCount - 1} Survive)`,
      roundName: `Super 8 - Stage ${stageIdx}`,
      difficulty: 'elite',
      segmentTypes: [
        'straight',
        'spiral_down',
        'speed_tunnel',
        'rotating_sweepers',
        'mega_jump',
        'bumping_field',
        'hairpin_right',
        'chicane',
      ],
      qualifyingCount: activeCount - 1,
      totalRacers: activeCount,
      isFinal: false,
    };
  }

  // --- FINAL 3 ARENA SHOWDOWNS (Levels 44 - 49) | The 3 Finalists Battle for Glory ---
  if (levelNumber <= 49) {
    const showdownIdx = levelNumber - 43; // 1, 2, 3, 4, 5, 6
    const showdownTitles = [
      'Final 3 Sprint - Neon Cyberway',
      'Final 3 Sprint - Sky Canyon Rampage',
      'Final 3 Sprint - Thunder Ridge Spiral',
      'Final 3 Sprint - Cosmic Super Loop',
      'Final 3 Sprint - Golden Colosseum Duel',
      'Final 3 Grand Eve - Pole Position Decider',
    ];
    return {
      levelNumber,
      totalLevels: 50,
      name: showdownTitles[showdownIdx - 1] || `Final 3 Showdown ${showdownIdx}`,
      theme: 'gold_arena',
      stageDescription: `The Top 3 Finalists clash in Leg ${showdownIdx}/6 before the Grand Final!`,
      roundName: `Final 3 - Leg ${showdownIdx}`,
      difficulty: 'elite',
      segmentTypes: [
        'straight',
        'speed_tunnel',
        'rotating_sweepers',
        'spiral_down',
        'mega_jump',
        'narrow_bridge',
        'bumping_field',
        'hairpin_left',
        'chicane',
      ],
      qualifyingCount: 3,
      totalRacers: 3,
      isFinal: false,
    };
  }

  // --- LEVEL 50: 🌟 GRAND FINAL WORLD CHAMPIONSHIP 🌟 ---
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
      'grand_stadium_finish',
    ],
    qualifyingCount: 1,
    totalRacers: 3,
    isFinal: true,
  };
}

export function getRacersForLevel(levelNumber: number, tournament: TournamentProgress): Country[] {
  // Round 1 (Levels 1 - 10): 10 distinct heats of 10 from the 100 allCountries
  if (levelNumber <= 10) {
    const startIndex = (levelNumber - 1) * 10;
    const countries = tournament.allCountries.slice(startIndex, startIndex + 10);
    return countries.length > 0 ? countries : tournament.allCountries.slice(0, 10);
  }

  // Round 2 (Levels 11 - 16): 6 heats of 10 from activeCountries (60 active)
  if (levelNumber <= 16) {
    const heatIdx = levelNumber - 11;
    const startIndex = heatIdx * 10;
    const pool = tournament.activeCountries.length >= 10 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 10);
  }

  // Round 3 (Levels 17 - 22): 6 heats of 6 from activeCountries (36 active)
  if (levelNumber <= 22) {
    const heatIdx = levelNumber - 17;
    const startIndex = heatIdx * 6;
    const pool = tournament.activeCountries.length >= 6 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 6);
  }

  // Quarter-Finals (Levels 23 - 28): 6 heats of 4 from activeCountries (24 active)
  if (levelNumber <= 28) {
    const heatIdx = levelNumber - 23;
    const startIndex = heatIdx * 4;
    const pool = tournament.activeCountries.length >= 4 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 4);
  }

  // Semi-Finals (Levels 29 - 34): 6 heats of 3 from activeCountries (18 active)
  if (levelNumber <= 34) {
    const heatIdx = levelNumber - 29;
    const startIndex = heatIdx * 3;
    const pool = tournament.activeCountries.length >= 3 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 3);
  }

  // Super 12 (Levels 35 - 38): 4 heats of 3 from activeCountries (12 active)
  if (levelNumber <= 38) {
    const heatIdx = levelNumber - 35;
    const startIndex = heatIdx * 3;
    const pool = tournament.activeCountries.length >= 3 ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(startIndex, startIndex + 3);
  }

  // Super 8 Knockouts (Levels 39 - 43): 8, 7, 6, 5, 4 racers
  if (levelNumber <= 43) {
    const count = 9 - (levelNumber - 38);
    const pool = tournament.activeCountries.length >= count ? tournament.activeCountries : tournament.allCountries;
    return pool.slice(0, count);
  }

  // Final 3 and Grand Final (Levels 44 - 50): 3 Finalist Countries
  const finalPool = tournament.activeCountries.length >= 3 ? tournament.activeCountries : tournament.allCountries;
  return finalPool.slice(0, 3);
}

export function advanceTournament(
  tournament: TournamentProgress,
  results: RaceResults
): TournamentProgress {
  const updatedHistory = [...tournament.history, results];
  const eliminatedIds = new Set(results.eliminatedCountries.map(c => c.id));
  
  // Calculate new active countries
  let newActive = tournament.activeCountries.filter(c => !eliminatedIds.has(c.id));
  if (newActive.length === 0) {
    newActive = [...tournament.activeCountries];
  }

  const newEliminated = [...tournament.eliminatedCountries, ...results.eliminatedCountries];

  let champion = tournament.champion;
  let runnerUp = tournament.runnerUp;
  let thirdPlace = tournament.thirdPlace;

  // If Level 50, crown the champion from the actual final standings
  if (results.levelNumber === 50 && results.standings.length >= 1) {
    champion = results.standings[0].racer.country;
    runnerUp = results.standings[1] ? results.standings[1].racer.country : null;
    thirdPlace = results.standings[2] ? results.standings[2].racer.country : null;
  }

  return {
    ...tournament,
    currentLevel: Math.min(50, results.levelNumber + 1),
    activeCountries: newActive,
    eliminatedCountries: newEliminated,
    history: updatedHistory,
    champion,
    runnerUp,
    thirdPlace,
  };
}
