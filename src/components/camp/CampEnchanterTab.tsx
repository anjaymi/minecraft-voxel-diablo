import React from 'react';
import { Player, EnchantmentChoice } from '../../types';
import { ROGUELIKE_ENCHANTMENTS } from '../../engine/lootSystem';
import { MAGE_ENCHANTMENTS } from '../../engine/mageEnchantments';
import { soundManager } from '../../audio/soundManager';
import { PlusCircle, Sparkles, Wand2 } from 'lucide-react';

interface CampEnchanterTabProps {
  player: Player;
  onEnchantAdded: (name: string) => void;
  onRefresh: () => void;
}

export const CampEnchanterTab: React.FC<CampEnchanterTabProps> = ({
  player,
  onEnchantAdded,
  onRefresh,
}) => {
  // 数值平衡(2026-09): 重复抽中同一词条时，费用按已拥有次数递增
  const ownedCountOf = (id: string): number => {
    const entry = player.enchantments.find((e) => e.id === id);
    return entry ? entry.count : 0;
  };
  const enchantCost = (id: string, baseCost: number): number => baseCost * (1 + ownedCountOf(id));

  const poolMaxCost = (pool: EnchantmentChoice[], baseCost: number): number => {
    let max = baseCost;
    for (const choice of pool) {
      max = Math.max(max, enchantCost(choice.id, baseCost));
    }
    return max;
  };

  const buyEnchantment = (pool: EnchantmentChoice[], baseCost: number) => {
    const randomChoice = pool[Math.floor(Math.random() * pool.length)];
    // 数值平衡(2026-09): 已拥有该词条 c 次 → 本次费用 = base * (1 + c)
    const owned = player.enchantments.find((e) => e.id === randomChoice.id);
    const cost = owned && owned.count >= 1 ? baseCost * (1 + owned.count) : baseCost;
    if (player.stats.emeralds < cost) return;

    player.stats.emeralds -= cost;
    soundManager.playLevelUp();

    randomChoice.effect(player);

    const existing = player.enchantments.find((e) => e.id === randomChoice.id);
    if (existing) {
      existing.count++;
    } else {
      player.enchantments.push({ id: randomChoice.id, name: randomChoice.name, count: 1 });
    }

    onEnchantAdded(randomChoice.name);
    onRefresh();
  };

  const generalCost = poolMaxCost(ROGUELIKE_ENCHANTMENTS, 40);
  const mageCost = poolMaxCost(MAGE_ENCHANTMENTS, 45);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-stone-300">
        向远古青金石附魔台献祭绿宝石，可随机觉醒一项全能肉鸽词条，或专属祈求奥术/召唤/德鲁伊的元素秘咒！重复抽中已拥有的词条费用会递增。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* General Enchanting */}
        <div className="rounded-lg border border-purple-600/50 bg-purple-950/40 p-5 flex flex-col justify-between text-center items-center">
          <div>
            <span className="text-3xl mb-2 block">📖✨</span>
            <h3 className="text-base font-bold text-purple-300 font-cinzel mb-1">
              全域青金石附魔
            </h3>
            <p className="text-xs text-stone-300 mb-2">
              从锋利、烈焰附加、金苹果庇护、吸血之吻、急速光环等全部词条中抽取一项！
            </p>
            <p className="text-[11px] text-purple-400/80 mb-4">
              当前单次最高费用 {generalCost} 💎（重复词条递增，新词条 40 💎）
            </p>
          </div>
          <button
            disabled={player.stats.emeralds < generalCost}
            onClick={() => buyEnchantment(ROGUELIKE_ENCHANTMENTS, 40)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 px-5 py-2 text-xs font-bold text-white shadow"
          >
            <PlusCircle className="h-4 w-4" />
            <span>通用附魔 (最高 {generalCost} 💎)</span>
          </button>
        </div>

        {/* Specialized Magic / Summon / Nature Blessing */}
        <div className="rounded-lg border border-cyan-500/50 bg-cyan-950/40 p-5 flex flex-col justify-between text-center items-center">
          <div>
            <span className="text-3xl mb-2 block">🔮🌿</span>
            <h3 className="text-base font-bold text-cyan-300 font-cinzel mb-1">
              奥术·死灵·自然秘言
            </h3>
            <p className="text-xs text-stone-300 mb-2">
              专为法师、召唤师与德鲁伊打造：奥术回响、亡者军团统帅、盖亚自然荆棘、法力奔流！
            </p>
            <p className="text-[11px] text-cyan-400/80 mb-4">
              当前单次最高费用 {mageCost} 💎（重复词条递增，新词条 45 💎）
            </p>
          </div>
          <button
            disabled={player.stats.emeralds < mageCost}
            onClick={() => buyEnchantment(MAGE_ENCHANTMENTS, 45)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 px-5 py-2 text-xs font-bold text-white shadow"
          >
            <Wand2 className="h-4 w-4" />
            <span>法系专属祈愿 (最高 {mageCost} 💎)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
