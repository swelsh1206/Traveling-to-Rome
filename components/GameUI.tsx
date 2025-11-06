import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameState, LogEntry, PlayerAction, WindowType, Inventory, Condition, PartyMember, Profession, HuntableAnimal } from '../types';
import Log from './Log';
import CharacterPanel from './CharacterPanel';
import ActionButton from './ActionButton';
import { generateActionOutcome } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { TOTAL_DISTANCE_TO_ROME, PROFESSION_STATS, ITEM_EFFECTS, CRAFTING_RECIPES, INITIAL_HEALTH, ITEM_PRICES, ROUTE_CHECKPOINTS, HUNTABLE_ANIMALS } from '../constants';
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

const GameUI: React.FC<GameUIProps> = ({ player, initialGameState, characterImageUrl, onGameEnd, onRestartRun }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [log, setLog] = useState<LogEntry[]>([{ day: 1, message: "Your journey begins. Choose your first action.", color: 'text-green-400' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeWindow, setActiveWindow] = useState<WindowType | null>(null);
  const [itemTarget, setItemTarget] = useState<PartyMember | null>(null);
  const [nextCheckpointIndex, setNextCheckpointIndex] = useState(0);
  const [huntOptions, setHuntOptions] = useState<HuntableAnimal[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const addLogEntry = useCallback((message: string, color: string = 'text-gray-300') => {
    setLog(prevLog => [...prevLog, { day: gameState.day, message, color }]);
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
        
        addLogEntry(message, 'text-green-400');
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
        return { ...member, health: newHealth, conditions: newConditions };
    });
    return newParty;
  };

  const handleMarketTransaction = (type: 'buy' | 'sell', item: string, quantity: number, price: number) => {
      setGameState(prev => {
          if (type === 'buy') {
              const cost = price * quantity;
              if (prev.money < cost) {
                  addLogEntry("You don't have enough money for that.", 'text-yellow-400');
                  return prev;
              }
              const itemChange = item === 'Food' || item === 'Oxen' ? {} : { inventory: updateInventory(prev.inventory, [{ item, change: quantity }]) };
              addLogEntry(`You bought ${quantity} ${item} for ${cost} money.`, 'text-green-400');
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
                   addLogEntry(`You don't have that many ${item} to sell.`, 'text-yellow-400');
                   return prev;
              }
              const earnings = price * quantity;
              const itemChange = item === 'Food' || item === 'Oxen' ? {} : { inventory: updateInventory(prev.inventory, [{ item, change: -quantity }]) };
              addLogEntry(`You sold ${quantity} ${item} for ${earnings} money.`, 'text-green-400');
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
    setGameState(prev => {
        if (roll < successChance) {
            // Success
            const foodGained = Math.floor(Math.random() * (animal.foodYield[1] - animal.foodYield[0] + 1)) + animal.foodYield[0];
            addLogEntry(`Success! You hunted a ${animal.name} and gathered ${foodGained} food.`, 'text-green-400');
            return { ...prev, day: prev.day + 1, food: prev.food + foodGained };
        } else {
            // Failure
            let newConditions = [...prev.conditions];
            const injuryRoll = Math.random() * 100;
            let message = `The ${animal.name} escaped. You return with nothing.`;
            if (injuryRoll < animal.injuryRisk) {
                newConditions = updateConditions(newConditions, ['Injured']);
                message = `The ${animal.name} fought back and escaped. You are now Injured.`;
            }
            addLogEntry(message, 'text-red-400');
            return { ...prev, day: prev.day + 1, conditions: newConditions };
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
        addLogEntry('You continue on your journey.', 'text-green-400');
        return;
    }
     if (action === 'Use Item') {
        setItemTarget(null); // Ensure target is self when using from camp menu
        setActiveWindow('Inventory');
        return;
    }
     if (action === 'Leave City') {
        addLogEntry(`You leave ${gameState.currentLocation}.`, 'text-green-400');
        setGameState(prev => ({...prev, phase: 'traveling', currentLocation: null}));
        return;
     }
     if (action === 'Visit Market' || action === 'Trade with Merchant') {
        setActiveWindow('Market');
        return;
     }
    if (action === 'Rest') {
        addLogEntry('You and your family take the day to rest and recuperate.', 'text-green-400');
        setGameState(prev => {
            const restedParty = prev.party.map(p => ({...p, health: Math.min(100, p.health + 10), conditions: p.conditions.filter(c => c !== 'Exhausted') }));
            return {
                ...prev,
                day: prev.day + 1,
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
            addLogEntry(availableRecipe.description, 'text-cyan-400');
            setGameState(prev => ({
                ...prev,
                inventory: updateInventory(prev.inventory, [
                    { item: availableRecipe.item, change: -1 },
                    { item: availableRecipe.result, change: 1 },
                ])
            }))
        } else {
            addLogEntry("You have nothing to craft at the moment.", 'text-yellow-400');
        }
        return;
    }
    if (action === 'Feed Party') {
        const foodNeeded = 1 + gameState.party.length;
        if (gameState.food < foodNeeded) {
            addLogEntry("You don't have enough food to share a proper meal.", 'text-yellow-400');
            return;
        }
        addLogEntry('You share a meal with your family, restoring some vitality.', 'text-green-400');
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
    addLogEntry(outcome.description, 'text-amber-300');

    setGameState(prevGameState => {
        let newState = { ...prevGameState };
        
        if (action !== 'Scout Ahead') {
            newState.day += 1;
        }

        newState.health = Math.max(0, Math.min(100, newState.health + outcome.health_change));
        
        const foodConsumed = action === 'Travel' ? (1 + newState.party.length) : 0;
        newState.food = Math.max(0, newState.food + outcome.food_change - foodConsumed);
        
        newState.money = Math.max(0, newState.money + outcome.money_change);
        newState.oxen = Math.max(0, newState.oxen + outcome.oxen_change);
        
        // Calculate distance with modifiers
        let distanceChange = outcome.distance_change || 0;
        if (newState.conditions.includes('Injured')) distanceChange *= 0.75;
        if (newState.conditions.includes('Wagon Damaged')) distanceChange *= 0.5;
        if (newState.oxen === 1) distanceChange *= 0.8;
        if (newState.oxen === 0) distanceChange *= 0.25;
        if (newState.oxen > 2) distanceChange *= 1.1;
        distanceChange = Math.floor(distanceChange);
        newState.distanceTraveled += distanceChange;
        
        newState.distanceToRome = Math.max(0, TOTAL_DISTANCE_TO_ROME - newState.distanceTraveled);
        newState.inventory = updateInventory(newState.inventory, outcome.inventory_changes || []);
        newState.conditions = updateConditions(newState.conditions, outcome.conditions_add, outcome.conditions_remove);
        
        const changedParty = applyPartyChanges(newState.party, outcome.party_changes || []);
        const { living } = checkPartyDeaths(changedParty, newState.day);
        newState.party = living;

        if (action === 'Make Camp') newState.phase = 'camp';
        
        if (outcome.merchant_encountered) {
            newState.phase = 'merchant_encounter';
            addLogEntry("You encounter a traveling merchant on the road.", 'text-cyan-400 font-bold');
        } else if (action === 'Travel') {
            // Check for arrival at a checkpoint city
            const nextCheckpoint = ROUTE_CHECKPOINTS[nextCheckpointIndex];
            if (nextCheckpoint && newState.distanceTraveled >= nextCheckpoint.distance) {
                newState.phase = 'in_city';
                newState.currentLocation = `the city of ${nextCheckpoint.name}`;
                addLogEntry(`You have arrived at the city of ${nextCheckpoint.name}! You can rest and resupply here.`, 'text-purple-400 font-bold');
                setNextCheckpointIndex(prev => prev + 1);
            }
        }
        
        return newState;
    });

    setIsLoading(false);

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
                return { ...member, health: member.health - 5 };
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

  const renderWindowContent = () => {
    switch (activeWindow) {
        case 'Description': return <div><h3 className="text-2xl text-amber-100 mb-2">{player.profession}</h3><p className="text-gray-300">{PROFESSION_STATS[player.profession].description}</p></div>;
        case 'Inventory':
            const inventoryItems = Object.entries(gameState.inventory);
            return (
                <ul className="text-lg space-y-2 text-gray-200">
                    {inventoryItems.length > 0 ? (
                        inventoryItems.map(([item, quantity]) => {
                            const effect = ITEM_EFFECTS[item];
                            return (
                                <li key={item} className="flex justify-between items-center border-b border-amber-600/20 pb-1">
                                    <span>{item}: {quantity}</span>
                                    {effect && (
                                        <button onClick={() => handleUseItem(item)} className="text-sm px-2 py-1 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-stone-900 disabled:border-gray-500 disabled:text-gray-500 disabled:cursor-not-allowed rounded-md">Use</button>
                                    )}
                                </li>
                            )
                        })
                    ) : ( <li className="italic text-gray-400">Your bags are empty.</li> )}
                </ul>
            );
        case 'History': return <Log log={log} />;
        case 'Party': return (
            <div className="space-y-4">
                {gameState.party.length === 0 ? (
                    <p className="text-gray-400 italic text-center py-8">You travel alone...</p>
                ) : (
                    gameState.party.map(member => {
                        const healthPercent = Math.max(0, member.health);
                        const healthColor = healthPercent >= 75 ? 'bg-green-500' : healthPercent >= 50 ? 'bg-yellow-500' : healthPercent >= 25 ? 'bg-orange-500' : 'bg-red-600';
                        const isAlive = member.health > 0;

                        return (
                            <div key={member.name} className={`border-2 ${isAlive ? 'border-amber-600/40' : 'border-gray-600/40'} rounded-lg p-3 bg-stone-800/50`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className={`font-bold text-xl ${isAlive ? 'text-amber-200' : 'text-gray-500'}`}>{member.name}</h3>
                                        <p className="text-sm text-gray-400">Family Member</p>
                                    </div>
                                    {isAlive ? (
                                        <span className={`text-sm px-2 py-1 rounded ${healthPercent >= 75 ? 'bg-green-600/30 text-green-400' : healthPercent >= 50 ? 'bg-yellow-600/30 text-yellow-400' : healthPercent >= 25 ? 'bg-orange-600/30 text-orange-400' : 'bg-red-600/30 text-red-400'}`}>
                                            {healthPercent >= 75 ? 'Healthy' : healthPercent >= 50 ? 'Weary' : healthPercent >= 25 ? 'Injured' : 'Critical'}
                                        </span>
                                    ) : (
                                        <span className="text-sm px-2 py-1 rounded bg-gray-700/50 text-gray-400">Deceased</span>
                                    )}
                                </div>

                                {isAlive && (
                                    <>
                                        <div className="mb-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-300">Health</span>
                                                <span className={healthPercent < 50 ? 'text-red-400 font-bold' : 'text-green-400'}>{member.health} / 100</span>
                                            </div>
                                            <div className="w-full bg-stone-700 rounded-full h-3 overflow-hidden">
                                                <div className={`h-full ${healthColor} transition-all duration-300`} style={{ width: `${healthPercent}%` }}></div>
                                            </div>
                                        </div>

                                        {member.conditions.length > 0 && (
                                            <div className="mb-3 p-2 bg-red-900/20 border border-red-600/30 rounded">
                                                <p className="text-xs text-gray-400 mb-1">Active Conditions:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {member.conditions.map(cond => (
                                                        <span key={cond} className="text-xs px-2 py-1 bg-red-600/30 text-red-300 rounded border border-red-500/50">
                                                            {cond}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => handleOpenInventoryForTarget(member)}
                                                className="flex-1 text-sm px-3 py-2 border-2 border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-stone-900 rounded-md transition-colors font-semibold"
                                            >
                                                Give Item
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const messages = [
                                                        `${member.name} nods silently, their eyes on the horizon.`,
                                                        `${member.name} looks tired but determined to continue.`,
                                                        `${member.name} manages a weary smile.`,
                                                        member.health < 50 ? `${member.name} winces in pain but says nothing.` : `${member.name} seems in good spirits.`,
                                                        `${member.name} mentions missing home.`,
                                                    ];
                                                    addLogEntry(messages[Math.floor(Math.random() * messages.length)], 'text-cyan-300');
                                                    setActiveWindow(null);
                                                }}
                                                className="flex-1 text-sm px-3 py-2 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-stone-900 rounded-md transition-colors font-semibold"
                                            >
                                                Talk
                                            </button>
                                        </div>
                                    </>
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
        className="fixed top-6 right-6 z-50 p-3 bg-stone-800/90 border-2 border-amber-500 rounded-full hover:bg-stone-700 hover:border-amber-400 transition-all shadow-lg hover:scale-110"
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div className="grid grid-cols-5 gap-6 h-[90vh] max-h-[800px] relative z-10">
        
        <div className={`col-span-4 flex flex-col space-y-4 bg-stone-800/80 p-4 border-2 ${borderColor} shadow-lg transition-colors duration-500 relative z-20 rounded-xl`}>
           <ProgressBar 
              progress={(gameState.distanceTraveled / TOTAL_DISTANCE_TO_ROME) * 100}
              checkpoints={ROUTE_CHECKPOINTS}
              totalDistance={TOTAL_DISTANCE_TO_ROME}
           />
           <SuppliesBar phase={gameState.phase} health={gameState.health} food={gameState.food} money={gameState.money} oxen={gameState.oxen} location={gameState.currentLocation} />
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex-grow mb-4 min-h-0 max-h-[45vh] h-full">
              <Log log={log} />
            </div>
            <div className="flex-shrink-0 min-h-32 flex items-center justify-center p-4 border-t-2 border-amber-600/50">
              {isLoading && (
                  <div className="flex flex-col items-center">
                      <LoadingSpinner />
                      <p className="mt-2 text-amber-300">A new day dawns...</p>
                  </div>
              )}
              {!isLoading && !isGameOver && (
                  <div className="flex flex-wrap gap-4 justify-center">
                      {actionButtons.map((btn) => (
                          <ActionButton key={btn.action} onClick={() => handleAction(btn.action as PlayerAction)} disabled={isLoading}>
                              {btn.label}
                          </ActionButton>
                      ))}
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
    </>
  );
};

export default GameUI;