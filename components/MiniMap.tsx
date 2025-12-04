import React from 'react';

interface MiniMapProps {
  distanceTraveled: number;
  totalDistance: number;
  routeCheckpoints: Array<{ name: string; distance: number }>;
}

const MiniMap: React.FC<MiniMapProps> = ({ distanceTraveled, totalDistance, routeCheckpoints }) => {
  const progress = Math.min((distanceTraveled / totalDistance) * 100, 100);

  // All locations including start and end
  const allLocations = [
    { name: 'Start', distance: 0, icon: '🏰' },
    ...routeCheckpoints.map(cp => ({ ...cp, icon: '⛪' })),
    { name: 'Rome', distance: totalDistance, icon: '✝️' }
  ];

  // Landmark silhouettes at various points
  const landmarks = [
    { position: 15, icon: '🏔️', label: 'Alps' },
    { position: 45, icon: '🌲', label: 'Forests' },
    { position: 75, icon: '⛰️', label: 'Hills' },
  ];

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-stone-900/60 to-stone-800/60 rounded-lg border border-amber-700/40 p-4 shadow-lg">
      {/* Title */}
      <div className="text-center mb-3">
        <h3 className="text-amber-300 font-bold text-sm">Journey to Rome</h3>
        <p className="text-xs text-gray-400">{distanceTraveled} / {totalDistance} km ({Math.round(progress)}%)</p>
      </div>

      {/* Main progress line container */}
      <div className="relative h-24">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-0 left-10 text-4xl">🏰</div>
          <div className="absolute top-2 right-20 text-3xl">⛰️</div>
          <div className="absolute bottom-2 left-1/3 text-2xl">🌲</div>
          <div className="absolute bottom-0 right-1/4 text-3xl">⛪</div>
        </div>

        {/* Landmark silhouettes */}
        {landmarks.map((landmark, idx) => (
          <div
            key={idx}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${landmark.position}%` }}
          >
            <div className="flex flex-col items-center opacity-20">
              <span className="text-3xl">{landmark.icon}</span>
              <span className="text-[8px] text-gray-500 mt-1">{landmark.label}</span>
            </div>
          </div>
        ))}

        {/* Main progress line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
          {/* Base line */}
          <div className="relative h-3 bg-stone-700/60 rounded-full shadow-inner">
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-amber-500 to-yellow-400 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Checkpoint markers */}
          {allLocations.map((location, index) => {
            const positionPercent = (location.distance / totalDistance) * 100;
            const isPassed = distanceTraveled >= location.distance;
            const isStart = location.distance === 0;
            const isEnd = location.distance === totalDistance;

            return (
              <div
                key={location.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${positionPercent}%`, top: '50%' }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Icon marker */}
                  <div className={`text-xl transition-all ${
                    isStart
                      ? 'text-green-400 drop-shadow-lg'
                      : isEnd
                      ? isPassed ? 'text-yellow-300 drop-shadow-lg animate-pulse' : 'text-gray-600'
                      : isPassed
                      ? 'text-green-300 text-base'
                      : 'text-gray-600 text-sm'
                  }`}>
                    {location.icon}
                  </div>

                  {/* Location label */}
                  <span className={`absolute top-7 text-[10px] whitespace-nowrap font-medium transition-colors ${
                    isStart
                      ? 'text-green-400'
                      : isEnd
                      ? isPassed ? 'text-yellow-300 font-bold' : 'text-gray-500'
                      : isPassed
                      ? 'text-green-300'
                      : 'text-gray-500'
                  }`}>
                    {location.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Current position marker */}
          {progress > 0 && progress < 100 && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ left: `${progress}%`, top: '50%' }}
            >
              <div className="relative flex flex-col items-center">
                {/* Pulsing marker */}
                <div className="w-6 h-6 bg-cyan-400 border-2 border-cyan-300 rounded-full animate-pulse shadow-lg shadow-cyan-400/70 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                {/* Label above */}
                <div className="absolute -top-7 text-[10px] text-cyan-300 font-bold whitespace-nowrap bg-stone-900/90 px-2 py-0.5 rounded shadow-lg">
                  You
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniMap;
