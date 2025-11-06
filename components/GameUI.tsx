import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameState, LogEntry, PlayerAction, WindowType, Inventory, Condition, PartyMember, Profession, HuntableAnimal } from '../types';
import Log from './Log';
import CharacterPanel from './CharacterPanel';
import ActionButton from './ActionButton';
import { generateActionOutcome, generateRandomEvent, processEventChoice } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { TOTAL_DISTANCE_TO_ROME, PROFESSION_STATS, ITEM_EFFECTS, CRAFTING_RECIPES, INITIAL_HEALTH, ITEM_PRICES, ROUTE_CHECKPOINTS, HUNTABLE_ANIMALS, ITEM_ICONS } from '../constants';
import ProgressBar from './ProgressBar';
import ModalWindow from './ModalWindow';
import SuppliesBar from './SuppliesBar';

interface GameUIProps {
  player: Player;
  initialGameState: GameState;
  characterImageUrl: string;
  onGameEnd: (message: string, victory: boolean) => void;
  onRestartRun?: () => void;
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

const GameUI: React.FC<GameUIProps> = ({ player, initialGameState, characterImageUrl, onGameEnd, onRestartRun }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [log, setLog] = useState<LogEntry[]>([{ day: 1, message: "Your journey begins. Choose your first action.", color: 'text-white' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeWindow, setActiveWindow] = useState<WindowType | null>(null);
  const [itemTarget, setItemTarget] = useState<PartyMember | null>(null);
  const [nextCheckpointIndex, setNextCheckpointIndex] = useState(0);
  const [huntOptions, setHuntOptions] = useState<HuntableAnimal[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [randomEvent, setRandomEvent] = useState<{scenario: string} | null>(null);
  const [eventChoice, setEventChoice] = useState('');
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);
  const [eventOutcome, setEventOutcome] = useState<any>(null);

  const addLogEntry = useCallback((message: string, color: string = 'text-white', dayOverride?: number) => {
    setLog(prevLog => [...prevLog, { day: dayOverride ?? gameState.day, message, color }]);
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
    let successChance = animal.successChance;
    if (player.profession === Profession.Soldier) {
        successChance += 10; // Soldier bonus
    }

    const roll = Math.random() * 100;
    const staminaCost = 20;
    setGameState(prev => {
        if (roll < successChance) {
            // Success
            const foodGained = Math.floor(Math.random() * (animal.foodYield[1] - animal.foodYield[0] + 1)) + animal.foodYield[0];
            addLogEntry(`Success! You hunted a ${animal.name} and gathered ${foodGained} food. (-${staminaCost} stamina)`, 'text-white');
            return { ...prev, stamina: Math.max(0, prev.stamina - staminaCost), food: prev.food + foodGained };
        } else {
            // Failure
            let newConditions = [...prev.conditions];
            const injuryRoll = Math.random() * 100;
            let message = `The ${animal.name} escaped. You return with nothing. (-${staminaCost} stamina)`;
            if (injuryRoll < animal.injuryRisk) {
                newConditions = updateConditions(newConditions, ['Injured']);
                message = `The ${animal.name} fought back and escaped. You are now Injured. (-${staminaCost} stamina)`;
            }
            addLogEntry(message, 'text-white');
            return { ...prev, stamina: Math.max(0, prev.stamina - staminaCost), conditions: newConditions };
        }
    });
  };

  const handleAction = useCallback(async (action: PlayerAction) => {
    if (isGameOver || isLoading) return;

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
        }

        // Actions other than Travel consume stamina
        if (action !== 'Travel') {
            const staminaCost = action === 'Scout Ahead' ? 10 : 15;
            newState.stamina = Math.max(0, newState.stamina - staminaCost);
        }

        newState.health = Math.max(0, Math.min(100, newState.health + outcome.health_change));

        const foodConsumed = action === 'Travel' ? (1 + newState.party.length) : 0;
        newState.food = Math.max(0, newState.food + outcome.food_change - foodConsumed);

        newState.money = Math.max(0, newState.money + outcome.money_change);
        newState.oxen = Math.max(0, newState.oxen + outcome.oxen_change);

        // Update weather and season if traveling
        let weatherEffect = { distanceModifier: 1.0, healthCost: 0, description: '' };
        if (action === 'Travel') {
            newState.season = getSeason(newState.day);
            newState.weather = generateWeather(newState.season);
            weatherEffect = getWeatherTravelEffect(newState.weather);
        }

        // Calculate distance with modifiers
        let distanceChange = outcome.distance_change || 0;
        if (action === 'Travel') {
            distanceChange = Math.floor(distanceChange * weatherEffect.distanceModifier);
        }
        if (newState.conditions.includes('Injured')) distanceChange *= 0.75;
        if (newState.conditions.includes('Wagon Damaged')) distanceChange *= 0.5;
        if (newState.oxen === 1) distanceChange *= 0.8;
        if (newState.oxen === 0) distanceChange *= 0.25;
        if (newState.oxen > 2) distanceChange *= 1.1;
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
            const nextCheckpoint = ROUTE_CHECKPOINTS[nextCheckpointIndex];
            if (nextCheckpoint && newState.distanceTraveled >= nextCheckpoint.distance) {
                newState.phase = 'in_city';
                newState.currentLocation = `the city of ${nextCheckpoint.name}`;
                setNextCheckpointIndex(prev => prev + 1);
            }
        }

        return newState;
    });

    // Add log entries after state update
    if (action === 'Travel') {
        addLogEntry(outcome.description, 'text-white', newDay);
    } else {
        addLogEntry(outcome.description, 'text-white');
    }

    // Add special event log entries
    if (outcome.merchant_encountered) {
        addLogEntry("You encounter a traveling merchant on the road.", 'text-cyan-300', newDay);
    }

    // Check for city arrival
    const nextCheckpoint = ROUTE_CHECKPOINTS[nextCheckpointIndex];
    if (action === 'Travel' && nextCheckpoint && (gameState.distanceTraveled + (outcome.distance_change || 0)) >= nextCheckpoint.distance) {
        addLogEntry(`You have arrived at the city of ${nextCheckpoint.name}! You can rest and resupply here.`, 'text-purple-300', newDay);
    }

    setIsLoading(false);

    // Check for random event after travel - show modal immediately
    if (action === 'Travel' && !outcome.merchant_encountered) {
        // Show loading state immediately
        setRandomEvent({ scenario: 'loading' });

        // Generate event in background
        const event = await generateRandomEvent(player, gameState);
        if (event) {
            setRandomEvent(event);
        } else {
            // No event generated, close modal
            setRandomEvent(null);
        }
    }

  }, [player, gameState, addLogEntry, isGameOver, isLoading, nextCheckpointIndex]);
  
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
        
