
import React from 'react';
import ActionButton from './ActionButton';

interface EndScreenProps {
  message: string;
  victory: boolean;
  onRestart: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ message, victory, onRestart }) => {
  return (
    <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg text-center animate-fade-in backdrop-blur-sm rounded-xl">
      <h1 className={`text-5xl mb-4 tracking-wider ${victory ? 'text-green-400' : 'text-red-500'}`}>
        {victory ? 'Victory!' : 'Journey\'s End'}
      </h1>
      <p className="text-xl text-amber-200 mb-8">{message}</p>
      <ActionButton onClick={onRestart}>
        Begin Anew
      </ActionButton>
    </div>
  );
};

export default EndScreen;