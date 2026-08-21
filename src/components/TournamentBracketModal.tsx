import React, { useState } from 'react';
import { X, Trophy, Flag, ShieldAlert, History, Globe, Zap } from 'lucide-react';
import { TournamentProgress } from '../types';

interface TournamentBracketModalProps {
  tournament: TournamentProgress;
  onClose: () => void;
}

export const TournamentBracketModal: React.FC<TournamentBracketModalProps> = ({
  tournament,
  onClose,
}) => {
  const [tab, setTab] = useState<'active' | 'eliminated' | 'history'>('active');

  const eliminatedIds = new Set(tournament.eliminatedCountries.map(c => c.id));
  const activeList = tournament.allCountries.filter(c => !eliminatedIds.has(c.id));

  return (
    <div
      id="tournament-bracket-modal"
      className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] ring-1 ring-white/10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Championship Tournament Roster
              </h2>
              <p className="text-xs text-slate-400">
                100 Nations • 50 Track Levels • 1 World Champion
              </p>
            </div>
          </div>

          <button
            id="btn-close-bracket-modal"
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bento Metrics Bar */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Level</div>
              <div className="text-sm font-black text-white font-mono">{tournament.currentLevel} / 50</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Active Nations</div>
              <div className="text-sm font-black text-emerald-400 font-mono">{activeList.length}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Eliminated</div>
              <div className="text-sm font-black text-rose-400 font-mono">{tournament.eliminatedCountries.length}</div>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="tab-active-countries"
            onClick={() => setTab('active')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
              tab === 'active'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Active Nations ({activeList.length})</span>
          </button>

          <button
            id="tab-eliminated-countries"
            onClick={() => setTab('eliminated')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
              tab === 'eliminated'
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20 font-black'
                : 'bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Eliminated ({tournament.eliminatedCountries.length})</span>
          </button>

          <button
            id="tab-race-history"
            onClick={() => setTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
              tab === 'history'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                : 'bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Race History ({tournament.history.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {tab === 'active' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {activeList.map(country => (
                <div
                  key={country.id}
                  className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 transition-all shadow-sm"
                >
                  <span className="text-xl leading-none">{country.flagEmoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-200 truncate">
                      {country.name}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold">
                      {country.continent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'eliminated' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {tournament.eliminatedCountries.length === 0 ? (
                <div className="col-span-full text-center py-10 text-xs text-slate-500">
                  No countries eliminated yet! Round 1 is currently in progress.
                </div>
              ) : (
                tournament.eliminatedCountries.map((country, idx) => (
                  <div
                    key={`${country.id}-${idx}`}
                    className="flex items-center gap-2 p-2.5 rounded-2xl bg-rose-950/15 border border-rose-900/30 opacity-70"
                  >
                    <span className="text-xl grayscale leading-none">{country.flagEmoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-400 truncate">
                        {country.name}
                      </div>
                      <div className="text-[10px] text-rose-400 font-bold">Eliminated</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2.5">
              {tournament.history.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  First race in progress. Historical results will appear here as stages finish.
                </div>
              ) : (
                tournament.history.map((hist, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400">
                        Level {hist.levelNumber}: {hist.roundName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Winner: {hist.standings[0]?.racer.country.flagEmoji} {hist.standings[0]?.racer.country.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {hist.standings.map(st => (
                        <span
                          key={st.racer.country.id}
                          className={`text-[10px] font-bold px-2 py-1 rounded-xl border flex items-center gap-1.5 ${
                            st.qualified
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <span className="font-mono">{st.rank}.</span>
                          <span>{st.racer.country.flagEmoji}</span>
                          <span>{st.racer.country.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
