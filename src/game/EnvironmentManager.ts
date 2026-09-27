import { RoadsideProp, RoadsidePropType } from '../types/game';

// Level-specific pools matching the 10 game levels
const LEVEL_PROP_POOLS: Record<number, { type: RoadsidePropType; names: string[]; subtitles: string[]; colors: string[] }[]> = {
  // Level 1: Mohalla (Houses, small shops, plants, walls, trees)
  0: [
    {
      type: 'building_residential',
      names: ['SHARMA NIWAS', 'VERMA SADAN', 'GUPTA BHAVAN', 'MOHALLA HOUSE'],
      subtitles: ['Lane No. 3', 'Ward 12', 'Peaceful Enclave', 'Old Town'],
      colors: ['#fef3c7', '#fed7aa', '#fecdd3', '#e0e7ff'],
    },
    {
      type: 'brick_wall',
      names: ['BRICK BOUNDARY', 'OLD COLONY WALL', 'GARDEN WALL'],
      subtitles: ['Keep Clean', 'Shiksha Abhiyan', 'Pvt Property'],
      colors: ['#b45309', '#9a3412', '#78350f'],
    },
    {
      type: 'tree_small',
      names: ['NEEM TREE', 'PEEPAL TREE', 'GULMOHAR', 'MANGO TREE'],
      subtitles: ['Cool Shade', 'Green Mohalla', 'Native Tree'],
      colors: ['#15803d', '#166534', '#14532d', '#16a34a'],
    },
    {
      type: 'potted_plants',
      names: ['FLOWER POTS', 'TULSI & FERNS', 'BALCONY GARDEN'],
      subtitles: ['Greenery', 'Fresh Fragrance', 'Terracotta'],
      colors: ['#ea580c', '#15803d', '#f59e0b'],
    },
    {
      type: 'shop_awning',
      names: ['POOJA SWEETS', 'CHAI TAPRI', 'KIRANA STORE'],
      subtitles: ['Fresh Samosas', 'Hot Masala Chai', 'Daily Groceries'],
      colors: ['#dc2626', '#d97706', '#2563eb'],
    },
    {
      type: 'electric_pole',
      names: ['BIJLI KHAMBA', 'POWER LINE'],
      subtitles: ['240V Supply', 'BSES Line'],
      colors: ['#94a3b8', '#64748b'],
    },
    {
      type: 'dustbin',
      names: ['SWACHH BHARAT', 'GREEN DUSTBIN'],
      subtitles: ['Wet & Dry', 'Use Me'],
      colors: ['#16a34a', '#2563eb'],
    },
  ],

  // Level 2: Sabzi Market (Vegetable shops, fruit stalls, carts, crates)
  1: [
    {
      type: 'sabzi_stall',
      names: ['RAMU SABZI MANDI', 'TAZA PALAK & ALOO', 'KISHAN FRESH VEG'],
      subtitles: ['Tomato ₹30/kg', 'Fresh Bhindi', 'Green Veggies'],
      colors: ['#15803d', '#16a34a', '#22c55e'],
    },
    {
      type: 'shop_awning',
      names: ['APNA FRUIT MART', 'JUICE CORNER', 'MANGO SHAKE'],
      subtitles: ['Fresh Mosambi', 'Seasonal Fruits', 'Chilled Juice'],
      colors: ['#ea580c', '#eab308', '#f97316'],
    },
    {
      type: 'general_store',
      names: ['DESI KIRANA STORE', 'MASALA BHANDAR'],
      subtitles: ['Spices & Pulses', 'Pure Mustard Oil'],
      colors: ['#b45309', '#0284c7'],
    },
    {
      type: 'bushes',
      names: ['MARKET HEDGE', 'GREEN BUSH'],
      subtitles: ['Trimmed Hedge', 'Market Boundary'],
      colors: ['#16a34a', '#15803d'],
    },
    {
      type: 'electric_pole',
      names: ['UTILITY POLE', 'POWER LINE'],
      subtitles: ['Market Grid', 'Overhead Wires'],
      colors: ['#64748b', '#475569'],
    },
    {
      type: 'ad_board',
      names: ['TAZA SABZI SALE', 'ORGANIC MANGOES'],
      subtitles: ['Discount Today', 'Direct from Farm'],
      colors: ['#ca8a04', '#15803d'],
    },
  ],

  // Level 3: Bus Stop (Bus shelters, shops, waiting benches, posters, small cafes)
  2: [
    {
      type: 'bus_stop',
      names: ['DTC BUS SHELTER', 'ROUTE 108 STOP', 'CITY BUS STAND'],
      subtitles: ['Next: College Gate', 'Every 10 Mins', 'Fare ₹10'],
      colors: ['#0284c7', '#2563eb', '#1d4ed8'],
    },
    {
      type: 'roadside_bench',
      names: ['COMMUTER BENCH', 'PASSENGER REST', 'SHADED SEAT'],
      subtitles: ['Sit & Wait', 'Senior Citizen', 'Bus Queue'],
      colors: ['#334155', '#475569', '#78350f'],
    },
    {
      type: 'cafe',
      names: ['BUS STAND CAFE', 'CUTTING CHAI & BUN', 'CORNER BAKERY'],
      subtitles: ['Hot Patties', 'Butter Toast', 'Tea & Coffee'],
      colors: ['#ea580c', '#d97706', '#b45309'],
    },
    {
      type: 'ad_board',
      names: ['EXAM SUCCESS COACHING', 'METRO SMART CARD'],
      subtitles: ['Admissions Open', 'Recharge Here'],
      colors: ['#e11d48', '#0284c7'],
    },
    {
      type: 'street_sign',
      names: ['COLLEGE BUS ROUTE', 'PEDESTRIAN CROSSING'],
      subtitles: ['Speed Limit 30', 'Bus Bay Ahead'],
      colors: ['#15803d', '#0369a1'],
    },
    {
      type: 'dustbin',
      names: ['MUNICIPAL BIN', 'KEEP STAND CLEAN'],
      subtitles: ['Dry Waste', 'Clean India'],
      colors: ['#16a34a', '#0284c7'],
    },
  ],

  // Level 4: School Road (Stationery shops, school signs, houses, trees, small cafes)
  3: [
    {
      type: 'stationery_shop',
      names: ['STUDENT BOOK DEPOT', 'XEROX & SPIRAL BIND', 'VIDYARTHI STORE'],
      subtitles: ['Exam Clipboards', 'Pens & Calculators', 'Question Banks'],
      colors: ['#2563eb', '#0284c7', '#4f46e5'],
    },
    {
      type: 'street_sign',
      names: ['SCHOOL ZONE 🚸', 'GO SLOW: STUDENTS', 'SILENCE ZONE'],
      subtitles: ['Max Speed 20', 'Exam Center 500m', 'Honk Free'],
      colors: ['#ca8a04', '#dc2626', '#15803d'],
    },
    {
      type: 'bicycle_parking',
      names: ['CYCLE STAND', 'STUDENT CYCLE RACK'],
      subtitles: ['Lock Cycles', 'Token ₹5'],
      colors: ['#475569', '#334155'],
    },
    {
      type: 'brick_wall',
      names: ['SCHOOL BOUNDARY', 'CAMPUS COMPOUND'],
      subtitles: ['Padhoge Likhoge', 'Knowledge is Power'],
      colors: ['#b45309', '#9a3412'],
    },
    {
      type: 'tree_small',
      names: ['SHADY NEEM TREE', 'ASHOKA TREE'],
      subtitles: ['Clean Air', 'School Avenue'],
      colors: ['#15803d', '#166534'],
    },
    {
      type: 'cafe',
      names: ['STUDENT CANTEEN', 'SAMOSA & MAGGI'],
      subtitles: ['Pocket Friendly', 'Hot Snacks'],
      colors: ['#ea580c', '#eab308'],
    },
  ],

  // Level 5: Rainy Street (Shops with tarpaulin, umbrellas, covered stalls, bushes)
  4: [
    {
      type: 'shop_awning',
      names: ['CHHATA BHANDAR', 'RAIN COVERED STORE', 'MONSOON SNACKS'],
      subtitles: ['Waterproof Tarpaulin', 'Pakora & Tea', 'Hot Chai'],
      colors: ['#0284c7', '#0891b2', '#0d9488'],
    },
    {
      type: 'cafe',
      names: ['MONSOON TAPRI', 'ADRAK WALI CHAI'],
      subtitles: ['Ginger Tea ₹15', 'Bread Pakoda'],
      colors: ['#d97706', '#ea580c'],
    },
    {
      type: 'general_store',
      names: ['RAINWEAR & PROVISIONS', 'CITY GENERAL MART'],
      subtitles: ['Umbrellas & Ponchos', 'Daily Essentials'],
      colors: ['#2563eb', '#4f46e5'],
    },
    {
      type: 'bushes',
      names: ['WET GREEN BUSH', 'RAIN-WASHED HEDGE'],
      subtitles: ['Lush Leaves', 'Clean & Wet'],
      colors: ['#059669', '#10b981'],
    },
    {
      type: 'electric_pole',
      names: ['WET UTILITY POLE', 'POWER JUNCTION'],
      subtitles: ['Caution Wet Wires', 'BSES Line'],
      colors: ['#475569', '#334155'],
    },
  ],

  // Level 6: Main Market (Dense shops, cafes, signboards, advertisement boards)
  5: [
    {
      type: 'shop_awning',
      names: ['ROYAL CLOTH MART', 'FOOTWEAR PLAZA', 'MOBILE REPAIR'],
      subtitles: ['Big Discounts', 'All Brands', 'Quick Screen Fix'],
      colors: ['#dc2626', '#e11d48', '#9333ea'],
    },
    {
      type: 'cafe',
      names: ['CAFE COFFEE CORNER', 'PUNJABI LASSI BAR'],
      subtitles: ['Espresso & Shakes', 'Thandi Malai Lassi'],
      colors: ['#ea580c', '#d97706'],
    },
    {
      type: 'ad_board',
      names: ['MEGA FESTIVAL SALE', 'SMARTPHONE 50% OFF'],
      subtitles: ['Limited Offer', 'Main Market Branch'],
      colors: ['#ca8a04', '#e11d48'],
    },
    {
      type: 'stationery_shop',
      names: ['SUPER XEROX & TECH', 'PEN CORNER'],
      subtitles: ['Color Prints ₹5', 'Stationery Gifts'],
      colors: ['#2563eb', '#0284c7'],
    },
    {
      type: 'street_sign',
      names: ['MAIN MARKET ROAD', 'ONE WAY ->'],
      subtitles: ['Crowded Lane', 'Pedestrian Walkway'],
      colors: ['#15803d', '#0369a1'],
    },
    {
      type: 'dustbin',
      names: ['SMART SWACHH BIN', 'SEGREGATED BIN'],
      subtitles: ['Keep Market Clean', 'Zero Litter'],
      colors: ['#16a34a', '#2563eb'],
    },
  ],

  // Level 7: Big Traffic Signal (Commercial buildings, traffic signs, bus stop, lights)
  6: [
    {
      type: 'building_residential',
      names: ['COMMERCIAL TOWER', 'PLAZA COMPLEX', 'OFFICE SUITES'],
      subtitles: ['Floor 1-4', 'Bank & Corporate', 'Signal Chowk'],
      colors: ['#e2e8f0', '#cbd5e1', '#94a3b8'],
    },
    {
      type: 'street_sign',
      names: ['TRAFFIC SIGNAL CHOWK', 'COLLEGE ROAD 1.2 KM'],
      subtitles: ['Stop on Red', 'Turn Left Allowed'],
      colors: ['#dc2626', '#15803d'],
    },
    {
      type: 'bus_stop',
      names: ['SIGNAL JUNCTION BUS BAY', 'EXPRESS FEEDER'],
      subtitles: ['Platform A', 'Next Stop: College'],
      colors: ['#0284c7', '#2563eb'],
    },
    {
      type: 'roadside_bench',
      names: ['SIGNAL REST BENCH', 'SHADED SEAT'],
      subtitles: ['Pedestrian Rest', 'Under Lamppost'],
      colors: ['#334155', '#475569'],
    },
    {
      type: 'electric_pole',
      names: ['TRAFFIC LIGHT POST', 'CCTV SURVEILLANCE'],
      subtitles: ['E-Challan Zone', 'High Mast Light'],
      colors: ['#475569', '#1e293b'],
    },
    {
      type: 'ad_board',
      names: ['DRIVE SAFE LIFE SAFE', 'TRAFFIC POLICE NOTICE'],
      subtitles: ['Wear Helmet Always', 'Speed Radar Active'],
      colors: ['#1d4ed8', '#b91c1c'],
    },
  ],

  // Level 8: Flyover / Underpass (Concrete pillars, walls, street lights, small kiosks)
  7: [
    {
      type: 'flyover_pillar',
      names: ['PILLAR NO. 42', 'METRO PILLAR 108', 'FLYOVER COLUMN'],
      subtitles: ['Prestressed Concrete', 'National Highway', 'Underpass Link'],
      colors: ['#64748b', '#94a3b8', '#475569'],
    },
    {
      type: 'brick_wall',
      names: ['HIGHWAY RETAINING WALL', 'UNDERPASS PARAPET'],
      subtitles: ['Hazard Striping', 'Concrete Barrier'],
      colors: ['#475569', '#334155'],
    },
    {
      type: 'ad_board',
      names: ['SPEED CAMERA AHEAD', 'NHAI ROADWAY SIGN'],
      subtitles: ['Speed Limit 40', 'Toll 5km Ahead'],
      colors: ['#ca8a04', '#15803d'],
    },
    {
      type: 'electric_pole',
      names: ['HIGHWAY HIGH MAST', 'STREET LIGHT POLE'],
      subtitles: ['LED 150W', 'Night Illumination'],
      colors: ['#64748b', '#cbd5e1'],
    },
    {
      type: 'shop_awning',
      names: ['PILLAR CHAI KIOSK', 'FLYOVER COLD DRINKS'],
      subtitles: ['Water & Snacks', 'Quick Sip'],
      colors: ['#ea580c', '#0284c7'],
    },
  ],

  // Level 9: Peak Hour (Dense urban buildings, shops, bus stops, busy street decor)
  8: [
    {
      type: 'general_store',
      names: ['SUPERMART PROVISIONS', 'CITY DEPARTMENT STORE'],
      subtitles: ['All Household Needs', 'Open 8am-11pm'],
      colors: ['#2563eb', '#0284c7'],
    },
    {
      type: 'stationery_shop',
      names: ['EXAM STATIONERY HUB', 'FAST XEROX POINT'],
      subtitles: ['Admit Card Prints', 'Blue & Black Pens'],
      colors: ['#4f46e5', '#7c3aed'],
    },
    {
      type: 'cafe',
      names: ['SPEEDY CHAI & BUN', 'IRANI CAFE'],
      subtitles: ['Bun Maska ₹25', 'Irani Chai'],
      colors: ['#d97706', '#b45309'],
    },
    {
      type: 'bus_stop',
      names: ['PEAK HOUR EXPRESS STOP', 'COLLEGE SHUTTLE'],
      subtitles: ['Heavy Rush', 'Next Bus 2 Min'],
      colors: ['#0284c7', '#dc2626'],
    },
    {
      type: 'bicycle_parking',
      names: ['COMMUTER BIKE STAND', 'CYCLE BAY'],
      subtitles: ['Stand Closed 9pm', 'Token System'],
      colors: ['#334155', '#475569'],
    },
    {
      type: 'ad_board',
      names: ['EXAM TIMER RUNNING OUT!', 'REACH BEFORE 9:00 AM'],
      subtitles: ['Hall Closes on Time', 'Best of Luck!'],
      colors: ['#dc2626', '#ea580c'],
    },
  ],

  // Level 10: Final College Road (Clean road, university campus walls, college gate, bookstore)
  9: [
    {
      type: 'stationery_shop',
      names: ['COLLEGE BOOKSTORE', 'OFFICIAL SYLLABUS DEPOT', 'ENGINEERING COPIES'],
      subtitles: ['Lab Manuals & Drafters', 'Formula Handbooks', 'Original Textbooks'],
      colors: ['#1d4ed8', '#1e40af'],
    },
    {
      type: 'cafe',
      names: ['CAMPUS NESCAFE', 'COLLEGE COFFEE BAR', 'DEAN\'S TEA TAPRI'],
      subtitles: ['Cold Coffee ₹30', 'Grilled Sandwiches', 'Campus Hangout'],
      colors: ['#b45309', '#ea580c'],
    },
    {
      type: 'tree_small',
      names: ['CAMPUS ASHOKA TREE', 'ROYAL PALM', 'BOUGAINVILLEA TREE'],
      subtitles: ['University Greenery', 'Shaded Campus Walk'],
      colors: ['#15803d', '#166534', '#047857'],
    },
    {
      type: 'brick_wall',
      names: ['COLLEGE HERITAGE WALL', 'UNIVERSITY BOUNDARY'],
      subtitles: ['Estd. 1958', 'Excellence in Education'],
      colors: ['#9a3412', '#78350f'],
    },
    {
      type: 'street_sign',
      names: ['GOVT ENGG COLLEGE ->', 'EXAM HALL BUILDING A', 'GATE NO. 1 AHEAD'],
      subtitles: ['100m to Finish', 'Admit Card Ready', 'Final Stretch!'],
      colors: ['#15803d', '#0369a1'],
    },
    {
      type: 'roadside_bench',
      names: ['CAMPUS MEMORIAL BENCH', 'STUDENT LOUNGE BENCH'],
      subtitles: ['Batch of 2024', 'Study Tree'],
      colors: ['#334155', '#475569'],
    },
    {
      type: 'potted_plants',
      names: ['ORNAMENTAL PALMS', 'MARIGOLD FLOWER POTS'],
      subtitles: ['Campus Beautification', 'Fragrant Blossoms'],
      colors: ['#ea580c', '#15803d'],
    },
  ],
};

