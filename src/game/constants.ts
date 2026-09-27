import { CharacterProfile, DrinkType } from '../types/game';

export const TOTAL_GOAL_DISTANCE = 1000; // in meters (from doc)
export const INITIAL_COUNTDOWN_SECONDS = 180; // 3:00 minutes (180 seconds)

// RULE 1: Decide a default speed (12 meters/second = 43.2 km/h)
export const DEFAULT_SPEED = 12; // in m/s

// RULE 2: Calculate the distance that can be travelled in the mentioned time (180s * 12 m/s = 2160m)
export const CALCULATED_MAX_DISTANCE_IN_TIME = DEFAULT_SPEED * INITIAL_COUNTDOWN_SECONDS; // 2160 meters

// RULE 3 & 4: Default stamina is 100% = default speed. As stamina lowers, speed lowers down to default/3 (below 20%).
export const MAX_STAMINA = 100;
export const MIN_STAMINA_SPEED_FRACTION = 1 / 3; // cannot go below default speed / 3
export const STAMINA_BURN_RATE_PER_SEC = 2; // Exactly 2 stamina per second while running
export const STAMINA_BOOST_SPEED_MULTIPLIER = 1.5; // temporary speed boost while holding stamina

// RULE 5: Stamina meter vibrates at level 20% and maintains that level
export const STAMINA_VIBRATION_THRESHOLD = 20; // 20% threshold

export const LANE_COUNT = 3;
export const ROAD_WIDTH_PERCENT = 0.68; // 68% of screen width as per PDF doc (60-70%)

export const DRINKS_CONFIG: Record<
  DrinkType,
  {
    type: DrinkType;
    name: string;
    hindiTitle: string;
    staminaRestore: number;
    color: string;
    icon: string;
    rarity: 'common' | 'uncommon' | 'rare';
    celebrationText: string;
  }
> = {
  water: {
    type: 'water',
    name: 'Water Bottle',
    hindiTitle: 'Bisleri Paani',
    staminaRestore: 20,
    color: '#38bdf8',
    icon: '🥤',
    rarity: 'common',
    celebrationText: 'STAMINA +20! 🥤 Pyaas Bujhi!',
  },
  cold_drink: {
    type: 'cold_drink',
    name: 'Cold Drink',
    hindiTitle: 'Thanda Soda',
    staminaRestore: 30,
    color: '#ef4444',
    icon: '🥤',
    rarity: 'common',
    celebrationText: 'STAMINA +30! ⚡ ENERGY MIL GAYI!',
  },
  nimbu_pani: {
    type: 'nimbu_pani',
    name: 'Nimbu Pani',
    hindiTitle: 'Shikanji Fresh',
    staminaRestore: 50,
    color: '#eab308',
    icon: '🍋',
    rarity: 'uncommon',
    celebrationText: 'STAMINA +50! 🍋 NIMBU PANI POWER!',
  },
  lassi: {
    type: 'lassi',
    name: 'Malai Lassi',
    hindiTitle: 'Special Punjabi Lassi',
    staminaRestore: 70,
    color: '#f8fafc',
    icon: '🥛',
    rarity: 'rare',
    celebrationText: 'STAMINA +70! 🥛 DIL KHUSH LASSI!',
  },
};

export const JUGAAD_CONFIG = {
  cycle: {
    id: 'cycle',
    name: 'Cycle Lift Jugaad',
    cost: 15, // 15 coins street workaround
    seekDuration: 8, // 8-second time limit to catch passing cycle
    rideDuration: 12, // 12 seconds double-seat ride once hitched
    duration: 12, // ride duration
    speedMultiplier: 1.65, // faster than player run speed
    description: 'Ask passing cyclist for a lift! Catch the cycle within 8s to sit on the back carrier and cruise faster without stamina loss!',
  },
  bus: {
    id: 'bus',
    name: 'Bus Footboard Jugaad',
    cost: 35,
    seekDuration: 8,
    rideDuration: 10,
    duration: 10,
    speedMultiplier: 1.55,
    description: 'Catch rear footboard of passing city bus! Hang on the back handles and ram through traffic without burning stamina!',
  },
  chai: {
    id: 'chai',
    name: 'Cutting Chai',
    cost: 15,
    timeBonus: 15, // +15 seconds
    duration: 4,
    speedMultiplier: 1.25,
    description: 'Quick roadside tapri sip! Restores +15s exam time + energy sprint boost!',
  },
} as const;

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'raju',
    name: 'Raju (Engineer)',
    title: 'Last-Bench Jugaadu',
    avatar: '🎒',
    speedBonus: 1.0,
    cycleBonus: 1.15,
    quote: '"Bhai tension mat le, 9 baje se pehle pahuch jaunga!"',
    color: '#3b82f6',
  },
  {
    id: 'priya',
    name: 'Priya (Pre-Med)',
    title: 'Precision Sprinter',
    avatar: '👩‍⚕️',
    speedBonus: 1.1,
    cycleBonus: 1.0,
    quote: '"Practical exam 9 sharp pe hai, I cannot be late!"',
    color: '#ec4899',
  },
  {
    id: 'bunty',
    name: 'Bunty (Commerce)',
    title: 'Coin Magnet Hustler',
    avatar: '🧢',
    speedBonus: 1.05,
    cycleBonus: 1.05,
    quote: '"Raste me kitne bhi auto ho, short-cut apna fix hai!"',
    color: '#10b981',
  },
];

