import { BTContext, NodeStatus, moveTowards } from './behaviorTree';
import { soundManager } from '../audio/soundManager';

/**
 * 1. Heavy Armored Combat Zombie:
 * - Wears full plate and uses sword & kite shield
 * - Raises shield to block player attacks & frontal damage (-80% damage reduction)
 * - Executes a 2-stage melee combo: Heavy Sword Slash -> Forward Shield Bash Knockback
 */
export function tickArmoredZombie(ctx: BTContext): NodeStatus {
  const { enemy, player, dt, isWalkable, damagePlayer, addFloatingText } = ctx;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 16) {
    enemy.state = 'wander';
    return 'FAILURE';
  }

  enemy.blockCooldown = Math.max(0, (enemy.blockCooldown || 0) - dt);
  enemy.attackTimer += dt;
  enemy.facingAngle = Math.atan2(dy, dx);

  // 1.1 Active Shield Blocking State
  if (enemy.isBlocking) {
    enemy.windupTimer = (enemy.windupTimer || 1.2) - dt;
    // Walk forward deliberately while blocking
    moveTowards(enemy, player.x, player.y, enemy.speed * 0.45, dt, isWalkable);

    if (enemy.windupTimer <= 0) {
      enemy.isBlocking = false;
      enemy.state = 'chase';
      enemy.blockCooldown = 3.5;
    }
    return 'RUNNING';
  }

  // 1.2 Raise Shield defensively if player is attacking or charging close
  if (
    dist <= 3.2 &&
    dist >= 1.2 &&
    enemy.blockCooldown <= 0 &&
    (player.isAttacking || Math.random() < 0.04)
  ) {
    enemy.isBlocking = true;
    enemy.state = 'blocking';
    enemy.windupTimer = 1.2;
    soundManager.playShieldBlock();
    addFloatingText(enemy.x, enemy.y, '🛡️ 举盾格挡!', '#94a3b8', 12);
    return 'RUNNING';
  }

  // 1.3 Melee Combat Combo Attack (Slash -> Shield Bash)
  if (dist <= enemy.range) {
    enemy.state = 'attack';
    if (enemy.attackTimer >= enemy.attackCooldown) {
      enemy.attackTimer = 0;
      const step = enemy.comboAttackStep || 0;

      if (step === 0) {
        // Step 0: Heavy Blade Slash
        soundManager.playHit();
        damagePlayer(enemy.damage, '重装僵尸-重剑斩击');
        addFloatingText(player.x, player.y, `💥 沉重斩击 -${enemy.damage}`, '#f87171', 13);
        enemy.comboAttackStep = 1;
        enemy.attackCooldown = 0.7; // Fast follow-up bash
      } else {
        // Step 1: Shield Bash lunge
        soundManager.playShieldBlock();
        const bashDmg = Math.round(enemy.damage * 0.75);
        damagePlayer(bashDmg, '重装僵尸-盾牌重击');
        // Player slight pushback
        player.vx += Math.cos(enemy.facingAngle) * 4.5;
        player.vy += Math.sin(enemy.facingAngle) * 4.5;
        addFloatingText(player.x, player.y, '🛡️ 盾击击退!', '#cbd5e1', 14, true);
        enemy.comboAttackStep = 0;
        enemy.attackCooldown = 1.6; // Longer cooldown after combo
      }
      return 'SUCCESS';
    }
    return 'RUNNING';
  }

  // 1.4 Advance towards player
  enemy.state = 'chase';
  moveTowards(enemy, player.x, player.y, enemy.speed, dt, isWalkable);
  return 'SUCCESS';
}

/**
 * 2. Stealth / Treasure Goblin Scout:
 * - Highly agile, evasive combat rolls to dodge melee swings
 * - Throws toxic daggers from medium range
 * - Snatches player emeralds on melee hit and enters high-speed panic escape sprint
 */
