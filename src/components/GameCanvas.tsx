import React, { useRef, useEffect, useCallback } from 'react';
import { GameRenderer } from '../game/GameRenderer';
import { GameStatus, Lane, JugaadMode, CharacterProfile } from '../types/game';

interface GameCanvasProps {
  status: GameStatus;
  stateRef: React.MutableRefObject<any>;
  selectedCharacter: CharacterProfile;
  jugaadMode: JugaadMode;
  jugaadTimeRemaining: number;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  initRoadsideProps: (height: number) => void;
  updateGame: (dt: number, width: number, height: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  status,
  stateRef,
  selectedCharacter,
  jugaadMode,
  jugaadTimeRemaining,
  onMoveLeft,
  onMoveRight,
  onJump,
  initRoadsideProps,
  updateGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize canvas & renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    rendererRef.current = new GameRenderer(ctx, rect.width, rect.height);
    initRoadsideProps(rect.height);

    const handleResize = () => {
      if (!canvas || !rendererRef.current) return;
      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      ctx.scale(dpr, dpr);
      rendererRef.current.resize(newRect.width, newRect.height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initRoadsideProps]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (status !== 'playing') {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    lastFrameTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = currentTime;

      const canvas = canvasRef.current;
      const renderer = rendererRef.current;

      if (canvas && renderer) {
        const rect = canvas.getBoundingClientRect();
        updateGame(dt, rect.width, rect.height);

        const s = stateRef.current;
        renderer.render({
          playerLane: s.playerLane,
          playerCurrentX: s.playerCurrentX,
          playerY: s.playerY,
          isJumping: s.isJumping,
          jumpOffset: s.jumpOffset,
          jugaadMode: s.jugaadMode,
          jugaadTimeRemaining: s.jugaadTimer,
          stamina: s.stamina,
          isBoosting: s.isBoosting,
          vehicles: s.vehicles,
          hazards: s.hazards,
          coins: s.coinsList,
          drinks: s.drinksList,
          cows: s.cowsList,
          floatingTexts: s.floatingTexts,
          particles: s.particles,
          roadsideProps: s.roadsideProps,
          roadScrollY: s.roadScrollY,
          distanceCovered: s.distanceCovered,
          currentLevelIndex: s.currentLevelIndex || 0,
          characterColor: selectedCharacter.color,
          gameTime: s.gameTime,
        });
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [status, updateGame, stateRef, selectedCharacter]);

  // Touch Swipe Handlers (Swipe left/right to change lane, swipe up to jump)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    if (Math.abs(dx) > 1.5) {
      stateRef.current.playerCurrentX += dx * 1.15;
      touchStartRef.current.x = touch.clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    // Fast upward swipe jumps
    if (dt < 350 && dy < -30) {
      onJump();
    }

    touchStartRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full block bg-slate-900 select-none touch-none cursor-grab active:cursor-grabbing"
    />
  );
};
