
import React from 'react';
import ActionButton from './ActionButton';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg text-center backdrop-blur-sm rounded-xl">
      <h1 className="text-6xl text-amber-300 mb-4 tracking-wider">Le Chemin de Rome</h1>
      <p className="text-xl text-amber-200 mb-8">The Road to Rome</p>
      <p className="max-w-xl mx-auto text-lg text-gray-300 mb-10">
        It is the 17th century. You must journey from the heart of France to the eternal city of Rome.
        Manage your resources, endure the hardships of the road, and pray you survive the journey.
      </p>
      <ActionButton onClick={onStart}>
        Begin Journey
      </ActionButton>
    </div>
  );
};

export default StartScreen;