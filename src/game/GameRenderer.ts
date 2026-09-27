import {
  Vehicle,
  GroundHazard,
  CoinItem,
  DrinkPickup,
  CowObstacle,
  FloatingText,
  Particle,
  RoadsideProp,
  JugaadMode,
  Lane,
} from '../types/game';
import { TOTAL_GOAL_DISTANCE } from './constants';

export interface RendererState {
  playerLane: Lane;
  playerCurrentX: number; // smoothed x
  playerY: number; // vertical position
  isJumping: boolean;
  jumpOffset: number; // pixels in air
  jugaadMode: JugaadMode;
  jugaadTimeRemaining: number;
  stamina: number;
  isBoosting: boolean;
  vehicles: Vehicle[];
  hazards: GroundHazard[];
  coins: CoinItem[];
  drinks: DrinkPickup[];
  cows: CowObstacle[];
  floatingTexts: FloatingText[];
  particles: Particle[];
  roadsideProps: RoadsideProp[];
  roadScrollY: number;
  distanceCovered: number;
  currentLevelIndex?: number;
  characterColor: string;
  gameTime: number;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private cameraOffsetX: number = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  // WIDE CAMERA VIEW:
  // Road covers ~54% of screen center, giving ample 80+ px per lane for clear reaction time
  // Left and Right sidewalk environment zones get ~23% EACH for spacious 2.5D shops, trees, cafes, bus stops
  public getRoadMetrics() {
    const roadRatio = 0.54;
    const roadWidth = Math.round(this.width * roadRatio);
    const roadLeft = Math.round((this.width - roadWidth) / 2);
    const roadRight = roadLeft + roadWidth;
    const laneWidth = roadWidth / 3;

    return {
      roadWidth,
      roadLeft,
      roadRight,
      laneWidth,
      sidewalkWidth: roadLeft,
      getLaneCenterX: (lane: Lane) => roadLeft + laneWidth * (lane + 0.5),
    };
  }

  public render(state: RendererState) {
    const ctx = this.ctx;
    const { width, height } = this;
    const { roadLeft, roadRight, roadWidth, laneWidth, sidewalkWidth, getLaneCenterX } =
      this.getRoadMetrics();

    // Smooth horizontal camera follow (subtle 10-12% damping, no harsh shake)
    const centerX = width / 2;
    const targetOffsetX = (state.playerCurrentX - centerX) * 0.12;
    this.cameraOffsetX += (targetOffsetX - this.cameraOffsetX) * 0.08;

    ctx.save();
    // Apply smooth camera horizontal follow
    ctx.translate(-this.cameraOffsetX, 0);

    // Clear visible viewport + extra horizontal margin for smooth camera sway
    ctx.clearRect(-60, 0, width + 120, height);

    // 1. Draw Sidewalks & Environment
    this.drawEnvironment(state, sidewalkWidth, roadRight);

    // 2. Draw Asphalt Road
    ctx.fillStyle = '#2b2d38';
    ctx.fillRect(roadLeft, 0, roadWidth, height);

    // Road Curbs
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(roadLeft - 6, 0, 6, height);
    ctx.fillRect(roadRight, 0, 6, height);

    // Curb Hazard Stripes
    const curbStripeOffset = (state.roadScrollY * 0.8) % 40;
    ctx.fillStyle = '#eab308';
    for (let y = -40 + curbStripeOffset; y < height; y += 40) {
      ctx.fillRect(roadLeft - 6, y, 6, 20);
      ctx.fillRect(roadRight, y, 6, 20);
    }

    // 3. Lane Dividers (Dashed lines)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([25, 25]);
    ctx.lineDashOffset = -state.roadScrollY;

    // Line 1: between Lane 0 and 1
    ctx.beginPath();
    ctx.moveTo(roadLeft + laneWidth, 0);
    ctx.lineTo(roadLeft + laneWidth, height);
    ctx.stroke();

    // Line 2: between Lane 1 and 2
    ctx.beginPath();
    ctx.moveTo(roadLeft + laneWidth * 2, 0);
    ctx.lineTo(roadLeft + laneWidth * 2, height);
    ctx.stroke();

    ctx.setLineDash([]); // reset dash

    // 4. Draw Roadside Props (Shops, temples, sabzi stalls, signs)
    this.drawRoadsideProps(state, roadLeft, roadRight, sidewalkWidth);

    // 5. Draw Ground Hazards (Potholes, puddles, speed bumps)
    this.drawHazards(state, getLaneCenterX, laneWidth);

    // 6. Draw Collectible Coins
    this.drawCollectibles(state, getLaneCenterX);

    // 7. Draw Drink Pickups (Water, Cold Drink, Nimbu Pani, Lassi)
    this.drawDrinks(state, getLaneCenterX);

    // 8. Draw Vehicles
    this.drawVehicles(state, getLaneCenterX);

    // 9. Draw Indian Cows (Roadside and crossing)
    this.drawCows(state);

    // 10. Draw Player
    this.drawPlayer(state);

    // 11. Draw particles
    this.drawParticles(state);

    // 12. Draw floating texts
    this.drawFloatingTexts(state);

    // 13. Draw speed lines if Cycle, Bus Jugaad, or Stamina Boost active
    if (state.jugaadMode !== 'none' || state.isBoosting) {
      this.drawSpeedLines(state);
    }

    // 14. Draw College Finish Line if approaching 1,000m
    if (state.distanceCovered >= 950) {
      this.drawFinishGate(state, roadLeft, roadWidth);
    }

    // 15. Subtle 2.5D Atmospheric Depth Horizon at top of view
    const horizonGradient = ctx.createLinearGradient(0, 0, 0, 75);
    horizonGradient.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
    horizonGradient.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
    ctx.fillStyle = horizonGradient;
    ctx.fillRect(-60, 0, width + 120, 75);

    ctx.restore();
  }