export class EnvironmentManager {
  private nextId: number = 1;

  // Generate a random prop appropriate for current level
  public getRandomProp(
    levelIndex: number,
    side: 'left' | 'right',
    y: number,
    sidewalkWidth: number
  ): RoadsideProp {
    const clampedLevel = Math.max(0, Math.min(9, levelIndex));
    const pool = LEVEL_PROP_POOLS[clampedLevel] || LEVEL_PROP_POOLS[0];
    const item = pool[Math.floor(Math.random() * pool.length)];

    const name = item.names[Math.floor(Math.random() * item.names.length)];
    const subtitle = item.subtitles[Math.floor(Math.random() * item.subtitles.length)];
    const color = item.colors[Math.floor(Math.random() * item.colors.length)];

    // Standard responsive widths tailored to fit sidewalk zone nicely
    let w = Math.min(110, Math.max(55, sidewalkWidth - 12));
    let h = 60;

    switch (item.type) {
      case 'building_residential':
        h = 95;
        break;
      case 'cafe':
      case 'stationery_shop':
      case 'general_store':
      case 'shop_awning':
        h = 75;
        break;
      case 'bus_stop':
        h = 65;
        break;
      case 'brick_wall':
        h = 50;
        break;
      case 'flyover_pillar':
        h = 70;
        w = Math.min(65, w);
        break;
      case 'tree_small':
        h = 55;
        w = Math.min(50, w);
        break;
      case 'bushes':
      case 'potted_plants':
        h = 35;
        w = Math.min(42, w);
        break;
      case 'electric_pole':
        h = 60;
        w = Math.min(30, w);
        break;
      case 'roadside_bench':
      case 'bicycle_parking':
        h = 42;
        w = Math.min(48, w);
        break;
      case 'street_sign':
      case 'dustbin':
        h = 40;
        w = Math.min(36, w);
        break;
      case 'ad_board':
        h = 52;
        break;
      case 'sabzi_stall':
        h = 65;
        break;
      default:
        h = 60;
        break;
    }

    // Depth tiering (some set slightly back for 2.5D layered feel)
    const depth: 'front' | 'back' = Math.random() > 0.4 ? 'front' : 'back';
    const offsetX = Math.random() * 8;
    const variant = Math.floor(Math.random() * 4);

    return {
      id: this.nextId++,
      side,
      y,
      type: item.type,
      name,
      subtitle,
      color,
      width: w,
      height: h,
      depth,
      offsetX,
      variant,
    };
  }

