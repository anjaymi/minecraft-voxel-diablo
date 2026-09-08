import { ElementType, Enemy, EnemyType, Particle } from '../types';
import { soundManager } from '../audio/soundManager';

export interface ElementalAffinity {
  weaknesses: ElementType[];
  resistances: ElementType[];
  immunities?: ElementType[];
}

export const MONSTER_ELEMENTAL_AFFINITIES: Record<EnemyType, ElementalAffinity> = {
  zombie: {
    weaknesses: ['fire'],
    resistances: ['frost'],
  },
  skeleton: {
    weaknesses: ['lightning', 'physical'],
    resistances: ['frost'],
  },
  creeper: {
    weaknesses: ['frost'],
    resistances: ['fire'],
  },
  spider: {
    weaknesses: ['fire'],
    resistances: ['lightning'],
  },
  enderman: {
    weaknesses: ['frost'],
    resistances: ['physical'],
  },
  wither_boss: {
    weaknesses: ['lightning'],
    resistances: ['physical', 'frost'],
  },
  piglin_brute: {
    weaknesses: ['frost'],
    resistances: ['fire'],
  },
  blaze: {
    weaknesses: ['frost'],
    resistances: ['lightning'],
    immunities: ['fire'],
  },
  necromancer: {
    weaknesses: ['fire'],
    resistances: ['lightning'],
  },
  slime: {
    weaknesses: ['frost', 'fire'],
    resistances: ['physical'],
  },
  witch: {
    weaknesses: ['physical'],
    resistances: ['fire', 'frost'],
  },
  drowned: {
    weaknesses: ['lightning'],
    resistances: ['frost'],
  },
  armored_zombie: {
    weaknesses: ['lightning'],
    resistances: ['physical'],
  },
  baby_zombie: {
    weaknesses: ['frost', 'fire'],
    resistances: ['lightning'],
  },
  chimera: {
    weaknesses: ['frost'],
    resistances: ['fire', 'physical'],
  },

  goblin: {
    weaknesses: ['fire', 'physical'],
    resistances: ['frost'],
  },
};

export interface ElementalDamageResult {
  finalDamage: number;
  multiplier: number;
  statusApplied?: 'burn' | 'chill' | 'shock';
  feedbackText: string | null;
  feedbackColor: string;
  isWeakness: boolean;
  isResistance: boolean;
}

export class ElementalSystem {
  /**
   * Calculate elemental damage multiplier and status effects against target enemy
   */
  public evaluateDamage(
    baseDamage: number,
    element: ElementType,
    enemy: Enemy
  ): ElementalDamageResult {
    const affinity = MONSTER_ELEMENTAL_AFFINITIES[enemy.type] || {
      weaknesses: [],
      resistances: [],
    };

    // 1. Check Immunity
    if (affinity.immunities?.includes(element)) {
      soundManager.playElementalResist();
      return {
        finalDamage: Math.max(1, Math.round(baseDamage * 0.1)),
        multiplier: 0.1,
        feedbackText: '元素免疫!',
        feedbackColor: '#94a3b8',
        isWeakness: false,
        isResistance: true,
      };
    }

    // 2. Check Weakness (1.5x damage + audio feedback)
    if (affinity.weaknesses.includes(element)) {
      soundManager.playElementalWeakness();
      const mult = 1.5;
      const finalDamage = Math.round(baseDamage * mult);

      let statusApplied: 'burn' | 'chill' | 'shock' | undefined;
      let label = '弱点打击!';
      let color = '#f59e0b';

      if (element === 'fire') {
        statusApplied = 'burn';
        label = '🔥 火焰弱点! (+50%)';
        color = '#ef4444';
        enemy.burnTimer = 3.5;
        enemy.burnDps = Math.max(2, Math.round(finalDamage * 0.25));
      } else if (element === 'frost') {
        statusApplied = 'chill';
        label = '❄️ 极寒弱点! (冰霜减速)';
        color = '#38bdf8';
        enemy.chillTimer = 4.0;
        enemy.chillSlow = 0.45; // 45% slow
      } else if (element === 'lightning') {
        statusApplied = 'shock';
        label = '⚡ 导电雷击! (+50%)';
        color = '#facc15';
        enemy.shockTimer = 2.5;
      }

      return {
        finalDamage,
        multiplier: mult,
        statusApplied,
        feedbackText: label,
        feedbackColor: color,
        isWeakness: true,
        isResistance: false,
      };
    }

    // 3. Check Resistance (0.6x damage)
    if (affinity.resistances.includes(element)) {
      soundManager.playElementalResist();
      const mult = 0.6;
      return {
        finalDamage: Math.max(1, Math.round(baseDamage * mult)),
        multiplier: mult,
        feedbackText: '抗性抵消 (-40%)',
        feedbackColor: '#64748b',
        isWeakness: false,
        isResistance: true,
      };
    }

    // 4. Normal Damage (1.0x)
    return {
      finalDamage: baseDamage,
      multiplier: 1.0,
      feedbackText: null,
      feedbackColor: '#ffffff',
      isWeakness: false,
      isResistance: false,
    };
  }

