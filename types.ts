export enum Profession {
  Merchant = 'Merchant',
  Priest = 'Priest',
  Soldier = 'Soldier',
  Blacksmith = 'Blacksmith',
  Scholar = 'Scholar',
  Apothecary = 'Apothecary',
}

export type Inventory = Record<string, number>;

export interface CharacterStats {
  money: number;
  food: number;
  oxen: number;
  description: string;
  inventory: Inventory;
}

export type Condition = 'Injured' | 'Sick' | 'Exhausted' | 'Wagon Damaged';
export type GamePhase = 'traveling' | 'camp' | 'in_city' | 'merchant_encounter';

export interface PartyMember {
    name: string;
    health: number;
    conditions: Condition[];
}

export interface GameState {
  day: number;
  distanceTraveled: number;
  distanceToRome: number;
  health: number;
  food: number;
  money: number;
  oxen: number;
  inventory: Inventory;
  conditions: Condition[];
  phase: GamePhase;
  party: PartyMember[];
  currentLocation: string | null;
}

export interface Player {
    name: string;
    profession: Profession;
    stats: CharacterStats;
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

export type WindowType = 'Description' | 'Inventory' | 'History' | 'Party' | 'Market' | 'Hunt';

export interface HuntableAnimal {
  name: string;
  successChance: number; // Base chance out of 100
  foodYield: [number, number]; // Min and max food gain
  injuryRisk: number; // Chance to get injured on failure
  description: string;
}