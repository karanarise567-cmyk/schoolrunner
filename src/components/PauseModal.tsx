import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onGoHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-xs w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-4 text-center">
        <h3 className="text-2xl font-black uppercase tracking-tight text-white">
          Game Paused
        </h3>
        <p className="text-xs text-slate-400">
          Catch your breath! The exam countdown is currently paused.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-sm text-white shadow-lg border border-blue-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME SPRINT</span>
          </button>

          {/* Toggle Sound */}
          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Sound' : 'Mute Sound'}</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Run</span>
          </button>

          {/* Main Menu */}
          <button
            onClick={onGoHome}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 font-semibold text-xs text-slate-400 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 pt-1">
          Tip: Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">P</kbd> or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Esc</kbd> to toggle pause anytime.
        </div>
      </div>
    </div>
  );
};
