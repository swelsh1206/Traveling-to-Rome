import React from 'react';
import { Player, GameState } from '../types';

type TabType = 'character' | 'party' | 'inventory';

interface SideTabsProps {
  activeTab: TabType | null;
  onTabClick: (tab: TabType) => void;
  player: Player;
  gameState: GameState;
}

const SideTabs: React.FC<SideTabsProps> = ({ activeTab, onTabClick, player, gameState }) => {
  const tabs = [
    { id: 'character' as TabType, icon: '👤', label: 'Character' },
    { id: 'party' as TabType, icon: '👥', label: 'Party' },
    { id: 'inventory' as TabType, icon: '🎒', label: 'Inventory' },
  ];

  const getBorderColor = () => {
    const phase = gameState.phase;
    if (phase === 'in_city') return 'border-purple-600/50';
    if (phase === 'camp') return 'border-sky-600/50';
    return 'border-amber-600/50';
  };

  const getActiveColor = () => {
    const phase = gameState.phase;
    if (phase === 'in_city') return 'bg-purple-600/30 border-purple-500 text-purple-200';
    if (phase === 'camp') return 'bg-sky-600/30 border-sky-500 text-sky-200';
    return 'bg-amber-600/30 border-amber-500 text-amber-200';
  };

  return (
    <div className={`h-full bg-gradient-to-b from-stone-900/80 via-stone-800/80 to-stone-900/80 border-l-2 ${getBorderColor()} p-2 flex flex-col items-center justify-center gap-4 transition-all duration-500`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`flex flex-col items-center justify-center px-4 py-4 rounded-lg transition-all duration-200 w-full ${
            activeTab === tab.id
              ? getActiveColor()
              : 'text-gray-400 hover:text-amber-200 hover:bg-stone-700/30 border border-transparent'
          }`}
          title={tab.label}
        >
          <span className="text-3xl mb-1">{tab.icon}</span>
          <span className="text-xs font-semibold text-center">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SideTabs;
