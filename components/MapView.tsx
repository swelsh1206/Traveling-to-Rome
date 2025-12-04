import React from 'react';
import MiniMap from './MiniMap';
import { Player } from '../types';

interface MapViewProps {
  distanceTraveled: number;
  phase: string;
  player: Player;
}

const MapView: React.FC<MapViewProps> = ({ distanceTraveled, phase, player }) => {
  const totalDistance = player.distanceToRome;
  const progress = (distanceTraveled / totalDistance) * 100;
  const remainingDistance = totalDistance - distanceTraveled;

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

  return (
    <div className={`bg-gradient-to-br from-stone-900/80 to-stone-800/80 border-2 ${colors.border} rounded-xl p-4 shadow-xl ${colors.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          <h3 className={`${colors.title} font-bold text-lg tracking-wide`}>{player.startingCity} → Rome</h3>
        </div>
        <div className="text-right">
          <div className={`${colors.title} font-bold text-lg`}>{remainingDistance} km to Rome</div>
          <div className="text-xs text-gray-400">{distanceTraveled} km traveled ({Math.round(progress)}%)</div>
        </div>
      </div>

      {/* Journey Progress Map */}
      <div className="relative h-40">
        <MiniMap
          distanceTraveled={distanceTraveled}
          totalDistance={totalDistance}
          routeCheckpoints={player.routeCheckpoints}
        />
      </div>
    </div>
  );
};

export default MapView;
