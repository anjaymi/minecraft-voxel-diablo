import { AttackMotionProfile, AttackKeyframe, HandWeaponTweenConfig } from './AttackMotionTypes';

const DEFAULT_TWEEN_CONFIG: HandWeaponTweenConfig = {
  weaponAngleOffset: 0,
  wristInertia: 0.15,
  tweenTension: 1.0,
  impactRecoilIntensity: 0.035,
  tangentSnapEnabled: true,
};

/**
 * Profile 1: Fluid Blade Cleave (行云流水斩 - 专为流畅砍击设计的高精度补间轨迹)
 */
const FLUID_SLASH_PROFILE: AttackMotionProfile = {
  id: 'fluid_slash',
  name: '行云流水斩 (Fluid Blade)',
  description: '由腰带臂、由臂运刀的顺滑斩击，手腕与刀锋保持最自然的切线跟随',
  subType: 'sword',
  tweenConfig: {
    ...DEFAULT_TWEEN_CONFIG,
    wristInertia: 0.12,
  },
  combos: {
    // Combo 0: Diagonal Downward Cleave (右上向左下斜劈)
    0: [
      {
        time: 0.0,
        shoulderAngle: 0.0,
        elbowAngle: 0.0,
        wristAngle: 0.0,
        weaponAngle: -0.15,
        thrustX: 0,
        thrustY: 0,
        torsoLean: 0.0,
        squatY: 0,
        lungeX: 0,
        smear: 0.0,
        easing: 'easeInQuad',
      },
      {
        // 蓄力顶点
        time: 0.22,
        shoulderAngle: -1.15,
        elbowAngle: -0.35,
        wristAngle: -0.12,
        weaponAngle: -0.55,
        thrustX: -3.0,
        thrustY: -2.5,
        torsoLean: -0.18,
        squatY: 2.0,
        lungeX: -3.0,
        smear: 0.0,
        easing: 'snapWhip',
      },
      {
        // 斩击切出顶点
        time: 0.48,
        shoulderAngle: 0.38,
        elbowAngle: 0.10,
        wristAngle: 0.16,
        weaponAngle: Math.PI - 0.25,
        thrustX: 16.0,
        thrustY: 6.5,
        torsoLean: 0.34,
        squatY: 5.5,
        lungeX: 16.0,
        smear: 1.0,
        easing: 'elasticHit',
      },
      {
        // 击中顿挫定格
        time: 0.65,
        shoulderAngle: 0.40,
        elbowAngle: 0.10,
        wristAngle: 0.16,
        weaponAngle: Math.PI - 0.25,
        thrustX: 15.0,
        thrustY: 6.5,
        torsoLean: 0.34,
        squatY: 5.5,
        lungeX: 15.0,
        smear: 0.2,
        easing: 'easeOutQuad',
      },
      {
        // 平滑收势
        time: 1.0,
        shoulderAngle: 0.0,
        elbowAngle: 0.0,
        wristAngle: 0.0,
        weaponAngle: -0.15,
        thrustX: 0,
        thrustY: 0,
        torsoLean: 0.0,
        squatY: 0,
        lungeX: 0,
        smear: 0.0,
        easing: 'linear',
      },
    ],

    // Combo 1: Rising Riposte Cleave (低位上撩挑斩)
    1: [
      {
        time: 0.0,
        shoulderAngle: 0.0,
        elbowAngle: 0.0,
        wristAngle: 0.0,
        weaponAngle: -0.15,
        thrustX: 0,
        thrustY: 0,
        torsoLean: 0.0,
        squatY: 0,
        lungeX: 0,
        smear: 0.0,
        easing: 'easeInQuad',
      },
      {
        // 拖刀蓄力
        time: 0.20,
        shoulderAngle: 0.65,
        elbowAngle: 0.20,
        wristAngle: 0.10,
        weaponAngle: Math.PI * 0.75,
        thrustX: 2.0,
        thrustY: 3.5,
        torsoLean: 0.12,
        squatY: 4.0,
        lungeX: 2.5,
        smear: 0.0,
        easing: 'snapWhip',
      },
      {
        // 升龙挑出顶点
        time: 0.46,
        shoulderAngle: -0.95,
        elbowAngle: -0.05,
        wristAngle: -0.15,
        weaponAngle: -0.25,
        thrustX: 15.0,
        thrustY: -6.0,
        torsoLean: -0.23,
        squatY: -3.0,
        lungeX: 15.0,
        smear: 1.0,
        easing: 'elasticHit',
      },
      {
        // 挑空滞留
        time: 0.64,
        shoulderAngle: -0.92,
        elbowAngle: -0.05,
        wristAngle: -0.15,
        weaponAngle: -0.25,
        thrustX: 14.5,
        thrustY: -5.5,
        torsoLean: -0.20,
        squatY: -2.5,
        lungeX: 14.5,
        smear: 0.2,
        easing: 'easeOutQuad',
      },
      {
        // 回正
        time: 1.0,
        shoulderAngle: 0.0,
        elbowAngle: 0.0,
        wristAngle: 0.0,
        weaponAngle: -0.15,
        thrustX: 0,
        thrustY: 0,
        torsoLean: 0.0,
        squatY: 0,
        lungeX: 0,
        smear: 0.0,
        easing: 'linear',
      },
    ],

    // Combo 2: Finisher Leap & Slam (腾空暴烈碎地下砸)
    2: [
      {
        time: 0.0,
        shoulderAngle: 0.0,
        elbowAngle: 0.0,
        wristAngle: 0.0,
        weaponAngle: -0.15,
        thrustX: 0,
        thrustY: 0,
        torsoLean: 0.0,
        squatY: 0,
        lungeX: 0,
        smear: 0.0,
        easing: 'easeOutQuad',
      },
      {
        // 腾空过顶双手高举
        time: 0.26,
        shoulderAngle: -1.45,
        elbowAngle: -0.25,
        wristAngle: -0.10,
        weaponAngle: -0.05,
        thrustX: 3.0,
        thrustY: -10.0,
        torsoLean: -0.15,
        squatY: -12.0,
        lungeX: 4.0,
        smear: 0.0,
        easing: 'snapWhip',
      },
      {
        // 触地下砸顶点
        time: 0.50,
        shoulderAngle: 0.60,
        elbowAngle: 0.10,
        wristAngle: 0.15,
        weaponAngle: Math.PI + 0.10,
        thrustX: 17.0,
        thrustY: 8.0,
        torsoLean: 0.45,
        squatY: 8.0,
        lungeX: 16.0,
        smear: 1.0,
        easing: 'elasticHit',
      },
      {
        // 震波释放与反作用力
        time: 0.68,
        shoulderAngle: 0.60,
        elbowAngle: 0.10,
        wristAngle: 0.15,
        weaponAngle: Math.PI + 0.10,
        thrustX: 16.5,
        thrustY: 8.0,
        torsoLean: 0.45,
        squatY: 8.0,
        lungeX: 16.0,
        smear: 0.3,
        easing: 'easeOutQuad',
      },
      {
        // 起身站定
        time: 1.0,
        shoulderAngle: 0.0,
        elbowAngle: 0.0,
        wristAngle: 0.0,
        weaponAngle: -0.15,
        thrustX: 0,
        thrustY: 0,
        torsoLean: 0.0,
        squatY: 0,
        lungeX: 0,
        smear: 0.0,
        easing: 'linear',
      },
    ],
  },
};

/**
 * Built-in profiles collection.
 */
export const DEFAULT_ATTACK_PROFILES: Record<string, AttackMotionProfile> = {
  fluid_slash: FLUID_SLASH_PROFILE,
};
