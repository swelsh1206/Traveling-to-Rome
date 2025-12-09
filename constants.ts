import { Profession, CharacterStats, HuntableAnimal, Gender } from './types';

// Game year range constants
export const MIN_YEAR = 1450;
export const MAX_YEAR = 1800;
export const YEAR_RANGE = MAX_YEAR - MIN_YEAR + 1; // 351 years

// Difficulty constants
export const HARD_MODE_MIN_DISTANCE = 1400; // Hard mode: only cities 1400km+ from Rome
export const HARD_MODE_NOBLE_CHANCE = 0.002; // 0.2% for Royal/NobleWoman in hard mode (vs 0.5% normal)
export const HARD_MODE_SCHOLAR_F_CHANCE = 0.01; // 1% for Scholar_F in hard mode (vs 2% normal)

export const TOTAL_DISTANCE_TO_ROME = 1400; // km, approximate from central France (deprecated - use STARTING_CITIES)

// Starting Cities across Europe (excluding Italy) with distances to Rome in km
export interface StartingCity {
  name: string;
  region: string;
  distance: number;
  liege: string; // Top political entity ruling this location during the time period (default, may vary by year)
}

// Get historically accurate political entity based on location and year
export function getLiegeForYear(city: StartingCity, year: number): string {
  // British Isles - England & Scotland unite in 1707
  if ((city.region === 'England' || city.region === 'Scotland') && year >= 1707) {
    return 'Kingdom of Great Britain';
  }

  // Spain - Castile and Aragon unite in 1516
  if ((city.liege === 'Kingdom of Castile' || city.liege === 'Crown of Aragon') && year >= 1516) {
    return 'Spanish Empire';
  }

  // Portugal - under Spanish control 1580-1640
  if (city.liege === 'Kingdom of Portugal') {
    if (year >= 1580 && year < 1640) {
      return 'Spanish Empire (Portuguese Rule)';
    }
  }

  // Dutch Republic - independence from Spain in 1581
  if (city.region === 'Netherlands') {
    if (year < 1581) {
      return 'Spanish Netherlands';
    }
  }

  // Brandenburg becomes Kingdom of Prussia in 1701
  if (city.liege === 'Brandenburg-Prussia' && year >= 1701) {
    return 'Kingdom of Prussia';
  }

  // Default: return the base liege
  return city.liege;
}

