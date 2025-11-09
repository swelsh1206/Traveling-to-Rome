import React, { useState } from 'react';
import { Player, GameState, PartyMember } from '../types';
import { ITEM_ICONS, ITEM_DESCRIPTIONS, ITEM_EFFECTS, PROFESSION_STATS } from '../constants';
import Tooltip from './Tooltip';
import { CONDITION_TOOLTIPS, PROFESSION_TOOLTIPS, MOOD_TOOLTIPS, PERSONALITY_TOOLTIPS } from '../tooltipDescriptions';

interface CharacterSidebarProps {
  player: Player;
  gameState: GameState;
  characterImageUrl: string;
  onUseItem?: (item: string) => void;
  onOpenInventoryForTarget?: (member: PartyMember) => void;
  onOpenIndex?: () => void;
}

const CharacterSidebar: React.FC<CharacterSidebarProps> = ({
  player,
  gameState,
  characterImageUrl,
  onUseItem,
  onOpenInventoryForTarget,
  onOpenIndex
}) => {
  const [partyExpanded, setPartyExpanded] = useState(true);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);

  const getBorderColor = () => {
    const phase = gameState.phase;
    if (phase === 'in_city') return 'border-purple-600/50';
    if (phase === 'camp') return 'border-sky-600/50';
    return 'border-amber-600/50';
  };

  const inventoryItems = Object.entries(gameState.inventory);

  return (
    <div className={`w-80 flex-shrink-0 bg-gradient-to-b from-stone-800/80 to-stone-900/80 border-l-2 ${getBorderColor()} shadow-2xl overflow-y-auto transition-all duration-500`}>
      {/* Character Info - Always Visible */}
      <div className="p-4 border-b-2 border-amber-600/30">
        <div className="text-center mb-3">
          {characterImageUrl && (
            <img
              src={characterImageUrl}
              alt={player.name}
              className="w-32 h-32 mx-auto rounded-lg border-2 border-amber-500 shadow-lg mb-2"
            />
          )}
          <h2 className="text-2xl text-amber-300 tracking-wider font-bold">{player.name}</h2>
          <Tooltip content={PROFESSION_TOOLTIPS[player.profession]} position="left">
            <p className="text-md text-amber-100 cursor-help">{player.profession}</p>
          </Tooltip>
        </div>

        {/* Conditions */}
        {gameState.conditions.length > 0 && (
          <div className="mt-3 space-y-1">
            {gameState.conditions.map(condition => (
              <Tooltip key={condition} content={CONDITION_TOOLTIPS[condition]} position="left">
                <div className="bg-red-900/30 border border-red-600/50 rounded px-2 py-1 text-xs text-red-300 cursor-help text-center">
                  {condition}
                </div>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Skills */}
        <div className="mt-3 bg-stone-900/50 p-2 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-2 font-semibold">Skills</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="text-gray-400">⚔️ Combat: <span className="text-amber-200">{gameState.skills.combat}</span></div>
            <div className="text-gray-400">💬 Diplomacy: <span className="text-amber-200">{gameState.skills.diplomacy}</span></div>
            <div className="text-gray-400">🏕️ Survival: <span className="text-amber-200">{gameState.skills.survival}</span></div>
            <div className="text-gray-400">⚕️ Medicine: <span className="text-amber-200">{gameState.skills.medicine}</span></div>
            <div className="text-gray-400">🥷 Stealth: <span className="text-amber-200">{gameState.skills.stealth}</span></div>
            <div className="text-gray-400">📚 Knowledge: <span className="text-amber-200">{gameState.skills.knowledge}</span></div>
          </div>
        </div>

        {/* Equipment */}
        {(gameState.equipment.weapon || gameState.equipment.armor || gameState.equipment.tool) && (
          <div className="mt-3 bg-stone-900/50 p-2 rounded-lg">
            <h4 className="text-xs text-gray-400 mb-2 font-semibold">Equipment</h4>
            <div className="space-y-1 text-xs">
              {gameState.equipment.weapon && (
                <div className="text-gray-400">⚔️ {gameState.equipment.weapon}</div>
              )}
              {gameState.equipment.armor && (
                <div className="text-gray-400">🛡️ {gameState.equipment.armor}</div>
              )}
              {gameState.equipment.tool && (
                <div className="text-gray-400">🔧 {gameState.equipment.tool}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Party Section - Collapsible */}
      <div className="border-b-2 border-amber-600/30">
        <button
          onClick={() => setPartyExpanded(!partyExpanded)}
          className="w-full p-3 flex items-center justify-between hover:bg-stone-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h3 className="text-lg text-amber-200 font-bold">Party</h3>
            <span className="text-xs text-gray-400">({gameState.party.length})</span>
          </div>
          <span className="text-amber-400 text-xl">{partyExpanded ? '▼' : '▶'}</span>
        </button>

        {partyExpanded && (
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
            {gameState.party.length === 0 ? (
              <p className="text-gray-400 text-sm italic text-center py-4">Traveling alone</p>
            ) : (
              gameState.party.map(member => (
                <div key={member.name} className="bg-stone-700/30 p-3 rounded-lg border border-amber-600/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-amber-200 font-semibold text-sm">{member.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip content={PERSONALITY_TOOLTIPS[member.personalityTrait as keyof typeof PERSONALITY_TOOLTIPS]} position="left">
                        <span className="text-lg cursor-help">✨</span>
                      </Tooltip>
                      <Tooltip content={MOOD_TOOLTIPS[member.mood]} position="left">
                        <span className="text-lg cursor-help">
                          {member.mood === 'content' ? '😊' :
                           member.mood === 'worried' ? '😟' :
                           member.mood === 'afraid' ? '😨' :
                           member.mood === 'angry' ? '😠' :
                           member.mood === 'hopeful' ? '🙂' : '🥰'}
                        </span>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Health:</span>
                      <span className={`font-bold ${member.health < 30 ? 'text-red-400' : member.health < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {member.health}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hunger:</span>
                      <span className={`font-bold ${
                        gameState.food < 10 ? 'text-red-500' :
                        gameState.rationLevel === 'meager' ? 'text-orange-400' :
                        gameState.rationLevel === 'normal' ? 'text-yellow-300' :
                        'text-green-400'
                      }`}>
                        {gameState.food < 10 ? 'Starving' :
                         gameState.rationLevel === 'meager' ? 'Hungry' :
                         gameState.rationLevel === 'normal' ? 'Fed' : 'Well Fed'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Relationship:</span>
                      <span className={`font-bold ${member.relationship >= 75 ? 'text-green-400' : member.relationship >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {member.relationship}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trust:</span>
                      <span className={`font-bold ${member.trust >= 60 ? 'text-cyan-400' : member.trust >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {member.trust}/100
                      </span>
                    </div>
                  </div>

                  {member.conditions.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {member.conditions.map(cond => (
                        <Tooltip key={cond} content={CONDITION_TOOLTIPS[cond]} position="left">
                          <span className="text-xs bg-red-900/30 border border-red-600/50 px-2 py-1 rounded text-red-300 cursor-help">
                            {cond}
                          </span>
                        </Tooltip>
                      ))}
                    </div>
                  )}

                  {onOpenInventoryForTarget && (
                    <button
                      onClick={() => onOpenInventoryForTarget(member)}
                      className="w-full mt-2 text-xs px-2 py-1 bg-amber-600/20 border border-amber-500 text-amber-300 hover:bg-amber-600/40 transition-colors rounded font-semibold"
                    >
                      Use Item
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Inventory Section - Collapsible */}
      <div>
        <button
          onClick={() => setInventoryExpanded(!inventoryExpanded)}
          className="w-full p-3 flex items-center justify-between hover:bg-stone-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎒</span>
            <h3 className="text-lg text-amber-200 font-bold">Inventory</h3>
            <span className="text-xs text-gray-400">({inventoryItems.length})</span>
          </div>
          <span className="text-amber-400 text-xl">{inventoryExpanded ? '▼' : '▶'}</span>
        </button>

        {inventoryExpanded && (
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {inventoryItems.length > 0 ? (
              inventoryItems.map(([item, quantity]) => {
                const effect = ITEM_EFFECTS[item];
                const description = ITEM_DESCRIPTIONS[item];
                const icon = ITEM_ICONS[item] || '📦';
                return (
                  <div key={item} className="bg-stone-700/30 p-2 rounded-lg border border-amber-600/20">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-amber-200 font-semibold text-sm truncate">{item}</div>
                          <div className="text-xs text-gray-400">Qty: {quantity}</div>
                        </div>
                      </div>
                      {effect && onUseItem && (
                        <button
                          onClick={() => onUseItem(item)}
                          className="text-xs px-2 py-1 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-stone-900 rounded transition-colors flex-shrink-0"
                        >
                          Use
                        </button>
                      )}
                    </div>
                    {description && (
                      <p className="text-xs text-gray-300 italic line-clamp-2">{description}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm italic text-center py-4">Empty bags</p>
            )}
          </div>
        )}
      </div>

      {/* Index Button */}
      {onOpenIndex && (
        <div className="p-3 border-t-2 border-amber-600/30">
          <button
            onClick={onOpenIndex}
            className="w-full p-3 bg-gradient-to-r from-amber-700/30 to-amber-600/30 border-2 border-amber-500/50 text-amber-200 hover:from-amber-600/40 hover:to-amber-500/40 hover:border-amber-400 transition-all rounded-lg font-bold text-center shadow-lg"
          >
            📚 INDEX & HELP
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterSidebar;
