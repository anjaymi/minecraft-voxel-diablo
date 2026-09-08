import { Enemy } from '../types';

/**
 * Specialized modular renderer for distinct monster models:
 * - Armored Combat Zombie (Knight armor, Iron sword & Kite shield)
 * - Goblin Scout / Thief (Leather hood, twin poison daggers, coin pouch)
 * - Baby Zombie (Miniature proportion, hyper sprint, leap pounce claws)
 */
export function drawSpecialEnemyModel(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  pose: any,
  time: number
): boolean {
  const bob = pose.bodyBob || 0;

  // =========================================================================
  // 1. ARMORED COMBAT ZOMBIE
  // =========================================================================
  if (enemy.type === 'armored_zombie') {
    // 1.1 Steel Armored Legs
    ctx.save();
    ctx.translate(-3, -12);
    ctx.rotate(pose.leftLegAngle);
    ctx.fillStyle = '#334155'; // Dark steel greaves
    ctx.fillRect(-2, 0, 4, 12);
    ctx.fillStyle = '#64748b'; // Knee guard plate
    ctx.fillRect(-2.5, 3, 5, 4);
    ctx.restore();

    ctx.save();
    ctx.translate(3, -12);
    ctx.rotate(pose.rightLegAngle);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-2, 0, 4, 12);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-2.5, 3, 5, 4);
    ctx.restore();

    // 1.2 Steel Plated Chestplate
    ctx.fillStyle = '#475569';
    ctx.fillRect(-8, -27 - bob, 16, 15);
    ctx.fillStyle = '#94a3b8'; // Polished breastplate center ridge
    ctx.fillRect(-6, -26 - bob, 12, 13);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-1, -25 - bob, 2, 11);

    // Leather belt & buckle
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, -14 - bob, 16, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -14 - bob, 4, 3);

    // 1.3 Right Arm: Wields Iron Broadsword
    ctx.save();
    ctx.translate(8, -25 - bob);
    const swordSwing = enemy.state === 'attack' ? Math.sin(time * 16) * 0.8 : pose.rightArmAngle;
    ctx.rotate(swordSwing);
    ctx.fillStyle = '#334155'; // Pauldron
    ctx.fillRect(-3, -2, 6, 6);
    ctx.fillStyle = '#15803d'; // Zombie arm
    ctx.fillRect(-2, 4, 4, 8);

    // Iron Sword
    ctx.translate(0, 10);
    ctx.fillStyle = '#d97706'; // Gold hilt & pommel
    ctx.fillRect(-1.5, 0, 3, 3);
    ctx.fillStyle = '#b45309'; // Crossguard
    ctx.fillRect(-4, -1, 8, 2);
    ctx.fillStyle = '#cbd5e1'; // Steel Blade
    ctx.fillRect(-1.5, -16, 3, 16);
    ctx.fillStyle = '#f8fafc'; // Edge highlight
    ctx.fillRect(-0.5, -16, 1, 16);
    ctx.restore();

    // 1.4 Left Arm: Heavy Iron Kite Shield
    ctx.save();
    ctx.translate(-8, -25 - bob);
    // If actively blocking, raise shield squarely in front
    const shieldAngle = enemy.isBlocking ? -Math.PI / 4 : pose.leftArmAngle * 0.4;
    ctx.rotate(shieldAngle);
    ctx.fillStyle = '#334155'; // Pauldron
    ctx.fillRect(-3, -2, 6, 6);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-2, 4, 4, 8);

    // Kite Shield Body
    ctx.translate(enemy.isBlocking ? 2 : 0, 8);
    ctx.fillStyle = '#334155'; // Dark steel outer border
    ctx.beginPath();
    ctx.moveTo(-7, -10);
    ctx.lineTo(7, -10);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 14);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#64748b'; // Inner shield face
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(5, -8);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 11);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();

    // Shield Gold Cross Crest
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-1, -6, 2, 12);
    ctx.fillRect(-4, -3, 8, 2);
    ctx.restore();

    // 1.5 Steel Greathelm Head
    ctx.save();
    ctx.translate(0, -32 - bob);
    ctx.rotate(pose.headTilt);
    ctx.fillStyle = '#475569'; // Greathelm
    ctx.fillRect(-7, -14, 14, 14);
    ctx.fillStyle = '#64748b'; // Forehead plate
    ctx.fillRect(-6, -13, 12, 6);
    // Dark Visor Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, -7, 10, 2.5);
    // Menacing glowing red eyes through visor
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3.5, -6.5, 2, 1.5);
    ctx.fillRect(1.5, -6.5, 2, 1.5);
    ctx.restore();

    return true;
  }

  // =========================================================================
  // 2. AGILE GOBLIN SCOUT / THIEF
  // =========================================================================
  if (enemy.type === 'goblin') {
    const isRolling = enemy.state === 'rolling';

    ctx.save();
    if (isRolling) {
      ctx.rotate(time * 24); // Fast tumble roll
    }

    // 2.1 Swift Leather Boots
    ctx.save();
    ctx.translate(-2.5, -8);
    ctx.rotate(pose.leftLegAngle * 1.3);
    ctx.fillStyle = '#78350f'; // Brown leather wraps
    ctx.fillRect(-1.5, 0, 3, 8);
    ctx.restore();

    ctx.save();
    ctx.translate(2.5, -8);
    ctx.rotate(pose.rightLegAngle * 1.3);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-1.5, 0, 3, 8);
    ctx.restore();

    // 2.2 Green Tunic & Leather Vest
    ctx.fillStyle = '#15803d'; // Forest green tunic
    ctx.fillRect(-5, -18 - bob, 10, 11);
    ctx.fillStyle = '#78350f'; // Leather shoulder straps
    ctx.fillRect(-4, -18 - bob, 2, 11);
    ctx.fillRect(2, -18 - bob, 2, 11);

    // Stolen Coin Pouch on hip
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(4.5, -10 - bob, 3, 0, Math.PI * 2);
    ctx.fill();
    if (enemy.stolenCoins && enemy.stolenCoins > 0) {
      // Golden coins glinting out of bag
      ctx.fillStyle = '#facc15';
      ctx.fillRect(4, -13 - bob, 2, 2);
    }

    // 2.3 Arms with Poisoned Curved Daggers
    ctx.save();
    ctx.translate(-5, -16 - bob);
    ctx.rotate(pose.leftArmAngle);
    ctx.fillStyle = '#84cc16'; // Goblin green skin
    ctx.fillRect(-1.5, 0, 3, 7);
    // Left Dagger
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-1, 5, 2, 6);
    ctx.fillStyle = '#22c55e'; // Toxic blade edge
    ctx.fillRect(0, 7, 1.5, 4);
    ctx.restore();

    ctx.save();
    ctx.translate(5, -16 - bob);
    ctx.rotate(pose.rightArmAngle);
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(-1.5, 0, 3, 7);
    // Right Dagger
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-1, 5, 2, 6);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 7, 1.5, 4);
    ctx.restore();

    // 2.4 Goblin Head & Pointed Ears
    ctx.save();
    ctx.translate(0, -22 - bob);
    ctx.rotate(pose.headTilt);
    ctx.fillStyle = '#84cc16'; // Green goblin head
    ctx.fillRect(-4.5, -9, 9, 9);

    // Dark Rogue Cowl / Hood
    ctx.fillStyle = '#3f6212';
    ctx.fillRect(-5, -10, 10, 4);

    // Pointed Long Ears
    ctx.fillStyle = '#65a30d';
    // Left Ear
    ctx.beginPath();
    ctx.moveTo(-4.5, -6);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-4.5, -4);
    ctx.closePath();
    ctx.fill();
    // Right Ear
    ctx.beginPath();
    ctx.moveTo(4.5, -6);
    ctx.lineTo(10, -8);
    ctx.lineTo(4.5, -4);
    ctx.closePath();
    ctx.fill();

    // Crooked Nose
    ctx.fillStyle = '#4d7c0f';
    ctx.fillRect(-1, -4.5, 2, 3.5);

    // Amber / Yellow Glowing Eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-3, -6, 2, 2);
    ctx.fillRect(1, -6, 2, 2);
    ctx.restore();

    ctx.restore();
    return true;
  }

  // =========================================================================
  // 3. HYPER BABY ZOMBIE
  // =========================================================================
  if (enemy.type === 'baby_zombie') {
    const isPouncing = enemy.state === 'pounce' || (enemy.z && enemy.z > 0.05);

    // 3.1 Legs with rapid swing frequency
    const runSwing = Math.sin(time * 26) * 0.9;
    ctx.save();
    ctx.translate(-2, -8);
    ctx.rotate(runSwing);
    ctx.fillStyle = '#4c1d95'; // Purple shorts
    ctx.fillRect(-1.5, 0, 3, 8);
    ctx.restore();

    ctx.save();
    ctx.translate(2, -8);
    ctx.rotate(-runSwing);
    ctx.fillStyle = '#4c1d95';
    ctx.fillRect(-1.5, 0, 3, 8);
    ctx.restore();

    // 3.2 Baby Torso (Cyan baby shirt)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-5, -18 - bob, 10, 10);

    // 3.3 Clawing Arms (Outstretched aggressively)
    const armTilt = isPouncing ? -Math.PI / 3 : -Math.PI / 6 + Math.sin(time * 28) * 0.4;
    ctx.save();
    ctx.translate(-5, -16 - bob);
    ctx.rotate(armTilt);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-1.5, 0, 3, 9);
    // Sharp claw tips
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-1.5, 8, 3, 2);
    ctx.restore();

    ctx.save();
    ctx.translate(5, -16 - bob);
    ctx.rotate(armTilt);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-1.5, 0, 3, 9);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-1.5, 8, 3, 2);
    ctx.restore();

    // 3.4 Oversized Chibi Head
    ctx.save();
    ctx.translate(0, -23 - bob);
    ctx.rotate(pose.headTilt + (isPouncing ? 0.3 : 0));
    ctx.fillStyle = '#15803d'; // Green zombie head
    ctx.fillRect(-6, -11, 12, 11);

    // Dark Messy Hair
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-6, -12, 12, 3);

    // Piercing Glowing Crimson Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-4, -6.5, 2.5, 2.5);
    ctx.fillRect(1.5, -6.5, 2.5, 2.5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-3, -5.5, 1, 1);
    ctx.fillRect(2.5, -5.5, 1, 1);
    ctx.restore();

    return true;
  }

  return false;
}
