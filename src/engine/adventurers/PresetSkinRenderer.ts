import { CustomSkinConfig, Player } from '../../types';
import { DEFAULT_SKIN_PRESETS } from '../skin/CustomSkinPresets';
import { PlayerWeaponManager } from '../weapons/PlayerWeaponManager';
import { CharacterOrientationManager } from '../orientation/CharacterOrientationManager';

/**
 * PresetSkinRenderer — 按实体渲染预设皮肤（替代已废弃的黏土人比例）。
 *
 * 与玩家同一套视觉语言：程序化像素预设（圣骑/法师/忍者），
 * 每个冒险者持有自己的 CustomSkinConfig 副本，互不影响玩家的全局皮肤。
 * 图片按 dataUrl 缓存，全部冒险者共享三张位图。
 */

const HUMANOID_PRESETS = [
  'preset_knight', 'preset_mage', 'preset_ninja',
  'preset_ranger', 'preset_monk', 'preset_necro',
] as const;

const imageCache = new Map<string, HTMLImageElement>();

/** 按职业分配预设皮肤（六款：圣骑/法师/忍者/游侠/武僧/死灵） */
export function assignPresetSkin(actor: Player, charClass: string, rng: () => number = Math.random): void {
  let presetId: string;
  switch (charClass) {
    case 'warrior': presetId = 'preset_knight'; break;
    case 'summoner': presetId = 'preset_necro'; break;
    case 'mage': presetId = 'preset_mage'; break;
    case 'druid': presetId = 'preset_ranger'; break;
    case 'ranger': presetId = rng() < 0.5 ? 'preset_ranger' : 'preset_ninja'; break;
    case 'rogue': presetId = rng() < 0.5 ? 'preset_ninja' : 'preset_monk'; break;
    default: presetId = HUMANOID_PRESETS[Math.floor(rng() * HUMANOID_PRESETS.length)];
  }

  const preset = DEFAULT_SKIN_PRESETS.find((p) => p.id === presetId);
  if (preset) {
    actor.customSkin = { ...preset.config, enabled: true };
  }
}

function getImage(config: CustomSkinConfig): HTMLImageElement | null {
  if (!config.dataUrl) return null;
  let img = imageCache.get(config.dataUrl);
  if (!img) {
    img = new Image();
    img.src = config.dataUrl;
    imageCache.set(config.dataUrl, img);
  }
  if (!img.complete || img.naturalWidth === 0) return null;
  return img;
}

/**
 * 渲染预设皮肤（脚底锚定，含弹跳/跑步动态与武器叠加）。
 * @returns 是否实际绘制（false 时调用方可回退渲染）
 */
export function renderPresetSkin(
  ctx: CanvasRenderingContext2D,
  actor: Player,
  time: number,
  hostileTint: boolean = false
): boolean {
  const config = actor.customSkin;
  if (!config?.enabled || !config.dataUrl) return false;
  const img = getImage(config);
  if (!img) return false;

  const isMoving = Math.abs(actor.vx) > 0.05 || Math.abs(actor.vy) > 0.05;
  const walkCycle = isMoving ? Math.sin(time * 12) : 0;
  const bodyBob = config.bounceAnimation
    ? (isMoving ? Math.abs(walkCycle) * 3.5 : Math.sin(time * 3.2) * 1.2)
    : 0;

  if (hostileTint) {
    ctx.filter = 'sepia(0.45) hue-rotate(-35deg) brightness(0.92)';
  } else if (actor.hurtTimer > 0) {
    ctx.filter = 'drop-shadow(0 0 6px #ef4444) brightness(1.3)';
  }

  // 与玩家渲染同源：70px 基线 × 统一 40% chibi 缩放（保证体型一致）
  const unified = CharacterOrientationManager.UNIFIED_CHIBI_SCALE;
  const baseTargetHeight = 70 * (config.scale || 1.0);
  const aspect = img.naturalWidth / img.naturalHeight;
  const renderWidth = baseTargetHeight * aspect;
  const renderHeight = baseTargetHeight;
  const drawX = -renderWidth / 2;
  const drawY = -renderHeight - bodyBob + (config.offsetY || 0);

  ctx.save();
  ctx.scale(unified, unified);
  if (config.bounceAnimation && isMoving) {
    ctx.rotate(Math.sin(time * 12) * 0.05);
  }
  ctx.imageSmoothingEnabled = renderWidth < 64;
  ctx.drawImage(img, drawX, drawY, renderWidth, renderHeight);
  ctx.restore();

  if (config.showWeaponOverlay) {
    ctx.save();
    ctx.scale(unified, unified);
    ctx.translate(renderWidth * 0.25, drawY + renderHeight * 0.65);
    ctx.scale(0.55, 0.55);
    PlayerWeaponManager.drawMainWeapon(ctx, actor, time);
    ctx.restore();
  }

  ctx.filter = 'none';
  return true;
}