export const STARTING_CITIES: StartingCity[] = [
  // France
  { name: 'Paris', region: 'France', distance: 1400, liege: 'Kingdom of France' },
  { name: 'Lyon', region: 'France', distance: 700, liege: 'Kingdom of France' },
  { name: 'Marseille', region: 'France', distance: 500, liege: 'Kingdom of France' },
  { name: 'Bordeaux', region: 'France', distance: 1300, liege: 'Kingdom of France' },
  { name: 'Toulouse', region: 'France', distance: 1100, liege: 'Kingdom of France' },
  { name: 'Rouen', region: 'France', distance: 1550, liege: 'Kingdom of France' },
  { name: 'Orléans', region: 'France', distance: 1350, liege: 'Kingdom of France' },
  { name: 'Strasbourg', region: 'France', distance: 900, liege: 'Holy Roman Empire' },
  { name: 'Dijon', region: 'France', distance: 850, liege: 'Kingdom of France' },
  { name: 'Reims', region: 'France', distance: 1350, liege: 'Kingdom of France' },
  { name: 'L\'Épine', region: 'France', distance: 1320, liege: 'Kingdom of France' },
  { name: 'Mantes-la-Jolie', region: 'France', distance: 1420, liege: 'Kingdom of France' },

  // British Isles
  { name: 'London', region: 'England', distance: 1850, liege: 'Kingdom of England' },
  { name: 'York', region: 'England', distance: 2000, liege: 'Kingdom of England' },
  { name: 'Bristol', region: 'England', distance: 1900, liege: 'Kingdom of England' },
  { name: 'Edinburgh', region: 'Scotland', distance: 2300, liege: 'Kingdom of Scotland' },
  { name: 'Dublin', region: 'Ireland', distance: 2400, liege: 'Kingdom of Ireland' },
  { name: 'Glasgow', region: 'Scotland', distance: 2350, liege: 'Kingdom of Scotland' },

  // Iberian Peninsula
  { name: 'Madrid', region: 'Spain', distance: 1700, liege: 'Kingdom of Castile' },
  { name: 'Barcelona', region: 'Spain', distance: 1000, liege: 'Crown of Aragon' },
  { name: 'Seville', region: 'Spain', distance: 2000, liege: 'Kingdom of Castile' },
  { name: 'Valencia', region: 'Spain', distance: 1150, liege: 'Crown of Aragon' },
  { name: 'Lisbon', region: 'Portugal', distance: 2300, liege: 'Kingdom of Portugal' },
  { name: 'Porto', region: 'Portugal', distance: 2200, liege: 'Kingdom of Portugal' },
  { name: 'Zaragoza', region: 'Spain', distance: 1300, liege: 'Crown of Aragon' },

  // Low Countries
  { name: 'Amsterdam', region: 'Netherlands', distance: 1650, liege: 'Dutch Republic' },
  { name: 'Brussels', region: 'Spanish Netherlands', distance: 1500, liege: 'Spanish Empire' },
  { name: 'Antwerp', region: 'Spanish Netherlands', distance: 1550, liege: 'Spanish Empire' },
  { name: 'The Hague', region: 'Netherlands', distance: 1650, liege: 'Dutch Republic' },

  // Holy Roman Empire / German States
  { name: 'Vienna', region: 'Austria', distance: 850, liege: 'Habsburg Monarchy' },
  { name: 'Prague', region: 'Bohemia', distance: 1100, liege: 'Kingdom of Bohemia (HRE)' },
  { name: 'Munich', region: 'Bavaria', distance: 700, liege: 'Duchy of Bavaria (HRE)' },
  { name: 'Berlin', region: 'Brandenburg', distance: 1650, liege: 'Brandenburg-Prussia' },
  { name: 'Hamburg', region: 'Free City', distance: 1850, liege: 'Free Imperial City (HRE)' },
  { name: 'Cologne', region: 'Archbishopric of Cologne', distance: 1450, liege: 'Electorate of Cologne (HRE)' },
  { name: 'Frankfurt', region: 'Free City', distance: 1250, liege: 'Free Imperial City (HRE)' },
  { name: 'Nuremberg', region: 'Free City', distance: 1000, liege: 'Free Imperial City (HRE)' },
  { name: 'Augsburg', region: 'Free City', distance: 850, liege: 'Free Imperial City (HRE)' },
  { name: 'Dresden', region: 'Saxony', distance: 1350, liege: 'Electorate of Saxony (HRE)' },

  // Switzerland
  { name: 'Geneva', region: 'Switzerland', distance: 650, liege: 'Old Swiss Confederacy' },
  { name: 'Zurich', region: 'Switzerland', distance: 750, liege: 'Old Swiss Confederacy' },
  { name: 'Basel', region: 'Switzerland', distance: 900, liege: 'Old Swiss Confederacy' },
  { name: 'Mulhouse', region: 'Swiss Canton of Basel', distance: 820, liege: 'Old Swiss Confederacy' },
  { name: 'Bern', region: 'Switzerland', distance: 800, liege: 'Old Swiss Confederacy' },

  // Italian States
  { name: 'Milan', region: 'Duchy of Milan', distance: 500, liege: 'Duchy of Milan' },
  { name: 'Genoa', region: 'Republic of Genoa', distance: 450, liege: 'Republic of Genoa' },
  { name: 'Florence', region: 'Grand Duchy of Tuscany', distance: 350, liege: 'Grand Duchy of Tuscany' },
  { name: 'Venice', region: 'Republic of Venice', distance: 450, liege: 'Republic of Venice' },
  { name: 'Bologna', region: 'Papal States', distance: 250, liege: 'Papal States' },
  { name: 'Turin', region: 'Duchy of Savoy', distance: 600, liege: 'Duchy of Savoy' },

  // Scandinavia
  { name: 'Stockholm', region: 'Sweden', distance: 2400, liege: 'Kingdom of Sweden' },
  { name: 'Copenhagen', region: 'Denmark', distance: 1850, liege: 'Kingdom of Denmark-Norway' },
  { name: 'Oslo', region: 'Norway', distance: 2450, liege: 'Kingdom of Denmark-Norway' },

  // Eastern Europe
  { name: 'Warsaw', region: 'Poland', distance: 1550, liege: 'Polish-Lithuanian Commonwealth' },
  { name: 'Krakow', region: 'Poland', distance: 1200, liege: 'Polish-Lithuanian Commonwealth' },
  { name: 'Budapest', region: 'Hungary', distance: 950, liege: 'Kingdom of Hungary (Habsburg)' },
  { name: 'Bratislava', region: 'Hungary', distance: 900, liege: 'Kingdom of Hungary (Habsburg)' },

  // Balkans (northern areas)
  { name: 'Dubrovnik', region: 'Dalmatia', distance: 600, liege: 'Republic of Ragusa' },
  { name: 'Split', region: 'Dalmatia', distance: 550, liege: 'Republic of Venice' },
];

// Legacy - kept for backwards compatibility
export const FRENCH_STARTING_CITIES = STARTING_CITIES
  .filter(city => city.region === 'France')
  .map(city => city.name);

// Filter cities by difficulty
export const getStartingCitiesForDifficulty = (difficulty: 'normal' | 'hard'): StartingCity[] => {
  if (difficulty === 'hard') {
    return STARTING_CITIES.filter(city => city.distance >= HARD_MODE_MIN_DISTANCE);
  }
  return STARTING_CITIES; // Normal mode: all cities available
};

// Gender symbols
export const GENDER_SYMBOLS = {
  Male: '♂️',
  Female: '♀️',
};

// Professions by gender
export const MALE_PROFESSIONS = [
  Profession.Merchant,
  Profession.Priest,
  Profession.Soldier,
  Profession.Blacksmith,
  Profession.Scholar,
  Profession.Apothecary,
  Profession.Royal,
];

export const FEMALE_PROFESSIONS = [
  Profession.Merchant_F,
  Profession.Nun,
  Profession.Midwife,
  Profession.Herbalist,
  Profession.Scholar_F,
  Profession.NobleWoman,
];

// Legacy route checkpoints (for Paris to Rome - deprecated)
// Now dynamically generated based on starting city
export const ROUTE_CHECKPOINTS = [
    { name: 'Dijon', distance: 300 },
    { name: 'Lyon', distance: 450 },
    { name: 'Chambéry', distance: 600 },
    { name: 'Turin', distance: 750 },
    { name: 'Genoa', distance: 900 },
    { name: 'Pisa', distance: 1050 },
    { name: 'Florence', distance: 1150 },
    { name: 'Siena', distance: 1275 },
];

