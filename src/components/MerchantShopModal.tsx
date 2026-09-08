import React from 'react';
import { Item, Player } from '../types';
import { ShopEntry, SHOP_RESTOCK_COST, merchantShop } from '../engine/city/MerchantShop';
import { RARITY_COLORS } from '../engine/lootSystem';
import { ItemComparisonTooltip } from './ItemComparisonTooltip';
import { X, RefreshCw, Coins, Check, Sparkles, PackageOpen } from 'lucide-react';

interface MerchantShopModalProps {
  player: Player;
  onClose: () => void;
  onPurchase: (msg: string, ok: boolean) => void;
}

const getEmoji = (item: Item): string => {
  const map: Record<string, string> = {
    axe: '🪓', bow: '🏹', crossbow: '🎯', dagger: '🗡️', staff: '🪄', wand: '🔮',
    hammer: '🔨', greatsword: '⚔️', sword: '⚔️', shield: '🛡️', totem: '🗿',
    armor: '🦺', helmet: '🪖', boots: '👢', ring: '💍',
  };
  return map[item.subType || ''] || (item.slot === 'weapon' ? '⚔️' : '📦');
};

type CatKey = 'all' | 'weapon' | 'armor' | 'other';

const catOf = (it: Item): Exclude<CatKey, 'all'> => {
  if (it.slot === 'weapon') return 'weapon';
  if (it.slot === 'armor' || it.slot === 'helmet' || it.slot === 'boots') return 'armor';
  return 'other';
};

const CAT_LABELS: Record<Exclude<CatKey, 'all'>, string> = {
  weapon: '⚔️ 武器',
  armor: '🛡️ 防具',
  other: '💠 饰品',
};

/** 单行摘要：取主要词条 2~3 条 */
function statChips(it: Item): string[] {
  const chips: string[] = [];
  if (it.attackBonus) chips.push(`⚔️ +${it.attackBonus} 攻`);
  if (it.defenseBonus) chips.push(`🛡️ +${it.defenseBonus} 防`);
  if (it.hpBonus) chips.push(`❤️ +${it.hpBonus} HP`);
  if (it.critChanceBonus) chips.push(`💥 +${Math.round(it.critChanceBonus * 100)}%`);
  if (it.lifeStealBonus) chips.push(`🩸 +${Math.round(it.lifeStealBonus * 100)}%`);
  if (it.speedBonus) chips.push(`⚡ +${it.speedBonus}`);
  if (it.spellPowerBonus) chips.push(`✨ +${it.spellPowerBonus}`);
  return chips.slice(0, 3);
}

