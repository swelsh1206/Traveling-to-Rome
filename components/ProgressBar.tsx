import React from 'react';
import { TOTAL_DISTANCE_TO_ROME } from '../constants';

interface Checkpoint {
    name: string;
    distance: number;
}

interface ProgressBarProps {
  progress: number; // A value between 0 and 100
  checkpoints: Checkpoint[];
  totalDistance: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, checkpoints, totalDistance }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const allCheckpoints = [...checkpoints, { name: 'Rome', distance: totalDistance }];

  return (
    <div className="w-full bg-stone-900/70 border-2 border-amber-600/50 p-1 flex items-center rounded-lg">
      <div className="w-full bg-stone-700 h-6 relative rounded-md overflow-hidden">
        <div 
          className="bg-amber-400 h-6 transition-all duration-500"
          style={{ width: `${clampedProgress}%` }}
        >
        </div>
        {/* Checkpoint Markers */}
        {allCheckpoints.map(checkpoint => {
            const percent = (checkpoint.distance / totalDistance) * 100;
            return (
                <div key={checkpoint.name} className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${percent}%`}}>
                    <div className="w-0.5 h-2 bg-amber-100"></div>
                    <div className="w-0.5 flex-grow bg-amber-100/50"></div>
                     <span className="absolute -bottom-5 text-xs text-amber-200 whitespace-nowrap">{checkpoint.name}</span>
                </div>
            )
        })}
        {/* Player Position Marker */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 text-2xl transition-all duration-500" 
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