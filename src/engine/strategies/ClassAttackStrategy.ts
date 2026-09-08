import { Player, Projectile, Particle, Enemy } from '../../types';

export interface ClassAttackContext {
  player: Player;
  projectiles: Projectile[];
  particles: Particle[];
  enemies: Enemy[];
  mouseWorldX: number;
  mouseWorldY: number;
  dealMeleeAoEDamage: (x: number, y: number, angle: number, arc: number, radius: number, dmg: number, crit: boolean) => void;
  damageEnemy: (enemy: Enemy, damage: number, isCrit: boolean, isBackstab?: boolean) => void;
  triggerHitStop: (duration: number, intensity?: number) => void;
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number, bounce?: boolean) => void;
  checkDestructibles: (x: number, y: number, radius: number, angle: number, arc: number) => void;
}

export interface IClassAttackStrategy {
  readonly classId: string;
  readonly className: string;
  executePrimaryAttack(ctx: ClassAttackContext): void;
  executeSecondaryAttack(ctx: ClassAttackContext): void;
  executeChargedAttack?(ctx: ClassAttackContext, chargeRatio: number): void;
}
