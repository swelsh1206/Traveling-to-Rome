import React, { useState } from 'react';
import { Encounter, GameState } from '../types';

interface EncounterWindowProps {
  encounter: Encounter;
  gameState: GameState;
  onAction: (optionIndex: number, customInput?: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const EncounterWindow: React.FC<EncounterWindowProps> = ({
  encounter,
  gameState,
  onAction,
  onClose,
  isProcessing = false
}) => {
  const [customInputMode, setCustomInputMode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'friendly': return 'text-green-400';
      case 'neutral': return 'text-yellow-400';
      case 'hostile': return 'text-red-400';
      case 'desperate': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'friendly': return '😊';
      case 'neutral': return '😐';
      case 'hostile': return '😠';
      case 'desperate': return '😰';
      default: return '🧑';
    }
  };

  const handleOptionClick = (index: number) => {
    const option = encounter.options[index];

    // If this is the custom option, show input field
    if (option.type === 'custom') {
      setCustomInputMode(true);
    } else {
      onAction(index);
    }
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      const customOptionIndex = encounter.options.findIndex(opt => opt.type === 'custom');
      onAction(customOptionIndex, customInput);
      setCustomInput('');
      setCustomInputMode(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-stone-800 to-stone-900 border-4 border-cyan-500 shadow-2xl w-full max-w-3xl p-6 relative animate-bounce-in rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl text-cyan-300 mb-2 tracking-wider text-shadow-glow">
                Encounter on the Road
              </h2>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getMoodIcon(encounter.npc.mood)}</span>
                <div>
                  <p className="text-xl text-white font-bold">{encounter.npc.name}</p>
                  <p className="text-sm text-gray-400">
                    {encounter.npc.type.charAt(0).toUpperCase() + encounter.npc.type.slice(1)} •{' '}
                    <span className={getMoodColor(encounter.npc.mood)}>
                      {encounter.npc.mood.charAt(0).toUpperCase() + encounter.npc.mood.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-3xl text-cyan-400 hover:text-white hover:scale-125 transition-all leading-none"
              aria-label="Close encounter"
              disabled={isProcessing}
            >
              &times;
            </button>
          </div>

          {/* NPC Description */}
          <div className="bg-stone-900/60 border border-cyan-600/30 rounded-lg p-3 mb-3">
            <p className="text-gray-300 text-sm italic">{encounter.npc.description}</p>
          </div>
        </div>

        {/* Situation */}
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-l-4 border-cyan-500 p-4 mb-4 rounded">
          <p className="text-white">{encounter.situation}</p>
        </div>

        {/* Custom Input Mode */}
        {customInputMode ? (
          <div className="mb-4">
            <div className="bg-stone-900/60 border-2 border-purple-600/50 rounded-lg p-3">
              <label className="block text-purple-300 font-bold mb-2 text-sm">
                What do you say or do?
              </label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your action or words..."
                className="w-full bg-stone-800 border border-purple-600/30 rounded p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                disabled={isProcessing}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customInput.trim() || isProcessing}
                  className="flex-1 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Submit'}
                </button>
                <button
                  onClick={() => setCustomInputMode(false)}
                  disabled={isProcessing}
                  className="bg-stone-700 hover:bg-stone-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Action Options */
          <div className="space-y-2">
            <h3 className="text-cyan-300 font-bold mb-2">What do you do?</h3>
            <div className="grid grid-cols-2 gap-3">
              {encounter.options.map((option, index) => {
                const getOptionColor = (type: string) => {
                  switch (type) {
                    case 'fight': return 'bg-red-700 hover:bg-red-600 border-red-500';
                    case 'money': return 'bg-yellow-700 hover:bg-yellow-600 border-yellow-500';
                    case 'skill': return 'bg-blue-700 hover:bg-blue-600 border-blue-500';
                    case 'custom': return 'bg-purple-700 hover:bg-purple-600 border-purple-500';
                    default: return 'bg-cyan-700 hover:bg-cyan-600 border-cyan-500';
                  }
                };

                const getOptionIcon = (type: string) => {
                  switch (type) {
                    case 'fight': return '⚔️';
                    case 'money': return '💰';
                    case 'skill': return '🎯';
                    case 'custom': return '✍️';
                    default: return '•';
                  }
                };

                // Check if player can afford money options
                const canAfford = option.type !== 'money' || !option.moneyCost ||
                                 option.moneyCost > 0 || gameState.money >= Math.abs(option.moneyCost);

                // Get player skill value for skill options
                const playerSkill = option.type === 'skill' && option.skill ?
                                   gameState.skills[option.skill] : 0;

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    disabled={isProcessing || !canAfford}
                    className={`${getOptionColor(option.type)} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-3 rounded border-2 transition-all hover:scale-105 active:scale-95 text-left`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl flex-shrink-0">{getOptionIcon(option.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{option.label}</div>
                        <div className="text-xs text-gray-200 mt-1">{option.description}</div>

                        {/* Show skill info */}
                        {option.type === 'skill' && option.skill && option.skillThreshold && (
                          <div className="text-xs mt-1 bg-black/30 rounded px-2 py-1">
                            <span className="capitalize">{option.skill}</span>: {playerSkill}/{option.skillThreshold}
                            {playerSkill >= option.skillThreshold ?
                              <span className="text-green-300 ml-1">✓</span> :
                              <span className="text-yellow-300 ml-1">⚠</span>
                            }
                          </div>
                        )}

                        {/* Show money info */}
                        {option.type === 'money' && option.moneyCost && (
                          <div className="text-xs mt-1 bg-black/30 rounded px-2 py-1">
                            {option.moneyCost < 0 ?
                              <span className="text-red-300">Cost: {Math.abs(option.moneyCost)} coins</span> :
                              <span className="text-green-300">Gain: +{option.moneyCost} coins</span>
                            }
                            {!canAfford && <span className="text-red-400 ml-1">(Can't afford!)</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-pulse text-cyan-400">
              Processing...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncounterWindow;
