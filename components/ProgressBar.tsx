import React from 'react';
import { TOTAL_DISTANCE_TO_ROME } from '../constants';
import { GamePhase } from '../types';

interface Checkpoint {
    name: string;
    distance: number;
}

interface ProgressBarProps {
  progress: number; // A value between 0 and 100
  checkpoints: Checkpoint[];
  totalDistance: number;
  phase?: GamePhase;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, checkpoints, totalDistance, phase = 'traveling' }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const allCheckpoints = [...checkpoints, { name: 'Rome', distance: totalDistance }];

  const getBorderColor = () => {
    switch(phase) {
      case 'camp': return 'border-sky-600/50';
      case 'in_city': return 'border-purple-600/50';
      default: return 'border-amber-600/50';
    }
  };

  return (
    <div className={`w-full bg-stone-900/70 border-2 ${getBorderColor()} p-1 rounded-lg transition-colors duration-500`}>
      <div className="w-full bg-stone-700 h-6 relative rounded-md overflow-visible mb-6">
        <div
          className="bg-green-500 h-6 transition-all duration-500 rounded-md"
          style={{ width: `${clampedProgress}%` }}
        >
        </div>
        {/* Checkpoint Markers */}
        {allCheckpoints.map(checkpoint => {
            const percent = (checkpoint.distance / totalDistance) * 100;
            return (
                <div key={checkpoint.name} className="absolute top-0 h-6 flex flex-col items-center pointer-events-none" style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-0.5 h-full bg-gray-200"></div>
                     <span className="absolute top-7 text-xs text-gray-200 whitespace-nowrap">{checkpoint.name}</span>
                </div>
            )
        })}
        {/* Player Position Marker */}
        <div
            className="absolute top-1/2 -translate-y-1/2 text-2xl transition-all duration-500 pointer-events-none"
            style={{ left: `calc(${clampedProgress}% - 12px)`}}
            title={`${clampedProgress.toFixed(0)}% Complete`}
            >
            <span>&#x2638;</span> {/* Unicode wheel symbol */}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;