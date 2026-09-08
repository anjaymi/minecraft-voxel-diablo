import React, { useState, useRef } from 'react';
import { Player, Item, EquipmentSlot } from '../types';
import { RARITY_COLORS } from '../engine/lootSystem';
import { setBonusSystem } from '../engine/setBonusSystem';
import { calculateDynamicWeaponStats, WEAPON_BASE_CONFIGS } from '../engine/weaponBaseConfig';
import { SetBonusPanel } from './SetBonusPanel';
import { ItemComparisonTooltip } from './ItemComparisonTooltip';
import { WeaponEffectVisualizer } from './WeaponEffectVisualizer';
import { PaperDoll } from './inventory/PaperDoll';
import { CharacterStatsPanel } from './inventory/CharacterStatsPanel';
import { X, Shield, Sword, Sparkles, Footprints, HardHat, CircleDot, Zap, Swords, User } from 'lucide-react';

interface InventoryModalProps {
  player: Player;
  onClose: () => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: keyof Player['equipment']) => void;
  onSellItem: (item: Item) => void;
  onOpenSkinModal?: () => void;
  onOpenWeaponModal?: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  onClose,
  onEquipItem,
  onUnequipItem,
  onSellItem,
  onOpenSkinModal,
  onOpenWeaponModal,
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);

  // 手动双击检测（350ms 内同格两次点击 = 快速装备/卸下，不依赖原生 dblclick 事件）
  const lastGridClickRef = useRef<{ id: string; t: number }>({ id: '', t: 0 });
  const handleGridClick = (item: Item, equip: () => void, select: () => void) => {
    const now = Date.now();
    if (lastGridClickRef.current.id === item.id && now - lastGridClickRef.current.t < 350) {
      lastGridClickRef.current = { id: '', t: 0 };
      equip();
      setSelectedItem(null);
      setHoveredItem(null);
    } else {
      lastGridClickRef.current = { id: item.id, t: now };
      select();
    }
  };
  const [centerTab, setCenterTab] = useState<'paperdoll' | 'weapon' | 'stats'>('paperdoll');
  const activeSets = setBonusSystem.calculateActiveSets(player.equipment);
  const activeClass = player.characterClass || 'warrior';

  // Dynamic weapon stats of currently equipped weapon
  const currentWeaponStats = calculateDynamicWeaponStats(
    player.equipment.weapon,
    activeClass,
    player.stats
  );

  const getSlotIcon = (slot: EquipmentSlot) => {
    switch (slot) {
      case 'weapon': return <Sword className="h-5 w-5 text-amber-400" />;
      case 'offhand': return <Shield className="h-5 w-5 text-indigo-400" />;
      case 'armor': return <Shield className="h-5 w-5 text-blue-400" />;
      case 'helmet': return <HardHat className="h-5 w-5 text-cyan-400" />;
      case 'boots': return <Footprints className="h-5 w-5 text-emerald-400" />;
      case 'ring': return <CircleDot className="h-5 w-5 text-purple-400" />;
    }
  };

  const getItemEmoji = (item: Item | null, slot: EquipmentSlot) => {
    if (!item) return null;
    // icon 为 emoji（职业初始装）时直接用；为材质 id（掉落物，如 wood_sword）时按 subType/slot 映射
    if (item.icon && !/^[a-z_]+$/.test(item.icon)) return item.icon;
    const map: Record<string, string> = {
      axe: '🪓', bow: '🏹', crossbow: '🎯', dagger: '🗡️', staff: '🪄', wand: '🔮',
      sword: '⚔️', hammer: '🔨', shield: '🛡️', totem: '🗿', armor: '🦺', helmet: '🪖', boots: '👢', ring: '💍'
    };
    if (item.subType && map[item.subType]) return map[item.subType];
    return map[slot] || '📦';
  };

  const renderSlot = (slot: EquipmentSlot, title: string, item: Item | null) => {
    const isSelected = selectedItem === item;
    const rarityStyle = item ? RARITY_COLORS[item.rarity] : null;
    const mainStat = item?.attackBonus
      ? `+${item.attackBonus} 攻`
      : item?.defenseBonus
      ? `+${item.defenseBonus} 防`
      : item?.hpBonus
      ? `+${item.hpBonus} HP`
      : '';

    return (
      <div
        onClick={() => item && setSelectedItem(item)}
        onDoubleClick={() => {
          if (item) {
            onUnequipItem(slot);
            setSelectedItem(null);
            setHoveredItem(null);
          }
        }}
        onMouseEnter={() => item && setHoveredItem(item)}
        onMouseLeave={() => setHoveredItem((prev) => (prev?.id === item?.id ? null : prev))}
        title={item ? `${item.name}（双击卸下）` : title}
        className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg border-2 transition-all cursor-pointer ${
          item
            ? isSelected
              ? 'border-amber-400 bg-stone-800/90 shadow-md'
              : 'border-stone-700 bg-stone-900/80 hover:border-stone-500'
            : 'border-dashed border-stone-800 bg-stone-900/40'
        }`}
        style={item && rarityStyle ? { borderColor: isSelected ? '#fbbf24' : rarityStyle.border } : undefined}
      >
        <span className="text-xl leading-none">
          {item ? getItemEmoji(item, slot) : getSlotIcon(slot)}
        </span>
        {item ? (
          <>
            <span className="w-full truncate text-center text-[9px] font-bold text-stone-200">{item.name}</span>
            {mainStat && <span className="text-[9px] font-mono text-amber-300">{mainStat}</span>}
          </>
        ) : (
          <span className="text-[9px] text-stone-600">{title.split(' ')[0]}</span>
        )}
      </div>
    );
  };

  const activeInspectedItem = hoveredItem || selectedItem;

  // 物品已不在背包/装备栏（被装备/售出）时清掉残留的选中与悬停卡，避免渲染过期引用
  const owned = (i: Item) => i.id === activeInspectedItem?.id;
  const stillOwned =
    activeInspectedItem != null &&
    (player.inventory.some(owned) ||
      (Object.values(player.equipment) as Array<Item | null>).some((i) => i?.id === activeInspectedItem.id));
  if (activeInspectedItem && !stillOwned) {
    setSelectedItem(null);
    setHoveredItem(null);
  }
  const inspectedItem = activeInspectedItem && stillOwned ? activeInspectedItem : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-2 sm:items-center sm:p-4">
      <div className="relative w-full max-w-6xl rounded-xl border-2 border-stone-700 bg-gradient-to-b from-stone-900 to-stone-950 p-3 sm:p-4 shadow-2xl text-stone-100 flex flex-col gap-3 max-h-[94vh] sm:max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 safe-top">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">⚔️</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cinzel text-amber-300">
                英雄装备与物品栏
              </h2>
              <p className="hidden sm:block text-[11px] text-stone-400">
                鼠标悬停物品可即时对比属性增减，主副手武器效果根据职业属性实时修正
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-btn rounded-lg border border-stone-700 bg-stone-800 p-2 text-stone-400 hover:text-white hover:bg-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
          {/* Left Column: Equipment Slots (compact 3x2 grid) & Set Bonuses */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">已穿戴（双击卸下）</span>
              <span className="sm:hidden">已穿戴</span>
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {renderSlot('weapon', '主手武器', player.equipment.weapon)}
              {renderSlot('offhand', '副手', player.equipment.offhand)}
              {renderSlot('armor', '胸甲', player.equipment.armor)}
              {renderSlot('helmet', '头盔', player.equipment.helmet)}
              {renderSlot('boots', '战靴', player.equipment.boots)}
              {renderSlot('ring', '饰品', player.equipment.ring)}
            </div>
            <SetBonusPanel activeSets={activeSets} />
          </div>

          {/* Center Column: PaperDoll Mannequin & Stats Sheet */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            {/* View Switcher Tabs */}
            <div className="flex rounded-lg border border-stone-800 bg-stone-950 p-0.5">
              <button
                onClick={() => setCenterTab('paperdoll')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  centerTab === 'paperdoll'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>纸娃娃人偶 (PaperDoll)</span>
              </button>
              <button
                onClick={() => setCenterTab('weapon')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  centerTab === 'weapon'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Swords className="h-3.5 w-3.5" />
                <span>武器</span>
              </button>
              <button
                onClick={() => setCenterTab('stats')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  centerTab === 'stats'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>属性</span>
              </button>
            </div>

            {/* Tab 1: PaperDoll Interactive Mannequin with Class Visual Decorators */}
            {centerTab === 'paperdoll' ? (
              <PaperDoll
                player={player}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot, item) => {
                  setSelectedSlot(slot);
                  setSelectedItem(item);
                }}
                onOpenSkinModal={onOpenSkinModal}
                onOpenWeaponModal={onOpenWeaponModal}
              />
            ) : centerTab === 'weapon' ? (
              /* Tab 2: Live Scaled Weapon Card */
              <div className="rounded-lg border border-stone-800 bg-stone-950/70 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5 text-amber-400" />
                    当前武器实战基准 (Dynamic Scale)
                  </span>
                  {onOpenWeaponModal && (
                    <button
                      type="button"
                      onClick={onOpenWeaponModal}
                      className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30"
                    >
                      <span>⚔️ 挂点调校</span>
                    </button>
                  )}
                </div>
                <WeaponEffectVisualizer
                  weapon={player.equipment.weapon}
                  classId={activeClass}
                  compact={false}
                />
              </div>
            ) : null}

            {centerTab === 'stats' && <CharacterStatsPanel player={player} />}
          </div>

          {/* Right Column: Inventory Bag & Hover Comparison */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                背包物品 ({player.inventory.length}/24)
              </h3>
              <span className="text-[10px] text-stone-400">悬停查看对比</span>
            </div>

            {/* Inventory Grid: 手机 4 列 / ≥sm 5 列 大格 + 稀有度光效 */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg border border-stone-800 bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.5),rgba(2,6,23,0.9))]">
              {player.inventory.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isHovered = hoveredItem?.id === item.id;
                const rStyle = RARITY_COLORS[item.rarity];
                const highRarity = item.rarity === 'legendary' || item.rarity === 'rare';
                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGridClick(item, () => onEquipItem(item), () => setSelectedItem(item));
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEquipItem(item);
                      setSelectedItem(null);
                      setHoveredItem(null);
                    }}
                    title="双击 / 右键 快速装备"
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`group relative flex aspect-square items-center justify-center rounded-lg border-2 p-1 transition-all duration-150 ${
                      isSelected || isHovered
                        ? 'scale-110 z-10 ring-2 ring-amber-300/80'
                        : 'hover:scale-105 hover:-translate-y-0.5'
                    }`}
                    style={{
                      backgroundColor: rStyle.bg,
                      borderColor: isSelected || isHovered ? '#fbbf24' : rStyle.border,
                      boxShadow:
                        isSelected || isHovered
                          ? '0 0 14px rgba(251,191,36,0.55)'
                          : highRarity
                          ? `0 0 10px ${rStyle.glow}, inset 0 0 8px rgba(0,0,0,0.35)`
                          : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    <span className="text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform">{getItemEmoji(item, item.slot)}</span>
                    {/* 稀有度角标 */}
                    {highRarity && (
                      <span
                        className="absolute -top-1 -right-1 rounded-full px-1 py-px text-[7px] font-black text-stone-950 shadow"
                        style={{ backgroundColor: rStyle.text }}
                      >
                        {item.rarity === 'legendary' ? '传' : '稀'}
                      </span>
                    )}
                    {/* 等级标签 */}
                    <span className="absolute bottom-0.5 right-1.5 text-[9px] font-black text-white/90 font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                      L{item.level}
                    </span>
                  </button>
                );
              })}

              {Array.from({ length: Math.max(0, 24 - player.inventory.length) }).map((_, i) => (
                <div
                  key={`empty_${i}`}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-stone-800/60 bg-stone-950/40"
                >
                  <span className="text-lg text-stone-800/50">✦</span>
                </div>
              ))}
            </div>

            {/* Hover Comparison Tooltip Popup */}
            {inspectedItem ? (
              <ItemComparisonTooltip
                hoveredItem={inspectedItem}
                player={player}
                onEquip={(item) => {
                  onEquipItem(item);
                  setSelectedItem(null);
                  setHoveredItem(null);
                }}
                onSell={(item) => {
                  onSellItem(item);
                  setSelectedItem(null);
                  setHoveredItem(null);
                }}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-stone-800 bg-stone-950/40 p-4 text-center text-xs text-stone-500 italic">
                💡 悬停查看属性对比 · <span className="text-amber-400 font-bold">双击 / 右键 = 快速装备</span> · 双击已穿戴 = 卸下
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
