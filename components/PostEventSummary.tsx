import React from 'react';

interface EventEffect {
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface PostEventSummaryProps {
  title: string;
  description: string;
  effects: EventEffect[];
  onContinue: () => void;
}

const PostEventSummary: React.FC<PostEventSummaryProps> = ({
  title,
  description,
  effects,
  onContinue,
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 border-4 border-amber-600/70 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-bounce-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/50 p-6 border-b-2 border-amber-600/50">
          <div className="flex items-center gap-4 justify-center">
            <span className="text-5xl">📜</span>
            <h2 className="text-3xl text-amber-100 font-bold text-center">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
            <p className="text-gray-200 text-lg leading-relaxed">{description}</p>
          </div>

          {/* Effects */}
          {effects.length > 0 && (
            <div className="bg-stone-700/30 p-5 rounded-lg border border-amber-600/30">
              <h3 className="text-amber-200 font-bold text-xl mb-4 flex items-center gap-2">
                <span>⚡</span> Effects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {effects.map((effect, index) => (
                  <div
                    key={index}
                    className={`bg-stone-800/50 p-4 rounded-lg border-2 ${
                      effect.value > 0
                        ? 'border-green-500/30 bg-green-900/10'
                        : effect.value < 0
                        ? 'border-red-500/30 bg-red-900/10'
                        : 'border-gray-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{effect.icon}</span>
                        <span className="text-gray-300 font-semibold text-base">{effect.label}</span>
                      </div>
                      <span
                        className={`text-2xl font-bold ${effect.color}`}
                      >
                        {effect.value > 0 ? '+' : ''}{effect.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Message */}
          <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-600/40 text-center">
            <p className="text-amber-200 text-base italic">
              {effects.some(e => e.value > 0) && effects.some(e => e.value < 0)
                ? 'You have gained some things but lost others...'
                : effects.every(e => e.value > 0)
                ? 'Fortune smiles upon you!'
                : effects.every(e => e.value < 0)
                ? 'The journey has taken its toll...'
                : 'The road continues...'}
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 border-3 border-amber-400 text-stone-900 hover:from-amber-500 hover:to-amber-600 hover:scale-105 transition-all rounded-lg font-bold text-xl shadow-2xl hover-glow"
          >
            Continue Journey →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostEventSummary;
