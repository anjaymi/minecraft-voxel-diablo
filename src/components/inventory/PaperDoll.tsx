import React from 'react';
import { Player, Item, EquipmentSlot, CharacterClassId } from '../../types';
import { RARITY_COLORS } from '../../engine/lootSystem';
import { Shield, Sword, HardHat, Footprints, CircleDot, Sparkles, Leaf, Flame, Orbit, Palette, Crosshair } from 'lucide-react';
import { PaperDollPreviewCanvas } from './PaperDollPreviewCanvas';

interface PaperDollProps {
  player: Player;
  onSelectSlot?: (slot: EquipmentSlot, item: Item | null) => void;
  selectedSlot?: EquipmentSlot | null;
  onOpenSkinModal?: () => void;
  onOpenWeaponModal?: () => void;
}

export const PaperDoll: React.FC<PaperDollProps> = ({
  player,
  onSelectSlot,
  selectedSlot,
  onOpenSkinModal,
  onOpenWeaponModal,
}) => {
  const activeClass: CharacterClassId = player.characterClass || 'warrior';
  const eq = player.equipment;

  // Determine dominant gear class theme (prioritize equipped weapon/armor recommendedClass or fallback to player class)
  const dominantClass: CharacterClassId =
    eq.weapon?.recommendedClass ||
    eq.armor?.recommendedClass ||
    activeClass;

  const getClassTheme = (classId: CharacterClassId) => {
    switch (classId) {
      case 'druid':
        return {
          title: '荒野德鲁伊 · 自然灵木',
          badgeText: '🌿 荆棘生机: 活体自然藤蔓与灵叶缠绕',
          borderColor: 'border-emerald-500/80',
          pedestalGlow: 'from-emerald-950 via-green-900/40 to-transparent',
          auraColor: 'text-emerald-400',
          accentColor: '#10b981',
          bgGradient: 'from-emerald-950/40 via-stone-900/60 to-stone-950',
        };
      case 'summoner':
        return {
          title: '幽冥唤灵师 · 噬魂亡灵',
          badgeText: '💀 噬魂冥火: 幽冥魂炎与怨灵骨纹缭绕',
          borderColor: 'border-cyan-500/80',
          pedestalGlow: 'from-cyan-950 via-purple-950/40 to-transparent',
          auraColor: 'text-cyan-400',
          accentColor: '#06b6d4',
          bgGradient: 'from-cyan-950/30 via-stone-900/60 to-purple-950/30',
        };
      case 'mage':
        return {
          title: '星辉奥术师 · 天体符印',
          badgeText: '🔮 星界环流: 天体符印环与奥能晶辉环绕',
          borderColor: 'border-purple-500/80',
          pedestalGlow: 'from-purple-950 via-indigo-900/40 to-transparent',
          auraColor: 'text-purple-400',
          accentColor: '#a855f7',
          bgGradient: 'from-purple-950/40 via-stone-900/60 to-indigo-950/30',
        };
      case 'warrior':
      default:
        return {
          title: '铁血狂战士 · 熔岩重铠',
          badgeText: '⚔️ 狂暴战魂: 熔火钢屑与怒火辉光',
          borderColor: 'border-amber-500/80',
          pedestalGlow: 'from-amber-950 via-red-950/40 to-transparent',
          auraColor: 'text-amber-400',
          accentColor: '#f59e0b',
          bgGradient: 'from-amber-950/30 via-stone-900/60 to-stone-950',
        };
    }
  };

  const theme = getClassTheme(dominantClass);

  const renderSocket = (
    slot: EquipmentSlot,
    item: Item | null,
    defaultLabel: string,
    IconComp: React.ComponentType<{ className?: string }>
  ) => {
    const isSelected = selectedSlot === slot;
    const rarityBorder = item ? RARITY_COLORS[item.rarity].border : 'border-stone-700/70';
    const rarityBg = item ? RARITY_COLORS[item.rarity].bg : 'bg-stone-900/80';

    return (
      <button
        onClick={() => onSelectSlot?.(slot, item)}
        className={`group relative flex items-center justify-center rounded-lg border-2 p-1.5 transition-all duration-200 ${rarityBorder} ${rarityBg} ${
          isSelected ? 'ring-2 ring-amber-400 scale-105 shadow-lg shadow-amber-500/30' : 'hover:border-stone-500 hover:scale-102'
        }`}
        title={item ? `${item.name} (${defaultLabel})` : defaultLabel}
      >
        <div className="flex flex-col items-center justify-center h-10 w-10">
          {item ? (
            <span className="text-xl filter drop-shadow select-none">
              {item.icon || '🛡️'}
            </span>
          ) : (
            <IconComp className="h-5 w-5 text-stone-600 group-hover:text-stone-400" />
          )}
        </div>
        {item && item.refineLevel && item.refineLevel > 0 && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-stone-950 shadow">
            +{item.refineLevel}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`relative rounded-xl border ${theme.borderColor} bg-gradient-to-b ${theme.bgGradient} p-3.5 shadow-2xl flex flex-col items-center select-none overflow-hidden`}>
      {/* Top Banner: Class & Gear Identity */}
      <div className="w-full flex items-center justify-between border-b border-stone-800/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🎭</span>
          <span className="text-xs font-bold font-cinzel text-amber-300">
            {theme.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenWeaponModal && (
            <button
              onClick={onOpenWeaponModal}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors"
              title="调校武器相对于手掌骨骼的偏移与角度 (快捷键 U)"
            >
              <Crosshair className="h-3 w-3 text-amber-400" />
              <span>武器挂点</span>
            </button>
          )}
          {onOpenSkinModal && (
            <button
              onClick={onOpenSkinModal}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-300 transition-colors"
              title="上传 PNG 图片更换外观"
            >
              <Palette className="h-3 w-3 text-amber-400" />
              <span>外观工坊</span>
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">
            手办展台
          </span>
        </div>
      </div>

      {/* Class Cosmetic Decoration Indicator */}
      <div className="w-full mb-2.5 px-2 py-1 rounded bg-stone-950/70 border border-stone-800 text-[10px] flex items-center justify-between">
        <span className={`font-mono font-semibold ${theme.auraColor}`}>
          {theme.badgeText}
        </span>
        <span className="text-[9px] text-stone-500">2.5头身手办专属涂装</span>
      </div>

      {/* Main Mannequin Stage */}
      <div className="relative w-full h-56 flex items-center justify-center">
        {/* GoodSmile Transparent Support Arm & Base Pedestal */}
        <div className={`absolute bottom-3 w-44 h-10 rounded-full bg-gradient-to-t ${theme.pedestalGlow} blur-md`} />
        <div className="absolute bottom-4 w-36 h-7 rounded-full border border-stone-600/70 bg-stone-900/40 shadow-inner" />
        {/* Acrylic clear support peg */}
        <div className="absolute bottom-9 w-1.5 h-14 bg-gradient-to-t from-cyan-300/30 to-white/10 rounded-full blur-[0.5px]" />

        {/* --- CLASS SPECIFIC DECORATION OVERLAYS --- */}

        {/* 1. DRUID (德鲁伊: 自然藤蔓与生机灵叶) */}
        {dominantClass === 'druid' && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {/* Winding Living Vines SVG */}
            <svg className="w-48 h-52 filter drop-shadow-md" viewBox="0 0 200 220" fill="none">
              {/* Left arm vine */}
              <path
                d="M 68 85 Q 52 105 58 135 T 52 165"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
              {/* Right arm & weapon vine */}
              <path
                d="M 132 85 Q 148 105 142 135 T 148 165"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Torso wrapping vine */}
              <path
                d="M 80 95 Q 100 115 120 100 Q 115 130 85 140"
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {/* Vine Leaf Sprouts */}
              <circle cx="56" cy="115" r="3.5" fill="#4ade80" />
              <circle cx="144" cy="120" r="3.5" fill="#4ade80" />
              <circle cx="102" cy="108" r="4" fill="#a7f3d0" />
              <circle cx="82" cy="138" r="3" fill="#34d399" />
              {/* Nature Antlers / Foliage Crown */}
              <path
                d="M 85 45 Q 70 30 65 18 M 72 26 Q 60 22 55 28 M 115 45 Q 130 30 135 18 M 128 26 Q 140 22 145 28"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            {/* Floating emerald leaf badges */}
            <span className="absolute top-6 left-12 text-xs animate-bounce text-emerald-400">🍃</span>
            <span className="absolute bottom-12 right-12 text-xs animate-pulse text-green-300">🌿</span>
            <span className="absolute top-12 right-14 text-xs animate-bounce text-emerald-300">🌸</span>
          </div>
        )}

        {/* 2. MAGE / ARCANE (奥术: 星辉奥术与天体符印) */}
        {dominantClass === 'mage' && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {/* Rotating Arcane Rings SVG */}
            <svg className="w-52 h-52 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" viewBox="0 0 220 220" fill="none">
              {/* Outer celestial orbit ring */}
              <circle cx="110" cy="110" r="75" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="8 6" className="animate-spin-slow origin-center" />
              {/* Inner arcane barrier ring */}
              <ellipse cx="110" cy="110" rx="65" ry="35" stroke="#c084fc" strokeWidth="1.8" className="animate-pulse" />
              {/* Mystic runic glyphs */}
              <text x="105" y="32" fill="#e9d5ff" fontSize="11" fontWeight="bold">✧</text>
              <text x="185" y="115" fill="#c084fc" fontSize="11" fontWeight="bold">✦</text>
              <text x="30" y="115" fill="#a855f7" fontSize="11" fontWeight="bold">Ω</text>
              <text x="105" y="192" fill="#e9d5ff" fontSize="11" fontWeight="bold">α</text>
            </svg>
            <span className="absolute top-8 left-14 text-xs animate-pulse text-purple-300">✨</span>
            <span className="absolute bottom-10 right-14 text-xs animate-bounce text-indigo-300">🔮</span>
            <span className="absolute top-14 right-12 text-xs animate-spin text-purple-400">✵</span>
          </div>
        )}

        {/* 3. SUMMONER / NECRO (死灵: 幽冥死灵与噬魂焰火) */}
        {dominantClass === 'summoner' && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {/* Spectral Soul Flames & Bone Ribcage SVG */}
            <svg className="w-52 h-52 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" viewBox="0 0 220 220" fill="none">
              {/* Shoulder Soul Flame Tendrils */}
              <path d="M 75 75 Q 60 50 68 35 Q 75 48 82 68" fill="#22d3ee" fillOpacity="0.4" stroke="#06b6d4" strokeWidth="1.5" className="animate-pulse" />
              <path d="M 145 75 Q 160 50 152 35 Q 145 48 138 68" fill="#a855f7" fillOpacity="0.35" stroke="#c084fc" strokeWidth="1.5" className="animate-pulse" />
              {/* Spectral bone rib arches on chest */}
              <path d="M 90 95 Q 110 102 130 95" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
              <path d="M 88 110 Q 110 118 132 110" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
              <path d="M 92 125 Q 110 132 128 125" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {/* Hovering Soul Skull near offhand */}
            <span className="absolute top-8 right-10 text-sm animate-bounce text-cyan-300 filter drop-shadow">💀</span>
            <span className="absolute bottom-12 left-12 text-xs animate-pulse text-purple-400">🔥</span>
            <span className="absolute top-16 left-12 text-xs animate-pulse text-cyan-400">👻</span>
          </div>
        )}

        {/* Fallback Warrior Embers */}
        {dominantClass === 'warrior' && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <span className="absolute top-10 right-12 text-xs animate-bounce text-amber-400">🔥</span>
            <span className="absolute bottom-14 left-14 text-xs animate-pulse text-red-400">⚡</span>
          </div>
        )}

        {/* GoodSmile Live Figurine Preview Canvas */}
        <PaperDollPreviewCanvas player={player} />

        {/* Central Stylized Hero Silhouette Mannequin */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Head & Helmet */}
          <div className="relative mb-1">
            {renderSocket('helmet', eq.helmet, '头盔', HardHat)}
          </div>

          {/* Torso with Mainhand & Offhand */}
          <div className="flex items-center gap-3">
            {/* Main Hand (Weapon) */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-stone-500 font-mono mb-0.5">主手</span>
              {renderSocket('weapon', eq.weapon, '主手', Sword)}
            </div>

            {/* Chest Armor */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-stone-500 font-mono mb-0.5">胸甲</span>
              {renderSocket('armor', eq.armor, '胸甲', Shield)}
            </div>

            {/* Offhand (Shield / Totem) */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-stone-500 font-mono mb-0.5">副手</span>
              {renderSocket('offhand', eq.offhand, '副手', Shield)}
            </div>
          </div>

          {/* Lower Body: Boots & Ring */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-stone-500 font-mono mb-0.5">战靴</span>
              {renderSocket('boots', eq.boots, '战靴', Footprints)}
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-stone-500 font-mono mb-0.5">护符</span>
              {renderSocket('ring', eq.ring, '戒指', CircleDot)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer prompt */}
      <div className="w-full mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400">
        <span>点击人偶槽位可选中查看装备明细</span>
        <span className="font-mono text-stone-500">职业视觉共鸣 100%</span>
      </div>
    </div>
  );
};