// Generate route checkpoints based on starting city
export const generateRouteCheckpoints = (startingCity: StartingCity): Array<{ name: string; distance: number }> => {
  const totalDistance = startingCity.distance;
  const checkpoints: Array<{ name: string; distance: number }> = [];

  // Generate 5-10 checkpoints evenly spaced along the route - more smaller towns for realism
  const numCheckpoints = Math.max(5, Math.min(10, Math.floor(totalDistance / 200) + 3)); // Roughly every 200km
  const spacing = totalDistance / (numCheckpoints + 1);

  // Expanded waypoint pool with more variety and historical specificity
  const waypointPool = [
    // Religious sites
    'a pilgrimage shrine', 'a monastery', 'an abbey', 'a bishop\'s seat', 'a cathedral town',
    'a hermitage', 'a convent', 'a priory', 'a holy spring', 'a reliquary chapel',

    // Fortified settlements
    'a fortified town', 'a walled city', 'a frontier garrison', 'a border fortress',
    'a castle town', 'a citadel', 'a stronghold', 'a watchpost village',

    // Trade & commerce
    'a market town', 'a trading post', 'a merchant crossroads', 'a guild town',
    'a toll station', 'a customs house', 'a fairground town', 'a caravan stop',

    // Geographic features
    'a river crossing', 'a mountain pass', 'a valley settlement', 'a bridge town',
    'a ford village', 'a mountain hamlet', 'a lakeside village', 'a hilltop town',

    // Administrative & political
    'a free city', 'a ducal town', 'a county seat', 'a provincial capital',
    'a magistrate\'s town', 'a border town', 'a chartered town',

    // Small settlements
    'a wayside inn', 'a farming village', 'a crossroads hamlet', 'a mill town',
    'a mining village', 'a forest settlement', 'a roadside shrine', 'a coaching station',

    // Historical types
    'a plague-survivor village', 'a rebuilt settlement', 'a refugee camp', 'a war-torn village',
    'a former battlefield', 'a contested border post', 'a neutral meeting ground'
  ];

  // Shuffle the pool to ensure variety
  const shuffledPool = [...waypointPool].sort(() => Math.random() - 0.5);

  for (let i = 1; i <= numCheckpoints; i++) {
    const distance = Math.round(spacing * i);
    // Use different waypoints without repetition when possible
    const waypointName = shuffledPool[(i - 1) % shuffledPool.length];
    checkpoints.push({
      name: waypointName,
      distance: distance
    });
  }

  return checkpoints;
};

export const PROFESSION_STATS: Record<Profession, CharacterStats> = {
  [Profession.Merchant]: {
    ducats: 500,
    food: 30, // Reduced from 100 - food is scarce and valuable
    oxen: 2,
    description: "Trader seeking new markets and trade opportunities in Rome. Gets a 15% bonus on sales and 15% discount on purchases at markets.",
    inventory: {
      'Fine Silks': 2,
      'Spices': 2,
      'Bandages': 3,
      'Rope': 2,
      'Cloth': 3,
      'Wood': 2,
      'Compass': 1,
    },
  },
  [Profession.Priest]: {
    ducats: 250,
    food: 35, // Reduced from 120 - relies on charity
    oxen: 0,
    description: "Man of God seeking spiritual renewal in Rome. Respected by others and may receive help more easily. Can craft Holy Water.",
    inventory: {
      'Holy Symbol': 1,
      'Bandages': 5,
      'Prayer Book': 1,
      'Cloth': 3,
      'Rope': 2,
      'Wood': 2,
    },
  },
  [Profession.Soldier]: {
    ducats: 300,
    food: 25, // Reduced from 80 - expects to hunt/forage
    oxen: 2,
    description: "Veteran warrior traveling to Rome for work or escaping conflict. Hardy and resourceful, better at handling threats. Receives +10% bonus to hunting success.",
    inventory: {
      'Jerky': 8,
      'Bandages': 4,
      'Rope': 3,
      'Wood': 4,
      'Cloth': 2,
      'Metal Scraps': 2,
    },
  },
  [Profession.Blacksmith]: {
      ducats: 350,
      food: 28, // Reduced from 100
      oxen: 2,
      description: "Skilled craftsman seeking better opportunities in Rome. Can repair wagons using scrap metal while camped. Can craft repair kits.",
      inventory: {
        'Metal Scraps': 6,
        'Hammer': 1,
        'Bandages': 3,
        'Wood': 4,
        'Rope': 3,
        'Cloth': 2,
      },
  },
  [Profession.Scholar]: {
      ducats: 200,
      food: 30, // Reduced from 100
      oxen: 0,
      description: "Learned scholar traveling to study ancient texts and Roman knowledge. Can read ancient texts and maps. Gains insight from books.",
      inventory: {
        'Scholarly Tome': 1,
        'Ink & Quill': 2,
        'Bandages': 3,
        'Rope': 2,
        'Cloth': 3,
        'Wood': 2,
      },
  },
  [Profession.Apothecary]: {
      ducats: 275,
      food: 32, // Reduced from 110
      oxen: 0,
      description: "Healer traveling to Rome to study medical knowledge. Can forage for medicinal herbs while camped. Expert in healing remedies.",
      inventory: {
        'Medicinal Herbs': 4,
        'Bandages': 5,
        'Cloth': 4,
        'Rope': 2,
        'Wood': 2,
        'Honey': 2,
      },
  },
  [Profession.Royal]: {
      ducats: 2000,
      food: 60, // Reduced from 200 - even nobles face scarcity
      oxen: 4,
      description: "Noble of exceptional wealth and privilege making a grand journey to Rome. Travels with an entourage and receives preferential treatment. Extremely rare.",
      inventory: {
        'Fine Silks': 4,
        'Wine': 8,
        'Healing Poultice': 4,
        'Bandages': 10,
        'Rope': 4,
        'Wood': 5,
        'Cloth': 5,
        'Metal Scraps': 3,
        'Compass': 1,
        'Map': 1,
      },
  },
  // Female professions
  [Profession.Nun]: {
    ducats: 200,
    food: 32, // Reduced from 110
    oxen: 0,
    description: "Sister devoted to God, making a sacred journey to Rome. Respected in religious circles. Can provide spiritual guidance and has access to church resources.",
    inventory: {
      'Holy Symbol': 1,
      'Prayer Book': 1,
      'Bandages': 5,
      'Medicinal Herbs': 2,
      'Cloth': 4,
      'Rope': 2,
      'Wood': 2,
    },
  },
  [Profession.Midwife]: {
    ducats: 250,
    food: 30, // Reduced from 100
    oxen: 0,
    description: "Healer traveling to Rome to learn advanced medical practices. Skilled in healing and childbirth. Trusted in communities for medical knowledge and herbal remedies.",
    inventory: {
      'Bandages': 6,
      'Medicinal Herbs': 4,
      'Cloth': 5,
      'Rope': 2,
      'Wood': 2,
      'Honey': 2,
    },
  },
  [Profession.Herbalist]: {
    ducats: 260,
    food: 32, // Reduced from 105
    oxen: 0,
    description: "Healer traveling to Rome to discover rare herbs and remedies. Expert in plants and natural remedies. Can forage for medicinal herbs and craft healing items.",
    inventory: {
      'Medicinal Herbs': 5,
      'Bandages': 4,
      'Cloth': 4,
      'Rope': 2,
      'Wood': 3,
      'Honey': 3,
    },
  },
  [Profession.NobleWoman]: {
    ducats: 1500,
    food: 55, // Reduced from 180
    oxen: 3,
    description: "Noblewoman of high birth making a grand journey to Rome. Commands respect and can leverage social connections.",
    inventory: {
      'Fine Silks': 3,
      'Wine': 6,
      'Healing Poultice': 3,
      'Bandages': 8,
      'Rope': 3,
      'Wood': 4,
      'Cloth': 4,
      'Metal Scraps': 2,
      'Compass': 1,
    },
  },
  [Profession.Merchant_F]: {
    ducats: 480,
    food: 28, // Reduced from 95
    oxen: 2,
    description: "Savvy trader seeking new markets and trade opportunities in Rome. Built her business against societal odds. Gets a 15% bonus on sales and 15% discount on purchases at markets.",
    inventory: {
      'Fine Silks': 2,
      'Spices': 2,
      'Bandages': 3,
      'Rope': 2,
      'Cloth': 3,
      'Wood': 2,
      'Compass': 1,
    },
  },
  [Profession.Scholar_F]: {
    ducats: 190,
    food: 28, // Reduced from 95
    oxen: 0,
    description: "Rare woman of letters traveling to study ancient texts and Roman knowledge. Exceptionally educated. Faces societal barriers but possesses valuable knowledge.",
    inventory: {
      'Scholarly Tome': 1,
      'Ink & Quill': 2,
      'Bandages': 3,
      'Rope': 2,
      'Cloth': 3,
      'Wood': 2,
    },
  },
};