  private drawEnvironment(state: RendererState, sidewalkLeftWidth: number, roadRightX: number) {
    const ctx = this.ctx;
    const height = this.height;
    const width = this.width;
    const isRainy = state.currentLevelIndex === 4;
    const isCollegeRoad = state.currentLevelIndex === 9;

    // 1. Sidewalk Ground Base (Warm earthy Indian paving or clean college campus stone)
    const baseColor = isRainy
      ? '#94a3b8' // darker wet concrete
      : isCollegeRoad
      ? '#fed7aa' // clean warm sandstone
      : '#e2e8f0'; // light street stone

    ctx.fillStyle = baseColor;
    ctx.fillRect(-60, 0, sidewalkLeftWidth + 60, height);
    ctx.fillRect(roadRightX, 0, width - roadRightX + 60, height);

    // 2. Interlocking Paving Block Pattern
    ctx.strokeStyle = isRainy ? 'rgba(71, 85, 105, 0.4)' : 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    const tileOffsetY = (state.roadScrollY * 0.75) % 40;

    for (let y = -40 + tileOffsetY; y < height; y += 40) {
      // Horizontal paver joints
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(sidewalkLeftWidth, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(roadRightX, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Staggered vertical paver joints
      const stagger = Math.floor(y / 40) % 2 === 0 ? 0 : 20;
      for (let x = stagger; x < sidewalkLeftWidth; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 40);
        ctx.stroke();
      }
      for (let x = roadRightX + stagger; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 40);
        ctx.stroke();
      }
    }

    // 3. Tactile Corduroy Warning Strip (Yellow embossed strip along road curbs)
    const tactileW = 6;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(sidewalkLeftWidth - tactileW - 6, 0, tactileW, height);
    ctx.fillRect(roadRightX + 6, 0, tactileW, height);

    // 4. Rainy Wet Reflections & Puddle Spots (Level 5)
    if (isRainy) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      const puddleOffset = (state.roadScrollY * 0.5) % 200;
      for (let py = -200 + puddleOffset; py < height; py += 180) {
        ctx.beginPath();
        ctx.ellipse(sidewalkLeftWidth * 0.45, py, 24, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(roadRightX + (width - roadRightX) * 0.55, py + 90, 26, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // --- 2.5D ISOMETRIC CARTOON ROADSIDE ENVIRONMENT PROPS ---
  private drawRoadsideProps(
    state: RendererState,
    roadLeft: number,
    roadRight: number,
    sidewalkWidth: number
  ) {
    const ctx = this.ctx;

    for (const prop of state.roadsideProps) {
      if (prop.y < -160 || prop.y > this.height + 160) continue;

      const isLeft = prop.side === 'left';
      // Responsive bounded width that stays strictly within the sidewalk zone
      const availableW = Math.max(46, Math.min(prop.width, sidewalkWidth - 12));

      // Placement strictly outside the 3 playable lanes:
      // Left side: placed between 4px and roadLeft - 8px
      // Right side: placed starting at roadRight + 8px
      const x = isLeft
        ? Math.max(4, roadLeft - 8 - availableW - (prop.offsetX || 0))
        : roadRight + 8 + (prop.offsetX || 0);

      ctx.save();
      ctx.translate(x, prop.y);

      switch (prop.type) {
        case 'cafe':
        case 'chai_stall':
          this.drawCafe(ctx, availableW, prop.height, prop);
          break;
        case 'stationery_shop':
          this.drawStationeryShop(ctx, availableW, prop.height, prop);
          break;
        case 'general_store':
          this.drawGeneralStore(ctx, availableW, prop.height, prop);
          break;
        case 'bus_stop':
          this.drawBusStopShelter(ctx, availableW, prop.height, prop);
          break;
        case 'brick_wall':
          this.drawBrickWall(ctx, availableW, prop.height, prop);
          break;
        case 'building_residential':
          this.drawResidentialBuilding(ctx, availableW, prop.height, prop);
          break;
        case 'shop_awning':
        case 'shop':
          this.drawShopWithAwning(ctx, availableW, prop.height, prop);
          break;
        case 'street_sign':
          this.drawStreetSign(ctx, availableW, prop.height, prop);
          break;
        case 'dustbin':
          this.drawDustbin(ctx, availableW, prop.height, prop);
          break;
        case 'potted_plants':
          this.drawPottedPlants(ctx, availableW, prop.height, prop);
          break;
        case 'bushes':
          this.drawBushes(ctx, availableW, prop.height, prop);
          break;
        case 'tree_small':
        case 'tree':
          this.drawTreeSmall(ctx, availableW, prop.height, prop);
          break;
        case 'bicycle_parking':
          this.drawBicycleParking(ctx, availableW, prop.height, prop);
          break;
        case 'electric_pole':
          this.drawElectricPole(ctx, availableW, prop.height, prop, isLeft);
          break;
        case 'roadside_bench':
          this.drawRoadsideBench(ctx, availableW, prop.height, prop);
          break;
        case 'ad_board':
        case 'billboard':
          this.drawAdvertisementBoard(ctx, availableW, prop.height, prop);
          break;
        case 'sabzi_stall':
          this.drawSabziStall(ctx, availableW, prop.height, prop);
          break;
        case 'flyover_pillar':
          this.drawFlyoverPillar(ctx, availableW, prop.height, prop);
          break;
        default:
          this.drawShopWithAwning(ctx, availableW, prop.height, prop);
          break;
      }

      ctx.restore();
    }
  }

  // 1. Small Indian Café / Chai Tapri
  private drawCafe(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 2, h + 4, w / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2.5D Isometric Main Building Base
    ctx.fillStyle = '#fef3c7'; // Warm ivory stucco
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(0, 10, w, h - 10, 4);
    ctx.fill();
    ctx.stroke();

    // Isometric 3D Side Depth Shading
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(w - 6, 11, 5, h - 12);

    // Colorful Striped Fabric Awning (Red & White or Orange & Yellow)
    const awningColor = prop.color || '#ea580c';
    const awningH = 22;
    ctx.fillStyle = awningColor;
    ctx.beginPath();
    ctx.roundRect(0, 8, w, awningH, [4, 4, 0, 0]);
    ctx.fill();

    // Awning stripes
    const stripeW = w / 5;
    for (let i = 0; i < 5; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i * stripeW, 8, stripeW, awningH);
      }
    }

    // Scalloped awning bottom edge
    ctx.fillStyle = awningColor;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(i * stripeW + stripeW / 2, 8 + awningH, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Overhead Cafe Signboard with Clean Outline
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(2, -6, w - 4, 16, 3);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☕ ' + prop.name.slice(0, 14), w / 2, 5);

    // Wooden Counter Window with Chai Kettle & Glasses
    ctx.fillStyle = '#78350f';
    ctx.fillRect(6, 42, w - 12, 18);

    // Brass Tea Kettle (Chai ki Ketli)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(14, 46, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(17, 44, 4, 2); // spout

    // Glass cutting chai glasses on counter
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(25, 43, 3, 5);
    ctx.fillRect(30, 43, 3, 5);
    ctx.fillRect(35, 43, 3, 5);

    // Steam wisps
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14, 40);
    ctx.quadraticCurveTo(12, 36, 15, 33);
    ctx.stroke();
  }

  // 2. Small Stationery Shop ("STUDENT XEROX & BOOKS")
  private drawStationeryShop(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 2, h + 4, w / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shop Body
    ctx.fillStyle = '#f0f9ff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(0, 10, w, h - 10, 4);
    ctx.fill();
    ctx.stroke();

    // Cyan / Royal Blue Signboard
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(2, -6, w - 4, 18, 3);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(2, -6, w - 4, 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📚 ' + prop.name.slice(0, 14), w / 2, 6);

    // Display Window with Stacked Notebooks & Pens
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(6, 20, w - 12, 30);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 20, w - 12, 30);

    // Stacked colorful exam notebooks
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(10, 38 - i * 5, 16, 4);
    }

    // Pen Stand
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w - 22, 36, 12, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(w - 20, 28, 2, 8);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(w - 16, 26, 2, 10);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(w - 13, 29, 2, 7);

    // Bottom Shutter & "XEROX ₹2" Banner
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(6, 54, w - 12, h - 56);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('XEROX & PRINT', w / 2, 65);
  }

  // 3. Small General Store (Kirana / Provision Store)
  private drawGeneralStore(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 2, h + 4, w / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Building
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(0, 8, w, h - 8, 4);
    ctx.fill();
    ctx.stroke();

    // Red & Yellow Awning
    const awningW = w / 4;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#facc15';
      ctx.fillRect(i * awningW, 8, awningW, 16);
    }

    // Signboard
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(2, -6, w - 4, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 ' + prop.name.slice(0, 14), w / 2, 5);

    // Hanging Chips / Snack Packets strung across the shopfront
    const packetColors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = packetColors[i];
      ctx.fillRect(6 + i * (w - 18) / 3, 26, 6, 9);
      // Clip wire
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(6 + i * (w - 18) / 3 + 3, 24);
      ctx.lineTo(6 + i * (w - 18) / 3 + 3, 26);
      ctx.stroke();
    }

    // Wooden Counter with Jars & Bottles
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 46, w - 8, h - 48);

