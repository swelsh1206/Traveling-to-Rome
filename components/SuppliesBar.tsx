import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_HEALTH } from '../constants';
import { GamePhase, RationLevel, WeeklyFocus } from '../types';
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
  weeklyFocus: WeeklyFocus;
  onWeeklyFocusChange?: (focus: WeeklyFocus) => void;
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


const SuppliesBar: React.FC<SuppliesBarProps> = ({ phase, health, stamina, food, money, oxen, location, rationLevel, onRationChange, weeklyFocus, onWeeklyFocusChange }) => {
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
        return { text: 'Filling Rations', color: 'text-green-400', icon: '🍖🍖', tooltip: 'Filling rations: 2x food consumption per week. Better stamina recovery (+80), boosts morale and health.' };
      case 'normal':
        return { text: 'Normal Rations', color: 'text-yellow-400', icon: '🍖', tooltip: 'Normal rations: 1x food consumption per week. Standard stamina recovery (+60).' };
      case 'meager':
        return { text: 'Meager Rations', color: 'text-red-400', icon: '🥄', tooltip: 'Meager rations: 0.5x food consumption per week. Saves food but lower stamina recovery (+30) and lowers morale.' };
    }
  };

  const getWeeklyFocusInfo = () => {
    switch(weeklyFocus) {
      case 'normal':
        return { text: 'Normal', color: 'text-gray-300', icon: '🚶', tooltip: 'Normal travel: Standard pace and awareness (20-30 km/week)' };
      case 'cautious':
        return { text: 'Cautious', color: 'text-blue-400', icon: '🛡️', tooltip: 'Cautious travel: Extra careful, watching for dangers. Lower distance (15-25 km) but safer.' };
      case 'fast':
        return { text: 'Fast', color: 'text-red-400', icon: '⚡', tooltip: 'Fast travel: Pushing hard to cover ground. Higher distance (30-45 km) but more exhausting and risky.' };
      case 'forage':
        return { text: 'Forage', color: 'text-green-400', icon: '🌾', tooltip: 'Foraging: Gathering resources while traveling. Normal distance but chance to find food/herbs.' };
      case 'bond':
        return { text: 'Bond', color: 'text-pink-400', icon: '💕', tooltip: 'Family bonding: Extra time with family. Normal distance, improves relationships and morale.' };
      case 'vigilant':
        return { text: 'Vigilant', color: 'text-yellow-400', icon: '👁️', tooltip: 'Vigilant: Extra watch for threats/opportunities. Normal distance, better awareness.' };
    }
  };

  const phaseInfo = getPhaseInfo();
  const rationInfo = getRationInfo();
  const focusInfo = getWeeklyFocusInfo();

  const cycleRationLevel = () => {
    if (!onRationChange) return;
    const levels: RationLevel[] = ['filling', 'normal', 'meager'];
    const currentIndex = levels.indexOf(rationLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    onRationChange(levels[nextIndex]);
  };

  const handleFocusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onWeeklyFocusChange) return;
    onWeeklyFocusChange(e.target.value as WeeklyFocus);
  };

  const getBorderColor = () => {
    switch(phase) {
      case 'camp': return 'border-sky-600/50';
      case 'in_city': return 'border-purple-600/50';
      default: return 'border-amber-600/50';
    }
  };

  return (
    <div className={`w-full bg-gradient-to-r from-stone-900/70 via-stone-800/70 to-stone-900/70 border-2 ${getBorderColor()} p-2 flex items-center px-4 rounded-lg shadow-lg transition-all duration-500`}>
        {/* Left stats */}
        <div className="flex items-center space-x-4 flex-1">
            <StatDisplay icon="❤️" value={`${health}/${INITIAL_HEALTH}`} label="Health" currentValue={health} tooltip={STAT_TOOLTIPS.health} />
            <StatDisplay icon="⚡" value={stamina} label="Stamina" currentValue={stamina} tooltip={STAT_TOOLTIPS.stamina} />
            <StatDisplay icon="🥖" value={food} label="Food" currentValue={food} tooltip={STAT_TOOLTIPS.food} />

            {/* Ration Level Indicator */}
            <Tooltip content={rationInfo.tooltip}>
              <button
                onClick={cycleRationLevel}
                className="flex items-center space-x-1 px-2 py-1 bg-stone-800/50 border border-stone-600 rounded-lg hover:bg-stone-700/50 hover:border-stone-500 transition-all cursor-pointer"
              >
                <span className="text-sm">{rationInfo.icon}</span>
                <span className={`text-xs font-semibold ${rationInfo.color}`}>{rationInfo.text}</span>
              </button>
            </Tooltip>
        </div>

        {/* Center status */}
        <div className="flex flex-col items-center justify-center flex-1">
            <h3 className={`text-xl font-bold tracking-widest transition-colors duration-500 ${phaseInfo.color} text-shadow-glow whitespace-nowrap`}>
                {phaseInfo.text}
            </h3>
            {/* Weekly Focus Selector - only show while traveling */}
            {phase === 'traveling' && (
              <Tooltip content={focusInfo.tooltip}>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-400">Focus:</span>
                  <select
                    value={weeklyFocus}
                    onChange={handleFocusChange}
                    className="text-xs font-semibold bg-stone-800/50 border border-stone-600 rounded px-1 py-0.5 cursor-pointer hover:bg-stone-700/50 hover:border-stone-500 transition-all focus:outline-none focus:ring-1 focus:ring-amber-500"
                    style={{ color: focusInfo.color.replace('text-', '') }}
                  >
                    <option value="normal">🚶 Normal</option>
                    <option value="cautious">🛡️ Cautious</option>
                    <option value="fast">⚡ Fast</option>
                    <option value="forage">🌾 Forage</option>
                    <option value="bond">💕 Bond</option>
                    <option value="vigilant">👁️ Vigilant</option>
                  </select>
                </div>
              </Tooltip>
            )}
        </div>

        {/* Right stats */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
            <StatDisplay icon="💰" value={money} label="Money" currentValue={money} tooltip={STAT_TOOLTIPS.money} />
            <StatDisplay icon="🐂" value={oxen} label="Oxen" currentValue={oxen} tooltip={STAT_TOOLTIPS.oxen} />
        </div>
    </div>
  );
};

export default SuppliesBar;