export const HUNTABLE_ANIMALS: HuntableAnimal[] = [
    { name: 'Rabbit', successChance: 85, foodYield: [2, 5], injuryRisk: 0, description: "A small, quick target. High chance of success for a small meal." },
    { name: 'Pheasant', successChance: 70, foodYield: [6, 9], injuryRisk: 0, description: "A beautiful game bird. Good eating and moderate difficulty." },
    { name: 'Fox', successChance: 55, foodYield: [5, 8], injuryRisk: 5, description: "Cunning and fast. Not much meat, but a challenge to catch." },
    { name: 'Deer', successChance: 60, foodYield: [10, 18], injuryRisk: 10, description: "A wary creature. A good prize, but it might escape or lash out if cornered." },
    { name: 'Wild Boar', successChance: 40, foodYield: [20, 30], injuryRisk: 30, description: "A dangerous and aggressive beast. Very rewarding, but failure is often painful." },
    { name: 'Wolf', successChance: 30, foodYield: [8, 13], injuryRisk: 45, description: "Extremely dangerous. Only the desperate or brave would hunt one." },
    { name: 'Flock of Birds', successChance: 75, foodYield: [4, 8], injuryRisk: 0, description: "Requires a quick eye. A decent meal with little risk." },
    { name: 'Wild Goat', successChance: 65, foodYield: [9, 14], injuryRisk: 8, description: "Lives in rocky terrain. Agile and can be dangerous when cornered." },
    { name: 'Hare', successChance: 80, foodYield: [3, 6], injuryRisk: 0, description: "Larger than a rabbit. Very quick but offers a decent meal." },
    { name: 'Duck', successChance: 72, foodYield: [5, 8], injuryRisk: 0, description: "Found near water. Easy to hunt and good for roasting." },
];