  /**
   * Tick active elemental status effects on an enemy
   */
  public updateStatus(
    enemy: Enemy,
    dt: number,
    callbacks: {
      applyDamage: (enemy: Enemy, amount: number) => void;
      spawnParticle: (p: Particle) => void;
    }
  ): void {
    if (enemy.isDying || enemy.hp <= 0) return;

    // 1. Burn DOT
    if (enemy.burnTimer && enemy.burnTimer > 0) {
      enemy.burnTimer -= dt;
      const dps = enemy.burnDps || 3;
      callbacks.applyDamage(enemy, dps * dt);

      if (Math.random() < dt * 6) {
        callbacks.spawnParticle({
          x: enemy.x + (Math.random() - 0.5) * 0.4,
          y: enemy.y + (Math.random() - 0.5) * 0.4,
          z: 0.3 + Math.random() * 0.4,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          vz: 0.8 + Math.random() * 1.2,
          color: Math.random() < 0.5 ? '#f97316' : '#ef4444',
          size: 2.5 + Math.random() * 2,
          life: 0.35,
          maxLife: 0.35,
          type: 'flame',
        });
      }
    }

    // 2. Chill Slow
    if (enemy.chillTimer && enemy.chillTimer > 0) {
      enemy.chillTimer -= dt;
      if (Math.random() < dt * 3) {
        callbacks.spawnParticle({
          x: enemy.x + (Math.random() - 0.5) * 0.4,
          y: enemy.y + (Math.random() - 0.5) * 0.4,
          z: 0.1 + Math.random() * 0.3,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          vz: 0.3 + Math.random() * 0.5,
          color: '#38bdf8',
          size: 2,
          life: 0.4,
          maxLife: 0.4,
          type: 'spark',
        });
      }
    }

    // 3. Shock Electric Arcs
    if (enemy.shockTimer && enemy.shockTimer > 0) {
      enemy.shockTimer -= dt;
      if (Math.random() < dt * 4) {
        callbacks.spawnParticle({
          x: enemy.x + (Math.random() - 0.5) * 0.5,
          y: enemy.y + (Math.random() - 0.5) * 0.5,
          z: 0.2 + Math.random() * 0.4,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          vz: 0.5 + Math.random() * 0.8,
          color: '#facc15',
          size: 2,
          life: 0.2,
          maxLife: 0.2,
          type: 'spark',
        });
      }
    }
  }

  /**
   * Get formatted affinity tags for UI rendering
   */
  public getAffinityBadges(type: EnemyType): Array<{ text: string; color: string; isWeakness: boolean }> {
    const affinity = MONSTER_ELEMENTAL_AFFINITIES[type];
    if (!affinity) return [];

    const badges: Array<{ text: string; color: string; isWeakness: boolean }> = [];

    const iconMap: Record<ElementType, string> = {
      physical: '⚔️物理',
      fire: '🔥火',
      frost: '❄️冰',
      lightning: '⚡雷',
    };

    affinity.weaknesses.forEach((w) => {
      badges.push({
        text: `弱: ${iconMap[w] || w}`,
        color: w === 'fire' ? '#f87171' : w === 'frost' ? '#38bdf8' : '#fde047',
        isWeakness: true,
      });
    });

    affinity.resistances.forEach((r) => {
      badges.push({
        text: `抗: ${iconMap[r] || r}`,
        color: '#94a3b8',
        isWeakness: false,
      });
    });

    return badges;
  }
}

export const elementalSystem = new ElementalSystem();
