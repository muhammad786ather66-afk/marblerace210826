import React from 'react';
import { Flag, Trophy, Clock, Zap, MapPin, Activity, Flame } from 'lucide-react';
import { LevelConfig, RacerState } from '../types';

interface BroadcastHeaderProps {
  levelConfig: LevelConfig;
  activeCountriesCount: number;
  totalCountriesCount: number;
  raceTime: number;
  leaderRacer: RacerState | null;
  isCountdown: boolean;
  countdownNumber: number;
}

export const BroadcastHeader: React.FC<BroadcastHeaderProps> = ({
  levelConfig,
  activeCountriesCount,
  totalCountriesCount,
  raceTime,
  leaderRacer,
  isCountdown,
  countdownNumber,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  };

  const highestCheckpoint = leaderRacer?.lastCheckpointIndex || 0;
  const leaderSpeedKmh = leaderRacer ? Math.round(leaderRacer.currentSpeed * 3.6) : 0;

  return (
    <header
      id="broadcast-header"
      className="absolute top-3 left-3 right-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pointer-events-none z-20"
    >
      {/* Bento Module 1: Championship & Stage Identification */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-2 px-3.5 flex items-center gap-3 shadow-xl ring-1 ring-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                World Championship Tour
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-sm font-black text-white flex items-center gap-1.5 leading-none mt-0.5">
              <span>STAGE {levelConfig.levelNumber}</span>
              <span className="text-slate-500 font-semibold text-xs">/ {levelConfig.totalLevels}</span>
              {levelConfig.isFinal ? (
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full tracking-wider animate-pulse ml-1">
                  GRAND FINAL
                </span>
              ) : (
                <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold px-1.5 py-0.2 rounded uppercase ml-1">
                  {levelConfig.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bento Sub-Tile: Circuit Location */}
        <div className="hidden lg:flex bg-slate-900/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-3 py-2.5 items-center gap-2 shadow-lg ring-1 ring-white/5">
          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div className="text-xs font-extrabold text-slate-200 tracking-wide max-w-[200px] truncate">
            {levelConfig.roundName}
          </div>
        </div>
      </div>

      {/* Countdown High-Impact Center Notification */}
      {isCountdown && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 flex flex-col items-center justify-center animate-bounce pointer-events-none z-30">
          <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
            {countdownNumber === 0 ? 'GO!' : countdownNumber}
          </div>
          <div className="text-xs uppercase font-extrabold tracking-widest text-amber-300 bg-slate-950/90 px-4 py-1 rounded-full border border-amber-500/40 mt-1 shadow-xl">
            {countdownNumber === 0 ? 'RACE IN PROGRESS' : 'READY TO RACE'}
          </div>
        </div>
      )}

      {/* Bento Module 2: Live Telemetry Grid (Leader Speed, Checkpoint, Remaining, Timer) */}
      <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
        {/* Leader Speed Live Gauge */}
        {leaderRacer && (
          <div className="hidden sm:flex bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl px-3 py-1.5 items-center gap-2 shadow-lg ring-1 ring-white/5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                P1 Pace
              </div>
              <div className="text-xs font-mono font-black text-rose-300 leading-tight">
                {leaderSpeedKmh} <span className="text-[10px] font-normal text-slate-500">km/h</span>
              </div>
            </div>
          </div>
        )}

        {/* Sector Checkpoint Bento Module */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-lg ring-1 ring-white/5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Sector
            </div>
            <div className="text-xs font-black text-white font-mono leading-tight">
              {highestCheckpoint} <span className="text-slate-500 font-normal">/ 4</span>
            </div>
          </div>
        </div>

        {/* Remaining Countries Bento Module */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-lg ring-1 ring-white/5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Flag className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Nations
            </div>
            <div className="text-xs font-black text-white font-mono leading-tight">
              {activeCountriesCount} <span className="text-slate-500 font-normal">/ {totalCountriesCount}</span>
            </div>
          </div>
        </div>

        {/* Live Race Chronometer Bento Module */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/35 rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-lg ring-1 ring-amber-400/15">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Chronometer
            </div>
            <div className="text-xs font-mono font-black text-amber-300 leading-tight">
              {formatTime(raceTime)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
