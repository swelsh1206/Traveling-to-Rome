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

export type Religion = 'Catholic' | 'Protestant';

export type SocialClass = 'Peasant' | 'Craftsman' | 'Merchant Class' | 'Minor Nobility' | 'High Nobility';

export type PilgrimageReason =
  | 'Seeking Salvation'
  | 'Penance for Sins'
  | 'Cure for Illness'
  | 'Political Refuge'
  | 'Trade Opportunity'
  | 'Scholarly Research'
  | 'Family Vow'
  | 'Escaping Persecution';

export type TransportationType = 'On Foot' | 'Horse' | 'Wagon' | 'Carriage' | 'Royal Procession';

export type Inventory = Record<string, number>;

export interface CharacterStats {
  money: number;
  food: number;
  oxen: number;
  description: string;
  inventory: Inventory;
}

export type Condition = 'Wounded' | 'Diseased' | 'Exhausted' | 'Broken Wagon' | 'Starving';
export type GamePhase = 'traveling' | 'camp' | 'in_city' | 'merchant_encounter';
export type Weather = 'Clear' | 'Rain' | 'Storm' | 'Snow' | 'Fog';
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type RationLevel = 'filling' | 'normal' | 'meager';

export interface Equipment {
    weapon?: string;
    armor?: string;
    tool?: string;
}

export interface Skills {
    combat: number; // 0-100
    survival: number; // 0-100
    persuasion: number; // 0-100
    medicine: number; // 0-100
}

export interface PartyMember {
    name: string;
    role: 'spouse' | 'child' | 'companion';
    health: number;
    conditions: Condition[];
    relationship: number; // 0-100
    mood: 'content' | 'worried' | 'afraid' | 'angry' | 'hopeful' | 'devoted';
    trust: number; // 0-100
    lastConversation?: number;
    personalityTrait: string;
}

export interface GameState {
  day: number; // Total days elapsed (for internal tracking)
  year: number; // Historical year (1450-1650)
  month: number; // Month (1-12)
  dayOfMonth: number; // Day of month (1-31)
  distanceTraveled: number;
  distanceToRome: number;
  health: number;
  food: number;
  money: number;
  oxen: number;
  stamina: number;
  inventory: Inventory;
  conditions: Condition[];
  phase: GamePhase;
  party: PartyMember[];
  currentLocation: string | null;
  weather: Weather;
  season: Season;
  equipment: Equipment;
  skills: Skills;
  rationLevel: RationLevel;
}

export interface Player {
    name: string;
    gender: Gender;
    age: number;
    profession: Profession;
    stats: CharacterStats;
    religion: Religion;
    socialClass: SocialClass;
    pilgrimageReason: PilgrimageReason;
    startingCity: string;
    reputation: number; // 0-100, affects interactions
    languages: string[]; // Languages known
    background: string; // Short background story
}

export interface LogEntry {
  day: number;
  message: string;
  color: string;
}

export type PlayerAction = 
    | 'Travel' | 'Rest' | 'Hunt' | 'Make Camp' | 'Scout Ahead'
    | 'Craft' | 'Use Item' | 'Break Camp' | 'Feed Party'
    | 'Forage for Herbs' | 'Repair Wagon'
    | 'Visit Market' | 'Leave City'
    | 'Trade with Merchant' | 'Ignore Merchant';

export type WindowType = 'Description' | 'Inventory' | 'History' | 'Party' | 'Market' | 'Hunt' | 'References' | 'Encounter';

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
    | 'healer';       // Wandering physician/herbalist

export interface EncounterNPC {
    name: string;
    type: EncounterType;
    description: string;
    mood: 'friendly' | 'neutral' | 'hostile' | 'desperate';
    dialogue: string[]; // Conversation history
    backstory?: string; // Optional AI-generated backstory
}

export interface Encounter {
    npc: EncounterNPC;
    situation: string; // What's happening when you meet them
    options: EncounterOption[];
}

export interface EncounterOption {
    label: string;
    action: 'talk' | 'help' | 'trade' | 'fight' | 'flee' | 'ignore';
    requirement?: {
        type: 'money' | 'food' | 'item' | 'skill';
        value: string | number;
    };
}

export interface HuntableAnimal {
  name: string;
  successChance: number; // Base chance out of 100
  foodYield: [number, number]; // Min and max food gain
  injuryRisk: number; // Chance to get injured on failure
  description: string;
}