import React, { useEffect, useState } from 'react';
import { Mic, Radio } from 'lucide-react';
import { commentary, CommentaryMessage } from '../game/commentary';

export const CommentaryTicker: React.FC = () => {
  const [currentMessage, setCurrentMessage] = useState<CommentaryMessage | null>(null);
  const [fadeState, setFadeState] = useState<'enter' | 'active' | 'exit'>('active');

  useEffect(() => {
    const unsub = commentary.subscribe(msg => {
      setFadeState('enter');
      setCurrentMessage(msg);
      const timer = setTimeout(() => {
        setFadeState('active');
      }, 150);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  if (!currentMessage) return null;

  const getTypeStyle = () => {
    switch (currentMessage.type) {
      case 'start':
        return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300';
      case 'finish':
        return 'border-amber-500/60 bg-amber-950/40 text-amber-300';
      case 'hazard':
        return 'border-rose-500/50 bg-rose-950/40 text-rose-300';
      case 'overtake':
      case 'lead_change':
        return 'border-sky-500/50 bg-sky-950/40 text-sky-300';
      default:
        return 'border-slate-700/60 bg-slate-900/60 text-slate-200';
    }
  };

  return (
    <section
      id="commentary-ticker"
      aria-label="Live Commentary"
      className="absolute top-20 right-3 max-w-sm sm:max-w-md w-full pointer-events-none z-20 transition-all duration-300"
    >
      <div
        className={`bg-slate-900/90 backdrop-blur-md border rounded-3xl p-3 shadow-2xl transition-all transform ring-1 ring-white/5 ${getTypeStyle()} ${
          fadeState === 'enter' ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Commentator Avatar / Mic icon Bento Chip */}
          <div className="w-8 h-8 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
            <Mic className="w-4 h-4 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {currentMessage.speaker}
              </span>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                BROADCAST
              </span>
            </div>

            <p className="text-xs sm:text-sm font-extrabold text-white leading-snug drop-shadow-sm">
              {currentMessage.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
