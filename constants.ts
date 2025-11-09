import { Profession, CharacterStats, HuntableAnimal, Gender } from './types';

export const TOTAL_DISTANCE_TO_ROME = 1400; // km, approximate from central France

// Starting Cities in France (Early Modern Period)
export const FRENCH_STARTING_CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Toulouse',
  'Rouen',
  'Orléans',
  'Tours',
  'Dijon',
  'Reims',
];

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

export const PROFESSION_STATS: Record<Profession, CharacterStats> = {
  [Profession.Merchant]: {
    money: 500,
    food: 100,
    oxen: 2,
    description: "Starts with more money and gets a 15% bonus on sales and 15% discount on purchases at markets.",
    inventory: {
      'Fine Silks': 2,
      'Spices': 3,
      'Bandages': 2,
      'Wine': 2,
      'Compass': 1,
      'Dried Fruit': 5,
    },
  },
  [Profession.Priest]: {
    money: 250,
    food: 120,
    oxen: 1,
    description: "Respected by others, may receive help more easily. Can craft Holy Water.",
    inventory: {
      'Holy Symbol': 1,
      'Bandages': 5,
      'Prayer Book': 1,
      'Candles': 3,
      'Holy Water': 2,
    },
  },
  [Profession.Soldier]: {
    money: 300,
    food: 80,
    oxen: 2,
    description: "Hardy and resourceful, better at handling threats. Receives +10% bonus to hunting success.",
    inventory: {
      'Sharpening Stone': 1,
      'Jerky': 10,
      'Bandages': 3,
      'Rope': 2,
      'Iron Rations': 5,
      'Whetstone': 1,
    },
  },
  [Profession.Blacksmith]: {
      money: 350,
      food: 100,
      oxen: 2,
      description: "Can repair the wagon using scrap metal while camped. Can craft repair kits.",
      inventory: {
        'Scrap Metal': 5,
        'Hammer': 1,
        'Bandages': 2,
        'Iron Nails': 3,
        'Tinderbox': 1,
        'Rope': 1,
      },
  },
  [Profession.Scholar]: {
      money: 200,
      food: 100,
      oxen: 1,
      description: "Knowledgeable, can read ancient texts and maps. Gains insight from books.",
      inventory: {
        'Scholarly Tome': 1,
        'Ink & Quill': 3,
        'Bandages': 2,
        'Map': 1,
        'Candles': 2,
        'Lantern Oil': 2,
      },
  },
  [Profession.Apothecary]: {
      money: 275,
      food: 110,
      oxen: 1,
      description: "Can forage for medicinal herbs while camped. Expert in healing remedies.",
      inventory: {
        'Medicinal Herbs': 5,
        'Mortar and Pestle': 1,
        'Bandages': 3,
        'Honey': 3,
        'Herbal Tea': 2,
        'Dried Fruit': 3,
      },
  },
  [Profession.Royal]: {
      money: 2000,
      food: 200,
      oxen: 4,
      description: "Of noble blood and exceptional wealth. Travels with an entourage and receives preferential treatment. Extremely rare.",
      inventory: {
        'Fine Silks': 5,
        'Wine': 10,
        'Healing Poultice': 5,
        'Holy Water': 3,
        'Compass': 1,
        'Map': 1,
        'Cheese Wheel': 10,
        'Prayer Book': 1,
        'Luxury Bundle': 2,
        'Iron Rations': 20,
        'Bandages': 10,
      },
  },
  // Female professions
  [Profession.Nun]: {
    money: 200,
    food: 110,
    oxen: 1,
    description: "Devoted to God, respected in religious circles. Can provide spiritual guidance and has access to church resources.",
    inventory: {
      'Holy Symbol': 1,
      'Prayer Book': 1,
      'Bandages': 4,
      'Holy Water': 3,
      'Candles': 4,
      'Medicinal Herbs': 2,
      'Herbal Tea': 2,
    },
  },
  [Profession.Midwife]: {
    money: 250,
    food: 100,
    oxen: 1,
    description: "Skilled in healing and childbirth. Trusted in communities for medical knowledge and herbal remedies.",
    inventory: {
      'Bandages': 6,
      'Medicinal Herbs': 4,
      'Honey': 3,
      'Healing Poultice': 2,
      'Herbal Tea': 3,
      'Dried Fruit': 3,
    },
  },
  [Profession.Herbalist]: {
    money: 260,
    food: 105,
    oxen: 1,
    description: "Expert in plants and natural remedies. Can forage for medicinal herbs and craft healing items.",
    inventory: {
      'Medicinal Herbs': 6,
      'Mortar and Pestle': 1,
      'Bandages': 3,
      'Honey': 4,
      'Herbal Tea': 3,
      'Dried Fruit': 4,
      'Salted Fish': 2,
    },
  },
  [Profession.NobleWoman]: {
    money: 1500,
    food: 180,
    oxen: 3,
    description: "Of high birth with considerable wealth and influence. Commands respect and can leverage social connections.",
    inventory: {
      'Fine Silks': 4,
      'Wine': 8,
      'Healing Poultice': 4,
      'Holy Water': 2,
      'Compass': 1,
      'Map': 1,
      'Cheese Wheel': 8,
      'Prayer Book': 1,
      'Luxury Bundle': 1,
      'Iron Rations': 15,
      'Bandages': 8,
      'Warm Clothing': 2,
    },
  },
  [Profession.Merchant_F]: {
    money: 480,
    food: 95,
    oxen: 2,
    description: "Savvy trader who built her business against societal odds. Gets a 15% bonus on sales and 15% discount on purchases at markets.",
    inventory: {
      'Fine Silks': 2,
      'Spices': 2,
      'Bandages': 2,
      'Wine': 2,
      'Compass': 1,
      'Dried Fruit': 4,
      'Cheese Wheel': 3,
    },
  },
  [Profession.Scholar_F]: {
    money: 190,
    food: 95,
    oxen: 1,
    description: "Rare woman of letters, exceptionally educated. Faces societal barriers but possesses valuable knowledge.",
    inventory: {
      'Scholarly Tome': 1,
      'Ink & Quill': 3,
      'Bandages': 2,
      'Map': 1,
      'Candles': 2,
      'Lantern Oil': 2,
      'Prayer Book': 1,
    },
  },
};

