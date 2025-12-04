import React, { useState } from 'react';
import ModalWindow from './ModalWindow';

interface SettingsMenuProps {
  onRestartRun?: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onRestartRun }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'references' | 'context' | 'about'>('menu');

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
          <div className="flex gap-2 mb-4 border-b border-amber-600/30 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'menu'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500'
                  : 'text-gray-400 hover:text-amber-200'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('context')}
              className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'context'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500'
                  : 'text-gray-400 hover:text-amber-200'
              }`}
            >
              Context
            </button>
            <button
              onClick={() => setActiveTab('references')}
              className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'references'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500'
                  : 'text-gray-400 hover:text-amber-200'
              }`}
            >
              References
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
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

          {activeTab === 'context' && (
            <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto">
              <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
                <h3 className="text-lg text-amber-200 font-bold mb-2">Early Modern Europe (Based on Merry Wiesner-Hanks)</h3>
                <p className="text-gray-300 text-xs italic mb-3">
                  Historical context drawn from academic perspectives on Early Modern European social, economic, and cultural history.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1450-1500 */}
                <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-600/30">
                  <h4 className="text-purple-300 font-bold mb-2">📜 1450-1500: Demographic Recovery & Economic Expansion</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    Europe recovers from plague's demographic catastrophe. Population growth drives economic expansion; Italian city-states dominate Mediterranean trade; printing revolutionizes information exchange.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Urban populations grow; guild systems regulate craft production</li>
                    <li>Merchant banking families (Medici, Fugger) finance princes and popes</li>
                    <li>Print culture transforms literacy and religious practice</li>
                    <li>Marriage patterns shift as economic opportunities expand</li>
                  </ul>
                </div>

                {/* 1500-1560 */}
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-600/30">
                  <h4 className="text-blue-300 font-bold mb-2">⛪ 1500-1560: Religious Fragmentation & Social Upheaval</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    Protestant movements shatter Western Christianity's unity. Peasant rebellions challenge social hierarchies; confessional divisions reshape political allegiances.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Luther's theology spreads via print; vernacular Bible reading increases</li>
                    <li>1525 Peasants' War: largest uprising in German history before 1848</li>
                    <li>Women's religious roles debated and restricted across confessions</li>
                    <li>Anabaptists persecuted by both Catholics and mainstream Protestants</li>
                  </ul>
                </div>

                {/* 1560-1618 */}
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-600/30">
                  <h4 className="text-green-300 font-bold mb-2">👑 1560-1618: Confessional State Formation</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    Rulers consolidate power through bureaucracy and confessional identity. Religious divisions harden into political-military alliances.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Parish registers track births, marriages, deaths for state control</li>
                    <li>Confessional loyalty becomes marker of political reliability</li>
                    <li>French Wars of Religion devastate countryside; traveling dangerous</li>
                    <li>Spanish Netherlands revolt combines religious and political grievances</li>
                  </ul>
                </div>

                {/* 1618-1650 */}
                <div className="bg-red-900/20 p-3 rounded-lg border border-red-600/30">
                  <h4 className="text-red-300 font-bold mb-2">⚔️ 1618-1650: Thirty Years' War Catastrophe</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    Military conflict, famine, and disease cause demographic catastrophe in Central Europe. Mercenary soldiers often unpaid; pillaging sustains armies.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Village populations decimated; some areas lose 40-60% of inhabitants</li>
                    <li>Soldiers' wives follow armies; camp communities form mobile societies</li>
                    <li>Breakdown of social order; banditry and desertion endemic</li>
                    <li>Travel extremely dangerous; roads contested by armed groups</li>
                  </ul>
                </div>

                {/* 1650-1700 */}
                <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-600/30">
                  <h4 className="text-yellow-300 font-bold mb-2">☀️ 1650-1700: State Building & Mercantilism</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    European powers expand overseas colonies; absolutist monarchies centralize authority through bureaucracy and standing armies.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Tax collection systems expand; resistance persists in countryside</li>
                    <li>Colonial trade enriches merchant classes; sugar, tobacco, slaves</li>
                    <li>Court culture at Versailles sets European fashion standards</li>
                    <li>Religious minorities face renewed persecution; mass migrations occur</li>
                  </ul>
                </div>

                {/* 1700-1750 */}
                <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-600/30">
                  <h4 className="text-indigo-300 font-bold mb-2">📚 1700-1750: Consumer Culture & Atlantic Economy</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    Coffee houses spread; colonial trade creates new consumer goods. Enlightenment salons challenge traditional authorities.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Print culture expands; newspapers and periodicals proliferate</li>
                    <li>New commodities (coffee, tea, chocolate) reshape daily life</li>
                    <li>Women participate in Enlightenment salons but excluded from academies</li>
                    <li>Banking systems develop; credit and debt become widespread</li>
                  </ul>
                </div>

                {/* 1750-1800 */}
                <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-600/30">
                  <h4 className="text-orange-300 font-bold mb-2">🔥 1750-1800: Enlightenment & Agrarian Change</h4>
                  <p className="text-gray-300 text-xs mb-2">
                    Population growth accelerates; proto-industrialization transforms rural economies. Political challenges to Old Regime emerge.
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                    <li>Agricultural improvements increase food production; enclosure movements</li>
                    <li>Cottage industries spread; women and children central to production</li>
                    <li>Migration to cities accelerates; urban poor populations grow</li>
                    <li>Revolutionary ideas circulate; critiques of monarchy and privilege</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'references' && (
            <div className="space-y-6 text-sm max-h-[70vh] overflow-y-auto">
              <div className="bg-stone-700/30 p-4 rounded-lg border border-amber-600/20">
                <h3 className="text-lg text-amber-200 font-bold mb-2">📚 Academic Sources & References</h3>
                <p className="text-gray-300 text-xs italic mb-3">
                  This game draws upon academic research and primary sources to recreate authentic Early Modern European travel experiences.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-300 font-bold mb-2">Coryat's Crudities</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Thomas Coryat's 1611 travel account through France, Italy, and Germany. Provides vivid observations on customs, food, accommodations, and the practicalities of Early Modern travel.
                  </p>
                </div>

                <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-300 font-bold mb-2">Michel de Montaigne's Journal</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    The French philosopher's travel journal (1580-1581) documenting his journey through France, Switzerland, Germany, and Italy. Offers intimate perspectives on Early Modern travel conditions and experiences.
                  </p>
                </div>

                <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-300 font-bold mb-2">Merry Wiesner-Hanks' <em>Early Modern Europe</em></h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Comprehensive academic survey of Early Modern European social, economic, and cultural history. Essential context for understanding the period's daily life, social structures, and historical developments.
                  </p>
                </div>

                <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-300 font-bold mb-2">Benvenuto Cellini's Autobiography</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    The famous Renaissance artist and goldsmith's vivid autobiography includes detailed accounts of his travels through Italy and France, providing insight into the experiences of skilled craftsmen moving between European cities.
                  </p>
                </div>

                <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-300 font-bold mb-2">Gabor Gelleri's <em>From Touring to Training</em></h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Academic study examining the evolution and purposes of early modern travel, from educational tours to professional training journeys, illuminating the diverse motivations behind European travel during this period.
                  </p>
                </div>

                <div className="bg-stone-700/20 p-4 rounded-lg border border-amber-600/10">
                  <h4 className="text-amber-300 font-bold mb-2">Daniel Margocsy's <em>The Fuzzy Metrics of Money</em></h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    <span className="font-semibold">Full title:</span> "The finances of travel and the reception of curiosities in early modern Europe."
                    <br /><br />
                    Scholarly examination of the economic dimensions of early modern travel, exploring how travelers financed their journeys and the complex monetary systems they navigated across different European territories.
                  </p>
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
                  A historically-inspired survival journey through Early Modern Europe (1450-1800). Navigate treacherous roads, manage resources, and guide your family safely to Rome through an era of plague, war, and upheaval.
                </p>
              </div>

              <div className="bg-stone-700/20 p-3 rounded-lg border border-amber-600/10">
                <h4 className="text-amber-200 font-bold mb-2">Game Features</h4>
                <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                  <li>Dynamic AI-generated events tailored to your profession and era</li>
                  <li>Authentic historical dates and context spanning 350 years (1450-1800)</li>
                  <li>Family relationship and trust systems</li>
                  <li>Profession-based abilities and storylines</li>
                  <li>Resource management and survival mechanics</li>
                  <li>Historical events that shape your journey</li>
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
