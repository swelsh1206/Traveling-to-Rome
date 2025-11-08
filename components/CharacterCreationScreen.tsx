import React, { useState, useEffect } from 'react';
import { Profession, TransportationType, Gender } from '../types';
import { PROFESSION_STATS, FRENCH_MALE_NAMES, FRENCH_FEMALE_NAMES, FRENCH_LAST_NAMES, NOBLE_TITLES, STARTING_CITIES, MALE_PROFESSIONS, FEMALE_PROFESSIONS, GENDER_SYMBOLS } from '../constants';
import ActionButton from './ActionButton';
import LoadingSpinner from './LoadingSpinner';

interface CharacterCreationScreenProps {
  onCreate: (name: string, profession: Profession, gender: Gender) => void;
  isLoading: boolean;
  mode: 'random' | 'custom';
}

interface GeneratedCharacter {
  name: string;
  profession: Profession;
  startingCity: string;
  transportation: TransportationType;
  gender: Gender;
}

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateProfession = (gender: Gender): Profession => {
  const roll = Math.random() * 100;

  // Royal/NobleWoman is extremely rare - 0.5% chance
  if (roll < 0.5) return gender === 'Male' ? Profession.Royal : Profession.NobleWoman;

  // Weight the professions based on gender
  const professions = gender === 'Male'
    ? MALE_PROFESSIONS.filter(p => p !== Profession.Royal)
    : FEMALE_PROFESSIONS.filter(p => p !== Profession.NobleWoman);

  return getRandomItem(professions);
};

const generateTransportation = (profession: Profession): TransportationType => {
  if (profession === Profession.Royal || profession === Profession.NobleWoman) return 'Royal Procession';

  const money = PROFESSION_STATS[profession].money;

  if (money >= 500) return 'Carriage';
  if (money >= 350) return 'Wagon';
  if (money >= 275) return 'Horse';
  return 'On Foot';
};