export function tickGoblin(ctx: BTContext): NodeStatus {
  const { enemy, player, dt, isWalkable, damagePlayer, addFloatingText, projectiles } = ctx;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 18) {
    enemy.state = 'wander';
    return 'FAILURE';
  }

  enemy.rollTimer = Math.max(0, (enemy.rollTimer || 0) - dt);
  enemy.daggerCooldown = Math.max(0, (enemy.daggerCooldown || 0) - dt);
  enemy.attackTimer += dt;
  enemy.facingAngle = Math.atan2(dy, dx);

  // 2.1 Evasive Roll Active
  if (enemy.rollTimer > 0) {
    enemy.state = 'rolling';
    return 'RUNNING';
  }

  // 2.2 Panic Retreat if holding stolen coins or low HP
  const isRetreating = (enemy.stolenCoins || 0) > 0 || enemy.hp / enemy.maxHp < 0.25;
  if (isRetreating) {
    enemy.state = 'retreat';
    const fleeX = enemy.x - dx;
    const fleeY = enemy.y - dy;
    moveTowards(enemy, fleeX, fleeY, enemy.speed * 1.35, dt, isWalkable);
    return 'SUCCESS';
  }

  // 2.3 Reactive Combat Roll when player swings nearby
  if (player.isAttacking && dist <= 2.2 && enemy.rollTimer <= 0 && Math.random() < 0.75) {
    enemy.rollTimer = 0.28;
    enemy.state = 'rolling';
    const rollAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.6);
    enemy.vx = Math.cos(rollAngle) * 9.5;
    enemy.vy = Math.sin(rollAngle) * 9.5;
    soundManager.playGoblinRoll();
    addFloatingText(enemy.x, enemy.y, '💨 侧闪翻滚!', '#facc15', 12);
    return 'RUNNING';
  }

  // 2.4 Medium-range Poison Dagger Toss
  if (dist >= 3.0 && dist <= 7.0 && enemy.daggerCooldown <= 0) {
    enemy.daggerCooldown = 2.6;
    soundManager.playShootArrow();
    const throwAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
    projectiles.push({
      id: `goblin_dagger_${Date.now()}_${Math.random()}`,
      x: enemy.x,
      y: enemy.y,
      z: 0.4,
      vx: Math.cos(throwAngle) * 11,
      vy: Math.sin(throwAngle) * 11,
      vz: 0,
      damage: Math.round(enemy.damage * 0.8),
      isPlayer: false,
      type: 'potion_splash',
      timer: 1.8,
      radius: 0.3,
      effect: 'poison',
      color: '#4ade80',
    });
    addFloatingText(enemy.x, enemy.y, '🗡️ 淬毒飞刃!', '#4ade80', 11);
    return 'SUCCESS';
  }

  // 2.5 Melee Sneak Attack & Pocket Snatching
  if (dist <= enemy.range) {
    enemy.state = 'attack';
    if (enemy.attackTimer >= enemy.attackCooldown) {
      enemy.attackTimer = 0;
      soundManager.playHit();
      damagePlayer(enemy.damage, '哥布林刺客-暗影短刃');

      // 60% chance to snatch emeralds if player has any
      if (player.stats.emeralds > 0 && Math.random() < 0.65) {
        const stolen = Math.min(player.stats.emeralds, Math.floor(Math.random() * 4) + 2);
        player.stats.emeralds -= stolen;
        enemy.stolenCoins = (enemy.stolenCoins || 0) + stolen;
        soundManager.playGoblinLaugh();
        addFloatingText(player.x, player.y, `💰 哥布林窃取了 ${stolen} 绿宝石!`, '#fbbf24', 14, true);
      }
      return 'SUCCESS';
    }
    return 'RUNNING';
  }

  // 2.6 Agile Flanking Spiral Approach
  enemy.state = 'chase';
  const spiralOffset = Math.sin((enemy.animTimer || 0) * 3) * 1.5;
  const perpAngle = enemy.facingAngle + Math.PI / 2;
  const targetX = player.x + Math.cos(perpAngle) * spiralOffset;
  const targetY = player.y + Math.sin(perpAngle) * spiralOffset;
  moveTowards(enemy, targetX, targetY, enemy.speed, dt, isWalkable);
  return 'SUCCESS';
}

