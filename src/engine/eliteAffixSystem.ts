import { Enemy, Player, Particle } from '../types';
import { soundManager } from '../audio/soundManager';

export type EliteAffix = 
  | '瞬移' 
  | '剧毒光环' 
  | '召唤小弟' 
  | '护盾反射' 
  | '熔岩足迹' 
  | '强韧';

export interface EliteCallbacks {
  spawnParticle: (particle: Particle) => void;
  damagePlayer: (amount: number, source: string) => void;
  spawnMinion?: (type: 'zombie' | 'skeleton' | 'spider' | 'slime', x: number, y: number) => void;
  addFloatingText: (x: number, y: number, text: string, color: string, size: number) => void;
  isWalkable: (x: number, y: number) => boolean;
}

export class EliteAffixSystem {
  private affixPool: EliteAffix[] = [
    '瞬移',
    '剧毒光环',
    '召唤小弟',
    '护盾反射',
    '熔岩足迹',
    '强韧',
  ];

  /**
   * Roll elite affixes and title for a newly spawned elite monster.
   * `level` 为内容等级（overworld=1、生态区 3-7、地下城按层）。
   */
  public generateEliteProfile(type: string, level: number): {
    affixes: string[];
    title: string;
    hpMultiplier: number;
    damageMultiplier: number;
  } {
    // 数值平衡(2026-09): 精英词缀数按内容等级阶梯 1/2/3（level 1-2→1、3-4→2、5+→3）
    const count = Math.min(3, 1 + Math.floor((level - 1) / 2));
    const shuffled = [...this.affixPool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Guaranteed inclusion of requested features for higher excitement
    if (Math.random() < 0.35 && !selected.includes('瞬移')) selected[0] = '瞬移';
    else if (Math.random() < 0.35 && !selected.includes('剧毒光环')) selected[0] = '剧毒光环';
    else if (Math.random() < 0.35 && !selected.includes('护盾反射')) selected[0] = '护盾反射';

    const titlePrefix = selected.join('·');
    const title = `★ [${titlePrefix}] 精英${type}`;

    return {
      affixes: selected,
      title,
      hpMultiplier: 2.2 + count * 0.35,
      damageMultiplier: 1.3 + count * 0.15,
    };
  }

  /**
   * Main per-frame update for elite monsters
   */
  public update(
    enemy: Enemy,
    player: Player,
    dt: number,
    callbacks: EliteCallbacks
  ): void {
    if (!enemy.isElite || enemy.isDying || enemy.hp <= 0) return;

    const affixes = enemy.affixes;
    const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // 1. 瞬移 (Teleport)
    if (affixes.includes('瞬移')) {
      enemy.teleportCooldown = (enemy.teleportCooldown || 6.0) - dt;
      if (enemy.teleportCooldown <= 0 && distToPlayer <= 10) {
        enemy.teleportCooldown = 5.5 + Math.random() * 2.5;
        this.executeTeleport(enemy, player, callbacks);
      }
    }

    // 2. 剧毒光环 (Toxic Aura)
    if (affixes.includes('剧毒光环')) {
      enemy.toxicAuraTimer = (enemy.toxicAuraTimer || 1.2) - dt;
      if (enemy.toxicAuraTimer <= 0) {
        enemy.toxicAuraTimer = 1.2;
        this.executeToxicAuraPulse(enemy, player, distToPlayer, callbacks);
      }
    }

    // 3. 护盾反射 (Shield Reflect)
    if (affixes.includes('护盾反射')) {
      enemy.shieldReflectTimer = (enemy.shieldReflectTimer || 8.0) - dt;
      if (enemy.shieldReflectTimer <= 0) {
        // Toggle shield active state for 3.2 seconds
        enemy.shieldReflectActive = !enemy.shieldReflectActive;
        enemy.shieldReflectTimer = enemy.shieldReflectActive ? 3.2 : 5.8;

        if (enemy.shieldReflectActive) {
          soundManager.playShieldReflect();
          callbacks.addFloatingText(enemy.x, enemy.y, '🛡️ 荆棘反射护盾开启!', '#38bdf8', 13);
        }
      }

      // Shimmering shield particles while active
      if (enemy.shieldReflectActive && Math.random() < dt * 10) {
        const angle = Math.random() * Math.PI * 2;
        callbacks.spawnParticle({
          x: enemy.x + Math.cos(angle) * 0.7,
          y: enemy.y + Math.sin(angle) * 0.7,
          z: 0.2 + Math.random() * 0.6,
          vx: Math.cos(angle) * 0.4,
          vy: Math.sin(angle) * 0.4,
          vz: 0.3,
          color: '#38bdf8',
          size: 2.5,
          life: 0.3,
          maxLife: 0.3,
          type: 'spark',
        });
      }
    }

    // 4. 召唤小弟 (Summoner)
    if (affixes.includes('召唤小弟')) {
      enemy.summonMinionTimer = (enemy.summonMinionTimer || 12.0) - dt;
      const lowHpTrigger = !enemy.hasSummonedMinions && enemy.hp / enemy.maxHp < 0.6;

      if ((enemy.summonMinionTimer <= 0 || lowHpTrigger) && distToPlayer <= 12) {
        enemy.summonMinionTimer = 16.0;
        enemy.hasSummonedMinions = true;
        this.executeSummonMinions(enemy, callbacks);
      }
    }

    // 5. 熔岩足迹 (Molten Trail)
    if (affixes.includes('熔岩足迹')) {
      enemy.moltenTrailTimer = (enemy.moltenTrailTimer || 0.4) - dt;
      if (enemy.moltenTrailTimer <= 0 && (Math.abs(enemy.vx) > 0.1 || Math.abs(enemy.vy) > 0.1)) {
        enemy.moltenTrailTimer = 0.45;
        callbacks.spawnParticle({
          x: enemy.x,
          y: enemy.y,
          z: 0.05,
          vx: 0,
          vy: 0,
          vz: 0.1,
          color: '#f97316',
          size: 3.5,
          life: 1.2,
          maxLife: 1.2,
          type: 'flame',
        });
        if (distToPlayer <= 1.0) {
          callbacks.damagePlayer(4, 'molten_trail');
        }
      }
    }
  }

  private executeTeleport(enemy: Enemy, player: Player, cb: EliteCallbacks): void {
    // Void smoke puff at source
    this.spawnVoidPuff(enemy.x, enemy.y, cb);
    soundManager.playTeleportBlink();

    // Find valid flank position 3-4 tiles away from player
    const flankAngle = Math.random() * Math.PI * 2;
    const targetDist = 2.8 + Math.random() * 1.6;
    const targetX = player.x + Math.cos(flankAngle) * targetDist;
    const targetY = player.y + Math.sin(flankAngle) * targetDist;

    if (cb.isWalkable(targetX, targetY)) {
      enemy.x = targetX;
      enemy.y = targetY;
    } else {
      // Fallback nudge
      enemy.x += (Math.random() - 0.5) * 2;
      enemy.y += (Math.random() - 0.5) * 2;
    }

    // Void smoke puff at destination
    this.spawnVoidPuff(enemy.x, enemy.y, cb);
    cb.addFloatingText(enemy.x, enemy.y, '⚡ 瞬移!', '#c084fc', 14);
  }

  private executeToxicAuraPulse(
    enemy: Enemy,
    player: Player,
    dist: number,
    cb: EliteCallbacks
  ): void {
    const auraRadius = 3.2;

    // Poison ring particle wave
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      cb.spawnParticle({
        x: enemy.x + Math.cos(angle) * (auraRadius * 0.7),
        y: enemy.y + Math.sin(angle) * (auraRadius * 0.7),
        z: 0.1 + Math.random() * 0.3,
        vx: Math.cos(angle) * 0.6,
        vy: Math.sin(angle) * 0.6,
        vz: 0.2,
        color: '#22c55e',
        size: 3,
        life: 0.45,
        maxLife: 0.45,
        type: 'smoke',
      });
    }

    if (dist <= auraRadius) {
      cb.damagePlayer(6, 'toxic_aura');
      cb.addFloatingText(player.x, player.y, '☣️ 剧毒侵蚀 -6', '#4ade80', 12);
    }
  }

