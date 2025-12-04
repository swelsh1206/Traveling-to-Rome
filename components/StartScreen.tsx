
import React, { useState } from 'react';
import ActionButton from './ActionButton';

interface StartScreenProps {
  onRandomStart: (year: number) => void;
  onCustomStart: (year: number) => void;
  onDevModeChange?: (enabled: boolean) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onRandomStart, onCustomStart, onDevModeChange }) => {
  const [devPassword, setDevPassword] = useState('');
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [revealedYear, setRevealedYear] = useState<number | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setDevPassword(value);
    if (value === 'SEANW') {
      setDevModeEnabled(true);
      onDevModeChange?.(true);
    } else {
      setDevModeEnabled(false);
      onDevModeChange?.(false);
    }
  };

  const handleWriteWill = () => {
    setShowWelcome(false);
    setShowDiceRoll(true);
    setDiceRolling(true);

    // Roll a random year between 1450-1800
    setTimeout(() => {
      const year = Math.floor(Math.random() * 351) + 1450;
      setRevealedYear(year);
      setDiceRolling(false);
    }, 2500); // 2.5 seconds of dice rolling
  };

  // Welcome screen
  if (showWelcome) {
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden flex items-center justify-center p-4">
        {/* Background Image */}
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: 'url(/countryside-background.jpg)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.1)',
            width: '100vw',
            height: '100vh'
          }}
        />

        {/* Content Overlay */}
        <div className="relative z-10 bg-stone-900/85 p-12 border-4 border-amber-600 shadow-2xl text-center backdrop-blur-md rounded-xl max-w-4xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-7xl text-amber-300 mb-4 tracking-wider font-bold animate-slide-in drop-shadow-lg">Le Chemin de Rome</h1>
            <p className="text-3xl text-amber-200 mb-2 italic">The Road to Rome</p>
            <p className="text-sm text-gray-400">A Pilgrimage Through History</p>
          </div>

          <div className="max-w-2xl mx-auto mb-12 space-y-6">
            <div className="bg-black/40 p-6 rounded-lg border border-amber-700/50">
              <p className="text-lg text-gray-200 leading-relaxed mb-4">
                From somewhere in Europe, you prepare for a journey to Rome—the Eternal City, seat of the Church.
                Between you and your destination lie countless dangers: treacherous mountain passes, dangerous territories, war-ravaged lands, and the ever-present threat of disease.
              </p>
              <p className="text-lg text-gray-200 leading-relaxed mb-4">
                Before such a perilous journey, a prudent traveler sets their affairs in order.
                Many who set out for the Holy City never return—lost to illness, violence, or misfortune on the road.
              </p>
              <p className="text-lg text-amber-200 leading-relaxed font-semibold">
                It is customary to write your will before embarking. If you should fail, who will remember your name?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 text-gray-300 text-sm">
              <span>✝️ Faith</span>
              <span>•</span>
              <span>🗡️ Survival</span>
              <span>•</span>
              <span>👥 Family</span>
              <span>•</span>
              <span>🙏 Providence</span>
            </div>
          </div>

          <button
            onClick={handleWriteWill}
            className="px-12 py-4 bg-gradient-to-r from-amber-600 to-amber-700 border-3 border-amber-400 text-white hover:from-amber-500 hover:to-amber-600 transition-all rounded-lg font-bold text-xl shadow-2xl hover:scale-105 hover:shadow-amber-500/50"
          >
            WRITE YOUR WILL.
          </button>

          <p className="text-xs text-gray-400 mt-8">
            Manage your resources • Endure hardships • Pray to God
          </p>

          {/* DEV MODE Password Input */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={devPassword}
                onChange={handlePasswordChange}
                placeholder="DEV"
                className="w-16 px-2 py-1 bg-stone-900/50 border border-stone-600 rounded text-xs text-gray-400 focus:outline-none focus:border-amber-500"
              />
              {devModeEnabled && (
                <span className="text-xs text-green-400 font-bold">✓ DEV</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dice rolling screen
  if (showDiceRoll) {
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden flex items-center justify-center p-4">
        {/* Background Image */}
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: 'url(/countryside-background.jpg)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.1)',
            width: '100vw',
            height: '100vh'
          }}
        />

        {/* Content Overlay */}
        <div className="relative z-10 bg-stone-900/90 p-16 border-4 border-amber-600 shadow-2xl text-center backdrop-blur-md rounded-xl max-w-2xl mx-auto">
          {diceRolling ? (
            <>
              <h2 className="text-5xl text-amber-300 mb-8 font-bold">God Decides...</h2>
              <div className="text-9xl mb-8 animate-bounce">🎲</div>
              <p className="text-xl text-gray-300">Rolling the dice of history...</p>
            </>
          ) : revealedYear ? (
            <>
              <h2 className="text-5xl text-amber-300 mb-8 font-bold animate-fade-in">Your Journey Begins</h2>
              <div className="mb-8">
                <p className="text-3xl text-gray-300 mb-4">Anno Domini</p>
                <p className="text-8xl text-amber-400 font-bold mb-4 animate-slide-in">{revealedYear}</p>
              </div>
              <p className="text-lg text-gray-200 mb-8 leading-relaxed">
                The year is {revealedYear}. Your journey to Rome awaits.
              </p>
              <button
                onClick={() => setShowDiceRoll(false)}
                className="px-10 py-4 bg-gradient-to-r from-amber-600 to-amber-700 border-3 border-amber-400 text-white hover:from-amber-500 hover:to-amber-600 transition-all rounded-lg font-bold text-xl shadow-2xl hover:scale-105"
              >
                Continue
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // Character selection screen
  return (
    <div className="bg-stone-800/80 p-10 border-4 border-amber-500 shadow-lg text-center backdrop-blur-sm rounded-xl max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-6xl text-amber-300 mb-4 tracking-wider font-bold">Le Chemin de Rome</h1>
      <p className="text-2xl text-amber-200 mb-8 italic">The Road to Rome</p>

      <div className="max-w-2xl mx-auto mb-10 space-y-4">
        <p className="text-lg text-gray-300 leading-relaxed">
          Choose how your journey begins. Will you let God shape your path,
          or will you forge your own destiny?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
        {/* Random Start Mode */}
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 border-purple-500/50 rounded-xl p-6 hover:border-purple-400 transition-all hover:scale-105 cursor-pointer group" onClick={() => onRandomStart(revealedYear!)}>
          <div className="text-4xl mb-3">🙏</div>
          <h3 className="text-2xl text-purple-300 font-bold mb-3">God's Will</h3>
          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            Trust in God. Your name, profession, gender, and starting resources will be assigned at random.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <span className="bg-purple-600/30 px-2 py-1 rounded text-purple-200">Quick Start</span>
            <span className="bg-purple-600/30 px-2 py-1 rounded text-purple-200">Unpredictable</span>
            <span className="bg-purple-600/30 px-2 py-1 rounded text-purple-200">Fateful</span>
          </div>
          <button className="mt-4 w-full px-6 py-3 bg-purple-600 border-2 border-purple-400 text-white hover:bg-purple-500 transition-colors rounded-lg font-bold text-lg group-hover:scale-105">
            Accept Your Fate
          </button>
        </div>

        {/* Custom Mode */}
        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-2 border-amber-500/50 rounded-xl p-6 hover:border-amber-400 transition-all hover:scale-105 cursor-pointer group" onClick={() => onCustomStart(revealedYear!)}>
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="text-2xl text-amber-300 font-bold mb-3">Custom Mode</h3>
          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            Forge your own path. Choose your name, gender, profession, age, and customize your character's background.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <span className="bg-amber-600/30 px-2 py-1 rounded text-amber-200">Personalized</span>
            <span className="bg-amber-600/30 px-2 py-1 rounded text-amber-200">Strategic</span>
            <span className="bg-amber-600/30 px-2 py-1 rounded text-amber-200">Roleplay</span>
          </div>
          <button className="mt-4 w-full px-6 py-3 bg-amber-600 border-2 border-amber-400 text-white hover:bg-amber-500 transition-colors rounded-lg font-bold text-lg group-hover:scale-105">
            Create Character
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Manage your resources • Endure hardships • Pray to God
      </p>

      {/* DEV MODE Password Input */}
      <div className="absolute bottom-4 right-4">
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={devPassword}
            onChange={handlePasswordChange}
            placeholder="DEV"
            className="w-16 px-2 py-1 bg-stone-900/50 border border-stone-600 rounded text-xs text-gray-400 focus:outline-none focus:border-amber-500"
          />
          {devModeEnabled && (
            <span className="text-xs text-green-400 font-bold">✓ DEV</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartScreen;