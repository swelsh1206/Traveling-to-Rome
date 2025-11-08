
import React from 'react';
import ActionButton from './ActionButton';

interface StartScreenProps {
  onRandomStart: () => void;
  onCustomStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onRandomStart, onCustomStart }) => {
  return (
    <div className="bg-stone-800/80 p-10 border-4 border-amber-500 shadow-lg text-center backdrop-blur-sm rounded-xl max-w-4xl mx-auto">
      <h1 className="text-6xl text-amber-300 mb-4 tracking-wider font-bold">Le Chemin de Rome</h1>
      <p className="text-2xl text-amber-200 mb-8 italic">The Road to Rome</p>

      <div className="max-w-2xl mx-auto mb-10 space-y-4">
        <p className="text-lg text-gray-300 leading-relaxed">
          In the age of Early Modern Europe, you find yourself in France with a sacred duty ahead.
        </p>
        <p className="text-lg text-gray-300 leading-relaxed">
          You must journey to the eternal city of Rome, traversing over 1,400 kilometers of perilous roads,
          treacherous mountain passes, and lawless frontiers through war-torn lands.
        </p>
        <p className="text-base text-gray-400 italic">
          Will fortune smile upon you? Or will you face this pilgrimage with only faith as your companion?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
        {/* Random Start Mode */}
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 border-purple-500/50 rounded-xl p-6 hover:border-purple-400 transition-all hover:scale-105 cursor-pointer group" onClick={onRandomStart}>
          <div className="text-4xl mb-3">🎲</div>
          <h3 className="text-2xl text-purple-300 font-bold mb-3">Random Start</h3>
          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            Let the Fates decide your destiny. Your name, profession, gender, and starting resources will be randomly assigned.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <span className="bg-purple-600/30 px-2 py-1 rounded text-purple-200">Quick Start</span>
            <span className="bg-purple-600/30 px-2 py-1 rounded text-purple-200">Unpredictable</span>
            <span className="bg-purple-600/30 px-2 py-1 rounded text-purple-200">Fate-Driven</span>
          </div>
          <button className="mt-4 w-full px-6 py-3 bg-purple-600 border-2 border-purple-400 text-white hover:bg-purple-500 transition-colors rounded-lg font-bold text-lg group-hover:scale-105">
            Consult the Fates
          </button>
        </div>

        {/* Custom Mode */}
        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-2 border-amber-500/50 rounded-xl p-6 hover:border-amber-400 transition-all hover:scale-105 cursor-pointer group" onClick={onCustomStart}>
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="text-2xl text-amber-300 font-bold mb-3">Custom Mode</h3>
          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            Forge your own path. Choose your name, gender, profession, age, and customize your character's background.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <span className="bg-amber-600/30 px-2 py-1 rounded text-amber-200">Personalized</span>
            <span className="bg-amber-600/30 px-2 py-1 rounded text-amber-200">Strategic</span>
            <span className="bg-amber-600/30 px-2 py-1 rounded text-amber-200">Roleplay</span>
          </div>
          <button className="mt-4 w-full px-6 py-3 bg-amber-600 border-2 border-amber-400 text-white hover:bg-amber-500 transition-colors rounded-lg font-bold text-lg group-hover:scale-105">
            Create Character
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Manage your resources • Endure hardships • Survive the journey
      </p>
    </div>
  );
};

export default StartScreen;