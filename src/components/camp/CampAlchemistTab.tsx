import React, { useRef, useState } from 'react';
import { Player, Item } from '../../types';
import { soundManager } from '../../audio/soundManager';

interface CampAlchemistTabProps {
  player: Player;
  onRefresh: () => void;
}

export const CampAlchemistTab: React.FC<CampAlchemistTabProps> = ({ player, onRefresh }) => {
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const showNotice = (msg: string) => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2600);
  };

  // 数值平衡(2026-09): 星界魔力合剂每人限购 6 瓶，价格随已饮用瓶数递增 (20→30→...→70)
  const manaCount = player.manaElixirCount || 0;
  const manaCost = 20 + 10 * manaCount;
  const manaMaxed = manaCount >= 6;

  const buyPotion = (type: 'hp' | 'mana' | 'tnt' | 'pearl' | 'totem', cost: number) => {
    if (type === 'mana' && manaMaxed) {
      showNotice('魔力药剂已喝到极限 (最多6瓶)');
      return;
    }
    if (player.stats.emeralds < cost) return;
    player.stats.emeralds -= cost;
    soundManager.playEmeraldPickup();

    if (type === 'hp') {
      player.stats.potions += 2;
    } else if (type === 'mana') {
      player.stats.mana = player.stats.maxMana;
      player.stats.potions += 1;
      player.stats.maxMana += 15;
      player.manaElixirCount = manaCount + 1;
    } else if (type === 'tnt') {
      player.stats.tntCount += 3;
    } else if (type === 'pearl') {
      player.stats.enderPearls += 2;
    } else if (type === 'totem') {
      const totemItem: Item = {
        id: `totem_${Date.now()}`,
        name: '远古不死图腾',
        slot: 'offhand',
        subType: 'totem',
        rarity: 'legendary',
        level: player.stats.level,
        icon: '🗿',
        affixes: ['不死庇佑', '回春新生'],
        hpBonus: 30,
        defenseBonus: 3,
        description: '抵挡一次致命伤害并立即复活恢复 65% 最大生命值',
        value: 55,
      };
      if (!player.equipment.offhand) {
        player.equipment.offhand = totemItem;
        player.stats.maxHp += 30;
        player.stats.hp += 30;
        player.stats.defense += 3;
      } else {
        player.inventory.push(totemItem);
      }
    }
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-stone-300">
        炼金术士为你调配高能治疗合剂、回蓝秘露、战术末影珍珠与不死保命符！
      </p>

      {notice && (
        <div className="rounded-lg border border-amber-500/60 bg-amber-950/80 px-3 py-2 text-center text-xs font-bold text-amber-200">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {/* Health Potion */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-3 text-center items-center">
          <span className="text-3xl mb-1">🧪</span>
          <div className="font-bold text-rose-400 text-sm mb-1">治疗药水 x2</div>
          <div className="text-[11px] text-stone-400 mb-3">恢复 60% 最大生命</div>
          <button
            disabled={player.stats.emeralds < 15}
            onClick={() => buyPotion('hp', 15)}
            className="w-full rounded bg-rose-700 hover:bg-rose-600 disabled:opacity-40 py-1.5 text-xs font-bold text-white shadow"
          >
            购买 (15 💎)
          </button>
        </div>

        {/* Mana / Arcane Elixir */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-3 text-center items-center">
          <span className="text-3xl mb-1">💧</span>
          <div className="font-bold text-cyan-400 text-sm mb-1">星界魔力合剂</div>
          <div className="text-[11px] text-stone-400 mb-1">法力回满 & 上限+15/瓶</div>
          <div className="text-[10px] text-cyan-500/90 mb-2">
            已饮用 {Math.min(manaCount, 6)}/6 · 现价 {manaMaxed ? '—' : `${manaCost} 💎`}（重复饮用价格递增）
          </div>
          <button
            disabled={manaMaxed || player.stats.emeralds < manaCost}
            onClick={() => buyPotion('mana', manaCost)}
            className="w-full rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 py-1.5 text-xs font-bold text-white shadow"
          >
            {manaMaxed ? '已喝到极限 (6/6)' : `购买 (${manaCost} 💎)`}
          </button>
        </div>

        {/* TNT */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-3 text-center items-center">
          <span className="text-3xl mb-1">🧨</span>
          <div className="font-bold text-red-400 text-sm mb-1">引信TNT x3</div>
          <div className="text-[11px] text-stone-400 mb-3">大范围破坏冲击</div>
          <button
            disabled={player.stats.emeralds < 20}
            onClick={() => buyPotion('tnt', 20)}
            className="w-full rounded bg-red-700 hover:bg-red-600 disabled:opacity-40 py-1.5 text-xs font-bold text-white shadow"
          >
            购买 (20 💎)
          </button>
        </div>

        {/* Ender Pearl */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-3 text-center items-center">
          <span className="text-3xl mb-1">👁️</span>
          <div className="font-bold text-emerald-400 text-sm mb-1">末影珍珠 x2</div>
          <div className="text-[11px] text-stone-400 mb-3">穿梭闪烁脱离险境</div>
          <button
            disabled={player.stats.emeralds < 30}
            onClick={() => buyPotion('pearl', 30)}
            className="w-full rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 py-1.5 text-xs font-bold text-white shadow"
          >
            购买 (30 💎)
          </button>
        </div>

        {/* Totem of Undying */}
        <div className="flex flex-col justify-between rounded-lg border border-amber-600/60 bg-amber-950/30 p-3 text-center items-center shadow">
          <span className="text-3xl mb-1">🗿</span>
          <div className="font-bold text-amber-300 text-sm mb-1">不死图腾</div>
          <div className="text-[11px] text-amber-200/80 mb-3">致命免死并复活</div>
          <button
            disabled={player.stats.emeralds < 65}
            onClick={() => buyPotion('totem', 65)}
            className="w-full rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 py-1.5 text-xs font-bold text-black shadow"
          >
            购买 (65 💎)
          </button>
        </div>
      </div>
    </div>
  );
};
