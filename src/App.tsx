import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraMode, LevelConfig, RacePhase, RaceResults, RacerState, TournamentProgress } from './types';
import { createTournament, getLevelConfig, getRacersForLevel, advanceTournament } from './game/tournament';
import { SceneManager } from './game/sceneManager';
import { GeneratedTrackData } from './game/trackGenerator';
import { initializeRacers, updatePhysicsAndAI } from './game/physicsAI';
import { sound } from './game/audio';
import { commentary } from './game/commentary';
import { BroadcastHeader } from './components/BroadcastHeader';
import { LeaderboardOverlay } from './components/LeaderboardOverlay';
import { TrackProgressMinimap } from './components/TrackProgressMinimap';
import { CommentaryTicker } from './components/CommentaryTicker';
import { BroadcastControls } from './components/BroadcastControls';
import { ResultsModal } from './components/ResultsModal';
import { GrandFinalCeremony } from './components/GrandFinalCeremony';
import { TournamentBracketModal } from './components/TournamentBracketModal';
import { FastForward, Play, Trophy, Sparkles, ChevronRight, Zap } from 'lucide-react';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const trackDataRef = useRef<GeneratedTrackData | null>(null);

  // Authoritative Tournament & Level State using both Ref (for async loops/timers) and State (for UI)
  const initialTournament = createTournament();
  const [tournament, setTournament] = useState<TournamentProgress>(initialTournament);
  const tournamentRef = useRef<TournamentProgress>(initialTournament);
  tournamentRef.current = tournament;

  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const currentLevelRef = useRef<number>(1);
  currentLevelRef.current = currentLevelNumber;

  const [levelConfig, setLevelConfig] = useState<LevelConfig>(() => getLevelConfig(1, initialTournament));
  const levelConfigRef = useRef<LevelConfig>(levelConfig);
  levelConfigRef.current = levelConfig;

  const [racePhase, setRacePhase] = useState<RacePhase>('countdown');
  const racePhaseRef = useRef<RacePhase>('countdown');
  racePhaseRef.current = racePhase;

  // Race Live Variables
  const [racers, setRacers] = useState<RacerState[]>([]);
  const racersRef = useRef<RacerState[]>([]);
  const [raceTime, setRaceTime] = useState<number>(0);
  const raceTimeRef = useRef<number>(0);
  raceTimeRef.current = raceTime;

  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [resultsData, setResultsData] = useState<RaceResults | null>(null);
  const [nextCountdown, setNextCountdown] = useState<number>(5);

  // Spectator Broadcast Controls
  const [cameraMode, setCameraMode] = useState<CameraMode>('broadcast');
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isBracketOpen, setIsBracketOpen] = useState<boolean>(false);
  const [isDebugMenuOpen, setIsDebugMenuOpen] = useState<boolean>(false);

  const gameSpeedRef = useRef<number>(1);
  gameSpeedRef.current = gameSpeed;

  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  // Active timers tracking for safe cleanup
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const winnerFinishTimeRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  const clearAllTimers = useCallback(() => {
    activeTimersRef.current.forEach(timer => clearInterval(timer));
    activeTimersRef.current = [];
  }, []);

  // Compute Results & Finish Race safely
  const handleRaceFinish = useCallback(() => {
    if (racePhaseRef.current === 'results' || racePhaseRef.current === 'ceremony') return;
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    clearAllTimers();

    setRacePhase('results');
    racePhaseRef.current = 'results';

    const currentRacers = [...racersRef.current].sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.trackProgress - a.trackProgress;
    });

    const activeConfig = levelConfigRef.current;
    const qualifyingCount = activeConfig.qualifyingCount;
    const standings = currentRacers.map((r, idx) => ({
      racer: r,
      rank: idx + 1,
      finishTime: r.finishTime || (raceTimeRef.current > 0 ? raceTimeRef.current + idx * 0.4 : 25.0 + idx * 0.4),
      qualified: idx < qualifyingCount,
    }));

    const qualifiedCountries = standings.filter(s => s.qualified).map(s => s.racer.country);
    const eliminatedCountries = standings.filter(s => !s.qualified).map(s => s.racer.country);

    const results: RaceResults = {
      levelNumber: activeConfig.levelNumber,
      roundName: activeConfig.roundName,
      qualifyingCount,
      standings,
      eliminatedCountries,
      qualifiedCountries,
    };

    setResultsData(results);

    // Announce commentary
    const winner = standings[0];
    if (winner && standings[1]) {
      commentary.onPhotoFinish(winner.racer.country.name, winner.racer.country.flagEmoji, standings[1].racer.country.name);
    }
    if (eliminatedCountries.length > 0) {
      const elimTimeout = setTimeout(() => {
        commentary.onEliminationAnnounce(eliminatedCountries.length, eliminatedCountries.map(c => c.name));
      }, 1800);
      activeTimersRef.current.push(elimTimeout);
    }

    // Check if this was the Grand Final (Level 50)
    if (activeConfig.isFinal) {
      const advancedTourney = advanceTournament(tournamentRef.current, results);
      tournamentRef.current = advancedTourney;
      setTournament(advancedTourney);

      const ceremonyTimeout = setTimeout(() => {
        setRacePhase('ceremony');
        racePhaseRef.current = 'ceremony';
        if (advancedTourney.champion) {
          commentary.onGrandFinalWinner(advancedTourney.champion.name, advancedTourney.champion.flagEmoji);
        }
      }, 3500);
      activeTimersRef.current.push(ceremonyTimeout);
      return;
    }

    // Automatic Transition Countdown to Next Race
    let nextCount = 5;
    setNextCountdown(nextCount);
    const nextInterval = setInterval(() => {
      nextCount--;
      setNextCountdown(nextCount);
      if (nextCount <= 0) {
        clearInterval(nextInterval);
        advanceToNextRace(results);
      }
    }, 1000 / gameSpeedRef.current);
    activeTimersRef.current.push(nextInterval);
  }, [clearAllTimers]);

  // Load and start a race level
  const startRaceLevel = useCallback((lvlNum: number, currentTourney: TournamentProgress) => {
    clearAllTimers();
    isTransitioningRef.current = false;
    winnerFinishTimeRef.current = null;

    const boundedLevel = Math.max(1, Math.min(50, lvlNum));
    const config = getLevelConfig(boundedLevel, currentTourney);
    
    setLevelConfig(config);
    levelConfigRef.current = config;
    setCurrentLevelNumber(boundedLevel);
    currentLevelRef.current = boundedLevel;

    setRaceTime(0);
    raceTimeRef.current = 0;
    setResultsData(null);
    setRacePhase('countdown');
    racePhaseRef.current = 'countdown';
    setCountdownNumber(3);

    // Update music intensity based on level tier
    if (boundedLevel <= 10) sound.setTier(1);
    else if (boundedLevel <= 20) sound.setTier(2);
    else if (boundedLevel <= 30) sound.setTier(3);
    else if (boundedLevel <= 45) sound.setTier(4);
    else sound.setTier(5);

    const levelCountries = getRacersForLevel(boundedLevel, currentTourney);

    if (sceneManagerRef.current) {
      const trackData = sceneManagerRef.current.loadTrackAndRacers(config, levelCountries);
      trackDataRef.current = trackData;

      const initialRacers = initializeRacers(levelCountries, trackData);
      racersRef.current = initialRacers;
      setRacers(initialRacers);
    }

    // Play countdown 3, 2, 1, GO!
    sound.playCountdown(false);
    let count = 3;
    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNumber(count);
        sound.playCountdown(false);
      } else if (count === 0) {
        setCountdownNumber(0);
        sound.playCountdown(true);
        setRacePhase('racing');
        racePhaseRef.current = 'racing';
        commentary.onRaceStart(config.levelNumber, config.roundName, levelCountries.length);
        clearInterval(countInterval);
      }
    }, 1000 / Math.max(1, gameSpeedRef.current));
    activeTimersRef.current.push(countInterval);
  }, [clearAllTimers]);

  // Advance Tournament to Next Race
  const advanceToNextRace = useCallback((results?: RaceResults) => {
    clearAllTimers();
    const currentTourney = tournamentRef.current;
    let nextTourney: TournamentProgress;

    if (results) {
      nextTourney = advanceTournament(currentTourney, results);
    } else {
      // Manual advance without results
      const currentRacers = [...racersRef.current].sort((a, b) => b.trackProgress - a.trackProgress);
      const qualifyingCount = levelConfigRef.current.qualifyingCount;
      const standings = currentRacers.map((r, idx) => ({
        racer: r,
        rank: idx + 1,
        finishTime: r.finishTime || 30.0 + idx * 0.5,
        qualified: idx < qualifyingCount,
      }));
      const mockResults: RaceResults = {
        levelNumber: currentLevelRef.current,
        roundName: levelConfigRef.current.roundName,
        qualifyingCount,
        standings,
        eliminatedCountries: standings.filter(s => !s.qualified).map(s => s.racer.country),
        qualifiedCountries: standings.filter(s => s.qualified).map(s => s.racer.country),
      };
      nextTourney = advanceTournament(currentTourney, mockResults);
    }

    tournamentRef.current = nextTourney;
    setTournament(nextTourney);

    const nextLvl = nextTourney.currentLevel;
    startRaceLevel(nextLvl, nextTourney);
  }, [clearAllTimers, startRaceLevel]);

  // Force Finish Race immediately (for instant testing or spectator fast-forward)
  const handleForceFinish = useCallback(() => {
    if (racePhaseRef.current === 'results' || racePhaseRef.current === 'ceremony') return;

    // Instantly simulate completion order based on current progress
    racersRef.current.forEach((r, idx) => {
      r.finished = true;
      r.finishTime = 12.0 + idx * 0.35;
    });

    handleRaceFinish();
  }, [handleRaceFinish]);

  // Jump to any level directly for QA / testing
  const handleJumpToLevel = useCallback((targetLvl: number) => {
    clearAllTimers();
    let currentTourney = { ...tournamentRef.current };
    currentTourney.currentLevel = targetLvl;
    tournamentRef.current = currentTourney;
    setTournament(currentTourney);
    startRaceLevel(targetLvl, currentTourney);
  }, [clearAllTimers, startRaceLevel]);

  // Initialize Three.js Scene and first race
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const sceneManager = new SceneManager(canvasContainerRef.current);
    sceneManagerRef.current = sceneManager;

    // Start level 1
    startRaceLevel(1, tournamentRef.current);

    // Audio init & background music
    sound.init();
    sound.startMusic();

    let lastTime = performance.now();
    let animationFrameId: number;

    const renderLoop = (now: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const rawDelta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPausedRef.current) {
        return;
      }

      const effectiveDelta = rawDelta * gameSpeedRef.current;

      if (sceneManagerRef.current && trackDataRef.current && racersRef.current.length > 0) {
        // Physics & AI update
        if (racePhaseRef.current === 'racing') {
          setRaceTime(t => t + effectiveDelta);
          const { finishCount } = updatePhysicsAndAI(
            racersRef.current,
            trackDataRef.current,
            effectiveDelta,
            raceTimeRef.current,
            false
          );

          // Check if the 1st place marble crossed the finish line
          const firstFinisher = racersRef.current.find(r => r.finished);
          if (firstFinisher && winnerFinishTimeRef.current === null) {
            winnerFinishTimeRef.current = raceTimeRef.current;
          }

          // Complete race condition:
          // 1. All racers finished, OR
          // 2. Winner finished and 4 seconds have passed (grace cutoff for stragglers), OR
          // 3. Race exceeded 50 seconds timeout
          const allFinished = finishCount >= racersRef.current.length;
          const winnerGraceElapsed = winnerFinishTimeRef.current !== null && raceTimeRef.current - winnerFinishTimeRef.current > 4.5;
          const maxRaceTimeout = raceTimeRef.current > 55;

          if (allFinished || winnerGraceElapsed || maxRaceTimeout) {
            handleRaceFinish();
          }
        } else if (racePhaseRef.current === 'countdown') {
          updatePhysicsAndAI(racersRef.current, trackDataRef.current, effectiveDelta, 0, true);
        }

        // Render 3D Scene
        sceneManagerRef.current.update(effectiveDelta, racersRef.current, racePhaseRef.current);
        setRacers([...racersRef.current]);
      }
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearAllTimers();
      sceneManager.destroy();
      sound.stopMusic();
    };
  }, [clearAllTimers, handleRaceFinish, startRaceLevel]);

  // Handle Manual Country Camera Select
  const handleSelectCountry = (countryId: string | null) => {
    setSelectedCountryId(countryId);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.getCameraSystem().setTargetCountry(countryId);
      if (countryId) {
        setCameraMode('manual_follow');
      } else {
        setCameraMode('broadcast');
        sceneManagerRef.current.getCameraSystem().setMode('broadcast');
      }
    }
  };

  // Handle Camera Mode Selection
  const handleSelectCameraMode = (mode: CameraMode) => {
    setCameraMode(mode);
    setSelectedCountryId(null);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.getCameraSystem().setMode(mode);
    }
  };

  // Restart Tournament from Level 1
  const handleRestartTournament = () => {
    clearAllTimers();
    const fresh = createTournament();
    tournamentRef.current = fresh;
    setTournament(fresh);
    startRaceLevel(1, fresh);
  };

  const leaderRacer = racers.find(r => r.currentRank === 1) || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Top Broadcast TV Header */}
      <BroadcastHeader
        levelConfig={levelConfig}
        activeCountriesCount={tournament.activeCountries.length}
        totalCountriesCount={tournament.allCountries.length}
        raceTime={raceTime}
        leaderRacer={leaderRacer}
        isCountdown={racePhase === 'countdown'}
        countdownNumber={countdownNumber}
      />

      {/* Live Standings Leaderboard Overlay */}
      <LeaderboardOverlay
        racers={racers}
        qualifyingCount={levelConfig.qualifyingCount}
        selectedCountryId={selectedCountryId}
        onSelectCountry={handleSelectCountry}
      />

      {/* Live Track Progress 2D Minimap */}
      <TrackProgressMinimap racers={racers} />

      {/* Dynamic Commentary Ticker */}
      <CommentaryTicker />

      {/* Quick Fast-Forward / Level Jumper Floating Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1 px-2.5 shadow-xl z-30 pointer-events-auto ring-1 ring-white/5">
        <button
          id="btn-force-finish-race"
          onClick={handleForceFinish}
          disabled={racePhase !== 'racing'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Instantly finish current race to verify results and progression"
        >
          <FastForward className="w-3 h-3" />
          <span>Finish Race</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5"></div>

        {/* Level Quick Jump Dropdown */}
        <div className="relative">
          <button
            id="btn-level-jump-menu"
            onClick={() => setIsDebugMenuOpen(!isDebugMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-extrabold text-slate-300 hover:bg-slate-800/80 border border-slate-800 transition-all"
          >
            <Zap className="w-3 h-3 text-sky-400" />
            <span>Jump Stage</span>
          </button>

          {isDebugMenuOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-2 shadow-2xl space-y-1 z-40 ring-1 ring-white/10">
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800">
                Championship Stage Selector
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {[
                  { lvl: 1, label: 'L1: Round 1 (Heat 1/10)' },
                  { lvl: 2, label: 'L2: Round 1 (Heat 2/10)' },
                  { lvl: 3, label: 'L3: Round 1 (Heat 3/10)' },
                  { lvl: 10, label: 'L10: Round 1 Finale' },
                  { lvl: 11, label: 'L11: Round 2 (Neon City)' },
                  { lvl: 17, label: 'L17: Round 3 Challengers' },
                  { lvl: 23, label: 'L23: Quarter-Final 1/6' },
                  { lvl: 29, label: 'L29: Semi-Final 1/6' },
                  { lvl: 35, label: 'L35: Super 12 Stage 1' },
                  { lvl: 39, label: 'L39: Super 8 Knockout' },
                  { lvl: 43, label: 'L43: Final 3 Decider' },
                  { lvl: 44, label: 'L44: Top 3 Showdown 1' },
                  { lvl: 49, label: 'L49: Grand Final Eve' },
                  { lvl: 50, label: '🌟 L50: GRAND FINAL 🌟' },
                ].map(item => (
                  <button
                    key={item.lvl}
                    onClick={() => {
                      handleJumpToLevel(item.lvl);
                      setIsDebugMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-left transition-all ${
                      currentLevelNumber === item.lvl
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Broadcast Controls */}
      <BroadcastControls
        currentCameraMode={cameraMode}
        onSelectCameraMode={handleSelectCameraMode}
        gameSpeed={gameSpeed}
        onChangeSpeed={spd => setGameSpeed(spd)}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onOpenBracket={() => setIsBracketOpen(true)}
        onRestartTournament={handleRestartTournament}
      />

      {/* Post-Race Qualification & Elimination Modal */}
      {racePhase === 'results' && resultsData && (
        <ResultsModal
          results={resultsData}
          nextCountdown={nextCountdown}
          onAdvanceNow={() => advanceToNextRace(resultsData)}
        />
      )}

      {/* Grand Final Level 50 World Champion Ceremony */}
      {racePhase === 'ceremony' && tournament.champion && (
        <GrandFinalCeremony
          champion={tournament.champion}
          runnerUp={tournament.runnerUp || tournament.activeCountries[1] || tournament.allCountries[1]}
          thirdPlace={tournament.thirdPlace || tournament.activeCountries[2] || tournament.allCountries[2]}
          onNewChampionship={handleRestartTournament}
        />
      )}

      {/* Tournament Roster & Standings Modal */}
      {isBracketOpen && (
        <TournamentBracketModal
          tournament={tournament}
          onClose={() => setIsBracketOpen(false)}
        />
      )}
    </div>
  );
}
