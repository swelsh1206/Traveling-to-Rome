import { Profession, CharacterStats, HuntableAnimal } from './types';

export const TOTAL_DISTANCE_TO_ROME = 1400; // km, approximate from central France

export const ROUTE_CHECKPOINTS = [
    { name: 'Lyon', distance: 450 },
    { name: 'Turin', distance: 750 },
    { name: 'Florence', distance: 1150 },
];

export const PROFESSION_STATS: Record<Profession, CharacterStats> = {
  [Profession.Merchant]: {
    money: 500,
    food: 100,
    oxen: 2,
    description: "Starts with more money and gets a 15% bonus on sales and 15% discount on purchases at markets.",
    inventory: { 'Fine Silks': 2, 'Spices': 3, 'Bandages': 2 },
  },
  [Profession.Priest]: {
    money: 250,
    food: 120,
    oxen: 1,
    description: "Respected by others, may receive help more easily.",
    inventory: { 'Holy Symbol': 1, 'Bandages': 5 },
  },
  [Profession.Soldier]: {
    money: 300,
    food: 80,
    oxen: 2,
    description: "Hardy and resourceful, better at handling threats. Receives a bonus to hunting success.",
    inventory: { 'Sharpening Stone': 1, 'Jerky': 10, 'Bandages': 3 },
  },
  [Profession.Blacksmith]: {
      money: 350,
      food: 100,
      oxen: 2,
      description: "Can repair the wagon using scrap metal while camped.",
      inventory: { 'Scrap Metal': 5, 'Hammer': 1, 'Bandages': 2 },
  },
  [Profession.Scholar]: {
      money: 200,
      food: 100,
      oxen: 1,
      description: "Knowledgeable, can read ancient texts and maps.",
      inventory: { 'Scholarly Tome': 1, 'Ink & Quill': 3, 'Bandages': 2 },
  },
  [Profession.Apothecary]: {
      money: 275,
      food: 110,
      oxen: 1,
      description: "Can forage for medicinal herbs while camped.",
      inventory: { 'Medicinal Herbs': 5, 'Mortar and Pestle': 1, 'Bandages': 3 },
  }
};

export const HUNTABLE_ANIMALS: HuntableAnimal[] = [
    { name: 'Rabbit', successChance: 85, foodYield: [5, 10], injuryRisk: 0, description: "A small, quick target. High chance of success for a small meal." },
    { name: 'Deer', successChance: 60, foodYield: [20, 35], injuryRisk: 10, description: "A wary creature. A good prize, but it might escape or lash out if cornered." },
    { name: 'Wild Boar', successChance: 40, foodYield: [40, 60], injuryRisk: 30, description: "A dangerous and aggressive beast. Very rewarding, but failure is often painful." },
    { name: 'Flock of Birds', successChance: 75, foodYield: [8, 15], injuryRisk: 0, description: "Requires a quick eye. A decent meal with little risk." },
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
};

export const ITEM_EFFECTS: Record<string, { description: string; removesCondition?: string, health_change?: number }> = {
    'Bandages': {
        description: "Treats wounds.",
        removesCondition: 'Injured',
    },
    'Medicinal Herbs': {
        description: "A poultice to fight infection.",
        removesCondition: 'Sick',
    },
    'Jerky': {
        description: "A small, quick meal.",
        health_change: 2,
    },
    'Wagon Repair Kit': {
        description: "Everything needed to repair a damaged axle or wheel.",
        removesCondition: 'Wagon Damaged',
    }
};

export const CRAFTING_RECIPES = [
    {
        profession: Profession.Scholar,
        item: 'Ink & Quill',
        result: 'Scholarly Letter',
        description: 'You spend some time writing a letter, perhaps to a colleague in a university in the next city.',
    },
    {
        profession: Profession.Apothecary,
        item: 'Medicinal Herbs',
        requires: 'Mortar and Pestle',
        result: 'Healing Poultice',
        description: 'You carefully grind the herbs into a potent healing poultice, which may be more effective than raw herbs.',
    },
];


export const INITIAL_HEALTH = 100;

export const FRENCH_MALE_NAMES = ["Jean", "Pierre", "Louis", "Antoine", "Philippe", "Charles", "Henri", "Michel"];
export const FRENCH_FEMALE_NAMES = ["Marie", "Jeanne", "Catherine", "Marguerite", "Anne", "Françoise", "Isabelle"];
export const FRENCH_LAST_NAMES = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand"];