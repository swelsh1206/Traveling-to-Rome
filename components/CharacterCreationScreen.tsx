import React, { useState, useEffect } from 'react';
import { Profession, TransportationType, Gender, SocialClass, JourneyReason } from '../types';
import { PROFESSION_STATS, PROFESSION_EQUIPMENT, PROFESSION_SKILLS, INITIAL_HEALTH, INITIAL_STAMINA, FRENCH_MALE_NAMES, FRENCH_FEMALE_NAMES, FRENCH_LAST_NAMES, NOBLE_TITLES, STARTING_CITIES, MALE_PROFESSIONS, FEMALE_PROFESSIONS, GENDER_SYMBOLS, StartingCity, getLiegeForYear, getStartingCitiesForDifficulty, HARD_MODE_NOBLE_CHANCE, HARD_MODE_SCHOLAR_F_CHANCE } from '../constants';
import ActionButton from './ActionButton';
import LoadingSpinner from './LoadingSpinner';
import Tooltip from './Tooltip';
import { STAT_TOOLTIPS, POLITICAL_ENTITY_TOOLTIPS } from '../tooltipDescriptions';

interface CharacterCreationScreenProps {
  onCreate: (name: string, profession: Profession, gender: Gender, startingCity: StartingCity, year: number) => void;
  isLoading: boolean;
  mode: 'random' | 'custom';
  year: number;
  difficulty: 'normal' | 'hard';
}

interface GeneratedCharacter {
  name: string;
  profession: Profession;
  startingCity: StartingCity;
  transportation: TransportationType;
  gender: Gender;
  journeyReason: JourneyReason;
}

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateJourneyReason = (profession: Profession): JourneyReason => {
  let journeyReasons: JourneyReason[];

  switch(profession) {
    case Profession.Priest:
    case Profession.Nun:
      journeyReasons = ['Seeking Spiritual Renewal', 'Penance for Past Deeds'];
      break;
    case Profession.Merchant:
    case Profession.Merchant_F:
      journeyReasons = ['Trade Opportunity', 'Escaping Persecution', 'Political Refuge'];
      break;
    case Profession.Scholar:
    case Profession.Scholar_F:
      journeyReasons = ['Scholarly Research', 'Escaping Persecution', 'Seeking a Cure'];
      break;
    case Profession.Soldier:
      journeyReasons = ['Penance for Past Deeds', 'Escaping Persecution', 'Political Refuge'];
      break;
    case Profession.Apothecary:
    case Profession.Midwife:
    case Profession.Herbalist:
      journeyReasons = ['Scholarly Research', 'Seeking a Cure', 'Escaping Persecution'];
      break;
    case Profession.Royal:
    case Profession.NobleWoman:
      journeyReasons = ['The Grand Tour', 'The Grand Tour', 'The Grand Tour', 'Political Refuge']; // Grand Tour is the typical reason for nobility
      break;
    case Profession.Blacksmith:
      journeyReasons = ['Trade Opportunity', 'Family Vow', 'Seeking a Cure'];
      break;
    default:
      journeyReasons = ['Seeking a Cure', 'Political Refuge', 'Family Vow', 'Escaping Persecution'];
  }

  return getRandomItem(journeyReasons);
};

const generateProfession = (gender: Gender, difficulty: 'normal' | 'hard'): Profession => {
  const roll = Math.random() * 100;

  // Royal/NobleWoman is extremely rare - chance varies by difficulty
  const nobleChance = difficulty === 'hard' ? HARD_MODE_NOBLE_CHANCE * 100 : 0.5;
  if (roll < nobleChance) return gender === 'Male' ? Profession.Royal : Profession.NobleWoman;

  // For female characters, use weighted probabilities to make scholars extremely rare (historically accurate)
  if (gender === 'Female') {
    const femaleRoll = Math.random() * 100;

    // Scholar_F is extremely rare - chance varies by difficulty
    const scholarChance = difficulty === 'hard' ? HARD_MODE_SCHOLAR_F_CHANCE * 100 : 2;
    if (femaleRoll < scholarChance) return Profession.Scholar_F;

    // Other professions are weighted equally among the remaining percentage
    const commonFemaleProfessions = [
      Profession.Nun,
      Profession.Midwife,
      Profession.Herbalist,
      Profession.Merchant_F,
    ];

    return getRandomItem(commonFemaleProfessions);
  }

  // Male professions remain equally weighted
  const professions = MALE_PROFESSIONS.filter(p => p !== Profession.Royal);
  return getRandomItem(professions);
};

