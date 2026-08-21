import React from 'react';
import { Flag, Zap } from 'lucide-react';
import { RacerState } from '../types';

interface TrackProgressMinimapProps {
  racers: RacerState[];
}

export const TrackProgressMinimap: React.FC<TrackProgressMinimapProps> = ({ racers }) => {
  return (
    <div
      id="track-progress-minimap"
      className="absolute bottom-20 left-4 right-4 sm:left-28 sm:right-28 z-20 pointer-events-none"
    >
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-3 px-5 shadow-2xl ring-1 ring-white/5">
        <div className="relative w-full h-8 flex items-center">
          {/* Base Track Line with Bento Accent Gradient */}
          <div className="absolute left-0 right-0 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div className="h-full w-full bg-gradient-to-r from-sky-500/20 via-amber-400/20 to-emerald-400/20"></div>
          </div>

          {/* Start Line Gate */}
          <div className="absolute left-0 -top-1 transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-950 shadow-sm">
              S
            </div>
            <span className="text-[8px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">Start</span>
          </div>

          {/* Checkpoint Indicators */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => (
            <div
              key={idx}
              className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${pct * 100}%` }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-sky-500/90 border border-slate-950 flex items-center justify-center shadow-sm">
                <Zap className="w-2 h-2 text-slate-950" />
              </div>
              <span className="text-[7px] font-bold text-slate-500 mt-0.5 font-mono">CP{idx + 1}</span>
            </div>
          ))}

          {/* Finish Line Gate */}
          <div className="absolute right-0 -top-1 transform translate-x-1/2 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/30">
              <Flag className="w-2.5 h-2.5 text-slate-950" />
            </div>
            <span className="text-[8px] font-black text-amber-400 mt-0.5 tracking-wider">FINISH</span>
          </div>

          {/* Moving Marble Icons */}
          {racers.map(racer => {
            const leftPct = Math.min(100, Math.max(0, racer.trackProgress * 100));
            const isLeader = racer.currentRank === 1;

            return (
              <div
                key={racer.country.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-100 flex flex-col items-center pointer-events-auto"
                style={{ left: `${leftPct}%`, zIndex: isLeader ? 30 : 10 }}
                title={`${racer.country.name} (Rank: ${racer.currentRank})`}
              >
                <div
                  className={`relative rounded-full transition-transform ${
                    isLeader
                      ? 'w-6 h-6 ring-2 ring-amber-400 shadow-md shadow-amber-400/50 scale-110'
                      : 'w-4 h-4 ring-1 ring-white/70 shadow-sm'
                  } flex items-center justify-center text-xs overflow-hidden`}
                  style={{ backgroundColor: racer.country.primaryColor }}
                >
                  <span className="text-[9px] leading-none select-none">
                    {racer.country.flagEmoji}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
