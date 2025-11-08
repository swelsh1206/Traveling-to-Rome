import React from 'react';
import { ROUTE_CHECKPOINTS, TOTAL_DISTANCE_TO_ROME } from '../constants';

interface MapViewProps {
  distanceTraveled: number;
  phase: string;
}

const MapView: React.FC<MapViewProps> = ({ distanceTraveled, phase }) => {
  const progress = (distanceTraveled / TOTAL_DISTANCE_TO_ROME) * 100;
  const remainingDistance = TOTAL_DISTANCE_TO_ROME - distanceTraveled;

  // Get phase styling
  const getPhaseColors = () => {
    switch(phase) {
      case 'in_city':
        return {
          border: 'border-purple-500/50',
          title: 'text-purple-300',
          glow: 'shadow-purple-500/20'
        };
      case 'camp':
        return {
          border: 'border-sky-500/50',
          title: 'text-sky-300',
          glow: 'shadow-sky-500/20'
        };
      default:
        return {
          border: 'border-amber-500/50',
          title: 'text-amber-300',
          glow: 'shadow-amber-500/20'
        };
    }
  };

  const colors = getPhaseColors();

  // All locations including start and end
  const allLocations = [
    { name: '🇫🇷 France', distance: 0 },
    ...ROUTE_CHECKPOINTS,
    { name: '🇮🇹 Rome ✝', distance: TOTAL_DISTANCE_TO_ROME }
  ];

  return (
    <div className={`bg-gradient-to-br from-stone-900/80 to-stone-800/80 border-2 ${colors.border} rounded-xl p-4 shadow-xl ${colors.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          <h3 className={`${colors.title} font-bold text-lg tracking-wide`}>Route to Rome</h3>
        </div>
        <div className="text-right">
          <div className={`${colors.title} font-bold text-lg`}>{remainingDistance} km to Rome</div>
          <div className="text-xs text-gray-400">{distanceTraveled} km traveled ({Math.round(progress)}%)</div>
        </div>
      </div>

      {/* Map visualization */}
      <div className="relative h-40 bg-gradient-to-b from-stone-900/90 to-stone-800/90 rounded-xl border-2 border-amber-700/40 p-4 overflow-visible shadow-inner">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-2 left-4 text-6xl">🏰</div>
          <div className="absolute top-4 right-8 text-5xl">⛰️</div>
          <div className="absolute bottom-2 left-1/3 text-4xl">🌲</div>
        </div>

        {/* Route line - positioned absolutely in middle */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2">
          <div className="relative h-2 bg-stone-700/60 rounded-full shadow-inner">
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-amber-500 to-yellow-400 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* All checkpoints positioned along the route */}
          {allLocations.map((location, index) => {
            const positionPercent = (location.distance / TOTAL_DISTANCE_TO_ROME) * 100;
            const isPassed = distanceTraveled >= location.distance;
            const isStart = location.distance === 0;
            const isEnd = location.distance === TOTAL_DISTANCE_TO_ROME;
            const isCurrent = !isStart && !isEnd &&
                             distanceTraveled >= location.distance &&
                             (index === allLocations.length - 1 || distanceTraveled < allLocations[index + 1].distance);

            return (
              <div
                key={location.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${positionPercent}%`, top: '50%' }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Checkpoint marker */}
                  <div className={`rounded-full border-2 shadow-lg transition-all ${
                    isStart
                      ? 'w-4 h-4 bg-green-700 border-green-600 shadow-green-800/50'
                      : isEnd
                      ? `w-5 h-5 ${distanceTraveled >= TOTAL_DISTANCE_TO_ROME ? 'bg-yellow-400 border-yellow-300 animate-pulse shadow-yellow-400/70' : 'bg-stone-700 border-stone-600 shadow-stone-900/50'}`
                      : isCurrent && phase === 'in_city'
                      ? 'w-4 h-4 bg-purple-400 border-purple-300 animate-pulse shadow-lg shadow-purple-400/70 scale-125'
                      : isPassed
                      ? 'w-3 h-3 bg-green-600 border-green-500 shadow-green-800/50'
                      : 'w-3 h-3 bg-stone-700 border-stone-600 shadow-stone-900/50'
                  }`} />

                  {/* Location label */}
                  <span className={`absolute top-6 text-xs whitespace-nowrap transition-colors ${
                    isStart
                      ? 'text-green-400 font-bold'
                      : isEnd
                      ? distanceTraveled >= TOTAL_DISTANCE_TO_ROME ? 'text-yellow-300 font-bold' : 'text-gray-500'
                      : isCurrent
                      ? 'text-amber-200 font-bold'
                      : isPassed
                      ? 'text-green-300 font-medium'
                      : 'text-gray-500 text-[10px]'
                  }`}>
                    {location.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Player marker - shows current position between checkpoints */}
          {distanceTraveled > 0 && distanceTraveled < TOTAL_DISTANCE_TO_ROME && phase !== 'in_city' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ left: `${progress}%`, top: '50%' }}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-5 h-5 bg-cyan-400 border-2 border-cyan-300 rounded-full animate-pulse shadow-lg shadow-cyan-400/70" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-cyan-300 font-bold whitespace-nowrap bg-stone-900/90 px-2 py-1 rounded shadow-lg">
                  You
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-600 border border-green-500 shadow-sm" />
          <span className="text-green-400">Passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-cyan-300 shadow-sm animate-pulse" />
          <span className="text-cyan-300">Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-700 border border-stone-600 shadow-sm" />
          <span className="text-gray-400">Ahead</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
