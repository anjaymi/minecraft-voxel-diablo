import { Player, Item } from '../../types';
import { WeaponVisualUtils } from './WeaponRenderTypes';
import { MeleeWeaponRenderer } from './MeleeWeaponRenderer';
import { RangedWeaponRenderer } from './RangedWeaponRenderer';
import { MagicWeaponRenderer } from './MagicWeaponRenderer';
import { DaggerWeaponRenderer } from './DaggerWeaponRenderer';
import { MeleeKinematicsEngine } from '../combat/MeleeKinematicsEngine';
import { MeleeSlashArcRenderer } from './MeleeSlashArcRenderer';
import { WeaponSocketBinder } from './WeaponSocketBinder';
import { weaponSocketAdapter } from './WeaponSocketAdapter';
import { AttackAimSolver } from '../combat/attackAimSolver';

export class PlayerWeaponManager {
  /**
   * Main entry point for drawing player's mainhand weapon with dynamic combo physics and socket transforms.
   */
  public static drawMainWeapon(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    isMountedOnBone: boolean = false
  ) {
    const weapon = player.equipment.weapon;
    const classId = player.characterClass || 'warrior';
    const subType = WeaponVisualUtils.getEffectiveSubType(weapon, classId);
    const colors = WeaponVisualUtils.getWeaponColors(weapon);
    const isAttacking = Boolean(player.isAttacking || (player.attackTimer && player.attackTimer > 0));
    const isBowAiming = Boolean(player.isBowAiming);

    ctx.save();

    const preset = weaponSocketAdapter.getPreset(subType);

    // 1. Ranged Weapons (Bow & Crossbow) Hand Socket Integration with Dynamic Aim Pitch
    if (subType === 'bow' || (classId === 'ranger' && (!weapon || weapon.subType === 'bow'))) {
      const aimPitch = AttackAimSolver.getAimPitchAngle(player);
      if (isMountedOnBone) {
        if (isBowAiming || isAttacking) {
          ctx.translate(preset.idleOffsetX + 1.2, preset.idleOffsetY);
          ctx.rotate(aimPitch + 0.05 + preset.combatAngleOffset);
        } else {
          ctx.translate(preset.idleOffsetX, preset.idleOffsetY);
          ctx.rotate(preset.idleAngle);
        }
      } else if (isBowAiming || isAttacking) {
        ctx.rotate(aimPitch);
      }
      if (preset.scale !== 1.0) {
        ctx.scale(preset.scale, preset.scale);
      }
      RangedWeaponRenderer.drawBow(ctx, colors, isBowAiming, isAttacking, time);
      ctx.restore();
      return;
    }

    if (subType === 'crossbow') {
      const aimPitch = AttackAimSolver.getAimPitchAngle(player);
      if (isMountedOnBone) {
        ctx.translate(preset.idleOffsetX, preset.idleOffsetY);
        if (isAttacking || isBowAiming) {
          ctx.rotate(aimPitch + preset.combatAngleOffset);
          ctx.translate(-1.5, 0); // Short mechanical recoil kick
        } else {
          ctx.rotate(preset.idleAngle);
        }
      } else if (isAttacking || isBowAiming) {
        ctx.rotate(aimPitch);
      }
      if (preset.scale !== 1.0) {
        ctx.scale(preset.scale, preset.scale);
      }
      RangedWeaponRenderer.drawCrossbow(ctx, colors, isAttacking);
      ctx.restore();
      return;
    }

    // 2. Dynamic Melee Slash Kinematics & Socket Binding
    const slashPose = MeleeKinematicsEngine.evaluateSlashPose(player, time);

    if (isMountedOnBone) {
      // Solve anatomical hand-to-blade socket binding
      const socket = WeaponSocketBinder.solveHandSocket(player, slashPose, true);
      ctx.translate(socket.socketX, socket.socketY);
      ctx.rotate(socket.socketAngle);
      if (slashPose.isActive && subType !== 'staff' && subType !== 'wand') {
        MeleeSlashArcRenderer.drawSlashArc(ctx, slashPose, colors, false, true);
      }
    } else if (slashPose.isActive && subType !== 'staff' && subType !== 'wand') {
      // Powerful dynamic forward thrust & arc sweep
      ctx.translate(slashPose.weapon.thrustX, slashPose.weapon.thrustY);
      ctx.rotate(slashPose.weapon.angle + preset.combatAngleOffset);

      // Render high-impact crescent blade smear
      MeleeSlashArcRenderer.drawSlashArc(ctx, slashPose, colors, false);
    } else if (isAttacking && (subType === 'staff' || subType === 'wand')) {
      const p = (player.attackTimer || 0) / 0.26;
      ctx.rotate(-0.4 + (1 - p) * 1.1 + preset.combatAngleOffset);
    } else {
      // Natural configured idle rest angle & offset
      ctx.translate(preset.idleOffsetX, preset.idleOffsetY);
      ctx.rotate(preset.idleAngle);
    }

    // Apply weapon scale around the pivot
    if (preset.scale !== 1.0) {
      ctx.scale(preset.scale, preset.scale);
    }

    // 3. Dispatch to Specialized Class Weapon Renderers
    if (subType === 'staff' || subType === 'wand') {
      MagicWeaponRenderer.drawMagicWeapon(ctx, colors, classId, subType, isAttacking, time);
    } else if (subType === 'dagger') {
      DaggerWeaponRenderer.drawDagger(ctx, colors, isAttacking, false);
    } else if (subType === 'axe') {
      MeleeWeaponRenderer.drawAxe(ctx, colors, isAttacking);
    } else if (subType === 'hammer') {
      MeleeWeaponRenderer.drawHammer(ctx, colors, isAttacking);
    } else if (subType === 'greatsword') {
      MeleeWeaponRenderer.drawGreatsword(ctx, colors, isAttacking);
    } else {
      MeleeWeaponRenderer.drawSword(ctx, colors, isAttacking);
    }

    // 4. Dynamic Weapon Tip Gleam Spark on swing peak
    if (isAttacking && subType !== 'staff' && subType !== 'wand') {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = colors.glow || '#ffffff';
      ctx.shadowBlur = 9;

      let tipX = 0;
      let tipY = -33.5;
      if (subType === 'greatsword') {
        tipY = -46.0;
      } else if (subType === 'dagger') {
        tipX = 1.2;
        tipY = -21.5;
      } else if (subType === 'axe' || subType === 'hammer') {
        tipY = -28.0;
      }

      ctx.beginPath();
      ctx.arc(tipX, tipY, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draws player's offhand gear with class synergies (Dual daggers, Spellbook, Relics, Shields).
   */
  public static drawOffhandGear(
    ctx: CanvasRenderingContext2D,
    offhand: Item | null,
    player: Player,
    time: number
  ) {
    if (!offhand) return;

    ctx.save();
    ctx.translate(-10, -19);

    if (offhand.subType === 'shield') {
      const isBlocking = player.shieldBlockTimer > 0;
      if (isBlocking) {
        ctx.translate(6, -3);
        ctx.rotate(-0.25);
      }
      const isDiamond = offhand.name.includes('钻石') || offhand.name.includes('破阵');
      ctx.fillStyle = isDiamond ? '#06b6d4' : '#78350f';
      ctx.beginPath();
      ctx.roundRect(-4, -9, 8, 18, 3);
      ctx.fill();
      ctx.strokeStyle = isBlocking ? '#38bdf8' : '#cbd5e1';
      ctx.lineWidth = isBlocking ? 2.5 : 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-2, -3, 4, 6, 1);
      ctx.fill();

      if (isBlocking) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (offhand.subType === 'dagger') {
      // Rogue / Ranger Dual Wield Offhand Dagger
      const daggerColors = WeaponVisualUtils.getWeaponColors(offhand);
      DaggerWeaponRenderer.drawDagger(ctx, daggerColors, player.isAttacking, true);
    } else if (offhand.name.includes('秘典') || offhand.name.includes('书') || offhand.name.includes('Tome')) {
      // Mage Floating Spellbook
      const bookBob = Math.sin(time * 4) * 1.5;
      ctx.translate(0, bookBob);
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.roundRect(-5, -6, 10, 12, 1.5);
      ctx.fill();
      ctx.fillStyle = '#f8fafc'; // Pages
      ctx.fillRect(-3.5, -4.5, 7, 9);
      ctx.fillStyle = '#fbbf24'; // Arcane sigil
      ctx.fillRect(-1.5, -2, 3, 4);
    } else if (offhand.name.includes('头骨') || offhand.name.includes('Skull')) {
      // Summoner Skull Totem
      const skullFloat = Math.sin(time * 5) * 1.5;
      ctx.translate(0, skullFloat);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(-4, -6, 8, 8, 2);
      ctx.fill();
      ctx.fillStyle = '#6366f1'; // Glowing soul sockets
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 4;
      ctx.fillRect(-2.5, -4, 2, 2);
      ctx.fillRect(0.5, -4, 2, 2);
      ctx.shadowBlur = 0;
    } else if (offhand.name.includes('不死图腾') || offhand.subType === 'totem') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(-3, -6, 6, 12, 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-5, -4, 2, 4);
      ctx.fillRect(3, -4, 2, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-2, -4, 1.5, 1.5);
      ctx.fillRect(0.5, -4, 1.5, 1.5);
    } else {
      // Glowing mystic talisman
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}
