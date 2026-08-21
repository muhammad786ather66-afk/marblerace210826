import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles, RotateCcw, Award } from 'lucide-react';
import { Country } from '../types';

interface GrandFinalCeremonyProps {
  champion: Country;
  runnerUp: Country;
  thirdPlace: Country;
  onNewChampionship: () => void;
}

export const GrandFinalCeremony: React.FC<GrandFinalCeremonyProps> = ({
  champion,
  runnerUp,
  thirdPlace,
  onNewChampionship,
}) => {
  useEffect(() => {
    // Blast celebratory confetti cannons
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      confetti({
        particleCount: 50,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: [champion.primaryColor, champion.secondaryColor, '#fbbf24', '#f59e0b', '#38bdf8'],
      });
    }, 350);

    return () => clearInterval(interval);
  }, [champion]);

  return (
    <div
      id="grand-final-ceremony"
      className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-center space-y-6 ring-1 ring-amber-400/20">
        {/* Crown & Title */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-500/30 animate-bounce">
            <Crown className="w-9 h-9" />
          </div>
          <div className="text-xs uppercase font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Official Championship Conclusion
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
            WORLD CHAMPION CROWNED!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            100 Countries entered across 50 elevated stages. Only one country marble is the ultimate champion!
          </p>
        </div>

        {/* 3-Tier Bento Podium */}
        <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2">
          {/* 2nd Place Silver Bento Column */}
          <div className="flex flex-col items-center space-y-2">
            <div className="text-4xl leading-none">{runnerUp.flagEmoji}</div>
            <div className="text-xs sm:text-sm font-black text-slate-200 truncate max-w-full">{runnerUp.name}</div>
            <div className="w-full bg-slate-950/80 border border-slate-700/60 rounded-2xl p-3 h-28 flex flex-col items-center justify-center shadow-lg">
              <span className="text-lg font-black text-slate-300 font-mono">2nd</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Runner-Up</span>
            </div>
          </div>

          {/* 1st Place Gold Champion Bento Column */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <span className="text-5xl leading-none">{champion.flagEmoji}</span>
              <Crown className="w-6 h-6 text-amber-400 absolute -top-4 -right-2 animate-pulse" />
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 truncate max-w-full">{champion.name}</div>
            <div className="w-full bg-gradient-to-t from-amber-500/20 via-amber-400/20 to-amber-300/10 border-2 border-amber-400/80 rounded-2xl p-4 h-36 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/20 ring-1 ring-amber-400/30">
              <Trophy className="w-8 h-8 text-amber-400 mb-1 animate-bounce" />
              <span className="text-xl font-black text-amber-300 font-mono">1st</span>
              <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">WORLD CHAMPION</span>
            </div>
          </div>

          {/* 3rd Place Bronze Bento Column */}
          <div className="flex flex-col items-center space-y-2">
            <div className="text-4xl leading-none">{thirdPlace.flagEmoji}</div>
            <div className="text-xs sm:text-sm font-black text-slate-200 truncate max-w-full">{thirdPlace.name}</div>
            <div className="w-full bg-slate-950/80 border border-amber-900/40 rounded-2xl p-3 h-24 flex flex-col items-center justify-center shadow-lg">
              <span className="text-lg font-black text-amber-600 font-mono">3rd</span>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Bronze</span>
            </div>
          </div>
        </div>

        {/* Start New Tournament Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-center">
          <button
            id="btn-new-championship"
            onClick={onNewChampionship}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl shadow-amber-500/30 transition-all transform hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New 100-Country Championship</span>
          </button>
        </div>
      </div>
    </div>
  );
};