  // Populate initial left and right environment streams
  public createInitialProps(
    canvasHeight: number,
    sidewalkWidth: number,
    levelIndex: number
  ): RoadsideProp[] {
    const props: RoadsideProp[] = [];
    const minSpacing = 80;
    const maxSpacing = 125;

    // LEFT SIDE: Spans from top offscreen (-250) to bottom offscreen (canvasHeight + 250)
    let leftY = -250;
    while (leftY < canvasHeight + 250) {
      props.push(this.getRandomProp(levelIndex, 'left', leftY, sidewalkWidth));
      leftY += minSpacing + Math.random() * (maxSpacing - minSpacing);
    }

    // RIGHT SIDE: Staggered with an offset so the two sides never mirror each other
    let rightY = -210;
    while (rightY < canvasHeight + 250) {
      props.push(this.getRandomProp(levelIndex, 'right', rightY, sidewalkWidth));
      rightY += minSpacing + Math.random() * (maxSpacing - minSpacing);
    }

    return props;
  }

  // Update scrolling positions and recycle out-of-screen props
  public updateProps(
    props: RoadsideProp[],
    roadPixelSpeed: number,
    dt: number,
    canvasHeight: number,
    sidewalkWidth: number,
    levelIndex: number
  ): void {
    const minSpacing = 85;
    const maxSpacing = 135;

    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      p.y += roadPixelSpeed * dt;

      // When prop scrolls well below bottom of the viewport, recycle to top
      if (p.y > canvasHeight + 200) {
        // Find topmost prop on this same side
        let minY = 0;
        for (let j = 0; j < props.length; j++) {
          if (props[j].side === p.side && props[j].y < minY) {
            minY = props[j].y;
          }
        }

        const newY = minY - (minSpacing + Math.random() * (maxSpacing - minSpacing));
        const freshProp = this.getRandomProp(levelIndex, p.side, newY, sidewalkWidth);

        // Mutate in-place to preserve object pool memory
        p.y = freshProp.y;
        p.type = freshProp.type;
        p.name = freshProp.name;
        p.subtitle = freshProp.subtitle;
        p.color = freshProp.color;
        p.width = freshProp.width;
        p.height = freshProp.height;
        p.depth = freshProp.depth;
        p.offsetX = freshProp.offsetX;
        p.variant = freshProp.variant;
      }
    }
  }
}

export const environmentManager = new EnvironmentManager();
