import { Player, SummonedMinion, Enemy, Particle } from '../types';
import { soundManager } from '../audio/soundManager';
import { MinionAI } from './minionAI';
import { summonVFXSystem } from './vfx/SummonVFXSystem';

export class SummonManager {
  private static instance: SummonManager;

  public static getInstance(): SummonManager {
    if (!SummonManager.instance) {
      SummonManager.instance = new SummonManager();
    }
    return SummonManager.instance;
  }

  /**
   * Spawns a minion near the player
   */
  public spawnMinion(
    player: Player,
    type: 'wolf' | 'skeleton' | 'treant',
    particles: Particle[],
    addFloatingText: (x: number, y: number, text: string, color: string) => void
  ): SummonedMinion {
    if (!player.minions) {
      player.minions = [];
    }

    // Cap max minions to 6 to prevent lag and army overload
    if (player.minions.length >= 6) {
      const oldest = player.minions.shift();
      if (oldest) {
        addFloatingText(oldest.x, oldest.y, '随从更迭', '#94a3b8');
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = 0.8 + Math.random() * 0.8;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const baseAtkBonus = player.summonDamageBonus || 0;
    const hpMult = 1 + (player.minionHpBonus || 0);
    const playerLvl = player.stats.level || 1;

    let minion: SummonedMinion;
    if (type === 'wolf') {
      const rawHp = Math.round((60 + playerLvl * 15) * hpMult);
      const atk = Math.round((14 + playerLvl * 4) * (1 + baseAtkBonus));
      minion = { id: `wolf_${Date.now()}_${Math.random()}`, name: '幽暗魔狼', type: 'wolf', x, y, z: 0, hp: rawHp, maxHp: rawHp, attack: atk, speed: 6.5, duration: 35, attackCooldown: 0, maxAttackCooldown: 0.65, attackRange: 1.0, icon: '🐺', color: '#6366f1' };
    } else if (type === 'skeleton') {
      const rawHp = Math.round((75 + playerLvl * 18) * hpMult);
      const atk = Math.round((12 + playerLvl * 3.5) * (1 + baseAtkBonus));
      minion = { id: `skel_${Date.now()}_${Math.random()}`, name: '骸骨禁卫', type: 'skeleton', x, y, z: 0, hp: rawHp, maxHp: rawHp, attack: atk, speed: 5.2, duration: 40, attackCooldown: 0, maxAttackCooldown: 0.95, attackRange: 1.25, icon: '💀', color: '#a855f7' };
    } else {
      const rawHp = Math.round((110 + playerLvl * 25) * hpMult);
      const atk = Math.round((16 + playerLvl * 3) * (1 + baseAtkBonus));
      minion = { id: `treant_${Date.now()}_${Math.random()}`, name: '自然树精', type: 'treant', x, y, z: 0, hp: rawHp, maxHp: rawHp, attack: atk, speed: 4.2, duration: 45, attackCooldown: 0, maxAttackCooldown: 1.5, attackRange: 1.5, icon: '🌳', color: '#22c55e' };
    }

    player.minions.push(minion);
    soundManager.playLevelUp();
    addFloatingText(minion.x, minion.y, `+唤出 ${minion.name}`, minion.color);

    // Spawn summoning magic circle & ascending beam VFX
    summonVFXSystem.spawn(minion.x, minion.y, type, minion.color);

    // Spawn summoning vfx particles
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: minion.x + (Math.random() - 0.5) * 0.6,
        y: minion.y + (Math.random() - 0.5) * 0.6,
        z: 0.2,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: 1.5 + Math.random() * 2,
        life: 0.5,
        maxLife: 0.5,
        color: minion.color,
        size: 4 + Math.random() * 3,
        type: 'magic',
      });
    }