export const HUNTABLE_ANIMALS: HuntableAnimal[] = [
    { name: 'Rabbit', successChance: 85, foodYield: [5, 10], injuryRisk: 0, description: "A small, quick target. High chance of success for a small meal." },
    { name: 'Pheasant', successChance: 70, foodYield: [12, 18], injuryRisk: 0, description: "A beautiful game bird. Good eating and moderate difficulty." },
    { name: 'Fox', successChance: 55, foodYield: [10, 15], injuryRisk: 5, description: "Cunning and fast. Not much meat, but a challenge to catch." },
    { name: 'Deer', successChance: 60, foodYield: [20, 35], injuryRisk: 10, description: "A wary creature. A good prize, but it might escape or lash out if cornered." },
    { name: 'Wild Boar', successChance: 40, foodYield: [40, 60], injuryRisk: 30, description: "A dangerous and aggressive beast. Very rewarding, but failure is often painful." },
    { name: 'Wolf', successChance: 30, foodYield: [15, 25], injuryRisk: 45, description: "Extremely dangerous. Only the desperate or brave would hunt one." },
    { name: 'Flock of Birds', successChance: 75, foodYield: [8, 15], injuryRisk: 0, description: "Requires a quick eye. A decent meal with little risk." },
    { name: 'Wild Goat', successChance: 65, foodYield: [18, 28], injuryRisk: 8, description: "Lives in rocky terrain. Agile and can be dangerous when cornered." },
    { name: 'Hare', successChance: 80, foodYield: [6, 12], injuryRisk: 0, description: "Larger than a rabbit. Very quick but offers a decent meal." },
    { name: 'Duck', successChance: 72, foodYield: [10, 16], injuryRisk: 0, description: "Found near water. Easy to hunt and good for roasting." },
];

