import { CustomSkinConfig } from '../../types';

export interface SkinPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  avatarIcon: string;
  config: CustomSkinConfig;
}

/**
 * Generate a procedural clean crisp canvas data-url for fallback presets
 */
function createPresetDataUrl(type: 'knight' | 'mage' | 'slime' | 'ninja' | 'ranger' | 'monk' | 'necro'): string {
  if (typeof document === 'undefined') return ''; // 非浏览器环境（测试）跳过程序化生成
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  // 通用小人基底（身体/腿/头），各类型再叠加特征
  const drawBase = (body: string, limb: string, head: string) => {
    ctx.fillStyle = limb;
    ctx.fillRect(22, 58, 8, 18);
    ctx.fillRect(34, 58, 8, 18);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(16, 30, 32, 30, 6);
    ctx.fill();
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.roundRect(18, 4, 28, 28, 9);
    ctx.fill();
  };

  if (type === 'ranger') {
    // 翠林游侠：绿帽斗篷 + 皮质护胸
    drawBase('#3f6212', '#3a2c18', '#fde2d7');
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(14, 16); ctx.lineTo(50, 16); ctx.lineTo(32, -2); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(18, 30, 28, 8);
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.roundRect(14, 38, 36, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.arc(26, 20, 3, 0, Math.PI * 2); ctx.arc(38, 20, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'monk') {
    // 山岳武僧：橙袍束带 + 斗笠
    drawBase('#ea580c', '#7c2d12', '#fde2d7');
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(32, 12, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(24, 44, 16, 5);
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.arc(26, 20, 2.6, 0, Math.PI * 2); ctx.arc(38, 20, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'necro') {
    // 死灵术士：紫袍兜帽 + 幽绿眼
    drawBase('#4c1d95', '#2e1065', '#1e1b4b');
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.moveTo(16, 30); ctx.lineTo(48, 30); ctx.lineTo(32, 2); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.arc(26, 22, 3.2, 0, Math.PI * 2); ctx.arc(38, 22, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(167, 139, 250, 0.65)';
    ctx.beginPath();
    ctx.arc(32, 30, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'slime') {
    // Cute Emerald Cube Slime
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(12, 30, 40, 36, [16, 16, 8, 8]);
    ctx.fill();

    // Inner jelly cube
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.roundRect(18, 36, 28, 24, 6);
    ctx.fill();

    // Big happy eyes
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.arc(24, 46, 4, 0, Math.PI * 2);
    ctx.arc(40, 46, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye shines
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(22.5, 44.5, 1.5, 0, Math.PI * 2);
    ctx.arc(38.5, 44.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Soft blush
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(17, 52, 3, 0, Math.PI * 2);
    ctx.arc(47, 52, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'knight') {
    // Classic Retro Pixel Blue Knight
    // Torso
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(20, 34, 24, 24);
    // Gold Belt
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(20, 52, 24, 6);
    // Silver Helmet
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(16, 10, 32, 24);
    // Visor slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 20, 24, 5);
    // Visor glow
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(24, 21, 6, 3);
    // Red Crest Plume
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(28, 2, 8, 10);
    // Legs & Boots
    ctx.fillStyle = '#475569';
    ctx.fillRect(22, 58, 8, 16);
    ctx.fillRect(34, 58, 8, 16);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 68, 10, 8);
    ctx.fillRect(34, 68, 10, 8);
  } else if (type === 'mage') {
    // Arcane Star Robe Scholar
    // Violet Cloak
    ctx.fillStyle = '#6b21a8';
    ctx.beginPath();
    ctx.moveTo(32, 24);
    ctx.lineTo(12, 72);
    ctx.lineTo(52, 72);
    ctx.closePath();
    ctx.fill();
    // Pointed Wizard Hat
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.moveTo(32, 2);
    ctx.lineTo(14, 24);
    ctx.lineTo(50, 24);
    ctx.closePath();
    ctx.fill();
    // Hat brim
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(10, 22, 44, 5);
    // Golden Star on Hat
    ctx.fillStyle = '#facc15';
    ctx.fillRect(30, 14, 4, 4);
    // Mysterious Glowing Eyes in Shadow
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(22, 26, 20, 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(26, 29, 3, 3);
    ctx.fillRect(35, 29, 3, 3);
  } else {
    // Shadow Ninja
    ctx.fillStyle = '#18181b';
    ctx.fillRect(18, 14, 28, 22); // Hood
    ctx.fillRect(20, 36, 24, 22); // Torso
    // Red Ninja Scarf
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, 32, 28, 6);
    ctx.fillRect(10, 34, 10, 18); // Floating scarf tail
    // Keen Eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(24, 22, 4, 2);
    ctx.fillRect(36, 22, 4, 2);
    // Legs
    ctx.fillStyle = '#27272a';
    ctx.fillRect(22, 58, 8, 16);
    ctx.fillRect(34, 58, 8, 16);
  }

  return canvas.toDataURL('image/png');
}

export const DEFAULT_SKIN_PRESETS: SkinPreset[] = [
  {
    id: 'preset_knight',
    name: '经典像素圣骑',
    category: '复古',
    description: '身披蓝袍与秘银头盔的古典地下城骑士',
    avatarIcon: '🛡️',
    config: {
      enabled: true,
      dataUrl: createPresetDataUrl('knight'),
      name: '经典像素圣骑',
      scale: 1.1,
      offsetY: 0,
      bounceAnimation: true,
      showWeaponOverlay: true,
    },
  },
  {
    id: 'preset_slime',
    name: '蹦跳小史莱姆',
    category: '萌系',
    description: 'Q弹通透的翡翠果冻史莱姆，行走自带果冻微弹',
    avatarIcon: '🟢',
    config: {
      enabled: true,
      dataUrl: createPresetDataUrl('slime'),
      name: '蹦跳小史莱姆',
      scale: 1.15,
      offsetY: 2,
      bounceAnimation: true,
      showWeaponOverlay: false,
    },
  },
  {
    id: 'preset_mage',
    name: '星穹法师兜帽',
    category: '法术',
    description: '戴着尖顶大兜帽与星辉光斑的神秘施法者',
    avatarIcon: '🔮',
    config: {
      enabled: true,
      dataUrl: createPresetDataUrl('mage'),
      name: '星穹法师兜帽',
      scale: 1.1,
      offsetY: 0,
      bounceAnimation: true,
      showWeaponOverlay: true,
    },
  },
  {
    id: 'preset_ranger',
    name: '翠林游侠',
    category: '敏捷',
    description: '绿帽斗篷的丛林猎手，与荒野为伴',
    avatarIcon: '🏹',
    config: {
      enabled: true,
      dataUrl: createPresetDataUrl('ranger'),
      name: '翠林游侠',
      scale: 1.05,
      offsetY: 0,
      bounceAnimation: true,
      showWeaponOverlay: true,
    },
  },
  {
    id: 'preset_monk',
    name: '山岳武僧',
    category: '复古',
    description: '橙袍束带、头戴斗笠的苦行武者',
    avatarIcon: '👊',
    config: {
      enabled: true,
      dataUrl: createPresetDataUrl('monk'),
      name: '山岳武僧',
      scale: 1.05,
      offsetY: 0,
      bounceAnimation: true,
      showWeaponOverlay: false,
    },
  },
  {
    id: 'preset_necro',
    name: '午夜死灵',
    category: '法术',
    description: '紫袍兜帽下幽绿双瞳的低语者',
    avatarIcon: '💀',
    config: {
      enabled: true,
      dataUrl: createPresetDataUrl('necro'),
      name: '午夜死灵',
      scale: 1.1,
      offsetY: 0,
      bounceAnimation: true,
      showWeaponOverlay: true,
    },
  },
  {
    id: 'preset_ninja',
    name: '绯红暗影游侠',
    category: '敏捷',
    description: '身穿黑衣、配有飞扬绯红围巾的幽灵刺客',
    avatarIcon: '🥷',
    config: {
      enabled: true,
      dataUrl: createPresetDataUrl('ninja'),
      name: '绯红暗影游侠',
      scale: 1.05,
      offsetY: 0,
      bounceAnimation: true,
      showWeaponOverlay: true,
    },
  },
];
