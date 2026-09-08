import React from 'react';
import { Player, Enemy } from '../types';
import { Backpack, Heart, Zap, Bomb, Apple, Eye } from 'lucide-react';
import { SKILLS } from '../engine/skillSystem';
import { calculateDynamicWeaponStats } from '../engine/weaponBaseConfig';
import { TopStatusBar } from './hud/TopStatusBar';
import { CombatFeedbackBar } from './hud/CombatFeedbackBar';
import { CastingProgressBar } from './hud/CastingProgressBar';

interface DiabloHUDProps {
  player: Player;
  boss: Enemy | undefined;
  zoneName: string;
  totalKills: number;
  onOpenInventory: () => void;
  onOpenCamp: () => void;
  onOpenClassSelect?: () => void;
  onOpenSkillTree?: () => void;
  onOpenSkinModal?: () => void;
  onOpenAttackMotionModal?: () => void;
  onOpenWeaponModal?: () => void;
  onUseSkill1: () => void;
  onUseSkill2: () => void;
  onUseSkill3: () => void;
  onUseSkill4: () => void;
  onUsePotion: () => void;
}

export const DiabloHUD: React.FC<DiabloHUDProps> = ({
  player,
  boss,
  zoneName,
  totalKills,
  onOpenInventory,
  onOpenCamp,
  onOpenClassSelect,
  onOpenSkillTree,
  onOpenSkinModal,
  onOpenAttackMotionModal,
  onOpenWeaponModal,
  onUseSkill1,
  onUseSkill2,
  onUseSkill3,
  onUseSkill4,
  onUsePotion,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.stats.hp / player.stats.maxHp) * 100));
  const expPercent = Math.max(0, Math.min(100, (player.stats.exp / player.stats.maxExp) * 100));
  const classId = player.characterClass || 'warrior';
  const dynStats = calculateDynamicWeaponStats(player.equipment.weapon, classId, player.stats);

  const primaryAttackInfo = {
    warrior: { icon: '🗡️', name: '重剑连斩', desc: `${dynStats.effectiveArcDeg}°扇面` },
    mage: { icon: '🪄', name: '引导飞弹', desc: '智能追踪' },
    ranger: { icon: '🏹', name: '连珠疾箭', desc: `${dynStats.effectiveRange}m贯空` },
    rogue: { icon: '🔪', name: '影刃刺杀', desc: '背刺暴击' },
    summoner: { icon: '💀', name: '灵魂飞弹', desc: '穿透汲灵' },
    druid: { icon: '🌿', name: '荆棘藤击', desc: '自然毒伤' },
  }[classId] || { icon: '🗡️', name: '普攻挥砍', desc: '普通攻击' };

  const secondaryAttackInfo = {
    warrior: { icon: '🛡️', name: '破阵壁垒', desc: '架盾/裂地' },
    mage: { icon: '🔮', name: '元素爆轰', desc: '三向爆破' },
    ranger: { icon: '🎯', name: '贯穿狙击', desc: '贯穿强射' },
    rogue: { icon: '🧪', name: '暗影毒刃', desc: '毒伤飞刀' },
    summoner: { icon: '🔥', name: '战团狂暴', desc: '唤狼/全员嗜血' },
    druid: { icon: '🐻', name: '巨熊震击', desc: '裂地击飞' },
  }[classId] || { icon: '🏹', name: '特殊战技', desc: '战术攻击' };

  return (
    <div id="diablo-hud-container" className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-4 select-none safe-top safe-bottom">
      {/* Top Bar */}
      <TopStatusBar
        player={player}
        boss={boss}
        zoneName={zoneName}
        totalKills={totalKills}
        onOpenSkillTree={onOpenSkillTree}
        onOpenClassSelect={onOpenClassSelect}
      />

      {/* Spellcaster & Charged Attack Casting Progress Bar with Release Burst */}
      <CastingProgressBar player={player} />

      {/* Bottom Bar: Health/Mana Orbs & Hotbar */}
      <div className="flex items-end justify-center gap-1 sm:gap-2 md:gap-4 relative">
        {/* Left: Giant Red Health Globe */}
        <div className="pointer-events-auto relative z-20 flex flex-col items-center -mr-1 sm:-mr-3">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-full border-2 md:border-4 border-stone-800 bg-stone-950 p-1 shadow-[0_0_25px_rgba(220,38,38,0.5)] overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-950 via-red-600 to-rose-400 transition-all duration-200"
              style={{ height: `${hpPercent}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-rose-300/60 blur-[1px]" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Heart className="h-5 w-5 text-red-200 drop-shadow mb-0.5" />
              <span className="font-mono text-sm md:text-base font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {player.stats.hp}
              </span>
              <span className="font-mono text-[10px] text-stone-300">/ {player.stats.maxHp}</span>
            </div>
          </div>
          <div className="mt-1 flex gap-1 touch-btn">
            <button
              onClick={onOpenInventory}
              className="rounded border border-stone-700 bg-stone-900/90 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-bold text-amber-400 shadow hover:bg-stone-800 active:scale-95 transition-all flex items-center gap-1"
              title="物品栏 (Inventory - I/B)"
            >
              <Backpack className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">背包 (B)</span>
            </button>
            <button
              onClick={onOpenCamp}
              className="rounded border border-amber-600/80 bg-amber-950/80 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-bold text-amber-300 shadow hover:bg-amber-900 active:scale-95 transition-all touch-btn"
              title="营地大厅 (Camp Hub - H)"
            >
              <span className="hidden sm:inline">营地 (H)</span>
              <span className="sm:hidden">⛺</span>
            </button>
          </div>
        </div>

        {/* Center: Action Hotbar & Dynamic Combat Feedback */}
        <div className="pointer-events-auto relative z-10 flex flex-col items-center rounded-t-xl border-t-2 border-x-2 border-stone-700 bg-gradient-to-b from-stone-900/95 to-stone-950/95 px-2 sm:px-4 pt-2 pb-1 shadow-2xl backdrop-blur-md">
          {/* Dynamic Combat Feedback Ribbon */}
          <CombatFeedbackBar player={player} />

          {/* Skill / Item Slots */}
          <div className="flex items-center gap-1 sm:gap-2 mb-1.5 touch-btn">
            {/* Slot 1: Primary Attack */}
            <div className="group relative flex flex-col items-center">
              <div
                className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded border-2 border-amber-500/80 bg-stone-800 text-stone-100 shadow-inner"
                style={{ boxShadow: `0 0 8px ${dynStats.vfx.glowColor}55` }}
              >
                <span className="text-base sm:text-xl">{primaryAttackInfo.icon}</span>
                <span className="absolute -top-1.5 -right-1 text-[8px] bg-stone-900 font-mono text-emerald-400 font-bold px-1 rounded border border-stone-700">
                  {dynStats.effectiveAttackSpeed}/s
                </span>
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-amber-400 hidden sm:block">L-CLK</span>
              </div>
              <span className="mt-0.5 text-[9px] text-stone-300 font-semibold">{primaryAttackInfo.name}</span>
            </div>

            {/* Slot 2: Secondary Attack */}
            <div className="group relative flex flex-col items-center">
              <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded border-2 border-stone-600 bg-stone-800 text-stone-100 shadow-inner">
                <span className="text-base sm:text-xl">{secondaryAttackInfo.icon}</span>
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-amber-400 hidden sm:block">R-CLK</span>
              </div>
              <span className="mt-0.5 text-[9px] text-stone-400">{secondaryAttackInfo.name}</span>
            </div>

            {/* Tactical Dash */}
            <div className="group relative flex flex-col items-center">
              <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded border-2 border-stone-600 bg-stone-800 text-stone-100 shadow-inner">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                {player.dashCooldown > 0 && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs font-mono font-bold text-yellow-300">
                    {player.dashCooldown.toFixed(1)}
                  </div>
                )}
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-amber-400 hidden sm:block">空格</span>
              </div>
              <span className="mt-0.5 text-[9px] text-stone-400">战术冲刺</span>
            </div>

            <div className="h-8 w-px bg-stone-700 mx-0.5 hidden sm:block" />

            {/* Hotkeys 1, 2, 3, 4, Q */}
            {['1', '2', '3', '4', 'q'].map((hotkey) => {
              const skillId = player.activeSkills[hotkey];
              const skill = skillId ? SKILLS[skillId] : null;

              let defaultIcon = null;
              let defaultName = '未配置';
              if (hotkey === '1') { defaultIcon = <Bomb className="h-5 w-5 text-red-400" />; defaultName = 'TNT轰炸'; }
              if (hotkey === '2') { defaultIcon = <Apple className="h-5 w-5 text-amber-400" />; defaultName = '金苹果'; }
              if (hotkey === '3') { defaultIcon = <Eye className="h-5 w-5 text-emerald-400" />; defaultName = '末影珍珠'; }
              if (hotkey === '4') { defaultIcon = <span className="text-lg">{player.equipment.offhand?.subType === 'shield' ? '🛡️' : '🌪️'}</span>; defaultName = player.equipment.offhand?.subType === 'shield' ? '盾牌壁垒' : '剑刃风暴'; }
              if (hotkey === 'q') { defaultIcon = <span className="text-lg">🧪</span>; defaultName = '治疗药水'; }

              const clickHandler = hotkey === '1' ? onUseSkill1 : hotkey === '2' ? onUseSkill2 : hotkey === '3' ? onUseSkill3 : hotkey === '4' ? onUseSkill4 : onUsePotion;

              let cooldown = skillId ? (player.skillCooldowns[skillId] || 0) : 0;
              if (!skillId) {
                if (hotkey === '1') cooldown = player.skillCooldowns['tnt_toss'] || 0;
                if (hotkey === '2') cooldown = player.skillCooldowns['golden_apple'] || 0;
                if (hotkey === '3') cooldown = player.skillCooldowns['ender_pearl'] || 0;
                if (hotkey === '4') cooldown = player.skillCooldowns[player.equipment.offhand?.subType === 'shield' ? 'shield_bash' : 'whirlwind'] || 0;
                if (hotkey === 'q') cooldown = player.skillCooldowns['potion'] || 0;
              }

              return (
                <button
                  key={hotkey}
                  onClick={clickHandler}
                  className="group relative flex flex-col items-center active:scale-95 transition-transform touch-btn"
                >
                  <div className={`relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded border-2 ${skill ? 'border-amber-500 bg-amber-950/80 hover:border-amber-400' : 'border-stone-600 bg-stone-800 hover:border-stone-500'} text-white shadow-inner`}>
                    {skill ? <span className="text-base sm:text-xl drop-shadow">{skill.icon}</span> : defaultIcon}
                    {cooldown > 0 && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
                        {cooldown.toFixed(1)}
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-amber-400 hidden sm:block">{hotkey.toUpperCase()}</span>
                  </div>
                  <span className="mt-0.5 text-[9px] text-stone-400 hidden sm:block">{skill ? skill.name.split(' ')[0] : defaultName}</span>
                </button>
              );
            })}
          </div>

          {/* Minecraft XP Experience Bar */}
          <div className="relative w-full flex flex-col items-center">
            <span className="absolute -top-3.5 font-mono font-black text-sm text-[#55FF55] drop-shadow-[0_1px_2px_#000]">
              {player.stats.level}
            </span>
            <div className="w-full h-2.5 bg-stone-950 rounded-sm border border-stone-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#55FF55] to-[#80FF00] transition-all duration-150"
                style={{ width: `${expPercent}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-[9px] font-mono text-stone-400 px-1 mt-0.5">
              <span>EXP: {player.stats.exp} / {player.stats.maxExp}</span>
              <span className="hidden sm:block">WASD移动 · 左键攻击 · 右键特技 · 空格冲刺</span>
            </div>
          </div>
        </div>

        {/* Right: Giant Blue Mana/Energy Globe */}
        <div className="pointer-events-auto relative z-20 flex flex-col items-center -ml-1 sm:-ml-3">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-full border-2 md:border-4 border-stone-800 bg-stone-950 p-1 shadow-[0_0_25px_rgba(37,99,235,0.5)] overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-950 via-blue-600 to-cyan-400 transition-all duration-200"
              style={{ height: `100%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-cyan-300/60 blur-[1px]" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Zap className="h-5 w-5 text-cyan-200 drop-shadow mb-0.5" />
              <span className="font-mono text-sm md:text-base font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {player.stats.mana}
              </span>
              <span className="font-mono text-[10px] text-stone-300">/ {player.stats.maxMana}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