export interface LevelConfig {
  levelNumber: number; // 1 to 10
  minDist: number;
  maxDist: number;
  name: string;
  sub: string;
  themeColor: string;
  trafficFrequency: number;
  trafficSpeedMin: number;
  trafficSpeedMax: number;
  cowProbability: number; // roadside / crossing cow spawn probability
  drinkSpawnInterval: number; // seconds between drinks
  preferredDrinks: DrinkType[];
  hazardProbability: number;
  shops: Array<{
    name: string;
    subtitle?: string;
    color: string;
    type: 'shop' | 'chai_stall' | 'billboard' | 'atm' | 'bus_stop' | 'temple' | 'sabzi_stall';
  }>;
}

// 10 Distinct Levels (0 to 1,000m total - 100m per level)
export const LEVELS: LevelConfig[] = [
  {
    levelNumber: 1,
    minDist: 0,
    maxDist: 100,
    name: 'Level 1: Mohalla',
    sub: 'Colony Street • Cows near houses, light traffic (0 - 100m)',
    themeColor: '#3b82f6',
    trafficFrequency: 1.8,
    trafficSpeedMin: 110,
    trafficSpeedMax: 180,
    cowProbability: 0.5,
    drinkSpawnInterval: 4.5,
    preferredDrinks: ['water', 'water', 'cold_drink'],
    hazardProbability: 0.1,
    shops: [
      { name: 'SHARMA NIWAS', subtitle: 'Colony House 42', color: '#0284c7', type: 'shop' },
      { name: 'CHAI TAPRI', subtitle: 'Garam Elaichi Chai', color: '#b45309', type: 'chai_stall' },
      { name: 'TEMPLE GATE', subtitle: 'Jai Shree Ram', color: '#ea580c', type: 'temple' },
      { name: 'COLONY GATE 1', subtitle: 'Speed Limit 15 km/h', color: '#16a34a', type: 'billboard' },
    ],
  },
  {
    levelNumber: 2,
    minDist: 100,
    maxDist: 200,
    name: 'Level 2: Sabzi Market',
    sub: 'Cows near vegetable stalls, cold drinks & water (100 - 200m)',
    themeColor: '#10b981',
    trafficFrequency: 1.5,
    trafficSpeedMin: 130,
    trafficSpeedMax: 210,
    cowProbability: 0.7,
    drinkSpawnInterval: 5.0,
    preferredDrinks: ['cold_drink', 'water', 'nimbu_pani'],
    hazardProbability: 0.18,
    shops: [
      { name: 'APNA SABZI MANDI', subtitle: 'Fresh Palak & Tomato', color: '#15803d', type: 'sabzi_stall' },
      { name: 'GUPTA FRUITS', subtitle: 'Kele Aur Santre', color: '#ca8a04', type: 'sabzi_stall' },
      { name: 'SHIV TEMPLE', subtitle: 'Ghanti Aur Prasad', color: '#f97316', type: 'temple' },
      { name: 'JUICE CORNER', subtitle: 'Mausambi & Nimbu', color: '#eab308', type: 'shop' },
    ],
  },
  {
    levelNumber: 3,
    minDist: 200,
    maxDist: 300,
    name: 'Level 3: Bus Stop',
    sub: 'Cows near roadside stalls, Nimbu Pani pickup (200 - 300m)',
    themeColor: '#f59e0b',
    trafficFrequency: 1.3,
    trafficSpeedMin: 150,
    trafficSpeedMax: 240,
    cowProbability: 0.55,
    drinkSpawnInterval: 5.2,
    preferredDrinks: ['nimbu_pani', 'cold_drink', 'water'],
    hazardProbability: 0.22,
    shops: [
      { name: 'CITY BUS STOP 4', subtitle: 'Buses to SGSU Campus', color: '#2563eb', type: 'bus_stop' },
      { name: 'CHAI & BUN MASKA', subtitle: 'Dream Big Tea Point', color: '#c2410c', type: 'chai_stall' },
      { name: 'AUTO STAND', subtitle: 'Direct To College', color: '#16a34a', type: 'shop' },
      { name: 'ATM 24x7', subtitle: 'SBI Cash Machine', color: '#1d4ed8', type: 'atm' },
    ],
  },
  {
    levelNumber: 4,
    minDist: 300,
    maxDist: 400,
    name: 'Level 4: School Road',
    sub: 'Side street cows, school buses & bicycles (300 - 400m)',
    themeColor: '#06b6d4',
    trafficFrequency: 1.2,
    trafficSpeedMin: 160,
    trafficSpeedMax: 250,
    cowProbability: 0.45,
    drinkSpawnInterval: 5.5,
    preferredDrinks: ['water', 'cold_drink', 'lassi'],
    hazardProbability: 0.25,
    shops: [
      { name: 'PUBLIC SCHOOL GATE', subtitle: 'Caution Children Crossing', color: '#eab308', type: 'billboard' },
      { name: 'STATIONERY HUB', subtitle: 'Pens, Files & Books', color: '#7c3aed', type: 'shop' },
      { name: 'CYCLE REPAIR', subtitle: 'Hawa & Puncture', color: '#475569', type: 'shop' },
      { name: 'SWEET CORNER', subtitle: 'Hot Jalebi', color: '#dc2626', type: 'shop' },
    ],
  },
  {
    levelNumber: 5,
    minDist: 400,
    maxDist: 500,
    name: 'Level 5: Rainy Street',
    sub: 'Cows under shop sheds, puddles & slippery turns (400 - 500m)',
    themeColor: '#38bdf8',
    trafficFrequency: 1.15,
    trafficSpeedMin: 170,
    trafficSpeedMax: 260,
    cowProbability: 0.6,
    drinkSpawnInterval: 5.2,
    preferredDrinks: ['nimbu_pani', 'water'],
    hazardProbability: 0.35,
    shops: [
      { name: 'WATER LOGGING AHEAD', subtitle: 'Drive Carefully', color: '#0284c7', type: 'billboard' },
      { name: 'POOJA SWEETS', subtitle: 'Rain Special Pakode', color: '#dc2626', type: 'shop' },
      { name: 'XEROX & PRINT', subtitle: 'Scan & Lamination', color: '#ca8a04', type: 'shop' },
      { name: 'CHAI TAPRI', subtitle: 'Adrak Special Chai', color: '#b45309', type: 'chai_stall' },
    ],
  },
  {
    levelNumber: 6,
    minDist: 500,
    maxDist: 600,
    name: 'Level 6: Main Market',
    sub: 'Roadside cows, drinks placed in risky routes (500 - 600m)',
    themeColor: '#f97316',
    trafficFrequency: 1.05,
    trafficSpeedMin: 180,
    trafficSpeedMax: 280,
    cowProbability: 0.65,
    drinkSpawnInterval: 5.8,
    preferredDrinks: ['cold_drink', 'nimbu_pani', 'lassi'],
    hazardProbability: 0.3,
    shops: [
      { name: 'CENTRAL BAZAAR', subtitle: 'Heavy Traffic Zone', color: '#c2410c', type: 'billboard' },
      { name: 'PUNJABI LASSI HOUSE', subtitle: 'Thandi Malai Lassi', color: '#f8fafc', type: 'shop' },
      { name: 'ROYAL ELECTRONICS', subtitle: 'Mobile & Recharge', color: '#2563eb', type: 'shop' },
      { name: 'SABZI MANDI 2', subtitle: 'Cows & Vendors', color: '#15803d', type: 'sabzi_stall' },
    ],
  },
  {
    levelNumber: 7,
    minDist: 600,
    maxDist: 700,
    name: 'Level 7: Traffic Signal',
    sub: 'Cows near junction sides, drink pickup after signal (600 - 700m)',
    themeColor: '#ef4444',
    trafficFrequency: 0.95,
    trafficSpeedMin: 200,
    trafficSpeedMax: 310,
    cowProbability: 0.5,
    drinkSpawnInterval: 6.0,
    preferredDrinks: ['cold_drink', 'nimbu_pani'],
    hazardProbability: 0.35,
    shops: [
      { name: 'MAJOR CHOWK SIGNAL', subtitle: 'Red Light Surveillance', color: '#dc2626', type: 'billboard' },
      { name: 'PETROL PUMP', subtitle: '24 Hours Open', color: '#ca8a04', type: 'shop' },
      { name: 'FAST TRACK AUTO', subtitle: 'Bypass Traffic', color: '#16a34a', type: 'shop' },
      { name: 'METRO PILLAR 108', subtitle: 'Keep Left', color: '#475569', type: 'billboard' },
    ],
  },
  {
    levelNumber: 8,
    minDist: 700,
    maxDist: 800,
    name: 'Level 8: Flyover Speedway',
    sub: 'High vehicle speed, drink before difficult section (700 - 800m)',
    themeColor: '#8b5cf6',
    trafficFrequency: 0.85,
    trafficSpeedMin: 220,
    trafficSpeedMax: 330,
    cowProbability: 0.25, // very few cows on flyover
    drinkSpawnInterval: 6.2,
    preferredDrinks: ['water', 'cold_drink', 'lassi'],
    hazardProbability: 0.38,
    shops: [
      { name: 'EXPRESS FLYOVER', subtitle: 'Direct To SGSU Highway', color: '#7c3aed', type: 'billboard' },
      { name: 'EMERGENCY BAY', subtitle: 'No Parking', color: '#b91c1c', type: 'billboard' },
      { name: 'SPEED RADAR', subtitle: 'Limit 40 km/h', color: '#1d4ed8', type: 'billboard' },
      { name: 'CAMPUS 200M', subtitle: 'Take Next Left Exit', color: '#15803d', type: 'billboard' },
    ],
  },
  {
    levelNumber: 9,
    minDist: 800,
    maxDist: 900,
    name: 'Level 9: Peak Hour Rush',
    sub: 'Dense rush hour traffic, rare drink pickups (800 - 900m)',
    themeColor: '#e11d48',
    trafficFrequency: 0.75,
    trafficSpeedMin: 240,
    trafficSpeedMax: 350,
    cowProbability: 0.4,
    drinkSpawnInterval: 7.0, // rare drink pickup
    preferredDrinks: ['water', 'nimbu_pani'],
    hazardProbability: 0.42,
    shops: [
      { name: 'EXAM RUSH HOUR', subtitle: 'All Routes Packed', color: '#be123c', type: 'billboard' },
      { name: 'COLLEGE ROAD JUNCTION', subtitle: 'SGSU Warrior Campus', color: '#1e40af', type: 'billboard' },
      { name: 'CHAI POINT EXPRESS', subtitle: 'Last Minute Energy', color: '#c2410c', type: 'chai_stall' },
      { name: 'AMBULANCE BAY', subtitle: 'Give Way', color: '#dc2626', type: 'billboard' },
    ],
  },
  {
    levelNumber: 10,
    minDist: 900,
    maxDist: 1000,
    name: 'Level 10: Final College Run',
    sub: 'Ultimate challenge! Final drink before College Gate (900 - 1000m)',
    themeColor: '#d946ef',
    trafficFrequency: 0.7,
    trafficSpeedMin: 250,
    trafficSpeedMax: 370,
    cowProbability: 0.45,
    drinkSpawnInterval: 4.8, // guaranteed final drink before gate
    preferredDrinks: ['lassi', 'nimbu_pani', 'cold_drink'],
    hazardProbability: 0.4,
    shops: [
      { name: 'SGSU MAIN GATE 50M', subtitle: 'Gate Closes at 9:00 AM', color: '#4338ca', type: 'billboard' },
      { name: 'STUDENT XEROX', subtitle: 'Hall Ticket Print', color: '#ca8a04', type: 'shop' },
      { name: 'CAMPUS ENTRY NO. 1', subtitle: 'Hall Tickets Ready', color: '#16a34a', type: 'billboard' },
      { name: 'COLLEGE AUDITORIUM', subtitle: 'Welcome Aspirants', color: '#7c3aed', type: 'shop' },
    ],
  },
];
