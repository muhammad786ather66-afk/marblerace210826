import React from 'react';
import { ChevronUp, ChevronDown, Eye, AlertCircle } from 'lucide-react';
import { RacerState } from '../types';

interface LeaderboardOverlayProps {
  racers: RacerState[];
  qualifyingCount: number;
  selectedCountryId: string | null;
  onSelectCountry: (countryId: string | null) => void;
}

export const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({
  racers,
  qualifyingCount,
  selectedCountryId,
  onSelectCountry,
}) => {
  // Sort racers by rank
  const sortedRacers = [...racers].sort((a, b) => a.currentRank - b.currentRank);

  return (
    <aside
      id="leaderboard-overlay"
      className="absolute top-20 left-3 w-60 sm:w-68 max-h-[calc(100vh-175px)] flex flex-col rounded-3xl bg-slate-900/90 backdrop-blur-md border border-slate-800/90 shadow-2xl p-2.5 z-20 transition-all ring-1 ring-white/5"
    >
      {/* Bento Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
            Live Standings
          </span>
        </div>
        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Top {qualifyingCount} Qualify
        </span>
      </div>

      {/* Racers Bento List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin scrollbar-thumb-slate-700">
        {sortedRacers.map((racer, index) => {
          const isQualified = racer.currentRank <= qualifyingCount;
          const isSelected = selectedCountryId === racer.country.id;
          const rankChange = racer.previousRank - racer.currentRank; // Positive = gained positions

          const isCutoffLine = index === qualifyingCount - 1 && qualifyingCount < racers.length;

          return (
            <React.Fragment key={racer.country.id}>
              <button
                id={`leaderboard-row-${racer.country.id}`}
                onClick={() => onSelectCountry(isSelected ? null : racer.country.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-sky-500/25 border border-sky-400/80 shadow-md shadow-sky-500/20 ring-1 ring-sky-400/50'
                    : isQualified
                    ? 'bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700'
                    : 'bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40'
                }`}
              >
                {/* Left: Rank, Flag, Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      racer.currentRank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                        : racer.currentRank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : racer.currentRank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {racer.currentRank}
                  </span>

                  <span className="text-base shrink-0 leading-none">{racer.country.flagEmoji}</span>

                  <span className="text-xs font-bold text-slate-100 truncate">
                    {racer.country.name}
                  </span>
                </div>

                {/* Right: Overtake delta & status */}
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  {rankChange > 0 ? (
                    <span className="flex items-center text-[10px] font-black text-emerald-400 font-mono">
                      <ChevronUp className="w-3.5 h-3.5 -mr-0.5" />
                      {rankChange}
                    </span>
                  ) : rankChange < 0 ? (
                    <span className="flex items-center text-[10px] font-black text-rose-400 font-mono">
                      <ChevronDown className="w-3.5 h-3.5 -mr-0.5" />
                      {Math.abs(rankChange)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 font-mono">-</span>
                  )}

                  {racer.finished ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black font-mono">
                      FIN
                    </span>
                  ) : isSelected ? (
                    <Eye className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  ) : null}
                </div>
              </button>

              {/* Elimination Danger Zone Divider */}
              {isCutoffLine && (
                <div className="flex items-center gap-2 my-1.5 px-1">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
                  <span className="text-[9px] font-black tracking-wider uppercase text-rose-400 flex items-center gap-1 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-2.5 h-2.5" /> Danger Zone
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </aside>
  );
};