export const ITEM_PRICES: Record<string, { buy: number, sell: number }> = {
    'Food': { buy: 2, sell: 1 },
    'Oxen': { buy: 100, sell: 70 },
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
    // Consumables with effects
    'Bandages': "Linen strips for binding wounds. Essential for treating injuries on the road.",
    'Medicinal Herbs': "Collected herbs with healing properties. Can treat illness or be crafted into remedies.",
    'Healing Poultice': "A powerful medicinal paste that treats both wounds and sickness.",
    'Jerky': "Dried, salted meat. Portable and long-lasting sustenance for travelers.",
    'Dried Fruit': "Sun-dried fruits preserve nutrition. Sweet and energy-restoring.",
    'Cheese Wheel': "Aged cheese, rich in calories. A valuable food source for long journeys.",
    'Salted Fish': "Fish preserved in salt. Common fare for travelers near waterways.",
    'Wine': "Fortified wine from French vineyards. Warms the body and lifts spirits.",
    'Holy Water': "Blessed water from a sacred source. Believed to have restorative powers.",
    'Herbal Tea': "Dried herbs steeped in hot water. Soothes the mind and reduces fatigue.",
    'Honey': "Natural sweetener with medicinal properties. Helps heal and energize.",
    'Wagon Repair Kit': "Tools and spare parts for fixing broken wheels and axles.",
    'Warm Clothing': "Woolen garments lined with fur. Protection against harsh weather.",
    'Leather Boots': "Well-crafted boots that protect feet during long marches.",
    'Field Provisions': "Complete military rations. Designed to sustain soldiers on campaign.",
    'Iron Rations': "Hardtack, dried meat, and preserved foods. Military-grade sustenance.",
    'Bread Loaf': "Fresh-baked bread, still warm. The most basic and satisfying of foods.",

    // Trade goods
    'Fine Silks': "Luxurious silk fabrics from the East. Valuable trade commodity worth good coin.",
    'Spices': "Exotic spices from distant lands. Highly sought after by merchants and nobles.",

    // Crafting materials & tools
    'Scrap Metal': "Pieces of iron and steel. Used by blacksmiths for repairs and crafting.",
    'Rope': "Strong hemp rope. Useful for many purposes from securing loads to climbing.",
    'Lantern Oil': "Refined oil for lamps and lanterns. Provides light during dark nights.",
    'Tinderbox': "Flint, steel, and char cloth for starting fires. Essential survival tool.",
    'Whetstone': "Sharpening stone for maintaining blades and tools in good condition.",
    'Candles': "Tallow or beeswax candles. Provide light for reading and nighttime tasks.",
    'Iron Nails': "Forged iron nails. Useful for repairs and construction.",
    'Cooking Pot': "Iron pot for preparing meals. Allows cooking of proper hot food.",
    'Bedroll': "Canvas and wool bedding. Provides comfort and warmth while camping.",
    'Hammer': "Blacksmith's hammer. Essential tool for metalwork and repairs.",
    'Sharpening Stone': "Fine-grained whetstone. Keeps weapons and tools razor-sharp.",

    // Religious & scholarly items
    'Holy Symbol': "Sacred religious icon. Provides spiritual comfort and identifies you as faithful.",
    'Prayer Book': "Book of prayers and psalms. Used for daily devotions and finding peace.",
    'Ink & Quill': "Writing implements. Scholars use these to record observations and write letters.",
    'Scholarly Tome': "Ancient manuscript containing knowledge. Requires careful study to understand.",
    'Scholarly Letter': "Letter of introduction to scholars in other cities. Opens doors and builds connections.",
    'Ancient Knowledge': "Rare insights from old texts. Valuable information that aids the journey.",

    // Navigation
    'Compass': "Magnetic compass for navigation. Helps maintain proper direction even in poor weather.",
    'Map': "Detailed map of routes to Rome. Shows cities, roads, and major landmarks.",

    // Apothecary
    'Mortar and Pestle': "Stone tools for grinding herbs. Essential for an apothecary's work.",

    // Luxury
    'Luxury Bundle': "Collection of fine goods and delicacies. Status symbol and trade item.",
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
};

export const CRAFTING_RECIPES = [
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

export const STARTING_CITIES = [
    "Paris", "Orléans", "Tours", "Bourges", "Nevers", "Moulins", "Clermont", "Roanne"
];