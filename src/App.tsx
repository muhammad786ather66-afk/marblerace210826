import React, { useEffect, useRef, useState } from 'react';
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

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const trackDataRef = useRef<GeneratedTrackData | null>(null);

  // Tournament & Level State
  const [tournament, setTournament] = useState<TournamentProgress>(() => createTournament());
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(() => getLevelConfig(1, tournament));
  const [racePhase, setRacePhase] = useState<RacePhase>('countdown');

  // Race Live Variables
  const [racers, setRacers] = useState<RacerState[]>([]);
  const racersRef = useRef<RacerState[]>([]);
  const [raceTime, setRaceTime] = useState<number>(0);
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [resultsData, setResultsData] = useState<RaceResults | null>(null);
  const [nextCountdown, setNextCountdown] = useState<number>(5);

  // Spectator Broadcast Controls
  const [cameraMode, setCameraMode] = useState<CameraMode>('broadcast');
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isBracketOpen, setIsBracketOpen] = useState<boolean>(false);

  const gameSpeedRef = useRef<number>(1);
  gameSpeedRef.current = gameSpeed;

  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const racePhaseRef = useRef<RacePhase>('countdown');
  racePhaseRef.current = racePhase;

  // Initialize Three.js Scene and first race
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const sceneManager = new SceneManager(canvasContainerRef.current);
    sceneManagerRef.current = sceneManager;

    // Start level 1
    startRaceLevel(1, tournament);

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
            raceTime,
            false
          );

          // Check if all racers or top qualifiers have finished
          if (finishCount >= racersRef.current.length) {
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
      sceneManager.destroy();
      sound.stopMusic();
    };
  }, []);

  // Function to load and start a race level
  const startRaceLevel = (lvlNum: number, currentTourney: TournamentProgress) => {
    const config = getLevelConfig(lvlNum, currentTourney);
    setLevelConfig(config);
    setCurrentLevelNumber(lvlNum);
    setRaceTime(0);
    setResultsData(null);
    setRacePhase('countdown');
    racePhaseRef.current = 'countdown';
    setCountdownNumber(3);

    // Update music intensity based on level tier
    if (lvlNum <= 10) sound.setTier(1);
    else if (lvlNum <= 20) sound.setTier(2);
    else if (lvlNum <= 30) sound.setTier(3);
    else if (lvlNum <= 45) sound.setTier(4);
    else sound.setTier(5);

    const levelCountries = getRacersForLevel(lvlNum, currentTourney);

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
    }, 1000 / gameSpeedRef.current);
  };

  // Handle Race Finish & Compute Results
  const handleRaceFinish = () => {
    if (racePhaseRef.current === 'results' || racePhaseRef.current === 'ceremony') return;

    setRacePhase('results');
    racePhaseRef.current = 'results';

    const currentRacers = [...racersRef.current].sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.trackProgress - a.trackProgress;
    });

    const qualifyingCount = levelConfig.qualifyingCount;
    const standings = currentRacers.map((r, idx) => ({
      racer: r,
      rank: idx + 1,
      finishTime: r.finishTime || 30.0 + idx * 0.5,
      qualified: idx < qualifyingCount,
    }));

    const qualifiedCountries = standings.filter(s => s.qualified).map(s => s.racer.country);
    const eliminatedCountries = standings.filter(s => !s.qualified).map(s => s.racer.country);

    const results: RaceResults = {
      levelNumber: currentLevelNumber,
      roundName: levelConfig.roundName,
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
      setTimeout(() => {
        commentary.onEliminationAnnounce(eliminatedCountries.length, eliminatedCountries.map(c => c.name));
      }, 2000);
    }

    // Check if this was the Grand Final
    if (levelConfig.isFinal) {
      const advanced = advanceTournament(tournament, results);
      setTournament(advanced);
      setTimeout(() => {
        setRacePhase('ceremony');
        racePhaseRef.current = 'ceremony';
        if (advanced.champion) {
          commentary.onGrandFinalWinner(advanced.champion.name, advanced.champion.flagEmoji);
        }
      }, 4000);
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
  };

  // Advance Tournament to Next Race
  const advanceToNextRace = (results: RaceResults) => {
    const updatedTournament = advanceTournament(tournament, results);
    setTournament(updatedTournament);
    const nextLvl = updatedTournament.currentLevel;
    startRaceLevel(nextLvl, updatedTournament);
  };

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
    const fresh = createTournament();
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
      {racePhase === 'ceremony' && tournament.champion && tournament.runnerUp && tournament.thirdPlace && (
        <GrandFinalCeremony
          champion={tournament.champion}
          runnerUp={tournament.runnerUp}
          thirdPlace={tournament.thirdPlace}
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
