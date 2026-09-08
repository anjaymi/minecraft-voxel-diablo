import React, { useState } from 'react';
import { Player } from '../types';
import { X, Hammer, FlaskConical, Sparkles } from 'lucide-react';
import { CampBlacksmithTab } from './camp/CampBlacksmithTab';
import { CampAlchemistTab } from './camp/CampAlchemistTab';
import { CampEnchanterTab } from './camp/CampEnchanterTab';

interface CampHubModalProps {
  player: Player;
  onClose: () => void;
  onEnchantAdded: (name: string) => void;
}

export const CampHubModal: React.FC<CampHubModalProps> = ({ player, onClose, onEnchantAdded }) => {
  const [activeTab, setActiveTab] = useState<'blacksmith' | 'alchemist' | 'enchanter'>('blacksmith');
  const [, setForceUpdate] = useState(0);

  const refreshState = () => setForceUpdate((prev) => prev + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md p-2 sm:items-center sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-xl border-2 border-amber-600/70 bg-gradient-to-b from-stone-900 to-stone-950 p-4 sm:p-6 shadow-2xl text-stone-100 flex flex-col gap-4 sm:gap-5 max-h-[94vh] max-h-[94dvh] sm:max-h-[90vh] max-h-[90dvh] overflow-y-auto safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏕️</span>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-amber-300">
                村民避难所营地 (Village Campfire Hub)
              </h2>
              <p className="text-xs text-stone-400">
                在安全篝火旁修整补给，消耗绿宝石升级法杖重刃、购买秘药或祈愿全职业神级词条
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 font-bold text-emerald-300 text-sm font-mono">
              <span>💎</span>
              <span>{player.stats.emeralds} 绿宝石</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-700 bg-stone-800 p-1.5 text-stone-400 hover:text-white hover:bg-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800">
          <button
            onClick={() => setActiveTab('blacksmith')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'blacksmith'
                ? 'border-amber-400 text-amber-300 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Hammer className="h-4 w-4" />
            <span>铁匠工坊 (Blacksmith)</span>
          </button>
          <button
            onClick={() => setActiveTab('alchemist')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'alchemist'
                ? 'border-rose-400 text-rose-300 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>炼金药剂师 (Alchemist)</span>
          </button>
          <button
            onClick={() => setActiveTab('enchanter')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'enchanter'
                ? 'border-purple-400 text-purple-300 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>远古附魔台 (Enchanting)</span>
          </button>
        </div>

        {/* Active Tab View */}
        {activeTab === 'blacksmith' && (
          <CampBlacksmithTab player={player} onRefresh={refreshState} />
        )}
        {activeTab === 'alchemist' && (
          <CampAlchemistTab player={player} onRefresh={refreshState} />
        )}
        {activeTab === 'enchanter' && (
          <CampEnchanterTab
            player={player}
            onEnchantAdded={onEnchantAdded}
            onRefresh={refreshState}
          />
        )}

        <div className="flex justify-end pt-2 border-t border-stone-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-800 hover:bg-stone-700 px-5 py-2 text-xs font-bold text-stone-200"
          >
            返回地牢冒险
          </button>
        </div>
      </div>
    </div>
  );
};