  private executeSummonMinions(enemy: Enemy, cb: EliteCallbacks): void {
    if (!cb.spawnMinion) return;
    cb.addFloatingText(enemy.x, enemy.y, '💀 召唤援军!', '#a855f7', 15);
    soundManager.playPotion();

    const minionTypes: Array<'zombie' | 'skeleton' | 'spider' | 'slime'> = ['zombie', 'skeleton', 'slime'];
    const type = minionTypes[Math.floor(Math.random() * minionTypes.length)];

    for (let i = 0; i < 2; i++) {
      const offsetAngle = (i / 2) * Math.PI * 2 + Math.random() * 0.5;
      const mx = enemy.x + Math.cos(offsetAngle) * 1.8;
      const my = enemy.y + Math.sin(offsetAngle) * 1.8;
      if (cb.isWalkable(mx, my)) {
        cb.spawnMinion(type, mx, my);
        // Purple summoning rune motes
        for (let k = 0; k < 6; k++) {
          cb.spawnParticle({
            x: mx,
            y: my,
            z: 0.2,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            vz: 1.2 + Math.random() * 1.5,
            color: '#c084fc',
            size: 3,
            life: 0.5,
            maxLife: 0.5,
            type: 'rune',
          });
        }
      }
    }
  }

  private spawnVoidPuff(x: number, y: number, cb: EliteCallbacks): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.4;
      cb.spawnParticle({
        x,
        y,
        z: 0.2 + Math.random() * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0.4 + Math.random() * 0.8,
        color: Math.random() < 0.5 ? '#7c3aed' : '#c084fc',
        size: 3.5,
        life: 0.4,
        maxLife: 0.4,
        type: 'void',
      });
    }
  }
}

export const eliteAffixSystem = new EliteAffixSystem();
