import { Player, Projectile, Particle } from '../types';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';
import { AttackAimSolver } from './combat/attackAimSolver';

export interface AttackContext {
  player: Player;
  projectiles: Projectile[];
  particles: Particle[];
  mouseWorldX: number;
  mouseWorldY: number;
  dealMeleeAoEDamage: (x: number, y: number, angle: number, arc: number, radius: number, dmg: number, crit: boolean) => void;
  triggerHitStop: (dur: number, intensity: number) => void;
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number) => void;
}

/**
 * ClassAttackSystem - Provides distinct primary (L-CLK) and secondary (R-CLK)
 * combat mechanics tailored to each character class.
 */
export class ClassAttackSystem {
  /**
   * Primary Attack (L-CLK)
   */
  public static executePrimaryAttack(ctx: AttackContext, onPrimaryMeleeSwing: () => void): void {
    const { player: p } = ctx;
    if (p.attackCooldown > 0) return;

    const classId = p.characterClass || 'warrior';

    switch (classId) {
      case 'warrior':
        // Warrior: Broadsword Combo Cleave (3-hit chain with ground slam)
        onPrimaryMeleeSwing();
        break;

      case 'mage':
        // Mage: Arcane Bolt projectile from wand (low cooldown, magic impact)
        this.executeMagePrimary(ctx);
        break;

      case 'ranger':
        // Ranger: Rapid Arrow shot (high fire-rate precision arrow)
        this.executeRangerPrimary(ctx);
        break;

      case 'rogue':
        // Rogue: Rapid Twin Dagger Flurry (ultra fast attack rate + poison bleed)
        this.executeRoguePrimary(ctx, onPrimaryMeleeSwing);
        break;
    }
  }

  /**
   * Secondary Attack (R-CLK)
   */
  public static executeSecondaryAttack(ctx: AttackContext): void {
    const { player: p } = ctx;
    if (p.attackCooldown > 0) return;

    const classId = p.characterClass || 'warrior';

    switch (classId) {
      case 'warrior':
        // Warrior: Shield Bulwark Guard / Earth-shattering heavy slam
        this.executeWarriorSecondary(ctx);
        break;

      case 'mage':
        // Mage: Charged Elemental Burst (Fan of 3 explosive arcane spheres)
        this.executeMageSecondary(ctx);
        break;

      case 'ranger':
        // Ranger: Piercing Heavy Sniper Arrow (high velocity piercing shot)
        this.executeRangerSecondary(ctx);
        break;

      case 'rogue':
        // Rogue: Shadow Fan of Knives (fan of 5 poisoned throwing daggers)
        this.executeRogueSecondary(ctx);
        break;
    }
  }

  // --- Mage Implementations ---
  private static executeMagePrimary(ctx: AttackContext): void {
    const { player: p, projectiles, triggerHitStop } = ctx;
    p.attackCooldown = 0.22;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    // Minor mana cost for magic projectile
    if (p.stats.mana >= 3) {
      p.stats.mana -= 3;
    }

    const angle = AttackAimSolver.resolveAimAngle(ctx as any);
    const speed = 18;
    const baseDmg = Math.round(p.stats.attack * 1.15);

    projectiles.push({
      id: `arcane_bolt_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.4,
      y: p.y + Math.sin(angle) * 0.4,
      z: 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: baseDmg,
      isPlayer: true,
      type: 'mage_bolt',
      timer: 1.6,
      radius: 0.35,
    });

    vfxSystem.spawnShockwave(p.x, p.y, 0, 0.8, '#a855f7', true, 0.2);
    triggerHitStop(0.02, 0.1);
  }

  private static executeMageSecondary(ctx: AttackContext): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    if (p.stats.mana < 12) {
      addFloatingText(p.x, p.y, '法力不足 (12 MP)', '#60a5fa', 12);
      soundManager.playButtonClick();
      return;
    }

    p.stats.mana -= 12;
    p.attackCooldown = 0.45;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    const baseAngle = AttackAimSolver.resolveAimAngle(ctx as any);
    const spreadAngles = [-0.22, 0, 0.22];
    const burstDmg = Math.round(p.stats.attack * 1.6);

    for (const offset of spreadAngles) {
      const angle = baseAngle + offset;
      projectiles.push({
        id: `arcane_burst_${Date.now()}_${Math.random()}`,
        x: p.x + Math.cos(angle) * 0.5,
        y: p.y + Math.sin(angle) * 0.5,
        z: 0.5,
        vx: Math.cos(angle) * 14,
        vy: Math.sin(angle) * 14,
        vz: 0,
        damage: burstDmg,
        isPlayer: true,
        type: 'tnt', // Explodes into fiery arcane blast on impact
        timer: 1.8,
        radius: 0.45,
      });
    }

    vfxSystem.spawnShockwave(p.x, p.y, 0, 1.8, '#c084fc', false, 0.3);
    triggerHitStop(0.04, 0.25);
    addFloatingText(p.x, p.y - 0.4, '✨ 元素三重爆破!', '#c084fc', 13);
  }

  // --- Ranger Implementations ---
  private static executeRangerPrimary(ctx: AttackContext): void {
    const { player: p, projectiles } = ctx;
    p.attackCooldown = 0.18; // Very rapid fire
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    const angle = AttackAimSolver.resolveAimAngle(ctx as any);
    const speed = 22; // High velocity
    const dmg = Math.round(p.stats.attack * 0.95);

    projectiles.push({
      id: `rapid_arrow_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.4,
      y: p.y + Math.sin(angle) * 0.4,
      z: 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: dmg,
      isPlayer: true,
      type: 'arrow',
      timer: 1.5,
      radius: 0.28,
    });
  }

