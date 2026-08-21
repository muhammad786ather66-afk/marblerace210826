import React, { useState } from 'react';
import { Camera, Volume2, VolumeX, Play, Pause, ListOrdered, RotateCcw, Mic, MicOff, FastForward } from 'lucide-react';
import { CameraMode } from '../types';
import { sound } from '../game/audio';
import { commentary } from '../game/commentary';

interface BroadcastControlsProps {
  currentCameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  gameSpeed: number;
  onChangeSpeed: (speed: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenBracket: () => void;
  onRestartTournament: () => void;
}

export const BroadcastControls: React.FC<BroadcastControlsProps> = ({
  currentCameraMode,
  onSelectCameraMode,
  gameSpeed,
  onChangeSpeed,
  isPaused,
  onTogglePause,
  onOpenBracket,
  onRestartTournament,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [speechEnabled, setSpeechEnabled] = useState(commentary.getSpeechEnabled());
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    sound.setMuted(next);
    setIsMuted(next);
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    commentary.setSpeechEnabled(next);
    setSpeechEnabled(next);
  };

  const cameraOptions: { mode: CameraMode; label: string; icon: string }[] = [
    { mode: 'broadcast', label: 'Auto Broadcast Director', icon: '🎬' },
    { mode: 'leader', label: 'Leader Chase Cam', icon: '🥇' },
    { mode: 'overtake', label: 'Side Battle Cam', icon: '⚔️' },
    { mode: 'hazard', label: 'Obstacle Hazard Cam', icon: '⚠️' },
    { mode: 'wide', label: 'Aerial Stadium Overview', icon: '🚁' },
    { mode: 'fpv', label: 'FPV Marble Roller', icon: '🎢' },
  ];

  return (
    <nav
      id="broadcast-controls"
      aria-label="Director Controls"
      className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-1.5 px-3 shadow-2xl z-30 pointer-events-auto ring-1 ring-white/5"
    >
      {/* Bento Tile 1: Camera Angle Dropdown */}
      <div className="relative">
        <button
          id="btn-camera-selector"
          onClick={() => setCameraMenuOpen(!cameraMenuOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border ${
            cameraMenuOpen
              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/25'
              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-800/90'
          }`}
          title="Switch Camera Angle"
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline text-[11px] text-slate-400 font-semibold">Cam:</span>
          <span className="capitalize text-slate-200 font-extrabold text-[11px]">
            {currentCameraMode === 'broadcast' ? 'Auto Director' : currentCameraMode}
          </span>
        </button>

        {cameraMenuOpen && (
          <div className="absolute bottom-full mb-2 left-0 w-60 bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-2 shadow-2xl space-y-1 ring-1 ring-white/5">
            <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-2 py-1 border-b border-slate-800/80 mb-1">
              Select Spectator Camera
            </div>
            {cameraOptions.map(opt => (
              <button
                key={opt.mode}
                onClick={() => {
                  onSelectCameraMode(opt.mode);
                  setCameraMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition-all ${
                  currentCameraMode === opt.mode
                    ? 'bg-sky-500 text-slate-950 font-black'
                    : 'text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-5 w-[1px] bg-slate-800 mx-0.5"></div>

      {/* Bento Tile 2: Speed Multiplier */}
      <div className="flex items-center bg-slate-950/80 rounded-2xl p-0.5 border border-slate-800/90">
        {[1, 1.5, 2, 4].map(spd => (
          <button
            key={spd}
            onClick={() => onChangeSpeed(spd)}
            className={`px-2 py-1 rounded-xl text-[11px] font-black transition-all ${
              gameSpeed === spd
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>

      {/* Bento Tile 3: Pause / Resume Transport */}
      <button
        id="btn-toggle-pause"
        onClick={onTogglePause}
        className="p-2 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800/90 transition-all shadow-sm"
        title={isPaused ? 'Resume Race' : 'Pause Race'}
      >
        {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
      </button>

      {/* Bento Tile 4: Audio Controls */}
      <button
        id="btn-toggle-audio"
        onClick={toggleMute}
        className={`p-2 rounded-2xl border transition-all shadow-sm ${
          isMuted
            ? 'bg-rose-950/40 border-rose-900/60 text-rose-400'
            : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800/90 text-slate-300'
        }`}
        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
      </button>

      {/* Bento Tile 5: Live Commentary Voice Toggle */}
      <button
        id="btn-toggle-speech"
        onClick={toggleSpeech}
        className={`p-2 rounded-2xl border transition-all shadow-sm ${
          !speechEnabled
            ? 'bg-slate-950/80 border-slate-800/90 text-slate-500'
            : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'
        }`}
        title={speechEnabled ? 'Voice Commentary Active' : 'Voice Commentary Muted'}
      >
        {speechEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
      </button>

      <div className="h-5 w-[1px] bg-slate-800 mx-0.5"></div>

      {/* Bento Tile 6: Tournament Standings */}
      <button
        id="btn-open-bracket"
        onClick={onOpenBracket}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-800/90 text-xs font-bold transition-all shadow-sm"
      >
        <ListOrdered className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline text-[11px]">Standings</span>
      </button>

      {/* Bento Tile 7: Restart Full Championship */}
      <button
        id="btn-restart-tournament"
        onClick={onRestartTournament}
        className="p-2 rounded-2xl bg-slate-950/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-800/90 transition-all shadow-sm"
        title="Restart Full 100-Country Championship"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </nav>
  );
};
