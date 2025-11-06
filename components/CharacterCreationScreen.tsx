import React, { useState } from 'react';
import { Profession } from '../types';
import { PROFESSION_STATS } from '../constants';
import ActionButton from './ActionButton';
import LoadingSpinner from './LoadingSpinner';

interface CharacterCreationScreenProps {
  onCreate: (name: string, profession: Profession) => void;
  isLoading: boolean;
}

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onCreate, isLoading }) => {
  const [name, setName] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);

  const handleCreate = () => {
    if (name.trim() && selectedProfession && !isLoading) {
      onCreate(name, selectedProfession);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  return (
    <div className="bg-stone-800/80 p-8 border-4 border-amber-500 shadow-lg text-center backdrop-blur-sm rounded-xl">
      <h1 className="text-4xl text-amber-300 mb-6 tracking-wider">Create Your Traveller</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-xl mb-2 text-amber-200">What is your name?</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-sm mx-auto bg-stone-900 border-2 border-amber-400 text-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 rounded-md"
            required
            maxLength={20}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="profession" className="block text-xl mb-2 text-amber-200">What is your profession?</label>
          <select
            id="profession"
            value={selectedProfession || ''}
            onChange={(e) => setSelectedProfession(e.target.value as Profession)}
            disabled={isLoading}
            className="w-full max-w-sm mx-auto bg-stone-900 border-2 border-amber-400 text-amber-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 rounded-md"
          >
            <option value="" disabled>-- Select a Profession --</option>
            {Object.values(Profession).map((prof) => (
              <option key={prof} value={prof}>{prof}</option>
            ))}
          </select>
          {selectedProfession && (
            <p className="text-sm mt-3 text-amber-100 max-w-sm mx-auto">{PROFESSION_STATS[selectedProfession].description}</p>
          )}
        </div>
        
        <div className="pt-2">
          {isLoading ? (
              <div className="flex items-center justify-center h-10">
                  <LoadingSpinner />
                  <span className="ml-4 text-amber-300">The Fates are preparing your likeness...</span>
              </div>
          ) : (
              <ActionButton onClick={handleCreate} disabled={!name.trim() || !selectedProfession}>
                  Begin the Journey
              </ActionButton>
          )}
        </div>
      </form>
    </div>
  );
};

export default CharacterCreationScreen;