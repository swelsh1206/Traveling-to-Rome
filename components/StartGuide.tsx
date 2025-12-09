import React from 'react';
import ActionButton from './ActionButton';

interface StartGuideProps {
  onClose: () => void;
}

const StartGuide: React.FC<StartGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-stone-800 to-stone-900 border-4 border-amber-500 rounded-xl shadow-2xl max-w-3xl max-h-[85vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-300 tracking-wider mb-2">
            ⚜️ Journey to Rome ⚜️
          </h1>
          <p className="text-lg text-amber-100 italic">A Guide for the Road Ahead</p>
        </div>

        {/* Main Content */}
        <div className="space-y-4 text-gray-200">
          {/* Goal Section */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <h2 className="text-xl font-bold text-amber-400 mb-2 flex items-center gap-2">
              🎯 Your Goal
            </h2>
            <p className="text-sm leading-relaxed">
              Travel from your starting city to <span className="text-amber-300 font-bold">Rome</span>, navigating the challenges of medieval Europe.
              Keep your party alive and healthy while managing limited resources across the long journey ahead.
            </p>
          </div>

          {/* Resources Section */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <h2 className="text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
              💰 Managing Resources
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-red-400 font-bold">❤️ Health:</span>
                <p className="text-xs text-gray-300 ml-5">Don't let it reach zero! Resting, eating, and other actions help refill it.</p>
              </div>
              <div>
                <span className="text-cyan-400 font-bold">⚡ Stamina:</span>
                <p className="text-xs text-gray-300 ml-5">Needed for hunting and non-travel actions. Recovers when resting.</p>
              </div>
              <div>
                <span className="text-green-400 font-bold">🥖 Food:</span>
                <p className="text-xs text-gray-300 ml-5">Consumed by your party every time you travel. Hunt, forage, or buy at markets.</p>
              </div>
              <div>
                <span className="text-yellow-400 font-bold">💰 Ducats:</span>
                <p className="text-xs text-gray-300 ml-5">Depending on your start, amount will differ. Buy supplies, medicine, and wagon repairs at cities.</p>
              </div>
            </div>
          </div>

          {/* Travel Tips Section */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <h2 className="text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
              🗺️ Travel Tips
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">•</span>
                <p><span className="font-bold text-amber-200">Watch the weather:</span> Storms, snow, and other types of weather may slow travel.</p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">•</span>
                <p><span className="font-bold text-amber-200">Choose your pace:</span> Fast travel covers more ground but increases risk and exhaustion.</p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">•</span>
                <p><span className="font-bold text-amber-200">Make camp:</span> Rest to recover health and stamina. Hunt for food or repair your wagon.</p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">•</span>
                <p><span className="font-bold text-amber-200">Visit cities:</span> Restock supplies, stay at inns, and trade goods.</p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">•</span>
                <p><span className="font-bold text-amber-200">Manage rations:</span> Filling rations boost morale but consume more food. Meager rations save food but lower stamina recovery.</p>
              </li>
            </ul>
          </div>

          {/* Party Management Section */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <h2 className="text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
              👨‍👩‍👧 Party Management
            </h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="font-bold text-pink-400">A group travels with you, likely your family.</span> Keep them healthy and happy by:
              </p>
              <ul className="ml-4 space-y-1 text-xs text-gray-300">
                <li>• Sharing food and treating their injuries</li>
                <li>• Talking with them regularly to build trust and relationship</li>
                <li>• Making camp when they're tired or sick</li>
                <li>• Avoiding unnecessary risks that could harm them</li>
              </ul>
              <p className="text-xs text-yellow-400 italic mt-2">
                ⚠️ If relationships drop too low, family members may leave or cause problems.
              </p>
            </div>
          </div>

          {/* Combat & Hunting Section */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <h2 className="text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
              🏹 Hunting & Combat
            </h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="font-bold text-orange-400">Hunt animals for food</span> when camped, but beware:
              </p>
              <ul className="ml-4 space-y-1 text-xs text-gray-300">
                <li>• Larger animals yield more food but are harder to catch</li>
                <li>• Dangerous animals like boars and wolves can injure you</li>
                <li>• Hunting requires ammunition and stamina</li>
                <li>• Your combat skill affects hunting success</li>
              </ul>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-green-600/30">
            <h2 className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2">
              ✨ Quick Tips
            </h2>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <p>💡 <span className="font-bold">Hover over icons</span> for tooltips and information</p>
              <p>💡 <span className="font-bold">Use items wisely</span> - bandages and herbs can save lives</p>
              <p>💡 <span className="font-bold">Balance risk and reward</span> - sometimes the safe choice is the right choice</p>
              <p>💡 <span className="font-bold">Your profession matters</span> - use your unique skills and bonuses</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <ActionButton onClick={onClose}>
            Begin Your Journey →
          </ActionButton>
          <p className="text-xs text-gray-500 mt-3 italic">
            May fortune favor you on the road to Rome
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartGuide;
