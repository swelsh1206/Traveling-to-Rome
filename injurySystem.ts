// Robust injury and health damage system
import { Injury, InjuryType, InjurySeverity } from './types';

// Injury definitions with their effects
export const INJURY_DEFINITIONS: Record<InjuryType, {
  minSeverity: InjurySeverity;
  maxSeverity: InjurySeverity;
  baseHealthDrain: number;
  baseStaminaDrain: number;
  baseRecoveryDays: number;
  canInfect?: boolean;
}> = {
  // Minor Physical Injuries
  'Bruised': {
    minSeverity: 'Minor',
    maxSeverity: 'Moderate',
    baseHealthDrain: 1,
    baseStaminaDrain: 2,
    baseRecoveryDays: 3,
  },
  'Sprained Ankle': {
    minSeverity: 'Minor',
    maxSeverity: 'Moderate',
    baseHealthDrain: 2,
    baseStaminaDrain: 5,
    baseRecoveryDays: 7,
  },
  'Deep Cut': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 3,
    baseStaminaDrain: 3,
    baseRecoveryDays: 10,
    canInfect: true,
  },
  'Head Wound': {
    minSeverity: 'Moderate',
    maxSeverity: 'Critical',
    baseHealthDrain: 5,
    baseStaminaDrain: 5,
    baseRecoveryDays: 14,
    canInfect: true,
  },
  'Broken Arm': {
    minSeverity: 'Severe',
    maxSeverity: 'Severe',
    baseHealthDrain: 4,
    baseStaminaDrain: 6,
    baseRecoveryDays: 30,
  },
  'Broken Leg': {
    minSeverity: 'Severe',
    maxSeverity: 'Critical',
    baseHealthDrain: 5,
    baseStaminaDrain: 10,
    baseRecoveryDays: 45,
  },
  'Fractured Ribs': {
    minSeverity: 'Severe',
    maxSeverity: 'Severe',
    baseHealthDrain: 4,
    baseStaminaDrain: 8,
    baseRecoveryDays: 35,
  },
  'Infected Wound': {
    minSeverity: 'Severe',
    maxSeverity: 'Critical',
    baseHealthDrain: 8,
    baseStaminaDrain: 6,
    baseRecoveryDays: 20,
  },

  // Diseases
  'Fever': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 5,
    baseStaminaDrain: 8,
    baseRecoveryDays: 7,
  },
  'Plague': {
    minSeverity: 'Critical',
    maxSeverity: 'Critical',
    baseHealthDrain: 15,
    baseStaminaDrain: 10,
    baseRecoveryDays: 14,
  },
  'Dysentery': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 6,
    baseStaminaDrain: 7,
    baseRecoveryDays: 10,
  },
  'Pneumonia': {
    minSeverity: 'Severe',
    maxSeverity: 'Critical',
    baseHealthDrain: 10,
    baseStaminaDrain: 12,
    baseRecoveryDays: 21,
  },
  'Consumption': {
    minSeverity: 'Severe',
    maxSeverity: 'Critical',
    baseHealthDrain: 7,
    baseStaminaDrain: 9,
    baseRecoveryDays: 60,
  },

  // Environmental
  'Frostbite': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 4,
    baseStaminaDrain: 5,
    baseRecoveryDays: 14,
  },
  'Heatstroke': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 6,
    baseStaminaDrain: 8,
    baseRecoveryDays: 5,
  },
  'Exposure': {
    minSeverity: 'Moderate',
    maxSeverity: 'Critical',
    baseHealthDrain: 5,
    baseStaminaDrain: 7,
    baseRecoveryDays: 7,
  },

  // Status Conditions
  'Exhausted': {
    minSeverity: 'Minor',
    maxSeverity: 'Moderate',
    baseHealthDrain: 1,
    baseStaminaDrain: 10,
    baseRecoveryDays: 2,
  },
  'Starving': {
    minSeverity: 'Moderate',
    maxSeverity: 'Critical',
    baseHealthDrain: 8,
    baseStaminaDrain: 12,
    baseRecoveryDays: 1,
  },
  'Dehydrated': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 7,
    baseStaminaDrain: 10,
    baseRecoveryDays: 1,
  },
  'Malnourished': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 3,
    baseStaminaDrain: 6,
    baseRecoveryDays: 7,
  },

  // Other
  'Broken Wagon': {
    minSeverity: 'Minor',
    maxSeverity: 'Minor',
    baseHealthDrain: 0,
    baseStaminaDrain: 0,
    baseRecoveryDays: 0,
  },
  'Food Poisoning': {
    minSeverity: 'Moderate',
    maxSeverity: 'Severe',
    baseHealthDrain: 5,
    baseStaminaDrain: 8,
    baseRecoveryDays: 3,
  },
};