    // Candy jars on counter
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(8, 40, 8, 8);
    ctx.fillRect(18, 40, 8, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 43, 4, 4); // red candy
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(20, 43, 4, 4); // green candy
  }

  // 4. Bus Stop Shelter ("DTC / CITY BUS STAND")
  private drawBusStopShelter(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 2, h + 2, w / 2 + 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Steel Vertical Support Posts
    ctx.fillStyle = '#475569';
    ctx.fillRect(6, 6, 4, h - 8);
    ctx.fillRect(w - 10, 6, 4, h - 8);

    // Curved Modern Translucent Blue Acrylic Canopy Roof
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, 14, [6, 6, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Canopy highlight
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, 2, w - 8, 3);

    // Route Sign on Canopy
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚏 ROUTE 108: COLLEGE', w / 2, 10);

    // Back Glass Panel with Timetable Chart & Posters
    ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(8, 16, w - 16, h - 32, 2);
    ctx.fill();
    ctx.stroke();

    // Route map poster
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 20, 16, 12);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(14, 22, 12, 2);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(14, 26, 10, 2);

    // Commuter Waiting Bench underneath
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, h - 18, w - 20, 5); // seat
    ctx.fillStyle = '#64748b';
    ctx.fillRect(14, h - 13, 3, 9); // left leg
    ctx.fillRect(w - 17, h - 13, 3, 9); // right leg
  }

  // 5. Brick Boundary Wall
  private drawBrickWall(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 2, h + 2, w / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta Brick Wall Base
    ctx.fillStyle = '#9a3412';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(0, 8, w, h - 8, 2);
    ctx.fill();
    ctx.stroke();

    // Mortar horizontal courses & vertical brick joints
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.35)';
    ctx.lineWidth = 1;
    const courseH = 8;
    for (let y = 14; y < h; y += courseH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // White Concrete Coping Cap on top
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-2, 4, w + 4, 6, 2);
    ctx.fill();
    ctx.stroke();

    // Wall Poster ("SHIKSHA ABHIYAN" / "TUITION")
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(w / 2 - 14, 18, 28, 16);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PADHO BHARAT', w / 2, 26);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '5px sans-serif';
    ctx.fillText('Tuition ₹500', w / 2, 32);

    // Creeping Green Ivy / Vine hanging over the wall
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(6, 6, 5, 0, Math.PI * 2);
    ctx.arc(11, 10, 4, 0, Math.PI * 2);
    ctx.arc(w - 8, 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Small Residential Building (Mohalla Ghar)
  private drawResidentialBuilding(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 3, h + 4, w / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2.5D Isometric 2-Floor Building Facade
    const wallColor = prop.color || '#fed7aa';
    ctx.fillStyle = wallColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(0, 12, w, h - 12, 4);
    ctx.fill();
    ctx.stroke();

    // 2.5D Shaded Side Plane
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(w - 7, 13, 6, h - 14);

    // Terracotta Sloped Eave Tile Roof
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-3, 6, w + 6, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Rooftop Sintex Black Water Tank (Every Indian rooftop has one!)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(w - 18, -4, 12, 11, 2);
    ctx.fill();
    // Tank white stripes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(w - 17, -2, 10, 4);

    // Floor 2 Window with Chhajja (Sunshade)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(8, 22, 14, 14);
    ctx.fillStyle = '#94a3b8'; // Sunshade
    ctx.fillRect(6, 19, 18, 3);

    // Floor 2 Balcony Railing
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 33, 18, 5);

    // Floor 1 Main Door with Wooden Panels
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 8, h - 28, 16, 28, [3, 3, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Brass Doorknob
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(w / 2 + 4, h - 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Shop with Colorful Awning
  private drawShopWithAwning(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 2, h + 4, w / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Building
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(0, 8, w, h - 8, 4);
    ctx.fill();
    ctx.stroke();

    // Bold Top Signboard
    ctx.fillStyle = prop.color || '#dc2626';
    ctx.beginPath();
    ctx.roundRect(2, -6, w - 4, 16, 3);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(2, -6, w - 4, 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(prop.name.slice(0, 14), w / 2, 5);

    // Vibrant Scalloped Awning
    const awningH = 20;
    const stripeW = w / 4;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? (prop.color || '#dc2626') : '#f8fafc';
      ctx.fillRect(i * stripeW, 10, stripeW, awningH);

      // Scalloped flap
      ctx.beginPath();
      ctx.arc(i * stripeW + stripeW / 2, 10 + awningH, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Glass Display Showroom with Warm Illumination
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(6, 38, w - 12, h - 42);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 38, w - 12, h - 42);

    if (prop.subtitle) {
      ctx.fillStyle = '#64748b';
      ctx.font = '6.5px sans-serif';
      ctx.fillText(prop.subtitle.slice(0, 15), w / 2, 52);
    }
  }

  // 8. Street Sign (Directional / Traffic warning)
  private drawStreetSign(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Galvanized Steel Pole
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(w / 2 - 2, 12, 4, h - 12);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(w / 2 - 2, 12, 4, h - 12);

    // Circular Base Flange
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 2, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Green / Yellow Sign Board
    const isSchool = prop.name.includes('SCHOOL');
    const boardBg = isSchool ? '#facc15' : '#15803d';
    const textColor = isSchool ? '#0f172a' : '#ffffff';

    ctx.fillStyle = boardBg;
    ctx.beginPath();
    ctx.roundRect(w / 2 - 22, 2, 44, 22, 3);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(w / 2 - 20, 4, 40, 18);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(prop.name.slice(0, 13), w / 2, 13);
    if (prop.subtitle) {
      ctx.font = '5px sans-serif';
      ctx.fillText(prop.subtitle.slice(0, 14), w / 2, 19);
    }
  }

  // 9. Dustbin (Swachh Bharat Segregated Bins)
  private drawDustbin(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Steel Stand Pole
    ctx.fillStyle = '#334155';
    ctx.fillRect(w / 2 - 1.5, 8, 3, h - 8);

    // Twin Bins (Green = Wet, Blue = Dry)
    const binW = 12;
    const binH = 18;

    // Green Wet Bin (Left)
    ctx.fillStyle = '#16a34a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(w / 2 - binW - 2, 12, binW, binH, 2);
    ctx.fill();
    ctx.stroke();

    // Blue Dry Bin (Right)
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(w / 2 + 2, 12, binW, binH, 2);
    ctx.fill();
    ctx.stroke();

    // Swachh Bharat Clean Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WET', w / 2 - 8, 23);
    ctx.fillText('DRY', w / 2 + 8, 23);
  }

  // 10. Potted Plants (Earthenware Gamla with Flowering Plants)
  private drawPottedPlants(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta Pot (Gamla)
    ctx.fillStyle = '#ea580c';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, h - 14);
    ctx.lineTo(w / 2 + 10, h - 14);
    ctx.lineTo(w / 2 + 7, h - 2);
    ctx.lineTo(w / 2 - 7, h - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pot Rim
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(w / 2 - 11, h - 16, 22, 3);
    ctx.strokeRect(w / 2 - 11, h - 16, 22, 3);

    // Lush Palm / Fern Foliage
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(w / 2 - 5, h - 22, 7, 0, Math.PI * 2);
    ctx.arc(w / 2 + 5, h - 22, 7, 0, Math.PI * 2);
    ctx.arc(w / 2, h - 26, 8, 0, Math.PI * 2);
    ctx.fill();

    // Blooming Orange Marigold Flowers
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(w / 2 - 4, h - 25, 2.5, 0, Math.PI * 2);
    ctx.arc(w / 2 + 4, h - 23, 2.5, 0, Math.PI * 2);
    ctx.arc(w / 2, h - 28, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 11. Bushes / Hedges
  private drawBushes(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h, w / 2 - 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layered Organic Foliage Puffs
    ctx.fillStyle = '#14532d'; // Dark base
    ctx.beginPath();
    ctx.arc(w / 2 - 8, h - 10, 11, 0, Math.PI * 2);
    ctx.arc(w / 2 + 8, h - 10, 11, 0, Math.PI * 2);
    ctx.arc(w / 2, h - 15, 12, 0, Math.PI * 2);
    ctx.fill();

    // Mid green leaves
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(w / 2 - 6, h - 13, 9, 0, Math.PI * 2);
    ctx.arc(w / 2 + 6, h - 13, 9, 0, Math.PI * 2);
    ctx.arc(w / 2, h - 18, 10, 0, Math.PI * 2);
    ctx.fill();

    // Bright sunlight highlight
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(w / 2 - 3, h - 19, 5, 0, Math.PI * 2);
    ctx.arc(w / 2 + 4, h - 18, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 12. Small Trees (Neem / Gulmohar / Peepal)
  private drawTreeSmall(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(w / 2 + 2, h + 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sturdy Brown Tree Trunk with Root Flare
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 4, h - 2);
    ctx.lineTo(w / 2 - 3, h - 22);
    ctx.lineTo(w / 2 + 3, h - 22);
    ctx.lineTo(w / 2 + 4, h - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lush Multi-Layered Cloud Canopy
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(w / 2 - 10, h - 30, 13, 0, Math.PI * 2);
    ctx.arc(w / 2 + 10, h - 30, 13, 0, Math.PI * 2);
    ctx.arc(w / 2, h - 38, 15, 0, Math.PI * 2);
    ctx.fill();

    // Top Leaf Highlights
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(w / 2 - 6, h - 34, 9, 0, Math.PI * 2);
    ctx.arc(w / 2 + 6, h - 34, 9, 0, Math.PI * 2);
    ctx.arc(w / 2, h - 41, 10, 0, Math.PI * 2);
    ctx.fill();

    // Gulmohar Reddish Blossom Accents
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(w / 2 - 7, h - 37, 2, 0, Math.PI * 2);
    ctx.arc(w / 2 + 5, h - 39, 2, 0, Math.PI * 2);
    ctx.arc(w / 2 - 1, h - 43, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 13. Bicycle Parking
  private drawBicycleParking(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w / 2 - 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tubular Steel Parking Rack
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, h - 22, w - 8, 20, 3);
    ctx.stroke();

    // Slotted divider bars
    ctx.beginPath();
    ctx.moveTo(w / 2 - 6, h - 22);
    ctx.lineTo(w / 2 - 6, h - 2);
    ctx.moveTo(w / 2 + 6, h - 22);
    ctx.lineTo(w / 2 + 6, h - 2);
    ctx.stroke();

    // Parked Indian Roadster Bicycle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(w / 2 - 7, h - 10, 6, 0, Math.PI * 2);
    ctx.arc(w / 2 + 7, h - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(w / 2 - 7, h - 10, 4, 0, Math.PI * 2);
    ctx.arc(w / 2 + 7, h - 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bicycle Frame
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 7, h - 10);
    ctx.lineTo(w / 2, h - 17);
    ctx.lineTo(w / 2 + 7, h - 10);
    ctx.stroke();
  }

  // 14. Electric Pole (Bijli Ka Khamba with Drooping Overhead Power Lines)
  private drawElectricPole(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    prop: RoadsideProp,
    isLeft: boolean
  ) {
    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Concrete Utility Pole
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(w / 2 - 2.5, 4, 5, h - 6, 2);
    ctx.fill();
    ctx.stroke();

    // Horizontal Steel Crossarm
    ctx.fillStyle = '#475569';
    ctx.fillRect(w / 2 - 11, 8, 22, 3);

    // Ceramic Porcelain White Insulators
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(w / 2 - 10, 5, 3, 3);
    ctx.fillRect(w / 2 + 7, 5, 3, 3);

    // Drooping Overhead Electrical Cables
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, 5);
    ctx.quadraticCurveTo(w / 2 - 20, -10, isLeft ? -10 : w + 10, -25);
    ctx.moveTo(w / 2 + 7, 5);
    ctx.quadraticCurveTo(w / 2 + 18, 20, isLeft ? -10 : w + 10, 35);
    ctx.stroke();
  }

  // 15. Roadside Bench
  private drawRoadsideBench(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w / 2 - 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cast-iron side legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, h - 18, 4, 18);
    ctx.fillRect(w - 10, h - 18, 4, 18);

    // Wooden Slats (Seat & Backrest)
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;

    // Backrest slats
    ctx.fillRect(4, h - 26, w - 8, 4);
    ctx.fillRect(4, h - 20, w - 8, 4);

    // Seat plank
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.roundRect(2, h - 14, w - 4, 5, 1.5);
    ctx.fill();
    ctx.stroke();
  }

  // 16. Small Advertisement Board (Hoarding / Poster Kiosk)
  private drawAdvertisementBoard(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w / 2 - 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual Metal Support Posts
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, 14, 3, h - 14);
    ctx.fillRect(w - 11, 14, 3, h - 14);

    // Illuminated Billboard Frame
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(2, 0, w - 4, 28, 3);
    ctx.fill();

    // Vibrant Ad Banner Inside
    ctx.fillStyle = prop.color || '#ea580c';
    ctx.fillRect(4, 2, w - 8, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(prop.name.slice(0, 14), w / 2, 12);

    if (prop.subtitle) {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText(prop.subtitle.slice(0, 15), w / 2, 21);
    }

    // Top Overhead Spotlight Fixtures
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(w / 2 - 8, -2, 4, 3);
    ctx.fillRect(w / 2 + 4, -2, 4, 3);
  }

  // 17. Level 2 Special: Sabzi Mandi Vegetable Cart (Thela)
  private drawSabziStall(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w / 2 - 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Green Fabric Slanted Canopy
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(0, 4, w, 14, [4, 4, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥦 ' + prop.name.slice(0, 13), w / 2, 14);

    // Wooden 4-Wheeled Thela Bed
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 20, w - 8, 16);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(4, 20, w - 8, 16);

    // Crates bursting with colorful vegetables
    ctx.fillStyle = '#ef4444'; // Tomatoes
    ctx.fillRect(6, 22, (w - 16) / 3, 10);
    ctx.fillStyle = '#22c55e'; // Spinach
    ctx.fillRect(8 + (w - 16) / 3, 22, (w - 16) / 3, 10);
    ctx.fillStyle = '#f97316'; // Carrots
    ctx.fillRect(10 + ((w - 16) / 3) * 2, 22, (w - 16) / 3, 10);

    // Cart Wheels (Cart Iron Spoked Wheels)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(10, h - 8, 6, 0, Math.PI * 2);
    ctx.arc(w - 10, h - 8, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 18. Level 8 Special: Concrete Flyover / Metro Pillar
  private drawFlyoverPillar(ctx: CanvasRenderingContext2D, w: number, h: number, prop: RoadsideProp) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w / 2 - 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Concrete Hexagonal Column
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(4, 8, w - 8, h - 10, 4);
    ctx.fill();
    ctx.stroke();

    // 3D Isometric Shade on side
    ctx.fillStyle = '#475569';
    ctx.fillRect(w - 10, 9, 5, h - 12);

    // Concrete Crown Cap at top
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(2, 4, w - 4, 6);
    ctx.strokeRect(2, 4, w - 4, 6);

    // Yellow & Black Diagonal Hazard Caution Striping at Base
    const stripeBoxH = 18;
    const stripeBoxY = h - stripeBoxH - 2;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(4, stripeBoxY, w - 8, stripeBoxH);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    for (let i = 0; i < w - 8; i += 6) {
      ctx.beginPath();
      ctx.moveTo(4 + i, stripeBoxY + stripeBoxH);
      ctx.lineTo(4 + i + 6, stripeBoxY);
      ctx.stroke();
    }

    // Pillar Number Stencil
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(prop.name.slice(0, 12), w / 2, 28);
  }

  // Draw Ground Hazards (Potholes, puddles, speed bumps, barricades)
  private drawHazards(
    state: RendererState,
    getLaneCenterX: (lane: Lane) => number,
    laneWidth: number
  ) {
    const ctx = this.ctx;

    for (const h of state.hazards) {
      if (h.y < -100 || h.y > this.height + 100) continue;
      const cx = getLaneCenterX(h.lane);

      ctx.save();
      ctx.translate(cx, h.y);

      if (h.type === 'pothole') {
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 14, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(-3, -2, 14, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (h.type === 'water_puddle') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 16, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 8, -0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (h.type === 'barricade') {
        const barW = Math.min(laneWidth * 0.75, 52);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-barW / 2 + 2, 4, barW, 10);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW / 2, -6, barW, 14);

        ctx.fillStyle = '#facc15';
        for (let bx = -barW / 2 + 4; bx < barW / 2; bx += 14) {
          ctx.fillRect(bx, -6, 7, 14);
        }

        ctx.fillStyle = '#475569';
        ctx.fillRect(-barW / 2 + 2, 8, 4, 8);
        ctx.fillRect(barW / 2 - 6, 8, 4, 8);
      } else {
        const bumpW = laneWidth * 0.8;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-bumpW / 2, -8, bumpW, 16);

        ctx.fillStyle = '#eab308';
        for (let bx = -bumpW / 2 + 6; bx < bumpW / 2; bx += 18) {
          ctx.beginPath();
          ctx.moveTo(bx, 6);
          ctx.lineTo(bx + 8, -6);
          ctx.lineTo(bx + 16, 6);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  // Draw Collectible Coins
  private drawCollectibles(state: RendererState, getLaneCenterX: (lane: Lane) => number) {
    const ctx = this.ctx;
    const time = state.gameTime;

    for (const c of state.coins) {
      if (c.collected || c.y < -50 || c.y > this.height + 50) continue;
      const cx = getLaneCenterX(c.lane);

      ctx.save();
      ctx.translate(cx, c.y);

      const bob = Math.sin(time * 6 + c.id) * 3;
      ctx.translate(0, bob);

      if (c.type === 'coin') {
        const scaleX = Math.abs(Math.cos(time * 5 + c.id * 0.5));
        ctx.scale(scaleX, 1);

        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        if (scaleX > 0.4) {
          ctx.fillStyle = '#78350f';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('₹', 0, 0.5);
        }
      } else if (c.type === 'chai') {
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.roundRect(-8, -10, 16, 20, 2);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(-7, -8, 14, 6);

        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        const steamY = (time * 15) % 10;
        ctx.beginPath();
        ctx.moveTo(-3, -12 - steamY);
        ctx.quadraticCurveTo(0, -16 - steamY, 3, -20 - steamY);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }

  // Draw 4 Indian Drink Pickups (Water Bottle, Cold Drink, Nimbu Pani, Lassi)
  private drawDrinks(state: RendererState, getLaneCenterX: (lane: Lane) => number) {
    const ctx = this.ctx;
    const time = state.gameTime;

    for (const d of state.drinks) {
      if (d.collected || d.y < -50 || d.y > this.height + 50) continue;
      const cx = getLaneCenterX(d.lane);

      ctx.save();
      ctx.translate(cx, d.y);

      // Floating bob + gentle rotation shimmer
      const bob = Math.sin(time * 5 + d.id * 1.5) * 4;
      ctx.translate(0, bob);

      // Glowing aura
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 14;

      if (d.type === 'water') {
        // Clear Blue Water Bottle (+20 Stamina)
        // Cap
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-3, -14, 6, 4);

        // Bottle body
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(-7, -10, 14, 22, 3);
        ctx.fill();

        // Label (White with blue text)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-7, -4, 14, 9);
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 6px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('H2O', 0, 3);
      } else if (d.type === 'cold_drink') {
        // Red Soda Can (+30 Stamina)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(-7, -12, 14, 24, 3);
        ctx.fill();

        // White swoosh wave
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.quadraticCurveTo(0, 4, 6, 2);
        ctx.stroke();

        // Silver rim on top
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-6, -13, 12, 2);
      } else if (d.type === 'nimbu_pani') {
        // Fresh Nimbu Pani glass with lemon slice (+50 Stamina)
        // Frosted yellow glass
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.roundRect(-8, -12, 16, 24, [2, 2, 4, 4]);
        ctx.fill();

        // Lemon slice attached to glass rim
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(6, -11, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(6, -11, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Mint leaf on top
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(-2, -14, 3.5, 2, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'lassi') {
        // Special Malai Lassi (+70 Stamina - Rare)
        // Traditional terracotta earthen kulhad or tall white glass
        ctx.fillStyle = '#d97706'; // Terracotta clay pot
        ctx.beginPath();
        ctx.roundRect(-9, -13, 18, 26, [3, 3, 5, 5]);
        ctx.fill();

        // Thick white malai froth overflowing
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -11, 8, 0, Math.PI * 2);
        ctx.fill();

        // Green pistachio / almond sprinkles
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-4, -13, 2, 2);
        ctx.fillRect(2, -12, 2, 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-1, -10, 2, 2);
      }

      ctx.shadowBlur = 0; // reset

      // Stamina indicator pill tag above drink
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-16, -26, 32, 11, 4);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${d.staminaRestore}⚡`, 0, -18);

      ctx.restore();
    }
  }

  // Draw Vehicles
  private drawVehicles(state: RendererState, getLaneCenterX: (lane: Lane) => number) {
    const ctx = this.ctx;

    for (const v of state.vehicles) {
      if (v.y < -200 || v.y > this.height + 200) continue;

      const startX = getLaneCenterX(v.lane);
      const targetX = getLaneCenterX(v.targetLane);
      const vx = v.x ?? startX + (targetX - startX) * v.laneChangeProgress;

      ctx.save();
      ctx.translate(vx, v.y);

      if (v.isHit) {
        ctx.rotate(v.hitRotation || 0);
        ctx.scale(0.85, 0.85);
      } else if (v.isWrongSide) {
        // Warning badge above the vehicle (drawn before rotation so text stays upright)
        const pulse = 1 + Math.sin(state.gameTime * 10) * 0.08;
        ctx.save();
        ctx.scale(pulse, pulse);
        ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-44, -v.length / 2 - 25, 88, 18, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️ WRONG SIDE!', 0, -v.length / 2 - 15);
        ctx.restore();

        // Rotate 180 degrees so vehicle faces head-on DOWNWARDS towards player!
        ctx.rotate(Math.PI);

        // Flashing dipper high-beam headlights shining on the road towards the player
        const blink = Math.floor(state.gameTime * 14) % 2 === 0;
        const beamAlpha = blink ? 0.42 : 0.14;
        ctx.save();
        const beamGrad = ctx.createLinearGradient(0, -v.length / 2, 0, -v.length / 2 - 90);
        beamGrad.addColorStop(0, `rgba(254, 240, 138, ${beamAlpha})`);
        beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-v.width * 0.38, -v.length / 2);
        ctx.lineTo(-v.width * 0.85, -v.length / 2 - 90);
        ctx.lineTo(v.width * 0.85, -v.length / 2 - 90);
        ctx.lineTo(v.width * 0.38, -v.length / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(-v.width / 2 + 3, -v.length / 2 + 5, v.width, v.length, 6);
      ctx.fill();

      switch (v.type) {
        case 'auto':
          this.drawAutoRickshaw(ctx, v.width, v.length);
          break;
        case 'bus_yellow':
        case 'bus_city':
          this.drawBus(
            ctx,
            v.width,
            v.length,
            v.type === 'bus_yellow' ? '#f59e0b' : '#dc2626',
            state.jugaadMode === 'bus_seeking',
            state.gameTime
          );
          break;
        case 'car_red':
          this.drawCar(ctx, v.width, v.length, '#ef4444');
          break;
        case 'car_blue':
          this.drawCar(ctx, v.width, v.length, '#0284c7');
          break;
        case 'scooter':
          this.drawScooter(ctx, v.width, v.length);
          break;
        case 'cycle':
          this.drawTwoSeaterBicycleTraffic(ctx, v.width, v.length, state.gameTime, state.jugaadMode === 'cycle_seeking');
          break;
        case 'tempo':
        default:
          this.drawTempo(ctx, v.width, v.length);
          break;
      }

      ctx.restore();
    }
  }

  // Draw Indian Cows (Gau Mata - Roadside & gentle crossing obstacles)
  private drawCows(state: RendererState) {
    const ctx = this.ctx;
    const time = state.gameTime;

    for (const cow of state.cows) {
      if (cow.y < -120 || cow.y > this.height + 120) continue;

      ctx.save();
      ctx.translate(cow.x, cow.y);

      // Tail swish animation
      const tailSwish = Math.sin(time * 7 + cow.id) * 0.35;
      // Gentle breathing / chewing bob
      const chewBob = Math.sin(time * 5 + cow.id) * 1.5;

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 8, cow.width / 2 + 3, cow.height / 2 + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cow Base Colors
      let bodyColor = '#f8fafc'; // White Gir Cow
      let patchColor = '#cbd5e1';
      let earColor = '#fda4af';

      if (cow.colorType === 'brown') {
        bodyColor = '#9a3412';
        patchColor = '#7c2d12';
        earColor = '#f43f5e';
      } else if (cow.colorType === 'spotted') {
        bodyColor = '#f8fafc';
        patchColor = '#1e293b';
        earColor = '#fda4af';
      }

      // Cow Main Torso (Oblong body)
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-cow.width / 2, -cow.height / 2 + 4, cow.width, cow.height - 4, 8);
      ctx.fill();

      // Distinct Indian Hump (Kakud - characteristic of Indian Zebu breeds)
      ctx.fillStyle = patchColor;
      ctx.beginPath();
      ctx.ellipse(0, -cow.height / 2 + 8, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Patches if spotted
      if (cow.colorType === 'spotted') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(-6, 2, 6, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(7, -4, 5, 6, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Marigold Garland or Red Bell Collar around neck
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-cow.width / 2 + 3, -cow.height / 2 + 13, cow.width - 6, 3.5);
      // Brass Bell
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, -cow.height / 2 + 16, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cow Head (Top view pointing forward/upwards)
      ctx.save();
      ctx.translate(0, -cow.height / 2 + chewBob);

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-8, -12, 16, 14, [6, 6, 3, 3]);
      ctx.fill();

      // Snout (Muzzle)
      ctx.fillStyle = earColor;
      ctx.beginPath();
      ctx.roundRect(-6, -14, 12, 5, 2);
      ctx.fill();

      // Nostrils
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-3, -13, 1.5, 1.5);
      ctx.fillRect(1.5, -13, 1.5, 1.5);

      // Curved Horns
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      // Left Horn
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.quadraticCurveTo(-11, -12, -10, -18);
      ctx.stroke();

      // Right Horn
      ctx.beginPath();
      ctx.moveTo(6, -8);
      ctx.quadraticCurveTo(11, -12, 10, -18);
      ctx.stroke();

      // Ears
      ctx.fillStyle = earColor;
      ctx.beginPath();
      ctx.ellipse(-10, -6, 4, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(10, -6, 4, 2, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Tail with swish
      ctx.save();
      ctx.translate(0, cow.height / 2 - 2);
      ctx.rotate(tailSwish);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 10);
      ctx.stroke();
      // Tuft of hair at tail end
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Four Hooves
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-cow.width / 2 + 1, -cow.height / 2 + 8, 3, 4);
      ctx.fillRect(cow.width / 2 - 4, -cow.height / 2 + 8, 3, 4);
      ctx.fillRect(-cow.width / 2 + 1, cow.height / 2 - 8, 3, 4);
      ctx.fillRect(cow.width / 2 - 4, cow.height / 2 - 8, 3, 4);

      ctx.restore();
    }
  }

  // Auto-Rickshaw
  private drawAutoRickshaw(ctx: CanvasRenderingContext2D, w: number, l: number) {
    const halfW = w / 2;
    const halfL = l / 2;

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfL + 8, w, l - 10, [8, 8, 4, 4]);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-halfW + 2, -halfL + 12, w - 4, l - 18, 6);
    ctx.fill();

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(-halfW + 6, -halfL + 8);
    ctx.lineTo(0, -halfL);
    ctx.lineTo(halfW - 6, -halfL + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.moveTo(-halfW + 7, -halfL + 9);
    ctx.lineTo(0, -halfL + 3);
    ctx.lineTo(halfW - 7, -halfL + 9);
    ctx.lineTo(halfW - 6, -halfL + 16);
    ctx.lineTo(-halfW + 6, -halfL + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -halfL + 1, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(0, -halfL + 24, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-halfW + 3, halfL - 3, 5, 3);
    ctx.fillRect(halfW - 8, halfL - 3, 5, 3);
  }

  // Bus
  private drawBus(
    ctx: CanvasRenderingContext2D,
    w: number,
    l: number,
    color: string,
    isSeekingLift: boolean = false,
    time: number = 0
  ) {
    const halfW = w / 2;
    const halfL = l / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfL, w, l, 8);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(-halfW + 6, -halfL + 18, w - 12, l - 36);

    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfL + 4, w - 8, 14, 3);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 6, -halfL + 2, w - 12, 6);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('108 COLLEGE', 0, -halfL + 6.5);

    ctx.fillStyle = '#38bdf8';
    const windowCount = 5;
    const winSpacing = (l - 40) / windowCount;
    for (let i = 0; i < windowCount; i++) {
      const wy = -halfL + 24 + i * winSpacing;
      ctx.fillRect(-halfW + 2, wy, 4, winSpacing - 3);
      ctx.fillRect(halfW - 6, wy, 4, winSpacing - 3);
    }

    // Rear Window
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(-halfW + 6, halfL - 8, w - 12, 5);

    // Front Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-halfW + 3, -halfL, 6, 2);
    ctx.fillRect(halfW - 9, -halfL, 6, 2);

    // Rear Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-halfW + 3, halfL - 2, 6, 2);
    ctx.fillRect(halfW - 9, halfL - 2, 6, 2);

    // Rear Footboard & Grab Handles (Quintessential Indian City Bus)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-halfW + 10, halfL - 1, w - 20, 4); // Rear bumper step/footboard

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, halfL - 6);
    ctx.lineTo(-6, halfL + 3);
    ctx.moveTo(6, halfL - 6);
    ctx.lineTo(6, halfL + 3);
    ctx.stroke();

    // If player is looking for bus lift, highlight the rear footboard!
    if (isSeekingLift) {
      const pulse = Math.sin(time * 10) * 3;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, halfL + 4, 16 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Footboard Tag
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-35, halfL + 18, 70, 14, 4);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚌 FOOTBOARD! (CATCH ON)', 0, halfL + 28);
    }
  }

  // Car
  private drawCar(ctx: CanvasRenderingContext2D, w: number, l: number, color: string) {
    const halfW = w / 2;
    const halfL = l / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfL, w, l, 7);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfL + 12, w - 8, l - 24, 4);
    ctx.fill();

    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfL + 6, w - 8, 8, 2);
    ctx.fill();

    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, halfL - 12, w - 8, 6, 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-halfW + 2, -halfL, 5, 2);
    ctx.fillRect(halfW - 7, -halfL, 5, 2);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-halfW + 2, halfL - 2, 5, 2);
    ctx.fillRect(halfW - 7, halfL - 2, 5, 2);
  }

  // Scooter
  private drawScooter(ctx: CanvasRenderingContext2D, w: number, l: number) {
    const halfL = l / 2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3, -halfL, 6, l);

    ctx.fillStyle = '#334155';
    ctx.fillRect(-4, -halfL, 8, 8);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -halfL + 1, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-9, 1, 18, 7);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-3, halfL - 2, 6, 2);
  }

  // Tempo
  private drawTempo(ctx: CanvasRenderingContext2D, w: number, l: number) {
    const halfW = w / 2;
    const halfL = l / 2;

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfL, w, 22, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(-halfW + 3, -halfL + 4, w - 6, 9);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfL + 22, w, l - 22, [0, 0, 4, 4]);
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfL + 30);
    ctx.lineTo(halfW, -halfL + 40);
    ctx.moveTo(-halfW, -halfL + 40);
    ctx.lineTo(halfW, -halfL + 30);
    ctx.stroke();
  }

  // Two-Seater Indian Bicycle in Traffic (Hero/Atlas cycle with front rider and empty rear carrier seat)
  private drawTwoSeaterBicycleTraffic(
    ctx: CanvasRenderingContext2D,
    w: number,
    l: number,
    time: number,
    isSeekingLift: boolean
  ) {
    const halfL = l / 2;
    const wheelSpin = time * 20;

    // 1. Bicycle Central Frame Tube
    ctx.strokeStyle = '#047857'; // Classic Indian green cycle frame
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -halfL + 4);
    ctx.lineTo(0, halfL - 4);
    ctx.stroke();

    // 2. Front Wheel (Narrow black tire with rotating spokes)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -halfL, 4, 12);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -halfL + 2);
    ctx.lineTo(Math.sin(wheelSpin) * 3, -halfL + 10);
    ctx.stroke();

    // Front Mudguard
    ctx.fillStyle = '#065f46';
    ctx.fillRect(-3, -halfL + 3, 6, 7);

    // 3. Handlebars with Brass Bell & Grips
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, -halfL + 12);
    ctx.lineTo(11, -halfL + 12);
    ctx.stroke();

    // Black Rubber Hand Grips
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, -halfL + 10, 3, 4);
    ctx.fillRect(9, -halfL + 10, 3, 4);

    // Brass Bell (Ting-Ting!)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(7, -halfL + 10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Front Cyclist (Rider pedaling in front seat)
    const pedalAngle = Math.sin(wheelSpin);
    // Pedals & moving legs
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, -halfL + 20 + pedalAngle * 4, 3, 5);
    ctx.fillRect(5, -halfL + 20 - pedalAngle * 4, 3, 5);

    // Front Seat (Saddle)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-4, -halfL + 16, 8, 8, 2);
    ctx.fill();

    // Front Rider Torso (Friendly local bhaiya in light blue shirt)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(-7, -halfL + 14, 14, 11, 3);
    ctx.fill();

    // Front Rider Arms holding handlebars
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -halfL + 16);
    ctx.lineTo(-10, -halfL + 13);
    ctx.moveTo(6, -halfL + 16);
    ctx.lineTo(10, -halfL + 13);
    ctx.stroke();

    // Front Rider Head & Hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -halfL + 10, 5, 0, Math.PI * 2);
    ctx.fill();

    // 5. THE TWO-SEATER REAR CARRIER SEAT (The empty second seat!)
    // Metal luggage carrier frame
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(-6, halfL - 18, 12, 12);

    // Padded leather cushion on the rear carrier (The second seat!)
    ctx.fillStyle = '#78350f'; // Brown leather padded cushion
    ctx.beginPath();
    ctx.roundRect(-5, halfL - 16, 10, 10, 2);
    ctx.fill();

    // Rear footrest pegs on each side for passenger
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-8, halfL - 12, 3, 2);
    ctx.fillRect(5, halfL - 12, 3, 2);

    // 6. Rear Wheel & Mudguard
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, halfL - 8, 4, 12);
    // Red Reflector on rear mudguard
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-2, halfL + 3, 4, 2);

    // 7. If player is looking for a lift, highlight the empty back seat with a glowing prompt!
    if (isSeekingLift) {
      const pulse = Math.sin(time * 10) * 3;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, halfL - 11, 14 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Lift Tag
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-30, halfL + 7, 60, 14, 4);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚲 EMPTY SEAT!', 0, halfL + 17);
    }
  }

  // Player Rendering
  private drawPlayer(state: RendererState) {
    const ctx = this.ctx;
    const x = state.playerCurrentX;
    const baseY = state.playerY;
    const y = baseY - state.jumpOffset;
    const time = state.gameTime;

    ctx.save();
    ctx.translate(x, y);

    // Ground Shadow
    const shadowScale = Math.max(0.3, 1 - state.jumpOffset / 80);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, state.jumpOffset + 12, 14 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stamina boost visual effect (Cyan wind aura around runner)
    if (state.isBoosting) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22 + Math.sin(time * 20) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Flame/Speed particles
      ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.jugaadMode === 'cycle') {
      this.drawCycleJugaadPlayer(ctx, time, state.characterColor);
      ctx.restore();
      return;
    }

    if (state.jugaadMode === 'bus') {
      this.drawBusJugaadPlayer(ctx, time, state.characterColor);
      ctx.restore();
      return;
    }

    this.drawNormalStudent(ctx, time, state.isJumping, state.characterColor, state.jugaadMode);
    ctx.restore();
  }

  private drawNormalStudent(
    ctx: CanvasRenderingContext2D,
    time: number,
    isJumping: boolean,
    color: string,
    jugaadMode: JugaadMode = 'none'
  ) {
    const runCycle = isJumping ? 0 : Math.sin(time * 18);
    const legOffset = runCycle * 8;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 6 + legOffset, 4, 8);
    ctx.fillRect(2, 6 - legOffset, 4, 8);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, 12 + legOffset, 4, 3);
    ctx.fillRect(2, 12 - legOffset, 4, 3);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-8, -6, 16, 14, 3);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-7, -4, 14, 11, 4);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5, 0, 10, 5);

    // Left Arm
    ctx.fillStyle = color;
    if (jugaadMode === 'bus_seeking') {
      // Both hands reaching and waving forward for bus!
      const waveL = Math.sin(time * 14 + 1) * 3;
      ctx.fillRect(-10, -14 + waveL, 3, 10);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(-8.5, -16 + waveL, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-10, -4 - legOffset * 0.4, 3, 8);
    }

    // Right Arm: If seeking cycle or bus lift, student extends arm high waving!
    if (jugaadMode === 'cycle_seeking') {
      const wave = Math.sin(time * 14) * 4;
      ctx.fillStyle = color;
      ctx.fillRect(7, -14 + wave, 3, 10);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(8.5, -16 + wave, 3, 0, Math.PI * 2);
      ctx.fill();

      // Lift Bubble
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(14, -28, 54, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🙋 LIFT PLEASE!', 41, -18);
    } else if (jugaadMode === 'bus_seeking') {
      const waveR = Math.sin(time * 14) * 3;
      ctx.fillStyle = color;
      ctx.fillRect(7, -14 + waveR, 3, 10);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(8.5, -16 + waveR, 3, 0, Math.PI * 2);
      ctx.fill();

      // Bus Bubble
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(14, -28, 64, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚌 BHAIYA RUKO!', 46, -18);
    } else {
      ctx.fillRect(7, -4 + legOffset * 0.4, 3, 8);
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -11, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -13, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // TWO-SEATER BICYCLE RIDE (Player student sitting on rear carrier seat while front rider pedals!)
  private drawCycleJugaadPlayer(ctx: CanvasRenderingContext2D, time: number, color: string) {
    const wheelSpin = time * 28;
    const halfL = 26;

    // 1. Two-Seater Bicycle Frame
    ctx.strokeStyle = '#047857'; // Green frame
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -halfL + 4);
    ctx.lineTo(0, halfL);
    ctx.stroke();

    // 2. Front Wheel with spinning spokes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -halfL - 2, 4, 12);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -halfL + 1);
    ctx.lineTo(Math.sin(wheelSpin) * 4, -halfL + 9);
    ctx.stroke();

    // 3. Handlebars & Bell
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -halfL + 10);
    ctx.lineTo(12, -halfL + 10);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(8, -halfL + 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // 4. FRONT CYCLIST (Friendly Bhaiya pedaling hard in front seat)
    const pedalAngle = Math.sin(wheelSpin);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-9, -halfL + 18 + pedalAngle * 5, 4, 6);
    ctx.fillRect(5, -halfL + 18 - pedalAngle * 5, 4, 6);

    // Front rider torso (Light Blue shirt)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(-8, -halfL + 13, 16, 12, 3);
    ctx.fill();

    // Front rider head
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -halfL + 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // 5. REAR CARRIER SEAT (With Player Sitting Double-Seat!)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, halfL - 18, 12, 10);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-9, halfL - 10, 3, 3);
    ctx.fillRect(6, halfL - 10, 3, 3);

    // PLAYER STUDENT SITTING ON BACK SEAT!
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-8, halfL - 20, 16, 13, 4);
    ctx.fill();

    // School Bag / Backpack on Student's back
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-7, halfL - 16, 14, 11, 4);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5, halfL - 12, 10, 5);

    // Player Student Arms holding onto front rider's waist/shoulders!
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, halfL - 16);
    ctx.lineTo(-7, -halfL + 22);
    ctx.moveTo(6, halfL - 16);
    ctx.lineTo(7, -halfL + 22);
    ctx.stroke();

    // Player Student Head
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, halfL - 24, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, halfL - 26, 4, 0, Math.PI * 2);
    ctx.fill();

    // 6. Rear Wheel & Mudguard
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, halfL - 4, 4, 14);

    // 7. Speed trails
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, halfL + 12);
    ctx.lineTo(-8, halfL + 24);
    ctx.moveTo(8, halfL + 12);
    ctx.lineTo(8, halfL + 24);
    ctx.stroke();
  }

  // BUS JUGAAD: STUDENT HANGING ON THE REAR FOOTBOARD OF THE CITY BUS!
  private drawBusJugaadPlayer(ctx: CanvasRenderingContext2D, time: number, color: string) {
    const busW = 46;
    const busL = 84;
    const halfW = busW / 2;
    const halfL = busL / 2;
    // Bus forward offset so student hanging at back is anchored near player's vertical position
    const busOffsetY = -halfL + 8;

    ctx.save();
    ctx.translate(0, busOffsetY);

    // 1. Bus Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-halfW - 3, -halfL + 4, busW + 6, busL + 20, 8);
    ctx.fill();

    // 2. Bus Main Body (Red DTC / City Express Bus)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfL, busW, busL, 8);
    ctx.fill();

    // Yellow Contrast Hazard Stripe
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-halfW, -halfL + 18, busW, 8);

    // Darkened Roof with Vents
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(-halfW + 6, -halfL + 28, busW - 12, busL - 52);

    // 3. Front Windshield & Destination Sign
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfL + 4, busW - 8, 14, 3);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 5, -halfL + 2, busW - 10, 6);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 5.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('108 COLLEGE SPECIAL', 0, -halfL + 6.5);

    // 4. Side Passenger Windows
    ctx.fillStyle = '#38bdf8';
    const windowCount = 5;
    const winSpacing = (busL - 44) / windowCount;
    for (let i = 0; i < windowCount; i++) {
      const wy = -halfL + 28 + i * winSpacing;
      ctx.fillRect(-halfW + 2, wy, 4, winSpacing - 3);
      ctx.fillRect(halfW - 6, wy, 4, winSpacing - 3);
    }

    // 5. Front Headlights with Glowing Forward Beams
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-halfW + 3, -halfL, 6, 2);
    ctx.fillRect(halfW - 9, -halfL, 6, 2);

    ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
    ctx.beginPath();
    ctx.moveTo(-halfW + 3, -halfL);
    ctx.lineTo(-halfW - 10, -halfL - 40);
    ctx.lineTo(-halfW + 16, -halfL - 40);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(halfW - 9, -halfL);
    ctx.lineTo(halfW - 16, -halfL - 40);
    ctx.lineTo(halfW + 10, -halfL - 40);
    ctx.closePath();
    ctx.fill();

    // 6. Rear Window
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(-halfW + 6, halfL - 8, busW - 12, 5);

    // Red Tail Lights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-halfW + 3, halfL - 2, 6, 2);
    ctx.fillRect(halfW - 9, halfL - 2, 6, 2);

    // 7. REAR FOOTBOARD & VERTICAL CHROME LADDER HANDLES
    ctx.fillStyle = '#334155';
    ctx.fillRect(-halfW + 6, halfL - 1, busW - 12, 5); // Footboard ledge

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, halfL - 12);
    ctx.lineTo(-10, halfL + 6);
    ctx.moveTo(10, halfL - 12);
    ctx.lineTo(10, halfL + 6);
    ctx.stroke();

    // 8. STUDENT PHYSICALLY HANGING ON THE BACK OF THE BUS!
    const sway = Math.sin(time * 18) * 3;
    const bodyBounce = Math.cos(time * 20) * 1.5;

    ctx.save();
    ctx.translate(sway, halfL + bodyBounce);

    // Both hands tightly gripping the rear grab rails
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(-10 - sway * 0.4, 0, 3, 0, Math.PI * 2);
    ctx.arc(10 - sway * 0.4, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Arms stretching from body to grab rails
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-10 - sway * 0.4, 1);
    ctx.moveTo(0, 6);
    ctx.lineTo(10 - sway * 0.4, 1);
    ctx.stroke();

    // Student Torso hanging off the footboard
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-8, 3, 16, 13, 3);
    ctx.fill();

    // School Backpack on student's back
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-7, 6, 14, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5, 10, 10, 5);

    // Student Head looking ahead
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 1, 6, 0, Math.PI * 2);
    ctx.fill();

    // Student dangling legs on footboard ledge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 16, 4, 8);
    ctx.fillRect(2, 16, 4, 8);

    // White sneakers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, 22, 4, 3);
    ctx.fillRect(2, 22, 4, 3);

    ctx.restore();

    // 9. Speed sparks from tires
    ctx.fillStyle = '#facc15';
    for (let i = 0; i < 4; i++) {
      const sparkX = (Math.sin(time * 30 + i) * halfW) * 0.8;
      const sparkY = halfL + 18 + Math.random() * 15;
      ctx.fillRect(sparkX, sparkY, 2.5, 2.5);
    }

    ctx.restore();
  }

  private drawSpeedLines(state: RendererState) {
    const ctx = this.ctx;
    const { roadLeft, roadWidth } = this.getRoadMetrics();

    let strokeColor = 'rgba(250, 204, 21, 0.4)';
    if (state.jugaadMode === 'bus') strokeColor = 'rgba(239, 68, 68, 0.4)';
    else if (state.isBoosting) strokeColor = 'rgba(56, 189, 248, 0.5)';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    const count = 12;
    for (let i = 0; i < count; i++) {
      const sx = roadLeft + Math.random() * roadWidth;
      const sy = Math.random() * this.height;
      const len = 35 + Math.random() * 45;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + len);
      ctx.stroke();
    }
  }

  private drawFinishGate(state: RendererState, roadLeft: number, roadWidth: number) {
    const ctx = this.ctx;
    const distToGoal = TOTAL_GOAL_DISTANCE - state.distanceCovered;
    const gateY = this.height - 180 - distToGoal * 5;

    if (gateY < -200 || gateY > this.height + 100) return;

    ctx.save();
    ctx.translate(roadLeft + roadWidth / 2, gateY);

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-roadWidth / 2 - 16, -50, 24, 70);
    ctx.fillRect(roadWidth / 2 - 8, -50, 24, 70);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(-roadWidth / 2 - 18, -60, 28, 10);
    ctx.fillRect(roadWidth / 2 - 10, -60, 28, 10);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-roadWidth / 2 - 10, -90, roadWidth + 20, 42);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(-roadWidth / 2 - 10, -90, roadWidth + 20, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎓 SGSU COLLEGE OF ENGINEERING & ARTS 🎓', 0, -68);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('GATE NO. 1 - REPORT ON TIME!', 0, -53);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-roadWidth / 2, -90);
    ctx.lineTo(-roadWidth / 2 + 20, -110);
    ctx.lineTo(-roadWidth / 2 + 40, -90);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(roadWidth / 2 - 40, -90);
    ctx.lineTo(roadWidth / 2 - 20, -110);
    ctx.lineTo(roadWidth / 2, -90);
    ctx.fill();

    ctx.restore();
  }

  private drawParticles(state: RendererState) {
    const ctx = this.ctx;
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private drawFloatingTexts(state: RendererState) {
    const ctx = this.ctx;
    for (const ft of state.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.opacity);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize || 14}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
