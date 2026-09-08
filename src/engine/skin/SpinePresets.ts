import { SpinePuppetConfig, SpineSlotKey, SpineSlotData } from './spineTypes';
import { SpineSlotProcedural } from './SpineSlotProcedural';

export interface SpinePresetBundle {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: SpinePuppetConfig;
}

export function createDefaultSlot(
  id: SpineSlotKey,
  preset: 'knight' | 'mage' | 'skeleton' | 'mecha' = 'knight'
): SpineSlotData {
  const names: Record<SpineSlotKey, string> = {
    head: '头部 (Head)',
    torso: '躯干 (Torso)',
    armLeft: '左手/副手臂 (Left Arm)',
    armRight: '右手/主手 (Right Arm)',
    legLeft: '左腿 (Left Leg)',
    legRight: '右腿 (Right Leg)',
  };

  const pivots: Record<SpineSlotKey, { x: number; y: number }> = {
    head: { x: 0.5, y: 0.85 },    // Neck pivot
    torso: { x: 0.5, y: 0.65 },   // Pelvis/center
    armLeft: { x: 0.5, y: 0.15 }, // Shoulder pivot
    armRight: { x: 0.5, y: 0.15 },// Shoulder pivot
    legLeft: { x: 0.5, y: 0.1 },  // Hip joint
    legRight: { x: 0.5, y: 0.1 }, // Hip joint
  };

  const zIndexes: Record<SpineSlotKey, number> = {
    armLeft: 10,   // Back arm
    legLeft: 20,   // Back leg
    torso: 30,     // Center body
    legRight: 40,  // Front leg
    head: 50,      // Head
    armRight: 60,  // Front arm (holds weapon)
  };

  return {
    id,
    name: names[id],
    dataUrl: SpineSlotProcedural.createSlotSprite(preset, id),
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
    rotationDeg: 0,
    pivotX: pivots[id].x,
    pivotY: pivots[id].y,
    visible: true,
    zIndex: zIndexes[id],
  };
}

export function createSpinePuppet(
  name: string,
  preset: 'knight' | 'mage' | 'skeleton' | 'mecha'
): SpinePuppetConfig {
  return {
    enabled: true,
    mode: 'spine',
    name,
    overallScale: 1.0,
    offsetY: 0,
    bounceAnimation: true,
    showWeaponOverlay: true,
    weaponOffsetX: 0,
    weaponOffsetY: 0,
    weaponRotationDeg: 0,
    weaponScale: 1.0,
    proportionPreset: '2.5',
    slots: {
      head: createDefaultSlot('head', preset),
      torso: createDefaultSlot('torso', preset),
      armLeft: createDefaultSlot('armLeft', preset),
      armRight: createDefaultSlot('armRight', preset),
      legLeft: createDefaultSlot('legLeft', preset),
      legRight: createDefaultSlot('legRight', preset),
    },
  };
}

export const SPINE_PRESETS: SpinePresetBundle[] = [
  {
    id: 'preset_paladin',
    name: '秘银圣骑装配',
    description: '头盔羽翎、蓝金胸甲与全套重钢甲关节',
    icon: '🛡️',
    config: createSpinePuppet('秘银圣骑装配', 'knight'),
  },
  {
    id: 'preset_wizard',
    name: '星穹秘术导师',
    description: '尖顶兜帽、奥术法袍长衫与流云法衣',
    icon: '🔮',
    config: createSpinePuppet('星穹秘术导师', 'mage'),
  },
  {
    id: 'preset_undead',
    name: '深渊白骨狂徒',
    description: '白骨骷髅头颅、惨白肋排与幽火眼眶',
    icon: '💀',
    config: createSpinePuppet('深渊白骨狂徒', 'skeleton'),
  },
  {
    id: 'preset_automaton',
    name: '黄铜发条魔像',
    description: '透镜机箱、动力熔炉胸膛与机械铰链臂',
    icon: '⚙️',
    config: createSpinePuppet('黄铜发条魔像', 'mecha'),
  },
];
