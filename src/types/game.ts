export type Lane = 0 | 1 | 2; // 0 = Left, 1 = Center, 2 = Right

export type JugaadMode = 'none' | 'cycle_seeking' | 'cycle' | 'bus_seeking' | 'bus' | 'chai';

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

export type DrinkType = 'water' | 'cold_drink' | 'nimbu_pani' | 'lassi';

export interface Vehicle {
  id: number;
  lane: Lane;
  targetLane: Lane;
  laneChangeProgress: number; // 0 to 1
  x?: number;
  y: number; // distance along visible road (pixels from top or world units)
  speed: number; // pixels per second
  width: number;
  length: number;
  type: 'auto' | 'car_red' | 'car_blue' | 'bus_yellow' | 'bus_city' | 'scooter' | 'tempo' | 'cycle';
  label?: string;
  isHit?: boolean;
  hitVelocityX?: number;
  hitVelocityY?: number;
  hitRotation?: number;
  isLiftAvailable?: boolean;
  hasPlayerBoarded?: boolean;
  isWrongSide?: boolean; // Coming head-on in the lane (Indian wrong-side driving hazard)
  wrongSideWarned?: boolean;
}

export interface GroundHazard {
  id: number;
  lane: Lane;
  y: number;
  type: 'pothole' | 'water_puddle' | 'barricade' | 'speed_bump';
  width: number;
  length: number;
  cleared?: boolean;
}

export interface CoinItem {
  id: number;
  lane: Lane;
  y: number;
  type: 'coin' | 'chai' | 'clock';
  value: number;
  collected?: boolean;
}

export interface DrinkPickup {
  id: number;
  lane: Lane;
  y: number;
  type: DrinkType;
  name: string;
  staminaRestore: number;
  color: string;
  collected?: boolean;
}

export interface CowObstacle {
  id: number;
  side: 'left_side' | 'right_side' | 'road';
  lane?: Lane;
  x: number;
  y: number;
  targetX?: number;
  vx: number;
  isMoving: boolean;
  crossingLane: boolean;
  width: number;
  height: number;
  colorType: 'white' | 'brown' | 'spotted';
  hasStumbled?: boolean;
  tailWag: number;
  mooCooldown?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  vy: number;
  fontSize?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export type RoadsidePropType =
  | 'cafe'
  | 'stationery_shop'
  | 'general_store'
  | 'bus_stop'
  | 'brick_wall'
  | 'building_residential'
  | 'shop_awning'
  | 'street_sign'
  | 'dustbin'
  | 'potted_plants'
  | 'bushes'
  | 'tree_small'
  | 'bicycle_parking'
  | 'electric_pole'
  | 'roadside_bench'
  | 'ad_board'
  | 'sabzi_stall'
  | 'flyover_pillar'
  | 'shop'
  | 'tree'
  | 'chai_stall'
  | 'billboard'
  | 'atm'
  | 'temple';

export interface RoadsideProp {
  id: number;
  side: 'left' | 'right';
  y: number;
  type: RoadsidePropType;
  name: string;
  subtitle?: string;
  color: string;
  width: number;
  height: number;
  depth?: 'front' | 'back';
  offsetX?: number;
  variant?: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  speedBonus: number;
  cycleBonus: number;
  quote: string;
  color: string;
}

export interface GameStats {
  distanceCovered: number; // 0 to 1000m
  timeRemaining: number; // in seconds (starts at 180s = 3 mins)
  coins: number;
  totalCoinsEarned: number;
  stamina: number; // 0 to 100 (starts at 100, NO auto-regen)
  isBoosting: boolean;
  currentLevelIndex: number; // 0 to 9 (Levels 1 to 10)
  jugaadsUsed: {
    cycle: number;
    bus: number;
    chai: number;
  };
  drinksCollected: {
    water: number;
    cold_drink: number;
    nimbu_pani: number;
    lassi: number;
  };
  cowsEncountered: number;
  hazardsDodged: number;
  wrongSideDodged?: number;
  startTime: number;
  finishTime?: number;
  failureReason?: 'collision' | 'timeout';
}

export interface HighScoreRecord {
  characterName: string;
  won: boolean;
  distance: number;
  timeRemaining: number;
  coins: number;
  grade: string;
  date: string;
}
