import React from 'react';
import { AlertTriangle, Clock, RotateCcw, Sparkles, Coins, Compass } from 'lucide-react';
import { GameStats, CharacterProfile } from '../types/game';

interface GameOverModalProps {
  stats: GameStats;
  selectedCharacter: CharacterProfile;
  hasUsedRevive: boolean;
  onUseRevive: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  selectedCharacter,
  hasUsedRevive,
  onUseRevive,
  onRestart,
}) => {
  const isTimeout = stats.failureReason === 'timeout';
  const canRevive = !hasUsedRevive && stats.coins >= 20;

  const quotes = isTimeout
    ? [
        '"Bhai bell baj gayi! Gatekeeper ne gate band kar diya!"',
        '"Attendance nahi mili... Agle semester supply deni padegi!"',
        '"Papa ko bolna padega ki traffic bohot tha!"',
      ]
    : [
        '"Arre auto wale bhaiya, dekh ke to chalao!"',
        '"Arey baap re! Bag bhi gir gaya aur chappal bhi!"',
        '"Bhai emergency break lagao yaar!"',
      ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 text-white shadow-2xl shadow-red-950/50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-400 text-xs font-bold uppercase tracking-wider">
            {isTimeout ? <Clock className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{isTimeout ? 'Time Expired!' : 'Traffic Collision!'}</span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white uppercase drop-shadow">
            {isTimeout ? 'Late For Exam!' : 'Accident on Road!'}
          </h2>
          <p className="text-xs text-amber-300 italic">{randomQuote}</p>
        </div>

        {/* Distance Progress Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-400" /> Distance Reached:
            </span>
            <span className="font-extrabold text-white font-mono text-sm">
              {stats.distanceCovered}m / 1000m
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-blue-500 rounded-full"
              style={{ width: `${(stats.distanceCovered / 1000) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-700/60 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400">Coins Collected</div>
                <div className="font-black text-amber-300 font-mono">₹{stats.coins}</div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-700/60 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-400">Jugaads Used</div>
                <div className="font-black text-purple-300 font-mono">
                  {stats.jugaadsUsed.cycle + stats.jugaadsUsed.bus + stats.jugaadsUsed.chai}
                </div>
              </div>
            </div>

            {(stats.wrongSideDodged || 0) > 0 && (
              <div className="col-span-2 bg-red-950/30 rounded-xl p-2 border border-red-500/30 flex items-center justify-between text-xs">
                <span className="text-red-300 font-bold flex items-center gap-1.5">
                  <span>⚠️</span> Wrong-Side Vehicles Dodged:
                </span>
                <span className="font-black text-amber-300 font-mono">{stats.wrongSideDodged}</span>
              </div>
            )}
          </div>
        </div>

        {/* Jugaad Revive Option */}
        {canRevive && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Use Jugaad Second Chance!
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                Cost: 20 ₹
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Dust off your backpack, get 3 seconds of invulnerability shield, and resume sprinting!
            </p>
            <button
              onClick={onUseRevive}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-98 font-black text-xs text-white shadow-md border border-amber-300 transition-all cursor-pointer"
            >
              REVIVE WITH JUGAAD (SPEND 20₹)
            </button>
          </div>
        )}

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-98 font-black text-sm text-white shadow-xl shadow-blue-900/40 border border-blue-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>TRY SPRINT AGAIN</span>
        </button>
      </div>
    </div>
  );
};
