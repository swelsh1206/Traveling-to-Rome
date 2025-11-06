import React, { useState, useEffect } from 'react';
import { Profession, TransportationType } from '../types';
import { PROFESSION_STATS, FRENCH_MALE_NAMES, FRENCH_FEMALE_NAMES, FRENCH_LAST_NAMES, NOBLE_TITLES, STARTING_CITIES } from '../constants';
import ActionButton from './ActionButton';
import LoadingSpinner from './LoadingSpinner';

interface CharacterCreationScreenProps {
  onCreate: (name: string, profession: Profession) => void;
  isLoading: boolean;
}

interface GeneratedCharacter {
  name: string;
  profession: Profession;
  startingCity: string;
  transportation: TransportationType;
  gender: 'male' | 'female';
}

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateProfession = (): Profession => {
  const roll = Math.random() * 100;

  // Royal is extremely rare - 0.5% chance
  if (roll < 0.5) return Profession.Royal;

  // Weight the professions
  const professions = [
    Profession.Merchant,
    Profession.Priest,
    Profession.Soldier,
    Profession.Blacksmith,
    Profession.Scholar,
    Profession.Apothecary,
  ];

  return getRandomItem(professions);
};

const generateTransportation = (profession: Profession): TransportationType => {
  if (profession === Profession.Royal) return 'Royal Procession';

  const money = PROFESSION_STATS[profession].money;

  if (money >= 500) return 'Carriage';
  if (money >= 350) return 'Wagon';
  if (money >= 275) return 'Horse';
  return 'On Foot';
};

const generateName = (profession: Profession, gender: 'male' | 'female'): string => {
  const firstName = gender === 'male'
    ? getRandomItem(FRENCH_MALE_NAMES)
    : getRandomItem(FRENCH_FEMALE_NAMES);

  const lastName = getRandomItem(FRENCH_LAST_NAMES);

  // Royals get noble titles
  if (profession === Profession.Royal) {
    const title = getRandomItem(NOBLE_TITLES);
    return `${firstName} ${title} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
};

const generateCharacter = (): GeneratedCharacter => {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const profession = generateProfession();
  const name = generateName(profession, gender);
  const startingCity = getRandomItem(STARTING_CITIES);
  const transportation = generateTransportation(profession);

  return { name, profession, startingCity, transportation, gender };
};

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onCreate, isLoading }) => {
  const [character, setCharacter] = useState<GeneratedCharacter | null>(null);
  const [rerollCount, setRerollCount] = useState(0);

  // Generate initial character on mount
  useEffect(() => {
    setCharacter(generateCharacter());
  }, []);

  const handleReroll = () => {
    setCharacter(generateCharacter());
    setRerollCount(prev => prev + 1);
  };

  const handleAccept = () => {
    if (character && !isLoading) {
      onCreate(character.name, character.profession);
    }
  };

  if (!character) {
    return (
      <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg text-center backdrop-blur-sm rounded-xl">
        <LoadingSpinner />
        <p className="text-amber-300 mt-4">The Fates are weaving your destiny...</p>
      </div>
    );
  }

  const stats = PROFESSION_STATS[character.profession];
  const isRoyal = character.profession === Profession.Royal;

  return (
    <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg backdrop-blur-sm rounded-xl max-w-3xl mx-auto">
      <h1 className="text-4xl text-amber-300 mb-6 tracking-wider text-center">The Fates Have Spoken</h1>

      {isRoyal && (
        <div className="mb-6 p-4 bg-purple-900/40 border-2 border-purple-400 rounded-lg animate-pulse">
          <p className="text-purple-300 text-center font-bold text-xl">✦ RARE ✦ Of Noble Blood ✦ RARE ✦</p>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {/* Name */}
        <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
          <div className="text-amber-400 text-sm uppercase tracking-wide mb-1">Your Name</div>
          <div className="text-3xl text-amber-100 font-bold">{character.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Profession */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <div className="text-amber-400 text-sm uppercase tracking-wide mb-1">Profession</div>
            <div className={`text-2xl font-bold ${isRoyal ? 'text-purple-300' : 'text-amber-100'}`}>
              {character.profession}
            </div>
          </div>

          {/* Starting City */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <div className="text-amber-400 text-sm uppercase tracking-wide mb-1">Departing From</div>
            <div className="text-2xl text-amber-100 font-bold">{character.startingCity}</div>
          </div>
        </div>

        {/* Transportation */}
        <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
          <div className="text-amber-400 text-sm uppercase tracking-wide mb-1">Method of Travel</div>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${isRoyal ? 'text-purple-300' : 'text-amber-100'}`}>
              {character.transportation}
            </div>
            <div className="text-green-400 text-sm">
              {character.transportation === 'Royal Procession' && '🏰 Lavish'}
              {character.transportation === 'Carriage' && '🐎 Comfortable'}
              {character.transportation === 'Wagon' && '🛒 Adequate'}
              {character.transportation === 'Horse' && '🐴 Swift'}
              {character.transportation === 'On Foot' && '🚶 Humble'}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
          <div className="text-amber-400 text-sm uppercase tracking-wide mb-2">Background</div>
          <p className="text-gray-300 text-sm leading-relaxed">{stats.description}</p>
        </div>

        {/* Starting Resources */}
        <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
          <div className="text-amber-400 text-sm uppercase tracking-wide mb-2">Starting Resources</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-yellow-400 text-2xl font-bold">{stats.money}</div>
              <div className="text-gray-400 text-xs">Money</div>
            </div>
            <div>
              <div className="text-green-400 text-2xl font-bold">{stats.food}</div>
              <div className="text-gray-400 text-xs">Food</div>
            </div>
            <div>
              <div className="text-blue-400 text-2xl font-bold">{stats.oxen}</div>
              <div className="text-gray-400 text-xs">Oxen</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-12">
            <LoadingSpinner />
            <span className="ml-4 text-amber-300">Preparing your journey...</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleReroll}
              className="px-8 py-3 bg-stone-700 border-2 border-stone-500 text-stone-300 hover:bg-stone-600 hover:border-stone-400 transition-colors rounded-lg font-bold text-lg"
            >
              ⟳ Reroll Fate
            </button>
            <ActionButton onClick={handleAccept}>
              Accept & Begin Journey
            </ActionButton>
          </>
        )}
      </div>

      {rerollCount > 0 && (
        <p className="text-center text-gray-500 text-xs mt-4">
          You have consulted the Fates {rerollCount} time{rerollCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default CharacterCreationScreen;
