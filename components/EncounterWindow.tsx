import React, { useState } from 'react';
import { Encounter } from '../types';

interface EncounterWindowProps {
  encounter: Encounter;
  onAction: (action: string) => void;
  onConversation?: (message: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const EncounterWindow: React.FC<EncounterWindowProps> = ({
  encounter,
  onAction,
  onConversation,
  onClose,
  isProcessing = false
}) => {
  const [conversationMode, setConversationMode] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleAction = (action: string) => {
    if (action === 'talk') {
      setConversationMode(true);
    } else {
      onAction(action);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && onConversation) {
      onConversation(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

        {/* Conversation History */}
        {encounter.npc.dialogue.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto bg-stone-900/40 border border-stone-600 rounded-lg p-3">
            <h3 className="text-sm font-bold text-cyan-300 mb-2">Conversation</h3>
            <div className="space-y-2">
              {encounter.npc.dialogue.map((line, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    index % 2 === 0
                      ? 'bg-cyan-900/30 text-cyan-100'
                      : 'bg-stone-700/30 text-gray-300'
                  }`}
                >
                  <p className="text-sm">
                    <span className="font-bold">
                      {index % 2 === 0 ? encounter.npc.name : 'You'}:
                    </span>{' '}
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Mode */}
        {conversationMode ? (
          <div className="mb-4">
            <div className="bg-stone-900/60 border-2 border-cyan-600/50 rounded-lg p-3">
              <label className="block text-cyan-300 font-bold mb-2 text-sm">
                What do you say to {encounter.npc.name}?
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full bg-stone-800 border border-cyan-600/30 rounded p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
                rows={3}
                disabled={isProcessing}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isProcessing}
                  className="flex-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  {isProcessing ? 'Waiting...' : 'Send'}
                </button>
                <button
                  onClick={() => setConversationMode(false)}
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
            <div className="grid grid-cols-2 gap-2">
              {encounter.options.map((option, index) => {
                const getActionColor = (action: string) => {
                  switch (action) {
                    case 'talk': return 'bg-blue-700 hover:bg-blue-600 border-blue-500';
                    case 'help': return 'bg-green-700 hover:bg-green-600 border-green-500';
                    case 'trade': return 'bg-yellow-700 hover:bg-yellow-600 border-yellow-500';
                    case 'fight': return 'bg-red-700 hover:bg-red-600 border-red-500';
                    case 'flee': return 'bg-purple-700 hover:bg-purple-600 border-purple-500';
                    case 'ignore': return 'bg-gray-700 hover:bg-gray-600 border-gray-500';
                    default: return 'bg-cyan-700 hover:bg-cyan-600 border-cyan-500';
                  }
                };

                const getActionIcon = (action: string) => {
                  switch (action) {
                    case 'talk': return '💬';
                    case 'help': return '🤝';
                    case 'trade': return '💰';
                    case 'fight': return '⚔️';
                    case 'flee': return '🏃';
                    case 'ignore': return '🚶';
                    default: return '•';
                  }
                };

                return (
                  <button
                    key={index}
                    onClick={() => handleAction(option.action)}
                    disabled={isProcessing}
                    className={`${getActionColor(option.action)} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded border-2 transition-all hover:scale-105 active:scale-95`}
                  >
                    <span className="mr-2">{getActionIcon(option.action)}</span>
                    {option.label}
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
