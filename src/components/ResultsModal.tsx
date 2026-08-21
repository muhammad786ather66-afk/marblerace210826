import React from 'react';
import { Trophy, CheckCircle, XCircle, ArrowRight, Flag, ShieldAlert, Sparkles } from 'lucide-react';
import { RaceResults } from '../types';

interface ResultsModalProps {
  results: RaceResults;
  nextCountdown: number;
  onAdvanceNow: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  results,
  nextCountdown,
  onAdvanceNow,
}) => {
  const winner = results.standings[0];

  return (
    <div
      id="results-modal"
      className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-40 animate-fade-in"
    >
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 ring-1 ring-white/10">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Race Results
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {results.roundName} Finished!
          </h2>
          <p className="text-xs text-slate-400">
            Top {results.qualifyingCount} countries qualify for the next championship round.
          </p>
        </div>

        {/* Bento Summary Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Winner Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-lg">{winner?.racer.country.flagEmoji || '🏁'}</span>
            <span className="text-[11px] font-black text-white truncate max-w-full mt-0.5">
              {winner?.racer.country.name || 'Winner'}
            </span>
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">1st Place</span>
          </div>

          {/* Qualified Count */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-base font-black font-mono">{results.qualifiedCountries.length}</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Qualified</span>
          </div>

          {/* Eliminated Count */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-base font-black font-mono">{results.eliminatedCountries.length}</span>
            </div>
            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mt-0.5">Eliminated</span>
          </div>
        </div>

        {/* Standings List */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {results.standings.map(item => {
            const timeStr = item.finishTime ? `${item.finishTime.toFixed(2)}s` : 'DNF';
            return (
              <div
                key={item.racer.country.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  item.qualified
                    ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/40'
                    : 'bg-rose-950/15 border-rose-900/30'
                }`}
              >
                {/* Left */}
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      item.rank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                        : item.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : item.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.rank}
                  </span>

                  <span className="text-xl leading-none">{item.racer.country.flagEmoji}</span>

                  <div>
                    <div className="text-xs sm:text-sm font-black text-white">
                      {item.racer.country.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Time: {timeStr}</div>
                  </div>
                </div>

                {/* Right Badge */}
                <div>
                  {item.qualified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      Qualified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      Eliminated
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Auto Progress Bar & Advance Button */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/80 border border-slate-800 rounded-2xl px-3 py-2 w-full sm:w-auto">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Next race in <strong className="text-amber-400 font-mono">{nextCountdown}s</strong></span>
          </div>

          <button
            id="btn-advance-next-race"
            onClick={onAdvanceNow}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02]"
          >
            <span>Next Race Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