const generateName = (profession: Profession, gender: Gender): string => {
  const firstName = gender === 'Male'
    ? getRandomItem(FRENCH_MALE_NAMES)
    : getRandomItem(FRENCH_FEMALE_NAMES);

  const lastName = getRandomItem(FRENCH_LAST_NAMES);

  // Royals get noble titles
  if (profession === Profession.Royal || profession === Profession.NobleWoman) {
    const title = getRandomItem(NOBLE_TITLES);
    return `${firstName} ${title} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
};

const generateCharacter = (gender?: Gender): GeneratedCharacter => {
  const selectedGender = gender || (Math.random() > 0.5 ? 'Male' : 'Female');
  const profession = generateProfession(selectedGender);
  const name = generateName(profession, selectedGender);
  const startingCity = getRandomItem(STARTING_CITIES);
  const transportation = generateTransportation(profession);

  return { name, profession, startingCity, transportation, gender: selectedGender };
};

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onCreate, isLoading, mode }) => {
  const [character, setCharacter] = useState<GeneratedCharacter | null>(null);
  const [rerollCount, setRerollCount] = useState(0);

  // Custom mode state
  const [customName, setCustomName] = useState('');
  const [customGender, setCustomGender] = useState<Gender>('Male');
  const [customProfession, setCustomProfession] = useState<Profession | null>(null);

  // Generate initial character on mount (random mode only)
  useEffect(() => {
    if (mode === 'random') {
      setCharacter(generateCharacter());
    }
  }, [mode]);

  const handleReroll = () => {
    setCharacter(generateCharacter()); // Completely random, no gender preference
    setRerollCount(prev => prev + 1);
  };

  const handleAccept = () => {
    if (mode === 'random' && character && !isLoading) {
      onCreate(character.name, character.profession, character.gender);
    } else if (mode === 'custom' && customName && customProfession && !isLoading) {
      onCreate(customName, customProfession, customGender);
    }
  };

  const handleCustomSubmit = () => {
    if (customName && customProfession) {
      onCreate(customName, customProfession, customGender);
    }
  };

  // Custom mode UI
  if (mode === 'custom') {
    const availableProfessions = customGender === 'Male' ? MALE_PROFESSIONS : FEMALE_PROFESSIONS;

    return (
      <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg backdrop-blur-sm rounded-xl max-w-3xl mx-auto">
        <h1 className="text-4xl text-amber-300 mb-6 tracking-wider text-center">Create Your Character</h1>

        <div className="space-y-6 mb-8">
          {/* Name Input */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <label className="text-amber-400 text-sm uppercase tracking-wide mb-2 block">Character Name</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 bg-stone-800 border-2 border-amber-600/30 rounded-lg text-amber-100 text-xl font-bold focus:outline-none focus:border-amber-500 placeholder-gray-500"
              maxLength={40}
            />
          </div>

          {/* Gender Selection */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <label className="text-amber-400 text-sm uppercase tracking-wide mb-3 block">Gender</label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCustomGender('Male');
                  setCustomProfession(null); // Reset profession when gender changes
                }}
                className={`flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                  customGender === 'Male'
                    ? 'bg-blue-600 border-2 border-blue-400 text-white'
                    : 'bg-stone-700 border-2 border-stone-500 text-stone-300 hover:bg-stone-600'
                }`}
              >
                {GENDER_SYMBOLS.Male} Male
              </button>
              <button
                onClick={() => {
                  setCustomGender('Female');
                  setCustomProfession(null); // Reset profession when gender changes
                }}
                className={`flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                  customGender === 'Female'
                    ? 'bg-pink-600 border-2 border-pink-400 text-white'
                    : 'bg-stone-700 border-2 border-stone-500 text-stone-300 hover:bg-stone-600'
                }`}
              >
                {GENDER_SYMBOLS.Female} Female
              </button>
            </div>
          </div>

          {/* Profession Selection */}
          <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
            <label className="text-amber-400 text-sm uppercase tracking-wide mb-3 block">Profession</label>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
              {availableProfessions.map((prof) => {
                const stats = PROFESSION_STATS[prof];
                const isRare = prof === Profession.Royal || prof === Profession.NobleWoman;
                return (
                  <button
                    key={prof}
                    onClick={() => setCustomProfession(prof)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      customProfession === prof
                        ? isRare
                          ? 'bg-purple-900/50 border-purple-500 shadow-lg shadow-purple-500/30'
                          : 'bg-amber-900/50 border-amber-500 shadow-lg shadow-amber-500/30'
                        : 'bg-stone-800 border-stone-600 hover:border-stone-500'
                    }`}
                  >
                    <div className={`text-lg font-bold mb-1 ${customProfession === prof ? (isRare ? 'text-purple-300' : 'text-amber-300') : 'text-gray-300'}`}>
                      {prof}
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2">{stats.description}</div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="text-yellow-400">💰 {stats.money}</span>
                      <span className="text-green-400">🍖 {stats.food}</span>
                      <span className="text-blue-400">🐂 {stats.oxen}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected profession details */}
          {customProfession && (
            <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
              <div className="text-amber-400 text-sm uppercase tracking-wide mb-2">Starting Resources</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-yellow-400 text-2xl font-bold">{PROFESSION_STATS[customProfession].money}</div>
                  <div className="text-gray-400 text-xs">Money</div>
                </div>
                <div>
                  <div className="text-green-400 text-2xl font-bold">{PROFESSION_STATS[customProfession].food}</div>
                  <div className="text-gray-400 text-xs">Food</div>
                </div>
                <div>
                  <div className="text-blue-400 text-2xl font-bold">{PROFESSION_STATS[customProfession].oxen}</div>
                  <div className="text-gray-400 text-xs">Oxen</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-12">
              <LoadingSpinner />
              <span className="ml-4 text-amber-300">Preparing your journey...</span>
            </div>
          ) : (
            <button
              onClick={handleCustomSubmit}
              disabled={!customName || !customProfession}
              className={`px-8 py-3 rounded-lg font-bold text-lg transition-colors ${
                customName && customProfession
                  ? 'bg-amber-600 border-2 border-amber-400 text-white hover:bg-amber-500'
                  : 'bg-stone-700 border-2 border-stone-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              Begin Journey →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Random mode - loading state
  if (!character) {
    return (
      <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg text-center backdrop-blur-sm rounded-xl">
        <LoadingSpinner />
        <p className="text-amber-300 mt-4">The Fates are weaving your destiny...</p>
      </div>
    );
  }

  const stats = PROFESSION_STATS[character.profession];
  const isRoyal = character.profession === Profession.Royal || character.profession === Profession.NobleWoman;

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
          <div className="text-3xl text-amber-100 font-bold flex items-center justify-center gap-3">
            {character.name}
            <span className="text-2xl">{GENDER_SYMBOLS[character.gender]}</span>
          </div>
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
