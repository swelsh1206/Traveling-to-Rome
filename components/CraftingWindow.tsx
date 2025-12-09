import React from 'react';
import { Player, Inventory } from '../types';
import { CRAFTING_RECIPES } from '../constants';

interface CraftingWindowProps {
  player: Player;
  inventory: Inventory;
  ammunition: number;
  onCraft: (recipeIndex: number) => void;
  onClose: () => void;
}

const CraftingWindow: React.FC<CraftingWindowProps> = ({ player, inventory, ammunition, onCraft, onClose }) => {
  const availableRecipes = CRAFTING_RECIPES.filter(recipe => {
    // Check if recipe is for this profession or universal (null)
    if (recipe.profession !== null && recipe.profession !== player.profession) {
      return false;
    }
    return true;
  });

  const canCraft = (recipe: typeof CRAFTING_RECIPES[0]) => {
    if (recipe.cost) {
      // Check if player has all required materials
      return Object.entries(recipe.cost).every(([item, quantity]) => {
        const available = item === 'Arrows' ? ammunition : (inventory[item] || 0);
        return available >= quantity;
      });
    }
    // Legacy recipe format
    const hasItem = (inventory[recipe.item] || 0) > 0;
    const hasRequired = !recipe.requires || (inventory[recipe.requires] || 0) > 0;
    return hasItem && hasRequired;
  };

  const getMaterialsDisplay = (recipe: typeof CRAFTING_RECIPES[0]) => {
    if (recipe.cost) {
      return Object.entries(recipe.cost).map(([item, quantity]) => {
        const available = item === 'Arrows' ? ammunition : (inventory[item] || 0);
        const hasEnough = available >= quantity;
        return (
          <span key={item} className={hasEnough ? 'text-green-400' : 'text-red-400'}>
            {item} ({available}/{quantity})
          </span>
        );
      }).reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} className="text-gray-500"> + </span>, curr] as any);
    }
    // Legacy format
    const parts = [];
    if (recipe.item) {
      const available = inventory[recipe.item] || 0;
      parts.push(
        <span key="item" className={available > 0 ? 'text-green-400' : 'text-red-400'}>
          {recipe.item} ({available}/1)
        </span>
      );
    }
    if (recipe.requires) {
      const available = inventory[recipe.requires] || 0;
      parts.push(
        <span key="requires" className={available > 0 ? 'text-green-400' : 'text-red-400'}>
          {recipe.requires} ({available}/1)
        </span>
      );
    }
    return parts.reduce((prev, curr, i) =>
      i === 0 ? curr : [prev, <span key={`sep-${i}`} className="text-gray-500"> + </span>, curr] as any
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 border-4 border-amber-600/50 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/40 p-6 border-b-2 border-amber-600/30 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl text-amber-100 font-bold">🔨 Crafting</h2>
              <p className="text-amber-300 text-sm mt-1">Create items from your materials</p>
            </div>
            <button
              onClick={onClose}
              className="text-3xl text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {availableRecipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No crafting recipes available.</p>
              <p className="text-gray-500 text-sm mt-2">Gather materials while traveling to unlock recipes.</p>
            </div>
          ) : (
            availableRecipes.map((recipe, index) => {
              const craftable = canCraft(recipe);
              const actualIndex = CRAFTING_RECIPES.indexOf(recipe);

              return (
                <div
                  key={index}
                  className={`bg-stone-700/30 p-4 rounded-lg border-2 transition-all ${
                    craftable
                      ? 'border-green-600/40 hover:border-green-500/60 hover:bg-stone-700/50'
                      : 'border-stone-600/30 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl text-amber-200 font-bold">
                          {recipe.result}
                          {recipe.resultQuantity && recipe.resultQuantity > 1 && (
                            <span className="text-green-400 ml-2">x{recipe.resultQuantity}</span>
                          )}
                        </h3>
                        {recipe.profession && (
                          <span className="px-2 py-0.5 bg-purple-900/40 border border-purple-500/30 text-purple-300 rounded text-xs">
                            {recipe.profession}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{recipe.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-amber-400 font-semibold">Materials:</span>
                        <div className="flex flex-wrap gap-1">
                          {getMaterialsDisplay(recipe)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => craftable && onCraft(actualIndex)}
                      disabled={!craftable}
                      className={`px-6 py-3 rounded-lg font-bold transition-all ${
                        craftable
                          ? 'bg-green-700 hover:bg-green-600 text-green-100 hover:shadow-lg'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {craftable ? 'Craft' : 'Need Materials'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-900/50 p-4 border-t-2 border-amber-600/30 sticky bottom-0">
          <p className="text-gray-400 text-sm text-center">
            💡 Tip: Forage for materials during travel or at camp to unlock more recipes
          </p>
        </div>
      </div>
    </div>
  );
};

export default CraftingWindow;
