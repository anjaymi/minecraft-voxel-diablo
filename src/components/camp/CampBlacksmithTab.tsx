import React, { useRef, useState } from 'react';
import { Player, Item } from '../../types';
import { soundManager } from '../../audio/soundManager';

// 数值平衡(2026-09): 强化费用随强化等级递增，最大强化到 5 级封顶
const REFINE_COST_TABLE = [25, 40, 60, 90, 135, 200];
const MAX_REFINE = 5;

interface CampBlacksmithTabProps {
  player: Player;
  onRefresh: () => void;
}

export const CampBlacksmithTab: React.FC<CampBlacksmithTabProps> = ({ player, onRefresh }) => {
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const showNotice = (msg: string) => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2600);
  };

  const isMageOrSummonerOrDruid = ['mage', 'summoner', 'druid'].includes(player.characterClass || '');

  const refineCostOf = (item: Item | null | undefined): number => {
    if (!item) return REFINE_COST_TABLE[0];
    return REFINE_COST_TABLE[item.refineLevel ?? 0] ?? REFINE_COST_TABLE[REFINE_COST_TABLE.length - 1];
  };
  const refineLevelOf = (item: Item | null | undefined): number => (item ? (item.refineLevel ?? 0) : 0);
  const isMaxRefined = (item: Item | null | undefined): boolean => refineLevelOf(item) >= MAX_REFINE;

  const upgradeGear = (type: 'weapon' | 'armor' | 'offhand') => {
    const item = player.equipment[type];
    if (!item) return;

    const lvl = item.refineLevel ?? 0;
    if (lvl >= MAX_REFINE) {
      showNotice('已达最大强化等级 (5/5)');
      return;
    }
    const cost = REFINE_COST_TABLE[lvl] ?? REFINE_COST_TABLE[REFINE_COST_TABLE.length - 1];
    if (player.stats.emeralds < cost) return;

    player.stats.emeralds -= cost;
    soundManager.playLevelUp();

    if (type === 'weapon') {
      item.attackBonus = (item.attackBonus || 5) + 6;
      player.stats.attack += 6;
      if (isMageOrSummonerOrDruid) {
        player.spellPower = (player.spellPower || 0) + 8;
        if (player.characterClass === 'summoner') {
          player.summonDamageBonus = (player.summonDamageBonus || 0) + 0.12;
        }
      }
      item.name = `${item.name} +1`;
    } else if (type === 'armor') {
      item.defenseBonus = (item.defenseBonus || 3) + 4;
      item.hpBonus = (item.hpBonus || 15) + 20;
      player.stats.defense += 4;
      player.stats.maxHp += 20;
      player.stats.hp += 20;
      if (isMageOrSummonerOrDruid) {
        player.stats.maxMana += 25;
        player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + 25);
      }
      item.name = `${item.name} +1`;
    } else {
      item.defenseBonus = (item.defenseBonus || 2) + 3;
      item.hpBonus = (item.hpBonus || 10) + 15;
      player.stats.defense += 3;
      player.stats.maxHp += 15;
      player.stats.hp += 15;
      if (isMageOrSummonerOrDruid) {
        player.spellPower = (player.spellPower || 0) + 6;
        player.stats.maxMana += 20;
      }
      item.name = `${item.name} +1`;
    }

    // 数值平衡(2026-09): 强化提升装备售价，投资不会 100% 打水漂
    item.refineLevel = lvl + 1;
    item.value = (item.value || 0) + Math.round(cost * 0.5);
    onRefresh();
  };

  const weapon = player.equipment.weapon;
  const armor = player.equipment.armor;
  const offhand = player.equipment.offhand;
  const weaponLvl = refineLevelOf(weapon);
  const armorLvl = refineLevelOf(armor);
  const offhandLvl = refineLevelOf(offhand);
  const weaponCost = refineCostOf(weapon);
  const armorCost = refineCostOf(armor);
  const offhandCost = refineCostOf(offhand);
  const weaponMaxed = isMaxRefined(weapon);
  const armorMaxed = isMaxRefined(armor);
  const offhandMaxed = isMaxRefined(offhand);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-stone-300">
        铁匠能为物理武器增幅利刃锋芒，更为法杖与图腾铭刻奥术与自然印记，大幅增强法术强度、法力与随从伤害！强化费用随等级递增，最高 5/5。
      </p>

      {notice && (
        <div className="rounded-lg border border-amber-500/60 bg-amber-950/80 px-3 py-2 text-center text-xs font-bold text-amber-200">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weapon Upgrade */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
              <span className="text-2xl">{isMageOrSummonerOrDruid ? '🪄' : '🗡️'}</span>
              <span>强化主手武器</span>
            </div>
            <div className="text-xs text-stone-400 mb-1 truncate">
              当前: {weapon?.name || '无'}
            </div>
            <div className="text-[11px] text-cyan-400 mb-1">
              强化等级: {weaponMaxed ? `${MAX_REFINE}/${MAX_REFINE} (已满)` : `${weaponLvl}/${MAX_REFINE}`}
            </div>
            <div className="text-xs text-emerald-400 font-semibold mb-3">
              {isMageOrSummonerOrDruid ? '升级: 攻击 +6，法强 +8，随从增伤 +12%' : '升级: 基础物理攻击力 +6'}
            </div>
          </div>
          <button
            disabled={!weapon || weaponMaxed || player.stats.emeralds < weaponCost}
            onClick={() => upgradeGear('weapon')}
            className="rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 py-2 text-xs font-bold text-black shadow"
          >
            {weaponMaxed
              ? '已达最大强化 (5/5)'
              : `重铸强化 (${weaponLvl}/${MAX_REFINE} · ${weaponCost} 💎)`}
          </button>
        </div>

        {/* Armor Upgrade */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-blue-400 mb-1">
              <span className="text-2xl">{isMageOrSummonerOrDruid ? '👘' : '🦺'}</span>
              <span>锻造防具法袍</span>
            </div>
            <div className="text-xs text-stone-400 mb-1 truncate">
              当前: {armor?.name || '无'}
            </div>
            <div className="text-[11px] text-cyan-400 mb-1">
              强化等级: {armorMaxed ? `${MAX_REFINE}/${MAX_REFINE} (已满)` : `${armorLvl}/${MAX_REFINE}`}
            </div>
            <div className="text-xs text-emerald-400 font-semibold mb-3">
              {isMageOrSummonerOrDruid ? '升级: 防御 +4，生命 +20，法力 +25' : '升级: 防御力 +4，生命 +20'}
            </div>
          </div>
          <button
            disabled={!armor || armorMaxed || player.stats.emeralds < armorCost}
            onClick={() => upgradeGear('armor')}
            className="rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 py-2 text-xs font-bold text-white shadow"
          >
            {armorMaxed
              ? '已达最大强化 (5/5)'
              : `锻造法甲 (${armorLvl}/${MAX_REFINE} · ${armorCost} 💎)`}
          </button>
        </div>

        {/* Offhand Upgrade */}
        <div className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-indigo-400 mb-1">
              <span className="text-2xl">{isMageOrSummonerOrDruid ? '📖' : '🛡️'}</span>
              <span>淬炼副手/图腾</span>
            </div>
            <div className="text-xs text-stone-400 mb-1 truncate">
              当前: {offhand?.name || '未佩戴'}
            </div>
            <div className="text-[11px] text-cyan-400 mb-1">
              强化等级: {offhandMaxed ? `${MAX_REFINE}/${MAX_REFINE} (已满)` : `${offhandLvl}/${MAX_REFINE}`}
            </div>
            <div className="text-xs text-emerald-400 font-semibold mb-3">
              {isMageOrSummonerOrDruid ? '升级: 法强 +6，法力 +20，HP +15' : '升级: 防御 +3，HP +15'}
            </div>
          </div>
          <button
            disabled={!offhand || offhandMaxed || player.stats.emeralds < offhandCost}
            onClick={() => upgradeGear('offhand')}
            className="rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 py-2 text-xs font-bold text-white shadow"
          >
            {offhandMaxed
              ? '已达最大强化 (5/5)'
              : `淬炼副手 (${offhandLvl}/${MAX_REFINE} · ${offhandCost} 💎)`}
          </button>
        </div>
      </div>
    </div>
  );
};