        // Sickness only has an effect while on the move.
        if (prev.phase === 'traveling') {
            if (prev.conditions.includes('Sick')) {
                logMessages.push({ message: 'Your sickness saps your strength.', color: 'text-red-500' });
                newHealth -= 5;
                needsUpdate = true;
            }
            partyAfterEffects = partyAfterEffects.map(member => {
                let currentMember = member;
                if (member.conditions.includes('Sick')) {
                     logMessages.push({ message: `${member.name}'s sickness worsens.`, color: 'text-red-500' });
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
                { label: '(1) Travel', action: 'Travel', key: '1' },
                { label: '(2) Scout Ahead', action: 'Scout Ahead', key: '2' },
                { label: '(3) Hunt', action: 'Hunt', key: '3' },
                { label: '(4) Make Camp', action: 'Make Camp', key: '4' },
            ];
        case 'camp':
            const campActions = [
                { label: '(1) Rest', action: 'Rest', key: '1' },
                { label: '(2) Craft', action: 'Craft', key: '2' },
                { label: '(3) Feed Party', action: 'Feed Party', key: '3' },
            ];
            if (player.profession === Profession.Apothecary) campActions.push({ label: '(4) Forage', action: 'Forage for Herbs', key: '4' });
            if (player.profession === Profession.Blacksmith) campActions.push({ label: '(5) Repair Wagon', action: 'Repair Wagon', key: '5' });
            campActions.push({ label: '(6) Use Item', action: 'Use Item', key: '6' });
            campActions.push({ label: '(7) Break Camp', action: 'Break Camp', key: '7' });
            return campActions;
        case 'in_city':
            return [
                { label: '(1) Visit Market', action: 'Visit Market', key: '1' },
                { label: '(2) Leave City', action: 'Leave City', key: '2' },
            ];
        case 'merchant_encounter':
             return [
                { label: '(1) Trade', action: 'Trade with Merchant', key: '1' },
                { label: '(2) Continue Journey', action: 'Ignore Merchant', key: '2' },
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
                            const icon = ITEM_ICONS[item] || '📦';
                            return (
                                <div key={item} className="bg-stone-700/30 p-3 rounded-lg border border-amber-600/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{icon}</span>
                                            <div>
                                                <div className="text-amber-200 font-bold">{item}</div>
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
                                    {effect && (
                                        <p className="text-xs text-gray-300 italic">{effect.description}</p>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400 italic">Your bags are empty.</p>
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
            const merchantBonus = player.profession === Profession.Merchant ? 0.15 : 0;
            const priceModifier = gameState.phase === 'merchant_encounter' ? 1.25 : 1; // Merchants on the road are more expensive
            const buyModifier = (1 - merchantBonus) * priceModifier;
            const sellModifier = (1 + merchantBonus) / priceModifier;

            const itemsToTrade = { ...ITEM_PRICES };
            Object.keys(gameState.inventory).forEach(item => {
                if (!itemsToTrade[item] && ITEM_PRICES[item]?.sell > 0) {
                    itemsToTrade[item] = ITEM_PRICES[item];
                }
            });

            return (
                <div>
                    <h3 className="text-xl text-amber-200 mb-3 border-b border-amber-600/30 pb-1">Market Goods</h3>
                    <ul className="text-md space-y-2">
                        {Object.entries(itemsToTrade).map(([item, prices]) => (
                            <li key={item} className="grid grid-cols-3 gap-2 items-center">
                                <span>{item}</span>
                                <div className="text-center">
                                    {prices.buy > 0 && 
                                        <button onClick={() => handleMarketTransaction('buy', item, 1, Math.ceil(prices.buy * buyModifier))} className="text-xs px-2 py-1 border border-green-500 text-green-400 hover:bg-green-500 hover:text-stone-900 rounded-md">
                                            Buy ({Math.ceil(prices.buy * buyModifier)})
                                        </button>
                                    }
                                </div>
                                <div className="text-center">
                                    {prices.sell > 0 && 
                                        <button onClick={() => handleMarketTransaction('sell', item, 1, Math.floor(prices.sell * sellModifier))} className="text-xs px-2 py-1 border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-stone-900 rounded-md">
                                            Sell ({Math.floor(prices.sell * sellModifier)})
                                        </button>
                                    }
                                </div>
                            </li>
                        ))}
                    </ul>
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

      {/* Settings Gear Button */}
      <button
        onClick={() => setShowMenu(true)}
        className="fixed top-4 right-4 z-50 p-2 bg-stone-800/90 border-2 border-amber-500 rounded-full hover:bg-stone-700 hover:border-amber-400 transition-all shadow-lg hover:scale-110"
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div className="grid grid-cols-5 gap-6 h-[90vh] max-h-[800px] relative z-10">
        
        <div className={`col-span-4 flex flex-col space-y-4 bg-gradient-to-b from-stone-800/80 to-stone-900/80 p-4 border-2 ${borderColor} shadow-2xl transition-all duration-500 relative z-20 rounded-xl`}>
           <ProgressBar
              progress={(gameState.distanceTraveled / TOTAL_DISTANCE_TO_ROME) * 100}
              checkpoints={ROUTE_CHECKPOINTS}
              totalDistance={TOTAL_DISTANCE_TO_ROME}
              phase={gameState.phase}
           />
           <SuppliesBar phase={gameState.phase} health={gameState.health} stamina={gameState.stamina} food={gameState.food} money={gameState.money} oxen={gameState.oxen} location={gameState.currentLocation} />
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex-grow mb-4 min-h-0 max-h-[45vh] h-full">
              <Log log={log} />
            </div>
            <div className={`flex-shrink-0 min-h-32 flex flex-col items-center justify-center p-4 border-t-2 ${isCity ? 'border-purple-600/50' : isCamp ? 'border-sky-600/50' : 'border-amber-600/50'}`}>
              {/* Day Display */}
              <div className="mb-3 text-center">
                <span className="text-sm text-gray-400">Day </span>
                <span className={`text-3xl font-bold ${isCity ? 'text-purple-300' : isCamp ? 'text-sky-300' : 'text-amber-300'} text-shadow-glow`}>{gameState.day}</span>
              </div>

              {isLoading && (
                  <div className="flex flex-col items-center">
                      <LoadingSpinner />
                      <p className={`mt-2 ${isCity ? 'text-purple-300' : isCamp ? 'text-sky-300' : 'text-amber-300'}`}>Processing...</p>
                  </div>
              )}
              {!isLoading && !isGameOver && (
                  <div className="flex flex-col gap-3 items-center w-full">
                      {/* Travel button separated if it exists */}
                      {actionButtons.some(btn => btn.action === 'Travel') && (
                        <div className="w-full flex justify-center">
                          <button
                            onClick={() => handleAction('Travel')}
                            className="px-8 py-3 bg-amber-600 border-2 border-amber-400 text-stone-900 hover:bg-amber-500 hover:border-amber-300 hover:scale-105 transition-all rounded-lg font-bold text-lg shadow-2xl hover-glow"
                          >
                            🚶 (1) Travel (1 Week)
                          </button>
                        </div>
                      )}
                      {/* Other action buttons */}
                      <div className="flex flex-wrap gap-4 justify-center">
                          {actionButtons.filter(btn => btn.action !== 'Travel').map((btn) => (
                              <ActionButton
                                key={btn.action}
                                onClick={() => handleAction(btn.action as PlayerAction)}
                                disabled={isLoading}
                                variant={isCity ? 'purple' : isCamp ? 'sky' : 'amber'}
                              >
                                  {btn.label}
                              </ActionButton>
                          ))}
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 flex flex-col space-y-4 relative z-20">
          <CharacterPanel player={player} imageUrl={characterImageUrl} gameState={gameState} onOpenWindow={setActiveWindow} />
        </div>
      </div>
      {activeWindow && (
        <ModalWindow title={getModalTitle()} onClose={() => {setActiveWindow(null); setItemTarget(null);}}>
            {renderWindowContent()}
        </ModalWindow>
      )}

      {/* Menu Modal */}
      {showMenu && (
        <ModalWindow title="Menu" onClose={() => setShowMenu(false)}>
          <div className="space-y-4">
            <button
              onClick={() => {
                if (onRestartRun && window.confirm('Are you sure you want to restart? All progress will be lost.')) {
                  onRestartRun();
                }
              }}
              className="w-full px-6 py-3 bg-red-600/20 border-2 border-red-500 text-red-400 hover:bg-red-600/40 hover:border-red-400 transition-colors rounded-lg text-lg font-bold"
            >
              Restart Run
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="w-full px-6 py-3 bg-stone-700/80 border-2 border-amber-500 text-amber-400 hover:bg-stone-600 hover:border-amber-400 transition-colors rounded-lg text-lg"
            >
              Resume Game
            </button>
          </div>
        </ModalWindow>
      )}

      {/* Random Event Modal */}
      {randomEvent && (
        <ModalWindow title="⚠️ An Event Occurs" onClose={() => false} hideCloseButton={true}>
          <div className="space-y-4">
            <div className="bg-amber-900/30 border-l-4 border-amber-500 p-4 rounded">
              {randomEvent.scenario === 'loading' ? (
                <div className="text-gray-200 text-lg leading-relaxed flex items-center justify-center gap-3 py-4">
                  <span className="text-2xl animate-spin">⚔️</span>
                  <span>Something stirs on the road ahead...</span>
                </div>
              ) : (
                <p className="text-gray-200 text-lg leading-relaxed">{randomEvent.scenario}</p>
              )}
            </div>

            {!eventOutcome && randomEvent.scenario !== 'loading' && (
              <>
                <div className="space-y-2">
                  <label className="text-amber-300 text-sm font-bold">Your Response:</label>
                  <textarea
                    value={eventChoice}
                    onChange={(e) => setEventChoice(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full h-32 p-3 bg-stone-800 border-2 border-amber-500 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-500 resize-none"
                    disabled={isProcessingEvent}
                    autoFocus
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!eventChoice.trim()) return;
                    setIsProcessingEvent(true);

                    const outcome = await processEventChoice(player, gameState, randomEvent.scenario, eventChoice);
                    setEventOutcome(outcome);

                    // Apply outcome to game state
                    setGameState(prev => {
                      let newState = { ...prev };
                      newState.health = Math.max(0, Math.min(100, newState.health + outcome.health_change));
                      newState.food = Math.max(0, newState.food + outcome.food_change);
                      newState.money = Math.max(0, newState.money + outcome.money_change);
                      newState.oxen = Math.max(0, newState.oxen + outcome.oxen_change);
                      newState.inventory = updateInventory(newState.inventory, outcome.inventory_changes || []);
                      newState.conditions = updateConditions(newState.conditions, outcome.conditions_add, outcome.conditions_remove);

                      const changedParty = applyPartyChanges(newState.party, outcome.party_changes || []);
                      const { living } = checkPartyDeaths(changedParty, newState.day);
                      newState.party = living;

                      return newState;
                    });

                    addLogEntry(outcome.description, 'text-cyan-300');
                    setIsProcessingEvent(false);
                  }}
                  disabled={!eventChoice.trim() || isProcessingEvent}
                  className="w-full px-6 py-3 bg-amber-600 border-2 border-amber-400 text-stone-900 hover:bg-amber-500 hover:scale-105 disabled:bg-gray-600 disabled:border-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed disabled:scale-100 transition-all rounded-lg text-lg font-bold shadow-lg"
                >
                  {isProcessingEvent ? '⏳ Processing...' : '✓ Submit Choice'}
                </button>
              </>
            )}

            {eventOutcome && (
              <>
                <div className="bg-stone-900/50 border-2 border-cyan-500 p-4 rounded-lg space-y-3 animate-fade-in">
                  <h3 className="text-cyan-300 font-bold text-xl">Outcome:</h3>
                  <p className="text-gray-200 text-lg leading-relaxed">{eventOutcome.description}</p>

                  <div className="border-t border-cyan-500/30 pt-3 space-y-2">
                    <h4 className="text-cyan-400 font-semibold">Effects:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {eventOutcome.health_change !== 0 && (
                        <div className={`flex items-center gap-2 ${eventOutcome.health_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <span>❤️ Health:</span>
                          <span className="font-bold">{eventOutcome.health_change > 0 ? '+' : ''}{eventOutcome.health_change}</span>
                        </div>
                      )}
                      {eventOutcome.food_change !== 0 && (
                        <div className={`flex items-center gap-2 ${eventOutcome.food_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <span>🥖 Food:</span>
                          <span className="font-bold">{eventOutcome.food_change > 0 ? '+' : ''}{eventOutcome.food_change}</span>
                        </div>
                      )}
                      {eventOutcome.money_change !== 0 && (
                        <div className={`flex items-center gap-2 ${eventOutcome.money_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <span>💰 Money:</span>
                          <span className="font-bold">{eventOutcome.money_change > 0 ? '+' : ''}{eventOutcome.money_change}</span>
                        </div>
                      )}
                      {eventOutcome.oxen_change !== 0 && (
                        <div className={`flex items-center gap-2 ${eventOutcome.oxen_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <span>🐂 Oxen:</span>
                          <span className="font-bold">{eventOutcome.oxen_change > 0 ? '+' : ''}{eventOutcome.oxen_change}</span>
                        </div>
                      )}
                      {eventOutcome.conditions_add && eventOutcome.conditions_add.length > 0 && (
                        <div className="col-span-2 flex items-center gap-2 text-red-400">
                          <span>⚠️ Conditions:</span>
                          <span className="font-bold">{eventOutcome.conditions_add.join(', ')}</span>
                        </div>
                      )}
                      {eventOutcome.conditions_remove && eventOutcome.conditions_remove.length > 0 && (
                        <div className="col-span-2 flex items-center gap-2 text-green-400">
                          <span>✓ Removed:</span>
                          <span className="font-bold">{eventOutcome.conditions_remove.join(', ')}</span>
                        </div>
                      )}
                      {eventOutcome.inventory_changes && eventOutcome.inventory_changes.length > 0 && (
                        <div className="col-span-2 flex flex-col gap-1 text-cyan-300">
                          <span>📦 Inventory:</span>
                          {eventOutcome.inventory_changes.map((change: any, i: number) => (
                            <span key={i} className="font-bold ml-4">
                              {change.change > 0 ? '+' : ''}{change.change} {change.item}
                            </span>
                          ))}
                        </div>
                      )}
                      {eventOutcome.party_changes && eventOutcome.party_changes.length > 0 && (
                        <div className="col-span-2 flex flex-col gap-1 text-orange-300">
                          <span>👥 Party:</span>
                          {eventOutcome.party_changes.map((change: any, i: number) => (
                            <span key={i} className="font-bold ml-4">
                              {change.name}: {change.health_change > 0 ? '+' : ''}{change.health_change || 0} health
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {eventOutcome.health_change === 0 && eventOutcome.food_change === 0 &&
                     eventOutcome.money_change === 0 && eventOutcome.oxen_change === 0 &&
                     (!eventOutcome.conditions_add || eventOutcome.conditions_add.length === 0) &&
                     (!eventOutcome.inventory_changes || eventOutcome.inventory_changes.length === 0) &&
                     (!eventOutcome.party_changes || eventOutcome.party_changes.length === 0) && (
                      <div className="text-gray-400 italic text-sm">No significant effects</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRandomEvent(null);
                    setEventChoice('');
                    setEventOutcome(null);
                  }}
                  className="w-full px-6 py-3 bg-cyan-600 border-2 border-cyan-400 text-stone-900 hover:bg-cyan-500 hover:scale-105 transition-all rounded-lg text-lg font-bold shadow-lg"
                >
                  Continue Journey
                </button>
              </>
            )}
          </div>
        </ModalWindow>
      )}
    </>
  );
};

export default GameUI;