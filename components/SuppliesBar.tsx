import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_HEALTH } from '../constants';
import { GamePhase, RationLevel } from '../types';
import Tooltip from './Tooltip';
import { STAT_TOOLTIPS } from '../tooltipDescriptions';

interface SuppliesBarProps {
  phase: GamePhase;
  health: number;
  stamina: number;
  food: number;
  money: number;
  oxen: number;
  location: string | null;
  rationLevel: RationLevel;
  onRationChange?: (level: RationLevel) => void;
}

const StatDisplay: React.FC<{ icon: string; value: string | number; label: string; currentValue: number; tooltip: string }> = ({ icon, value, label, currentValue, tooltip }) => {
    const [indicator, setIndicator] = useState<'up' | 'down' | null>(null);
    const prevValueRef = useRef<number>(currentValue);

    useEffect(() => {
        const prevValue = prevValueRef.current;
        if (currentValue > prevValue) {
            setIndicator('up');
        } else if (currentValue < prevValue) {
            setIndicator('down');
        }

        if (currentValue !== prevValue) {
            const timer = setTimeout(() => {
                setIndicator(null);
            }, 1500); // Animation duration

            // Update previous value after the change is detected
            prevValueRef.current = currentValue;

            return () => clearTimeout(timer);
        }
    }, [currentValue]);


    return (
        <Tooltip content={tooltip}>
            <div className="flex items-center space-x-2 relative cursor-help">
                <span className="text-2xl text-amber-200">{icon}</span>
                <span className="text-lg font-bold text-white tracking-wider">{value}</span>
                {indicator === 'up' && <span key={Date.now()} className="absolute -top-1 -right-2 text-lg text-green-400 animate-stat-up">▲</span>}
                {indicator === 'down' && <span key={Date.now()} className="absolute top-4 -right-2 text-lg text-red-500 animate-stat-down">▼</span>}
            </div>
        </Tooltip>
    );
};


const SuppliesBar: React.FC<SuppliesBarProps> = ({ phase, health, stamina, food, money, oxen, location, rationLevel, onRationChange }) => {
  const getPhaseInfo = () => {
    switch(phase) {
        case 'traveling':
            return { text: 'On the Road', color: 'text-amber-400' };
        case 'camp':
            return { text: 'In Camp', color: 'text-sky-400' };
        case 'in_city':
            const locationName = location ? location.replace('the town of ', '').replace('the city of ', '') : 'City';
            return { text: `At ${locationName}`, color: 'text-purple-400' };
        case 'merchant_encounter':
            return { text: 'Merchant Encounter', color: 'text-cyan-400' };
        default:
            return { text: '', color: ''};
    }
  }

  const getRationInfo = () => {
    switch(rationLevel) {
      case 'filling':
        return { text: 'Filling Rations', color: 'text-green-400', icon: '🍖🍖', tooltip: 'Filling rations: 2 food per person per day. Boosts morale and health.' };
      case 'normal':
        return { text: 'Normal Rations', color: 'text-yellow-400', icon: '🍖', tooltip: 'Normal rations: 1 food per person per day. Standard consumption.' };
      case 'meager':
        return { text: 'Meager Rations', color: 'text-red-400', icon: '🥄', tooltip: 'Meager rations: 0.5 food per person per day. Lowers morale and slowly damages health.' };
    }
  };

  const phaseInfo = getPhaseInfo();
  const rationInfo = getRationInfo();

  const cycleRationLevel = () => {
    if (!onRationChange) return;
    const levels: RationLevel[] = ['filling', 'normal', 'meager'];
    const currentIndex = levels.indexOf(rationLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    onRationChange(levels[nextIndex]);
  };

  const getBorderColor = () => {
    switch(phase) {
      case 'camp': return 'border-sky-600/50';
      case 'in_city': return 'border-purple-600/50';
      default: return 'border-amber-600/50';
    }
  };

  return (
    <div className={`w-full bg-gradient-to-r from-stone-900/70 via-stone-800/70 to-stone-900/70 border-2 ${getBorderColor()} p-2 flex items-center justify-between px-4 rounded-lg shadow-lg transition-all duration-500`}>
        <div className="flex items-center space-x-6">
            <StatDisplay icon="❤️" value={`${health}/${INITIAL_HEALTH}`} label="Health" currentValue={health} tooltip={STAT_TOOLTIPS.health} />
            <StatDisplay icon="⚡" value={stamina} label="Stamina" currentValue={stamina} tooltip={STAT_TOOLTIPS.stamina} />
            <StatDisplay icon="🥖" value={food} label="Food" currentValue={food} tooltip={STAT_TOOLTIPS.food} />

            {/* Ration Level Indicator */}
            <Tooltip content={rationInfo.tooltip}>
              <button
                onClick={cycleRationLevel}
                className="flex items-center space-x-2 px-3 py-1 bg-stone-800/50 border border-stone-600 rounded-lg hover:bg-stone-700/50 hover:border-stone-500 transition-all cursor-pointer"
              >
                <span className="text-lg">{rationInfo.icon}</span>
                <span className={`text-sm font-semibold ${rationInfo.color}`}>{rationInfo.text}</span>
              </button>
            </Tooltip>
        </div>

        <div>
            <h3 className={`text-xl font-bold tracking-widest transition-colors duration-500 ${phaseInfo.color} text-shadow-glow`}>
                {phaseInfo.text}
            </h3>
        </div>

        <div className="flex items-center space-x-6">
            <StatDisplay icon="💰" value={money} label="Money" currentValue={money} tooltip={STAT_TOOLTIPS.money} />
            <StatDisplay icon="🐂" value={oxen} label="Oxen" currentValue={oxen} tooltip={STAT_TOOLTIPS.oxen} />
        </div>
    </div>
  );
};

export default SuppliesBar;