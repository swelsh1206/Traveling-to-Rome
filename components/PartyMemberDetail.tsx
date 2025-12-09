import React from 'react';
import { PartyMember } from '../types';
import Tooltip from './Tooltip';
import { PERSONALITY_TOOLTIPS, MOOD_TOOLTIPS } from '../tooltipDescriptions';

interface PartyMemberDetailProps {
  member: PartyMember;
  onClose: () => void;
  onUseItem: () => void;
  onTalk: () => void;
  onDeepConversation: () => void;
  canHaveDeepTalk: boolean;
  gameDay: number;
}

const PartyMemberDetail: React.FC<PartyMemberDetailProps> = ({
  member,
  onClose,
  onUseItem,
  onTalk,
  onDeepConversation,
  canHaveDeepTalk,
  gameDay,
}) => {
  const getRelationshipText = (relationship: number) => {
    if (relationship >= 90) return { text: 'Devoted', color: 'text-green-400', desc: 'They would die for you' };
    if (relationship >= 75) return { text: 'Loyal', color: 'text-green-300', desc: 'They trust your judgment' };
    if (relationship >= 60) return { text: 'Trusting', color: 'text-blue-300', desc: 'They believe in you' };
    if (relationship >= 40) return { text: 'Uncertain', color: 'text-yellow-400', desc: 'They have doubts' };
    if (relationship >= 20) return { text: 'Distant', color: 'text-orange-400', desc: 'They question everything' };
    return { text: 'Resentful', color: 'text-red-400', desc: 'They may abandon you' };
  };

  const getTrustText = (trust: number) => {
    if (trust >= 80) return { text: 'Complete', color: 'text-cyan-400' };
    if (trust >= 60) return { text: 'Strong', color: 'text-blue-300' };
    if (trust >= 40) return { text: 'Wavering', color: 'text-yellow-400' };
    if (trust >= 20) return { text: 'Fragile', color: 'text-orange-400' };
    return { text: 'Broken', color: 'text-red-400' };
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'devoted': return '🥰';
      case 'content': return '😊';
      case 'worried': return '😟';
      case 'afraid': return '😨';
      case 'angry': return '😠';
      case 'hopeful': return '🙂';
      default: return '😐';
    }
  };

  const getTraitEmoji = (trait: string) => {
    switch (trait) {
      case 'brave': return '⚔️';
      case 'cautious': return '🛡️';
      case 'optimistic': return '🌟';
      case 'pessimistic': return '☁️';
      case 'faithful': return '✝️';
      case 'pragmatic': return '🔧';
      case 'protective': return '🤝';
      case 'independent': return '🦅';
      default: return '💭';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'spouse': return '💑';
      case 'child': return '👶';
      case 'companion': return '🤝';
      default: return '👤';
    }
  };

  const relStatus = getRelationshipText(member.relationship);
  const trustStatus = getTrustText(member.trust);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 border-4 border-amber-600/50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/40 p-6 border-b-2 border-amber-600/30">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="text-6xl">{getRoleIcon(member.role)}</div>
              <div>
                <h2 className="text-3xl text-amber-100 font-bold">{member.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-amber-300 capitalize text-lg">{member.role}</p>
                  <p className="text-gray-400">Age {member.age}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-3xl text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personality & Mood */}
          <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
            <h3 className="text-amber-200 font-bold mb-3 text-lg">Personality & Mood</h3>
            <div className="grid grid-cols-2 gap-4">
              <Tooltip content={PERSONALITY_TOOLTIPS[member.personalityTrait] || 'Personality trait'} position="top">
                <div className="flex items-center gap-3 cursor-help">
                  <span className="text-4xl">{getTraitEmoji(member.personalityTrait)}</span>
                  <div>
                    <div className="text-xs text-gray-400">Personality</div>
                    <div className="text-amber-200 capitalize font-semibold">{member.personalityTrait}</div>
                  </div>
                </div>
              </Tooltip>
              <Tooltip content={MOOD_TOOLTIPS[member.mood] || 'Current mood'} position="top">
                <div className="flex items-center gap-3 cursor-help">
                  <span className="text-4xl">{getMoodEmoji(member.mood)}</span>
                  <div>
                    <div className="text-xs text-gray-400">Current Mood</div>
                    <div className="text-amber-200 capitalize font-semibold">{member.mood}</div>
                  </div>
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Health & Conditions */}
          <div className="bg-stone-700/30 p-4 rounded-lg border border-red-600/20">
            <h3 className="text-red-300 font-bold mb-3 text-lg">Health Status</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Health:</span>
                  <span className={member.health < 30 ? 'text-red-400 font-bold text-lg' : member.health < 60 ? 'text-yellow-400 text-lg' : 'text-green-400 text-lg'}>
                    {member.health}/100
                  </span>
                </div>
                <div className="w-full bg-stone-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${member.health < 30 ? 'bg-red-500' : member.health < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${member.health}%` }}
                  />
                </div>
              </div>
              {member.conditions.length > 0 ? (
                <div className="bg-red-900/30 p-3 rounded border border-red-500/30">
                  <div className="text-xs text-red-300 font-semibold mb-1">Active Conditions:</div>
                  <div className="flex flex-wrap gap-2">
                    {member.conditions.map((condition) => (
                      <span key={condition} className="bg-red-800/50 text-red-200 px-2 py-1 rounded text-xs border border-red-500/30">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-green-400 text-sm italic">No conditions - Healthy</div>
              )}
            </div>
          </div>

          {/* Relationship & Trust */}
          <div className="bg-stone-700/30 p-4 rounded-lg border border-blue-600/20">
            <h3 className="text-blue-300 font-bold mb-3 text-lg">Relationship</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Bond: <span className={relStatus.color + ' font-semibold'}>{relStatus.text}</span></span>
                  <span className="text-gray-400">{member.relationship}/100</span>
                </div>
                <div className="w-full bg-stone-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${member.relationship >= 75 ? 'bg-green-500' : member.relationship >= 60 ? 'bg-blue-400' : member.relationship >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${member.relationship}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 italic mt-1">{relStatus.desc}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Trust: <span className={trustStatus.color + ' font-semibold'}>{trustStatus.text}</span></span>
                  <span className="text-gray-400">{member.trust}/100</span>
                </div>
                <div className="w-full bg-stone-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${member.trust >= 60 ? 'bg-cyan-500' : member.trust >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${member.trust}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Relationship Messages */}
            {member.relationship >= 80 && (
              <div className="mt-4 pt-3 border-t border-green-500/30">
                <p className="text-sm text-green-400 italic text-center">
                  ✨ {member.name.split(' ')[0]} is deeply devoted to you and will follow you anywhere
                </p>
              </div>
            )}
            {member.relationship < 30 && (
              <div className="mt-4 pt-3 border-t border-red-500/30">
                <p className="text-sm text-red-400 italic text-center">
                  ⚠️ {member.name.split(' ')[0]} questions your leadership and may leave if things don't improve
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
            <h3 className="text-amber-200 font-bold mb-3 text-lg">Interactions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onUseItem();
                  onClose();
                }}
                className="px-4 py-3 bg-amber-600/20 border-2 border-amber-500 text-amber-300 hover:bg-amber-600/40 transition-colors rounded-lg font-semibold"
              >
                🎒 Use Item
              </button>

              <button
                onClick={() => {
                  onTalk();
                  onClose();
                }}
                className="px-4 py-3 bg-cyan-600/20 border-2 border-cyan-500 text-cyan-300 hover:bg-cyan-600/40 transition-colors rounded-lg font-semibold"
              >
                💬 Talk (+3)
              </button>
            </div>

            {canHaveDeepTalk ? (
              <button
                onClick={() => {
                  onDeepConversation();
                  onClose();
                }}
                className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-2 border-purple-500 text-purple-300 hover:from-purple-600/50 hover:to-blue-600/50 transition-colors rounded-lg font-bold"
              >
                💬 Deep Conversation (+{member.relationship >= 60 ? 8 : 5} relationship, +3 trust)
              </button>
            ) : (
              <div className="mt-3 text-center text-gray-500 text-sm italic">
                Deep conversation available in {3 - (gameDay - (member.lastConversation || 0))} days
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyMemberDetail;
