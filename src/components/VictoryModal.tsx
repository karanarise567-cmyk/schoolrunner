import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle, Clock, Coins, Sparkles, RotateCcw, Share2 } from 'lucide-react';
import { GameStats, CharacterProfile } from '../types/game';

interface VictoryModalProps {
  stats: GameStats;
  selectedCharacter: CharacterProfile;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  selectedCharacter,
  onRestart,
}) => {
  // Fire confetti celebration on mount
  useEffect(() => {
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const minutes = Math.floor(stats.timeRemaining / 60);
  const seconds = stats.timeRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate Performance Grade
  let grade = 'A';
  let gradeTitle = 'Punctual Prodigy';
  let gradeColor = 'text-blue-400 border-blue-400 bg-blue-500/10';

  if (stats.timeRemaining >= 60 && stats.coins >= 40) {
    grade = 'S';
    gradeTitle = 'Jugaad Mastermind';
    gradeColor = 'text-amber-300 border-amber-300 bg-amber-500/20';
  } else if (stats.timeRemaining < 20) {
    grade = 'B';
    gradeTitle = 'Last-Bench Survivor';
    gradeColor = 'text-emerald-400 border-emerald-400 bg-emerald-500/10';
  }

  const totalJugaads =
    stats.jugaadsUsed.cycle + stats.jugaadsUsed.bus + stats.jugaadsUsed.chai;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-md w-full bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 text-white shadow-2xl shadow-emerald-950/50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>1,000m College Gate Reached!</span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white uppercase drop-shadow">
            Exam Hall On Time!
          </h2>
          <p className="text-xs text-slate-300">
            {selectedCharacter.name} successfully navigated the city traffic using clever Jugaad!
          </p>
        </div>

        {/* Official College Attendance Stamp Card */}
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-100 text-slate-900 rounded-2xl p-4 shadow-inner border border-amber-200 overflow-hidden">
          {/* Red rubber stamp watermark */}
          <div className="absolute -right-3 -top-1 rotate-12 border-4 border-red-600 text-red-600 font-black text-xs sm:text-sm px-3 py-1 rounded-lg uppercase tracking-widest opacity-85 select-none shadow">
            ✓ ATTENDANCE: PRESENT
          </div>

          <div className="text-xs font-mono font-bold text-slate-600 mb-2">
            SGSU SEMESTER EXAM CARD • 09:00 AM
          </div>

          <div className="flex items-center justify-between border-t border-b border-amber-200/80 py-2 my-2">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Candidate</div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{selectedCharacter.avatar}</span>
                <span>{selectedCharacter.name}</span>
              </div>
            </div>

            {/* Performance Grade Badge */}
            <div className={`flex flex-col items-center justify-center border-2 rounded-xl px-3 py-1 ${gradeColor}`}>
              <span className="text-2xl font-black leading-none">{grade}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-tight">{gradeTitle}</span>
            </div>
          </div>

          {/* Key Run Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2 pt-1 font-mono">
            <div className="bg-white/70 rounded-lg p-1.5 shadow-sm">
              <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" /> Time Left
              </div>
              <div className="font-extrabold text-blue-900 text-sm">{timeFormatted}</div>
            </div>

            <div className="bg-white/70 rounded-lg p-1.5 shadow-sm">
              <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
                <Coins className="w-3 h-3 text-amber-600" /> Coins
              </div>
              <div className="font-extrabold text-amber-900 text-sm">₹{stats.coins}</div>
            </div>

            <div className="bg-white/70 rounded-lg p-1.5 shadow-sm">
              <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" /> Jugaads
              </div>
              <div className="font-extrabold text-purple-900 text-sm">{totalJugaads} Used</div>
            </div>
          </div>
        </div>

        {/* Jugaad & Stamina Breakdown */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1.5">
          <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
            Run Highlights & Jugaad Solutions:
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>⚡ Final Stamina:</span>
            <span className="font-mono font-bold text-cyan-300">{stats.stamina}/100</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>🥤 Drinks Collected:</span>
            <span className="font-mono font-bold text-amber-300">
              {stats.drinksCollected.water + stats.drinksCollected.cold_drink + stats.drinksCollected.nimbu_pani + stats.drinksCollected.lassi} drinks
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>🐄 Holy Cows Dodged:</span>
            <span className="font-mono font-bold text-emerald-300">{stats.cowsEncountered} cows</span>
          </div>
          {(stats.wrongSideDodged || 0) > 0 && (
            <div className="flex items-center justify-between text-slate-400">
              <span>⚠️ Wrong-Side Traffic Dodged:</span>
              <span className="font-mono font-bold text-red-400">{stats.wrongSideDodged} vehicles</span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-400">
            <span>🚲 Cycle / 🚌 Bus Jugaads:</span>
            <span className="font-mono font-bold text-yellow-300">
              {stats.jugaadsUsed.cycle + stats.jugaadsUsed.bus} times
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 font-bold text-sm text-white shadow-lg shadow-emerald-950/40 border border-emerald-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
