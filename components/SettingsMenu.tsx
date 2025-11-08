import React, { useState } from 'react';
import ModalWindow from './ModalWindow';

interface SettingsMenuProps {
  onRestartRun?: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onRestartRun }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'references' | 'about'>('menu');

  return (
    <>
      {/* Settings Cog Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 p-3 bg-stone-800/80 border-2 border-amber-500/50 rounded-full hover:bg-stone-700/80 hover:border-amber-400 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
        title="Settings & References"
      >
        <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <ModalWindow title="Menu" onClose={() => setIsOpen(false)}>
          <div className="flex gap-4 mb-4 border-b border-amber-600/30 pb-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'menu'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500'
                  : 'text-gray-400 hover:text-amber-200'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('references')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'references'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500'
                  : 'text-gray-400 hover:text-amber-200'
              }`}
            >
              References
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'about'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500'
                  : 'text-gray-400 hover:text-amber-200'
              }`}
            >
              About
            </button>
          </div>

          {activeTab === 'menu' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (onRestartRun && window.confirm('Are you sure you want to restart? All progress will be lost.')) {
                    onRestartRun();
                    setIsOpen(false);
                  }
                }}
                className="w-full p-3 bg-red-600/20 border-2 border-red-500 text-red-300 hover:bg-red-600/40 transition-colors rounded-lg font-semibold"
              >
                Restart Run
              </button>
              <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
                <h3 className="text-amber-200 font-bold mb-2">Controls</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li><kbd className="px-2 py-1 bg-stone-800 border border-amber-600/50 rounded">1-9</kbd> Use numpad actions</li>
                  <li><kbd className="px-2 py-1 bg-stone-800 border border-amber-600/50 rounded">ESC</kbd> Close modals</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'references' && (
            <div className="space-y-6 text-sm max-h-[70vh] overflow-y-auto">
              <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
                <h3 className="text-lg text-amber-200 font-bold mb-2">Primary Sources & Historical References</h3>
                <p className="text-gray-300 text-xs italic mb-3">
                  This game is set in Early Modern Europe (1450-1650). It draws upon authentic sources to recreate the perilous journey from France to Rome through war-torn Europe.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-red-900/20 p-3 rounded-lg border border-red-600/30">
                  <h4 className="text-red-300 font-bold mb-2">⚔️ The Thirty Years' War (1618-1648)</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    One of the most devastating conflicts in European history. By 1640, central Europe had endured 22 years of continuous warfare, famine, and plague.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-2">
                    <li><span className="text-amber-300 font-semibold">Simplicius Simplicissimus</span> (1668) by Hans Jakob Christoffel von Grimmelshausen - Picaresque novel based on the author's experiences as a soldier; vivid descriptions of war's devastation on civilians</li>
                    <li><span className="text-amber-300 font-semibold">Les Misères et les Malheurs de la Guerre</span> (1633) by Jacques Callot - Series of etchings depicting the brutal realities of the Thirty Years' War</li>
                    <li><span className="text-amber-300 font-semibold">Contemporary Chronicles</span> - Numerous diaries, letters, and municipal records documenting pillaging, disease, starvation, and population collapse</li>
                    <li><span className="text-amber-300 font-semibold">Parish Records</span> - Show population declines of 25-40% across affected regions between 1618-1648</li>
                  </ul>
                </div>

                <div className="bg-stone-700/20 p-3 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-200 font-bold mb-2">Early Modern Travel Accounts</h4>
                  <ul className="text-gray-400 text-xs space-y-2">
                    <li><span className="text-amber-300 font-semibold">An Itinerary</span> (1617) by Fynes Moryson - Englishman's detailed 10-year journey through Europe, including practical advice on routes, inns, costs, and dangers</li>
                    <li><span className="text-amber-300 font-semibold">Coryat's Crudities</span> (1611) by Thomas Coryat - Travel account through France, Italy, and Germany with observations on customs, food, and accommodations</li>
                    <li><span className="text-amber-300 font-semibold">A Relation of a Journey</span> (1615) by George Sandys - Account of travels through the Ottoman Empire and Europe</li>
                    <li><span className="text-amber-300 font-semibold">Journal de Voyage</span> (1580-1581) by Michel de Montaigne - French philosopher's travel journal through France, Switzerland, Germany, and Italy</li>
                    <li><span className="text-amber-300 font-semibold">Roma Sotterranea</span> (1632) by Antonio Bosio - Guide to Rome's catacombs and early Christian sites, popular with 17th century pilgrims</li>
                  </ul>
                </div>

                <div className="bg-stone-700/20 p-3 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-200 font-bold mb-2">Historical Context: Game Mechanics</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    Game mechanics are grounded in documented Early Modern realities:
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Travel speeds: 25-35 km/day on foot typical for Early Modern travelers</li>
                    <li>Food costs: Based on market records from 1450-1650; war inflation affects prices</li>
                    <li>Plague outbreaks: Major epidemics documented throughout the period</li>
                    <li>Banditry: Deserters and disbanded soldiers turned brigands</li>
                    <li>Weather: "Little Ice Age" period (1550-1850) with colder conditions</li>
                    <li>Religious conflicts: Reformation, Counter-Reformation, and religious wars</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
                <h3 className="text-lg text-amber-200 font-bold mb-2">Le Chemin de Rome</h3>
                <p className="text-gray-300 text-sm mb-3">
                  The Road to Rome
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  A historically-inspired survival journey through Early Modern Europe (1450-1650). Navigate treacherous roads, manage resources, and guide your family safely to Rome through an era of plague, war, and upheaval.
                </p>
              </div>

              <div className="bg-stone-700/20 p-3 rounded-lg border border-amber-600/10">
                <h4 className="text-amber-200 font-bold mb-2">Game Features</h4>
                <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                  <li>Dynamic AI-generated events tailored to your profession</li>
                  <li>Authentic historical dates and context (1450-1650)</li>
                  <li>Family relationship and trust systems</li>
                  <li>Profession-based abilities and storylines</li>
                  <li>Resource management and survival mechanics</li>
                </ul>
              </div>
            </div>
          )}
        </ModalWindow>
      )}
    </>
  );
};

export default SettingsMenu;
