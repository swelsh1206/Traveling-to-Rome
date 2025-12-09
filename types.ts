export enum Profession {
  // Male professions
  Merchant = 'Merchant',
  Priest = 'Priest',
  Soldier = 'Soldier',
  Blacksmith = 'Blacksmith',
  Scholar = 'Scholar',
  Apothecary = 'Apothecary',
  Royal = 'Royal',
  // Female professions
  Nun = 'Nun',
  Midwife = 'Midwife',
  Herbalist = 'Herbalist',
  NobleWoman = 'Noble Woman',
  Merchant_F = 'Merchant',
  Scholar_F = 'Scholar',
}

export type Gender = 'Male' | 'Female';

export type Difficulty = 'normal' | 'hard';

export type Religion = 'Catholic' | 'Protestant';

export type SocialClass = 'Peasant' | 'Craftsman' | 'Merchant Class' | 'Minor Nobility' | 'High Nobility';

export type JourneyReason =
  | 'Seeking Spiritual Renewal'  // For religious professions
  | 'Penance for Past Deeds'     // For religious professions
  | 'Seeking a Cure'
  | 'Political Refuge'
  | 'Trade Opportunity'
  | 'Scholarly Research'
  | 'Family Vow'
  | 'Escaping Persecution'
  | 'For Adventure and Pleasure' // Rare - traveling for fun
  | 'The Grand Tour';            // For nobility - educational journey across Europe

export type TransportationType = 'On Foot' | 'Horse' | 'Wagon' | 'Carriage' | 'Royal Procession';

export type Inventory = Record<string, number>;

export interface CharacterStats {
  ducats: number;
  food: number;
  oxen: number;
  description: string;
  inventory: Inventory;
}

// Expanded injury and condition system
export type InjurySeverity = 'Minor' | 'Moderate' | 'Severe' | 'Critical';

export type InjuryType =
  // Physical Injuries
  | 'Bruised' | 'Sprained Ankle' | 'Broken Leg' | 'Broken Arm'
  | 'Head Wound' | 'Deep Cut' | 'Infected Wound' | 'Fractured Ribs'
  // Diseases
  | 'Fever' | 'Plague' | 'Dysentery' | 'Pneumonia' | 'Consumption'
  // Environmental
  | 'Frostbite' | 'Heatstroke' | 'Exposure'
  // Status
  | 'Exhausted' | 'Starving' | 'Dehydrated' | 'Malnourished'
  // Other
  | 'Broken Wagon' | 'Food Poisoning';

export interface Injury {
  type: InjuryType;
  severity: InjurySeverity;
  healthDrain: number; // HP lost per day
  staminaDrain: number; // Stamina lost per day
  recoveryTime: number; // Days to naturally heal
  daysAfflicted: number; // How many days the injury has persisted
  description: string;
}

// Legacy type for backward compatibility
export type Condition = 'Wounded' | 'Diseased' | 'Exhausted' | 'Broken Wagon' | 'Starving';
export type GamePhase = 'traveling' | 'camp' | 'in_city' | 'merchant_encounter';
export type Weather = 'Clear' | 'Rain' | 'Storm' | 'Snow' | 'Fog';
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type Terrain = 'Plains' | 'Forest' | 'Mountains' | 'Hills' | 'River Valley' | 'Farmland';
export type RationLevel = 'filling' | 'normal' | 'meager';

export interface Equipment {
    weapon?: string;
    armor?: string;
    tool?: string;
}

export interface Skills {
    combat: number;      // 0-100: Fighting, weapons, physical confrontation
    diplomacy: number;   // 0-100: Persuasion, negotiation, charm, social skills
    survival: number;    // 0-100: Wilderness, foraging, tracking, endurance
    medicine: number;    // 0-100: Healing, treating wounds and illness
    stealth: number;     // 0-100: Sneaking, hiding, pickpocketing, evasion
    knowledge: number;   // 0-100: Scholarship, languages, history, religion
}

export interface PartyMember {
    name: string;
    role: 'spouse' | 'child' | 'companion';
    age: number;
    health: number;
    conditions: Condition[]; // Legacy
    injuries: Injury[]; // New robust injury system
    relationship: number; // 0-100
    mood: 'content' | 'worried' | 'afraid' | 'angry' | 'hopeful' | 'devoted';
    trust: number; // 0-100
    lastConversation?: number;
    personalityTrait: string;
}