/**
 * 3. Hyper Baby Zombie:
 * - High-speed zig-zag erratic sprinting (nearly 2x speed of regular zombie)
 * - Airborne leap/pounce attack from 2.5-4.5m
 * - Rapid frenzied multi-scratch attacks
 */
export function tickBabyZombie(ctx: BTContext): NodeStatus {
  const { enemy, player, dt, isWalkable, damagePlayer, addFloatingText } = ctx;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 18) {
    enemy.state = 'wander';
    return 'FAILURE';
  }

  enemy.pounceTimer = Math.max(0, (enemy.pounceTimer || 0) - dt);
  enemy.attackTimer += dt;
  enemy.animTimer = (enemy.animTimer || 0) + dt;

  // 3.1 Airborne Leap Pounce Physics Resolution
  if (enemy.isPouncing || (enemy.z && enemy.z > 0.05)) {
    enemy.state = 'pounce';
    enemy.z = Math.max(0, (enemy.z || 0) + (enemy.vz || 0) * dt);
    enemy.vz = (enemy.vz || 0) - 18.0 * dt;

    // Airborne collision test with player
    if (dist <= 1.2 && (enemy.z || 0) < 0.6) {
      damagePlayer(Math.round(enemy.damage * 1.35), '幼体僵尸-飞扑重砸');
      soundManager.playHit();
      addFloatingText(player.x, player.y, '🐾 飞扑命中! 暴击', '#ef4444', 14, true);
      enemy.z = 0;
      enemy.vz = 0;
      enemy.isPouncing = false;
      enemy.state = 'attack';
      return 'SUCCESS';
    }

    // Ground landing
    if (enemy.z <= 0.01) {
      enemy.z = 0;
      enemy.vz = 0;
      enemy.isPouncing = false;
      enemy.state = 'chase';
    }
    return 'RUNNING';
  }

  // 3.2 Initiate Leap Pounce Attack from 2.2 - 4.5m
  if (dist >= 2.2 && dist <= 4.5 && enemy.pounceTimer <= 0) {
    enemy.pounceTimer = 3.2;
    enemy.isPouncing = true;
    enemy.state = 'pounce';
    enemy.z = 0.1;
    enemy.vz = 4.2;
    const leapSpeed = 8.6;
    enemy.vx = (dx / dist) * leapSpeed;
    enemy.vy = (dy / dist) * leapSpeed;
    soundManager.playBabyZombiePounce();
    addFloatingText(enemy.x, enemy.y, '🐾 狂暴飞扑!', '#ef4444', 13);
    return 'RUNNING';
  }

  // 3.3 Rapid Frenzied Melee Claws
  if (dist <= enemy.range) {
    enemy.state = 'attack';
    if (enemy.attackTimer >= enemy.attackCooldown) {
      enemy.attackTimer = 0;
      soundManager.playHit();
      damagePlayer(enemy.damage, '幼体僵尸-疯狂撕咬');
      addFloatingText(player.x, player.y, `⚡ 快速爪击 -${enemy.damage}`, '#f87171', 11);
      return 'SUCCESS';
    }
    return 'RUNNING';
  }

  // 3.4 Hyperactive Zig-Zag Sprint
  enemy.state = 'chase';
  const zigPerturb = Math.sin((enemy.animTimer || 0) * 12) * 0.9;
  const baseAngle = Math.atan2(dy, dx);
  const zigAngle = baseAngle + zigPerturb;
  const targetX = enemy.x + Math.cos(zigAngle) * 3;
  const targetY = enemy.y + Math.sin(zigAngle) * 3;
  moveTowards(enemy, targetX, targetY, enemy.speed, dt, isWalkable);
  return 'SUCCESS';
}
