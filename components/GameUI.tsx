import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameState, LogEntry, PlayerAction, WindowType, Inventory, Condition, PartyMember, Profession, HuntableAnimal, Encounter, Terrain } from '../types';
import Log from './Log';
import ActionButton from './ActionButton';
import { generateActionOutcome, generateEncounter, processEncounterAction } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { TOTAL_DISTANCE_TO_ROME, PROFESSION_STATS, ITEM_EFFECTS, ITEM_DESCRIPTIONS, CRAFTING_RECIPES, INITIAL_HEALTH, ITEM_PRICES, HUNTABLE_ANIMALS, ITEM_ICONS } from '../constants';
import ModalWindow from './ModalWindow';
import SuppliesBar from './SuppliesBar';
import { formatDate, advanceDate, getSeasonFromMonth, getHistoricalContext } from '../utils/dateUtils';
import SettingsMenu from './SettingsMenu';
import CharacterSidebar from './CharacterSidebar';
import MapView from './MapView';
import EncounterWindow from './EncounterWindow';
import StartGuide from './StartGuide';
import { STAT_TOOLTIPS, CONDITION_TOOLTIPS, PHASE_TOOLTIPS, WEATHER_TOOLTIPS, MOOD_TOOLTIPS } from '../tooltipDescriptions';

interface GameUIProps {
  player: Player;
  initialGameState: GameState;
  characterImageUrl: string;
  onGameEnd: (message: string, victory: boolean) => void;
  onRestartRun?: () => void;
  devMode?: boolean;
}

interface PartyChange {
    name: string;
    health_change?: number;
    conditions_add?: string[];
    conditions_remove?: string[];
}

// Fisher-Yates shuffle to get random animals for hunting
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const updateInventory = (currentInventory: Inventory, changes: { item: string; change: number }[]): Inventory => {
    const newInventory = { ...currentInventory };
    for (const change of changes) {
        const currentAmount = newInventory[change.item] || 0;
        newInventory[change.item] = currentAmount + change.change;
        if (newInventory[change.item] <= 0) {
            delete newInventory[change.item];
        }
    }
    return newInventory;
};

const updateConditions = (currentConditions: Condition[], toAdd: string[] = [], toRemove: string[] = []): Condition[] => {
    let newConditions = [...currentConditions];
    toAdd.forEach(cond => {
        if (!newConditions.includes(cond as Condition)) {
            newConditions.push(cond as Condition);
        }
    });
    newConditions = newConditions.filter(cond => !toRemove.includes(cond));
    return newConditions;
};

// Determine season based on day (approximate 90-day seasons)
const getSeason = (day: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' => {
    const dayOfYear = day % 365;
    if (dayOfYear < 90) return 'Spring';
    if (dayOfYear < 180) return 'Summer';
    if (dayOfYear < 270) return 'Autumn';
    return 'Winter';
};

// Generate random weather (affected by season)
const generateWeather = (season: 'Spring' | 'Summer' | 'Autumn' | 'Winter'): 'Clear' | 'Rain' | 'Storm' | 'Snow' | 'Fog' => {
    const rand = Math.random();
    if (season === 'Winter') {
        if (rand < 0.5) return 'Snow';
        if (rand < 0.7) return 'Clear';
        if (rand < 0.85) return 'Fog';
        return 'Storm';
    } else if (season === 'Spring') {
        if (rand < 0.5) return 'Clear';
        if (rand < 0.75) return 'Rain';
        if (rand < 0.90) return 'Fog';
        return 'Storm';
    } else if (season === 'Summer') {
        if (rand < 0.7) return 'Clear';
        if (rand < 0.85) return 'Rain';
        return 'Storm';
    } else { // Autumn
        if (rand < 0.4) return 'Clear';
        if (rand < 0.65) return 'Rain';
        if (rand < 0.80) return 'Fog';
        if (rand < 0.95) return 'Storm';
        return 'Snow';
    }
};

// Generate random terrain based on distance traveled
const generateTerrain = (distanceTraveled: number): Terrain => {
    // Alps region (around 600-800 km)
    if (distanceTraveled >= 550 && distanceTraveled <= 850) {
        return Math.random() < 0.7 ? 'Mountains' : 'Hills';
    }
    // Early France (farmland and plains)
    if (distanceTraveled < 400) {
        const rand = Math.random();
        if (rand < 0.4) return 'Farmland';
        if (rand < 0.7) return 'Plains';
        return 'Forest';
    }
    // Approaching Italy (hills and valleys)
    if (distanceTraveled > 1000) {
        const rand = Math.random();
        if (rand < 0.4) return 'Hills';
        if (rand < 0.7) return 'River Valley';
        return 'Farmland';
    }
    // Middle section: varied terrain
    const terrains: Terrain[] = ['Plains', 'Forest', 'Hills', 'River Valley'];
    return terrains[Math.floor(Math.random() * terrains.length)];
};

// Weather effects on travel
const getWeatherTravelEffect = (weather: 'Clear' | 'Rain' | 'Storm' | 'Snow' | 'Fog'): { distanceModifier: number; healthCost: number; description: string } => {
    switch (weather) {
        case 'Clear':
            return { distanceModifier: 1.0, healthCost: 0, description: '' };
        case 'Rain':
            return { distanceModifier: 0.85, healthCost: 1, description: 'Rain slows your progress.' };
        case 'Storm':
            return { distanceModifier: 0.6, healthCost: 3, description: 'The storm batters you mercilessly!' };
        case 'Snow':
            return { distanceModifier: 0.7, healthCost: 2, description: 'Snow makes the roads treacherous.' };
        case 'Fog':
            return { distanceModifier: 0.9, healthCost: 0, description: 'Fog obscures the path ahead.' };
    }
};