// Severity multipliers
const SEVERITY_MULTIPLIERS: Record<InjurySeverity, number> = {
  'Minor': 0.5,
  'Moderate': 1.0,
  'Severe': 1.5,
  'Critical': 2.0,
};

// Create a new injury with appropriate severity
export function createInjury(
  type: InjuryType,
  severity?: InjurySeverity
): Injury {
  const definition = INJURY_DEFINITIONS[type];

  // Determine severity if not provided
  let finalSeverity = severity;
  if (!finalSeverity) {
    const severities: InjurySeverity[] = ['Minor', 'Moderate', 'Severe', 'Critical'];
    const minIndex = severities.indexOf(definition.minSeverity);
    const maxIndex = severities.indexOf(definition.maxSeverity);
    const randomIndex = minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));
    finalSeverity = severities[randomIndex];
  }

  const multiplier = SEVERITY_MULTIPLIERS[finalSeverity];

  return {
    type,
    severity: finalSeverity,
    healthDrain: Math.round(definition.baseHealthDrain * multiplier),
    staminaDrain: Math.round(definition.baseStaminaDrain * multiplier),
    recoveryTime: Math.round(definition.baseRecoveryDays * multiplier),
    daysAfflicted: 0,
    description: getInjuryDescription(type, finalSeverity),
  };
}

// Get severity color for UI
export function getInjurySeverityColor(severity: InjurySeverity): string {
  switch (severity) {
    case 'Minor': return 'text-yellow-400';
    case 'Moderate': return 'text-orange-400';
    case 'Severe': return 'text-red-400';
    case 'Critical': return 'text-red-600';
  }
}

// Get severity background color
export function getInjurySeverityBg(severity: InjurySeverity): string {
  switch (severity) {
    case 'Minor': return 'bg-yellow-900/30 border-yellow-600/50';
    case 'Moderate': return 'bg-orange-900/30 border-orange-600/50';
    case 'Severe': return 'bg-red-900/30 border-red-600/50';
    case 'Critical': return 'bg-red-900/50 border-red-600/70';
  }
}