export const ITEM_PRICES: Record<string, { buy: number, sell: number }> = {
    'Food': { buy: 6, sell: 3 }, // Increased from 2/1 - food is scarce and expensive
    'Arrows': { buy: 3, sell: 1 }, // Ammunition for hunting
    'Mules': { buy: 100, sell: 70 },
    'Wood': { buy: 5, sell: 2 }, // Basic crafting material
    'Metal Scraps': { buy: 15, sell: 8 }, // Same as Scrap Metal for consistency
    'Cloth': { buy: 8, sell: 4 }, // Basic fabric for bandages
    'Bandages': { buy: 10, sell: 5 },
    'Medicinal Herbs': { buy: 25, sell: 12 },
    'Jerky': { buy: 5, sell: 2 },
    'Fine Silks': { buy: 0, sell: 50 },
    'Spices': { buy: 0, sell: 30 },
    'Scrap Metal': { buy: 15, sell: 8 },
    'Wagon Repair Kit': { buy: 75, sell: 40 },
    'Wine': { buy: 20, sell: 15 },
    'Holy Water': { buy: 30, sell: 20 },
    'Rope': { buy: 8, sell: 4 },
    'Lantern Oil': { buy: 12, sell: 6 },
    'Warm Clothing': { buy: 35, sell: 18 },
    'Dried Fruit': { buy: 7, sell: 3 },
    'Cheese Wheel': { buy: 15, sell: 8 },
    'Salted Fish': { buy: 10, sell: 5 },
    'Leather Boots': { buy: 40, sell: 20 },
    'Healing Poultice': { buy: 50, sell: 25 },
    'Iron Rations': { buy: 18, sell: 9 },
    'Cooking Pot': { buy: 25, sell: 12 },
    'Bedroll': { buy: 30, sell: 15 },
    'Tinderbox': { buy: 10, sell: 5 },
    'Whetstone': { buy: 15, sell: 8 },
    'Candles': { buy: 5, sell: 2 },
    'Prayer Book': { buy: 20, sell: 10 },
    'Compass': { buy: 60, sell: 40 },
    'Map': { buy: 35, sell: 20 },
    'Herbal Tea': { buy: 8, sell: 4 },
    'Honey': { buy: 12, sell: 6 },
    'Scholarly Letter': { buy: 0, sell: 15 },
    'Ancient Knowledge': { buy: 0, sell: 40 },
    'Luxury Bundle': { buy: 0, sell: 100 },
    'Field Provisions': { buy: 0, sell: 20 },
    'Iron Nails': { buy: 12, sell: 6 },
};

export const ITEM_ICONS: Record<string, string> = {
    'Arrows': '🏹',
    'Wood': '🪵',
    'Metal Scraps': '🔩',
    'Cloth': '🧵',
    'Bandages': '🩹',
    'Medicinal Herbs': '🌿',
    'Healing Poultice': '💊',
    'Jerky': '🥓',
    'Dried Fruit': '🍇',
    'Cheese Wheel': '🧀',
    'Salted Fish': '🐟',
    'Wine': '🍷',
    'Holy Water': '💧',
    'Herbal Tea': '🍵',
    'Honey': '🍯',
    'Wagon Repair Kit': '🔧',
    'Warm Clothing': '🧥',
    'Leather Boots': '🥾',
    'Field Provisions': '🎒',
    'Iron Rations': '📦',
    'Bread Loaf': '🍞',
    'Fine Silks': '🧵',
    'Spices': '🌶️',
    'Scrap Metal': '🔩',
    'Rope': '🪢',
    'Lantern Oil': '🪔',
    'Tinderbox': '🔥',
    'Whetstone': '🪨',
    'Candles': '🕯️',
    'Prayer Book': '📖',
    'Compass': '🧭',
    'Map': '🗺️',
    'Scholarly Letter': '✉️',
    'Ancient Knowledge': '📜',
    'Luxury Bundle': '🎁',
    'Iron Nails': '🔨',
    'Cooking Pot': '🍲',
    'Bedroll': '🛏️',
    'Holy Symbol': '✝️',
    'Ink & Quill': '🖋️',
    'Scholarly Tome': '📚',
    'Mortar and Pestle': '⚗️',
    'Hammer': '🔨',
    'Sharpening Stone': '🪨',
};

