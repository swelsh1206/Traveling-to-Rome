import React, { useState } from 'react';
import { Player, GameState, PartyMember } from '../types';
import { ITEM_ICONS, ITEM_DESCRIPTIONS, ITEM_EFFECTS, PROFESSION_STATS } from '../constants';
import Tooltip from './Tooltip';
import { CONDITION_TOOLTIPS, PROFESSION_TOOLTIPS, MOOD_TOOLTIPS, PERSONALITY_TOOLTIPS, EQUIPMENT_TOOLTIPS } from '../tooltipDescriptions';

interface CharacterSidebarProps {
  player: Player;
  gameState: GameState;
  characterImageUrl: string;
  onUseItem?: (item: string, target?: PartyMember) => void;
  onOpenInventoryForTarget?: (member: PartyMember) => void;
  onOpenIndex?: () => void;
  onOpenPartyMemberDetail?: (member: PartyMember) => void;
}

const CharacterSidebar: React.FC<CharacterSidebarProps> = ({
  player,
  gameState,
  characterImageUrl,
  onUseItem,
  onOpenInventoryForTarget,
  onOpenIndex,
  onOpenPartyMemberDetail
}) => {
  const [partyExpanded, setPartyExpanded] = useState(true);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showTargetSelector, setShowTargetSelector] = useState(false);

  const getBorderColor = () => {
    const phase = gameState.phase;
    if (phase === 'in_city') return 'border-purple-600/50';
    if (phase === 'camp') return 'border-sky-600/50';
    return 'border-amber-600/50';
  };

  const inventoryItems = Object.entries(gameState.inventory);

  return (
    <div className={`w-80 flex-shrink-0 bg-gradient-to-b from-stone-800/80 to-stone-900/80 border-l-2 ${getBorderColor()} shadow-2xl overflow-y-auto transition-all duration-500`}>
      {/* Character Info - Consolidated */}
      <div className="p-3 border-b-2 border-amber-600/30">
        <div className="text-center mb-3">
          {characterImageUrl && (
            <img
              src={characterImageUrl}
              alt={player.name}
              className="w-20 h-20 mx-auto rounded-lg border-2 border-amber-500 shadow-lg mb-2"
            />
          )}
          <h2 className="text-xl text-amber-300 tracking-wider font-bold leading-tight">{player.name}</h2>
          <Tooltip content={PROFESSION_TOOLTIPS[player.profession]} position="top">
            <p className="text-sm text-amber-100 cursor-help">{player.profession}</p>
          </Tooltip>
          <p className="text-sm text-gray-400 mt-0.5">{player.startingCity}</p>
        </div>

        {/* Conditions & Injuries */}
        {(gameState.conditions.length > 0 || (gameState.injuries && gameState.injuries.length > 0)) && (
          <div className="mb-2 space-y-1">
            {gameState.conditions.map(condition => (
              <Tooltip key={condition} content={CONDITION_TOOLTIPS[condition]} position="top">
                <div className="bg-red-900/30 border border-red-600/50 rounded px-2 py-1 text-xs text-red-300 cursor-help text-center">
                  ⚠️ {condition}
                </div>
              </Tooltip>
            ))}
            {gameState.injuries && gameState.injuries.map((injury, idx) => (
              <div key={idx} className={`${
                injury.severity === 'Minor' ? 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300' :
                injury.severity === 'Moderate' ? 'bg-orange-900/30 border-orange-600/50 text-orange-300' :
                injury.severity === 'Severe' ? 'bg-red-900/30 border-red-600/50 text-red-300' :
                'bg-red-900/50 border-red-600/70 text-red-200 font-bold'
              } border rounded px-2 py-1 text-xs text-center`}>
                💔 {injury.type} ({injury.severity})
              </div>
            ))}
          </div>
        )}

        {/* Skills - More Compact */}
        <div className="bg-stone-900/50 p-2 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Skills</h4>
          <div className="grid grid-cols-3 gap-1 text-sm">
            <Tooltip content="Combat skill affects fighting and hunting" position="top">
              <div className="flex flex-col items-center bg-stone-800/30 p-1 rounded cursor-help">
                <span className="text-base">⚔️</span>
                <span className="text-amber-200 font-bold text-sm">{gameState.skills.combat}</span>
              </div>
            </Tooltip>
            <Tooltip content="Diplomacy skill affects negotiations and persuasion" position="top">
              <div className="flex flex-col items-center bg-stone-800/30 p-1 rounded cursor-help">
                <span className="text-base">💬</span>
                <span className="text-amber-200 font-bold text-sm">{gameState.skills.diplomacy}</span>
              </div>
            </Tooltip>
            <Tooltip content="Survival skill affects endurance and resourcefulness" position="top">
              <div className="flex flex-col items-center bg-stone-800/30 p-1 rounded cursor-help">
                <span className="text-base">🏕️</span>
                <span className="text-amber-200 font-bold text-sm">{gameState.skills.survival}</span>
              </div>
            </Tooltip>
            <Tooltip content="Medicine skill affects healing and treating illness" position="top">
              <div className="flex flex-col items-center bg-stone-800/30 p-1 rounded cursor-help">
                <span className="text-base">⚕️</span>
                <span className="text-amber-200 font-bold text-sm">{gameState.skills.medicine}</span>
              </div>
            </Tooltip>
            <Tooltip content="Stealth skill affects avoiding detection" position="top">
              <div className="flex flex-col items-center bg-stone-800/30 p-1 rounded cursor-help">
                <span className="text-base">🥷</span>
                <span className="text-amber-200 font-bold text-sm">{gameState.skills.stealth}</span>
              </div>
            </Tooltip>
            <Tooltip content="Knowledge skill affects education and understanding" position="top">
              <div className="flex flex-col items-center bg-stone-800/30 p-1 rounded cursor-help">
                <span className="text-base">📚</span>
                <span className="text-amber-200 font-bold text-sm">{gameState.skills.knowledge}</span>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Equipment - More Compact */}
        {(gameState.equipment.weapon || gameState.equipment.armor || gameState.equipment.tool) && (
          <div className="mt-2 bg-stone-900/50 p-2 rounded-lg">
            <h4 className="text-sm text-gray-400 mb-1 font-semibold uppercase tracking-wide">Equipment</h4>
            <div className="flex flex-wrap gap-1 text-sm">
              {gameState.equipment.weapon && (
                <Tooltip content={EQUIPMENT_TOOLTIPS[gameState.equipment.weapon] || gameState.equipment.weapon} position="top">
                  <span className="bg-stone-800/30 px-2 py-0.5 rounded text-gray-300 cursor-help">⚔️ {gameState.equipment.weapon}</span>
                </Tooltip>
              )}
              {gameState.equipment.armor && (
                <Tooltip content={EQUIPMENT_TOOLTIPS[gameState.equipment.armor] || gameState.equipment.armor} position="top">
                  <span className="bg-stone-800/30 px-2 py-0.5 rounded text-gray-300 cursor-help">🛡️ {gameState.equipment.armor}</span>
                </Tooltip>
              )}
              {gameState.equipment.tool && (
                <Tooltip content={EQUIPMENT_TOOLTIPS[gameState.equipment.tool] || gameState.equipment.tool} position="top">
                  <span className="bg-stone-800/30 px-2 py-0.5 rounded text-gray-300 cursor-help">🔧 {gameState.equipment.tool}</span>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Party Section - Compact & Collapsible */}
      <div className="p-3 border-b-2 border-amber-600/30">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setPartyExpanded(!partyExpanded)}
        >
          <h3 className="text-sm text-amber-300 font-bold flex items-center gap-1">
            <span>👨‍👩‍👧</span>
            <span>Party ({gameState.party.length})</span>
          </h3>
          <span className={`text-amber-400 transform transition-transform text-xs ${partyExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>

        {partyExpanded && gameState.party.length > 0 && (
          <div className="mt-2 space-y-2">
            {gameState.party.map((member, index) => (
              <div
                key={member.name}
                className="bg-stone-900/50 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40 transition-colors cursor-pointer"
                onClick={() => onOpenPartyMemberDetail?.(member)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-grow min-w-0">
                    <h4 className="text-amber-200 font-bold text-sm truncate">{member.name}</h4>
                    <p className="text-sm text-gray-400 capitalize">{member.role}</p>
                  </div>
                  <Tooltip content={MOOD_TOOLTIPS[member.mood]} position="top">
                    <div className="text-base cursor-help flex-shrink-0 ml-1">
                      {member.mood === 'content' && '😊'}
                      {member.mood === 'hopeful' && '😌'}
                      {member.mood === 'worried' && '😟'}
                      {member.mood === 'afraid' && '😨'}
                      {member.mood === 'angry' && '😠'}
                      {member.mood === 'devoted' && '😇'}
                    </div>
                  </Tooltip>
                </div>

                <div className="space-y-0.5 text-sm">
                  {/* Compact Stat Bars */}
                  <div className="grid grid-cols-3 gap-1 text-sm">
                    <div>
                      <span className={member.health > 70 ? 'text-green-400' : member.health > 40 ? 'text-yellow-400' : 'text-red-400'}>
                        ❤️{member.health}
                      </span>
                    </div>
                    <div>
                      <span className="text-pink-400">💕{member.relationship}</span>
                    </div>
                    <div>
                      <span className="text-blue-400">🤝{member.trust}</span>
                    </div>
                  </div>

                  {/* Personality */}
                  <Tooltip content={PERSONALITY_TOOLTIPS[member.personalityTrait]} position="top">
                    <div className="bg-stone-800/50 px-1.5 py-0.5 rounded text-sm text-center cursor-help">
                      <span className="text-amber-300 capitalize">{member.personalityTrait}</span>
                    </div>
                  </Tooltip>

                  {/* Conditions & Injuries */}
                  {(member.conditions.length > 0 || (member.injuries && member.injuries.length > 0)) && (
                    <div className="flex flex-wrap gap-0.5">
                      {member.conditions.map(condition => (
                        <Tooltip key={condition} content={CONDITION_TOOLTIPS[condition]} position="top">
                          <span className="bg-red-900/40 border border-red-600/50 text-red-300 px-1 py-0.5 rounded text-xs cursor-help">
                            {condition}
                          </span>
                        </Tooltip>
                      ))}
                      {member.injuries && member.injuries.map((injury, idx) => (
                        <span key={idx} className={`${
                          injury.severity === 'Critical' ? 'bg-red-900/50 text-red-200' : 'bg-orange-900/30 text-orange-300'
                        } border border-current px-1 py-0.5 rounded text-xs`}>
                          💔 {injury.type.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory Section with Item Usage */}
      <div className="p-3 border-b-2 border-amber-600/30">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setInventoryExpanded(!inventoryExpanded)}
        >
          <h3 className="text-sm text-amber-300 font-bold flex items-center gap-1">
            <span>🎒</span>
            <span>Inventory ({inventoryItems.length})</span>
          </h3>
          <span className={`text-amber-400 transform transition-transform text-xs ${inventoryExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>

        {inventoryExpanded && inventoryItems.length > 0 && (
          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
            {inventoryItems.map(([itemName, quantity]) => {
              const effect = ITEM_EFFECTS[itemName];
              const description = ITEM_DESCRIPTIONS[itemName];
              const isUsable = effect && (effect.health_change || effect.removesCondition);

              return (
                <div key={itemName} className="bg-stone-900/30 rounded overflow-hidden">
                  <div className="flex justify-between items-center text-sm p-1.5">
                    <div className="flex items-center gap-1 flex-1">
                      {ITEM_ICONS[itemName] && <span>{ITEM_ICONS[itemName]}</span>}
                      <Tooltip content={description || 'No description available'} position="top">
                        <span className="text-gray-300 cursor-help">{itemName}</span>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 font-bold">x{quantity}</span>
                      {isUsable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(itemName);
                            setShowTargetSelector(true);
                          }}
                          className="px-2 py-0.5 bg-green-700/50 hover:bg-green-600/70 text-green-200 rounded text-xs transition-colors"
                        >
                          Use
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Target Selector */}
                  {showTargetSelector && selectedItem === itemName && (
                    <div className="bg-stone-800/50 p-2 border-t border-amber-600/20">
                      <p className="text-xs text-amber-200 mb-2">Use on:</p>
                      <div className="space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUseItem?.(itemName);
                            setShowTargetSelector(false);
                            setSelectedItem(null);
                          }}
                          className="w-full px-2 py-1 bg-blue-700/50 hover:bg-blue-600/70 text-blue-200 rounded text-xs transition-colors text-left"
                        >
                          ✨ {player.name} (You)
                        </button>
                        {gameState.party.map(member => (
                          <button
                            key={member.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUseItem?.(itemName, member);
                              setShowTargetSelector(false);
                              setSelectedItem(null);
                            }}
                            className="w-full px-2 py-1 bg-purple-700/50 hover:bg-purple-600/70 text-purple-200 rounded text-xs transition-colors text-left"
                          >
                            👤 {member.name} ({member.role})
                          </button>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTargetSelector(false);
                            setSelectedItem(null);
                          }}
                          className="w-full px-2 py-1 bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 rounded text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {inventoryExpanded && inventoryItems.length === 0 && (
          <p className="text-sm text-gray-500 italic mt-2 text-center">No items in inventory</p>
        )}
      </div>
    </div>
  );
};

export default CharacterSidebar;
