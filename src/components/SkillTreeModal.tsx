import React from 'react';
import { Player } from '../types';
import { skillSystem, SKILL_TREES, SKILLS } from '../engine/skillSystem';
import { X, Lock, Unlock, Zap, BrainCircuit, Shield } from 'lucide-react';
import { classSystem } from '../engine/classSystem';

interface SkillTreeModalProps {
  player: Player;
  onClose: () => void;
  onUpdate: () => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ player, onClose, onUpdate }) => {
  const [selectedSkill, setSelectedSkill] = React.useState<string | null>(null);
  const [assignMode, setAssignMode] = React.useState<boolean>(false);

  const currentTree = SKILL_TREES[player.characterClass];
  const classDef = classSystem.getClass(player.characterClass);

  const handleUnlock = (skillId: string) => {
    if (skillSystem.unlockSkill(player, skillId)) {
      onUpdate();
    }
  };

  const handleAssign = (hotkey: string) => {
    if (selectedSkill && player.unlockedSkills[selectedSkill] > 0) {
      // Check if skill is active/dash (passives can't be assigned)
      const skillDef = SKILLS[selectedSkill];
      if (skillDef.type === 'active' || skillDef.type === 'dash' || skillDef.type === 'aura') {
        skillSystem.assignHotkey(player, hotkey, selectedSkill);
        setAssignMode(false);
        onUpdate();
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="relative flex h-full max-h-[800px] w-full max-w-5xl flex-col rounded-xl border-2 bg-stone-900 shadow-2xl overflow-hidden" style={{ borderColor: classDef.themeColor }}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-800 bg-stone-950 p-4" style={{ borderBottomColor: `${classDef.themeColor}40` }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-stone-900 text-xl shadow-inner" style={{ borderColor: classDef.themeColor, color: classDef.themeColor }}>
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel tracking-wider text-stone-100 flex items-center gap-2">
                技能树 (Skill Tree) - <span style={{ color: classDef.themeColor }}>{classDef.name}</span>
              </h2>
              <p className="text-xs text-stone-400">分配技能点数并配置快捷键</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-stone-400">可用技能点</span>
              <span className="text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                {player.skillPoints}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Tree Canvas */}
          <div className="relative flex-1 bg-stone-900/50 p-8 overflow-y-auto">
            <div className="relative mx-auto w-full max-w-lg aspect-square">
              {/* Draw Lines */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none">
                {currentTree.nodes.map(node => {
                  return node.reqNodes.map(reqId => {
                    const reqNode = currentTree.nodes.find(n => n.skillId === reqId);
                    if (!reqNode) return null;
                    
                    const isUnlocked = player.unlockedSkills[node.skillId] > 0;
                    
                    return (
                      <line
                        key={`${reqId}-${node.skillId}`}
                        x1={`${reqNode.x}%`}
                        y1={`${reqNode.y}%`}
                        x2={`${node.x}%`}
                        y2={`${node.y}%`}
                        stroke={isUnlocked ? classDef.themeColor : '#444'}
                        strokeWidth={isUnlocked ? 3 : 2}
                        strokeDasharray={isUnlocked ? 'none' : '4 4'}
                        className="transition-all duration-300"
                      />
                    );
                  });
                })}
              </svg>

              {/* Draw Nodes */}
              {currentTree.nodes.map(node => {
                const skill = SKILLS[node.skillId];
                const level = player.unlockedSkills[node.skillId] || 0;
                const canUnlock = skillSystem.canUnlock(player, node.skillId);
                const isSelected = selectedSkill === node.skillId;
                const isMax = level >= skill.maxLevel;

                let nodeColor = '#3f3f46'; // stone-700
                let borderColor = '#27272a'; // stone-800
                
                if (level > 0) {
                  nodeColor = `${classDef.themeColor}30`;
                  borderColor = classDef.themeColor;
                } else if (canUnlock) {
                  nodeColor = '#422006'; // amber-950
                  borderColor = '#fbbf24'; // amber-400
                }

                return (
                  <button
                    key={node.skillId}
                    onClick={() => { setSelectedSkill(node.skillId); setAssignMode(false); }}
                    className={`absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-lg border-2 shadow-lg transition-transform hover:scale-110 active:scale-95 ${isSelected ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-stone-900 z-10' : 'z-0'}`}
                    style={{ 
                      left: `${node.x}%`, 
                      top: `${node.y}%`,
                      backgroundColor: nodeColor,
                      borderColor: borderColor
                    }}
                  >
                    <span className="text-2xl drop-shadow">{skill.icon}</span>
                    <div className="absolute -bottom-2.5 rounded border border-stone-700 bg-stone-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-stone-200">
                      {level}/{skill.maxLevel}
                    </div>
                    {level === 0 && !canUnlock && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                        <Lock className="h-5 w-5 text-stone-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Skill Details & Action */}
          <div className="w-80 border-l-2 border-stone-800 bg-stone-950/80 p-6 flex flex-col">
            {selectedSkill ? (
              <>
                {(() => {
                  const skill = SKILLS[selectedSkill];
                  const level = player.unlockedSkills[selectedSkill] || 0;
                  const canUnlock = skillSystem.canUnlock(player, selectedSkill);
                  const isMax = level >= skill.maxLevel;
                  const isAssignable = level > 0 && (skill.type === 'active' || skill.type === 'dash' || skill.type === 'aura');

                  return (
                    <div className="flex flex-col h-full animate-fade-in">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-stone-600 bg-stone-800 text-3xl shadow-inner">
                          {skill.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-stone-100">{skill.name}</h3>
                          <div className="flex gap-2 text-xs">
                            <span className="text-stone-400">{skill.type === 'active' ? '主动技能' : skill.type === 'passive' ? '被动技能' : skill.type === 'dash' ? '位移技能' : '光环技能'}</span>
                            <span className="text-stone-600">|</span>
                            <span className={skill.element === 'fire' ? 'text-red-400' : skill.element === 'cold' ? 'text-cyan-400' : skill.element === 'poison' ? 'text-green-400' : 'text-stone-400'}>
                              {skill.element.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-stone-300 mb-6 leading-relaxed">
                        {skill.description}
                      </p>

                      <div className="flex flex-col gap-2 rounded-lg border border-stone-800 bg-stone-900/50 p-3 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">当前等级</span>
                          <span className="font-mono font-bold text-stone-200">{level} / {skill.maxLevel}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">冷却时间</span>
                          <span className="font-mono font-bold text-cyan-400">{skill.cooldown > 0 ? `${skill.cooldown}s` : '-'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">法力消耗</span>
                          <span className="font-mono font-bold text-blue-400">{skill.manaCost > 0 ? skill.manaCost : '-'}</span>
                        </div>
                        {skill.baseDamage && (
                          <div className="flex justify-between text-xs">
                            <span className="text-stone-500">基础伤害</span>
                            {/* 数值平衡(2026-09): 每级+6，与引擎每级伤害成长一致 */}
                            <span className="font-mono font-bold text-red-400">{skill.baseDamage + (level > 0 ? (level-1) * 6 : 0)}</span>
                          </div>
                        )}
                      </div>

                      {/* Combo Chain Synergy Hint */}
                      <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-2.5 mb-4 text-xs">
                        <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
                          ⚡ 技能连携增效 (COMBO CHAIN):
                        </span>
                        <span className="text-stone-300 leading-tight block">
                          {skill.id.includes('whirlwind') && '普攻三连击终结或跃击落地后施放，触发[旋风斩连携]，伤害提升40%并牵引敌群！'}
                          {skill.id.includes('leap') && '命中震地后可直接零CD连携旋风斩，形成无缝狂暴连打！'}
                          {skill.id.includes('fireball') && '奥术弹连击后施放，引爆奥术余烬引发超大范围元素灼烧！'}
                          {skill.id.includes('multishot') && '贯穿重箭或翻滚后立即施放，触发[追猎箭雨]，额外发射扇面风暴箭矢！'}
                          {skill.id.includes('backstab') && '暗影潜行或瞬步背刺触发1.85倍致死暴击，无缝衔接淬毒飞刀！'}
                          {skill.id.includes('stealth') && '潜行状态破隐击必暴击，并且使全队背刺毒伤翻倍！'}
                          {!skill.id.includes('whirlwind') && !skill.id.includes('leap') && !skill.id.includes('fireball') && !skill.id.includes('multishot') && !skill.id.includes('backstab') && !skill.id.includes('stealth') && '在主手重击三连落地或位移后施放，享受技能连携伤害加成与硬直抵消！'}
                        </span>
                      </div>

                      <div className="mt-auto flex flex-col gap-3">
                        {!isMax && (
                          <button
                            onClick={() => handleUnlock(selectedSkill)}
                            disabled={!canUnlock}
                            className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold shadow-lg transition-all ${
                              canUnlock
                                ? 'bg-amber-600 text-white hover:bg-amber-500 active:scale-95'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            {level === 0 ? <Unlock className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                            {level === 0 ? '解锁技能 (1 技能点)' : '升级技能 (1 技能点)'}
                          </button>
                        )}
                        {isMax && (
                          <div className="w-full text-center py-2 text-sm font-bold text-amber-500">
                            已达到最高等级
                          </div>
                        )}

                        {isAssignable && (
                          <div className="mt-2">
                            {assignMode ? (
                              <div className="rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-950/20 p-3 text-center">
                                <p className="text-xs font-bold text-amber-400 mb-2">选择一个键位进行装备：</p>
                                <div className="flex justify-center gap-2">
                                  {['1', '2', '3', '4', 'q'].map(k => (
                                    <button 
                                      key={k}
                                      onClick={() => handleAssign(k)}
                                      className="flex h-8 w-8 items-center justify-center rounded border border-stone-600 bg-stone-800 text-xs font-mono font-bold text-white hover:border-amber-400 hover:text-amber-400"
                                    >
                                      {k.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAssignMode(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-700 bg-stone-800 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
                              >
                                装配到快捷键
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-stone-500">
                <BrainCircuit className="mb-3 h-12 w-12 opacity-20" />
                <p>点击左侧节点<br/>查看技能详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
