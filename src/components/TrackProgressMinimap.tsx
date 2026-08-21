import React from 'react';
import { Flag, Zap, Navigation } from 'lucide-react';
import { RacerState } from '../types';

interface TrackProgressMinimapProps {
  racers: RacerState[];
}

export const TrackProgressMinimap: React.FC<TrackProgressMinimapProps> = ({ racers }) => {
  return (
    <div
      id="track-progress-minimap"
      className="absolute bottom-16 left-3 right-3 sm:left-24 sm:right-24 z-20 pointer-events-none"
    >
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-2.5 px-4 shadow-2xl ring-1 ring-white/5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
            <Navigation className="w-3 h-3 text-sky-400" />
            <span>Track Progress Telemetry</span>
          </div>
          <div className="text-[9px] font-mono text-slate-500 font-bold">
            4 SECTORS • ELEVATED 3D CIRCUIT
          </div>
        </div>

        <div className="relative w-full h-7 flex items-center">
          {/* Base Track Line */}
          <div className="absolute left-0 right-0 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/90">
            <div className="h-full w-full bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-amber-400/25"></div>
          </div>

          {/* Start Line Gate */}
          <div className="absolute left-0 -top-1 transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-slate-950 flex items-center justify-center text-[7px] font-black text-slate-950 shadow-sm">
              S
            </div>
            <span className="text-[7px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">START</span>
          </div>

          {/* Checkpoint Indicators */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => (
            <div
              key={idx}
              className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${pct * 100}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-sky-500 border border-slate-950 flex items-center justify-center shadow-sm">
                <Zap className="w-1.5 h-1.5 text-slate-950" />
              </div>
              <span className="text-[7px] font-bold text-slate-500 mt-0.5 font-mono">CP{idx + 1}</span>
            </div>
          ))}

          {/* Finish Line Gate */}
          <div className="absolute right-0 -top-1 transform translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center shadow-md shadow-amber-400/40">
              <Flag className="w-2 h-2 text-slate-950" />
            </div>
            <span className="text-[7px] font-black text-amber-400 mt-0.5 tracking-wider">FINISH</span>
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
                title={`${racer.country.name} (P${racer.currentRank})`}
              >
                <div
                  className={`relative rounded-full transition-transform ${
                    isLeader
                      ? 'w-5 h-5 ring-2 ring-amber-400 shadow-md shadow-amber-400/50 scale-110'
                      : 'w-3.5 h-3.5 ring-1 ring-white/60 shadow-sm'
                  } flex items-center justify-center text-xs overflow-hidden`}
                  style={{ backgroundColor: racer.country.primaryColor }}
                >
                  <span className="text-[8px] leading-none select-none">
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
