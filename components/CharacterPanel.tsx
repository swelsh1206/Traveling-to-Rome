import React from 'react';
import { Player, GameState, WindowType, Condition } from '../types';

interface CharacterPanelProps {
  player: Player;
  imageUrl: string;
  gameState: GameState;
  onOpenWindow: (window: WindowType) => void;
}

const getCharacterStatus = (health: number, food: number): { text: string; color: string } => {
    if (health <= 0) return { text: 'Deceased', color: 'text-red-700' };
    if (health < 25) return { text: 'Gravely Wounded', color: 'text-red-500' };
    if (food < 15 && health < 50) return { text: 'Starving & Injured', color: 'text-red-500' };
    if (food < 15) return { text: 'Starving', color: 'text-orange-500' };
    if (health < 50) return { text: 'Injured', color: 'text-orange-400' };
    if (health < 75) return { text: 'Weary', color: 'text-yellow-400' };
    return { text: 'In Good Health', color: 'text-green-400' };
};

const getConditionColor = (condition: Condition) => {
    switch (condition) {
        case 'Injured': return 'text-red-400';
        case 'Sick': return 'text-green-500';
        case 'Exhausted': return 'text-blue-400';
        case 'Wagon Damaged': return 'text-yellow-600';
        default: return 'text-gray-400';
    }
}

const InfoButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button 
        onClick={onClick}
        className="w-full text-left p-2 bg-stone-700/50 border border-amber-600/30 text-amber-200 hover:bg-amber-600/20 transition-colors duration-200 rounded-md hover-glow"
    >
        {children}
    </button>
)

const CharacterPanel: React.FC<CharacterPanelProps> = ({ player, imageUrl, gameState, onOpenWindow }) => {
  const status = getCharacterStatus(gameState.health, gameState.food);
  const isCamp = gameState.phase === 'camp';
  const isCity = gameState.phase === 'in_city';
  const borderColor = isCity ? 'border-purple-500' : isCamp ? 'border-sky-500' : 'border-amber-500';

  return (
    <div className={`bg-gradient-to-b from-stone-800/80 to-stone-900/80 p-4 border-2 ${borderColor} shadow-2xl text-center h-full flex flex-col transition-all duration-500 rounded-xl hover-lift`}>
      <h2 className="text-2xl text-amber-300 tracking-wider text-shadow-glow">{player.name}</h2>
      <p className="text-md text-amber-100 mb-3">{player.profession}</p>
      
      <div className={`w-full aspect-square mx-auto border-4 ${borderColor} overflow-hidden mb-4 transition-colors duration-500 rounded-2xl shadow-xl`}>
        {imageUrl ? (
          <img src={imageUrl} alt={`Portrait of ${player.name}`} className="w-full h-full object-contain bg-stone-900" />
        ) : (
          <div className="w-full h-full bg-stone-800 flex items-center justify-center">
            <span className="text-amber-400 text-sm">Loading...</span>
          </div>
        )}
      </div>

      <div className="bg-stone-900/50 p-3 border border-amber-600/30 flex-grow rounded-lg">
        <div className="border-b border-amber-600/20 pb-2 mb-3">
            <h3 className="text-lg text-amber-300 mb-1 tracking-wider">Status</h3>
            <p className={`text-md font-bold ${status.color}`}>{status.text}</p>
        </div>

        {gameState.conditions.length > 0 && (
             <div className="border-b border-amber-600/20 pb-2 mb-3">
                <h3 className="text-lg text-amber-300 mb-1 tracking-wider">Conditions</h3>
                <div className="space-y-1">
                    {gameState.conditions.map(cond => (
                        <p key={cond} className={`text-md font-bold ${getConditionColor(cond)}`}>{cond}</p>
                    ))}
                </div>
            </div>
        )}

        <div className="space-y-2">
            <InfoButton onClick={() => onOpenWindow('Description')}>Description</InfoButton>
            <InfoButton onClick={() => onOpenWindow('Party')}>Family</InfoButton>
            <InfoButton onClick={() => onOpenWindow('Inventory')}>Inventory</InfoButton>
            <InfoButton onClick={() => onOpenWindow('History')}>History</InfoButton>
            <InfoButton onClick={() => onOpenWindow('References')}>References</InfoButton>
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;