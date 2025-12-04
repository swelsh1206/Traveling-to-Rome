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
          <h2 className="text-lg text-amber-300 tracking-wider font-bold leading-tight">{player.name}</h2>
          <Tooltip content={PROFESSION_TOOLTIPS[player.profession]} position="top">
            <p className="text-xs text-amber-100 cursor-help">{player.profession}</p>
          </Tooltip>
          <p className="text-xs text-gray-400 mt-0.5">{player.startingCity}</p>
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
          <h4 className="text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">Skills</h4>
          <div className="grid grid-cols-3 gap-1 text-xs">
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
            <h4 className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Equipment</h4>
            <div className="flex flex-wrap gap-1 text-xs">
              {gameState.equipment.weapon && (
                <span className="bg-stone-800/30 px-2 py-0.5 rounded text-gray-300">⚔️ {gameState.equipment.weapon}</span>
              )}
              {gameState.equipment.armor && (
                <span className="bg-stone-800/30 px-2 py-0.5 rounded text-gray-300">🛡️ {gameState.equipment.armor}</span>
              )}
              {gameState.equipment.tool && (
                <span className="bg-stone-800/30 px-2 py-0.5 rounded text-gray-300">🔧 {gameState.equipment.tool}</span>
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
                onClick={() => onOpenInventoryForTarget?.(member)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-grow min-w-0">
                    <h4 className="text-amber-200 font-bold text-xs truncate">{member.name}</h4>
                    <p className="text-xs text-gray-400 capitalize">{member.role}</p>
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

                <div className="space-y-0.5 text-xs">
                  {/* Compact Stat Bars */}
                  <div className="grid grid-cols-3 gap-1 text-xs">
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
                    <div className="bg-stone-800/50 px-1.5 py-0.5 rounded text-xs text-center cursor-help">
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

      {/* Rest of component - remove duplicate sections */}
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
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {inventoryItems.map(([itemName, quantity]) => (
              <div key={itemName} className="flex justify-between items-center text-xs bg-stone-900/30 p-1.5 rounded">
                <div className="flex items-center gap-1">
                  {ITEM_ICONS[itemName] && <span>{ITEM_ICONS[itemName]}</span>}
                  <span className="text-gray-300">{itemName}</span>
                </div>
                <span className="text-amber-300 font-bold">x{quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSidebar;
