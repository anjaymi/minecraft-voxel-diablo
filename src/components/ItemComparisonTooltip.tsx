import React from 'react';
import { Item, Player } from '../types';
import { RARITY_COLORS } from '../engine/lootSystem';
import { WeaponEffectVisualizer } from './WeaponEffectVisualizer';
import { calculateDynamicWeaponStats } from '../engine/weaponBaseConfig';
import { ArrowUpRight, ArrowDownRight, Minus, Shield, Swords, Sparkles, CheckCircle2 } from 'lucide-react';

interface ItemComparisonTooltipProps {
  hoveredItem: Item;
  player: Player;
  onEquip?: (item: Item) => void;
  onSell?: (item: Item) => void;
}

export const ItemComparisonTooltip: React.FC<ItemComparisonTooltipProps> = ({
  hoveredItem,
  player,
  onEquip,
  onSell,
}) => {
  const currentEquipped = player.equipment[hoveredItem.slot];
  const isCurrentlyEquipped = currentEquipped?.id === hoveredItem.id;
  const rarityStyle = RARITY_COLORS[hoveredItem.rarity];
  const classId = player.characterClass || 'warrior';

  // Compute stat deltas
  const getDelta = (hoverVal?: number, equipVal?: number) => {
    const h = hoverVal || 0;
    const e = equipVal || 0;
    return h - e;
  };

  const deltaAtk = getDelta(hoveredItem.attackBonus, currentEquipped?.attackBonus);
  const deltaDef = getDelta(hoveredItem.defenseBonus, currentEquipped?.defenseBonus);
  const deltaHp = getDelta(hoveredItem.hpBonus, currentEquipped?.hpBonus);
  const deltaSpd = getDelta(hoveredItem.speedBonus, currentEquipped?.speedBonus);
  const deltaCrit = getDelta(hoveredItem.critChanceBonus, currentEquipped?.critChanceBonus);
  const deltaSteal = getDelta(hoveredItem.lifeStealBonus, currentEquipped?.lifeStealBonus);

  const renderDeltaRow = (label: string, delta: number, isPercent = false) => {
    if (delta === 0) return null;
    const isPositive = delta > 0;
    const formatted = isPercent
      ? `${isPositive ? '+' : ''}${Math.round(delta * 100)}%`
      : `${isPositive ? '+' : ''}${delta > 0 && !isPercent && Number.isInteger(delta) ? delta : delta.toFixed(1)}`;

    return (
      <div className="flex items-center justify-between text-xs py-0.5 font-mono">
        <span className="text-stone-400">{label}</span>
        <span
          className={`flex items-center font-bold gap-0.5 ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {formatted}
        </span>
      </div>
    );
  };

  return (
    <div
      className="rounded-xl border-2 bg-stone-950 p-4 shadow-2xl flex flex-col gap-3 max-w-sm w-full text-stone-200"
      style={{ borderColor: rarityStyle.border }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-stone-800 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm tracking-wide" style={{ color: rarityStyle.text }}>
              {hoveredItem.name}
            </h4>
            {isCurrentlyEquipped && (
              <span className="flex items-center gap-1 rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[10px] font-bold border border-amber-500/30">
                <CheckCircle2 className="h-3 w-3" />
                已佩戴
              </span>
            )}
          </div>
          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
            {hoveredItem.slot.toUpperCase()} · 等级 {hoveredItem.level} · 稀有度:{' '}
            <span style={{ color: rarityStyle.text }}>{hoveredItem.rarity.toUpperCase()}</span>
          </div>
        </div>
        <span className="text-2xl">
          {/^[a-z_]+$/.test(hoveredItem.icon || '') ? '⚔️' : hoveredItem.icon || '⚔️'}
        </span>
      </div>

      {/* Description */}
      {hoveredItem.description && (
        <p className="text-xs text-stone-400 leading-relaxed italic">
          {hoveredItem.description}
        </p>
      )}

      {/* Modular Weapon Visualizer & Effect Details (if Weapon) */}
      {hoveredItem.slot === 'weapon' && (
        <WeaponEffectVisualizer weapon={hoveredItem} classId={classId} compact={false} />
      )}

      {/* Attribute Comparison vs Equipped Gear */}
      {!isCurrentlyEquipped && (
        <div className="rounded-lg border border-stone-800 bg-stone-900/70 p-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1 text-[11px] font-bold">
            <span className="text-stone-300 flex items-center gap-1">
              <Swords className="h-3.5 w-3.5 text-amber-400" />
              对比穿戴装备
            </span>
            <span className="text-stone-500 font-mono text-[10px]">
              {currentEquipped ? currentEquipped.name : '(原槽位为空)'}
            </span>
          </div>

          <div className="flex flex-col pt-1">
            {renderDeltaRow('⚔️ 攻击力变化', deltaAtk)}
            {renderDeltaRow('🛡️ 防御力变化', deltaDef)}
            {renderDeltaRow('❤️ 生命上限变化', deltaHp)}
            {renderDeltaRow('⚡ 移速变化', deltaSpd)}
            {renderDeltaRow('💥 暴击率变化', deltaCrit, true)}
            {renderDeltaRow('🩸 击中吸血变化', deltaSteal, true)}

            {deltaAtk === 0 && deltaDef === 0 && deltaHp === 0 && deltaSpd === 0 && deltaCrit === 0 && deltaSteal === 0 && (
              <div className="text-[11px] text-stone-500 italic py-1 flex items-center gap-1">
                <Minus className="h-3 w-3" />
                基础攻防属性相近，请参考武器特性与专属词条
              </div>
            )}
          </div>
        </div>
      )}

      {/* Affixes list */}
      {hoveredItem.affixes && hoveredItem.affixes.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-stone-800/80 pt-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            魔法词缀属性 (Enchantments)
          </span>
          <div className="flex flex-wrap gap-1">
            {hoveredItem.affixes.map((aff, i) => (
              <span
                key={i}
                className="rounded border border-stone-700 bg-stone-900/90 px-2 py-0.5 text-[11px] text-stone-300 font-mono"
              >
                ✦ {aff}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons if in inventory and not equipped */}
      {!isCurrentlyEquipped && player.inventory.some((i) => i.id === hoveredItem.id) && (
        <div className="flex gap-2 pt-2 border-t border-stone-800">
          {onEquip && (
            <button
              onClick={() => onEquip(hoveredItem)}
              className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 py-1.5 text-xs font-bold text-black shadow active:scale-98 transition-all"
            >
              立即装备 (Equip)
            </button>
          )}
          {onSell && (
            <button
              onClick={() => onSell(hoveredItem)}
              className="rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 px-3 py-1.5 text-xs font-bold text-emerald-400 shadow active:scale-98 transition-all"
            >
              出售 (+{hoveredItem.value}💎)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
