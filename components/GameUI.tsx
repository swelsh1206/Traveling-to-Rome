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
import CraftingWindow from './CraftingWindow';
import ForageWindow from './ForageWindow';
import PartyMemberDetail from './PartyMemberDetail';
import AlertNotification, { Alert, AlertType } from './AlertNotification';
import PostEventSummary from './PostEventSummary';
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
  const [selectedPartyMember, setSelectedPartyMember] = useState<PartyMember | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [postEventSummary, setPostEventSummary] = useState<{
    title: string;
    description: string;
    effects: Array<{ label: string; value: number; icon: string; color: string }>;
  } | null>(null);

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

  const addAlert = useCallback((type: AlertType, title: string, message: string) => {
    const newAlert: Alert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setAlerts(prev => [...prev, newAlert]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, 5000);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleOpenStorageForTarget = (member: PartyMember) => {
    setItemTarget(member);
    setActiveWindow('Storage');
  };

  const handleUseItem = useCallback((item: string, target?: PartyMember) => {
    const effect = ITEM_EFFECTS[item];
    if (!effect || (gameState.inventory[item] || 0) <= 0) return;

    setGameState(prev => {
        const newInventory = { ...prev.inventory, [item]: prev.inventory[item] - 1 };
        if (newInventory[item] <= 0) delete newInventory[item];

        let message = `You use ${item}.`;
        let newHealth = prev.health;
        let newConditions = [...prev.conditions];
        let newParty = [...prev.party];

        if (target) { // Targeting a party member
            message = `You use ${item} on ${target.name}.`;
            const targetIndex = newParty.findIndex(m => m.name === target.name);
            if (targetIndex > -1) {
                let member = { ...newParty[targetIndex] };
                if (effect.removesCondition) {
                     if (member.conditions.includes(effect.removesCondition as Condition)) {
                        member.conditions = member.conditions.filter(c => c !== effect.removesCondition);
                        message += ` ${target.name}'s ailment seems to subside.`;
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

  }, [addLogEntry, gameState.inventory, gameState.health, gameState.conditions]);

  const handleCraft = useCallback((recipeIndex: number) => {
    const recipe = CRAFTING_RECIPES[recipeIndex];
    if (!recipe) return;

    setGameState(prev => {
      let newInventory = { ...prev.inventory };
      let newAmmunition = prev.ammunition;

      // Deduct materials
      if (recipe.cost) {
        Object.entries(recipe.cost).forEach(([item, quantity]) => {
          if (item === 'Arrows') {
            newAmmunition -= quantity;
          } else {
            newInventory[item] = (newInventory[item] || 0) - quantity;
            if (newInventory[item] <= 0) delete newInventory[item];
          }
        });
      } else {
        // Legacy format
        if (recipe.item) {
          newInventory[recipe.item] = (newInventory[recipe.item] || 0) - 1;
          if (newInventory[recipe.item] <= 0) delete newInventory[recipe.item];
        }
        if (recipe.requires) {
          newInventory[recipe.requires] = (newInventory[recipe.requires] || 0) - 1;
          if (newInventory[recipe.requires] <= 0) delete newInventory[recipe.requires];
        }
      }

      // Add result
      const resultQty = recipe.resultQuantity || 1;
      if (recipe.result === 'Arrows') {
        newAmmunition += resultQty;
      } else {
        newInventory[recipe.result] = (newInventory[recipe.result] || 0) + resultQty;
      }

      addLogEntry(recipe.description, 'text-green-400');
      return { ...prev, inventory: newInventory, ammunition: newAmmunition };
    });

    // Keep window open so they can craft more
  }, [addLogEntry]);

  const handleForage = useCallback((results: Record<string, number>) => {
    setGameState(prev => {
      const newInventory = { ...prev.inventory };
      let message = 'Foraging complete! ';

      if (Object.keys(results).length === 0) {
        message = 'You search the area but find nothing useful.';
      } else {
        const items = Object.entries(results).map(([item, qty]) => `${qty}× ${item}`).join(', ');
        message += `Found: ${items}`;

        // Add items to inventory
        Object.entries(results).forEach(([item, qty]) => {
          newInventory[item] = (newInventory[item] || 0) + qty;
        });
      }

      addLogEntry(message, 'text-green-400');
      setActiveWindow(null);

      return { ...prev, inventory: newInventory };
    });
  }, [addLogEntry]);

  const checkPartyDeaths = (party: PartyMember[], currentDay: number): { living: PartyMember[], hasDeaths: boolean } => {
    const living: PartyMember[] = [];
    let hasDeaths = false;
    party.forEach(member => {
        if (member.health > 0) {
            living.push(member);
        } else {
            addLogEntry(`${member.name} has succumbed to the hardships of the road.`, 'text-red-700 font-bold');
            addAlert('death', 'Death in the Party', `${member.name} has died from the hardships of the journey.`);
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
              if (prev.ducats < cost) {
                  addLogEntry("You don't have enough ducats for that.", 'text-white');
                  return prev;
              }
              const itemChange = item === 'Food' || item === 'Mules' ? {} : { inventory: updateInventory(prev.inventory, [{ item, change: quantity }]) };
              addLogEntry(`You bought ${quantity} ${item} for ${cost} ducats.`, 'text-white');
              return {
                  ...prev,
                  ducats: prev.ducats - cost,
                  food: item === 'Food' ? prev.food + quantity : prev.food,
                  oxen: item === 'Mules' ? prev.oxen + quantity : prev.oxen,
                  ...itemChange,
              };
          } else { // sell
              const currentAmount = item === 'Food' ? prev.food : item === 'Mules' ? prev.oxen : (prev.inventory[item] || 0);
              if (currentAmount < quantity) {
                   addLogEntry(`You don't have that many ${item} to sell.`, 'text-white');
                   return prev;
              }
              const earnings = price * quantity;
              const itemChange = item === 'Food' || item === 'Mules' ? {} : { inventory: updateInventory(prev.inventory, [{ item, change: -quantity }]) };
              addLogEntry(`You sold ${quantity} ${item} for ${earnings} ducats.`, 'text-white');
              return {
                  ...prev,
                  ducats: prev.ducats + earnings,
                  food: item === 'Food' ? prev.food - quantity : prev.food,
                  oxen: item === 'Mules' ? prev.oxen - quantity : prev.oxen,
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

    // Calculate results first, then update state and log
    if (roll < successChance) {
        // Success
        const foodGained = Math.floor(Math.random() * (animal.foodYield[1] - animal.foodYield[0] + 1)) + animal.foodYield[0];
        addLogEntry(`Success! You hunted a ${animal.name} and gathered ${foodGained} food. (-${staminaCost} stamina, -${ammunitionCost} ammunition)`, 'text-white');
        setGameState(prev => ({
          ...prev,
          stamina: Math.max(0, prev.stamina - staminaCost),
          food: prev.food + foodGained,
          ammunition: prev.ammunition - ammunitionCost
        }));
    } else {
        // Failure
        const injuryRoll = Math.random() * 100;
        const wasInjured = injuryRoll < animal.injuryRisk;
        const message = wasInjured
          ? `The ${animal.name} fought back and escaped. You are now Wounded. (-${staminaCost} stamina, -${ammunitionCost} ammunition)`
          : `The ${animal.name} escaped. You return with nothing. (-${staminaCost} stamina, -${ammunitionCost} ammunition)`;

        addLogEntry(message, 'text-white');
        setGameState(prev => ({
          ...prev,
          stamina: Math.max(0, prev.stamina - staminaCost),
          conditions: wasInjured ? updateConditions(prev.conditions, ['Wounded']) : prev.conditions,
          ammunition: prev.ammunition - ammunitionCost
        }));
    }
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
     if (action === 'Leave City') {
        addLogEntry(`You leave ${gameState.currentLocation}.`, 'text-white');
        setGameState(prev => ({...prev, phase: 'traveling', currentLocation: null}));
        return;
     }
     if (action === 'Visit Market' || action === 'Trade with Merchant') {
        setActiveWindow('Market');
        return;
     }
     if (action === 'Stay at Inn') {
        // Inn costs based on social class and party size
        const baseCost = player.socialClass === 'High Nobility' ? 50 :
                        player.socialClass === 'Minor Nobility' ? 40 :
                        player.socialClass === 'Merchant Class' ? 30 : 25;
        const partyMultiplier = 1 + (gameState.party.length * 0.5); // More people = more rooms
        const innCost = Math.floor(baseCost * partyMultiplier);

        if (gameState.ducats < innCost) {
            addLogEntry("You don't have enough ducats to stay at the inn.", 'text-red-400');
            return;
        }

        addLogEntry(`You pay ${innCost} ducats for a comfortable stay at the inn. The warm beds, hearty meals, and rest restore everyone's health and stamina significantly. You feel well-rested and rejuvenated!`, 'text-cyan-300');
        setGameState(prev => {
            const restedParty = prev.party.map(p => ({
                ...p,
                health: Math.min(100, p.health + 40), // Increased from 30
                conditions: p.conditions.filter(c => c !== 'Exhausted'),
                mood: p.health < 50 ? 'hopeful' as const : p.mood,
                relationship: Math.min(100, p.relationship + 3) // Increased from 2
            }));

            // Add Well Rested buff
            const newBuff = {
                type: 'Well Rested' as const,
                duration: 3, // Lasts 3 weeks
                effects: {
                    healthRegen: 5, // +5 health per week
                    staminaBonus: 20, // +20 extra stamina regen per week
                    immuneToExhaustion: true
                },
                description: 'The comforts of the inn have left you refreshed and energized'
            };

            // Remove any existing Well Rested buff and add new one
            const updatedBuffs = prev.buffs.filter(b => b.type !== 'Well Rested');
            updatedBuffs.push(newBuff);

            return {
                ...prev,
                ducats: prev.ducats - innCost,
                stamina: 100, // Fully restore stamina
                health: Math.min(100, prev.health + 40), // Increased from 30
                conditions: prev.conditions.filter(c => c !== 'Exhausted'),
                party: restedParty,
                buffs: updatedBuffs,
            };
        });
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
        setActiveWindow('Crafting');
        return;
    }
    if (action === 'Forage for Herbs') {
        setActiveWindow('Forage');
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

        // Repairing requires time, effort, and some improvised materials
        addLogEntry('You spend time repairing the wagon with improvised materials and hard work. It should hold together for now.', 'text-white');
        setGameState(prev => ({
            ...prev,
            stamina: Math.max(0, prev.stamina - 25), // Costs more stamina without proper parts
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

        // Check for instant death from dangerous events (robbery, murder, execution, etc.)
        if ((outcome as any).instant_death) {
            const deathMessage = (outcome as any).death_message || 'You met a tragic end on the road to Rome.';
            addLogEntry(outcome.description, 'text-red-700 font-bold');
            addLogEntry(`DEATH: ${deathMessage}`, 'text-red-900 font-bold');
            // Trigger game over
            setTimeout(() => {
                onGameEnd(deathMessage, false);
                setIsGameOver(true);
            }, 100);
            return newState;
        }

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
            let staminaRestore = newState.rationLevel === 'filling' ? 80 :
                                 newState.rationLevel === 'normal' ? 60 : 30;

            // Process active buffs during travel
            let buffHealthRegen = 0;
            const updatedBuffs = newState.buffs.map(buff => {
                // Apply buff effects
                if (buff.effects.healthRegen) {
                    buffHealthRegen += buff.effects.healthRegen;
                }
                if (buff.effects.staminaBonus) {
                    staminaRestore += buff.effects.staminaBonus;
                }

                // Tick down duration
                return {
                    ...buff,
                    duration: buff.duration - 1
                };
            }).filter(buff => {
                // Remove expired buffs and log
                if (buff.duration <= 0) {
                    logMessages.push({
                        message: `The "${buff.type}" buff has worn off.`,
                        color: 'text-gray-400'
                    });
                    return false;
                }
                return true;
            });

            newState.buffs = updatedBuffs;
            newState.stamina = Math.min(100, newState.stamina + staminaRestore);

            // Apply buff health regeneration
            if (buffHealthRegen > 0) {
                newState.health = Math.min(100, newState.health + buffHealthRegen);
                logMessages.push({
                    message: `Your buffs restore ${buffHealthRegen} health.`,
                    color: 'text-green-400'
                });
            }
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
        // INCREASED BASE CONSUMPTION for more challenge
        let foodConsumed = 0;
        if (action === 'Travel') {
            const partySize = 1 + newState.party.length;
            const baseFoodPerPerson = 3; // Increased from 1 to 3 for more challenge
            const rationMultiplier = newState.rationLevel === 'filling' ? 2 :
                                   newState.rationLevel === 'normal' ? 1 : 0.5;
            foodConsumed = Math.ceil(partySize * baseFoodPerPerson * rationMultiplier); // Weekly consumption
        }
        newState.food = Math.max(0, newState.food + outcome.food_change - foodConsumed);

        newState.ducats = Math.max(0, newState.ducats + outcome.money_change);
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
        // Show encounter window immediately with loading state
        const placeholderEncounter: Encounter = {
            npc: {
                name: 'Loading...',
                type: 'traveler',
                description: 'Generating encounter...',
                mood: 'neutral',
                profession: 'Unknown',
                origin: 'Unknown',
                destination: 'Unknown',
                age: 0,
                reason: 'Seeking Spiritual Renewal'
            },
            options: [],
            context: ''
        };
        setCurrentEncounter(placeholderEncounter);
        setIsProcessingEncounter(true);

        // Generate actual encounter in background
        const encounter = await generateEncounter(player, gameState);
        if (encounter) {
            setCurrentEncounter(encounter);
            addLogEntry(`You encounter ${encounter.npc.name} on the road.`, 'text-cyan-300', newDay);
        } else {
            setCurrentEncounter(null);
        }
        setIsProcessingEncounter(false);
    }

  }, [player, gameState, addLogEntry, isGameOver, isLoading, nextCheckpointIndex]);

  // Handle encounter actions
  const handleEncounterAction = useCallback(async (optionIndex: number, customInput?: string) => {
    if (!currentEncounter || isProcessingEncounter) return;

    setIsProcessingEncounter(true);

    try {
      const outcome = await processEncounterAction(player, gameState, currentEncounter, optionIndex, customInput);

      // Check for instant death from encounter (robbery, murder, execution, etc.)
      if ((outcome as any).instant_death) {
        const deathMessage = (outcome as any).death_message || 'You met a tragic end during this encounter.';
        addLogEntry(outcome.description, 'text-red-700 font-bold');
        addLogEntry(`DEATH: ${deathMessage}`, 'text-red-900 font-bold');
        setCurrentEncounter(null);
        setIsProcessingEncounter(false);
        // Trigger game over
        setTimeout(() => {
          onGameEnd(deathMessage, false);
          setIsGameOver(true);
        }, 100);
        return;
      }

      // Apply outcome to game state
      setGameState(prev => {
        let newState = { ...prev };
        newState.health = Math.max(0, Math.min(INITIAL_HEALTH, newState.health + outcome.health_change));
        newState.food = Math.max(0, newState.food + outcome.food_change);
        newState.ducats = Math.max(0, newState.ducats + outcome.money_change);
        newState.oxen = Math.max(0, newState.oxen + outcome.oxen_change);
        newState.inventory = updateInventory(newState.inventory, outcome.inventory_changes || []);
        newState.conditions = updateConditions(newState.conditions, outcome.conditions_add || [], outcome.conditions_remove || []);

        const changedParty = applyPartyChanges(newState.party, outcome.party_changes || []);
        const { living } = checkPartyDeaths(changedParty, newState.day);
        newState.party = living;

        return newState;
      });

      addLogEntry(outcome.description, 'text-cyan-200');

      // Build effects list for post-event summary
      const effects: Array<{ label: string; value: number; icon: string; color: string }> = [];

      if (outcome.health_change !== 0) {
        effects.push({
          label: 'Health',
          value: outcome.health_change,
          icon: '❤️',
          color: outcome.health_change > 0 ? 'text-green-400' : 'text-red-400'
        });
      }
      if (outcome.food_change !== 0) {
        effects.push({
          label: 'Food',
          value: outcome.food_change,
          icon: '🍖',
          color: outcome.food_change > 0 ? 'text-green-400' : 'text-red-400'
        });
      }
      if (outcome.money_change !== 0) {
        effects.push({
          label: 'Ducats',
          value: outcome.money_change,
          icon: '💰',
          color: outcome.money_change > 0 ? 'text-green-400' : 'text-red-400'
        });
      }
      if (outcome.oxen_change !== 0) {
        effects.push({
          label: 'Mules',
          value: outcome.oxen_change,
          icon: '🐴',
          color: outcome.oxen_change > 0 ? 'text-green-400' : 'text-red-400'
        });
      }

      // Add inventory changes
      if (outcome.inventory_changes && outcome.inventory_changes.length > 0) {
        outcome.inventory_changes.forEach(change => {
          if (change.change !== 0) {
            effects.push({
              label: change.item,
              value: change.change,
              icon: '📦',
              color: change.change > 0 ? 'text-green-400' : 'text-red-400'
            });
          }
        });
      }

      // Show post-event summary
      setPostEventSummary({
        title: 'Encounter Result',
        description: outcome.description,
        effects: effects
      });

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
        // DEADLY - starvation kills if not addressed
        if (prev.food <= 0) {
            const starvationDamage = 10; // Increased from 5 - more deadly
            logMessages.push({ message: `Starvation! You and your party are dying from hunger. (-${starvationDamage} health to all)`, color: 'text-red-700 font-bold' });
            addAlert('starvation', 'Deadly Starvation!', 'Your party is starving to death! Health dropping rapidly. Find food NOW or you will die!');
            newHealth -= starvationDamage;
            partyAfterEffects = partyAfterEffects.map(member => {
                // Party members lose more health and relationship when starving
                const memberDamage = Math.floor(Math.random() * 5) + 8; // 8-12 damage
                return {
                    ...member,
                    health: member.health - memberDamage,
                    relationship: Math.max(0, member.relationship - 5), // More relationship loss
                    mood: member.health <= 40 ? 'afraid' as const : 'worried' as const
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

        // Party members can LEAVE if conditions are terrible
        const remainingParty: PartyMember[] = [];
        let hasDesertions = false;

        living.forEach(member => {
            let willLeave = false;
            let leaveReason = '';

            // Very low relationship (< 10) = high chance to leave
            if (member.relationship < 10) {
                const leaveChance = Math.random() * 100;
                if (leaveChance < 40) { // 40% chance to leave if relationship < 10
                    willLeave = true;
                    leaveReason = `${member.name} has abandoned you. Your relationship deteriorated beyond repair.`;
                }
            }

            // Low health + afraid = chance to leave
            if (!willLeave && member.health < 25 && member.mood === 'afraid') {
                const leaveChance = Math.random() * 100;
                if (leaveChance < 25) { // 25% chance to leave if afraid and low health
                    willLeave = true;
                    leaveReason = `${member.name} has fled in fear, unable to continue this deadly journey.`;
                }
            }

            // Extreme conditions + low relationship (< 30) = small chance to leave
            if (!willLeave && member.relationship < 30 && (member.conditions.includes('Diseased') || member.conditions.includes('Injured'))) {
                const leaveChance = Math.random() * 100;
                if (leaveChance < 15) { // 15% chance if sick/injured and low relationship
                    willLeave = true;
                    leaveReason = `${member.name} has left the party, seeking help elsewhere for their afflictions.`;
                }
            }

            if (willLeave) {
                addLogEntry(leaveReason, 'text-orange-600 font-bold');
                addAlert('desertion', 'Party Member Left!', `${member.name} has left your party!`);
                hasDesertions = true;
            } else {
                remainingParty.push(member);
            }
        });

        if (needsUpdate || hasDeaths || hasDesertions) {
            if (logMessages.length > 0) {
                logMessages.forEach(msg => addLogEntry(msg.message, msg.color));
            }
            return { ...prev, health: Math.max(0, newHealth), party: remainingParty };
        }

        return prev;
    });

  }, [gameState.day, addLogEntry]); // Dependency on phase removed to allow starvation in camp


  // Monitor for critical health situations
  useEffect(() => {
    // Alert for critical player health
    if (gameState.health <= 20 && gameState.health > 0) {
      addAlert('critical', 'Critical Health!', `Your health is critically low (${gameState.health}/100). Rest or use healing items immediately!`);
    }

    // Alert for low food
    if (gameState.food <= 5 && gameState.food > 0) {
      addAlert('warning', 'Low Food Supply', `You only have ${gameState.food} food remaining. Find more food soon!`);
    }

    // Alert for party members in danger
    gameState.party.forEach(member => {
      if (member.health <= 20 && member.health > 0) {
        addAlert('critical', `${member.name} in Danger!`, `${member.name}'s health is critically low (${member.health}/100).`);
      }
    });
  }, [gameState.health, gameState.food, gameState.party]);

  // Party concern conversations - only for actionable concerns
  useEffect(() => {
    if (isGameOver || gameState.phase === 'in_city') return; // Don't trigger in cities

    const concernMessages: { [key: string]: { spouse?: string; child?: string; guard?: string; valet?: string } } = {
      lowFood: {
        spouse: "My love, our food supplies are running low. Perhaps we should hunt or visit the next market?",
        child: "I'm getting hungry... can we find more food soon?",
        guard: "Sire/My Lady, our provisions are diminishing. I recommend hunting or purchasing supplies at the next opportunity.",
        valet: "Master/Mistress, our food stores concern me. Shall I keep watch for game to hunt or herbs to forage?"
      },
      lowMorale: {
        spouse: "I feel we're growing distant. Could we spend some time together as a family? Perhaps travel with a focus on bonding?",
        child: "You never talk to me anymore... I miss spending time with you.",
        guard: "If I may speak freely, Sire/My Lady, the group's spirits are low. Some words of encouragement might help morale.",
        valet: "The party seems dispirited, Master/Mistress. Perhaps a slower pace or some family time would lift everyone's hearts?"
      },
      lowRelationship: {
        spouse: "I feel like you don't care about us anymore. Have we done something to upset you?",
        child: "Why are you always so mean to us? I thought we were a family...",
        guard: "Forgive my candor, but there's tension in our ranks. Clear communication might ease these troubles.",
        valet: "If I may be so bold, your relationship with the party has grown strained. A kind gesture or conversation might help."
      }
    };

    // Find the party member with the most urgent actionable concern
    let mostConcernedMember: PartyMember | null = null;
    let urgentConcern: keyof typeof concernMessages | null = null;
    let maxUrgency = 0;

    gameState.party.forEach(member => {
      const daysSinceLastConversation = member.lastConversation ? gameState.day - member.lastConversation : 999;
      if (daysSinceLastConversation < 21) return; // Only trigger once every 3 weeks per member

      let urgency = 0;
      let concern: keyof typeof concernMessages | null = null;

      // Check for actionable concerns and calculate urgency - higher thresholds
      if (gameState.food < 10) {
        concern = 'lowFood';
        urgency = (10 - gameState.food) * 3; // More urgent as food gets critically low
      } else if (member.relationship < 30) {
        concern = 'lowRelationship';
        urgency = (30 - member.relationship) * 1.5; // More urgent as relationship drops severely
      } else if (member.mood === 'afraid') {
        concern = 'lowMorale';
        urgency = 20; // Only speak up if afraid (not just worried)
      }

      if (concern && urgency > maxUrgency) {
        maxUrgency = urgency;
        mostConcernedMember = member;
        urgentConcern = concern;
      }
    });

    // Only speak up if urgency is high enough AND random chance (30%)
    if (mostConcernedMember && urgentConcern && maxUrgency > 10 && Math.random() < 0.3) {
      const roleKey = mostConcernedMember.role === 'spouse' ? 'spouse' :
                     mostConcernedMember.role === 'child' ? 'child' :
                     mostConcernedMember.role === 'royal guard' ? 'guard' : 'valet';

      const message = concernMessages[urgentConcern][roleKey] || concernMessages[urgentConcern].spouse;

      if (message) {
        addAlert('warning', `${mostConcernedMember.name} speaks up`, message);

        // Update lastConversation for the member who spoke
        setGameState(prev => ({
          ...prev,
          party: prev.party.map(p =>
            p.name === mostConcernedMember!.name ? { ...p, lastConversation: gameState.day } : p
          )
        }));
      }
    }
  }, [gameState.food, gameState.party, gameState.day, gameState.phase, isGameOver]);

  // Educational historical facts - show periodically during travel
  useEffect(() => {
    if (isGameOver || gameState.phase !== 'traveling') return;

    // Show educational fact every 2-3 weeks of travel (random)
    const shouldShowFact = gameState.day % 14 === 0 && Math.random() > 0.5;
    if (!shouldShowFact) return;

    const educationalFacts = [
      // Travel & Roads (expanded)
      "📚 Did you know? In the 15th-16th centuries, most European roads were unpaved dirt tracks. Only major Roman roads like the Via Francigena remained stone-paved, making them preferred routes for pilgrims.",
      "📚 Historical Note: Medieval travelers typically covered 20-30 kilometers per day on foot. Mounted travelers could manage 40-50 km/day, but this was expensive and hard on horses.",
      "📚 Did you know? The 'Grand Tour' became fashionable among European nobility in the 17th-18th centuries as an educational rite of passage, often lasting 2-3 years and costing fortunes.",
      "📚 Travel Fact: The Via Francigena was the main pilgrimage route from Canterbury to Rome, established in the 10th century. It passed through France, Switzerland, and Italy, covering approximately 1,900 km.",
      "📚 Did you know? Hospices (pilgrims' hostels) were run by monasteries along major routes, offering free shelter and food to pilgrims. These were essential for poor travelers.",
      "📚 Historical Note: Mountain passes like the Great St. Bernard Pass were extremely dangerous. Monks maintained rescue stations and bred large dogs (St. Bernards) to find lost travelers in snow.",

      // Food & Provisions (expanded)
      "📚 Historical Note: Preserved foods were essential for long journeys. Salted meat, dried fish, hard cheese, and hardtack biscuits could last months without spoiling.",
      "📚 Did you know? Inns and taverns along major routes were often the only places to get hot meals. A bed at an inn cost roughly a day's wages for a laborer.",
      "📚 Historical Fact: In the 1500s, a ducat (gold coin) could buy approximately 100 loaves of bread or feed a family for a month. Merchants and nobility traveled with hundreds or thousands of ducats.",
      "📚 Food Note: Medieval Europeans ate no potatoes, tomatoes, or corn - these came from the Americas after 1492. Diet consisted mainly of bread, porridge, cabbage, turnips, and (for the wealthy) meat.",
      "📚 Did you know? Wine and beer were safer than water in medieval times. Water sources were often contaminated, so even children drank weak beer daily.",
      "📚 Economic Fact: A skilled craftsman in the 1500s earned about 10-15 ducats per year. A single ox cost 5-8 ducats. Nobles had incomes of thousands of ducats annually.",

      // Health & Medicine (expanded)
      "📚 Medical Note: Medieval medicine relied heavily on the 'four humors' theory (blood, phlegm, yellow bile, black bile). Imbalances were treated with bloodletting, herbs, or dietary changes.",
      "📚 Did you know? The plague (Black Death) killed 30-60% of Europe's population in the 14th century. Subsequent outbreaks continued through the 1700s, making disease a constant fear for travelers.",
      "📚 Historical Fact: Apothecaries and herbalists were the primary medical practitioners for common folk. Physicians trained at universities (like Bologna or Padua) served only the wealthy.",
      "📚 Medical Fact: Childbirth was extremely dangerous - maternal mortality rates were 1-2%. Many women died in childbirth, and infant mortality exceeded 30%.",
      "📚 Did you know? Plague doctors wore distinctive beaked masks filled with aromatic herbs, believing bad smells (miasma) caused disease. They didn't understand germs or contagion.",
      "📚 Health Note: Average life expectancy was 30-40 years, but this was heavily skewed by infant mortality. Those who survived to adulthood often lived into their 50s or 60s.",
      "📚 Medical Fact: Amputation was performed without anesthesia - patients bit leather straps and drank alcohol. Survival rate was about 50% due to infection and shock.",

      // Religion & Pilgrimage (expanded)
      "📚 Religious Note: Pilgrimage to Rome was believed to grant indulgences (forgiveness of sins). The Pope declared 'Jubilee Years' offering special pardons to pilgrims.",
      "📚 Did you know? Pilgrims wore distinctive badges and carried staffs. These symbols often granted them protection and reduced tolls, as harming pilgrims was considered sacrilege.",
      "📚 Historical Fact: Medieval Europe was deeply Catholic until the Protestant Reformation (1517). By the late 1500s, religious wars between Catholics and Protestants ravaged the continent.",
      "📚 Religious Fact: Martin Luther's 95 Theses (1517) sparked the Reformation by criticizing the Catholic Church's sale of indulgences. This split Christianity and led to centuries of conflict.",
      "📚 Did you know? The Spanish Inquisition (1478-1834) persecuted Jews, Muslims, and suspected heretics. Torture and execution were used to enforce Catholic orthodoxy.",
      "📚 Religious Note: Relic veneration was central to medieval piety. Saints' bones, blood, and possessions were believed to have miraculous powers and drew thousands of pilgrims.",
      "📚 Historical Fact: The Papal States (756-1870) were territories in central Italy directly ruled by the Pope. Rome was both a spiritual capital and a political power.",

      // Politics & Geography (expanded)
      "📚 Political Note: The Holy Roman Empire was neither holy, nor Roman, nor an empire - but a loose confederation of hundreds of German states, each with its own laws and tolls.",
      "📚 Did you know? Travelers crossing borders could encounter different currencies, languages, laws, and even calendar systems, making long journeys incredibly complex.",
      "📚 Historical Fact: Bandits and brigands were common on remote roads. Traveling in groups or hiring guards was essential for wealthy travelers.",
      "📚 Military Fact: The Thirty Years' War (1618-1648) devastated Central Europe, killing 4-8 million people. Mercenary armies pillaged the countryside, making travel extremely dangerous.",
      "📚 Did you know? Venice was an independent maritime republic (697-1797) that controlled Mediterranean trade. It was fabulously wealthy and a major cultural center.",
      "📚 Political Note: France and Spain were bitter rivals throughout the 1500s-1700s. Wars between them frequently spilled across Europe, disrupting trade and travel.",
      "📚 Historical Fact: The Ottoman Empire controlled southeastern Europe from the 1400s-1800s. Christian Europe feared Ottoman expansion and launched multiple failed crusades.",

      // Culture & Society (expanded)
      "📚 Social Note: Medieval society was strictly hierarchical: nobility, clergy, merchants/craftsmen, and peasants. Your profession determined where you could live, eat, and even what you could wear.",
      "📚 Did you know? Literacy rates in Early Modern Europe were very low - perhaps 10-20% of men and 5% or less of women could read. Books were precious and rare before printing presses spread.",
      "📚 Historical Fact: The Renaissance (14th-17th centuries) saw a revival of classical learning, art, and science. Florence, Rome, and Venice were major centers of this cultural rebirth.",
      "📚 Social Fact: Sumptuary laws regulated clothing by class - peasants couldn't wear silk or fur, and certain colors (like purple) were reserved for nobility.",
      "📚 Did you know? Most Europeans never traveled more than 20 km from their birthplace. A pilgrimage to Rome was a once-in-a-lifetime journey covering hundreds or thousands of kilometers.",
      "📚 Cultural Note: Public executions were common entertainment. Hangings, burnings, and beheadings drew large crowds in town squares.",
      "📚 Historical Fact: Jews faced severe persecution throughout Europe - expelled from Spain (1492), England (1290), France (multiple times), and confined to ghettos in many cities.",

      // Technology & Innovation (expanded)
      "📚 Did you know? Gutenberg's printing press (1440s) revolutionized Europe. By 1500, over 20 million books had been printed, spreading knowledge and literacy far more widely.",
      "📚 Historical Note: Navigational tools like compasses and astrolabes were becoming more common in the 1500s, enabling the Age of Exploration and better land navigation.",
      "📚 Innovation Fact: Water mills and windmills powered early industry in Europe, grinding grain, sawing wood, and pumping water. These were cutting-edge technology in the medieval period.",
      "📚 Technology Note: Eyeglasses were invented in Italy around 1286. By the 1500s, they were common among scholars and the wealthy, dramatically extending productive working years.",
      "📚 Did you know? Mechanical clocks appeared in European cities in the 1300s. Before this, people told time by church bells, sundials, and the sun's position.",
      "📚 Innovation Fact: Double-entry bookkeeping was developed in Italy in the 1400s, revolutionizing commerce and banking. The Medici family used it to build their banking empire.",

      // Warfare & Military (new category)
      "📚 Military Fact: Crossbows were so effective they were briefly banned by the Pope (1139) as 'too deadly' for Christian warfare. The ban was widely ignored.",
      "📚 Did you know? Gunpowder weapons transformed warfare in the 1400s-1500s. Arquebuses and cannons made medieval castle walls obsolete, changing military tactics forever.",
      "📚 Historical Note: Mercenary companies (condottieri in Italy, lansquenets in Germany) fought for whoever paid them. Loyalty was to gold, not country or cause.",
      "📚 Military Fact: The Swiss pike square was the most feared infantry formation of the 1500s. Densely packed pikemen could stop cavalry charges and defeat larger armies.",

      // Daily Life & Customs (new category)
      "📚 Daily Life: Most people bathed rarely - perhaps once or twice a year. The wealthy used perfumes to mask body odor. Public bathhouses existed in larger cities.",
      "📚 Did you know? Forks were rare until the 1600s. Most people ate with their hands or a knife and spoon. Using a fork was seen as pretentious in many places.",
      "📚 Social Custom: Marriage was primarily economic - arranged by families for property, alliances, and wealth. Marrying for love was considered foolish and irresponsible.",
      "📚 Historical Fact: The working day began at dawn and ended at dusk. Before artificial lighting, productivity depended on sunlight - winters meant shorter working days.",

      // Law & Justice (new category)
      "📚 Legal Fact: Trial by ordeal (holding hot iron, being dunked in water) was used until the 1200s. Surviving meant God proved your innocence.",
      "📚 Did you know? Torture was legal and routine in criminal investigations. Confessions obtained under torture were accepted as evidence in court.",
      "📚 Justice Note: Crimes that seem minor today (theft of goods worth a shilling) could result in hanging. Prisons were rare - punishment was immediate and physical.",
      "📚 Historical Fact: Debtors who couldn't pay were imprisoned until their debt was settled. Families often had to pay ransom to free imprisoned relatives."
    ];

    // Select based on game context when possible
    let contextualFacts = educationalFacts;

    // Add season-specific facts
    if (gameState.season === 'Winter') {
      contextualFacts = [
        "📚 Winter Travel: Most medieval travelers avoided winter journeys due to snow, ice, and shorter daylight. Roads became impassable, and inns were scarce in remote areas.",
        "📚 Historical Note: Winter was 'the hungry season' in medieval Europe. Food stores dwindled, and fresh food was unavailable until spring. Starvation was common among the poor.",
        ...contextualFacts
      ];
    } else if (gameState.season === 'Summer') {
      contextualFacts = [
        "📚 Summer Travel: Summer was the preferred season for long journeys - long daylight, passable roads, and available food. However, heat and disease (especially in cities) posed dangers.",
        ...contextualFacts
      ];
    }

    // Add year-specific historical context
    if (gameState.year >= 1517 && gameState.year < 1650) {
      contextualFacts = [
        `📚 Historical Context (${gameState.year}): Europe is in the era of the Protestant Reformation. Religious conflicts between Catholics and Protestants have led to wars, persecutions, and political upheaval across the continent.`,
        ...contextualFacts
      ];
    } else if (gameState.year >= 1450 && gameState.year < 1500) {
      contextualFacts = [
        `📚 Historical Context (${gameState.year}): The Renaissance is flourishing in Italy. Art, science, and classical learning are being reborn, though most of Europe remains deeply medieval in outlook.`,
        ...contextualFacts
      ];
    } else if (gameState.year >= 1700) {
      contextualFacts = [
        `📚 Historical Context (${gameState.year}): The Age of Enlightenment is dawning. Reason, science, and philosophy are challenging old certainties. Europe stands on the brink of modern times.`,
        ...contextualFacts
      ];
    }

    const randomFact = contextualFacts[Math.floor(Math.random() * contextualFacts.length)];
    addLogEntry(randomFact, 'text-blue-300');
  }, [gameState.day, gameState.phase, gameState.season, gameState.year, isGameOver]);

  useEffect(() => {
    if (isGameOver) return;

    if (gameState.distanceToRome <= 0) {
      onGameEnd("You have reached the eternal city of Rome! Your arduous journey is complete.", true);
      setIsGameOver(true);
    } else if (gameState.health <= 0) {
      // Death from any cause when health reaches 0
      const deathCause = gameState.food <= 0
        ? 'You succumbed to starvation on the road to Rome.'
        : gameState.conditions.includes('Diseased')
        ? 'Disease claimed your life before you could reach Rome.'
        : gameState.conditions.includes('Injured')
        ? 'Your injuries proved too severe. Your journey ends here.'
        : 'Your health failed you on the perilous road to Rome.';
      onGameEnd(deathCause, false);
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
                { label: '4 - Forage', action: 'Forage for Herbs', key: '4' },
            ];
            // Repair professions
            if (player.profession === Profession.Blacksmith) {
                campActions.push({ label: '5 - Repair Wagon', action: 'Repair Wagon', key: '5' });
            }
            campActions.push({ label: '6 - Break Camp', action: 'Break Camp', key: '6' });
            return campActions;
        case 'in_city':
            return [
                { label: '1 - Visit Market', action: 'Visit Market', key: '1' },
                { label: '2 - Stay at Inn', action: 'Stay at Inn', key: '2' },
                { label: '3 - Leave City', action: 'Leave City', key: '3' },
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
        case 'Storage':
            const inventoryItems = Object.entries(gameState.inventory);
            const maxSlots = 20;
            const usedSlots = inventoryItems.length;
            return (
                <div className="space-y-4">
                    {/* Inventory header with slot counter */}
                    <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-600/40">
                        <div className="flex justify-between items-center">
                            <div className="text-amber-200 font-bold text-lg">📦 Inventory</div>
                            <div className={`text-base font-semibold ${usedSlots >= maxSlots ? 'text-red-400' : usedSlots > maxSlots * 0.8 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {usedSlots} / {maxSlots} Slots
                            </div>
                        </div>
                        {usedSlots >= maxSlots && (
                            <p className="text-red-300 text-sm mt-2 italic">⚠️ Inventory full! Use or sell items to make space.</p>
                        )}
                    </div>

                    {inventoryItems.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                            {inventoryItems.map(([item, quantity]) => {
                                const effect = ITEM_EFFECTS[item];
                                const description = ITEM_DESCRIPTIONS[item];
                                const icon = ITEM_ICONS[item] || '📦';
                                const canUse = Boolean(effect);

                                return (
                                    <div key={item} className={`bg-gradient-to-r from-stone-700/40 to-stone-800/40 p-4 rounded-lg border-2 ${canUse ? 'border-amber-600/40 hover:border-amber-500/60' : 'border-stone-600/40'} transition-all hover:shadow-lg`}>
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <span className="text-4xl flex-shrink-0">{icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="text-amber-200 font-bold text-lg">{item}</div>
                                                        <div className="bg-stone-900/60 px-2 py-0.5 rounded text-amber-300 text-sm font-semibold">
                                                            ×{quantity}
                                                        </div>
                                                    </div>
                                                    {description && (
                                                        <p className="text-sm text-gray-300 italic mb-2">{description}</p>
                                                    )}
                                                    {effect && (
                                                        <div className="bg-amber-900/20 p-2 rounded border border-amber-600/30">
                                                            <p className="text-sm text-amber-300 font-semibold">✨ {effect.description}</p>
                                                            {effect.health_change && (
                                                                <p className="text-xs text-green-400 mt-1">+{effect.health_change} Health</p>
                                                            )}
                                                            {effect.removesCondition && (
                                                                <p className="text-xs text-cyan-400 mt-1">Cures: {effect.removesCondition}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                {canUse && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUseItem(item)}
                                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 border-2 border-green-400 text-white hover:from-green-500 hover:to-green-600 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg"
                                                        >
                                                            Use on Self
                                                        </button>
                                                        {gameState.party.length > 0 && (
                                                            <button
                                                                onClick={() => handleOpenInventoryForTarget(gameState.party[0])}
                                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-400 text-white hover:from-blue-500 hover:to-blue-600 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg"
                                                            >
                                                                Use on Party
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🎒</div>
                            <p className="text-gray-400 italic text-lg">Your bags are empty.</p>
                            <p className="text-gray-500 text-sm mt-2">Visit a market to purchase supplies.</p>
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

                if (gameState.ducats < totalCost) {
                    addLogEntry("You don't have enough ducats for this transaction.", 'text-red-400');
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
                            Your Ducats: <span className="text-amber-300 font-bold">{gameState.ducats}</span>
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
                                    const currentAmount = item === 'Food' ? gameState.food : item === 'Mules' ? gameState.oxen : (gameState.inventory[item] || 0);
                                    return prices.sell > 0 && currentAmount > 0;
                                }).map(([item, prices]) => {
                                    const sellPrice = Math.floor(prices.sell * sellModifier);
                                    const cartQty = cart[item]?.type === 'sell' ? cart[item].quantity : 0;
                                    const currentAmount = item === 'Food' ? gameState.food : item === 'Mules' ? gameState.oxen : (gameState.inventory[item] || 0);
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
                                    disabled={gameState.ducats < -cartTotal}
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
                            <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                Thomas Coryat's 1611 travel account through France, Italy, and Germany. Provides vivid observations on customs, food, accommodations, and the practicalities of Early Modern travel.
                            </p>
                            <a
                                href="https://archive.org/stream/coryatscrudities01coryuoft/coryatscrudities01coryuoft_djvu.txt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-sm underline inline-flex items-center gap-1"
                            >
                                📖 View on Internet Archive →
                            </a>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Michel de Montaigne's Journal</h4>
                            <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                The French philosopher's travel journal (1580-1581) documenting his journey through France, Switzerland, Germany, and Italy. Offers intimate perspectives on Early Modern travel conditions and experiences.
                            </p>
                            <a
                                href="https://www.gutenberg.org/files/70838/70838-h/70838-h.htm"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-sm underline inline-flex items-center gap-1"
                            >
                                📖 View on Project Gutenberg →
                            </a>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Merry Wiesner-Hanks' <em>Early Modern Europe</em></h4>
                            <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                Comprehensive academic survey of Early Modern European social, economic, and cultural history. Essential context for understanding the period's daily life, social structures, and historical developments.
                            </p>
                            <a
                                href="https://www.cambridge.org/highereducation/books/early-modern-europe-14501789/891ED2EF984BDFE89E5E39260C0F6C29#overview"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-sm underline inline-flex items-center gap-1"
                            >
                                📖 Cambridge University Press →
                            </a>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Benvenuto Cellini's Autobiography</h4>
                            <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                The famous Renaissance artist and goldsmith's vivid autobiography includes detailed accounts of his travels through Italy and France, providing insight into the experiences of skilled craftsmen moving between European cities.
                            </p>
                            <a
                                href="https://www.gutenberg.org/ebooks/4028"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-sm underline inline-flex items-center gap-1"
                            >
                                📖 View on Project Gutenberg →
                            </a>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Gabor Gelleri's <em>From Touring to Training</em></h4>
                            <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                Academic study examining the evolution and purposes of early modern travel, from educational tours to professional training journeys, illuminating the diverse motivations behind European travel during this period.
                            </p>
                            <a
                                href="https://brill.com/view/title/62856"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-sm underline inline-flex items-center gap-1"
                            >
                                📖 View on Brill →
                            </a>
                        </div>

                        <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                            <h4 className="text-amber-300 font-bold mb-2">Daniel Margocsy's <em>The Fuzzy Metrics of Money</em></h4>
                            <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                <span className="font-semibold">Full title:</span> "The finances of travel and the reception of curiosities in early modern Europe."
                                <br /><br />
                                Scholarly examination of the economic dimensions of early modern travel, exploring how travelers financed their journeys and the complex monetary systems they navigated across different European territories.
                            </p>
                            <a
                                href="https://philpapers.org/rec/MARTFM"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-sm underline inline-flex items-center gap-1"
                            >
                                📖 View on PhilPapers →
                            </a>
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

                    {/* Academic References Section */}
                    <div className="bg-stone-700/30 p-3 rounded-lg border border-cyan-600/20">
                        <h4 className="text-cyan-300 font-bold mb-2">📚 Academic References</h4>
                        <div className="space-y-2">
                            <div className="bg-stone-800/50 p-2 rounded">
                                <div className="text-cyan-200 font-semibold">Historical Economics</div>
                                <div className="text-gray-300 text-xs mt-1">
                                    For historical monetary systems and the challenge of measuring economic value across time periods, see:
                                </div>
                                <a
                                    href="https://philpapers.org/rec/MARTFM"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-400 hover:text-amber-300 underline text-xs mt-1 block transition-colors"
                                >
                                    Martin, "The Fuzzy Metrics of Money" (PhilPapers)
                                </a>
                            </div>
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
      if (activeWindow === 'Storage' && itemTarget) {
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

        <div className={`flex-grow flex flex-col space-y-4 bg-gradient-to-b from-stone-800/80 to-stone-900/80 p-4 border-2 ${borderColor} shadow-2xl transition-all duration-500 relative z-20 rounded-xl overflow-hidden`}>
           {/* Weather Visual Effects Overlay */}
           {gameState.weather === 'Rain' && (
             <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-blue-900/10 to-blue-500/5">
               <div className="absolute inset-0 animate-pulse bg-blue-400/5"></div>
             </div>
           )}
           {gameState.weather === 'Storm' && (
             <div className="absolute inset-0 pointer-events-none z-0">
               <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-gray-900/10 animate-pulse"></div>
               <div className="absolute inset-0 bg-purple-400/10 animate-pulse" style={{ animationDuration: '0.3s' }}></div>
             </div>
           )}
           {gameState.weather === 'Snow' && (
             <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-cyan-200/10 to-blue-100/5">
               <div className="absolute inset-0 bg-white/5"></div>
             </div>
           )}
           {gameState.weather === 'Fog' && (
             <div className="absolute inset-0 pointer-events-none z-0">
               <div className="absolute inset-0 bg-gradient-to-b from-gray-500/20 to-gray-700/10 animate-pulse" style={{ animationDuration: '3s' }}></div>
             </div>
           )}

           <MapView distanceTraveled={gameState.distanceTraveled} phase={gameState.phase} player={player} />
           <SuppliesBar
             phase={gameState.phase}
             health={gameState.health}
             stamina={gameState.stamina}
             food={gameState.food}
             ducats={gameState.ducats}
             oxen={gameState.oxen}
             ammunition={gameState.ammunition}
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
            <div className="flex-grow mb-4 min-h-0 max-h-[60vh] h-full">
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
          onOpenInventoryForTarget={handleOpenStorageForTarget}
          onOpenIndex={() => setActiveWindow('Index')}
          onOpenPartyMemberDetail={setSelectedPartyMember}
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

      {/* Crafting Window */}
      {activeWindow === 'Crafting' && (
        <CraftingWindow
          player={player}
          inventory={gameState.inventory}
          ammunition={gameState.ammunition}
          onCraft={handleCraft}
          onClose={() => setActiveWindow(null)}
        />
      )}

      {/* Forage Window */}
      {activeWindow === 'Forage' && (
        <ForageWindow
          gameState={gameState}
          playerProfession={player.profession}
          onForage={handleForage}
          onClose={() => setActiveWindow(null)}
        />
      )}

      {/* Start Guide - Shows on first game load */}
      {showStartGuide && (
        <StartGuide onClose={() => setShowStartGuide(false)} />
      )}

      {/* Party Member Detail Modal */}
      {selectedPartyMember && (
        <PartyMemberDetail
          member={selectedPartyMember}
          gameDay={gameState.day}
          onClose={() => setSelectedPartyMember(null)}
          onUseItem={() => {
            handleOpenInventoryForTarget(selectedPartyMember);
            setSelectedPartyMember(null);
          }}
          onTalk={() => {
            const gain = 3;
            addLogEntry(`You share a brief conversation with ${selectedPartyMember.name.split(' ')[0]}.`, 'text-cyan-300');
            setGameState(prev => ({
              ...prev,
              party: prev.party.map(m =>
                m.name === selectedPartyMember.name
                  ? { ...m, relationship: Math.min(100, m.relationship + gain), mood: m.relationship >= 60 ? 'content' as const : m.mood }
                  : m
              )
            }));
          }}
          onDeepConversation={() => {
            const canHaveDeepTalk = !selectedPartyMember.lastConversation || (gameState.day - selectedPartyMember.lastConversation) >= 3;
            if (canHaveDeepTalk) {
              const gain = selectedPartyMember.relationship >= 60 ? 8 : 5;
              const trustGain = 3;
              addLogEntry(`You have a deep conversation with ${selectedPartyMember.name.split(' ')[0]} about the journey and what lies ahead. They seem ${selectedPartyMember.relationship >= 60 ? 'grateful' : 'thoughtful'}.`, 'text-cyan-300');
              setGameState(prev => ({
                ...prev,
                party: prev.party.map(m =>
                  m.name === selectedPartyMember.name
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
            }
          }}
          canHaveDeepTalk={!selectedPartyMember.lastConversation || (gameState.day - selectedPartyMember.lastConversation) >= 3}
        />
      )}

      {/* Alert Notifications */}
      <AlertNotification alerts={alerts} onDismiss={dismissAlert} />

      {/* Post-Event Summary */}
      {postEventSummary && (
        <PostEventSummary
          title={postEventSummary.title}
          description={postEventSummary.description}
          effects={postEventSummary.effects}
          onContinue={() => setPostEventSummary(null)}
        />
      )}
    </>
  );
};

export default GameUI;