const GameUI: React.FC<GameUIProps> = ({ player, initialGameState, characterImageUrl, onGameEnd, onRestartRun, devMode = false }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [log, setLog] = useState<LogEntry[]>([{ day: 1, message: "Your journey begins. Choose your first action.", color: 'text-white' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeWindow, setActiveWindow] = useState<WindowType | null>(null);
  const [itemTarget, setItemTarget] = useState<PartyMember | null>(null);
  const [nextCheckpointIndex, setNextCheckpointIndex] = useState(0);
  const [huntOptions, setHuntOptions] = useState<HuntableAnimal[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [isProcessingEncounter, setIsProcessingEncounter] = useState(false);
  const [cart, setCart] = useState<Record<string, { quantity: number; type: 'buy' | 'sell' }>>({});
  const [showStartGuide, setShowStartGuide] = useState(true);

  const addLogEntry = useCallback((message: string, color: string = 'text-white', dayOverride?: number) => {
    setLog(prevLog => {
        // Prevent duplicate consecutive entries
        const lastEntry = prevLog[prevLog.length - 1];
        const newEntry = { day: dayOverride ?? gameState.day, message, color };
        if (lastEntry && lastEntry.message === message && lastEntry.day === newEntry.day) {
            return prevLog;
        }
        return [...prevLog, newEntry];
    });
  }, [gameState.day]);

  const handleOpenInventoryForTarget = (member: PartyMember) => {
    setItemTarget(member);
    setActiveWindow('Inventory');
  };

  const handleUseItem = useCallback((item: string) => {
    const effect = ITEM_EFFECTS[item];
    if (!effect || (gameState.inventory[item] || 0) <= 0) return;

    setGameState(prev => {
        const newInventory = { ...prev.inventory, [item]: prev.inventory[item] - 1 };
        if (newInventory[item] <= 0) delete newInventory[item];

        let message = `You use ${item}.`;
        let newHealth = prev.health;
        let newConditions = [...prev.conditions];
        let newParty = [...prev.party];

        if (itemTarget) { // Targeting a party member
            message = `You use ${item} on ${itemTarget.name}.`;
            const targetIndex = newParty.findIndex(m => m.name === itemTarget.name);
            if (targetIndex > -1) {
                let member = { ...newParty[targetIndex] };
                if (effect.removesCondition) {
                     if (member.conditions.includes(effect.removesCondition as Condition)) {
                        member.conditions = member.conditions.filter(c => c !== effect.removesCondition);
                        message += ` ${itemTarget.name}'s ailment seems to subside.`;
                    } else {
                         message += ` It has no effect on their current conditions.`;
                    }
                }
                if (effect.health_change) {
                    if (member.health < INITIAL_HEALTH) {
                        member.health = Math.min(INITIAL_HEALTH, member.health + effect.health_change);
                        message += ` They recover some health.`;
                    } else {
                        message += ` They are already in good health.`;
                    }
                }
                newParty[targetIndex] = member;
            }
        } else { // Targeting player
            if (effect.removesCondition) {
                if (newConditions.includes(effect.removesCondition as Condition)) {
                    newConditions = newConditions.filter(c => c !== effect.removesCondition);
                    message += ` You feel the effects of your ailment subside.`;
                } else {
                    message += ` It has no effect on your current conditions.`;
                }
            }
            if (effect.health_change) {
                if (newHealth < INITIAL_HEALTH) {
                    const healthBefore = newHealth;
                    newHealth = Math.min(INITIAL_HEALTH, newHealth + effect.health_change);
                    const healthGained = newHealth - healthBefore;
                    message += ` You recover ${healthGained} health.`;
                } else {
                    message += ` It has no effect, as you are already in good health.`;
                }
            }
        }

        addLogEntry(message, 'text-white');
        return { ...prev, inventory: newInventory, conditions: newConditions, health: newHealth, party: newParty };
    });
    
    setActiveWindow(null);
    setItemTarget(null);

  }, [addLogEntry, gameState.inventory, gameState.health, gameState.conditions, itemTarget]);
  
  const checkPartyDeaths = (party: PartyMember[], currentDay: number): { living: PartyMember[], hasDeaths: boolean } => {
    const living: PartyMember[] = [];
    let hasDeaths = false;
    party.forEach(member => {
        if (member.health > 0) {
            living.push(member);
        } else {
            addLogEntry(`${member.name} has succumbed to the hardships of the road.`, 'text-red-700 font-bold');
            hasDeaths = true;
        }
    });
    return { living, hasDeaths };
  };

  const applyPartyChanges = (currentParty: PartyMember[], changes: PartyChange[]): PartyMember[] => {
    if (!changes || changes.length === 0) return currentParty;

    let newParty = currentParty.map(member => {
        const change = changes.find(c => c.name === member.name);
        if (!change) return member;

        const newHealth = Math.max(0, Math.min(100, member.health + (change.health_change || 0)));
        const newConditions = updateConditions(member.conditions, change.conditions_add, change.conditions_remove);
        const newRelationship = Math.max(0, Math.min(100, member.relationship + ((change as any).relationship_change || 0)));
        const newTrust = member.trust + (((change as any).relationship_change || 0) > 0 ? 1 : ((change as any).relationship_change || 0) < -5 ? -2 : 0);
        const newMood = (change as any).mood || member.mood;
        return {
          ...member,
          health: newHealth,
          conditions: newConditions,
          relationship: newRelationship,
          trust: Math.max(0, Math.min(100, newTrust)),
          mood: newMood
        };
    });
    return newParty;
  };

  const handleMarketTransaction = (type: 'buy' | 'sell', item: string, quantity: number, price: number) => {
      setGameState(prev => {
          if (type === 'buy') {
              const cost = price * quantity;
              if (prev.money < cost) {
                  addLogEntry("You don't have enough money for that.", 'text-white');
                  return prev;
              }
              const itemChange = item === 'Food' || item === 'Oxen' ? {} : { inventory: updateInventory(prev.inventory, [{ item, change: quantity }]) };
              addLogEntry(`You bought ${quantity} ${item} for ${cost} money.`, 'text-white');
              return {
                  ...prev,
                  money: prev.money - cost,
                  food: item === 'Food' ? prev.food + quantity : prev.food,
                  oxen: item === 'Oxen' ? prev.oxen + quantity : prev.oxen,
                  ...itemChange,
              };
          } else { // sell
              const currentAmount = item === 'Food' ? prev.food : item === 'Oxen' ? prev.oxen : (prev.inventory[item] || 0);
              if (currentAmount < quantity) {
                   addLogEntry(`You don't have that many ${item} to sell.`, 'text-white');
                   return prev;
              }
              const earnings = price * quantity;
              const itemChange = item === 'Food' || item === 'Oxen' ? {} : { inventory: updateInventory(prev.inventory, [{ item, change: -quantity }]) };
              addLogEntry(`You sold ${quantity} ${item} for ${earnings} money.`, 'text-white');
              return {
                  ...prev,
                  money: prev.money + earnings,
                  food: item === 'Food' ? prev.food - quantity : prev.food,
                  oxen: item === 'Oxen' ? prev.oxen - quantity : prev.oxen,
                  ...itemChange,
              };
          }
      })
  }

  const handleHuntAttempt = (animal: HuntableAnimal) => {
    setActiveWindow(null);

    // Check if player has ammunition
    if (gameState.ammunition < 1) {
      addLogEntry(`You have no ammunition to hunt with!`, 'text-red-400');
      return;
    }

    let successChance = animal.successChance;
    if (player.profession === Profession.Soldier) {
        successChance += 10; // Soldier bonus
    }

    const roll = Math.random() * 100;
    const staminaCost = 20;
    const ammunitionCost = 1;

    setGameState(prev => {
        if (roll < successChance) {
            // Success
            const foodGained = Math.floor(Math.random() * (animal.foodYield[1] - animal.foodYield[0] + 1)) + animal.foodYield[0];
            addLogEntry(`Success! You hunted a ${animal.name} and gathered ${foodGained} food. (-${staminaCost} stamina, -${ammunitionCost} ammunition)`, 'text-white');
            return {
              ...prev,
              stamina: Math.max(0, prev.stamina - staminaCost),
              food: prev.food + foodGained,
              ammunition: prev.ammunition - ammunitionCost
            };
        } else {
            // Failure
            let newConditions = [...prev.conditions];
            const injuryRoll = Math.random() * 100;
            let message = `The ${animal.name} escaped. You return with nothing. (-${staminaCost} stamina, -${ammunitionCost} ammunition)`;
            if (injuryRoll < animal.injuryRisk) {
                newConditions = updateConditions(newConditions, ['Wounded']);
                message = `The ${animal.name} fought back and escaped. You are now Wounded. (-${staminaCost} stamina, -${ammunitionCost} ammunition)`;
            }
            addLogEntry(message, 'text-white');
            return {
              ...prev,
              stamina: Math.max(0, prev.stamina - staminaCost),
              conditions: newConditions,
              ammunition: prev.ammunition - ammunitionCost
            };
        }
    });
  };

  const handleAction = useCallback(async (action: PlayerAction) => {
    if (isGameOver || isLoading) return;

    // Check stamina for actions that require it
    const staminaRequiredActions = ['Hunt', 'Forage for Herbs', 'Repair Wagon'];
    if (staminaRequiredActions.includes(action) && gameState.stamina <= 0) {
        addLogEntry("You are too exhausted to perform this action. You must rest first.", 'text-red-400');
        return;
    }

    if (action === 'Hunt') {
        const options = shuffleArray([...HUNTABLE_ANIMALS]).slice(0, 3);
        setHuntOptions(options);
        setActiveWindow('Hunt');
        return;
    }

    if (action === 'Break Camp' || action === 'Ignore Merchant') {
        setGameState(prev => ({...prev, phase: 'traveling'}));
        addLogEntry('You continue on your journey.', 'text-white');
        return;
    }
     if (action === 'Use Item') {
        setItemTarget(null); // Ensure target is self when using from camp menu
        setActiveWindow('Inventory');
        return;
    }
     if (action === 'Leave City') {
        addLogEntry(`You leave ${gameState.currentLocation}.`, 'text-white');
        setGameState(prev => ({...prev, phase: 'traveling', currentLocation: null}));
        return;
     }
     if (action === 'Visit Market' || action === 'Trade with Merchant') {
        setActiveWindow('Market');
        return;
     }
    if (action === 'Rest') {
        addLogEntry('You and your family rest and recuperate, restoring your stamina.', 'text-white');
        setGameState(prev => {
            const restedParty = prev.party.map(p => ({...p, health: Math.min(100, p.health + 10), conditions: p.conditions.filter(c => c !== 'Exhausted') }));
            return {
                ...prev,
                stamina: Math.min(100, prev.stamina + 50),
                health: Math.min(100, prev.health + 10),
                conditions: prev.conditions.filter(c => c !== 'Exhausted'),
                party: restedParty,
            };
        });
        return;
    }
    if (action === 'Craft') {
        const availableRecipe = CRAFTING_RECIPES.find(r => 
            r.profession === player.profession &&
            (gameState.inventory[r.item] || 0) > 0 &&
            (!r.requires || (gameState.inventory[r.requires] || 0) > 0)
        );
        if (availableRecipe) {
            addLogEntry(availableRecipe.description, 'text-white');
            setGameState(prev => ({
                ...prev,
                inventory: updateInventory(prev.inventory, [
                    { item: availableRecipe.item, change: -1 },
                    { item: availableRecipe.result, change: 1 },
                ])
            }))
        } else {
            addLogEntry("You have nothing to craft at the moment.", 'text-white');
        }
        return;
    }
    if (action === 'Feed Party') {
        const foodNeeded = 1 + gameState.party.length;
        if (gameState.food < foodNeeded) {
            addLogEntry("You don't have enough food to share a proper meal.", 'text-white');
            return;
        }
        addLogEntry('You share a meal with your family, restoring some vitality.', 'text-white');
        setGameState(prev => ({
            ...prev,
            food: prev.food - foodNeeded,
            health: Math.min(100, prev.health + 5),
            party: prev.party.map(p => ({ ...p, health: Math.min(100, p.health + 5) })),
        }));
        return;
    }

    if (action === 'Repair Wagon') {
        if (!gameState.hasWagon) {
            addLogEntry("You don't have a wagon to repair!", 'text-red-400');
            return;
        }
        if (!gameState.conditions.includes('Broken Wagon')) {
            addLogEntry("Your wagon doesn't need repairs right now.", 'text-white');
            return;
        }
        if (gameState.spareParts < 1) {
            addLogEntry("You don't have any spare parts to repair the wagon!", 'text-red-400');
            return;
        }

        addLogEntry('You use spare parts to repair the wagon. It should hold together for now.', 'text-white');
        setGameState(prev => ({
            ...prev,
            spareParts: prev.spareParts - 1,
            stamina: Math.max(0, prev.stamina - 15),
            conditions: prev.conditions.filter(c => c !== 'Broken Wagon'),
        }));
        return;
    }

    setIsLoading(true);
    const outcome = await generateActionOutcome(player, gameState, action);

    let newDay = gameState.day;
    if (action === 'Travel') {
        newDay = gameState.day + 7;
    }

    setGameState(prevGameState => {
        let newState = { ...prevGameState };

        // Only Travel advances time by 1 week
        if (action === 'Travel') {
            newState.day += 7;
            // Advance calendar date by 7 days
            let currentDate = { year: newState.year, month: newState.month, dayOfMonth: newState.dayOfMonth };
            for (let i = 0; i < 7; i++) {
                currentDate = advanceDate(currentDate.year, currentDate.month, currentDate.dayOfMonth);
            }
            newState.year = currentDate.year;
            newState.month = currentDate.month;
            newState.dayOfMonth = currentDate.dayOfMonth;
            newState.season = getSeasonFromMonth(currentDate.month);

            // Restore stamina based on ration level when traveling
            const staminaRestore = newState.rationLevel === 'filling' ? 80 :
                                 newState.rationLevel === 'normal' ? 60 : 30;
            newState.stamina = Math.min(100, newState.stamina + staminaRestore);
        }

        // Actions other than Travel consume stamina
        if (action !== 'Travel') {
            const staminaCost = 15;
            newState.stamina = Math.max(0, newState.stamina - staminaCost);
        }

        newState.health = Math.max(0, Math.min(100, newState.health + outcome.health_change));

        // Food consumption during travel (per week, not per day!)
        // Food represents "provisions" - generic food units
        // Each person in party consumes food per WEEK of travel
        let foodConsumed = 0;
        if (action === 'Travel') {
            const partySize = 1 + newState.party.length;
            const rationMultiplier = newState.rationLevel === 'filling' ? 2 :
                                   newState.rationLevel === 'normal' ? 1 : 0.5;
            foodConsumed = Math.ceil(partySize * rationMultiplier); // Weekly consumption
        }
        newState.food = Math.max(0, newState.food + outcome.food_change - foodConsumed);

        newState.money = Math.max(0, newState.money + outcome.money_change);
        newState.oxen = Math.max(0, newState.oxen + outcome.oxen_change);

        // Update weather, terrain, and season if traveling
        let weatherEffect = { distanceModifier: 1.0, healthCost: 0, description: '' };
        if (action === 'Travel') {
            newState.season = getSeason(newState.day);
            newState.weather = generateWeather(newState.season);
            newState.terrain = generateTerrain(newState.distanceTraveled);
            weatherEffect = getWeatherTravelEffect(newState.weather);
        }

        // Calculate distance with modifiers
        let distanceChange = outcome.distance_change || 0;
        if (action === 'Travel') {
            // Apply weather modifier
            distanceChange = Math.floor(distanceChange * weatherEffect.distanceModifier);

            // Apply transportation speed multipliers (clear and simple)
            const transportationMultiplier =
                newState.transportation === 'Royal Procession' ? 2.5 :
                newState.transportation === 'Horse' ? 2.0 :
                newState.transportation === 'Carriage' ? 1.8 :
                newState.transportation === 'Wagon' ? 1.5 :
                1.0; // On Foot

            distanceChange = Math.floor(distanceChange * transportationMultiplier);
        }

        // Apply condition-based penalties
        if (newState.conditions.includes('Wounded')) distanceChange *= 0.75;
        if (newState.conditions.includes('Broken Wagon')) distanceChange *= 0.5;

        distanceChange = Math.floor(distanceChange);
        newState.distanceTraveled += distanceChange;

        // Apply weather health cost
        if (action === 'Travel' && weatherEffect.healthCost > 0) {
            newState.health = Math.max(0, newState.health - weatherEffect.healthCost);
        }

        newState.distanceToRome = Math.max(0, TOTAL_DISTANCE_TO_ROME - newState.distanceTraveled);
        newState.inventory = updateInventory(newState.inventory, outcome.inventory_changes || []);
        newState.conditions = updateConditions(newState.conditions, outcome.conditions_add, outcome.conditions_remove);

        const changedParty = applyPartyChanges(newState.party, outcome.party_changes || []);
        const { living } = checkPartyDeaths(changedParty, newState.day);
        newState.party = living;

        if (action === 'Make Camp') newState.phase = 'camp';

        if (outcome.merchant_encountered) {
            newState.phase = 'merchant_encounter';
        } else if (action === 'Travel') {
            // Check for arrival at a checkpoint city
            const nextCheckpoint = player.routeCheckpoints[nextCheckpointIndex];
            if (nextCheckpoint && newState.distanceTraveled >= nextCheckpoint.distance) {
                newState.phase = 'in_city';
                newState.currentLocation = nextCheckpoint.name;
                setNextCheckpointIndex(prev => prev + 1);
            }
        }

        return newState;
    });

    // Add log entries after state update
    if (action === 'Travel') {
        // Format weekly happenings as bullets if they exist
        let message = outcome.description;
        if (outcome.weekly_happenings && outcome.weekly_happenings.length > 0) {
            const happenings = outcome.weekly_happenings.map((h: string) => `  • ${h}`).join('\n');
            message = `${outcome.description}\n${happenings}`;
        }
        addLogEntry(message, 'text-white', newDay);
    } else {
        addLogEntry(outcome.description, 'text-white');
    }

    // Add special event log entries
    if (outcome.merchant_encountered) {
        addLogEntry("You encounter a traveling merchant on the road.", 'text-cyan-300', newDay);
    }

    // Check for city arrival
    const nextCheckpoint = player.routeCheckpoints[nextCheckpointIndex];
    if (action === 'Travel' && nextCheckpoint && (gameState.distanceTraveled + (outcome.distance_change || 0)) >= nextCheckpoint.distance) {
        addLogEntry(`You have arrived at ${nextCheckpoint.name}! You can rest and resupply here.`, 'text-purple-300', newDay);
    }

    setIsLoading(false);

    // Check for random encounter after travel
    if (action === 'Travel' && !outcome.merchant_encountered) {
        const encounter = await generateEncounter(player, gameState);
        if (encounter) {
            setCurrentEncounter(encounter);
            addLogEntry(`You encounter ${encounter.npc.name} on the road.`, 'text-cyan-300', newDay);
        }
    }

  }, [player, gameState, addLogEntry, isGameOver, isLoading, nextCheckpointIndex]);

  // Handle encounter actions
  const handleEncounterAction = useCallback(async (optionIndex: number, customInput?: string) => {
    if (!currentEncounter || isProcessingEncounter) return;

    setIsProcessingEncounter(true);

    try {
      const outcome = await processEncounterAction(player, gameState, currentEncounter, optionIndex, customInput);

      // Apply outcome to game state
      setGameState(prev => {
        let newState = { ...prev };
        newState.health = Math.max(0, Math.min(INITIAL_HEALTH, newState.health + outcome.health_change));
        newState.food = Math.max(0, newState.food + outcome.food_change);
        newState.money = Math.max(0, newState.money + outcome.money_change);
        newState.oxen = Math.max(0, newState.oxen + outcome.oxen_change);
        newState.inventory = updateInventory(newState.inventory, outcome.inventory_changes || []);
        newState.conditions = updateConditions(newState.conditions, outcome.conditions_add || [], outcome.conditions_remove || []);

        const changedParty = applyPartyChanges(newState.party, outcome.party_changes || []);
        const { living } = checkPartyDeaths(changedParty, newState.day);
        newState.party = living;

        return newState;
      });

      addLogEntry(outcome.description, 'text-cyan-200');

      // Close encounter
      setCurrentEncounter(null);
    } catch (error) {
      console.error("Error processing encounter action:", error);
      addLogEntry("Something went wrong with the encounter.", 'text-red-500');
      setCurrentEncounter(null);
    } finally {
      setIsProcessingEncounter(false);
    }
  }, [currentEncounter, player, gameState, isProcessingEncounter, addLogEntry]);

   // Daily effects from conditions for player and party
  useEffect(() => {
    // This effect runs at the start of a new day, AFTER an action is taken.
    if (gameState.day === 1) return;

    setGameState(prev => {
        let newHealth = prev.health;
        let partyAfterEffects = [...prev.party];
        const logMessages: { message: string, color: string }[] = [];
        let needsUpdate = false;

        // Starvation can happen anytime, anywhere if you have no food.
        if (prev.food <= 0) {
            logMessages.push({ message: "You are starving.", color: 'text-red-500' });
            newHealth -= 5;
            partyAfterEffects = partyAfterEffects.map(member => {
                if (member.health > 0) {
                    logMessages.push({ message: `${member.name} is starving.`, color: 'text-red-500' });
                }
                return {
                    ...member,
                    health: member.health - 5,
                    relationship: Math.max(0, member.relationship - 3),
                    mood: member.health <= 30 ? 'afraid' as const : 'worried' as const
                };
            });
            needsUpdate = true;
        }
        
        // Disease only has an effect while on the move.
        if (prev.phase === 'traveling') {
            if (prev.conditions.includes('Diseased')) {
                logMessages.push({ message: 'Your disease saps your strength.', color: 'text-red-500' });
                newHealth -= 5;
                needsUpdate = true;
            }
            partyAfterEffects = partyAfterEffects.map(member => {
                let currentMember = member;
                if (member.conditions.includes('Diseased')) {
                     logMessages.push({ message: `${member.name}'s disease worsens.`, color: 'text-red-500' });
                     currentMember = { ...currentMember, health: currentMember.health - 5 };
                     needsUpdate = true;
                }
                return currentMember;
            });
        }
        
        partyAfterEffects = partyAfterEffects.map(p => ({...p, health: Math.max(0, p.health)}));
        const { living, hasDeaths } = checkPartyDeaths(partyAfterEffects, prev.day);

        if (needsUpdate || hasDeaths) {
            if (logMessages.length > 0) {
                logMessages.forEach(msg => addLogEntry(msg.message, msg.color));
            }
            return { ...prev, health: Math.max(0, newHealth), party: living };
        }

        return prev;
    });

  }, [gameState.day, addLogEntry]); // Dependency on phase removed to allow starvation in camp


  useEffect(() => {
    if (isGameOver) return;

    if (gameState.distanceToRome <= 0) {
      onGameEnd("You have reached the eternal city of Rome! Your arduous journey is complete.", true);
      setIsGameOver(true);
    } else if (gameState.health <= 0) {
      onGameEnd(`Your health failed you. Your journey ends here.`, false);
      setIsGameOver(true);
    } else if (gameState.food <= 0 && gameState.money <= 0 && !gameState.inventory['Jerky']) {
        onGameEnd(`You are without food or money and have starved. Your journey ends here.`, false);
        setIsGameOver(true);
    }

  }, [gameState, onGameEnd, isGameOver]);
  
  const getActionButtons = () => {
    switch(gameState.phase) {
        case 'traveling':
            return [
                { label: '1 - Travel', action: 'Travel', key: '1' },
                { label: '2 - Hunt', action: 'Hunt', key: '2' },
                { label: '3 - Make Camp', action: 'Make Camp', key: '3' },
            ];
        case 'camp':
            const campActions = [
                { label: '1 - Rest', action: 'Rest', key: '1' },
                { label: '2 - Craft', action: 'Craft', key: '2' },
                { label: '3 - Feed Party', action: 'Feed Party', key: '3' },
            ];
            // Foraging professions
            if (player.profession === Profession.Apothecary || player.profession === Profession.Herbalist || player.profession === Profession.Midwife) {
                campActions.push({ label: '4 - Forage', action: 'Forage for Herbs', key: '4' });
            }
            // Repair professions
            if (player.profession === Profession.Blacksmith) {
                campActions.push({ label: '5 - Repair Wagon', action: 'Repair Wagon', key: '5' });
            }
            campActions.push({ label: '6 - Use Item', action: 'Use Item', key: '6' });
            campActions.push({ label: '7 - Break Camp', action: 'Break Camp', key: '7' });
            return campActions;
        case 'in_city':
            return [
                { label: '1 - Visit Market', action: 'Visit Market', key: '1' },
                { label: '2 - Leave City', action: 'Leave City', key: '2' },
            ];
        case 'merchant_encounter':
             return [
                { label: '1 - Trade', action: 'Trade with Merchant', key: '1' },
                { label: '2 - Continue Journey', action: 'Ignore Merchant', key: '2' },
            ];
        default: return [];
    }
  }

  const actionButtons = getActionButtons();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (activeWindow && event.key === 'Escape') {
            setActiveWindow(null);
            setItemTarget(null);
            return;
        }
        if (activeWindow) return;

        const actionBinding = actionButtons.find(b => b.key === event.key);
        if (actionBinding) {
            handleAction(actionBinding.action as PlayerAction);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, actionButtons, activeWindow]);

  const getRelationshipText = (relationship: number) => {
    if (relationship >= 90) return { text: 'Devoted', color: 'text-green-400', desc: 'They would die for you' };
    if (relationship >= 75) return { text: 'Loyal', color: 'text-green-300', desc: 'They trust your judgment' };
    if (relationship >= 60) return { text: 'Trusting', color: 'text-blue-300', desc: 'They believe in you' };
    if (relationship >= 40) return { text: 'Uncertain', color: 'text-yellow-400', desc: 'They have doubts' };
    if (relationship >= 20) return { text: 'Distant', color: 'text-orange-400', desc: 'They question everything' };
    return { text: 'Resentful', color: 'text-red-400', desc: 'They may abandon you' };
  };

  const getTrustText = (trust: number) => {
    if (trust >= 80) return { text: 'Complete', color: 'text-cyan-400' };
    if (trust >= 60) return { text: 'Strong', color: 'text-blue-300' };
    if (trust >= 40) return { text: 'Wavering', color: 'text-yellow-400' };
    if (trust >= 20) return { text: 'Fragile', color: 'text-orange-400' };
    return { text: 'Broken', color: 'text-red-400' };
  };

  const getMoodEmoji = (mood: string) => {
    switch(mood) {
      case 'devoted': return '🥰';
      case 'content': return '😊';
      case 'worried': return '😟';
      case 'afraid': return '😨';
      case 'angry': return '😠';
      case 'hopeful': return '🙂';
      default: return '😐';
    }
  };

  const getTraitEmoji = (trait: string) => {
    switch(trait) {
      case 'brave': return '⚔️';
      case 'cautious': return '🛡️';
      case 'optimistic': return '🌟';
      case 'pessimistic': return '☁️';
      case 'faithful': return '✝️';
      case 'pragmatic': return '🔧';
      case 'protective': return '🤝';
      case 'independent': return '🦅';
      default: return '💭';
    }
  };

  const renderWindowContent = () => {
    switch (activeWindow) {
        case 'Description': return <div><h3 className="text-2xl text-amber-100 mb-2">{player.profession}</h3><p className="text-gray-300">{PROFESSION_STATS[player.profession].description}</p></div>;
        case 'Inventory':
            const inventoryItems = Object.entries(gameState.inventory);
            return (
                <div className="space-y-3">
                    {inventoryItems.length > 0 ? (
                        inventoryItems.map(([item, quantity]) => {
                            const effect = ITEM_EFFECTS[item];
                            const description = ITEM_DESCRIPTIONS[item];
                            const icon = ITEM_ICONS[item] || '📦';
                            return (
                                <div key={item} className="bg-stone-700/30 p-3 rounded-lg border border-amber-600/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{icon}</span>
                                            <div>
                                                <div className="text-amber-200 font-bold text-base">{item}</div>
                                                <div className="text-sm text-gray-400">Quantity: {quantity}</div>
                                            </div>
                                        </div>
                                        {effect && (
                                            <button
                                                onClick={() => handleUseItem(item)}
                                                className="text-sm px-3 py-1 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-stone-900 disabled:border-gray-500 disabled:text-gray-500 disabled:cursor-not-allowed rounded-md transition-colors"
                                            >
                                                Use
                                            </button>
                                        )}
                                    </div>
                                    {description && (
                                        <p className="text-sm text-gray-300 italic">{description}</p>
                                    )}
                                    {effect && (
                                        <p className="text-xs text-amber-400 mt-1">Effect: {effect.description}</p>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400 italic text-base">Your bags are empty.</p>
                        </div>
                    )}
                </div>
            );
        case 'History': return <Log log={log} />;
        case 'Party': return (
            <div className="space-y-4">
                {gameState.party.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">You travel alone. Your family did not survive the journey.</p>
                ) : (
                    gameState.party.map(member => {
                        const relStatus = getRelationshipText(member.relationship);
                        const trustStatus = getTrustText(member.trust);
                        const canHaveDeepTalk = !member.lastConversation || (gameState.day - member.lastConversation) >= 3;

                        return (
                            <div key={member.name} className="bg-gradient-to-br from-stone-700/40 to-stone-800/40 p-4 rounded-lg border-2 border-amber-600/30 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl text-amber-200 font-bold">{member.name}</h3>
                                        <p className="text-sm text-gray-400 capitalize">{member.role}</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-2xl" title={member.personalityTrait}>{getTraitEmoji(member.personalityTrait)}</span>
                                        <span className="text-2xl" title={`Mood: ${member.mood}`}>{getMoodEmoji(member.mood)}</span>
                                    </div>
                                </div>

                                {/* Health & Conditions */}
                                <div className="bg-stone-900/50 p-2 rounded space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Health:</span>
                                        <span className={member.health < 30 ? 'text-red-400 font-bold' : member.health < 60 ? 'text-yellow-400' : 'text-green-400'}>{member.health}/100</span>
                                    </div>
                                    {member.conditions.length > 0 && (
                                        <div className="text-xs text-red-400">
                                            Conditions: {member.conditions.join(', ')}
                                        </div>
                                    )}
                                </div>

                                {/* Relationship & Trust */}
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Relationship: <span className={relStatus.color}>{relStatus.text}</span></span>
                                            <span className="text-gray-500">{member.relationship}/100</span>
                                        </div>
                                        <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${member.relationship >= 75 ? 'bg-green-500' : member.relationship >= 60 ? 'bg-blue-400' : member.relationship >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${member.relationship}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 italic mt-0.5">{relStatus.desc}</p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Trust: <span className={trustStatus.color}>{trustStatus.text}</span></span>
                                            <span className="text-gray-500">{member.trust}/100</span>
                                        </div>
                                        <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${member.trust >= 60 ? 'bg-cyan-500' : member.trust >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${member.trust}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleOpenInventoryForTarget(member)}
                                        className="text-xs px-3 py-2 bg-amber-600/20 border border-amber-500 text-amber-300 hover:bg-amber-600/40 transition-colors rounded-md font-semibold"
                                    >
                                        Use Item
                                    </button>

                                    <button
                                        onClick={() => {
                                            setActiveWindow(null);
                                            const gain = 3;
                                            addLogEntry(`You share a brief conversation with ${member.name.split(' ')[0]}.`, 'text-cyan-300');
                                            setGameState(prev => ({
                                                ...prev,
                                                party: prev.party.map(m =>
                                                    m.name === member.name
                                                        ? { ...m, relationship: Math.min(100, m.relationship + gain), mood: m.relationship >= 60 ? 'content' as const : m.mood }
                                                        : m
                                                )
                                            }));
                                        }}
                                        className="text-xs px-3 py-2 bg-cyan-600/20 border border-cyan-500 text-cyan-300 hover:bg-cyan-600/40 transition-colors rounded-md font-semibold"
                                    >
                                        Talk (+3)
                                    </button>
                                </div>

                                {/* Deep Conversation (requires time) */}
                                {canHaveDeepTalk && (
                                    <button
                                        onClick={() => {
                                            setActiveWindow(null);
                                            const gain = member.relationship >= 60 ? 8 : 5;
                                            const trustGain = 3;
                                            addLogEntry(`You have a deep conversation with ${member.name.split(' ')[0]} about the journey and what lies ahead. They seem ${member.relationship >= 60 ? 'grateful' : 'thoughtful'}.`, 'text-cyan-300');
                                            setGameState(prev => ({
                                                ...prev,
                                                party: prev.party.map(m =>
                                                    m.name === member.name
                                                        ? {
                                                            ...m,
                                                            relationship: Math.min(100, m.relationship + gain),
                                                            trust: Math.min(100, m.trust + trustGain),
                                                            lastConversation: prev.day,
                                                            mood: m.relationship >= 75 ? 'devoted' as const : m.relationship >= 60 ? 'content' as const : 'hopeful' as const
                                                          }
                                                        : m
                                                )
                                            }));
                                        }}
                                        className="w-full text-sm px-4 py-2 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-2 border-purple-500 text-purple-300 hover:from-purple-600/50 hover:to-blue-600/50 transition-colors rounded-md font-bold"
                                    >
                                        💬 Deep Conversation (+{member.relationship >= 60 ? 8 : 5} relationship, +3 trust)
                                    </button>
                                )}
                                {!canHaveDeepTalk && (
                                    <div className="text-xs text-gray-500 text-center italic">
                                        (Deep conversation available in {3 - (gameState.day - (member.lastConversation || 0))} days)
                                    </div>
                                )}

                                {/* Special Options based on relationship */}
                                {member.relationship >= 80 && (
                                    <div className="pt-2 border-t border-green-500/30">
                                        <p className="text-xs text-green-400 italic text-center">
                                            ✨ {member.name.split(' ')[0]} is deeply devoted to you and will follow you anywhere
                                        </p>
                                    </div>
                                )}
                                {member.relationship < 30 && (
                                    <div className="pt-2 border-t border-red-500/30">
                                        <p className="text-xs text-red-400 italic text-center">
                                            ⚠️ {member.name.split(' ')[0]} questions your leadership and may leave if things don't improve
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        );
        case 'Market':
            const merchantBonus = (player.profession === Profession.Merchant || player.profession === Profession.Merchant_F) ? 0.15 : 0;
            const priceModifier = gameState.phase === 'merchant_encounter' ? 1.25 : 1; // Merchants on the road are more expensive
            const buyModifier = (1 - merchantBonus) * priceModifier;
            const sellModifier = (1 + merchantBonus) / priceModifier;

            const itemsToTrade = { ...ITEM_PRICES };
            Object.keys(gameState.inventory).forEach(item => {
                if (!itemsToTrade[item] && ITEM_PRICES[item]?.sell > 0) {
                    itemsToTrade[item] = ITEM_PRICES[item];
                }
            });

            const cartTotal = Object.entries(cart).reduce((sum, [item, { quantity, type }]) => {
                const prices = ITEM_PRICES[item];
                if (!prices) return sum;
                const price = type === 'buy' ? Math.ceil(prices.buy * buyModifier) : Math.floor(prices.sell * sellModifier);
                return sum + (type === 'buy' ? -price * quantity : price * quantity);
            }, 0);

            const addToCart = (item: string, type: 'buy' | 'sell', qty: number) => {
                setCart(prev => {
                    const existing = prev[item];
                    if (existing && existing.type === type) {
                        return { ...prev, [item]: { type, quantity: Math.max(0, existing.quantity + qty) } };
                    }
                    return qty > 0 ? { ...prev, [item]: { type, quantity: qty } } : prev;
                });
            };

            const removeFromCart = (item: string) => {
                setCart(prev => {
                    const newCart = { ...prev };
                    delete newCart[item];
                    return newCart;
                });
            };

            const completeTransaction = () => {
                let canAfford = true;
                let totalCost = 0;

                // Check if we can afford everything
                Object.entries(cart).forEach(([item, { quantity, type }]) => {
                    const prices = ITEM_PRICES[item];
                    if (!prices) return;
                    const price = type === 'buy' ? Math.ceil(prices.buy * buyModifier) : Math.floor(prices.sell * sellModifier);
                    totalCost += (type === 'buy' ? price * quantity : -price * quantity);
                });

                if (gameState.money < totalCost) {
                    addLogEntry("You don't have enough money for this transaction.", 'text-red-400');
                    return;
                }

                // Process all transactions
                Object.entries(cart).forEach(([item, { quantity, type }]) => {
                    const prices = ITEM_PRICES[item];
                    if (!prices) return;
                    const price = type === 'buy' ? Math.ceil(prices.buy * buyModifier) : Math.floor(prices.sell * sellModifier);
                    handleMarketTransaction(type, item, quantity, price);
                });

                setCart({});
            };

            return (
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-amber-600/30 pb-2">
                        <h3 className="text-xl text-amber-200">Market Goods</h3>
                        <div className="text-sm text-gray-400">
                            Your Money: <span className="text-amber-300 font-bold">{gameState.money}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Items for sale */}
                        <div className="bg-stone-800/30 p-3 rounded-lg border border-green-600/20">
                            <h4 className="text-green-400 font-bold mb-2 text-sm">Buy Items</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {Object.entries(itemsToTrade).filter(([_, prices]) => prices.buy > 0).map(([item, prices]) => {
                                    const buyPrice = Math.ceil(prices.buy * buyModifier);
                                    const cartQty = cart[item]?.type === 'buy' ? cart[item].quantity : 0;
                                    return (
                                        <div key={item} className="flex items-center justify-between bg-stone-900/50 p-2 rounded">
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-200">{ITEM_ICONS[item] || '📦'} {item}</div>
                                                <div className="text-xs text-green-400">{buyPrice} 💰</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => addToCart(item, 'buy', -1)} className="px-2 py-0.5 bg-red-700/50 hover:bg-red-600 text-white text-xs rounded">-</button>
                                                <span className="text-xs w-8 text-center text-amber-200">{cartQty}</span>
                                                <button onClick={() => addToCart(item, 'buy', 1)} className="px-2 py-0.5 bg-green-700/50 hover:bg-green-600 text-white text-xs rounded">+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Items to sell */}
                        <div className="bg-stone-800/30 p-3 rounded-lg border border-yellow-600/20">
                            <h4 className="text-yellow-400 font-bold mb-2 text-sm">Sell Items</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {Object.entries(itemsToTrade).filter(([item, prices]) => {
                                    const currentAmount = item === 'Food' ? gameState.food : item === 'Oxen' ? gameState.oxen : (gameState.inventory[item] || 0);
                                    return prices.sell > 0 && currentAmount > 0;
                                }).map(([item, prices]) => {
                                    const sellPrice = Math.floor(prices.sell * sellModifier);
                                    const cartQty = cart[item]?.type === 'sell' ? cart[item].quantity : 0;
                                    const currentAmount = item === 'Food' ? gameState.food : item === 'Oxen' ? gameState.oxen : (gameState.inventory[item] || 0);
                                    return (
                                        <div key={item} className="flex items-center justify-between bg-stone-900/50 p-2 rounded">
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-200">{ITEM_ICONS[item] || '📦'} {item}</div>
                                                <div className="text-xs text-yellow-400">{sellPrice} 💰 <span className="text-gray-500">(Have: {currentAmount})</span></div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => addToCart(item, 'sell', -1)} className="px-2 py-0.5 bg-red-700/50 hover:bg-red-600 text-white text-xs rounded">-</button>
                                                <span className="text-xs w-8 text-center text-amber-200">{cartQty}</span>
                                                <button onClick={() => addToCart(item, 'sell', Math.min(1, currentAmount - cartQty))} className="px-2 py-0.5 bg-green-700/50 hover:bg-green-600 text-white text-xs rounded">+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Shopping Cart */}
                    {Object.keys(cart).length > 0 && (
                        <div className="bg-amber-900/20 p-3 rounded-lg border-2 border-amber-600/50">
                            <h4 className="text-amber-300 font-bold mb-2">Transaction Summary</h4>
                            <div className="space-y-1 mb-3">
                                {Object.entries(cart).map(([item, { quantity, type }]) => {
                                    const prices = ITEM_PRICES[item];
                                    const price = type === 'buy' ? Math.ceil(prices.buy * buyModifier) : Math.floor(prices.sell * sellModifier);
                                    const total = price * quantity;
                                    return (
                                        <div key={item} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">
                                                {type === 'buy' ? '🛒' : '💰'} {quantity}x {item}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={type === 'buy' ? 'text-red-400' : 'text-green-400'}>
                                                    {type === 'buy' ? '-' : '+'}{total}
                                                </span>
                                                <button onClick={() => removeFromCart(item)} className="text-xs text-red-400 hover:text-red-300">✕</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between border-t border-amber-600/30 pt-2">
                                <span className="font-bold text-amber-200">Net Total:</span>
                                <span className={`font-bold text-lg ${cartTotal < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {cartTotal < 0 ? '' : '+'}{cartTotal} 💰
                                </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={completeTransaction}
                                    disabled={gameState.money < -cartTotal}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-bold"
                                >
                                    Complete Transaction
                                </button>
                                <button
                                    onClick={() => setCart({})}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                                >
                                    Clear Cart
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'Hunt':
            return (
                <div>
                    <p className="text-lg text-amber-100 mb-4">You scan the area for prey. What do you hunt?</p>
                    <ul className="space-y-3">
                        {huntOptions.map(animal => {
                             let chanceColor = 'text-yellow-400';
                             if (animal.successChance > 70) chanceColor = 'text-green-400';
                             if (animal.successChance < 50) chanceColor = 'text-red-400';
                             return (
                                <li key={animal.name}>
                                    <button onClick={() => handleHuntAttempt(animal)} className="w-full text-left p-3 border-2 border-amber-600/30 hover:bg-amber-600/20 transition-colors rounded-lg">
                                        <div className="flex justify-between items-center font-bold text-xl">
                                            <span className="text-amber-200">{animal.name}</span>
                                            <span className={chanceColor}>{animal.successChance}% Chance</span>
                                        </div>
                                        <p className="text-sm text-gray-400">{animal.description}</p>
                                        <div className="flex justify-between text-sm mt-2 text-gray-300">
                                            <span>Food: {animal.foodYield.join('-')}</span>
                                            {animal.injuryRisk > 0 && <span className="text-red-400">Risk: {animal.injuryRisk}% Injury</span>}
                                        </div>
                                    </button>
                                </li>
                             )
                        })}
                    </ul>
                </div>
            )
        case 'References':
            return (
                <div className="space-y-6 text-sm">
                    <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
                        <h3 className="text-lg text-amber-200 font-bold mb-2">📚 Academic Sources & References</h3>
                        <p className="text-gray-300 text-xs italic mb-3">
                            This game draws upon academic research and primary sources to recreate authentic Early Modern European travel experiences.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Coryat's Crudities</h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                Thomas Coryat's 1611 travel account through France, Italy, and Germany. Provides vivid observations on customs, food, accommodations, and the practicalities of Early Modern travel.
                            </p>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Michel de Montaigne's Journal</h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                The French philosopher's travel journal (1580-1581) documenting his journey through France, Switzerland, Germany, and Italy. Offers intimate perspectives on Early Modern travel conditions and experiences.
                            </p>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Merry Wiesner-Hanks' <em>Early Modern Europe</em></h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                Comprehensive academic survey of Early Modern European social, economic, and cultural history. Essential context for understanding the period's daily life, social structures, and historical developments.
                            </p>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Benvenuto Cellini's Autobiography</h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                The famous Renaissance artist and goldsmith's vivid autobiography includes detailed accounts of his travels through Italy and France, providing insight into the experiences of skilled craftsmen moving between European cities.
                            </p>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Gabor Gelleri's <em>From Touring to Training</em></h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                Academic study examining the evolution and purposes of early modern travel, from educational tours to professional training journeys, illuminating the diverse motivations behind European travel during this period.
                            </p>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Daniel Margocsy's <em>The Fuzzy Metrics of Money</em></h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                <span className="font-semibold">Full title:</span> "The finances of travel and the reception of curiosities in early modern Europe."
                                <br /><br />
                                Scholarly examination of the economic dimensions of early modern travel, exploring how travelers financed their journeys and the complex monetary systems they navigated across different European territories.
                            </p>
                        </div>
                    </div>
                </div>
            );
        case 'Index':
            return (
                <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto">
                    <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-600/30">
                        <h3 className="text-lg text-amber-200 font-bold mb-2">📖 Game Index & Reference</h3>
                        <p className="text-gray-300 text-xs italic">
                            Quick reference for all game stats, conditions, and mechanics
                        </p>
                    </div>

                    {/* Stats Section */}
                    <div className="bg-stone-700/30 p-3 rounded-lg border border-amber-600/20">
                        <h4 className="text-amber-300 font-bold mb-2">📊 Stats</h4>
                        <div className="space-y-2">
                            {Object.entries(STAT_TOOLTIPS).map(([stat, tooltip]) => (
                                <div key={stat} className="bg-stone-800/50 p-2 rounded">
                                    <div className="text-amber-200 font-semibold capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}</div>
                                    <div className="text-gray-300 text-xs mt-1">{tooltip}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Conditions Section */}
                    <div className="bg-stone-700/30 p-3 rounded-lg border border-red-600/20">
                        <h4 className="text-red-300 font-bold mb-2">⚠️ Conditions</h4>
                        <div className="space-y-2">
                            {Object.entries(CONDITION_TOOLTIPS).map(([condition, tooltip]) => (
                                <div key={condition} className="bg-stone-800/50 p-2 rounded border-l-2 border-red-500">
                                    <div className="text-red-200 font-semibold">{condition}</div>
                                    <div className="text-gray-300 text-xs mt-1">{tooltip}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Game Phases Section */}
                    <div className="bg-stone-700/30 p-3 rounded-lg border border-amber-600/20">
                        <h4 className="text-amber-300 font-bold mb-2">🗺️ Game Phases</h4>
                        <div className="space-y-2">
                            {Object.entries(PHASE_TOOLTIPS).map(([phase, tooltip]) => (
                                <div key={phase} className="bg-stone-800/50 p-2 rounded">
                                    <div className="text-amber-200 font-semibold capitalize">{phase.replace('_', ' ')}</div>
                                    <div className="text-gray-300 text-xs mt-1">{tooltip}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weather Section */}
                    <div className="bg-stone-700/30 p-3 rounded-lg border border-blue-600/20">
                        <h4 className="text-blue-300 font-bold mb-2">🌦️ Weather Conditions</h4>
                        <div className="space-y-2">
                            {Object.entries(WEATHER_TOOLTIPS).map(([weather, tooltip]) => (
                                <div key={weather} className="bg-stone-800/50 p-2 rounded">
                                    <div className="text-blue-200 font-semibold">{weather}</div>
                                    <div className="text-gray-300 text-xs mt-1">{tooltip}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Moods Section */}
                    <div className="bg-stone-700/30 p-3 rounded-lg border border-pink-600/20">
                        <h4 className="text-pink-300 font-bold mb-2">😊 Family Moods</h4>
                        <div className="space-y-2">
                            {Object.entries(MOOD_TOOLTIPS).map(([mood, tooltip]) => (
                                <div key={mood} className="bg-stone-800/50 p-2 rounded">
                                    <div className="text-pink-200 font-semibold capitalize">{mood}</div>
                                    <div className="text-gray-300 text-xs mt-1">{tooltip}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        default: return null;
    }
  };

  const isCamp = gameState.phase === 'camp';
  const isCity = gameState.phase === 'in_city';
  const borderColor = isCity ? 'border-purple-500' : isCamp ? 'border-sky-500' : 'border-amber-500';
  const accentColor = isCity ? 'amber-500' : isCamp ? 'sky-500' : 'amber-500';
  
  const getModalTitle = () => {
      if (activeWindow === 'Inventory' && itemTarget) {
          return `Use Item on ${itemTarget.name}`;
      }
      if (activeWindow === 'Market' && gameState.currentLocation) {
          return `Market in ${gameState.currentLocation.replace("the town of ","").replace("the city of ","")}`;
      }
      if (activeWindow === 'Market' && gameState.phase === 'merchant_encounter') {
          return 'Traveling Merchant';
      }
      return activeWindow || '';
  }

  return (
    <>
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-500" style={{backgroundImage: "url('/background.jpg')", filter: (isCamp || isCity) ? 'brightness(0.5)' : 'brightness(1)'}}></div>
      <div className={`pointer-events-none fixed inset-0 z-50 ${gameState.health < 25 ? 'animate-pulse-red' : ''}`}></div>

      <SettingsMenu onRestartRun={onRestartRun} />

      <div className="flex h-[95vh] max-h-[900px] relative z-10">

        <div className={`flex-grow flex flex-col space-y-4 bg-gradient-to-b from-stone-800/80 to-stone-900/80 p-4 border-2 ${borderColor} shadow-2xl transition-all duration-500 relative z-20 rounded-xl`}>
           <MapView distanceTraveled={gameState.distanceTraveled} phase={gameState.phase} player={player} />
           <SuppliesBar
             phase={gameState.phase}
             health={gameState.health}
             stamina={gameState.stamina}
             food={gameState.food}
             money={gameState.money}
             oxen={gameState.oxen}
             ammunition={gameState.ammunition}
             spareParts={gameState.spareParts}
             hasWagon={gameState.hasWagon}
             location={gameState.currentLocation}
             weather={gameState.weather}
             terrain={gameState.terrain}
             rationLevel={gameState.rationLevel}
             onRationChange={(level) => setGameState({ ...gameState, rationLevel: level })}
             weeklyFocus={gameState.weeklyFocus}
             onWeeklyFocusChange={(focus) => setGameState({ ...gameState, weeklyFocus: focus })}
           />
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex-grow mb-4 min-h-0 max-h-[45vh] h-full">
              <Log log={log} />
            </div>
            <div className={`flex-shrink-0 min-h-32 flex flex-col items-center justify-center p-4 border-t-2 ${isCity ? 'border-purple-600/50' : isCamp ? 'border-sky-600/50' : 'border-amber-600/50'}`}>
              {/* Date Display */}
              <div className="mb-3 text-center">
                <div className={`text-2xl font-bold ${isCity ? 'text-purple-300' : isCamp ? 'text-sky-300' : 'text-amber-300'} text-shadow-glow`}>
                  {formatDate(gameState.dayOfMonth, gameState.month, gameState.year)}
                </div>
                <div className="text-xs text-gray-400 mt-1 italic">
                  {getHistoricalContext(gameState.year)}
                </div>
              </div>

              {isLoading && (
                  <div className="flex flex-col items-center">
                      <LoadingSpinner />
                      <p className={`mt-2 ${isCity ? 'text-purple-300' : isCamp ? 'text-sky-300' : 'text-amber-300'}`}>Processing...</p>
                  </div>
              )}
              {!isLoading && !isGameOver && (
                  <div className="flex flex-col gap-3 items-center w-full max-w-4xl mx-auto">
                      {/* Primary Action - Travel */}
                      {actionButtons.some(btn => btn.action === 'Travel') && (
                        <button
                          onClick={() => handleAction('Travel')}
                          className="w-full max-w-md px-8 py-3 bg-amber-600 border-2 border-amber-400 text-stone-900 hover:bg-amber-500 hover:border-amber-300 hover:scale-105 transition-all rounded-lg font-bold text-lg shadow-2xl hover-glow"
                        >
                          🚶 (1) Travel (1 Week)
                        </button>
                      )}

                      {/* All Other Actions - Horizontal Layout */}
                      <div className="flex flex-wrap gap-2 justify-center w-full">
                          {/* Active Actions (Hunt, etc.) */}
                          {actionButtons.filter(btn =>
                              btn.action !== 'Travel' &&
                              btn.action !== 'Make Camp' &&
                              btn.action !== 'Break Camp' &&
                              btn.action !== 'Leave City'
                          ).map((btn) => {
                              const staminaRequiredActions = ['Hunt', 'Forage for Herbs', 'Repair Wagon'];
                              const requiresStamina = staminaRequiredActions.includes(btn.action);
                              const isDisabled = isLoading || (requiresStamina && gameState.stamina <= 0);

                              return (
                                  <ActionButton
                                    key={btn.action}
                                    onClick={() => handleAction(btn.action as PlayerAction)}
                                    disabled={isDisabled}
                                    variant={isCity ? 'purple' : isCamp ? 'sky' : 'amber'}
                                  >
                                      {btn.label}
                                      {requiresStamina && gameState.stamina <= 0 && <span className="text-xs ml-1">(Exhausted)</span>}
                                  </ActionButton>
                              );
                          })}

                          {/* Rest/Camp Actions */}
                          {actionButtons.filter(btn =>
                              btn.action === 'Make Camp' ||
                              btn.action === 'Break Camp' ||
                              btn.action === 'Leave City'
                          ).map((btn) => (
                              <button
                                key={btn.action}
                                onClick={() => handleAction(btn.action as PlayerAction)}
                                className={`px-6 py-2.5 ${
                                  btn.action === 'Make Camp'
                                    ? 'bg-sky-700 border-2 border-sky-500 text-white hover:bg-sky-600'
                                    : btn.action === 'Leave City'
                                    ? 'bg-purple-700 border-2 border-purple-500 text-white hover:bg-purple-600'
                                    : 'bg-amber-700 border-2 border-amber-500 text-white hover:bg-amber-600'
                                } transition-all rounded-lg font-bold text-sm shadow-lg min-w-[140px]`}
                              >
                                  {btn.action === 'Make Camp' && '🏕️ '}
                                  {btn.action === 'Break Camp' && '🌅 '}
                                  {btn.action === 'Leave City' && '🚪 '}
                                  {btn.label}
                              </button>
                          ))}
                      </div>

                      {/* DEV MODE Controls */}
                      {devMode && !isGameOver && (
                        <div className="mt-4 pt-4 border-t-2 border-red-600/50">
                          <p className="text-xs text-red-400 mb-2 text-center font-bold">DEV MODE ACTIVE</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            <button
                              onClick={() => {
                                const nextCheckpoint = player.routeCheckpoints[nextCheckpointIndex];
                                if (nextCheckpoint) {
                                  setGameState(prev => ({
                                    ...prev,
                                    distanceTraveled: nextCheckpoint.distance,
                                    distanceToRome: player.distanceToRome - nextCheckpoint.distance,
                                    phase: 'in_city',
                                    currentLocation: `the city of ${nextCheckpoint.name}`
                                  }));
                                  setNextCheckpointIndex(prev => prev + 1);
                                  addLogEntry(`[DEV] Teleported to ${nextCheckpoint.name}`, 'text-red-400');
                                } else {
                                  addLogEntry(`[DEV] No more cities!`, 'text-red-400');
                                }
                              }}
                              className="px-3 py-1 bg-red-900/50 border border-red-600 text-red-300 hover:bg-red-800/50 text-xs rounded"
                            >
                              Skip to Next City
                            </button>
                            <button
                              onClick={() => {
                                setGameState(prev => ({
                                  ...prev,
                                  distanceTraveled: TOTAL_DISTANCE_TO_ROME,
                                  distanceToRome: 0
                                }));
                                addLogEntry(`[DEV] Teleported to Rome!`, 'text-red-400');
                              }}
                              className="px-3 py-1 bg-red-900/50 border border-red-600 text-red-300 hover:bg-red-800/50 text-xs rounded"
                            >
                              Skip to End
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Character Sidebar */}
        <CharacterSidebar
          player={player}
          gameState={gameState}
          characterImageUrl={characterImageUrl}
          onUseItem={handleUseItem}
          onOpenInventoryForTarget={handleOpenInventoryForTarget}
          onOpenIndex={() => setActiveWindow('Index')}
        />
      </div>
      {activeWindow && (
        <ModalWindow title={getModalTitle()} onClose={() => {setActiveWindow(null); setItemTarget(null);}}>
            {renderWindowContent()}
        </ModalWindow>
      )}

      {/* Encounter Window */}
      {currentEncounter && (
        <EncounterWindow
          encounter={currentEncounter}
          gameState={gameState}
          onAction={handleEncounterAction}
          onClose={() => setCurrentEncounter(null)}
          isProcessing={isProcessingEncounter}
        />
      )}

      {/* Start Guide - Shows on first game load */}
      {showStartGuide && (
        <StartGuide onClose={() => setShowStartGuide(false)} />
      )}
    </>
  );
};

export default GameUI;