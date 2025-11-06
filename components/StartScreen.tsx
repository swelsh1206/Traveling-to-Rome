
import React from 'react';
import ActionButton from './ActionButton';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="bg-stone-800/80 p-10 border-4 border-amber-500 shadow-lg text-center backdrop-blur-sm rounded-xl max-w-3xl mx-auto">
      <h1 className="text-6xl text-amber-300 mb-4 tracking-wider font-bold">Le Chemin de Rome</h1>
      <p className="text-2xl text-amber-200 mb-8 italic">The Road to Rome</p>

      <div className="max-w-2xl mx-auto mb-10 space-y-4">
        <p className="text-lg text-gray-300 leading-relaxed">
          Anno Domini 1640. The year of our Lord finds you in France, with a sacred duty ahead.
        </p>
        <p className="text-lg text-gray-300 leading-relaxed">
          You must journey to the eternal city of Rome, traversing over 1,400 kilometers of perilous roads,
          treacherous mountain passes, and lawless frontiers.
        </p>
        <p className="text-lg text-amber-200 font-semibold">
          The Fates will determine your station, your means, and your name.
        </p>
        <p className="text-base text-gray-400 italic">
          Will fortune smile upon you? Or will you face this pilgrimage with only faith as your companion?
        </p>
      </div>

      <ActionButton onClick={onStart}>
        Consult the Fates
      </ActionButton>

      <p className="text-xs text-gray-500 mt-6">
        Manage your resources • Endure hardships • Survive the journey
      </p>
    </div>
  );
};

export default StartScreen;