export interface GameState {
  day: number; // Total days elapsed (for internal tracking)
  year: number; // Historical year (1450-1800)
  month: number; // Month (1-12)
  dayOfMonth: number; // Day of month (1-31)
  distanceTraveled: number;
  distanceToRome: number;
  health: number;
  food: number;
  ducats: number;
  oxen: number;
  stamina: number;
  hasWagon: boolean; // Whether player has a wagon
  transportation: TransportationType; // Method of travel affects speed
  inventory: Inventory;
  conditions: Condition[]; // Legacy
  injuries: Injury[]; // New robust injury system for player
  phase: GamePhase;
  party: PartyMember[];
  currentLocation: string | null;
  weather: Weather;
  season: Season;
  terrain: Terrain;
  equipment: Equipment;
  skills: Skills;
  rationLevel: RationLevel;
  weeklyFocus: WeeklyFocus;
  buffs: Buff[]; // Active temporary buffs
}

export interface Player {
    name: string;
    gender: Gender;
    age: number;
    profession: Profession;
    stats: CharacterStats;
    religion: Religion;
    socialClass: SocialClass;
    journeyReason: JourneyReason;
    startingCity: string;
    startingRegion: string;
    distanceToRome: number; // Distance from starting city to Rome in km
    routeCheckpoints: Array<{ name: string; distance: number }>; // Waypoints along the route
    reputation: number; // 0-100, affects interactions
    languages: string[]; // Languages known
    background: string; // Short background story
}

export type LogEntryType = 'normal' | 'positive' | 'negative' | 'critical' | 'warning' | 'info' | 'injury';

export interface LogEntry {
  day: number;
  message: string;
  color: string;
  type?: LogEntryType; // Type for enhanced formatting
  effectValue?: number; // For showing +/- effects
}

export type PlayerAction =
    | 'Travel' | 'Rest' | 'Hunt' | 'Make Camp' | 'Scout Ahead'
    | 'Craft' | 'Use Item' | 'Break Camp' | 'Feed Party'
    | 'Forage for Herbs' | 'Repair Wagon'
    | 'Visit Market' | 'Leave City' | 'Stay at Inn'
    | 'Trade with Merchant' | 'Ignore Merchant';

export type WeeklyFocus = 'normal' | 'cautious' | 'fast' | 'forage' | 'bond' | 'vigilant';

// Buff system for temporary status effects
export type BuffType = 'Well Rested' | 'Inn Comfort';

export interface Buff {
  type: BuffType;
  duration: number; // Weeks remaining
  effects: {
    healthRegen?: number; // Health per week
    staminaBonus?: number; // Extra stamina regeneration per week
    immuneToExhaustion?: boolean;
  };
  description: string;
}

export type WindowType = 'Description' | 'Storage' | 'History' | 'Party' | 'Market' | 'Hunt' | 'References' | 'Encounter' | 'Index' | 'Crafting' | 'Forage';

export type EncounterType =
    | 'traveler'      // Friendly traveler with information or trade
    | 'beggar'        // Poor soul asking for help
    | 'merchant'      // Traveling trader
    | 'soldier'       // Military patrol or deserter
    | 'pilgrim'       // Fellow pilgrim
    | 'bandit'        // Threatening robber
    | 'priest'        // Religious figure
    | 'refugee'       // Fleeing from war/plague
    | 'noble'         // Aristocrat traveling
    | 'healer'        // Wandering physician/herbalist
    | 'tourist';      // Rare - someone traveling for pleasure and adventure

export interface EncounterNPC {
    name: string;
    type: EncounterType;
    description: string;
    mood: 'friendly' | 'neutral' | 'hostile' | 'desperate';
    dialogue: string[]; // Conversation history
    backstory?: string; // Optional AI-generated backstory
    travelExigence?: string; // Why this person is traveling (e.g., "fleeing religious persecution", "seeking trade opportunities")
}

export interface Encounter {
    npc: EncounterNPC;
    situation: string; // What's happening when you meet them
    options: EncounterOption[];
}

export type EncounterOptionType = 'fight' | 'money' | 'skill' | 'custom';

export interface EncounterOption {
    label: string;
    type: EncounterOptionType; // Which structured type this is
    description: string; // What this option does
    skill?: keyof Skills; // For skill checks
    skillThreshold?: number; // Difficulty of the skill check
    ducatsCost?: number; // Cost (negative) or reward (positive)
    ducatsDescription?: string; // What the ducats transaction represents
}

export interface HuntableAnimal {
  name: string;
  successChance: number; // Base chance out of 100
  foodYield: [number, number]; // Min and max food gain
  injuryRisk: number; // Chance to get injured on failure
  description: string;
}