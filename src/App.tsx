import React, { useState, useEffect } from 'react';
import { useGameEngine } from './game/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PauseModal } from './components/PauseModal';
import { UnityProjectModal } from './components/UnityProjectModal';
import { soundManager } from './utils/audio';
import { CHARACTERS } from './game/constants';
import { Bike, Bus, Coffee, Info, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

export default function App() {
  const [characterId, setCharacterId] = useState<string>('raju');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isUnityModalOpen, setIsUnityModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('school_runner_best_dist');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const {
    status,
    setStatus,
    stats,
    stateRef,
    jugaadMode,
    jugaadTimeRemaining,
    currentLevel,
    isBoosting,
    selectedCharacter,
    startGame,
    moveLeft,
    moveRight,
    startMoveLeft,
    stopMoveLeft,
    startMoveRight,
    stopMoveRight,
    jump,
    startBoost,
    stopBoost,
    activateJugaad,
    useJugaadRevive,
    hasUsedRevive,
    initRoadsideProps,
    updateGame,
  } = useGameEngine({ characterId });

  // Update high score on game finish or over
  useEffect(() => {
    if (stats.distanceCovered > highScore) {
      setHighScore(stats.distanceCovered);
      try {
        localStorage.setItem('school_runner_best_dist', stats.distanceCovered.toString());
      } catch {
        // localStorage not available
      }
    }
  }, [stats.distanceCovered, highScore]);

  const toggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  const handlePause = () => {
    if (status === 'playing') {
      setStatus('paused');
      soundManager.stopBGM();
    }
  };

  const handleResume = () => {
    if (status === 'paused') {
      setStatus('playing');
      soundManager.startBGM();
    }
  };

  const handleGoHome = () => {
    soundManager.stopBGM();
    setStatus('menu');
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Background Ambience / Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Main Game Container - Wide Mobile Portrait Frame */}
      <div className="relative w-full h-full max-w-[520px] sm:h-[95vh] sm:rounded-3xl sm:border sm:border-slate-800 sm:shadow-2xl sm:shadow-blue-950/60 overflow-hidden flex flex-col bg-slate-900">
        {/* Game Canvas Layer */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <GameCanvas
            status={status}
            stateRef={stateRef}
            selectedCharacter={selectedCharacter}
            jugaadMode={jugaadMode}
            jugaadTimeRemaining={jugaadTimeRemaining}
            onMoveLeft={moveLeft}
            onMoveRight={moveRight}
            onJump={jump}
            initRoadsideProps={initRoadsideProps}
            updateGame={updateGame}
          />

          {/* Interactive In-Game HUD (Visible during gameplay or pause) */}
          {(status === 'playing' || status === 'paused') && (
            <GameHUD
              stats={stats}
              currentLevel={currentLevel}
              selectedCharacter={selectedCharacter}
              jugaadMode={jugaadMode}
              jugaadTimeRemaining={jugaadTimeRemaining}
              isMuted={isMuted}
              isBoosting={isBoosting}
              onToggleMute={toggleMute}
              onPause={handlePause}
              onMoveLeft={moveLeft}
              onMoveRight={moveRight}
              onStartMoveLeft={startMoveLeft}
              onStopMoveLeft={stopMoveLeft}
              onStartMoveRight={startMoveRight}
              onStopMoveRight={stopMoveRight}
              onJump={jump}
              onStartBoost={startBoost}
              onStopBoost={stopBoost}
              onActivateJugaad={activateJugaad}
            />
          )}

          {/* Start Screen */}
          {status === 'menu' && (
            <StartScreen
              selectedCharacterId={characterId}
              onSelectCharacter={setCharacterId}
              onStartGame={startGame}
              onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
              onOpenUnityProject={() => setIsUnityModalOpen(true)}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              highScore={highScore}
            />
          )}

          {/* Pause Modal */}
          {status === 'paused' && (
            <PauseModal
              onResume={handleResume}
              onRestart={startGame}
              onGoHome={handleGoHome}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          )}

          {/* Victory Modal (1,000m reached) */}
          {status === 'victory' && (
            <VictoryModal
              stats={stats}
              selectedCharacter={selectedCharacter}
              onRestart={startGame}
            />
          )}

          {/* Game Over Modal */}
          {status === 'gameover' && (
            <GameOverModal
              stats={stats}
              selectedCharacter={selectedCharacter}
              hasUsedRevive={hasUsedRevive}
              onUseRevive={useJugaadRevive}
              onRestart={startGame}
            />
          )}

          {/* How To Play & Design Document Modal */}
          {isHowToPlayOpen && (
            <HowToPlayModal onClose={() => setIsHowToPlayOpen(false)} />
          )}

          {/* Unity Project Setup & C# Scripts Modal */}
          {isUnityModalOpen && (
            <UnityProjectModal onClose={() => setIsUnityModalOpen(false)} />
          )}
        </div>
      </div>

      {/* Desktop Side Info Banner (Shown only on larger screens to give context) */}
      <div className="hidden xl:flex flex-col gap-4 absolute right-8 top-12 max-w-xs text-slate-300 text-xs">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <span className="text-blue-400">⚡</span>
            <span>SGSU Warrior • Jugaad Theme</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            1,000 meters time-trial through an Indian city road. Dodge traffic, collect rupee coins, and spend them on Cycle or Bus Jugaad.
          </p>

          <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px]">
            <div className="font-bold text-slate-200">Controls Reference:</div>
            <div className="flex justify-between">
              <span className="text-slate-400">Move Left / Right:</span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">A / D or ← / →</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jump Over Potholes:</span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">Space or W or ↑</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cycle Jugaad (30₹):</span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">Key 1</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bus Jugaad (50₹):</span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">Key 2</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cutting Chai (20₹):</span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 font-mono">Key 3</kbd>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2">
            <button
              onClick={() => setIsUnityModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
            >
              <span>🎮</span>
              <span>Unity Setup & C# Scripts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