const generateTransportation = (profession: Profession): TransportationType => {
  if (profession === Profession.Royal || profession === Profession.NobleWoman) return 'Royal Procession';

  const ducats = PROFESSION_STATS[profession].ducats;

  if (ducats >= 500) return 'Carriage';
  if (ducats >= 350) return 'Wagon';
  if (ducats >= 275) return 'Horse';
  return 'On Foot';
};

const getSocialClass = (profession: Profession): SocialClass => {
  if (profession === Profession.Royal || profession === Profession.NobleWoman) return 'High Nobility';
  if (profession === Profession.Merchant || profession === Profession.Merchant_F) return 'Merchant Class';
  if (profession === Profession.Soldier || profession === Profession.Blacksmith) return 'Craftsman';
  if (profession === Profession.Scholar || profession === Profession.Scholar_F ||
      profession === Profession.Priest || profession === Profession.Apothecary ||
      profession === Profession.Nun || profession === Profession.Midwife ||
      profession === Profession.Herbalist) return 'Craftsman';
  return 'Craftsman';
};

const getInitialAmmunition = (profession: Profession): number => {
  if (profession === Profession.Soldier) return 20;
  if (profession === Profession.Royal) return 15;
  return 10;
};

const getInitialSpareParts = (profession: Profession, hasWagon: boolean): number => {
  if (profession === Profession.Blacksmith) return 5;
  if (profession === Profession.Royal) return 3;
  if (hasWagon) return 2;
  return 0;
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

const generateCharacter = (difficulty: 'normal' | 'hard', gender?: Gender): GeneratedCharacter => {
  const selectedGender = gender || (Math.random() > 0.5 ? 'Male' : 'Female');
  const profession = generateProfession(selectedGender, difficulty);
  const name = generateName(profession, selectedGender);

  // Filter cities by difficulty (hard mode = longer distances only)
  const availableCities = getStartingCitiesForDifficulty(difficulty);
  const startingCity = getRandomItem(availableCities);

  const transportation = generateTransportation(profession);
  const journeyReason = generateJourneyReason(profession);

  return { name, profession, startingCity, transportation, gender: selectedGender, journeyReason };
};

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onCreate, isLoading, mode, year, difficulty }) => {
  const [character, setCharacter] = useState<GeneratedCharacter | null>(null);
  const [rerollCount, setRerollCount] = useState(0);

  // Custom mode state
  const [customName, setCustomName] = useState('');
  const [customGender, setCustomGender] = useState<Gender>('Male');
  const [customProfession, setCustomProfession] = useState<Profession | null>(null);
  const [customJourneyReason, setCustomJourneyReason] = useState<JourneyReason | null>(null);

  // Update journey reason when profession changes
  useEffect(() => {
    if (customProfession) {
      setCustomJourneyReason(generateJourneyReason(customProfession));
    }
  }, [customProfession]);

  // Generate initial character on mount (random mode only)
  useEffect(() => {
    if (mode === 'random') {
      setCharacter(generateCharacter(difficulty));
    }
  }, [mode, difficulty]);

  const handleReroll = () => {
    setCharacter(generateCharacter(difficulty)); // Completely random, no gender preference
    setRerollCount(prev => prev + 1);
  };

  const handleAccept = () => {
    if (mode === 'random' && character && !isLoading) {
      onCreate(character.name, character.profession, character.gender, character.startingCity, year);
    } else if (mode === 'custom' && customName && customProfession && !isLoading) {
      // For custom mode, also randomly select a starting city (filtered by difficulty)
      const availableCities = getStartingCitiesForDifficulty(difficulty);
      const randomCity = getRandomItem(availableCities);
      onCreate(customName, customProfession, customGender, randomCity, year);
    }
  };

  const handleCustomSubmit = () => {
    if (customName && customProfession) {
      // Filter cities by difficulty (hard mode = longer distances only)
      const availableCities = getStartingCitiesForDifficulty(difficulty);
      const randomCity = getRandomItem(availableCities);
      onCreate(customName, customProfession, customGender, randomCity, year);
    }
  };

  // Custom mode UI
  if (mode === 'custom') {
    const availableProfessions = customGender === 'Male' ? MALE_PROFESSIONS : FEMALE_PROFESSIONS;

    return (
      <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg backdrop-blur-sm rounded-xl max-w-5xl mx-auto">
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
                      <span className="text-yellow-400">💰 {stats.ducats}</span>
                      <span className="text-green-400">🍖 {stats.food}</span>
                      {stats.oxen > 0 && <span className="text-blue-400">🐴 {stats.oxen}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected profession details */}
          {customProfession && (() => {
            const profStats = PROFESSION_STATS[customProfession];
            const profSkills = PROFESSION_SKILLS[customProfession];
            const profEquipment = PROFESSION_EQUIPMENT[customProfession];
            const profHasWagon = profStats.oxen >= 2;
            const profAmmunition = getInitialAmmunition(customProfession);
            const profSpareParts = getInitialSpareParts(customProfession, profHasWagon);
            const profSocialClass = getSocialClass(customProfession);

            return (
              <div className="space-y-4">
                {/* Social Class */}
                <div className="bg-stone-900/50 p-3 rounded-lg border-2 border-amber-600/30">
                  <div className="text-amber-400 text-xs uppercase tracking-wide mb-1">Social Class</div>
                  <div className="text-amber-100 text-lg font-bold">{profSocialClass}</div>
                </div>

                {/* Journey Exigence */}
                {customJourneyReason && (
                  <div className="bg-stone-900/50 p-3 rounded-lg border-2 border-amber-600/30">
                    <div className="text-amber-400 text-xs uppercase tracking-wide mb-1">Journey Exigence</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      <div className="text-amber-100 text-lg font-bold">{customJourneyReason}</div>
                    </div>
                    <div className="text-gray-400 text-xs mt-1 italic">
                      {customJourneyReason === 'Seeking Spiritual Renewal' && 'Seeking God\'s grace in the Eternal City'}
                      {customJourneyReason === 'Penance for Past Deeds' && 'Atoning for sins through pilgrimage'}
                      {customJourneyReason === 'Trade Opportunity' && 'Seeking fortune in Roman markets'}
                      {customJourneyReason === 'Scholarly Research' && 'Studying ancient texts and knowledge'}
                      {customJourneyReason === 'Escaping Persecution' && 'Fleeing danger and seeking refuge'}
                      {customJourneyReason === 'Political Refuge' && 'Escaping political turmoil and enemies'}
                      {customJourneyReason === 'Seeking a Cure' && 'Hoping for miraculous healing'}
                      {customJourneyReason === 'Family Vow' && 'Fulfilling a sacred family promise'}
                      {customJourneyReason === 'For Adventure and Pleasure' && 'Traveling for the thrill of the journey'}
                      {customJourneyReason === 'The Grand Tour' && 'A noble tradition - traveling Europe for cultural education and refinement'}
                    </div>
                  </div>
                )}

                {/* Core Stats */}
                <div className="bg-stone-900/50 p-3 rounded-lg border-2 border-amber-600/30">
                  <div className="text-amber-400 text-xs uppercase tracking-wide mb-2">Core Stats</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400">❤️</span>
                      <div>
                        <span className="text-white font-bold">{INITIAL_HEALTH}</span>
                        <span className="text-gray-400 text-xs ml-1">Health</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">⚡</span>
                      <div>
                        <span className="text-white font-bold">{INITIAL_STAMINA}</span>
                        <span className="text-gray-400 text-xs ml-1">Stamina</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resources */}
                <div className="bg-stone-900/50 p-3 rounded-lg border-2 border-amber-600/30">
                  <div className="text-amber-400 text-xs uppercase tracking-wide mb-2">Starting Resources</div>
                  <div className={`grid ${profStats.oxen > 0 ? (profSpareParts > 0 ? 'grid-cols-5' : 'grid-cols-4') : (profSpareParts > 0 ? 'grid-cols-4' : 'grid-cols-3')} gap-2 text-xs text-center`}>
                    <div>
                      <div className="text-yellow-400 text-lg font-bold">{profStats.ducats}</div>
                      <div className="text-gray-400">Ducats</div>
                    </div>
                    <div>
                      <div className="text-green-400 text-lg font-bold">{profStats.food}</div>
                      <div className="text-gray-400">Food</div>
                    </div>
                    {profStats.oxen > 0 && (
                      <div>
                        <div className="text-blue-400 text-lg font-bold">{profStats.oxen}</div>
                        <div className="text-gray-400">Oxen</div>
                      </div>
                    )}
                    <div>
                      <div className="text-orange-400 text-lg font-bold">{profAmmunition}</div>
                      <div className="text-gray-400">Ammo</div>
                    </div>
                    {profSpareParts > 0 && (
                      <div>
                        <div className="text-gray-400 text-lg font-bold">{profSpareParts}</div>
                        <div className="text-gray-400">Parts</div>
                      </div>
                    )}
                  </div>
                  {profHasWagon && (
                    <div className="mt-2 pt-2 border-t border-amber-600/20 text-green-400 text-xs font-bold">
                      🛒 Has Wagon
                    </div>
                  )}
                </div>

                {/* Equipment */}
                <div className="bg-stone-900/50 p-3 rounded-lg border-2 border-amber-600/30">
                  <div className="text-amber-400 text-xs uppercase tracking-wide mb-2">Equipment</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-400 mb-1">Weapon</div>
                      <div className="text-white font-bold">{profEquipment.weapon || 'None'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Armor</div>
                      <div className="text-white font-bold">{profEquipment.armor || 'None'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Tool</div>
                      <div className="text-white font-bold">{profEquipment.tool || 'None'}</div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-stone-900/50 p-3 rounded-lg border-2 border-amber-600/30">
                  <div className="text-amber-400 text-xs uppercase tracking-wide mb-2">Skills</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">⚔️ Combat:</span>
                      <span className="text-white font-bold">{profSkills.combat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">💬 Diplomacy:</span>
                      <span className="text-white font-bold">{profSkills.diplomacy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🏕️ Survival:</span>
                      <span className="text-white font-bold">{profSkills.survival}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🩺 Medicine:</span>
                      <span className="text-white font-bold">{profSkills.medicine}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🥷 Stealth:</span>
                      <span className="text-white font-bold">{profSkills.stealth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">📚 Knowledge:</span>
                      <span className="text-white font-bold">{profSkills.knowledge}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
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
  const socialClass = getSocialClass(character.profession);
  const skills = PROFESSION_SKILLS[character.profession];
  const equipment = PROFESSION_EQUIPMENT[character.profession];
  const hasWagon = stats.oxen >= 2;
  const ammunition = getInitialAmmunition(character.profession);
  const spareParts = getInitialSpareParts(character.profession, hasWagon);
  const historicalLiege = getLiegeForYear(character.startingCity, year);

  return (
    <div className="bg-stone-800/80 p-6 border-4 border-amber-500 shadow-lg backdrop-blur-sm rounded-xl max-w-4xl mx-auto max-h-[85vh] overflow-y-auto">
      <h1 className="text-3xl text-amber-300 mb-4 tracking-wider text-center">The Fates Have Spoken</h1>

      {isRoyal && (
        <div className="mb-6 p-4 bg-purple-900/40 border-2 border-purple-400 rounded-lg animate-pulse">
          <p className="text-purple-300 text-center font-bold text-xl">✦ RARE ✦ Of Noble Blood ✦ RARE ✦</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {/* Character Identity - Super Consolidated */}
        <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
          <div className="text-center mb-3">
            <div className="text-3xl text-amber-100 font-bold flex items-center justify-center gap-3">
              {character.name}
              <span className="text-2xl">{GENDER_SYMBOLS[character.gender]}</span>
            </div>
            <div className={`text-lg font-bold mt-1 ${isRoyal ? 'text-purple-300' : 'text-amber-300'}`}>
              {character.profession} • {socialClass}
            </div>
          </div>

          {/* Journey Exigence - Prominently displayed */}
          <div className="mt-3 pt-3 border-t border-amber-600/20">
            <div className="text-amber-400 text-xs uppercase tracking-wide mb-1 text-center">Journey Exigence</div>
            <div className="text-center">
              <span className="text-2xl mr-2">🎯</span>
              <span className="text-amber-100 font-bold text-xl">{character.journeyReason}</span>
            </div>
            <div className="text-gray-400 text-xs text-center mt-1 italic">
              {character.journeyReason === 'Seeking Spiritual Renewal' && 'Seeking God\'s grace in the Eternal City'}
              {character.journeyReason === 'Penance for Past Deeds' && 'Atoning for sins through pilgrimage'}
              {character.journeyReason === 'Trade Opportunity' && 'Seeking fortune in Roman markets'}
              {character.journeyReason === 'Scholarly Research' && 'Studying ancient texts and knowledge'}
              {character.journeyReason === 'Escaping Persecution' && 'Fleeing danger and seeking refuge'}
              {character.journeyReason === 'Political Refuge' && 'Escaping political turmoil and enemies'}
              {character.journeyReason === 'Seeking a Cure' && 'Hoping for miraculous healing'}
              {character.journeyReason === 'Family Vow' && 'Fulfilling a sacred family promise'}
              {character.journeyReason === 'For Adventure and Pleasure' && 'Traveling for the thrill of the journey'}
              {character.journeyReason === 'The Grand Tour' && 'A noble tradition - traveling Europe for cultural education and refinement'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-600/20">
            <div className="text-center">
              <div className="text-amber-400 text-xs uppercase tracking-wide mb-1">Departing From</div>
              <div className="text-lg text-amber-100 font-bold">{character.startingCity.name}</div>
              <div className="text-xs text-gray-400">{character.startingCity.region}</div>
              <Tooltip content={POLITICAL_ENTITY_TOOLTIPS[historicalLiege] || historicalLiege} position="top">
                <div className="text-xs text-purple-400 mt-1 cursor-help">⚜️ {historicalLiege}</div>
              </Tooltip>
            </div>
            <div className="text-center">
              <div className="text-amber-400 text-xs uppercase tracking-wide mb-1">Distance to Rome</div>
              <div className="text-2xl text-amber-100 font-bold">{character.startingCity.distance} km</div>
              <div className="text-xs text-gray-400">
                {character.startingCity.distance < 800 && '🚶 Close'}
                {character.startingCity.distance >= 800 && character.startingCity.distance < 1400 && '🗺️ Moderate'}
                {character.startingCity.distance >= 1400 && character.startingCity.distance < 2000 && '⛰️ Far'}
                {character.startingCity.distance >= 2000 && '🌍 Very Far'}
              </div>
            </div>
          </div>
        </div>

        {/* Transportation & Background */}
        <div className="bg-stone-900/50 p-3 rounded-lg border-2 border-amber-600/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-amber-400 text-xs uppercase tracking-wide mb-1">Method of Travel</div>
              <div className={`text-xl font-bold ${isRoyal ? 'text-purple-300' : 'text-amber-100'}`}>
                {character.transportation}
              </div>
            </div>
            <div className="text-green-400 text-sm">
              {character.transportation === 'Royal Procession' && '🏰 Lavish'}
              {character.transportation === 'Carriage' && '🐎 Comfortable'}
              {character.transportation === 'Wagon' && '🛒 Adequate'}
              {character.transportation === 'Horse' && '🐴 Swift'}
              {character.transportation === 'On Foot' && '🚶 Humble'}
            </div>
          </div>
          <div className="pt-2 border-t border-amber-600/20">
            <p className="text-gray-300 text-xs leading-relaxed">
              {character.transportation === 'Royal Procession' && 'Traveling with a full entourage of servants, guards, and attendants. The finest accommodations await at every stop.'}
              {character.transportation === 'Carriage' && 'A covered carriage provides shelter from weather and allows rest while traveling. Comfortable but slower than horseback.'}
              {character.transportation === 'Wagon' && 'A sturdy wagon pulled by oxen carries supplies and offers basic shelter. Reliable for long journeys with heavy loads.'}
              {character.transportation === 'Horse' && 'Mounted travel allows swift passage across terrain. Requires skill in horsemanship and frequent rest stops for the animal.'}
              {character.transportation === 'On Foot' && 'Walking the ancient pilgrim routes as countless travelers have before. Slow but requires no animal care or upkeep.'}
            </p>
          </div>
        </div>

        {/* Core Stats & Resources Combined */}
        <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
          <div className="text-amber-400 text-sm uppercase tracking-wide mb-3">Core Stats & Resources</div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Tooltip content={STAT_TOOLTIPS.health} position="top">
              <div className="flex items-center gap-3 cursor-help bg-stone-800/50 p-3 rounded-lg">
                <span className="text-red-400 text-2xl">❤️</span>
                <div>
                  <div className="text-white font-bold text-2xl">{INITIAL_HEALTH}</div>
                  <div className="text-gray-400 text-xs">Health</div>
                </div>
              </div>
            </Tooltip>
            <Tooltip content={STAT_TOOLTIPS.stamina} position="top">
              <div className="flex items-center gap-3 cursor-help bg-stone-800/50 p-3 rounded-lg">
                <span className="text-cyan-400 text-2xl">⚡</span>
                <div>
                  <div className="text-white font-bold text-2xl">{INITIAL_STAMINA}</div>
                  <div className="text-gray-400 text-xs">Stamina</div>
                </div>
              </div>
            </Tooltip>
          </div>
          <div className={`grid ${stats.oxen > 0 ? (spareParts > 0 ? 'grid-cols-5' : 'grid-cols-4') : (spareParts > 0 ? 'grid-cols-4' : 'grid-cols-3')} gap-2`}>
            <Tooltip content={STAT_TOOLTIPS.ducats} position="top">
              <div className="text-center cursor-help bg-stone-800/50 p-2 rounded-lg">
                <div className="text-yellow-400 text-xl mb-1">💰</div>
                <div className="text-white font-bold text-lg">{stats.ducats}</div>
                <div className="text-gray-400 text-xs">Ducats</div>
              </div>
            </Tooltip>
            <Tooltip content={STAT_TOOLTIPS.food} position="top">
              <div className="text-center cursor-help bg-stone-800/50 p-2 rounded-lg">
                <div className="text-green-400 text-xl mb-1">🍖</div>
                <div className="text-white font-bold text-lg">{stats.food}</div>
                <div className="text-gray-400 text-xs">Food</div>
              </div>
            </Tooltip>
            {stats.oxen > 0 && (
              <Tooltip content={STAT_TOOLTIPS.oxen} position="top">
                <div className="text-center cursor-help bg-stone-800/50 p-2 rounded-lg">
                  <div className="text-blue-400 text-xl mb-1">🐂</div>
                  <div className="text-white font-bold text-lg">{stats.oxen}</div>
                  <div className="text-gray-400 text-xs">Oxen</div>
                </div>
              </Tooltip>
            )}
            <Tooltip content={STAT_TOOLTIPS.ammunition} position="top">
              <div className="text-center cursor-help bg-stone-800/50 p-2 rounded-lg">
                <div className="text-orange-400 text-xl mb-1">🎯</div>
                <div className="text-white font-bold text-lg">{ammunition}</div>
                <div className="text-gray-400 text-xs">Ammo</div>
              </div>
            </Tooltip>
            {spareParts > 0 && (
              <Tooltip content={STAT_TOOLTIPS.spareParts} position="top">
                <div className="text-center cursor-help bg-stone-800/50 p-2 rounded-lg">
                  <div className="text-gray-400 text-xl mb-1">🔧</div>
                  <div className="text-white font-bold text-lg">{spareParts}</div>
                  <div className="text-gray-400 text-xs">Parts</div>
                </div>
              </Tooltip>
            )}
          </div>
          {hasWagon && (
            <div className="mt-3 pt-3 border-t border-amber-600/20">
              <div className="text-green-400 text-sm font-bold text-center">🛒 Has Wagon</div>
            </div>
          )}
        </div>

        {/* Equipment & Skills Combined */}
        <div className="bg-stone-900/50 p-4 rounded-lg border-2 border-amber-600/30">
          <div className="text-amber-400 text-sm uppercase tracking-wide mb-3">Equipment & Skills</div>
          <div className="grid grid-cols-3 gap-3 text-sm mb-4">
            <div className="bg-stone-800/50 p-2 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Weapon</div>
              <div className="text-white font-bold">{equipment.weapon || 'None'}</div>
            </div>
            <div className="bg-stone-800/50 p-2 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Armor</div>
              <div className="text-white font-bold">{equipment.armor || 'None'}</div>
            </div>
            <div className="bg-stone-800/50 p-2 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Tool</div>
              <div className="text-white font-bold">{equipment.tool || 'None'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Tooltip content="Combat skill affects your ability to fight and defend yourself" position="top">
              <div className="flex justify-between bg-stone-800/50 p-2 rounded-lg cursor-help">
                <span className="text-gray-400">⚔️ Combat</span>
                <span className="text-white font-bold text-lg">{skills.combat}</span>
              </div>
            </Tooltip>
            <Tooltip content="Diplomacy skill affects your ability to negotiate and persuade others" position="top">
              <div className="flex justify-between bg-stone-800/50 p-2 rounded-lg cursor-help">
                <span className="text-gray-400">💬 Diplomacy</span>
                <span className="text-white font-bold text-lg">{skills.diplomacy}</span>
              </div>
            </Tooltip>
            <Tooltip content="Survival skill affects your ability to endure harsh conditions and find resources" position="top">
              <div className="flex justify-between bg-stone-800/50 p-2 rounded-lg cursor-help">
                <span className="text-gray-400">🏕️ Survival</span>
                <span className="text-white font-bold text-lg">{skills.survival}</span>
              </div>
            </Tooltip>
            <Tooltip content="Medicine skill affects your ability to heal wounds and treat illnesses" position="top">
              <div className="flex justify-between bg-stone-800/50 p-2 rounded-lg cursor-help">
                <span className="text-gray-400">⚕️ Medicine</span>
                <span className="text-white font-bold text-lg">{skills.medicine}</span>
              </div>
            </Tooltip>
            <Tooltip content="Stealth skill affects your ability to avoid detection and move unseen" position="top">
              <div className="flex justify-between bg-stone-800/50 p-2 rounded-lg cursor-help">
                <span className="text-gray-400">🥷 Stealth</span>
                <span className="text-white font-bold text-lg">{skills.stealth}</span>
              </div>
            </Tooltip>
            <Tooltip content="Knowledge skill affects your education, languages, and understanding of history and religion" position="top">
              <div className="flex justify-between bg-stone-800/50 p-2 rounded-lg cursor-help">
                <span className="text-gray-400">📚 Knowledge</span>
                <span className="text-white font-bold text-lg">{skills.knowledge}</span>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-10">
            <LoadingSpinner />
            <span className="ml-3 text-amber-300 text-sm">Preparing your journey...</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleReroll}
              className="px-6 py-2 bg-stone-700 border-2 border-stone-500 text-stone-300 hover:bg-stone-600 hover:border-stone-400 transition-colors rounded-lg font-bold text-sm"
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
        <p className="text-center text-gray-500 text-xs mt-3">
          You have consulted the Fates {rerollCount} time{rerollCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default CharacterCreationScreen;
