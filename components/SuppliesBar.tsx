import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_HEALTH } from '../constants';
import { GamePhase } from '../types';

interface SuppliesBarProps {
  phase: GamePhase;
  health: number;
  food: number;
  money: number;
  oxen: number;
  location: string | null;
}

const StatDisplay: React.FC<{ icon: string; value: string | number; label: string; currentValue: number }> = ({ icon, value, label, currentValue }) => {
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
        <div className="flex items-center space-x-2 relative" title={label}>
            <span className="text-2xl text-amber-200">{icon}</span>
            <span className="text-lg font-bold text-white tracking-wider">{value}</span>
            {indicator === 'up' && <span key={Date.now()} className="absolute -top-1 -right-2 text-lg text-green-400 animate-stat-up">▲</span>}
            {indicator === 'down' && <span key={Date.now()} className="absolute top-4 -right-2 text-lg text-red-500 animate-stat-down">▼</span>}
        </div>
    );
};


const SuppliesBar: React.FC<SuppliesBarProps> = ({ phase, health, food, money, oxen, location }) => {
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

  const phaseInfo = getPhaseInfo();

  return (
    <div className="w-full bg-stone-900/70 border-2 border-amber-600/50 p-2 flex items-center justify-between px-4 rounded-lg">
        <div className="flex items-center space-x-6">
            <StatDisplay icon="❤️" value={`${health}/${INITIAL_HEALTH}`} label="Health" currentValue={health} />
            <StatDisplay icon="🥖" value={food} label="Food" currentValue={food} />
        </div>
        
        <div>
            <h3 className={`text-xl font-bold tracking-widest transition-colors duration-500 ${phaseInfo.color}`}>
                {phaseInfo.text}
            </h3>
        </div>

        <div className="flex items-center space-x-6">
            <StatDisplay icon="💰" value={money} label="Money" currentValue={money} />
            <StatDisplay icon="🐂" value={oxen} label="Oxen" currentValue={oxen} />
        </div>
    </div>
  );
};

export default SuppliesBar;