// Comprehensive item descriptions for ALL items
export const ITEM_DESCRIPTIONS: Record<string, string> = {
    // Crafting materials
    'Wood': "Sturdy timber suitable for crafting. Can be carved into arrows or used for repairs. Wood was the primary building material in medieval Europe.",
    'Metal Scraps': "Pieces of scrap iron and steel. Useful for crafting and repairs. Iron was precious - smiths salvaged every scrap for reuse.",
    'Cloth': "Basic fabric material. Can be torn into bandages or used for other purposes. Most cloth was wool or linen; cotton was rare and expensive.",

    // Ammunition
    'Arrows': "Wooden arrows with iron tips. Essential for hunting game. English longbowmen could shoot 12 arrows per minute at 200+ yards.",

    // Consumables with effects
    'Bandages': "Linen strips for binding wounds. Bloodletting and bandaging were primary medical treatments. Clean bandages could prevent deadly infection.",
    'Medicinal Herbs': "Collected herbs with healing properties. Medieval herbalists used hundreds of plants: willow bark (aspirin), mint (digestion), chamomile (sleep).",
    'Healing Poultice': "A powerful medicinal paste that treats wounds and sickness. Poultices combined honey, herbs, and animal fat - surprisingly effective.",
    'Jerky': "Dried, salted meat. Salt preservation was essential before refrigeration. A pound of salt cost a day's wages for a laborer.",
    'Dried Fruit': "Sun-dried fruits preserve nutrition for months. Sailors relied on dried fruit to prevent scurvy on long voyages.",
    'Cheese Wheel': "Aged cheese, rich in calories. Hard cheeses could last 6+ months without spoiling - crucial for long journeys.",
    'Salted Fish': "Fish preserved in salt. Salted cod fed Catholic Europe during the many 'fast days' when meat was forbidden by the Church.",
    'Wine': "Fortified wine. Safer than water, which was often contaminated. Even children drank diluted wine daily in southern Europe.",
    'Holy Water': "Blessed water from a sacred source. The Church taught that holy water could ward off evil spirits and cure illness.",
    'Herbal Tea': "Dried herbs steeped in hot water. Tea from Asia was extremely rare and expensive - this is local European herbs.",
    'Honey': "Natural sweetener with medicinal properties. The only sweetener before sugar imports. Honey never spoils - archaeologists found edible honey in Egyptian tombs.",
    'Wagon Repair Kit': "Tools and spare parts for fixing broken wheels. Wagon wheels broke constantly on rough roads - repair skills were essential.",
    'Warm Clothing': "Woolen garments lined with fur. Wool stayed warm even when wet. Fur was a status symbol reserved for nobility by sumptuary laws.",
    'Leather Boots': "Well-crafted boots. Good boots were expensive - worth several weeks' wages. Poor people wrapped feet in cloth.",
    'Field Provisions': "Complete military rations. Armies moved on their stomachs - feeding soldiers was the main logistical challenge of warfare.",
    'Iron Rations': "Hardtack biscuits and dried meat. Hardtack could last years but was so hard it could break teeth. Soldiers soaked it in water or wine.",
    'Bread Loaf': "Fresh-baked bread. Bread was the staple food - the poor ate 2-3 pounds daily. A bad harvest meant famine and starvation.",

    // Trade goods
    'Fine Silks': "Luxurious silk from China via the Silk Road. Worth its weight in silver. Venice controlled the European silk trade.",
    'Spices': "Exotic spices: pepper, cinnamon, cloves, nutmeg. Spices were worth more than gold per pound - used to preserve meat and show wealth.",

    // Crafting materials & tools
    'Scrap Metal': "Pieces of iron and steel. Iron ore mining and smelting were major industries. A single nail took a blacksmith several minutes to forge.",
    'Rope': "Strong hemp rope. Ships required miles of rope for rigging. Rope-making was a specialized craft - hemp had to be twisted into strands.",
    'Lantern Oil': "Refined whale oil or plant oil. Artificial lighting was expensive - most people lived by sunlight and went to bed at dusk.",
    'Tinderbox': "Flint, steel, and char cloth. Starting a fire took skill and 5-10 minutes. People kept embers alive overnight to avoid relighting.",
    'Whetstone': "Sharpening stone for blades. A dull blade was dangerous and inefficient. Soldiers sharpened weapons daily.",
    'Candles': "Tallow (animal fat) or beeswax candles. Beeswax candles were 10x more expensive but burned cleaner. Churches used beeswax for the altar.",
    'Iron Nails': "Forged iron nails. Before mass production, nails were valuable. People burned down abandoned buildings to salvage the nails.",
    'Cooking Pot': "Iron pot for cooking. A family's cooking pot was a prized possession, often their most valuable item after their home.",
    'Bedroll': "Canvas and wool bedding. Most peasants slept on straw pallets. A wool blanket was a luxury.",
    'Hammer': "Blacksmith's hammer. Blacksmiths were essential to every village - they made and repaired all metal tools and horseshoes.",
    'Sharpening Stone': "Fine-grained whetstone. Natural whetstones from certain quarries were traded across Europe for their superior quality.",

    // Religious & scholarly items
    'Holy Symbol': "Sacred crucifix or saint's medallion. Wearing religious symbols was socially expected. Failure to display them could invite heresy accusations.",
    'Prayer Book': "Book of prayers and psalms. Before the Reformation, prayer books were in Latin. Most people couldn't read them but treasured them.",
    'Ink & Quill': "Goose feather quill and iron-gall ink. Literacy was rare and precious. Scribes were well-paid professionals.",
    'Scholarly Tome': "Handwritten manuscript. Before printing, books were copied by hand and worth a year's wages. Universities had libraries of mere hundreds of books.",
    'Scholarly Letter': "Letter of introduction. Letters opened doors and established credibility. Universities formed networks across Europe through correspondence.",
    'Ancient Knowledge': "Rare classical texts from Greece or Rome. Renaissance scholars desperately sought lost classical manuscripts in monastery libraries.",

    // Navigation
    'Compass': "Magnetic compass. Invented in China, brought to Europe via Arab traders. Revolutionized navigation by enabling travel in fog and at night.",
    'Map': "Detailed map. Most maps were wildly inaccurate. Precise cartography emerged during the Age of Exploration (1500s).",

    // Apothecary
    'Mortar and Pestle': "Stone tools for grinding herbs and medicines. Apothecaries ground ingredients fresh - no pre-made medicines existed.",

    // Luxury
    'Luxury Bundle': "Fine goods and delicacies: perfumes, sugar, imported fabrics. Luxury goods demonstrated wealth and status in a rigidly hierarchical society.",
};

