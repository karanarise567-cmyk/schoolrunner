import React from 'react';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Bike,
  Bus,
  Coffee,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GameStats, JugaadMode, CharacterProfile } from '../types/game';
import {
  TOTAL_GOAL_DISTANCE,
  INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_SPEED,
  CALCULATED_MAX_DISTANCE_IN_TIME,
  STAMINA_VIBRATION_THRESHOLD,
  JUGAAD_CONFIG,
  LevelConfig,
} from '../game/constants';

interface GameHUDProps {
  stats: GameStats;
  currentLevel: LevelConfig;
  selectedCharacter: CharacterProfile;
  jugaadMode: JugaadMode;
  jugaadTimeRemaining: number;
  isMuted: boolean;
  isBoosting: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onStartMoveLeft?: () => void;
  onStopMoveLeft?: () => void;
  onStartMoveRight?: () => void;
  onStopMoveRight?: () => void;
  onJump: () => void;
  onStartBoost: () => void;
  onStopBoost: () => void;
  onActivateJugaad: (type: 'cycle' | 'bus' | 'chai') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  currentLevel,
  selectedCharacter,
  jugaadMode,
  jugaadTimeRemaining,
  isMuted,
  isBoosting,
  onToggleMute,
  onPause,
  onMoveLeft,
  onMoveRight,
  onStartMoveLeft,
  onStopMoveLeft,
  onStartMoveRight,
  onStopMoveRight,
  onJump,
  onStartBoost,
  onStopBoost,
  onActivateJugaad,
}) => {
  // Format countdown mm:ss
  const minutes = Math.floor(stats.timeRemaining / 60);
  const seconds = stats.timeRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = stats.timeRemaining <= 25;

  const distanceRemaining = Math.max(0, TOTAL_GOAL_DISTANCE - stats.distanceCovered);
  const progressPercent = Math.min(100, (stats.distanceCovered / TOTAL_GOAL_DISTANCE) * 100);

  const canAffordCycle = stats.coins >= JUGAAD_CONFIG.cycle.cost;
  const canAffordBus = stats.coins >= JUGAAD_CONFIG.bus.cost;
  const canAffordChai = stats.coins >= JUGAAD_CONFIG.chai.cost;

  // Stamina color thresholds
  const stamina = Math.max(0, Math.min(100, stats.stamina));
  const isVibrating = stamina <= STAMINA_VIBRATION_THRESHOLD;

  let staminaGradient = 'from-cyan-500 to-blue-500';
  let staminaTextColor = 'text-cyan-400';
  if (stamina <= 20) {
    staminaGradient = 'from-red-600 to-amber-500';
    staminaTextColor = 'text-red-400';
  } else if (stamina <= 50) {
    staminaGradient = 'from-amber-500 to-yellow-400';
    staminaTextColor = 'text-amber-400';
  }

  // Calculate live speed based on stamina (Rules 1, 3, 4)
  const minFraction = 1 / 3;
  let staminaSpeedFactor = minFraction;
  if (stamina >= 20) {
    const ratio = (stamina - 20) / (100 - 20);
    staminaSpeedFactor = minFraction + (1 - minFraction) * ratio;
  } else {
    staminaSpeedFactor = minFraction;
  }
  const currentSpeedMps = DEFAULT_SPEED * staminaSpeedFactor * (isBoosting ? 1.5 : 1.0);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* TOP HEADER STATUS BAR */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 text-white shadow-xl pointer-events-auto">
          {/* Character Avatar & Coins */}
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg border-2 border-amber-400 bg-slate-800 shadow"
              title={selectedCharacter.name}
            >
              {selectedCharacter.avatar}
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 rounded-lg">
              <span className="text-amber-400 text-sm font-black">🪙</span>
              <span className="font-extrabold text-amber-300 text-base tracking-wide">
                {stats.coins}
              </span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-black text-base tracking-wider border shadow-inner ${
              isTimeCritical
                ? 'bg-red-600/30 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800/90 border-slate-600 text-emerald-300'
            }`}
          >
            <span>⏱️</span>
            <span>{formattedTime}</span>
          </div>

          {/* College Distance Remaining */}
          <div className="flex items-center gap-1.5 bg-blue-900/40 border border-blue-500/40 px-2.5 py-1 rounded-lg">
            <span className="text-xs">🎓</span>
            <div className="text-right">
              <div className="text-[9px] font-semibold text-blue-300 uppercase tracking-wider leading-none">
                COLLEGE
              </div>
              <div className="font-black text-white text-xs leading-tight">
                {distanceRemaining}m
              </div>
            </div>
          </div>

          {/* Controls: Mute & Pause */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleMute}
              className="p-1.5 hover:bg-slate-700/80 active:scale-95 rounded-lg text-slate-300 transition-all cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onPause}
              className="p-1.5 hover:bg-slate-700/80 active:scale-95 rounded-lg text-slate-300 transition-all cursor-pointer"
              title="Pause Game (P)"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STAMINA BAR & VALUE DISPLAY (Rule 5: Vibrates at level 20% and maintains that level) */}
        <div
          className={`backdrop-blur-md border rounded-xl px-3 py-2 text-white shadow-lg pointer-events-auto flex flex-col gap-1.5 transition-all ${
            isVibrating
              ? 'animate-vibrate bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]'
              : 'bg-slate-900/95 border-slate-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black">
            <div className="flex items-center gap-1.5">
              <Zap className={`w-4 h-4 ${staminaTextColor} ${isBoosting || isVibrating ? 'animate-bounce' : ''}`} />
              <span className="text-white tracking-wide">
                STAMINA: <span className={`${staminaTextColor} font-mono font-black text-sm`}>{Math.round(stamina)}/100</span>
              </span>
              {isVibrating && (
                <span className="bg-red-500/30 text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-500/60 font-black animate-pulse flex items-center gap-1">
                  <span>📳</span>
                  <span>VIBRATING (≤20%) MIN SPEED!</span>
                </span>
              )}
              {isBoosting && (
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded border border-cyan-400/40 animate-pulse font-extrabold">
                  BOOSTING! ⚡
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
              <span className="text-slate-400">Speed:</span>
              <span className="font-extrabold text-cyan-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                {currentSpeedMps.toFixed(1)} m/s
              </span>
            </div>
          </div>

          {/* Stamina Meter Gauge */}
          <div className="w-full bg-slate-950/80 border border-slate-700 rounded-full h-3 p-0.5 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-100 bg-gradient-to-r ${staminaGradient} ${
                isBoosting || isVibrating ? 'animate-pulse' : ''
              }`}
              style={{ width: `${stamina}%` }}
            />
          </div>

          {/* Rules 1 & 2 Info bar: Default speed & calculated distance in mentioned time */}
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
            <span>⚡ Default: {DEFAULT_SPEED} m/s (100% Stamina)</span>
            <span className="text-amber-300/90 font-mono">
              Potential in {INITIAL_COUNTDOWN_SECONDS}s: {CALCULATED_MAX_DISTANCE_IN_TIME.toLocaleString()}m
            </span>
            <span>Min: {(DEFAULT_SPEED / 3).toFixed(1)} m/s (at ≤20%)</span>
          </div>
        </div>

        {/* 10-LEVEL BADGE & 1000m PROGRESS */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 bg-slate-900/85 border border-slate-700/70 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-slate-200">
            <span
              className="w-2 h-2 rounded-full inline-block animate-ping"
              style={{ backgroundColor: currentLevel.themeColor }}
            />
            <span className="text-amber-400 font-extrabold">{currentLevel.name}</span>
          </div>

          <div className="flex-1 max-w-[170px] bg-slate-950/80 border border-slate-700 rounded-full h-2.5 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[10px] font-bold text-slate-300 font-mono">
            {stats.distanceCovered}m / 1000m
          </span>
        </div>

        {/* Active Jugaad Notification Banner */}
        {jugaadMode !== 'none' && (
          <div className="self-center flex items-center gap-2 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg border border-amber-300 animate-pulse pointer-events-auto">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>
              {jugaadMode === 'cycle_seeking' && '🙋 "BHAIYA LIFT!" Catch a 2-Seater Cycle!'}
              {jugaadMode === 'cycle' && '🚲 CYCLE LIFT: RIDING 2-SEATER BACK SEAT!'}
              {jugaadMode === 'bus_seeking' && '🙋 "CONDUCTOR BHAIYA RUKO!" Catch Bus Footboard!'}
              {jugaadMode === 'bus' && '🚌 HANGING ON BACK OF BUS! (RAMMING SPEED)'}
              {jugaadMode === 'chai' && '☕ CHAI SPRINT ACTIVE!'}
            </span>
            <span className="bg-black/40 px-2 py-0.5 rounded text-[11px] font-mono">
              {jugaadTimeRemaining.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & STAMINA BOOST BUTTON */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* JUGAAD ACTION CARDS */}
        <div className="grid grid-cols-3 gap-2">
          {/* Cycle Lift Jugaad (15 Coins) */}
          <button
            onClick={() => onActivateJugaad('cycle')}
            disabled={!canAffordCycle || jugaadMode === 'cycle' || jugaadMode === 'cycle_seeking'}
            className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 shadow-lg ${
              jugaadMode === 'cycle_seeking'
                ? 'bg-gradient-to-b from-cyan-600 to-blue-800 border-cyan-300 text-white ring-2 ring-cyan-400 animate-pulse'
                : canAffordCycle && jugaadMode !== 'cycle'
                ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 border-emerald-300 text-white shadow-emerald-900/50 hover:brightness-110 ring-2 ring-emerald-400/40'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400 opacity-60'
            }`}
            title="Cycle Lift Jugaad: Ask a passing 2-seater cycle for a lift to sit on the back seat! (Press 1)"
          >
            <div className="flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-emerald-300" />
              <span className="text-[11px] font-extrabold tracking-tight">
                {jugaadMode === 'cycle_seeking' ? 'SEEK LIFT' : 'CYCLE LIFT'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-full w-full">
              <span>🪙 {JUGAAD_CONFIG.cycle.cost}</span>
              <span className="text-[9px] text-emerald-300 font-mono">(1)</span>
            </div>
          </button>

          {/* Bus Footboard Jugaad (35 Coins) */}
          <button
            onClick={() => onActivateJugaad('bus')}
            disabled={!canAffordBus || jugaadMode === 'bus' || jugaadMode === 'bus_seeking'}
            className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 shadow-lg ${
              jugaadMode === 'bus_seeking'
                ? 'bg-gradient-to-b from-amber-600 to-red-800 border-amber-300 text-white ring-2 ring-amber-400 animate-pulse'
                : canAffordBus && jugaadMode !== 'bus'
                ? 'bg-gradient-to-b from-red-600 to-red-800 border-red-300 text-white shadow-red-900/50 hover:brightness-110 ring-2 ring-red-400/40 animate-pulse'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400 opacity-60'
            }`}
            title="Bus Footboard Jugaad: Catch rear footboard and hang onto the back of the bus! (Press 2)"
          >
            <div className="flex items-center gap-1.5">
              <Bus className="w-4 h-4 text-yellow-300" />
              <span className="text-[11px] font-extrabold tracking-tight">
                {jugaadMode === 'bus_seeking' ? 'SEEK BUS' : 'BUS LIFT'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-full w-full">
              <span>🪙 {JUGAAD_CONFIG.bus.cost}</span>
              <span className="text-[9px] text-yellow-300 font-mono">(2)</span>
            </div>
          </button>

          {/* Cutting Chai (+15s Boost) (15 Coins) */}
          <button
            onClick={() => onActivateJugaad('chai')}
            disabled={!canAffordChai || jugaadMode === 'chai'}
            className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 shadow-lg ${
              canAffordChai && jugaadMode !== 'chai'
                ? 'bg-gradient-to-b from-orange-600 to-orange-800 border-orange-300 text-white shadow-orange-900/50 hover:brightness-110 ring-2 ring-orange-400/40'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400 opacity-60'
            }`}
            title="Cutting Chai: +15s Exam Time & Sprint (Press 3)"
          >
            <div className="flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-orange-200" />
              <span className="text-[11px] font-extrabold tracking-tight">CHAI</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded-full w-full">
              <span>🪙 {JUGAAD_CONFIG.chai.cost}</span>
              <span className="text-[9px] text-orange-200 font-mono">(3)</span>
            </div>
          </button>
        </div>

        {/* ON-SCREEN STEERING CONTROLS & STAMINA BOOST BUTTON (BOTTOM RIGHT) */}
        <div className="flex items-center justify-between bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-2 shadow-2xl">
          {/* Steering: Left & Right (Free continuous steering on hold or tap) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMoveLeft}
              onPointerDown={(e) => {
                e.preventDefault();
                onStartMoveLeft?.();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onStopMoveLeft?.();
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                onStopMoveLeft?.();
              }}
              onPointerCancel={(e) => {
                e.preventDefault();
                onStopMoveLeft?.();
              }}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-blue-600 active:scale-95 border-2 border-slate-600 flex items-center justify-center text-white shadow-lg transition-transform cursor-pointer select-none"
              aria-label="Move Left (Hold A or ←)"
              title="Steer Left (Hold A)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={onMoveRight}
              onPointerDown={(e) => {
                e.preventDefault();
                onStartMoveRight?.();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onStopMoveRight?.();
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                onStopMoveRight?.();
              }}
              onPointerCancel={(e) => {
                e.preventDefault();
                onStopMoveRight?.();
              }}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-blue-600 active:scale-95 border-2 border-slate-600 flex items-center justify-center text-white shadow-lg transition-transform cursor-pointer select-none"
              aria-label="Move Right (Hold D or →)"
              title="Steer Right (Hold D)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Jump Button */}
            <button
              onClick={onJump}
              className="h-12 px-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-90 border-2 border-emerald-400 flex items-center justify-center gap-1 text-white font-black text-xs shadow-lg transition-transform cursor-pointer"
              aria-label="Jump"
            >
              <ArrowUp className="w-4 h-4" />
              <span>JUMP</span>
            </button>
          </div>

          {/* LARGE MOBILE-FRIENDLY STAMINA BOOST BUTTON AT BOTTOM-RIGHT (Hold to Boost) */}
          <div className="flex items-center">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onStartBoost();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onStopBoost();
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                onStopBoost();
              }}
              onPointerCancel={(e) => {
                e.preventDefault();
                onStopBoost();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                onStartBoost();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onStopBoost();
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                onStopBoost();
              }}
              disabled={stamina <= 0}
              className={`h-14 px-5 min-w-[115px] rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 shadow-xl ${
                stamina > 0
                  ? isBoosting
                    ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 border-white text-white scale-98 shadow-cyan-500/70 ring-4 ring-cyan-300/60'
                    : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 border-cyan-400 text-white shadow-cyan-950/60 ring-2 ring-cyan-400/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
              }`}
              title="Press & Hold to Speed Boost (Drains Stamina - Key: Shift or E)"
              aria-label="Stamina Boost Button"
            >
              <div className="flex items-center gap-1.5 font-black text-sm leading-none">
                <Zap className={`w-5 h-5 text-cyan-300 ${isBoosting ? 'animate-bounce' : ''}`} />
                <span className="tracking-wide">STAMINA</span>
              </div>
              <span className="text-[10px] font-extrabold text-cyan-200 mt-1 uppercase tracking-tight">
                {stamina > 0 ? (isBoosting ? 'BOOSTING...' : 'HOLD TO BOOST') : 'EMPTY (NEED DRINK)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