// Get injury description
function getInjuryDescription(type: InjuryType, severity: InjurySeverity): string {
  const severityDesc = severity === 'Minor' ? 'a minor' : severity === 'Moderate' ? 'a moderate' : severity === 'Severe' ? 'a severe' : 'a critical';

  switch (type) {
    case 'Bruised': return `${severityDesc} bruise that causes discomfort`;
    case 'Sprained Ankle': return `${severityDesc} ankle sprain limiting mobility`;
    case 'Broken Leg': return `${severityDesc} leg fracture making travel nearly impossible`;
    case 'Broken Arm': return `${severityDesc} arm fracture limiting work capability`;
    case 'Head Wound': return `${severityDesc} head injury causing pain and dizziness`;
    case 'Deep Cut': return `${severityDesc} laceration requiring careful treatment`;
    case 'Infected Wound': return `${severityDesc} infected wound spreading through the body`;
    case 'Fractured Ribs': return `${severityDesc} rib injury making breathing painful`;
    case 'Fever': return `${severityDesc} fever burning through the body`;
    case 'Plague': return 'the dreaded plague - a death sentence without miracle`;
    case 'Dysentery': return `${severityDesc} case of dysentery from bad food or water`;
    case 'Pneumonia': return `${severityDesc} lung infection making breathing difficult`;
    case 'Consumption': return `${severityDesc} case of consumption wasting the body`;
    case 'Frostbite': return `${severityDesc} frostbite from extreme cold`;
    case 'Heatstroke': return `${severityDesc} heatstroke from sun exposure`;
    case 'Exposure': return `${severityDesc} case of exposure to harsh elements`;
    case 'Exhausted': return `${severityDesc} exhaustion from overwork`;
    case 'Starving': return `${severityDesc} starvation - desperately needs food`;
    case 'Dehydrated': return `${severityDesc} dehydration - desperately needs water`;
    case 'Malnourished': return `${severityDesc} malnourishment from poor diet`;
    case 'Food Poisoning': return `${severityDesc} food poisoning from spoiled provisions`;
    case 'Broken Wagon': return 'broken wagon requiring repairs';
    default: return `${severityDesc} ${type}`;
  }
}

// Process daily injury effects
export function processDailyInjuryEffects(injuries: Injury[]): {
  updatedInjuries: Injury[];
  totalHealthDrain: number;
  totalStaminaDrain: number;
  healed: InjuryType[];
  worsened: InjuryType[];
} {
  const healed: InjuryType[] = [];
  const worsened: InjuryType[] = [];
  let totalHealthDrain = 0;
  let totalStaminaDrain = 0;

  const updatedInjuries = injuries.map(injury => {
    const updated = { ...injury };
    updated.daysAfflicted++;

    // Apply daily effects
    totalHealthDrain += injury.healthDrain;
    totalStaminaDrain += injury.staminaDrain;

    // Check for natural healing
    if (updated.daysAfflicted >= updated.recoveryTime) {
      healed.push(injury.type);
      return null; // Mark for removal
    }

    // Check for infection worsening
    const definition = INJURY_DEFINITIONS[injury.type];
    if (definition.canInfect && updated.daysAfflicted > 3 && Math.random() < 0.15) {
      // 15% chance per day after 3 days for wound to get infected
      if (injury.type !== 'Infected Wound') {
        worsened.push(injury.type);
        // Will be replaced with infected wound
        return null;
      }
    }

    return updated;
  }).filter(injury => injury !== null) as Injury[];

  // Add infected wounds for wounds that worsened
  worsened.forEach(type => {
    if (type === 'Deep Cut' || type === 'Head Wound') {
      updatedInjuries.push(createInjury('Infected Wound', 'Severe'));
    }
  });

  return {
    updatedInjuries,
    totalHealthDrain,
    totalStaminaDrain,
    healed,
    worsened,
  };
}

// Check if injury can be treated
export function canTreatInjury(injuryType: InjuryType, inventory: Record<string, number>): boolean {
  switch (injuryType) {
    case 'Bruised':
    case 'Sprained Ankle':
    case 'Exhausted':
      return true; // Can rest to heal
    case 'Deep Cut':
    case 'Head Wound':
    case 'Infected Wound':
      return (inventory['Bandages'] || 0) > 0 || (inventory['Healing Poultice'] || 0) > 0;
    case 'Fever':
    case 'Dysentery':
    case 'Food Poisoning':
      return (inventory['Medicinal Herbs'] || 0) > 0 || (inventory['Healing Poultice'] || 0) > 0;
    case 'Plague':
    case 'Pneumonia':
    case 'Consumption':
      return (inventory['Holy Water'] || 0) > 0 || (inventory['Healing Poultice'] || 0) > 0;
    case 'Starving':
      return (inventory['Food'] || 0) > 0;
    case 'Dehydrated':
      return true; // Can drink water
    case 'Broken Wagon':
      return (inventory['Scrap Metal'] || 0) > 0;
    default:
      return (inventory['Bandages'] || 0) > 0;
  }
}
