import React, { useState } from 'react';
import { GameState, Terrain, Season, Profession } from '../types';

interface ForageWindowProps {
  gameState: GameState;
  playerProfession: Profession;
  onForage: (results: Record<string, number>) => void;
  onClose: () => void;
}

interface ForageableItem {
  name: string;
  icon: string;
  baseChance: number;
  terrainBonus: Record<string, number>;
  seasonBonus: Record<string, number>;
  professionBonus?: Record<string, number>;
  description: string;
}

const FORAGEABLE_ITEMS: ForageableItem[] = [
  {
    name: 'Wood',
    icon: '🪵',
    baseChance: 70,
    terrainBonus: { 'Forest': 30, 'River Valley': 10 },
    seasonBonus: {},
    professionBonus: { 'Soldier': 15, 'Blacksmith': 20 },
    description: 'Fallen branches and deadwood for crafting arrows or campfires.'
  },
  {
    name: 'Metal Scraps',
    icon: '⚙️',
    baseChance: 20,
    terrainBonus: { 'Mountains': 15, 'Plains': 5 },
    seasonBonus: {},
    professionBonus: { 'Blacksmith': 35, 'Soldier': 20 },
    description: 'Old nails, broken tools, and metal debris from battlefields or ruins.'
  },
  {
    name: 'Medicinal Herbs',
    icon: '🌿',
    baseChance: 50,
    terrainBonus: { 'Forest': 25, 'River Valley': 20, 'Mountains': 10 },
    seasonBonus: { 'Spring': 20, 'Summer': 15, 'Autumn': 10 },
    professionBonus: { 'Apothecary': 30, 'Herbalist': 30, 'Midwife': 25, 'Priest': 10, 'Nun': 10 },
    description: 'Healing plants like yarrow, feverfew, and chamomile.'
  },
  {
    name: 'Berries',
    icon: '🫐',
    baseChance: 40,
    terrainBonus: { 'Forest': 30, 'River Valley': 15 },
    seasonBonus: { 'Summer': 30, 'Autumn': 20 },
    description: 'Wild berries - edible but not as filling as proper food.'
  },
  {
    name: 'Cloth',
    icon: '🧵',
    baseChance: 15,
    terrainBonus: { 'Plains': 10 },
    seasonBonus: {},
    description: 'Torn fabric from abandoned camps or travelers.'
  },
  {
    name: 'Rope',
    icon: '🪢',
    baseChance: 25,
    terrainBonus: { 'River Valley': 15 },
    seasonBonus: {},
    description: 'Discarded rope, twine, or cordage.'
  },
  {
    name: 'Mushrooms',
    icon: '🍄',
    baseChance: 35,
    terrainBonus: { 'Forest': 40, 'Mountains': 10 },
    seasonBonus: { 'Autumn': 25, 'Spring': 10 },
    description: 'Wild mushrooms - some edible, some medicinal.'
  }
];

const ForageWindow: React.FC<ForageWindowProps> = ({ gameState, playerProfession, onForage, onClose }) => {
  const [foraging, setForaging] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);

  const getSuccessChance = (item: ForageableItem): number => {
    let chance = item.baseChance;

    // Terrain bonus
    if (item.terrainBonus[gameState.terrain]) {
      chance += item.terrainBonus[gameState.terrain];
    }

    // Season bonus
    if (item.seasonBonus[gameState.season]) {
      chance += item.seasonBonus[gameState.season];
    }

    // Profession bonus
    if (item.professionBonus && item.professionBonus[playerProfession]) {
      chance += item.professionBonus[playerProfession];
    }

    return Math.min(95, chance); // Cap at 95%
  };

  const handleForage = () => {
    setForaging(true);

    // Simulate foraging time
    setTimeout(() => {
      const foundItems: Record<string, number> = {};

      FORAGEABLE_ITEMS.forEach(item => {
        const chance = getSuccessChance(item);
        const roll = Math.random() * 100;

        if (roll < chance) {
          // Found the item! Determine quantity
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
          foundItems[item.name] = quantity;
        }
      });

      setResults(foundItems);
      setForaging(false);

      // Auto-apply results after showing them
      setTimeout(() => {
        onForage(foundItems);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 border-4 border-green-600/50 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 p-6 border-b-2 border-green-600/30">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl text-green-100 font-bold">🌾 Foraging</h2>
              <p className="text-green-300 text-sm mt-1">
                Search the {gameState.terrain.toLowerCase()} for useful materials - {gameState.season}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-3xl text-gray-400 hover:text-white transition-colors"
              disabled={foraging || results !== null}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!foraging && results === null && (
            <>
              <div className="mb-6 bg-amber-900/20 border border-amber-600/30 p-4 rounded-lg">
                <p className="text-amber-200 text-sm">
                  <span className="font-bold">Current Location:</span> {gameState.terrain} terrain in {gameState.season}
                  <br />
                  <span className="font-bold">Success chances vary</span> based on terrain and season.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {FORAGEABLE_ITEMS.map((item, index) => {
                  const chance = getSuccessChance(item);
                  const chanceColor =
                    chance >= 70 ? 'text-green-400' :
                    chance >= 50 ? 'text-yellow-400' :
                    chance >= 30 ? 'text-orange-400' : 'text-red-400';

                  return (
                    <div
                      key={index}
                      className="bg-stone-700/30 p-3 rounded-lg border border-stone-600/40"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-4xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-amber-200 font-bold">{item.name}</h4>
                            <span className={`text-sm font-bold ${chanceColor}`}>{chance}%</span>
                          </div>
                          <p className="text-gray-400 text-xs">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleForage}
                className="w-full py-4 bg-green-700 hover:bg-green-600 text-green-100 font-bold text-lg rounded-lg transition-colors hover:shadow-lg"
              >
                🔍 Start Foraging
              </button>
            </>
          )}

          {foraging && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4 animate-bounce">🔍</div>
              <p className="text-xl text-green-300 font-bold">Searching the area...</p>
              <p className="text-gray-400 text-sm mt-2">Looking for materials and herbs</p>
            </div>
          )}

          {results !== null && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <h3 className="text-2xl text-green-300 font-bold mb-4">Foraging Complete!</h3>
                {Object.keys(results).length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-gray-300 mb-4">You found:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(results).map(([itemName, quantity]) => {
                        const item = FORAGEABLE_ITEMS.find(i => i.name === itemName);
                        return (
                          <div
                            key={itemName}
                            className="bg-green-900/30 border border-green-600/40 p-3 rounded-lg"
                          >
                            <div className="text-3xl mb-1">{item?.icon}</div>
                            <div className="text-green-200 font-bold">{itemName}</div>
                            <div className="text-green-400 text-xl">×{quantity}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <p className="text-lg mb-2">You found nothing useful this time.</p>
                    <p className="text-sm">Better luck in different terrain or season.</p>
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-gray-500 italic">
                Items will be added to your storage automatically...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForageWindow;