export const ITEM_EFFECTS: Record<string, { description: string; removesCondition?: string, health_change?: number }> = {
    'Bandages': {
        description: "Treats wounds and stops bleeding.",
        removesCondition: 'Wounded',
    },
    'Medicinal Herbs': {
        description: "Raw herbs to fight infection and sickness.",
        removesCondition: 'Diseased',
    },
    'Healing Poultice': {
        description: "A powerful remedy that treats both wounds and illness.",
        removesCondition: 'Diseased',
        health_change: 15,
    },
    'Jerky': {
        description: "A small, preserved meal. Restores a bit of vitality.",
        health_change: 2,
    },
    'Dried Fruit': {
        description: "Sweet and nutritious. Boosts morale and health.",
        health_change: 3,
    },
    'Cheese Wheel': {
        description: "Rich and filling. Restores substantial health.",
        health_change: 5,
    },
    'Salted Fish': {
        description: "Preserved seafood. Restores moderate health.",
        health_change: 4,
    },
    'Wine': {
        description: "Fortified wine that warms the spirit and body.",
        health_change: 3,
    },
    'Holy Water': {
        description: "Blessed water with restorative properties.",
        removesCondition: 'Exhausted',
        health_change: 5,
    },
    'Herbal Tea': {
        description: "Soothing tea that reduces exhaustion.",
        removesCondition: 'Exhausted',
        health_change: 2,
    },
    'Honey': {
        description: "Natural sweetness with healing properties.",
        health_change: 4,
    },
    'Wagon Repair Kit': {
        description: "Everything needed to repair a damaged axle or wheel.",
        removesCondition: 'Broken Wagon',
    },
    'Warm Clothing': {
        description: "Protects against cold weather conditions.",
        health_change: 3,
    },
    'Leather Boots': {
        description: "Sturdy footwear that helps with travel fatigue.",
        health_change: 2,
    },
    'Field Provisions': {
        description: "Soldier's rations. Very filling and restorative.",
        removesCondition: 'Starving',
        health_change: 8,
    },
    'Iron Rations': {
        description: "Military-grade preserved food. Very restorative.",
        removesCondition: 'Starving',
        health_change: 6,
    },
    'Bread Loaf': {
        description: "Fresh bread that fills the belly and cures hunger.",
        removesCondition: 'Starving',
        health_change: 5,
    },
    'Bedroll': {
        description: "Comfortable sleeping gear. Removes exhaustion and restores health.",
        removesCondition: 'Exhausted',
        health_change: 8,
    },
    'Cooking Pot': {
        description: "Allows proper meal preparation. Significantly boosts health.",
        health_change: 10,
    },
};

export const CRAFTING_RECIPES = [
    // Universal recipes (available to all)
    {
        profession: null, // null means available to everyone
        item: 'Wood',
        requires: 'Metal Scraps',
        result: 'Arrows',
        resultQuantity: 10,
        description: 'You craft 10 arrows from wood and metal scraps.',
        cost: { 'Wood': 1, 'Metal Scraps': 1 }
    },
    {
        profession: null,
        item: 'Wood',
        result: 'Arrows',
        resultQuantity: 5,
        description: 'You whittle 5 crude arrows from wood (less effective without metal tips).',
        cost: { 'Wood': 2 }
    },
    {
        profession: null,
        item: 'Cloth',
        requires: 'Rope',
        result: 'Bandages',
        resultQuantity: 3,
        description: 'You tear cloth and bind it with rope to make 3 bandages.',
        cost: { 'Cloth': 1, 'Rope': 1 }
    },
    // Profession-specific recipes
    {
        profession: Profession.Scholar,
        item: 'Ink & Quill',
        result: 'Scholarly Letter',
        description: 'You spend time writing a letter to a colleague in the next city.',
    },
    {
        profession: Profession.Scholar,
        item: 'Scholarly Tome',
        result: 'Ancient Knowledge',
        description: 'You decipher an ancient text, gaining insight that may help the journey.',
    },
    {
        profession: Profession.Apothecary,
        item: 'Medicinal Herbs',
        requires: 'Mortar and Pestle',
        result: 'Healing Poultice',
        description: 'You grind the herbs into a potent healing poultice.',
    },
    {
        profession: Profession.Apothecary,
        item: 'Honey',
        requires: 'Medicinal Herbs',
        result: 'Herbal Tea',
        description: 'You brew a soothing herbal tea with honey.',
    },
    {
        profession: Profession.Blacksmith,
        item: 'Scrap Metal',
        requires: 'Hammer',
        result: 'Wagon Repair Kit',
        description: 'You forge the scrap metal into useful wagon repair components.',
    },
    {
        profession: Profession.Blacksmith,
        item: 'Scrap Metal',
        requires: 'Hammer',
        result: 'Iron Nails',
        description: 'You hammer out sturdy iron nails from scrap metal.',
    },
    {
        profession: Profession.Merchant,
        item: 'Fine Silks',
        requires: 'Spices',
        result: 'Luxury Bundle',
        description: 'You package fine goods together to fetch a better price.',
    },
    {
        profession: Profession.Soldier,
        item: 'Sharpening Stone',
        requires: 'Jerky',
        result: 'Field Provisions',
        description: 'You prepare efficient travel rations like a soldier on campaign.',
    },
    {
        profession: Profession.Priest,
        item: 'Holy Symbol',
        requires: 'Prayer Book',
        result: 'Holy Water',
        description: 'You perform a blessing ritual to sanctify water.',
    },
    {
        profession: Profession.Royal,
        item: 'Wine',
        requires: 'Fine Silks',
        result: 'Luxury Bundle',
        description: 'Your noble connections allow you to create extravagant trade bundles.',
    },
    // Female professions
    {
        profession: Profession.Nun,
        item: 'Holy Symbol',
        requires: 'Prayer Book',
        result: 'Holy Water',
        description: 'You perform a blessing ritual to sanctify water.',
    },
    {
        profession: Profession.Midwife,
        item: 'Medicinal Herbs',
        requires: 'Honey',
        result: 'Healing Poultice',
        description: 'You craft a powerful healing remedy from your knowledge of medicine.',
    },
    {
        profession: Profession.Herbalist,
        item: 'Medicinal Herbs',
        requires: 'Mortar and Pestle',
        result: 'Healing Poultice',
        description: 'You grind the herbs into a potent healing poultice.',
    },
    {
        profession: Profession.Herbalist,
        item: 'Honey',
        requires: 'Medicinal Herbs',
        result: 'Herbal Tea',
        description: 'You brew a soothing herbal tea with honey.',
    },
    {
        profession: Profession.NobleWoman,
        item: 'Wine',
        requires: 'Fine Silks',
        result: 'Luxury Bundle',
        description: 'Your noble connections allow you to create extravagant trade bundles.',
    },
    {
        profession: Profession.Merchant_F,
        item: 'Fine Silks',
        requires: 'Spices',
        result: 'Luxury Bundle',
        description: 'You package fine goods together to fetch a better price.',
    },
    {
        profession: Profession.Scholar_F,
        item: 'Ink & Quill',
        result: 'Scholarly Letter',
        description: 'You spend time writing a letter to a colleague in the next city.',
    },
    {
        profession: Profession.Scholar_F,
        item: 'Scholarly Tome',
        result: 'Ancient Knowledge',
        description: 'You decipher an ancient text, gaining insight that may help the journey.',
    },
];