    return minion;
  }

  /**
   * Enrages all player minions (Summoner R-CLK battle tactic)
   */
  public enrageMinions(
    player: Player,
    particles: Particle[],
    addFloatingText: (x: number, y: number, text: string, color: string) => void
  ): boolean {
    if (!player.minions || player.minions.length === 0) return false;

    player.minions.forEach((m) => {
      if (m.isEnraged) {
        m.hp = Math.min(m.maxHp, m.hp + 40);
        m.duration = Math.max(m.duration, 35);
        addFloatingText(m.x, m.y, '生命激荡!', '#34d399');
        return;
      }

      m.isEnraged = true;
      m.attack = Math.round(m.attack * 1.5);
      m.speed *= 1.35;
      m.hp = Math.min(m.maxHp, m.hp + 30);
      addFloatingText(m.x, m.y, '狂暴嗜血!', '#f43f5e');

      for (let i = 0; i < 8; i++) {
        particles.push({
          x: m.x,
          y: m.y,
          z: 0.3,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          vz: 2,
          life: 0.45,
          maxLife: 0.45,
          color: '#f43f5e',
          size: 4,
          type: 'fire',
        });
      }
    });

    return true;
  }

  /**
   * Updates all active minions: AI pursuit, obstacle avoidance, attack cooldowns, duration decay
   */
  public updateMinions(
    player: Player,
    dt: number,
    enemies: Enemy[],
    particles: Particle[],
    addFloatingText: (x: number, y: number, text: string, color: string, size?: number) => void,
    damageEnemy: (enemy: Enemy, dmg: number, crit: boolean) => void,
    isWalkable: (x: number, y: number) => boolean = () => true,
    gameTime: number = 0
  ): void {
    if (!player.minions || player.minions.length === 0) return;

    for (let i = player.minions.length - 1; i >= 0; i--) {
      const minion = player.minions[i];
      minion.duration -= dt;
      if (minion.attackCooldown > 0) minion.attackCooldown -= dt;

      // Check lifetime or death
      if (minion.duration <= 0 || minion.hp <= 0) {
        addFloatingText(minion.x, minion.y, '随从消散', '#94a3b8');
        player.minions.splice(i, 1);
        continue;
      }

      // Check distance to player for leash recall
      MinionAI.checkLeashRecall(minion, player, isWalkable, (m) => {
        addFloatingText(m.x, m.y, '⚡ 战团折跃归队', '#818cf8', 12);
      });

      // Target lock or search
      const targetEnemy = MinionAI.acquireOrRetainTarget(minion, player, enemies);

      if (targetEnemy) {
        const dist = Math.hypot(targetEnemy.x - minion.x, targetEnemy.y - minion.y);
        const range = minion.attackRange || 1.1;

        if (dist > range) {
          // Navigate towards locked target using obstacle steering
          MinionAI.stepMovement(minion, targetEnemy.x, targetEnemy.y, range * 0.8, isWalkable, dt, player.minions);
        } else if (minion.attackCooldown <= 0) {
          // Execute distinct minion attack
          this.executeMinionAttack(minion, targetEnemy, enemies, particles, addFloatingText, damageEnemy);
        }
      } else {
        // Escort formation around player
        const escortPos = MinionAI.computeEscortPosition(player, i, player.minions.length, gameTime);
        const pdist = Math.hypot(escortPos.x - minion.x, escortPos.y - minion.y);
        if (pdist > 0.45) {
          MinionAI.stepMovement(minion, escortPos.x, escortPos.y, 0.35, isWalkable, dt, player.minions);
        }
      }
    }
  }

  /**
   * Execute specialized attacks based on minion type
   */
  private executeMinionAttack(
    minion: SummonedMinion,
    target: Enemy,
    enemies: Enemy[],
    particles: Particle[],
    addFloatingText: (x: number, y: number, text: string, color: string, size?: number) => void,
    damageEnemy: (enemy: Enemy, dmg: number, crit: boolean) => void
  ): void {
    const baseCd = minion.maxAttackCooldown || 0.8;
    minion.attackCooldown = minion.isEnraged ? baseCd * 0.58 : baseCd;

    if (minion.type === 'wolf') {
      // Wolf: High crit fast pounce
      const isCrit = Math.random() < 0.32;
      const dmg = isCrit ? Math.round(minion.attack * 1.8) : minion.attack;
      damageEnemy(target, dmg, isCrit);
      soundManager.playComboSlash(1);
      addFloatingText(target.x, target.y - 0.3, `🐺 撕咬 ${dmg}${isCrit ? '!' : ''}`, minion.color, isCrit ? 14 : 12);
    } else if (minion.type === 'skeleton') {
      // Skeleton: Cleave blade strike (hits primary + nearby enemies)
      const isCrit = Math.random() < 0.2;
      const dmg = isCrit ? Math.round(minion.attack * 1.6) : minion.attack;
      damageEnemy(target, dmg, isCrit);
      soundManager.playComboSlash(2);
      addFloatingText(target.x, target.y - 0.3, `💀 斩击 ${dmg}`, minion.color, 12);

      // 50% cleave splash to nearby foes
      for (const other of enemies) {
        if (other.id !== target.id && other.hp > 0) {
          const d = Math.hypot(other.x - target.x, other.y - target.y);
          if (d <= 1.3) {
            damageEnemy(other, Math.round(dmg * 0.5), false);
          }
        }
      }
    } else {
      // Treant: Heavy earth slam with shockwave
      const isCrit = Math.random() < 0.25;
      const dmg = Math.round(minion.attack * 1.4);
      damageEnemy(target, dmg, isCrit);
      soundManager.playShieldBlock();
      addFloatingText(target.x, target.y - 0.3, `🌳 重砸 ${dmg}`, '#22c55e', 14);

      // Push target back slightly
      const angle = Math.atan2(target.y - minion.y, target.x - minion.x);
      target.vx += Math.cos(angle) * 3;
      target.vy += Math.sin(angle) * 3;
    }

    // Attack particles
    for (let p = 0; p < 4; p++) {
      particles.push({
        x: target.x + (Math.random() - 0.5) * 0.4,
        y: target.y + (Math.random() - 0.5) * 0.4,
        z: 0.3,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: 1.0,
        life: 0.35,
        maxLife: 0.35,
        color: minion.color,
        size: 3 + Math.random() * 2,
        type: 'magic',
      });
    }
  }
}

export const summonManager = SummonManager.getInstance();

