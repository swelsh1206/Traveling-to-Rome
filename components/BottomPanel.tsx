import React from 'react';
import { Player, GameState, PartyMember, Profession } from '../types';
import { ITEM_ICONS, ITEM_DESCRIPTIONS, ITEM_EFFECTS, PROFESSION_STATS } from '../constants';
import Tooltip from './Tooltip';
import { CONDITION_TOOLTIPS, PROFESSION_TOOLTIPS, MOOD_TOOLTIPS, PERSONALITY_TOOLTIPS } from '../tooltipDescriptions';

type TabType = 'character' | 'party' | 'inventory';

interface SidePanelProps {
  activeTab: TabType | null;
  player: Player;
  gameState: GameState;
  onClose: () => void;
  onUseItem?: (item: string) => void;
  onOpenInventoryForTarget?: (member: PartyMember) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  activeTab,
  player,
  gameState,
  onClose,
  onUseItem,
  onOpenInventoryForTarget
}) => {
  if (!activeTab) return null;

  const getBorderColor = () => {
    const phase = gameState.phase;
    if (phase === 'in_city') return 'border-purple-600/50';
    if (phase === 'camp') return 'border-sky-600/50';
    return 'border-amber-600/50';
  };

  const renderCharacterTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
          <h3 className="text-xl text-amber-200 font-bold mb-3">Character</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="text-amber-100 ml-2 font-semibold">{player.name}</span>
            </div>
            <Tooltip content={PROFESSION_TOOLTIPS[player.profession]}>
              <div className="cursor-help">
                <span className="text-gray-400">Profession:</span>
                <span className="text-amber-100 ml-2 font-semibold">{player.profession}</span>
              </div>
            </Tooltip>
            <div className="mt-3 pt-3 border-t border-amber-600/20">
              <p className="text-gray-300 text-sm italic">{PROFESSION_STATS[player.profession].description}</p>
            </div>
          </div>
        </div>

        <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
          <h3 className="text-xl text-amber-200 font-bold mb-3">Conditions</h3>
          {gameState.conditions.length > 0 ? (
            <div className="space-y-2">
              {gameState.conditions.map(condition => (
                <Tooltip key={condition} content={CONDITION_TOOLTIPS[condition]}>
                  <div className="bg-red-900/20 border border-red-600/30 rounded px-3 py-2 cursor-help">
                    <span className="text-red-300 font-semibold">{condition}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No active conditions</p>
          )}
        </div>
      </div>

      <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
        <h3 className="text-xl text-amber-200 font-bold mb-3">Equipment & Skills</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-amber-100 font-semibold mb-2 text-sm">Equipment</h4>
            <div className="space-y-1 text-sm">
              {gameState.equipment.weapon && (
                <div><span className="text-gray-400">Weapon:</span> <span className="text-gray-200">{gameState.equipment.weapon}</span></div>
              )}
              {gameState.equipment.armor && (
                <div><span className="text-gray-400">Armor:</span> <span className="text-gray-200">{gameState.equipment.armor}</span></div>
              )}
              {gameState.equipment.tool && (
                <div><span className="text-gray-400">Tool:</span> <span className="text-gray-200">{gameState.equipment.tool}</span></div>
              )}
              {!gameState.equipment.weapon && !gameState.equipment.armor && !gameState.equipment.tool && (
                <p className="text-gray-400 italic">No equipment</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-amber-100 font-semibold mb-2 text-sm">Skills</h4>
            <div className="space-y-1 text-sm">
              <div><span className="text-gray-400">Combat:</span> <span className="text-gray-200">{gameState.skills.combat}/100</span></div>
              <div><span className="text-gray-400">Survival:</span> <span className="text-gray-200">{gameState.skills.survival}/100</span></div>
              <div><span className="text-gray-400">Persuasion:</span> <span className="text-gray-200">{gameState.skills.persuasion}/100</span></div>
              <div><span className="text-gray-400">Medicine:</span> <span className="text-gray-200">{gameState.skills.medicine}/100</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPartyTab = () => (
    <div className="space-y-3">
      {gameState.party.length === 0 ? (
        <p className="text-gray-400 text-center py-8 italic">You travel alone. Your family did not survive the journey.</p>
      ) : (
        gameState.party.map(member => (
          <div key={member.name} className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg text-amber-200 font-bold">{member.name}</h3>
                <p className="text-sm text-gray-400 capitalize">{member.role}</p>
              </div>
              <div className="flex gap-2">
                <Tooltip content={PERSONALITY_TOOLTIPS[member.personalityTrait as keyof typeof PERSONALITY_TOOLTIPS]}>
                  <span className="text-2xl cursor-help">✨</span>
                </Tooltip>
                <Tooltip content={MOOD_TOOLTIPS[member.mood]}>
                  <span className="text-2xl cursor-help">
                    {member.mood === 'content' ? '😊' :
                     member.mood === 'worried' ? '😟' :
                     member.mood === 'afraid' ? '😨' :
                     member.mood === 'angry' ? '😠' :
                     member.mood === 'hopeful' ? '🙂' : '🥰'}
                  </span>
                </Tooltip>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Health:</span>
                <span className={`ml-2 font-bold ${member.health < 30 ? 'text-red-400' : member.health < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {member.health}/100
                </span>
              </div>
              <div>
                <span className="text-gray-400">Relationship:</span>
                <span className={`ml-2 font-bold ${member.relationship >= 75 ? 'text-green-400' : member.relationship >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {member.relationship}/100
                </span>
              </div>
              <div>
                <span className="text-gray-400">Trust:</span>
                <span className={`ml-2 font-bold ${member.trust >= 60 ? 'text-cyan-400' : member.trust >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {member.trust}/100
                </span>
              </div>
            </div>

            {member.conditions.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {member.conditions.map(cond => (
                  <Tooltip key={cond} content={CONDITION_TOOLTIPS[cond]}>
                    <span className="text-xs bg-red-900/30 border border-red-600/50 px-2 py-1 rounded text-red-300 cursor-help">
                      {cond}
                    </span>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderInventoryTab = () => {
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
                  {effect && onUseItem && (
                    <button
                      onClick={() => onUseItem(item)}
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
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 italic text-base">Your bags are empty.</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'character': return renderCharacterTab();
      case 'party': return renderPartyTab();
      case 'inventory': return renderInventoryTab();
      default: return null;
    }
  };

  return (
    <div className={`absolute right-20 top-0 bottom-0 w-[400px] bg-gradient-to-l from-stone-900/95 to-stone-800/95 border-l-2 ${getBorderColor()} overflow-y-auto transition-all duration-300 shadow-2xl z-30`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-stone-900/95 pb-2 border-b border-amber-600/30">
          <h2 className="text-2xl text-amber-200 font-bold capitalize">{activeTab}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-amber-200 transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default SidePanel;
