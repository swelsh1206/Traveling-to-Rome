
import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import GameUI from './components/GameUI';
import EndScreen from './components/EndScreen';
import { Player, GameState, Profession, PartyMember, Gender, JourneyReason } from './types';
import { PROFESSION_STATS, PROFESSION_EQUIPMENT, PROFESSION_SKILLS, TOTAL_DISTANCE_TO_ROME, INITIAL_HEALTH, INITIAL_STAMINA, FRENCH_MALE_NAMES, FRENCH_FEMALE_NAMES, FRENCH_LAST_NAMES, StartingCity, generateRouteCheckpoints } from './constants';
import { generateCharacterImage } from './services/geminiService';
import { generateRandomStartDate, getSeasonFromMonth } from './utils/dateUtils';

type GameScreen = 'start' | 'create-random' | 'create-custom' | 'game' | 'end';

const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [characterImageUrl, setCharacterImageUrl] = useState<string>('');
  const [endMessage, setEndMessage] = useState({ message: '', victory: false });
  const [isCreating, setIsCreating] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [gameYear, setGameYear] = useState<number>(1450);
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');

  const handleRandomStart = (year: number, selectedDifficulty: 'normal' | 'hard') => {
    setGameYear(year);
    setDifficulty(selectedDifficulty);
    setScreen('create-random');
  };

  const handleCustomStart = (year: number, selectedDifficulty: 'normal' | 'hard') => {
    setGameYear(year);
    setDifficulty(selectedDifficulty);
    setScreen('create-custom');
  };

  const handleCharacterCreate = async (name: string, profession: Profession, gender: Gender, startingCity: StartingCity, year: number) => {
    try {
      setIsCreating(true);
      const stats = PROFESSION_STATS[profession];

      // Generate player attributes
      const age = 25 + Math.floor(Math.random() * 20); // 25-44 years old
      const religion = 'Catholic'; // Default for most of Europe in this period
      const socialClass = profession === 'Royal' || profession === 'Noble Woman'
        ? 'High Nobility'
        : profession === 'Merchant' || profession === 'Merchant_F'
        ? 'Merchant Class'
        : profession === 'Soldier' || profession === 'Blacksmith'
        ? 'Craftsman'
        : 'Craftsman';

      // Select journey reason based on profession - more specific and varied
      let journeyReasons: JourneyReason[];

      switch(profession) {
        case 'Priest':
        case 'Nun':
          journeyReasons = ['Seeking Spiritual Renewal', 'Penance for Past Deeds'];
          break;
        case 'Merchant':
        case 'Merchant_F':
          journeyReasons = ['Trade Opportunity', 'Escaping Persecution', 'Political Refuge'];
          break;
        case 'Scholar':
        case 'Scholar_F':
          journeyReasons = ['Scholarly Research', 'Escaping Persecution', 'Seeking a Cure'];
          break;
        case 'Soldier':
          journeyReasons = ['Penance for Past Deeds', 'Escaping Persecution', 'Political Refuge'];
          break;
        case 'Apothecary':
        case 'Midwife':
        case 'Herbalist':
          journeyReasons = ['Scholarly Research', 'Seeking a Cure', 'Escaping Persecution'];
          break;
        case 'Royal':
        case 'Noble Woman':
          journeyReasons = ['The Grand Tour', 'The Grand Tour', 'The Grand Tour', 'Political Refuge']; // Grand Tour is the typical reason for nobility
          break;
        case 'Blacksmith':
          journeyReasons = ['Trade Opportunity', 'Family Vow', 'Seeking a Cure'];
          break;
        default:
          journeyReasons = ['Seeking a Cure', 'Political Refuge', 'Family Vow', 'Escaping Persecution'];
      }

      const journeyReason = getRandomItem(journeyReasons as any);

      const reputation = 50; // Start neutral
      const languages = ['Latin']; // Latin common for educated pilgrims

      // Add regional language based on starting city
      if (startingCity.region.includes('France')) languages.push('French');
      else if (startingCity.region.includes('England') || startingCity.region.includes('Scotland') || startingCity.region.includes('Ireland')) languages.push('English');
      else if (startingCity.region.includes('Spain')) languages.push('Spanish');
      else if (startingCity.region.includes('Portugal')) languages.push('Portuguese');
      else if (startingCity.region.includes('Netherlands') || startingCity.region === 'Spanish Netherlands') languages.push('Dutch');
      else if (startingCity.region.includes('Italy')) languages.push('Italian');
      else if (['Bavaria', 'Brandenburg', 'Saxony', 'Austria', 'Bohemia', 'Free City', 'Archbishopric of Cologne'].includes(startingCity.region)) languages.push('German');
      else if (startingCity.region === 'Switzerland') languages.push('German', 'French');
      else if (startingCity.region.includes('Sweden') || startingCity.region.includes('Denmark') || startingCity.region.includes('Norway')) languages.push('Norse');
      else if (startingCity.region.includes('Poland')) languages.push('Polish');
      else if (startingCity.region.includes('Hungary')) languages.push('Hungarian');

      const newPlayer: Player = {
        name,
        profession,
        stats,
        gender,
        age,
        religion,
        socialClass,
        journeyReason,
        startingCity: startingCity.name,
        startingRegion: startingCity.region,
        distanceToRome: startingCity.distance,
        routeCheckpoints: generateRouteCheckpoints(startingCity),
        reputation,
        languages,
        background: stats.description
      };

      // Create a family with personality traits
      const traits = ['brave', 'cautious', 'optimistic', 'pessimistic', 'faithful', 'pragmatic', 'protective', 'independent'];
      const lastName = getRandomItem(FRENCH_LAST_NAMES);

      // Create appropriate spouse based on player's gender
      const spouseNames = gender === 'Male' ? FRENCH_FEMALE_NAMES : FRENCH_MALE_NAMES;
      const spouseAge = age + Math.floor(Math.random() * 11) - 5; // Spouse is around same age (+/- 5 years)
      const spouse: PartyMember = {
        name: getRandomItem(spouseNames) + ' ' + lastName,
        role: 'spouse',
        age: Math.max(18, Math.min(60, spouseAge)), // Keep within reasonable bounds
        health: INITIAL_HEALTH,
        conditions: [],
        injuries: [],
        relationship: 75 + Math.floor(Math.random() * 20), // 75-95 (family should start with good relationship)
        mood: 'hopeful',
        trust: 75 + Math.floor(Math.random() * 20), // 75-95
        personalityTrait: getRandomItem(traits)
      };

      // Random child gender
      const childGender = Math.random() > 0.5 ? 'Male' : 'Female';
      const childNames = childGender === 'Male' ? FRENCH_MALE_NAMES : FRENCH_FEMALE_NAMES;
      const childAge = 5 + Math.floor(Math.random() * 10); // Children are 5-14 years old
      const child: PartyMember = {
        name: getRandomItem(childNames) + ' ' + lastName,
        role: 'child',
        age: childAge,
        health: INITIAL_HEALTH,
        conditions: [],
        injuries: [],
        relationship: 70 + Math.floor(Math.random() * 22), // 70-92 (children might be slightly more variable)
        mood: 'content',
        trust: 70 + Math.floor(Math.random() * 20), // 70-90
        personalityTrait: getRandomItem(traits)
      };

      const party = [spouse, child];

      // Add role-specific party members for nobles/royalty
      if (profession === 'Royal' || profession === 'Noble Woman') {
        // Add Royal Guard(s)
        const guardAge = 25 + Math.floor(Math.random() * 20); // 25-45 years old
        const guardGender = Math.random() > 0.5 ? 'Male' : 'Female';
        const guardNames = guardGender === 'Male' ? FRENCH_MALE_NAMES : FRENCH_FEMALE_NAMES;
        const guard: PartyMember = {
          name: getRandomItem(guardNames) + ' ' + getRandomItem(FRENCH_LAST_NAMES),
          role: 'royal guard',
          age: guardAge,
          health: INITIAL_HEALTH + 10, // Guards start with slightly more health
          conditions: [],
          injuries: [],
          relationship: 65 + Math.floor(Math.random() * 15), // 65-80 (professional relationship)
          mood: 'content',
          trust: 70 + Math.floor(Math.random() * 20), // 70-90
          personalityTrait: Math.random() > 0.6 ? 'brave' : (Math.random() > 0.5 ? 'protective' : 'pragmatic')
        };
        party.push(guard);

        // Add Valet/Servant
        const valetAge = 20 + Math.floor(Math.random() * 25); // 20-45 years old
        const valetGender = Math.random() > 0.5 ? 'Male' : 'Female';
        const valetNames = valetGender === 'Male' ? FRENCH_MALE_NAMES : FRENCH_FEMALE_NAMES;
        const valetRole = valetGender === 'Male' ? 'valet-de-chambre' : 'lady\'s maid';
        const valet: PartyMember = {
          name: getRandomItem(valetNames) + ' ' + getRandomItem(FRENCH_LAST_NAMES),
          role: valetRole,
          age: valetAge,
          health: INITIAL_HEALTH,
          conditions: [],
          injuries: [],
          relationship: 60 + Math.floor(Math.random() * 20), // 60-80 (servant relationship)
          mood: 'hopeful',
          trust: 65 + Math.floor(Math.random() * 20), // 65-85
          personalityTrait: Math.random() > 0.5 ? 'cautious' : (Math.random() > 0.5 ? 'faithful' : 'optimistic')
        };
        party.push(valet);
      }

      // Use the year from character creation, generate random start month in spring
      const month = Math.floor(Math.random() * 3) + 3; // March (3), April (4), or May (5)
      const daysInMonth = month === 3 || month === 5 ? 31 : 30;
      const dayOfMonth = Math.floor(Math.random() * daysInMonth) + 1;
      const startSeason = getSeasonFromMonth(month);

      // Determine if player has a wagon based on oxen
      const hasWagon = stats.oxen >= 2;

      // Determine transportation based on profession/ducats
      const transportation =
        profession === 'Royal' || profession === 'Noble Woman' ? 'Royal Procession' :
        stats.ducats >= 500 ? 'Carriage' :
        stats.ducats >= 350 ? 'Wagon' :
        stats.ducats >= 275 ? 'Horse' : 'On Foot';

      // Set initial ammunition based on profession
      const initialAmmunition = profession === Profession.Soldier ? 20 : profession === Profession.Royal ? 15 : 10;

      const newGameState: GameState = {
        day: 1,
        year: year,
        month: month,
        dayOfMonth: dayOfMonth,
        distanceTraveled: 0,
        distanceToRome: startingCity.distance, // Use actual distance from starting city
        health: INITIAL_HEALTH,
        food: stats.food,
        ducats: stats.ducats,
        oxen: stats.oxen,
        stamina: INITIAL_STAMINA,
        ammunition: initialAmmunition,
        hasWagon: hasWagon,
        transportation: transportation,
        inventory: { ...stats.inventory },
        conditions: [],
        injuries: [],
        phase: 'traveling',
        party: party,
        currentLocation: null,
        weather: 'Clear',
        season: startSeason,
        terrain: 'Farmland', // Starting terrain
        equipment: { ...PROFESSION_EQUIPMENT[profession] },
        skills: { ...PROFESSION_SKILLS[profession] },
        rationLevel: 'normal', // Default to normal rations
        weeklyFocus: 'normal', // Default to normal travel focus
        buffs: [], // No initial buffs
      };

      setPlayer(newPlayer);
      setGameState(newGameState);

      try {
        const imageUrl = await generateCharacterImage(newPlayer);
        setCharacterImageUrl(imageUrl);
      } catch (error) {
        console.error("Failed to generate character image:", error);
        // Image will be handled by the sprite system
      }

      setScreen('game');
    } catch (error) {
      console.error("Error creating character:", error);
      alert("There was an error creating your character. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleGameEnd = (message: string, victory: boolean) => {
    setEndMessage({ message, victory });
    setScreen('end');
  };

  const handleRestart = () => {
    setScreen('start');
    setPlayer(null);
    setGameState(null);
    setCharacterImageUrl('');
    setEndMessage({ message: '', victory: false });
  };

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen onRandomStart={handleRandomStart} onCustomStart={handleCustomStart} onDevModeChange={setDevMode} />;
      case 'create-random':
        return <CharacterCreationScreen onCreate={handleCharacterCreate} isLoading={isCreating} mode="random" year={gameYear} difficulty={difficulty} />;
      case 'create-custom':
        return <CharacterCreationScreen onCreate={handleCharacterCreate} isLoading={isCreating} mode="custom" year={gameYear} difficulty={difficulty} />;
      case 'game':
        if (player && gameState) {
          return <GameUI player={player} initialGameState={gameState} characterImageUrl={characterImageUrl} onGameEnd={handleGameEnd} onRestartRun={handleRestart} devMode={devMode} />;
        }
        return <p>Loading game...</p>;
      case 'end':
        return <EndScreen message={endMessage.message} victory={endMessage.victory} onRestart={handleRestart} />;
      default:
        return <StartScreen onRandomStart={handleRandomStart} onCustomStart={handleCustomStart} onDevModeChange={setDevMode} />;
    }
  };

  return (
    <main className="min-h-screen bg-stone-900 text-gray-200 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('/background.jpg')"}}></div>
      <div className="container mx-auto max-w-7xl z-10">
        <div key={screen} className="animate-fade-in">
          {renderScreen()}
        </div>
      </div>
    </main>
  );
}

export default App;