export const MerchantShopModal: React.FC<MerchantShopModalProps> = ({ player, onClose, onPurchase }) => {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [cat, setCat] = React.useState<CatKey>('all');

  const pool: ShopEntry[] = merchantShop.getPool(player);
  const cats = React.useMemo(() => {
    const set = new Set<CatKey>();
    for (const e of pool) if (!e.sold) set.add(catOf(e.item));
    return [...set];
  }, [pool]);
  const shown = cat === 'all' ? pool : pool.filter((e) => catOf(e.item) === cat);
  const active: ShopEntry | null = selected !== null ? pool[selected] ?? null : null;

  const handleBuy = (index: number) => {
    const entry = pool[index];
    if (!entry || entry.sold) return;
    const result = merchantShop.buy(player, index);
    onPurchase(result.message, result.ok);
    force();
    // 购买后自动跳到同组下一件未售商品
    const next = pool.findIndex((e, i) => i !== index && !e.sold && (cat === 'all' || catOf(e.item) === cat));
    setSelected(next >= 0 ? next : null);
  };

  const handleRestock = () => {
    const result = merchantShop.restock(player);
    onPurchase(result.message, result.ok);
    setSelected(null);
    force();
  };

  const isAffordable = (entry: ShopEntry): boolean => player.stats.emeralds >= entry.price;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-sm p-2 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="relative flex w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] flex-col overflow-hidden rounded-2xl border-2 border-amber-700/50 shadow-[0_0_60px_rgba(0,0,0,0.8)] text-stone-100"
        style={{ background: 'radial-gradient(ellipse at top, #33291f 0%, #221a12 45%, #181209 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== 顶栏：店名 + 金币 ===== */}
        <div className="flex items-center justify-between border-b border-amber-900/60 bg-black/30 px-3 sm:px-5 py-2.5 sm:py-3.5 safe-top">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/25 to-amber-900/40 text-xl sm:text-2xl shadow-inner">
              💰
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                行商的百宝囊
              </h2>
              <p className="hidden sm:block text-[11px] text-stone-400">远征归来的稀罕货 · 绿宝石通货交易</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-950/70 px-2.5 sm:px-3 py-1.5 text-sm font-black text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
              <Coins className="h-4 w-4" />
              {player.stats.emeralds}
            </span>
            <button onClick={onClose} className="touch-btn rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ===== 主体：左目录 + 右详情 ===== */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 p-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:gap-3">
          {/* 左：商品目录 */}
          <div className="flex min-h-0 flex-col rounded-xl border border-stone-800/80 bg-stone-950/40">
            <div className="flex items-center justify-between border-b border-stone-800/70 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                在售货品
                <span className="rounded bg-stone-800 px-1.5 py-px font-mono text-[10px] text-stone-400">
                  {shown.filter((e) => !e.sold).length}
                </span>
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCat('all')}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
                    cat === 'all' ? 'bg-amber-500/90 text-black' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                  }`}
                >
                  全部
                </button>
                {cats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
                      cat === c ? 'bg-amber-500/90 text-black' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    {CAT_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
              {shown.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-stone-500">
                  <PackageOpen className="h-8 w-8" />
                  <span className="text-xs">这个货架上暂时空空如也…</span>
                </div>
              )}
              {shown.map((entry, i) => {
                const realIndex = pool.indexOf(entry);
                const rStyle = RARITY_COLORS[entry.item.rarity];
                const affordable = isAffordable(entry);
                const isSel = selected === realIndex && !entry.sold;
                return (
                  <button
                    key={`${entry.item.id}_${i}`}
                    disabled={entry.sold}
                    onClick={() => !entry.sold && setSelected(realIndex)}
                    className={`group relative flex items-center gap-2.5 rounded-lg border-l-4 px-2.5 py-2 text-left transition-all duration-150 ${
                      entry.sold
                        ? 'cursor-not-allowed border-stone-800 bg-stone-950/40 opacity-45'
                        : isSel
                        ? 'border-amber-300 bg-stone-900/90 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                        : 'border-stone-800 bg-stone-900/50 hover:border-amber-600/70 hover:bg-stone-900'
                    }`}
                    style={{ borderLeftColor: entry.sold ? undefined : rStyle.border }}
                  >
                    <span className="text-2xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]">{getEmoji(entry.item)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold" style={{ color: rStyle.text }}>
                          {entry.item.name}
                        </span>
                        {entry.item.rarity === 'legendary' && (
                          <span className="rounded-full bg-amber-400/90 px-1 text-[8px] font-black text-stone-950">传</span>
                        )}
                        {entry.item.rarity === 'rare' && (
                          <span className="rounded-full bg-sky-300/90 px-1 text-[8px] font-black text-stone-950">稀</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-stone-500">
                        <span>{entry.item.slot.toUpperCase()}</span>
                        <span>· Lv{entry.item.level}</span>
                        {statChips(entry.item).map((c, ci) => (
                          <span key={ci} className="rounded bg-stone-800/80 px-1 py-px text-stone-300">{c}</span>
                        ))}
                      </div>
                    </div>
                    {entry.sold ? (
                      <span className="flex items-center gap-0.5 rounded bg-stone-800 px-1.5 py-0.5 text-[9px] font-bold text-stone-500">
                        <Check className="h-3 w-3" /> 已售
                      </span>
                    ) : (
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-black ${
                          affordable ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-950/60 text-red-400'
                        }`}
                      >
                        💎{entry.price}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右：详情 / 购买卡（手机端堆叠在目录下方） */}
          <div className="flex min-h-0 flex-col sm:flex">
            {active && !active.sold ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                <ItemComparisonTooltip
                  hoveredItem={{ ...active.item, icon: getEmoji(active.item) }}
                  player={player}
                />
                {/* 购买条 */}
                <div
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${
                    isAffordable(active)
                      ? 'border-emerald-700/60 bg-emerald-950/40'
                      : 'border-red-800/50 bg-red-950/30'
                  }`}
                >
                  <div>
                    <div className="text-[10px] text-stone-400">售价</div>
                    <div className={`text-xl font-black ${isAffordable(active) ? 'text-emerald-300' : 'text-red-400'}`}>
                      {active.price} <span className="text-sm">💎</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuy(pool.indexOf(active))}
                    disabled={!isAffordable(active)}
                    className={`rounded-xl px-6 py-2.5 text-sm font-black shadow-lg transition-all active:scale-95 ${
                      isAffordable(active)
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 hover:brightness-110 shadow-amber-900/50'
                        : 'cursor-not-allowed bg-stone-800 text-stone-500'
                    }`}
                  >
                    {isAffordable(active) ? '💰 购买' : '绿宝石不足'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-700/60 bg-stone-950/30 text-stone-500">
                <PackageOpen className="h-10 w-10 opacity-60" />
                <span className="text-xs">点选左侧货品，查看属性与穿戴对比</span>
              </div>
            )}
          </div>
        </div>

        {/* ===== 底栏：提示 + 刷新 ===== */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-900/60 bg-black/30 px-3 sm:px-5 py-2.5 sm:py-3 safe-bottom">
          <span className="hidden sm:block text-[10px] text-stone-500">💡 换区域后行商进新货 · 也可以用绿宝石即刻翻新</span>
          <button
            onClick={handleRestock}
            className="touch-btn flex items-center gap-1.5 rounded-lg border border-sky-600/60 bg-sky-900/40 px-3.5 py-2 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-900/70"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            刷新商品（{SHOP_RESTOCK_COST} 💎）
          </button>
        </div>
      </div>
    </div>
  );
};