  private static executeRangerSecondary(ctx: AttackContext): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    p.attackCooldown = 0.55;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    const angle = AttackAimSolver.resolveAimAngle(ctx as any);
    const speed = 26;
    const heavyDmg = Math.round(p.stats.attack * 2.3);

    // Piercing heavy arrow (pierces multiple foes and high knockback)
    projectiles.push({
      id: `pierce_arrow_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.5,
      y: p.y + Math.sin(angle) * 0.5,
      z: 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: heavyDmg,
      isPlayer: true,
      type: 'arrow',
      timer: 2.0,
      radius: 0.4,
    });

    vfxSystem.spawnSlash(p.x, p.y, 0.5, angle, 1, 'dagger', true, true);
    triggerHitStop(0.05, 0.25);
    addFloatingText(p.x, p.y - 0.4, '🏹 破空贯穿狙击!', '#34d399', 14);
  }

  // --- Warrior Implementations ---
  private static executeWarriorSecondary(ctx: AttackContext): void {
    const { player: p, triggerHitStop, addFloatingText, dealMeleeAoEDamage } = ctx;
    p.attackCooldown = 0.6;

    if (p.equipment.offhand?.subType === 'shield') {
      // Shield Bulwark: 1.2s of 80% damage reduction + frontal bash shockwave
      p.shieldBlockTimer = 1.2;
      p.invulnerableTimer = 0.4;
      soundManager.playDash();
      vfxSystem.spawnShockwave(p.x, p.y, 0, 2.2, '#38bdf8', false, 0.35);

      // Bash front enemies
      dealMeleeAoEDamage(p.x, p.y, p.facingAngle, Math.PI * 0.6, 2.2, p.stats.attack * 1.2, true);
      triggerHitStop(0.06, 0.3);
      addFloatingText(p.x, p.y - 0.5, '🛡️ 坚毅壁垒盾撞!', '#38bdf8', 14);
    } else {
      // Greatsword Ground Cleave: 360 slam
      p.whirlwindTimer = 0.4;
      soundManager.playComboSlash(2);
      vfxSystem.spawnShockwave(p.x, p.y, 0, 3.2, '#ef4444', true, 0.4);
      dealMeleeAoEDamage(p.x, p.y, 0, Math.PI * 2, 3.2, p.stats.attack * 1.8, true);
      triggerHitStop(0.08, 0.35);
      addFloatingText(p.x, p.y - 0.5, '💥 炽钢震地斩!', '#ef4444', 14);
    }
  }

  // --- Rogue Implementations ---
  private static executeRoguePrimary(ctx: AttackContext, onPrimaryMeleeSwing: () => void): void {
    const { player: p } = ctx;
    // Rogue has ultra rapid attack cooldown
    p.attackCooldown = 0.15;
    onPrimaryMeleeSwing();
  }

  private static executeRogueSecondary(ctx: AttackContext): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    p.attackCooldown = 0.4;
    soundManager.playShootArrow();

    const baseAngle = AttackAimSolver.resolveAimAngle(ctx as any);
    const angles = [-0.35, -0.18, 0, 0.18, 0.35];
    const daggerDmg = Math.round(p.stats.attack * 0.85);

    for (const offset of angles) {
      const angle = baseAngle + offset;
      projectiles.push({
        id: `fan_dagger_${Date.now()}_${Math.random()}`,
        x: p.x + Math.cos(angle) * 0.3,
        y: p.y + Math.sin(angle) * 0.3,
        z: 0.5,
        vx: Math.cos(angle) * 19,
        vy: Math.sin(angle) * 19,
        vz: 0,
        damage: daggerDmg,
        isPlayer: true,
        type: 'arrow',
        timer: 1.2,
        radius: 0.25,
      });
    }

    vfxSystem.spawnSlash(p.x, p.y, 0.5, p.facingAngle, 1, 'dagger', true, false);
    triggerHitStop(0.03, 0.15);
    addFloatingText(p.x, p.y - 0.4, '🗡️ 暗影剧毒飞刃!', '#22c55e', 13);
  }
}
