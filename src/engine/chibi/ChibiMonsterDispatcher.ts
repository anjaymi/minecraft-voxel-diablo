import { Enemy } from '../../types';
import { ChibiMonsterZombie } from './ChibiMonsterZombie';
import { ChibiMonsterChimera } from './ChibiMonsterChimera';
import { ChibiMonsterSkeleton } from './ChibiMonsterSkeleton';
import { ChibiMonsterKnight } from './ChibiMonsterKnight';
import { ChibiMonsterRogues } from './ChibiMonsterRogues';
import { ChibiMonsterCreatures } from './ChibiMonsterCreatures';

/**
 * Unified 2.0-Head Chibi Monster Model Dispatcher
 * Replaces old 3.2-head stick/cube models with cohesive 2.0-head Hand-crafted
 * GoodSmile / Nendoroid action figurine proportions!
 */
export function renderChibiMonsterModel(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  pose: any,
  time: number
): boolean {
  ctx.save();
  // Scale down chibi monsters to match compact 2-head ratio (~28-32px)
  ctx.scale(0.65, 0.65);
  let handled = true;

  switch (enemy.type) {
    case 'zombie':
      ChibiMonsterZombie.drawZombie(ctx, enemy, pose, time);
      break;

    case 'drowned':
      ChibiMonsterZombie.drawDrowned(ctx, enemy, pose, time);
      break;

    case 'skeleton':
      ChibiMonsterSkeleton.drawSkeleton(ctx, enemy, pose, time);
      break;

    case 'armored_zombie':
      ChibiMonsterKnight.drawArmoredZombie(ctx, enemy, pose, time);
      break;

    case 'goblin':
      ChibiMonsterRogues.drawGoblin(ctx, enemy, pose, time);
      break;

    case 'baby_zombie':
      ChibiMonsterRogues.drawBabyZombie(ctx, enemy, pose, time);
      break;

    case 'creeper':
      ChibiMonsterCreatures.drawCreeper(ctx, enemy, pose, time);
      break;

    case 'spider':
      ChibiMonsterCreatures.drawSpider(ctx, enemy, pose, time);
      break;

    case 'piglin_brute':
      ChibiMonsterCreatures.drawPiglinBrute(ctx, enemy, pose, time);
      break;

    case 'chimera':
      ChibiMonsterChimera.drawChimera(ctx, enemy, pose, time);
      break;

    default:
      handled = false;
      break;
  }

  ctx.restore();
  return handled;
}