export const INITIAL_HEALTH = 100;
export const INITIAL_STAMINA = 100;
export const MAX_INVENTORY_SLOTS = 20; // Maximum number of different item types

// Starting equipment by profession
export const PROFESSION_EQUIPMENT: Record<Profession, { weapon?: string; armor?: string; tool?: string }> = {
  [Profession.Merchant]: {
    tool: 'Compass',
  },
  [Profession.Priest]: {
    tool: 'Prayer Book',
  },
  [Profession.Soldier]: {
    weapon: 'Sword',
    armor: 'Leather Armor',
  },
  [Profession.Blacksmith]: {
    weapon: 'Hammer',
    tool: 'Smith\'s Tools',
  },
  [Profession.Scholar]: {
    tool: 'Ancient Tome',
  },
  [Profession.Apothecary]: {
    tool: 'Medicine Kit',
  },
  [Profession.Royal]: {
    weapon: 'Rapier',
    armor: 'Fine Doublet',
  },
  // Female professions
  [Profession.Nun]: {
    tool: 'Prayer Book',
  },
  [Profession.Midwife]: {
    tool: 'Medicine Kit',
  },
  [Profession.Herbalist]: {
    tool: 'Herb Gathering Kit',
  },
  [Profession.NobleWoman]: {
    armor: 'Fine Gown',
    tool: 'Noble Seal',
  },
  [Profession.Merchant_F]: {
    tool: 'Compass',
  },
  [Profession.Scholar_F]: {
    tool: 'Ancient Tome',
  },
};

// Starting skills by profession
export const PROFESSION_SKILLS: Record<Profession, Skills> = {
  [Profession.Merchant]: { combat: 15, diplomacy: 40, survival: 20, medicine: 10, stealth: 30, knowledge: 25 },
  [Profession.Priest]: { combat: 5, diplomacy: 35, survival: 15, medicine: 30, stealth: 10, knowledge: 45 },
  [Profession.Soldier]: { combat: 50, diplomacy: 15, survival: 35, medicine: 20, stealth: 25, knowledge: 10 },
  [Profession.Blacksmith]: { combat: 35, diplomacy: 20, survival: 30, medicine: 15, stealth: 15, knowledge: 15 },
  [Profession.Scholar]: { combat: 8, diplomacy: 30, survival: 12, medicine: 25, stealth: 15, knowledge: 50 },
  [Profession.Apothecary]: { combat: 12, diplomacy: 20, survival: 25, medicine: 50, stealth: 18, knowledge: 35 },
  [Profession.Royal]: { combat: 25, diplomacy: 50, survival: 15, medicine: 20, stealth: 10, knowledge: 40 },
  // Female professions
  [Profession.Nun]: { combat: 5, diplomacy: 40, survival: 18, medicine: 35, stealth: 12, knowledge: 45 },
  [Profession.Midwife]: { combat: 8, diplomacy: 25, survival: 22, medicine: 50, stealth: 15, knowledge: 30 },
  [Profession.Herbalist]: { combat: 10, diplomacy: 20, survival: 35, medicine: 45, stealth: 25, knowledge: 30 },
  [Profession.NobleWoman]: { combat: 5, diplomacy: 50, survival: 10, medicine: 22, stealth: 13, knowledge: 42 },
  [Profession.Merchant_F]: { combat: 10, diplomacy: 45, survival: 18, medicine: 15, stealth: 32, knowledge: 28 },
  [Profession.Scholar_F]: { combat: 5, diplomacy: 35, survival: 10, medicine: 28, stealth: 12, knowledge: 52 },
};

export const FRENCH_MALE_NAMES = [
    "Jean", "Pierre", "Louis", "Antoine", "Philippe", "Charles", "Henri", "Michel",
    "François", "Jacques", "Nicolas", "Claude", "Étienne", "Guillaume", "Gaspard",
    "Matthieu", "Baptiste", "Alexandre", "Sébastien", "Christophe", "Vincent", "Blaise"
];

export const FRENCH_FEMALE_NAMES = [
    "Marie", "Jeanne", "Catherine", "Marguerite", "Anne", "Françoise", "Isabelle",
    "Élisabeth", "Madeleine", "Louise", "Charlotte", "Geneviève", "Claire", "Agnès",
    "Suzanne", "Hélène", "Thérèse", "Jacqueline"
];

export const FRENCH_LAST_NAMES = [
    "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand",
    "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "David",
    "Bertrand", "Morel", "Fournier", "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine",
    "Rousseau", "Vincent", "Muller", "Blanc", "Gauthier", "Garcia"
];

export const NOBLE_TITLES = ["de", "du", "le", "la"];