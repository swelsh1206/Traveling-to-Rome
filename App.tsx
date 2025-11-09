
import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import GameUI from './components/GameUI';
import EndScreen from './components/EndScreen';
import { Player, GameState, Profession, PartyMember, Gender } from './types';
import { PROFESSION_STATS, PROFESSION_EQUIPMENT, PROFESSION_SKILLS, TOTAL_DISTANCE_TO_ROME, INITIAL_HEALTH, INITIAL_STAMINA, FRENCH_MALE_NAMES, FRENCH_FEMALE_NAMES, FRENCH_LAST_NAMES } from './constants';
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

  const handleRandomStart = () => {
    setScreen('create-random');
  };

  const handleCustomStart = () => {
    setScreen('create-custom');
  };

  const handleCharacterCreate = async (name: string, profession: Profession, gender: Gender) => {
    try {
      setIsCreating(true);
      const stats = PROFESSION_STATS[profession];

      // Generate player attributes
      const age = 25 + Math.floor(Math.random() * 20); // 25-44 years old
      const religion = 'Catholic'; // Default for France in this period
      const socialClass = profession === 'Royal' || profession === 'Noble Woman'
        ? 'High Nobility'
        : profession === 'Merchant' || profession === 'Merchant_F'
        ? 'Merchant Class'
        : profession === 'Soldier' || profession === 'Blacksmith'
        ? 'Craftsman'
        : 'Craftsman';

      const pilgrimageReasons = ['Seeking Salvation', 'Penance for Sins', 'Cure for Illness', 'Political Refuge', 'Trade Opportunity', 'Scholarly Research', 'Family Vow', 'Escaping Persecution'] as const;
      const pilgrimageReason = getRandomItem(pilgrimageReasons as any);

      const reputation = 50; // Start neutral
      const languages = ['French', 'Latin']; // Common for educated pilgrims

      const newPlayer: Player = {
        name,
        profession,
        stats,
        gender,
        age,
        religion,
        socialClass,
        pilgrimageReason,
        startingCity: 'Paris', // Will be set from character generation
        reputation,
        languages,
        background: stats.description
      };

      // Create a family with personality traits
      const traits = ['brave', 'cautious', 'optimistic', 'pessimistic', 'faithful', 'pragmatic', 'protective', 'independent'];
      const lastName = getRandomItem(FRENCH_LAST_NAMES);

      // Create appropriate spouse based on player's gender
      const spouseNames = gender === 'Male' ? FRENCH_FEMALE_NAMES : FRENCH_MALE_NAMES;
      const spouse: PartyMember = {
        name: getRandomItem(spouseNames) + ' ' + lastName,
        role: 'spouse',
        health: INITIAL_HEALTH,
        conditions: [],
        relationship: 75 + Math.floor(Math.random() * 20), // 75-95 (family should start with good relationship)
        mood: 'hopeful',
        trust: 75 + Math.floor(Math.random() * 20), // 75-95
        personalityTrait: getRandomItem(traits)
      };

      // Random child gender
      const childGender = Math.random() > 0.5 ? 'Male' : 'Female';
      const childNames = childGender === 'Male' ? FRENCH_MALE_NAMES : FRENCH_FEMALE_NAMES;
      const child: PartyMember = {
        name: getRandomItem(childNames) + ' ' + lastName,
        role: 'child',
        health: INITIAL_HEALTH,
        conditions: [],
        relationship: 70 + Math.floor(Math.random() * 22), // 70-92 (children might be slightly more variable)
        mood: 'content',
        trust: 70 + Math.floor(Math.random() * 20), // 70-90
        personalityTrait: getRandomItem(traits)
      };

      const party = [spouse, child];

      // Generate random start date in Early Modern period (1450-1650)
      const startDate = generateRandomStartDate();
      const startSeason = getSeasonFromMonth(startDate.month);

      const newGameState: GameState = {
        day: 1,
        year: startDate.year,
        month: startDate.month,
        dayOfMonth: startDate.dayOfMonth,
        distanceTraveled: 0,
        distanceToRome: TOTAL_DISTANCE_TO_ROME,
        health: INITIAL_HEALTH,
        food: stats.food,
        money: stats.money,
        oxen: stats.oxen,
        stamina: INITIAL_STAMINA,
        inventory: { ...stats.inventory },
        conditions: [],
        phase: 'traveling',
        party: party,
        currentLocation: null,
        weather: 'Clear',
        season: startSeason,
        equipment: { ...PROFESSION_EQUIPMENT[profession] },
        skills: { ...PROFESSION_SKILLS[profession] },
        rationLevel: 'normal', // Default to normal rations
        weeklyFocus: 'normal', // Default to normal travel focus
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
        return <CharacterCreationScreen onCreate={handleCharacterCreate} isLoading={isCreating} mode="random" />;
      case 'create-custom':
        return <CharacterCreationScreen onCreate={handleCharacterCreate} isLoading={isCreating} mode="custom" />;
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
