import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Award, Zap, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { RacerState } from '../types';

interface LeaderboardOverlayProps {
  racers: RacerState[];
  cutoffRank: number;
  onSelectRacer?: (racerId: string) => void;
  selectedRacerId?: string | null;
}

export const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({
  racers,
  cutoffRank,
  onSelectRacer,
  selectedRacerId,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Sort racers strictly by current position/rank
  const sortedRacers = [...racers].sort((a, b) => a.currentRank - b.currentRank);
  const displayRacers = isExpanded ? sortedRacers : sortedRacers.slice(0, 5);

  const leaderProgress = sortedRacers[0]?.trackProgress || 0;

  return (
    <aside
      id="leaderboard-overlay"
      aria-label="Championship Leaderboard"
      className="absolute top-20 left-3 z-20 pointer-events-auto max-w-[260px] sm:max-w-[280px] w-full"
    >
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-3 shadow-2xl ring-1 ring-white/5 flex flex-col gap-2">
        {/* Bento Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] font-black tracking-wider uppercase text-white">
                Live Standings
              </span>
              <div className="text-[9px] text-slate-400 font-semibold leading-tight">
                Top {cutoffRank} Advance
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all text-[10px] flex items-center gap-0.5 px-2"
          >
            {isExpanded ? (
              <>
                <span>Top 5</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>All ({racers.length})</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Racer Bento List */}
        <div className="space-y-1 max-h-[380px] sm:max-h-[460px] overflow-y-auto pr-1 select-none custom-scrollbar">
          {displayRacers.map((racer, index) => {
            const isQualifying = racer.currentRank <= cutoffRank;
            const isCutoffLine = racer.currentRank === cutoffRank && index < displayRacers.length - 1;
            const isSelected = selectedRacerId === racer.country.id;

            // Gap calculation
            const gapProgress = leaderProgress - racer.trackProgress;
            const gapMeters = Math.max(0, Math.round(gapProgress * 280));
            const speedKmh = Math.round(racer.currentSpeed * 3.6);

            return (
              <React.Fragment key={racer.country.id}>
                <div
                  onClick={() => onSelectRacer?.(racer.country.id)}
                  className={`group relative flex items-center justify-between p-1.5 px-2 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-400/80 shadow-md ring-1 ring-sky-400/50'
                      : isQualifying
                      ? 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                      : 'bg-rose-950/30 hover:bg-rose-900/40 border-rose-900/40 opacity-80'
                  }`}
                >
                  {/* Rank Position Pill */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        racer.currentRank === 1
                          ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                          : racer.currentRank === 2
                          ? 'bg-slate-300 text-slate-950 font-bold'
                          : racer.currentRank === 3
                          ? 'bg-amber-700 text-white font-bold'
                          : isQualifying
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-rose-900/80 text-rose-300'
                      }`}
                    >
                      {racer.currentRank}
                    </div>

                    {/* Flag & Country Name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base leading-none drop-shadow-sm">
                        {racer.country.flagEmoji}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-100 truncate block group-hover:text-sky-300 transition-colors">
                          {racer.country.name}
                        </span>
                        {/* Speed Micro-Bar */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono text-slate-400">
                            {speedKmh} km/h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status / Gap Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {racer.finished ? (
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-lg">
                        FIN
                      </span>
                    ) : racer.currentRank === 1 ? (
                      <span className="text-[9px] font-black text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded-lg font-mono">
                        LEADER
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded-lg border border-slate-800">
                        +{gapMeters}m
                      </span>
                    )}

                    {isQualifying ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Qualification Cutoff Boundary Divider */}
                {isCutoffLine && (
                  <div className="relative py-1 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
                    <span className="relative text-[8px] font-black uppercase tracking-widest bg-slate-950 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/40 shadow-sm">
                      Knockout Danger Zone
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
