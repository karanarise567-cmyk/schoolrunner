import React from 'react';
import { X, Bike, Bus, Coffee, Compass, CheckCircle2, Zap } from 'lucide-react';
import { LEVELS } from '../game/constants';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-lg w-full max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 text-white shadow-2xl flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>📖</span>
              <span>Game Rules & Jugaad Guide</span>
            </h3>
            <p className="text-xs text-slate-400">
              JUGAAD: Race Against Time • Concept, Stamina & Cows
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. STAMINA SYSTEM (NO AUTO-REGENERATION) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>1. Stamina System (NO Auto-Regen)</span>
          </h4>
          <div className="bg-slate-800/80 border border-cyan-500/40 p-3 rounded-2xl space-y-2 text-xs">
            <div className="text-slate-200 leading-relaxed">
              • <strong>Maximum Stamina = 100</strong>. Starts at 100 at the start of the race.<br />
              • <strong>Hold STAMINA BOOST</strong> (bottom-right button or <kbd className="bg-slate-700 px-1 rounded text-cyan-300">Shift</kbd> / <kbd className="bg-slate-700 px-1 rounded text-cyan-300">E</kbd>) to sprint at <strong>1.45x high speed</strong>.<br />
              • While boosting, stamina continuously decreases and stops automatically at 0.<br />
              • <strong className="text-red-400">CRITICAL:</strong> Stamina does <strong>NOT</strong> automatically regenerate over time or when stopped!
            </div>
            <div className="bg-cyan-950/40 border border-cyan-500/30 p-2 rounded-xl text-[11px] text-cyan-300 font-semibold">
              The ONLY way to restore stamina is by collecting Indian Drink Pickups on the road!
            </div>
          </div>
        </div>

        {/* 2. INDIAN DRINK PICKUPS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>🥤</span>
            <span>2. Indian Roadside Drink Pickups</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-sky-950/40 border border-sky-500/30 p-2.5 rounded-xl">
              <div className="font-extrabold text-sky-300 flex items-center gap-1">
                <span>🥤</span>
                <span>Water Bottle</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">+20 Stamina</div>
              <div className="text-[10px] text-slate-400">Common colony hydration</div>
            </div>

            <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl">
              <div className="font-extrabold text-red-300 flex items-center gap-1">
                <span>🥤</span>
                <span>Cold Drink</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">+30 Stamina</div>
              <div className="text-[10px] text-slate-400">Quick fizz soda energy</div>
            </div>

            <div className="bg-yellow-950/40 border border-yellow-500/30 p-2.5 rounded-xl">
              <div className="font-extrabold text-yellow-300 flex items-center gap-1">
                <span>🍋</span>
                <span>Nimbu Pani</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">+50 Stamina</div>
              <div className="text-[10px] text-slate-400">Fresh roadside shikanji power!</div>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl">
              <div className="font-extrabold text-amber-200 flex items-center gap-1">
                <span>🥛</span>
                <span>Malai Lassi</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold mt-0.5">+70 Stamina (Rare!)</div>
              <div className="text-[10px] text-slate-400">Clay kulhad super booster</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 italic">
            * Note: Stamina is capped strictly at 100. (e.g. 80 + 50 = 100, not 130).
          </div>
        </div>

        {/* 3. INDIAN COWS (GAU MATA) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span>🐄</span>
            <span>3. Indian Cows (Roadside & Crossing)</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            • Cows mostly stand peacefully near the roadside, temples, vegetable carts, and tea stalls.<br />
            • Some cows slowly walk across 1 lane as moving obstacles.<br />
            • If you bump into a cow, you respectfully stumble and lose a few coins (not an instant game-over!).<br />
            • <em>Bus Jugaad</em> honks its deep horn and safely clears the way without harm.
          </p>
        </div>

        {/* 4. TACTICAL JUGAAD POWERS */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Bike className="w-4 h-4" />
            <span>4. Jugaad Powers (Spend Coins)</span>
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl">
              <Bike className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300">Cycle Jugaad (Key 1)</span>
                  <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                    30 Coins
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Borrow classmate cycle! Zoom at <strong>1.6x speed</strong> with ringing bell.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-red-950/30 border border-red-500/30 p-2.5 rounded-xl">
              <Bus className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-300">Bus Jugaad (Key 2)</span>
                  <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                    50 Coins
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Hang onto the footboard! Complete <strong>invulnerability</strong>, knocking oncoming cars aside!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-orange-950/30 border border-orange-500/30 p-2.5 rounded-xl">
              <Coffee className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-300">Cutting Chai (Key 3)</span>
                  <span className="bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                    20 Coins
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Roadside tea energy! Restores <strong>+15 seconds</strong> to your exam countdown.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. 10 DISTINCT LEVELS BREAKDOWN */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            <span>5. All 10 Levels (0 to 1,000 Meters Total)</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {LEVELS.map((lvl) => (
              <div key={lvl.levelNumber} className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-xl">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: lvl.themeColor }}
                  />
                  <span className="truncate">{lvl.name}</span>
                </div>
                <div className="text-slate-400 font-mono mt-0.5">
                  {lvl.minDist}m – {lvl.maxDist}m
                </div>
                <div className="text-slate-300 truncate mt-0.5">{lvl.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white transition-colors cursor-pointer mt-1"
        >
          Got It, Let&apos;s Sprint!
        </button>
      </div>
    </div>
  );
};
