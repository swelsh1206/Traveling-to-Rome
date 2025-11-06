
import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import GameUI from './components/GameUI';
import EndScreen from './components/EndScreen';
import { Player, GameState, Profession, PartyMember } from './types';
import { PROFESSION_STATS, TOTAL_DISTANCE_TO_ROME, INITIAL_HEALTH, FRENCH_MALE_NAMES, FRENCH_FEMALE_NAMES, FRENCH_LAST_NAMES } from './constants';
import { generateCharacterImage } from './services/geminiService';

type GameScreen = 'start' | 'create' | 'game' | 'end';

const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [characterImageUrl, setCharacterImageUrl] = useState<string>('');
  const [endMessage, setEndMessage] = useState({ message: '', victory: false });
  const [isCreating, setIsCreating] = useState(false);

  const handleStart = () => {
    setScreen('create');
  };

  const handleCharacterCreate = async (name: string, profession: Profession) => {
    setIsCreating(true);
    const stats = PROFESSION_STATS[profession];
    const newPlayer: Player = { name, profession, stats };

    // Create a family
    const lastName = getRandomItem(FRENCH_LAST_NAMES);
    const spouse: PartyMember = { name: getRandomItem(FRENCH_FEMALE_NAMES) + ' ' + lastName, health: INITIAL_HEALTH, conditions: [] };
    const child: PartyMember = { name: getRandomItem(FRENCH_MALE_NAMES) + ' ' + lastName, health: INITIAL_HEALTH, conditions: [] };
    const party = [spouse, child];

    const newGameState: GameState = {
      day: 1,
      distanceTraveled: 0,
      distanceToRome: TOTAL_DISTANCE_TO_ROME,
      health: INITIAL_HEALTH,
      food: stats.food,
      money: stats.money,
      oxen: stats.oxen,
      inventory: { ...stats.inventory },
      conditions: [],
      phase: 'traveling',
      party: party,
      currentLocation: null,
    };

    setPlayer(newPlayer);
    setGameState(newGameState);

    try {
      const imageUrl = await generateCharacterImage(newPlayer);
      setCharacterImageUrl(imageUrl);
    } catch (error) {
      console.error("Failed to generate character image:", error);
      setCharacterImageUrl('placeholder.png'); // Fallback image
    } finally {
      setIsCreating(false);
      setScreen('game');
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
        return <StartScreen onStart={handleStart} />;
      case 'create':
        return <CharacterCreationScreen onCreate={handleCharacterCreate} isLoading={isCreating} />;
      case 'game':
        if (player && gameState) {
          return <GameUI player={player} initialGameState={gameState} characterImageUrl={characterImageUrl} onGameEnd={handleGameEnd} onRestartRun={handleRestart} />;
        }
        return <p>Loading game...</p>;
      case 'end':
        return <EndScreen message={endMessage.message} victory={endMessage.victory} onRestart={handleRestart} />;
      default:
        return <StartScreen onStart={handleStart} />;
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
