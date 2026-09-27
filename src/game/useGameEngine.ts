import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameStatus,
  Lane,
  JugaadMode,
  Vehicle,
  GroundHazard,
  CoinItem,
  DrinkPickup,
  CowObstacle,
  FloatingText,
  Particle,
  RoadsideProp,
  CharacterProfile,
  GameStats,
} from '../types/game';
import {
  TOTAL_GOAL_DISTANCE,
  INITIAL_COUNTDOWN_SECONDS,
  MAX_STAMINA,
  DEFAULT_SPEED,
  MIN_STAMINA_SPEED_FRACTION,
  STAMINA_BURN_RATE_PER_SEC,
  STAMINA_BOOST_SPEED_MULTIPLIER,
  JUGAAD_CONFIG,
  DRINKS_CONFIG,
  LEVELS,
  CHARACTERS,
  LevelConfig,
} from './constants';
import { soundManager } from '../utils/audio';
import { environmentManager } from './EnvironmentManager';

export interface UseGameEngineOptions {
  characterId: string;
}

export function useGameEngine({ characterId }: UseGameEngineOptions) {
  const selectedCharacter: CharacterProfile =
    CHARACTERS.find((c) => c.id === characterId) || CHARACTERS[0];

  const [status, setStatus] = useState<GameStatus>('menu');
  const [stats, setStats] = useState<GameStats>({
    distanceCovered: 0,
    timeRemaining: INITIAL_COUNTDOWN_SECONDS,
    coins: 0,
    totalCoinsEarned: 0,
    stamina: MAX_STAMINA,
    isBoosting: false,
    currentLevelIndex: 0,
    jugaadsUsed: { cycle: 0, bus: 0, chai: 0 },
    drinksCollected: { water: 0, cold_drink: 0, nimbu_pani: 0, lassi: 0 },
    cowsEncountered: 0,
    hazardsDodged: 0,
    startTime: 0,
  });

  const [jugaadMode, setJugaadMode] = useState<JugaadMode>('none');
  const [jugaadTimeRemaining, setJugaadTimeRemaining] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [hasUsedRevive, setHasUsedRevive] = useState<boolean>(false);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);

  // Engine refs for high-frequency 60 FPS state
  const stateRef = useRef({
    distanceCovered: 0,
    timeRemaining: INITIAL_COUNTDOWN_SECONDS,
    coins: 0,
    totalCoinsEarned: 0,
    stamina: MAX_STAMINA,
    isBoosting: false,
    currentLevelIndex: 0,
    playerLane: 1 as Lane,
    targetLane: 1 as Lane,
    playerCurrentX: 0,
    playerY: 0,
    isMovingLeft: false,
    isMovingRight: false,
    isJumping: false,
    jumpVelocity: 0,
    jumpOffset: 0,
    jugaadMode: 'none' as JugaadMode,
    jugaadTimer: 0,
    jugaadSpeedMult: 1,
    roadScrollY: 0,
    vehicles: [] as Vehicle[],
    hazards: [] as GroundHazard[],
    coinsList: [] as CoinItem[],
    drinksList: [] as DrinkPickup[],
    cowsList: [] as CowObstacle[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    roadsideProps: [] as RoadsideProp[],
    nextVehicleId: 1,
    nextHazardId: 1,
    nextCoinId: 1,
    nextDrinkId: 1,
    nextCowId: 1,
    nextParticleId: 1,
    nextTextId: 1,
    nextPropId: 1,
    lastVehicleSpawnTime: 0,
    lastHazardSpawnTime: 0,
    lastCoinSpawnTime: 0,
    lastDrinkSpawnTime: 0,
    lastCowSpawnTime: 0,
    lastWrongSideSpawnTime: 0,
    gameTime: 0,
    stumbleTimer: 0, // temporary slowdown when bumping cow
    hurdleSlowdownTimer: 0, // temporary slowdown when hitting hurdles (Rule 6)
    jugaadsUsed: { cycle: 0, bus: 0, chai: 0 },
    drinksCollected: { water: 0, cold_drink: 0, nimbu_pani: 0, lassi: 0 },
    cowsEncountered: 0,
    hazardsDodged: 0,
    wrongSideDodged: 0,
    invincibleTimer: 0,
    isGameOver: false,
    isVictory: false,
  });

  const secondTimerRef = useRef<number>(0);

  // Determine active level (1 to 10) based on distance
  const getLevelForDistance = useCallback((dist: number): LevelConfig => {
    return (
      LEVELS.find((l) => dist >= l.minDist && dist < l.maxDist) ||
      LEVELS[LEVELS.length - 1]
    );
  }, []);

  // Initialize roadside props
  // Initialize roadside props on both sides
  const initRoadsideProps = useCallback((canvasHeight: number) => {
    stateRef.current.roadsideProps = environmentManager.createInitialProps(
      canvasHeight || 800,
      80,
      stateRef.current.currentLevelIndex || 0
    );
  }, []);

  // Start new run
  const startGame = useCallback(() => {
    stateRef.current = {
      distanceCovered: 0,
      timeRemaining: INITIAL_COUNTDOWN_SECONDS,
      coins: 0,
      totalCoinsEarned: 0,
      stamina: MAX_STAMINA,
      isBoosting: false,
      currentLevelIndex: 0,
      playerLane: 1,
      targetLane: 1,
      playerCurrentX: 0,
      playerY: 0,
      isMovingLeft: false,
      isMovingRight: false,
      isJumping: false,
      jumpVelocity: 0,
      jumpOffset: 0,
      jugaadMode: 'none',
      jugaadTimer: 0,
      jugaadSpeedMult: 1,
      roadScrollY: 0,
      vehicles: [],
      hazards: [],
      coinsList: [],
      drinksList: [],
      cowsList: [],
      particles: [],
      floatingTexts: [],
      roadsideProps: environmentManager.createInitialProps(800, 80, 0),
      nextVehicleId: 1,
      nextHazardId: 1,
      nextCoinId: 1,
      nextDrinkId: 1,
      nextCowId: 1,
      nextParticleId: 1,
      nextTextId: 1,
      nextPropId: 1,
      lastVehicleSpawnTime: 0,
      lastHazardSpawnTime: 0,
      lastCoinSpawnTime: 0,
      lastDrinkSpawnTime: 0,
      lastCowSpawnTime: 0,
      lastWrongSideSpawnTime: 0,
      gameTime: 0,
      stumbleTimer: 0,
      hurdleSlowdownTimer: 0,
      jugaadsUsed: { cycle: 0, bus: 0, chai: 0 },
      drinksCollected: { water: 0, cold_drink: 0, nimbu_pani: 0, lassi: 0 },
      cowsEncountered: 0,
      hazardsDodged: 0,
      wrongSideDodged: 0,
      invincibleTimer: 0,
      isGameOver: false,
      isVictory: false,
    };

    setStats({
      distanceCovered: 0,
      timeRemaining: INITIAL_COUNTDOWN_SECONDS,
      coins: 0,
      totalCoinsEarned: 0,
      stamina: MAX_STAMINA,
      isBoosting: false,
      currentLevelIndex: 0,
      jugaadsUsed: { cycle: 0, bus: 0, chai: 0 },
      drinksCollected: { water: 0, cold_drink: 0, nimbu_pani: 0, lassi: 0 },
      cowsEncountered: 0,
      hazardsDodged: 0,
      startTime: Date.now(),
    });

    setJugaadMode('none');
    setJugaadTimeRemaining(0);
    setCurrentLevel(LEVELS[0]);
    setHasUsedRevive(false);
    setIsBoosting(false);
    setStatus('playing');

    soundManager.startBGM();
  }, []);

  // Free movement actions
  const startMoveLeft = useCallback(() => {
    stateRef.current.isMovingLeft = true;
  }, []);

  const stopMoveLeft = useCallback(() => {
    stateRef.current.isMovingLeft = false;
  }, []);

  const startMoveRight = useCallback(() => {
    stateRef.current.isMovingRight = true;
  }, []);

  const stopMoveRight = useCallback(() => {
    stateRef.current.isMovingRight = false;
  }, []);

  // Quick nudge actions (tap or mobile button click)
  const moveLeft = useCallback(() => {
    if (status !== 'playing') return;
    stateRef.current.playerCurrentX -= 35;
    soundManager.playLaneSwitch();
  }, [status]);

  const moveRight = useCallback(() => {
    if (status !== 'playing') return;
    stateRef.current.playerCurrentX += 35;
    soundManager.playLaneSwitch();
  }, [status]);

  // Jump action
  const jump = useCallback(() => {
    if (status !== 'playing') return;
    if (!stateRef.current.isJumping) {
      stateRef.current.isJumping = true;
      stateRef.current.jumpVelocity = 350;
      soundManager.playJump();
    }
  }, [status]);

  // STAMINA BOOST (Hold to Boost)
  const startBoost = useCallback(() => {
    if (status !== 'playing') return;
    if (stateRef.current.stamina > 0) {
      stateRef.current.isBoosting = true;
      setIsBoosting(true);
      soundManager.playStaminaBoost();
    }
  }, [status]);

  const stopBoost = useCallback(() => {
    stateRef.current.isBoosting = false;
    setIsBoosting(false);
  }, []);

  // Activate Jugaads
  const activateJugaad = useCallback(
    (type: 'cycle' | 'bus' | 'chai') => {
      if (status !== 'playing') return;
      const config = JUGAAD_CONFIG[type];
      const s = stateRef.current;

      if (s.coins < config.cost) {
        return false;
      }

      s.coins -= config.cost;
      s.jugaadMode = type;
      s.jugaadTimer = config.duration;
      s.jugaadSpeedMult = config.speedMultiplier;
      s.jugaadsUsed[type] += 1;

      if (type === 'chai') {
        s.timeRemaining += (config as typeof JUGAAD_CONFIG.chai).timeBonus;
        s.floatingTexts.push({
          id: s.nextTextId++,
          x: s.playerCurrentX,
          y: s.playerY - 40,
          text: '+15s CHAI BOOST! ☕',
          color: '#fbbf24',
          opacity: 1,
          vy: -60,
          fontSize: 16,
        });
        soundManager.playJugaadActive();
        setJugaadMode(type);
        setJugaadTimeRemaining(config.duration);
        return true;
      }

      if (type === 'cycle') {
        // Indian street workaround: Request a lift from a passing 2-seater bicycle!
        soundManager.playCycleBell();
        s.jugaadMode = 'cycle_seeking';
        s.jugaadTimer = JUGAAD_CONFIG.cycle.seekDuration;
        s.jugaadSpeedMult = 1.0; // still running on foot while seeking

        // Spawn a friendly 2-seater cyclist in traffic if none is currently nearby
        const nearbyCycle = s.vehicles.find(
          (v) => v.type === 'cycle' && !v.isHit && v.y < s.playerY && v.y > s.playerY - 260
        );

        if (!nearbyCycle) {
          const spawnLane = s.playerLane;
          s.vehicles.push({
            id: s.nextVehicleId++,
            lane: spawnLane,
            targetLane: spawnLane,
            laneChangeProgress: 0,
            y: s.playerY - 140, // ahead of player
            speed: 155, // faster than player run speed
            width: 26,
            length: 50,
            type: 'cycle',
            isLiftAvailable: true,
          });
        }

        s.floatingTexts.push({
          id: s.nextTextId++,
          x: s.playerCurrentX,
          y: s.playerY - 45,
          text: '🙋 "BHAIYA LIFT PLEASE!" (Catch the 2-seater cycle!)',
          color: '#38bdf8',
          opacity: 1,
          vy: -55,
          fontSize: 14,
        });

        soundManager.playJugaadActive();
        setJugaadMode('cycle_seeking');
        setJugaadTimeRemaining(JUGAAD_CONFIG.cycle.seekDuration);
        return true;
      }

      if (type === 'bus') {
        // Indian street workaround: Run and catch the rear footboard of a passing city bus!
        soundManager.playBusHorn();
        s.jugaadMode = 'bus_seeking';
        s.jugaadTimer = JUGAAD_CONFIG.bus.seekDuration;
        s.jugaadSpeedMult = 1.0; // still running on foot while chasing bus

        // Spawn a city bus ahead if none is currently nearby
        const nearbyBus = s.vehicles.find(
          (v) => v.type.startsWith('bus') && !v.isHit && v.y < s.playerY && v.y > s.playerY - 300
        );

        if (!nearbyBus) {
          const spawnLane = s.playerLane;
          s.vehicles.push({
            id: s.nextVehicleId++,
            lane: spawnLane,
            targetLane: spawnLane,
            laneChangeProgress: 0,
            y: s.playerY - 170, // 170px ahead of player
            speed: 165,
            width: 44,
            length: 96,
            type: 'bus_city',
            isLiftAvailable: true,
          });
        }

        s.floatingTexts.push({
          id: s.nextTextId++,
          x: s.playerCurrentX,
          y: s.playerY - 45,
          text: '🙋 "CONDUCTOR BHAIYA RUKO!" (Catch bus footboard!)',
          color: '#facc15',
          opacity: 1,
          vy: -55,
          fontSize: 14,
        });

        soundManager.playJugaadActive();
        setJugaadMode('bus_seeking');
        setJugaadTimeRemaining(JUGAAD_CONFIG.bus.seekDuration);
        return true;
      }
    },
    [status]
  );

  // Revive feature using Jugaad
  const useJugaadRevive = useCallback(() => {
    if (status !== 'gameover' || hasUsedRevive) return false;
    const s = stateRef.current;
    if (s.coins < 20) return false;

    s.coins -= 20;
    s.isGameOver = false;
    s.invincibleTimer = 3.0;
    s.playerLane = 1;
    s.targetLane = 1;
    s.timeRemaining = Math.max(s.timeRemaining, 30);
    s.stamina = Math.max(s.stamina, 35); // restore some stamina on revive
    s.vehicles = s.vehicles.filter((v) => v.y > s.playerY + 80 || v.y < s.playerY - 180);
    s.hazards = s.hazards.filter((h) => Math.abs(h.y - s.playerY) > 120);

    setHasUsedRevive(true);
    setStatus('playing');
    soundManager.playJugaadActive();
    soundManager.startBGM();
    return true;
  }, [status, hasUsedRevive]);

  // Main loop update function
  const updateGame = useCallback(
    (dt: number, canvasWidth: number, canvasHeight: number) => {
      const s = stateRef.current;
      if (s.isGameOver || s.isVictory) return;

      s.gameTime += dt;
      secondTimerRef.current += dt;

      // Handle Countdown Timer
      if (secondTimerRef.current >= 1.0) {
        secondTimerRef.current -= 1.0;
        s.timeRemaining -= 1;

        if (s.timeRemaining <= 15 && s.timeRemaining > 0) {
          soundManager.playTimerWarning();
        }

        if (s.timeRemaining <= 0) {
          s.isGameOver = true;
          s.timeRemaining = 0;
          setStatus('gameover');
          soundManager.stopBGM();
          soundManager.playCrash();
          setStats((prev) => ({
            ...prev,
            distanceCovered: Math.floor(s.distanceCovered),
            coins: s.coins,
            totalCoinsEarned: s.totalCoinsEarned,
            stamina: Math.round(s.stamina),
            timeRemaining: 0,
            jugaadsUsed: { ...s.jugaadsUsed },
            drinksCollected: { ...s.drinksCollected },
            cowsEncountered: s.cowsEncountered,
            hazardsDodged: s.hazardsDodged,
            failureReason: 'timeout',
          }));
          return;
        }
      }

      // STAMINA MANAGEMENT:
      // - Normal running: Stamina decreases at 2 per second while running.
      // - Boosting: Speed increases and stamina continues draining.
      // - While taking a cycle lift or riding bus, student is resting so stamina does NOT burn!
      // - When stamina reaches 0: clamped to 0, boost turns off, player runs at min speed (default/3).
      const isTakingRide = s.jugaadMode === 'cycle' || s.jugaadMode === 'bus';
      if (s.stamina > 0 && !isTakingRide) {
        const drainRate = s.isBoosting ? 5 : STAMINA_BURN_RATE_PER_SEC; // 2/sec running, 5/sec boosting
        s.stamina = Math.max(0, s.stamina - drainRate * dt);

        if (s.stamina <= 0) {
          s.stamina = 0;
          if (s.isBoosting) {
            s.isBoosting = false;
            setIsBoosting(false);
            s.floatingTexts.push({
              id: s.nextTextId++,
              x: s.playerCurrentX,
              y: s.playerY - 35,
              text: 'STAMINA 0! Min Speed (1/3) 🥤',
              color: '#ef4444',
              opacity: 1,
              vy: -40,
              fontSize: 13,
            });
          }
        }
      }

      // RULES 3 & 4:
      // - Rule 3: Default stamina (100%) equals default speed (1.0x).
      // - Rule 4: As stamina lowers, player speed goes down, but cannot go below default speed / 3 (if stamina is below 20).
      //   Between 100% and 20%: scales smoothly from 1.0 down to 1/3 (0.3333).
      //   Below 20% (including 0): clamped at 1/3 (cannot go below default speed / 3).
      const minFraction = MIN_STAMINA_SPEED_FRACTION; // 1 / 3
      let staminaSpeedFactor = minFraction;
      if (s.stamina >= 20) {
        const staminaRatio = (s.stamina - 20) / (MAX_STAMINA - 20); // 0 at 20, 1 at 100
        staminaSpeedFactor = minFraction + (1.0 - minFraction) * staminaRatio;
      } else {
        staminaSpeedFactor = minFraction; // Cannot go below default speed / 3
      }

      let staminaSpeedBonus = 1.0;
      if (s.isBoosting && s.stamina > 0) {
        staminaSpeedBonus = STAMINA_BOOST_SPEED_MULTIPLIER;
      } else if (s.isBoosting && s.stamina <= 0) {
        s.isBoosting = false;
        setIsBoosting(false);
      }

      // RULE 6: Hurdles slows the player!
      let hurdleSpeedFactor = 1.0;
      if (s.hurdleSlowdownTimer > 0) {
        s.hurdleSlowdownTimer -= dt;
        hurdleSpeedFactor = 0.55; // 45% slowdown when tripping on hurdles
      }

      // Stumble slowdown effect if bumped cow
      let stumbleSpeedFactor = 1.0;
      if (s.stumbleTimer > 0) {
        s.stumbleTimer -= dt;
        stumbleSpeedFactor = 0.65;
      }

      // RULE 1, 3, 4, 6: Effective Speed Calculation (m/s)
      // Default Speed = 12 m/s. Base speed = DEFAULT_SPEED * staminaSpeedFactor.
      const baseRunSpeedMps = DEFAULT_SPEED;
      const characterMult = selectedCharacter.speedBonus;
      const effectiveSpeedMps =
        baseRunSpeedMps *
        staminaSpeedFactor *
        staminaSpeedBonus *
        characterMult *
        s.jugaadSpeedMult *
        hurdleSpeedFactor *
        stumbleSpeedFactor;

      // Update distance covered
      s.distanceCovered += effectiveSpeedMps * dt;
      const activeLevel = getLevelForDistance(s.distanceCovered);
      s.currentLevelIndex = activeLevel.levelNumber - 1;
      setCurrentLevel(activeLevel);

      // Check Win Condition at 1,000 meters!
      if (s.distanceCovered >= TOTAL_GOAL_DISTANCE) {
        s.distanceCovered = TOTAL_GOAL_DISTANCE;
        s.isVictory = true;
        setStatus('victory');
        soundManager.stopBGM();
        soundManager.playVictory();
        setStats((prev) => ({
          ...prev,
          distanceCovered: TOTAL_GOAL_DISTANCE,
          coins: s.coins,
          totalCoinsEarned: s.totalCoinsEarned,
          stamina: Math.round(s.stamina),
          timeRemaining: Math.max(0, s.timeRemaining),
          finishTime: Date.now(),
          jugaadsUsed: { ...s.jugaadsUsed },
          drinksCollected: { ...s.drinksCollected },
          cowsEncountered: s.cowsEncountered,
          hazardsDodged: s.hazardsDodged,
          wrongSideDodged: s.wrongSideDodged,
        }));
        return;
      }

      // Update Road Scroll
      const roadPixelSpeed = effectiveSpeedMps * 20;
      s.roadScrollY += roadPixelSpeed * dt;

      // Update Jugaad Timer
      if (s.jugaadMode !== 'none') {
        s.jugaadTimer -= dt;
        setJugaadTimeRemaining(Math.max(0, s.jugaadTimer));
        if (s.jugaadTimer <= 0) {
          const prevMode = s.jugaadMode;
          s.jugaadMode = 'none';
          s.jugaadSpeedMult = 1.0;
          setJugaadMode('none');

          if (prevMode === 'cycle_seeking') {
            s.floatingTexts.push({
              id: s.nextTextId++,
              x: s.playerCurrentX,
              y: s.playerY - 35,
              text: 'Cycle missed! Keep running! 🏃',
              color: '#f87171',
              opacity: 1,
              vy: -40,
              fontSize: 13,
            });
          } else if (prevMode === 'cycle') {
            s.floatingTexts.push({
              id: s.nextTextId++,
              x: s.playerCurrentX,
              y: s.playerY - 35,
              text: 'Lift ended! "Thanks Bhaiya!" 🙏🎒',
              color: '#38bdf8',
              opacity: 1,
              vy: -40,
              fontSize: 13,
            });
          } else if (prevMode === 'bus_seeking') {
            s.floatingTexts.push({
              id: s.nextTextId++,
              x: s.playerCurrentX,
              y: s.playerY - 35,
              text: 'Bus missed! Keep running! 🏃',
              color: '#f87171',
              opacity: 1,
              vy: -40,
              fontSize: 13,
            });
          } else if (prevMode === 'bus') {
            s.floatingTexts.push({
              id: s.nextTextId++,
              x: s.playerCurrentX,
              y: s.playerY - 35,
              text: 'Next Stop! Jumped off safely! 🎒🚌',
              color: '#facc15',
              opacity: 1,
              vy: -40,
              fontSize: 13,
            });
          }
        }
      }

      if (s.invincibleTimer > 0) {
        s.invincibleTimer -= dt;
      }

      // WIDE CAMERA VIEW:
      // Road covers 54% of viewport width, providing ~80+ px wide lanes and spacious ~23% left/right sidewalk zones
      const roadRatio = 0.54;
      const roadWidth = Math.round(canvasWidth * roadRatio);
      const roadLeft = Math.round((canvasWidth - roadWidth) / 2);
      const laneWidth = roadWidth / 3;
      const getLaneX = (lane: Lane) => roadLeft + laneWidth * (lane + 0.5);

      // Update Environmental Props on both sides of road
      const sidewalkW = roadLeft;
      environmentManager.updateProps(
        s.roadsideProps,
        roadPixelSpeed,
        dt,
        canvasHeight,
        sidewalkW,
        s.currentLevelIndex
      );

      // Player comfortably positioned at lower-middle section (~73% down screen)
      // giving extensive reaction time & lookahead distance
      s.playerY = Math.round(canvasHeight * 0.73);

      // Initialize player position to center lane if not yet set
      if (!s.playerCurrentX || s.playerCurrentX === 0) {
        s.playerCurrentX = getLaneX(1);
      }

      // FREE CONTINUOUS HORIZONTAL MOVEMENT:
      // When pressing/holding A (left) or D (right), player moves freely with full analog precision
      const freeSteerSpeed = 380; // pixels per second for responsive dodging
      let steerDir = 0;
      if (s.isMovingLeft) steerDir -= 1;
      if (s.isMovingRight) steerDir += 1;

      if (steerDir !== 0) {
        s.playerCurrentX += steerDir * freeSteerSpeed * dt;
      }

      // Clamp player strictly within road boundaries (with 22px margin from curb)
      const minX = roadLeft + 22;
      const maxX = roadLeft + roadWidth - 22;
      s.playerCurrentX = Math.max(minX, Math.min(maxX, s.playerCurrentX));

      // Calculate which lane slice the player is currently occupying
      if (s.playerCurrentX < roadLeft + laneWidth) {
        s.playerLane = 0;
        s.targetLane = 0;
      } else if (s.playerCurrentX > roadLeft + laneWidth * 2) {
        s.playerLane = 2;
        s.targetLane = 2;
      } else {
        s.playerLane = 1;
        s.targetLane = 1;
      }

      // Jump Physics
      if (s.isJumping) {
        s.jumpOffset += s.jumpVelocity * dt;
        s.jumpVelocity -= 980 * dt;
        if (s.jumpOffset <= 0) {
          s.jumpOffset = 0;
          s.jumpVelocity = 0;
          s.isJumping = false;
        }
      }

      // --- SPAWNING SYSTEM ---
      // 1. Spawning Vehicles
      if (
        s.gameTime - s.lastVehicleSpawnTime > activeLevel.trafficFrequency &&
        s.distanceCovered < 950
      ) {
        s.lastVehicleSpawnTime = s.gameTime;

        const lane = (Math.floor(Math.random() * 3)) as Lane;
        const vehicleTypes: Vehicle['type'][] = ['cycle', 'auto', 'car_red', 'car_blue', 'scooter', 'tempo'];
        if (s.distanceCovered > 250) vehicleTypes.push('bus_yellow', 'bus_city');

        const chosenType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        let vWidth = 36;
        let vLength = 54;

        if (chosenType === 'cycle') {
          vWidth = 26;
          vLength = 50;
        } else if (chosenType === 'auto') {
          vWidth = 34;
          vLength = 48;
        } else if (chosenType === 'scooter') {
          vWidth = 20;
          vLength = 36;
        } else if (chosenType.startsWith('bus')) {
          vWidth = 44;
          vLength = 96;
        } else if (chosenType === 'tempo') {
          vWidth = 38;
          vLength = 62;
        }

        const vSpeed = chosenType === 'cycle'
          ? 150 + Math.random() * 35 // Faster than player run speed
          : activeLevel.trafficSpeedMin + Math.random() * (activeLevel.trafficSpeedMax - activeLevel.trafficSpeedMin);

        s.vehicles.push({
          id: s.nextVehicleId++,
          lane,
          targetLane: lane,
          laneChangeProgress: 0,
          y: -120,
          speed: vSpeed,
          width: vWidth,
          length: vLength,
          type: chosenType,
        });
      }

      // 1b. WRONG-SIDE VEHICLE SPAWNER (Classic Indian Street Hazard!)
      // Fast vehicles speeding head-on in Left, Center, or Right lane
      const wrongSideInterval = Math.max(3.2, 6.8 - ((activeLevel.levelNumber || 1) - 1) * 0.35);
      if (
        s.gameTime - s.lastWrongSideSpawnTime > wrongSideInterval &&
        s.distanceCovered > 35 &&
        s.distanceCovered < 970 &&
        Math.random() < 0.75
      ) {
        s.lastWrongSideSpawnTime = s.gameTime;

        // Choose random lane from Left (0), Center (1), Right (2)
        const lane = (Math.floor(Math.random() * 3)) as Lane;
        const wrongSidePool: Vehicle['type'][] = ['scooter', 'auto', 'car_red'];
        const chosenType = wrongSidePool[Math.floor(Math.random() * wrongSidePool.length)];

        let vWidth = 34;
        let vLength = 48;
        if (chosenType === 'scooter') {
          vWidth = 22;
          vLength = 36;
        } else if (chosenType === 'auto') {
          vWidth = 34;
          vLength = 48;
        } else if (chosenType === 'car_red') {
          vWidth = 38;
          vLength = 56;
        }

        // Fast head-on speed
        const vSpeed = 260 + Math.random() * 70;

        s.vehicles.push({
          id: s.nextVehicleId++,
          lane,
          targetLane: lane,
          laneChangeProgress: 0,
          y: -140,
          speed: vSpeed,
          width: vWidth,
          length: vLength,
          type: chosenType,
          isWrongSide: true,
          wrongSideWarned: false,
        });
      }

      // 2. Spawning Ground Hazards
      if (
        s.gameTime - s.lastHazardSpawnTime > 2.8 &&
        Math.random() < activeLevel.hazardProbability &&
        s.distanceCovered < 950
      ) {
        s.lastHazardSpawnTime = s.gameTime;
        const lane = (Math.floor(Math.random() * 3)) as Lane;
        const hazardTypes: GroundHazard['type'][] = ['pothole', 'water_puddle', 'barricade', 'speed_bump'];
        const hType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];

        s.hazards.push({
          id: s.nextHazardId++,
          lane,
          y: -80,
          type: hType,
          width: 44,
          length: 30,
        });
      }

      // 3. Spawning DRINK PICKUPS (Water, Cold Drink, Nimbu Pani, Lassi)
      if (
        s.gameTime - s.lastDrinkSpawnTime > activeLevel.drinkSpawnInterval &&
        s.distanceCovered < 960
      ) {
        s.lastDrinkSpawnTime = s.gameTime;

        // Choose drink based on level preferred drinks
        const pool = activeLevel.preferredDrinks;
        const chosenType = pool[Math.floor(Math.random() * pool.length)] || 'water';
        const config = DRINKS_CONFIG[chosenType];

        // Strategic Placement: place drink in safe or moderately risky lane
        const lane = (Math.floor(Math.random() * 3)) as Lane;

        s.drinksList.push({
          id: s.nextDrinkId++,
          lane,
          y: -70,
          type: chosenType,
          name: config.name,
          staminaRestore: config.staminaRestore,
          color: config.color,
        });
      }

      // 4. Spawning COWS (Mainly roadside, occasional crossing moving obstacles)
      if (
        s.gameTime - s.lastCowSpawnTime > 3.2 &&
        Math.random() < activeLevel.cowProbability &&
        s.distanceCovered < 950
      ) {
        s.lastCowSpawnTime = s.gameTime;

        // 70% roadside, 30% walking slowly across road
        const isRoadside = Math.random() < 0.7;
        const cowSide: 'left_side' | 'right_side' | 'road' = isRoadside
          ? Math.random() < 0.5 ? 'left_side' : 'right_side'
          : 'road';

        let cowX = 0;
        let cowTargetX = 0;
        let cowVx = 0;
        let cowLane: Lane | undefined;

        if (cowSide === 'left_side') {
          // Standing on left sidewalk / curb edge
          cowX = roadLeft - 18 - Math.random() * 15;
        } else if (cowSide === 'right_side') {
          // Standing on right sidewalk / curb edge
          cowX = roadLeft + roadWidth + 18 + Math.random() * 15;
        } else {
          // Slowly walking onto road (crossing 1 lane gently)
          const startFromLeft = Math.random() < 0.5;
          cowLane = (startFromLeft ? 0 : 2) as Lane;
          cowX = startFromLeft ? roadLeft - 10 : roadLeft + roadWidth + 10;
          cowTargetX = getLaneX(cowLane);
          cowVx = startFromLeft ? 28 : -28;
        }

        const colorTypes: CowObstacle['colorType'][] = ['white', 'brown', 'spotted'];
        const chosenColor = colorTypes[Math.floor(Math.random() * colorTypes.length)];

        s.cowsList.push({
          id: s.nextCowId++,
          side: cowSide,
          lane: cowLane,
          x: cowX,
          y: -90,
          targetX: cowTargetX,
          vx: cowVx,
          isMoving: !isRoadside,
          crossingLane: !isRoadside,
          width: 32,
          height: 48,
          colorType: chosenColor,
          tailWag: 0,
        });
      }

      // 5. Spawning Coins
      if (s.gameTime - s.lastCoinSpawnTime > 1.5 && s.distanceCovered < 960) {
        s.lastCoinSpawnTime = s.gameTime;
        const lane = (Math.floor(Math.random() * 3)) as Lane;
        const coinCount = Math.floor(2 + Math.random() * 3);

        for (let i = 0; i < coinCount; i++) {
          s.coinsList.push({
            id: s.nextCoinId++,
            lane,
            y: -80 - i * 36,
            type: Math.random() < 0.08 ? 'chai' : 'coin',
            value: 1,
          });
        }
      }

      // --- MOVEMENT & COLLISION RESOLUTION ---

      // 1. Update Vehicles
      for (let i = s.vehicles.length - 1; i >= 0; i--) {
        const v = s.vehicles[i];

        if (v.isHit) {
          v.x = (v.x ?? getLaneX(v.lane)) + (v.hitVelocityX || 200) * dt;
          v.y += (v.hitVelocityY || 200) * dt;
          v.hitRotation = (v.hitRotation || 0) + 10 * dt;
        } else {
          if (v.isWrongSide) {
            // Wrong-side vehicle moving head-on down towards player at high speed
            v.y += (roadPixelSpeed * 0.45 + v.speed * 0.65) * dt;

            // Trigger horn sound & alert banner when entering screen view
            if (!v.wrongSideWarned && v.y > -30) {
              v.wrongSideWarned = true;
              soundManager.playWrongSideAlert();
              s.floatingTexts.push({
                id: s.nextTextId++,
                x: getLaneX(v.lane),
                y: 40,
                text: '⚠️ WRONG SIDE! PEE-PEE! 🚨',
                color: '#ef4444',
                opacity: 1,
                vy: -55,
                fontSize: 13,
              });
            }
          } else {
            v.y += (roadPixelSpeed * 0.45 + v.speed * 0.55) * dt;

            if (v.type === 'auto' && Math.random() < 0.005 && v.laneChangeProgress === 0) {
              const possibleLanes: Lane[] = [0, 1, 2].filter((l) => l !== v.lane) as Lane[];
              v.targetLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
            }

            if (v.targetLane !== v.lane) {
              v.laneChangeProgress = Math.min(1, v.laneChangeProgress + dt * 1.5);
              if (v.laneChangeProgress >= 1) {
                v.lane = v.targetLane;
                v.laneChangeProgress = 0;
              }
            }
          }
        }

        if (v.y > canvasHeight + 250) {
          if (v.isWrongSide) {
            s.wrongSideDodged = (s.wrongSideDodged || 0) + 1;
            // Dodging bonus feedback
            if (Math.abs(s.playerCurrentX - getLaneX(v.lane)) < 90) {
              s.floatingTexts.push({
                id: s.nextTextId++,
                x: s.playerCurrentX,
                y: s.playerY - 25,
                text: '⚡ WRONG-SIDE DODGED! 💨',
                color: '#22c55e',
                opacity: 0.9,
                vy: -35,
                fontSize: 12,
              });
            }
          }
          s.vehicles.splice(i, 1);
          s.hazardsDodged += 1;
          continue;
        }

        // Collision Check with Player
        if (!v.isHit) {
          const vx = v.x ?? getLaneX(v.lane) + (getLaneX(v.targetLane) - getLaneX(v.lane)) * v.laneChangeProgress;
          const dx = Math.abs(s.playerCurrentX - vx);
          const dy = Math.abs(s.playerY - v.y);

          if (dx < (v.width + 24) / 2 && dy < (v.length + 30) / 2) {
            // Check for 2-Seater Bicycle Lift Jugaad
            if (v.type === 'cycle') {
              if (s.jugaadMode === 'cycle_seeking') {
                // SUCCESS! Took lift on the 2-seater bicycle!
                soundManager.playCycleBell();
                soundManager.playJugaadActive();
                s.jugaadMode = 'cycle';
                s.jugaadTimer = JUGAAD_CONFIG.cycle.rideDuration;
                s.jugaadSpeedMult = JUGAAD_CONFIG.cycle.speedMultiplier;
                setJugaadMode('cycle');
                setJugaadTimeRemaining(JUGAAD_CONFIG.cycle.rideDuration);

                // Remove the traffic cycle as player is now riding its back seat!
                s.vehicles.splice(i, 1);

                for (let p = 0; p < 10; p++) {
                  s.particles.push({
                    id: s.nextParticleId++,
                    x: vx,
                    y: v.y,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200,
                    color: '#38bdf8',
                    size: 3 + Math.random() * 3,
                    life: 0.5,
                    maxLife: 0.5,
                  });
                }

                s.floatingTexts.push({
                  id: s.nextTextId++,
                  x: s.playerCurrentX,
                  y: s.playerY - 45,
                  text: 'LIFT MIL GAYI! 🚲 Sitting on back seat!',
                  color: '#22c55e',
                  opacity: 1,
                  vy: -70,
                  fontSize: 15,
                });
                continue;
              } else if (s.jugaadMode === 'cycle') {
                // Already taking a cycle lift, bypass other cycles
                continue;
              } else {
                // Bumping into a bicycle in traffic: gentle non-fatal street bump!
                soundManager.playCycleBell();
                s.hurdleSlowdownTimer = 0.7;
                s.floatingTexts.push({
                  id: s.nextTextId++,
                  x: vx,
                  y: v.y - 30,
                  text: 'Ting-Ting! 🔔 "Dekh ke bhai!"',
                  color: '#facc15',
                  opacity: 1,
                  vy: -40,
                  fontSize: 13,
                });
                continue;
              }
            }

            // Check for Bus Footboard Lift Catch!
            if (v.type.startsWith('bus')) {
              if (s.jugaadMode === 'bus_seeking') {
                // SUCCESS! Caught the rear footboard of the bus!
                soundManager.playBusHorn();
                soundManager.playJugaadActive();
                s.jugaadMode = 'bus';
                s.jugaadTimer = JUGAAD_CONFIG.bus.rideDuration;
                s.jugaadSpeedMult = JUGAAD_CONFIG.bus.speedMultiplier;
                setJugaadMode('bus');
                setJugaadTimeRemaining(JUGAAD_CONFIG.bus.rideDuration);

                // Remove the traffic bus as player is now hanging on its back!
                s.vehicles.splice(i, 1);

                for (let p = 0; p < 14; p++) {
                  s.particles.push({
                    id: s.nextParticleId++,
                    x: vx,
                    y: v.y,
                    vx: (Math.random() - 0.5) * 260,
                    vy: (Math.random() - 0.5) * 260,
                    color: '#facc15',
                    size: 3 + Math.random() * 4,
                    life: 0.5,
                    maxLife: 0.5,
                  });
                }

                s.floatingTexts.push({
                  id: s.nextTextId++,
                  x: s.playerCurrentX,
                  y: s.playerY - 45,
                  text: 'FOOTBOARD CATCH! 🚌 Hanging on the back of the bus!',
                  color: '#ef4444',
                  opacity: 1,
                  vy: -70,
                  fontSize: 15,
                });
                continue;
              }
            }

            if (v.isWrongSide) {
              if (s.jugaadMode === 'bus') {
                v.isHit = true;
                v.hitVelocityX = (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 120);
                v.hitVelocityY = -220 - Math.random() * 80;
                soundManager.playCarHorn();
                soundManager.playCrash();

                for (let p = 0; p < 14; p++) {
                  s.particles.push({
                    id: s.nextParticleId++,
                    x: vx,
                    y: v.y,
                    vx: (Math.random() - 0.5) * 320,
                    vy: (Math.random() - 0.5) * 320,
                    color: '#ef4444',
                    size: 3 + Math.random() * 4,
                    life: 0.45,
                    maxLife: 0.45,
                  });
                }

                s.floatingTexts.push({
                  id: s.nextTextId++,
                  x: vx,
                  y: v.y - 30,
                  text: 'RAMMED WRONG-SIDE! 💥',
                  color: '#ef4444',
                  opacity: 1,
                  vy: -70,
                  fontSize: 14,
                });
                continue;
              } else if (s.invincibleTimer <= 0) {
                s.isGameOver = true;
                setStatus('gameover');
                soundManager.stopBGM();
                soundManager.playCrash();
                soundManager.playWrongSideAlert();
                s.floatingTexts.push({
                  id: s.nextTextId++,
                  x: vx,
                  y: v.y - 20,
                  text: '💥 WRONG-SIDE VEHICLE HIT! 💥',
                  color: '#dc2626',
                  opacity: 1,
                  vy: -60,
                  fontSize: 16,
                });
                setStats((prev) => ({
                  ...prev,
                  distanceCovered: Math.floor(s.distanceCovered),
                  coins: s.coins,
                  totalCoinsEarned: s.totalCoinsEarned,
                  stamina: Math.round(s.stamina),
                  timeRemaining: Math.max(0, s.timeRemaining),
                  jugaadsUsed: { ...s.jugaadsUsed },
                  drinksCollected: { ...s.drinksCollected },
                  cowsEncountered: s.cowsEncountered,
                  hazardsDodged: s.hazardsDodged,
                  wrongSideDodged: s.wrongSideDodged,
                  failureReason: 'collision',
                }));
                return;
              }
            }

            if (s.jugaadMode === 'bus') {
              v.isHit = true;
              v.hitVelocityX = (Math.random() > 0.5 ? 1 : -1) * (260 + Math.random() * 120);
              v.hitVelocityY = -150 - Math.random() * 100;
              soundManager.playCarHorn();
              soundManager.playCrash();

              for (let p = 0; p < 12; p++) {
                s.particles.push({
                  id: s.nextParticleId++,
                  x: vx,
                  y: v.y,
                  vx: (Math.random() - 0.5) * 300,
                  vy: (Math.random() - 0.5) * 300,
                  color: '#facc15',
                  size: 3 + Math.random() * 4,
                  life: 0.45,
                  maxLife: 0.45,
                });
              }

              s.floatingTexts.push({
                id: s.nextTextId++,
                x: vx,
                y: v.y - 30,
                text: 'RAMMED! 💥',
                color: '#ef4444',
                opacity: 1,
                vy: -70,
                fontSize: 14,
              });
            } else if (s.invincibleTimer <= 0) {
              s.isGameOver = true;
              setStatus('gameover');
              soundManager.stopBGM();
              soundManager.playCrash();
              setStats((prev) => ({
                ...prev,
                distanceCovered: Math.floor(s.distanceCovered),
                coins: s.coins,
                totalCoinsEarned: s.totalCoinsEarned,
                stamina: Math.round(s.stamina),
                timeRemaining: Math.max(0, s.timeRemaining),
                jugaadsUsed: { ...s.jugaadsUsed },
                drinksCollected: { ...s.drinksCollected },
                cowsEncountered: s.cowsEncountered,
                hazardsDodged: s.hazardsDodged,
                wrongSideDodged: s.wrongSideDodged,
                failureReason: 'collision',
              }));
              return;
            }
          }
        }
      }

      // 2. Update Cows
      for (let i = s.cowsList.length - 1; i >= 0; i--) {
        const cow = s.cowsList[i];
        // Move along with road scroll
        cow.y += roadPixelSpeed * dt;

        // If crossing, move gently horizontally
        if (cow.isMoving && cow.targetX !== undefined) {
          cow.x += cow.vx * dt;
          // When cow reaches target lane, slow down / stop
          if (
            (cow.vx > 0 && cow.x >= cow.targetX) ||
            (cow.vx < 0 && cow.x <= cow.targetX)
          ) {
            cow.isMoving = false;
          }
        }

        if (cow.y > canvasHeight + 150) {
          s.cowsList.splice(i, 1);
          continue;
        }

        // Cow Collision Check with Player
        const dx = Math.abs(s.playerCurrentX - cow.x);
        const dy = Math.abs(s.playerY - cow.y);

        if (dx < (cow.width + 20) / 2 && dy < (cow.height + 25) / 2 && !cow.hasStumbled) {
          cow.hasStumbled = true;
          s.cowsEncountered += 1;
          soundManager.playCowMoo();

          if (s.jugaadMode === 'bus') {
            // Bus gently nudges cow
            s.floatingTexts.push({
              id: s.nextTextId++,
              x: cow.x,
              y: cow.y - 25,
              text: 'MOOO! 🐮 Bus Horn Blows!',
              color: '#facc15',
              opacity: 1,
              vy: -50,
              fontSize: 14,
            });
          } else {
            // Respectful Indian stumble: slow player down + lose 5 coins (not an instant unfair kill!)
            s.coins = Math.max(0, s.coins - 5);
            s.stumbleTimer = 1.4; // 1.4s temporary slowdown

            const quotes = ['Arre Cow! 🐮', 'Bhai, Side Se!', 'Gau Mata Alert! 🙏'];
            const chosenQuote = quotes[Math.floor(Math.random() * quotes.length)];

            s.floatingTexts.push({
              id: s.nextTextId++,
              x: cow.x,
              y: cow.y - 30,
              text: chosenQuote,
              color: '#fbbf24',
              opacity: 1,
              vy: -50,
              fontSize: 14,
            });
          }
        }
      }

      // 3. Update Drink Pickups (Water, Cold Drink, Nimbu Pani, Lassi)
      for (let i = s.drinksList.length - 1; i >= 0; i--) {
        const d = s.drinksList[i];
        d.y += roadPixelSpeed * dt;

        if (d.y > canvasHeight + 80) {
          s.drinksList.splice(i, 1);
          continue;
        }

        if (!d.collected) {
          const cx = getLaneX(d.lane);
          const dx = Math.abs(s.playerCurrentX - cx);
          const dy = Math.abs(s.playerY - d.y);

          if (dx < 42 && dy < 45) {
            d.collected = true;

            // Restore Stamina (clamped strictly to MAX_STAMINA = 100)
            const prevStamina = s.stamina;
            s.stamina = Math.min(MAX_STAMINA, s.stamina + d.staminaRestore);
            const actualRestored = Math.round(s.stamina - prevStamina);

            soundManager.playDrinkPickup();
            s.drinksCollected[d.type] += 1;

            // Celebration Particles
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                id: s.nextParticleId++,
                x: cx,
                y: d.y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                color: d.color,
                size: 3 + Math.random() * 3,
                life: 0.4,
                maxLife: 0.4,
              });
            }

            // Floating Indian celebration text
            const celebration = DRINKS_CONFIG[d.type].celebrationText;
            s.floatingTexts.push({
              id: s.nextTextId++,
              x: cx,
              y: d.y - 25,
              text: celebration,
              color: d.color,
              opacity: 1,
              vy: -60,
              fontSize: 14,
            });
          }
        }
      }

      // 4. Update Ground Hazards
      for (let i = s.hazards.length - 1; i >= 0; i--) {
        const h = s.hazards[i];
        h.y += roadPixelSpeed * dt;

        if (h.y > canvasHeight + 100) {
          s.hazards.splice(i, 1);
          continue;
        }

        if (!h.cleared) {
          const hx = getLaneX(h.lane);
          const dx = Math.abs(s.playerCurrentX - hx);
          const dy = Math.abs(s.playerY - h.y);

          // Precision collision: only hits if player physically overlaps the hazard
          if (dx < (h.width + 16) / 2 && dy < 24) {
            if (s.jumpOffset > 14 || s.jugaadMode === 'bus') {
              h.cleared = true;
              s.hazardsDodged += 1;
              s.floatingTexts.push({
                id: s.nextTextId++,
                x: s.playerCurrentX,
                y: s.playerY - 40,
                text: 'JUMP! 🦘',
                color: '#22c55e',
                opacity: 1,
                vy: -50,
                fontSize: 13,
              });
            } else if (s.invincibleTimer <= 0) {
              // RULE 6: Hurdles slows the player!
              // RULE 7: Time keeps on running at actual speed (no artificial time jumps).
              h.cleared = true;
              s.hurdleSlowdownTimer = 2.0; // 2 seconds of slowdown
              soundManager.playCrash();

              let hurdleText = '⚠️ HURDLE HIT! Slowed Down!';
              if (h.type === 'pothole') {
                hurdleText = '⚠️ POTHOLE! Slowed Down!';
              } else if (h.type === 'water_puddle') {
                hurdleText = '⚠️ WATER PUDDLE! Slippery Slowdown!';
              } else if (h.type === 'speed_bump') {
                hurdleText = '⚠️ SPEED BUMP! Slowed Down!';
              } else if (h.type === 'barricade') {
                hurdleText = '⚠️ BARRICADE! Tripped & Slowed!';
              }

              s.floatingTexts.push({
                id: s.nextTextId++,
                x: s.playerCurrentX,
                y: s.playerY - 30,
                text: hurdleText,
                color: '#f87171',
                opacity: 1,
                vy: -40,
                fontSize: 13,
              });
            }
          }
        }
      }

      // 5. Update Coins
      for (let i = s.coinsList.length - 1; i >= 0; i--) {
        const c = s.coinsList[i];
        c.y += roadPixelSpeed * dt;

        if (c.y > canvasHeight + 80) {
          s.coinsList.splice(i, 1);
          continue;
        }

        if (!c.collected) {
          const cx = getLaneX(c.lane);
          const dx = Math.abs(s.playerCurrentX - cx);
          const dy = Math.abs(s.playerY - c.y);

          const magnetDist = s.jugaadMode === 'cycle' ? 70 : 40;
          if (dx < magnetDist && dy < 45) {
            c.collected = true;

            if (c.type === 'coin') {
              s.coins += 1;
              s.totalCoinsEarned += 1;
              soundManager.playCoin();

              for (let p = 0; p < 4; p++) {
                s.particles.push({
                  id: s.nextParticleId++,
                  x: cx,
                  y: c.y,
                  vx: (Math.random() - 0.5) * 120,
                  vy: (Math.random() - 0.5) * 120,
                  color: '#facc15',
                  size: 2 + Math.random() * 3,
                  life: 0.35,
                  maxLife: 0.35,
                });
              }

              s.floatingTexts.push({
                id: s.nextTextId++,
                x: cx,
                y: c.y - 15,
                text: '+₹1',
                color: '#facc15',
                opacity: 1,
                vy: -45,
                fontSize: 12,
              });
            } else if (c.type === 'chai') {
              s.coins += 5;
              s.totalCoinsEarned += 5;
              s.timeRemaining += 2;
              soundManager.playCoin();
              s.floatingTexts.push({
                id: s.nextTextId++,
                x: cx,
                y: c.y - 20,
                text: '+5₹ & +2s Chai! ☕',
                color: '#fb923c',
                opacity: 1,
                vy: -50,
                fontSize: 14,
              });
            }
          }
        }
      }

      // 6. Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // 7. Update Floating Texts
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.opacity -= dt * 1.5;
        if (ft.opacity <= 0) {
          s.floatingTexts.splice(i, 1);
        }
      }

      // Sync React state for HUD
      setStats((prev) => ({
        ...prev,
        distanceCovered: Math.min(TOTAL_GOAL_DISTANCE, Math.floor(s.distanceCovered)),
        timeRemaining: s.timeRemaining,
        coins: s.coins,
        totalCoinsEarned: s.totalCoinsEarned,
        stamina: Math.round(s.stamina),
        isBoosting: s.isBoosting,
        currentLevelIndex: s.currentLevelIndex,
        jugaadsUsed: { ...s.jugaadsUsed },
        drinksCollected: { ...s.drinksCollected },
        cowsEncountered: s.cowsEncountered,
        hazardsDodged: s.hazardsDodged,
      }));
    },
    [getLevelForDistance, selectedCharacter, setStatus]
  );

  // Keyboard controls listener (including Shift / E / B for Stamina Boost)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Free continuous steering with A / D or Left / Right arrow keys
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.isMovingLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.isMovingRight = true;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        jump();
      } else if (e.key === 'Shift' || e.key === 'e' || e.key === 'E' || e.key === 'b' || e.key === 'B') {
        startBoost();
      } else if (e.key === '1') {
        activateJugaad('cycle');
      } else if (e.key === '2') {
        activateJugaad('bus');
      } else if (e.key === '3') {
        activateJugaad('chai');
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (status === 'playing') {
          setStatus('paused');
          soundManager.stopBGM();
        } else if (status === 'paused') {
          setStatus('playing');
          soundManager.startBGM();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        soundManager.toggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.isMovingLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.isMovingRight = false;
      } else if (e.key === 'Shift' || e.key === 'e' || e.key === 'E' || e.key === 'b' || e.key === 'B') {
        stopBoost();
      }
    };

    const handleBlur = () => {
      stateRef.current.isMovingLeft = false;
      stateRef.current.isMovingRight = false;
      stateRef.current.isBoosting = false;
      setIsBoosting(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [jump, startBoost, stopBoost, activateJugaad, status]);

  return {
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
  };
}
