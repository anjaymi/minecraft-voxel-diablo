import { SpinePuppetConfig, SpineSlotKey, SkeletonPose } from './spineTypes';
import { SpineKinematics } from './SpineKinematics';
import { spineImageLoader } from './SpineSlotImageLoader';
import { Player } from '../../types';
import { PlayerWeaponManager } from '../weapons/PlayerWeaponManager';
import { SpineDetailedLimbRenderer } from './SpineDetailedLimbRenderer';

export class ModularSpineRenderer {
  /**
   * 骨骼素体基准脚底对齐偏移量 (Ground Alignment Offset)
   * 消除 2 头身骨骼模型腿部长度 (28px) 与质心 (-22px) 带来的脚底下沉偏差，
   * 使得缩放 40% 时脚底依然严丝合缝紧贴地表 y=0 锚点，彻底解决缩放位移偏移 bug。
   */
  public static readonly SKELETON_GROUND_ALIGNMENT_Y: number = -15;

  /**
   * Render modular Spine skeletal puppet on Canvas
   */
  public static renderSpinePuppet(
    ctx: CanvasRenderingContext2D,
    config: SpinePuppetConfig,
    player: Player | null,
    time: number,
    poseOverride?: SkeletonPose
  ): boolean {
    if (!config.enabled || !config.slots) return false;

    const pose = poseOverride || SpineKinematics.computePose(player, time);
    const overallScale = config.overallScale || 1.0;
    const offsetY = (config.offsetY || 0) + ModularSpineRenderer.SKELETON_GROUND_ALIGNMENT_Y;

    ctx.save();
    ctx.translate(0, offsetY);
    ctx.scale(overallScale, overallScale);

    // 1. Soft Dynamic Ground Shadow (Preview Canvas only; Game utilizes ShadowSystem)
    // Anchored at ground surface y=0 where chibi boots touch the pedestal
    if (!player) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Sort slots by zIndex
    const slotKeys: SpineSlotKey[] = Object.keys(config.slots) as SpineSlotKey[];
    const sortedSlots = slotKeys
      .map((key) => config.slots[key])
      .filter((s) => s && s.visible && s.dataUrl)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Resolve authoritative hand bone socket from skeletal kinematics
    const isLeftHand = config.weaponHand === 'left';
    const targetSlotKey: SpineSlotKey = isLeftHand ? 'armLeft' : 'armRight';

    // Calculate authoritative weapon layering (z-index)
    const armSlotZ = config.slots[targetSlotKey]?.zIndex ?? (isLeftHand ? 10 : 60);
    let effectiveWeaponZ = config.weaponZIndex;
    if (effectiveWeaponZ === undefined) {
      const preset = config.weaponLayerPreset || 'over_hand';
      switch (preset) {
        case 'front':
          effectiveWeaponZ = 100;
          break;
        case 'behind_body':
          effectiveWeaponZ = 5;
          break;
        case 'behind_arm':
          effectiveWeaponZ = Math.max(1, armSlotZ - 2);
          break;
        case 'over_hand':
        default:
          effectiveWeaponZ = armSlotZ + 2;
          break;
      }
    }

    let weaponSocketBone: { x: number; y: number; rotation: number };
    if (pose.fine) {
      if (isLeftHand) {
        const bone = pose.fine.armLeft.palm || pose.fine.armLeft.end;
        weaponSocketBone = { x: bone.x, y: bone.y, rotation: bone.rotation };
      } else {
        const bone = pose.fine.weapon || pose.fine.armRight.palm || pose.fine.armRight.end;
        weaponSocketBone = { x: bone.x, y: bone.y, rotation: bone.rotation };
      }
    } else {
      const arm = isLeftHand ? pose.armLeft : pose.armRight;
      weaponSocketBone = { x: arm.x, y: arm.y + 14, rotation: arm.rotation };
    }

    let weaponRendered = false;
    const renderWeaponOverlay = () => {
      if (!config.showWeaponOverlay || weaponRendered) return;
      weaponRendered = true;

      ctx.save();
      const armSlot = config.slots[targetSlotKey];
      const armShiftX = armSlot?.offsetX || 0;
      const armShiftY = armSlot?.offsetY || 0;
      const wX = config.weaponOffsetX || 0;
      const wY = config.weaponOffsetY || 0;
      const wRot = (((config.weaponRotationDeg || 0) * Math.PI) / 180);
      const wScale = config.weaponScale || 1.0;

      ctx.translate(weaponSocketBone.x + armShiftX + wX, weaponSocketBone.y + armShiftY + wY);
      if (weaponSocketBone.rotation !== 0) ctx.rotate(weaponSocketBone.rotation);
      if (wRot !== 0) ctx.rotate(wRot);

      const scaleX = (config.weaponFlipX ? -1 : 1) * wScale;
      const scaleY = (config.weaponFlipY ? -1 : 1) * wScale;
      if (scaleX !== 1.0 || scaleY !== 1.0) ctx.scale(scaleX, scaleY);

      if (player) {
        PlayerWeaponManager.drawMainWeapon(ctx, player, time, true);
      } else {
        // Preview fallback weapon (iron sword)
        const mockPlayer = {
          characterClass: 'warrior',
          equipment: { weapon: { subType: 'sword' } },
          attackTimer: 0,
          isAttacking: false,
        } as unknown as Player;
        PlayerWeaponManager.drawMainWeapon(ctx, mockPlayer, time, true);
      }
      ctx.restore();
    };

    // If puppet has no uploaded PNG slots yet, render procedural fine articulated puppet
    if (sortedSlots.length === 0 && pose.fine) {
      if (effectiveWeaponZ <= 10) renderWeaponOverlay(); // Behind body
      SpineDetailedLimbRenderer.drawArticulatedArm(ctx, pose.fine.armLeft, false, player || ({} as Player));
      if (isLeftHand && effectiveWeaponZ <= 15) renderWeaponOverlay();

      SpineDetailedLimbRenderer.drawArticulatedLeg(ctx, pose.fine.legLeft, false, player || ({} as Player));
      SpineDetailedLimbRenderer.drawSegmentedTorso(ctx, pose.fine.chest, pose.fine.pelvis, player || ({} as Player));
      if (effectiveWeaponZ <= 35) renderWeaponOverlay(); // Between body and front arm

      SpineDetailedLimbRenderer.drawArticulatedLeg(ctx, pose.fine.legRight, true, player || ({} as Player));
      SpineDetailedLimbRenderer.drawArticulatedArm(ctx, pose.fine.armRight, true, player || ({} as Player));
      if (!isLeftHand && effectiveWeaponZ <= 65) renderWeaponOverlay();

      // Head placeholder
      ctx.save();
      ctx.translate(pose.head.x, pose.head.y);
      ctx.rotate(pose.head.rotation);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      if (!weaponRendered) renderWeaponOverlay(); // In front of everything
    }

    // 3. Render Uploaded Slots along their Bone Matrix with dynamic weapon z-ordering
    for (const slot of sortedSlots) {
      // If weapon layer is lower or equal to this slot's z-index, render weapon first
      if (!weaponRendered && config.showWeaponOverlay && effectiveWeaponZ <= (slot.zIndex || 0)) {
        renderWeaponOverlay();
      }

      const bone = pose[slot.id];
      if (!bone) continue;

      const img = spineImageLoader.getImage(slot.dataUrl);
      if (!img) continue; // Waiting for load or empty

      ctx.save();
      // Bone origin translate
      ctx.translate(bone.x + slot.offsetX, bone.y + slot.offsetY);

      // Bone rotation + slot rotation
      const totalRot = bone.rotation + (slot.rotationDeg * Math.PI) / 180;
      ctx.rotate(totalRot);

      // Slot local scale
      const s = slot.scale || 1.0;
      ctx.scale(s, s);

      // Draw relative to pivot
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const px = slot.pivotX ?? 0.5;
      const py = slot.pivotY ?? 0.5;

      ctx.imageSmoothingEnabled = w < 64;
      ctx.drawImage(img, -w * px, -h * py, w, h);
      ctx.restore();
    }

    // Fallback/Top layer: render weapon if weapon z-index is higher than all slots (e.g. 100)
    if (!weaponRendered && config.showWeaponOverlay) {
      renderWeaponOverlay();
    }

    // Dynamic blade slash crescent trail, particles & ground shockwave
    if (pose.fine) {
      SpineDetailedLimbRenderer.drawSlashWaveTrail(ctx, pose.fine);
      SpineDetailedLimbRenderer.drawPhysicsParticles(ctx, pose.fine);
      SpineDetailedLimbRenderer.drawGroundImpaleShockwave(ctx, pose.fine);
    }

    ctx.restore();
    return true;
  }
}
