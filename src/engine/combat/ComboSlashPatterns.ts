import { MeleeSlashPose } from './MeleeSlashTypes';

/**
 * Professional 2D Action Kinematics Solver for Melee Weapon Attacks.
 * Designed by 2D Action Choreography Specialists.
 * Replaces unnatural rotating with visceral forward lunge, drop squat, and high-impact slashes.
 */
export class ComboSlashPatterns {
  /**
   * Combo 1: High-to-Low Downward Diagonal Cleave (右上向左下雷霆力劈)
   */
  public static solveDownwardSlash(
    phase: number,
    subType: string,
    isTwoHanded: boolean,
    comboStep: number
  ): MeleeSlashPose {
    let stage: MeleeSlashPose['stage'] = 'windup';
    let torsoLean = 0;
    let lungeX = 0;
    let squatY = 0;
    let shoulderAngle = 0;
    let elbowAngle = 0;
    let wristAngle = 0;
    let weaponAngle = 0;
    let thrustX = 0;
    let thrustY = 0;
    let recoil = 0;
    let smear = 0;

    if (phase < 0.22) {
      // 1. Wind-up (蓄力后拉引刀): Lean back, raise blade high above shoulder
      stage = 'windup';
      const p = phase / 0.22;
      const ease = p * p;
      torsoLean = -0.18 * ease;
      lungeX = -3.0 * ease;
      squatY = 2.0 * ease;
      shoulderAngle = -1.15 * ease; // Draw upper arm up-back
      elbowAngle = -0.35 * ease;    // Elbow flexed ready to whip
      wristAngle = -0.12 * ease;    // Firm in-line grip
      weaponAngle = -0.45 * ease;   // Blade poised behind shoulder
      thrustX = -3.0 * ease;
      thrustY = -2.5 * ease;
    } else if (phase < 0.50) {
      // 2. Explosive Slash (雷霆下劈): Massive forward step, torso plunge, arm whips down
      stage = 'slash';
      const p = (phase - 0.22) / 0.28;
      // Exponential snap curve for maximum impact acceleration
      const ease = p < 0.4 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

      torsoLean = -0.18 + ease * 0.52; // Leans forward into cut (+0.34 rad)
      lungeX = -3.0 + ease * 18.0;     // Huge forward lunge +15px
      squatY = 2.0 + ease * 3.5;       // Center of gravity drops +5.5px
      shoulderAngle = -1.15 + ease * 1.55; // Whips from -1.15 to +0.40 rad (downward forward)
      elbowAngle = -0.35 + ease * 0.45;    // Elbow opens fully to +0.10 rad
      wristAngle = -0.12 + ease * 0.28;    // Wrist snaps straight into blade line
      weaponAngle = -0.45 + ease * 1.15;   // Blade aligns firmly with target slash line (+0.70 rad)
      thrustX = ease * 15.0;               // Forward blade extension
      thrustY = ease * 6.5;
      smear = Math.sin(p * Math.PI);       // Crescent trail peaks at strike apex
    } else if (phase < 0.66) {
      // 3. Impact Freeze / Cut-Stop (入肉顿挫停刀): Slicing apex with micro-recoil
      stage = 'impact';
      const p = (phase - 0.50) / 0.16;
      torsoLean = 0.34;
      lungeX = 15.0;
      squatY = 5.5;
      recoil = Math.sin(p * Math.PI * 4) * 0.035; // Blade impact tremble
      shoulderAngle = 0.40 + recoil;
      elbowAngle = 0.10;
      wristAngle = 0.16;
      weaponAngle = 0.70 + recoil;
      thrustX = 15.0;
      thrustY = 6.5;
      smear = 0.40 * (1 - p);
    } else {
      // 4. Recovery (顺势收刀回归)
      stage = 'recovery';
      const p = (phase - 0.66) / 0.34;
      const ease = 1 - Math.cos((p * Math.PI) / 2);
      torsoLean = 0.34 * (1 - ease);
      lungeX = 15.0 * (1 - ease);
      squatY = 5.5 * (1 - ease);
      shoulderAngle = 0.40 - ease * 0.40;
      elbowAngle = 0.10 * (1 - ease);
      wristAngle = 0.16 * (1 - ease);
      weaponAngle = 0.70 - ease * 0.50;
      thrustX = 15.0 * (1 - ease);
      thrustY = 6.5 * (1 - ease);
      smear = 0;
    }

    return {
      isActive: true,
      phase,
      stage,
      comboStep,
      subType,
      isTwoHanded,
      torso: {
        offsetX: lungeX,
        offsetY: squatY,
        rotation: torsoLean,
        squashX: stage === 'slash' ? 1.08 : 1.0,
        squashY: stage === 'slash' ? 0.92 : 1.0,
      },
      head: { offsetX: lungeX * 0.6, offsetY: squatY * 0.7, rotation: torsoLean * 0.4 },
      legs: {
        lungeX,
        leftLegRot: -torsoLean * 0.65 - 0.2,
        rightLegRot: torsoLean * 0.85 + 0.3,
        leftLift: squatY * 0.4,
        rightLift: squatY * 0.8,
      },
      armRight: {
        shoulderAngle,
        elbowAngle,
        wristAngle,
        handOffsetX: thrustX,
        handOffsetY: thrustY,
      },
      armLeft: {
        angle: isTwoHanded ? shoulderAngle * 0.9 : -shoulderAngle * 0.4 - 0.2,
        offsetX: isTwoHanded ? thrustX - 3 : -lungeX * 0.3,
        offsetY: isTwoHanded ? thrustY + 2 : 0,
      },
      weapon: {
        angle: weaponAngle,
        pivotOffsetX: 0,
        pivotOffsetY: 0,
        thrustX,
        thrustY,
        recoilShake: recoil,
        smearIntensity: smear,
        smearArcStart: -Math.PI * 0.55,
        smearArcEnd: Math.PI * 0.25,
        smearRadius: subType === 'greatsword' ? 38 : 28,
      },
    };
  }

  /**
   * Combo 2: Low-to-High Upward Riposte Cleave (低位拖刀向右上升龙挑斩)
   */
  public static solveUpwardCleave(
    phase: number,
    subType: string,
    isTwoHanded: boolean,
    comboStep: number
  ): MeleeSlashPose {
    let stage: MeleeSlashPose['stage'] = 'windup';
    let torsoLean = 0;
    let lungeX = 0;
    let squatY = 0;
    let shoulderAngle = 0;
    let elbowAngle = 0;
    let wristAngle = 0;
    let weaponAngle = 0;
    let thrustX = 0;
    let thrustY = 0;
    let recoil = 0;
    let smear = 0;

    if (phase < 0.20) {
      // 1. Wind-up (低位拖刀蓄势): Drop center of gravity, trail blade low behind
      stage = 'windup';
      const p = phase / 0.20;
      torsoLean = 0.12 * p;
      lungeX = 2.5 * p;
      squatY = 4.0 * p;
      shoulderAngle = 0.50 + p * 0.30; // Drop arm low
      elbowAngle = 0.20 * p;
      wristAngle = 0.10 * p;
      weaponAngle = 0.65 + p * 0.35;   // Blade points down-back ready to rip up
      thrustX = 2.0 * p;
      thrustY = 3.5 * p;
    } else if (phase < 0.48) {
      // 2. Ascending Cleave (升龙破空挑斩): Explosive upward launch, blade tears into sky
      stage = 'slash';
      const p = (phase - 0.20) / 0.28;
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

      torsoLean = 0.12 - ease * 0.35; // Arches back as blade lifts (-0.23 rad)
      lungeX = 2.5 + ease * 12.5;    // Forward step +15px
      squatY = 4.0 - ease * 7.0;     // Body springs upward (-3px rise)
      shoulderAngle = 0.80 - ease * 1.75; // Slashes up to -0.95 rad (high forward)
      elbowAngle = 0.20 - ease * 0.25;
      wristAngle = 0.10 - ease * 0.25;
      weaponAngle = 1.0 - ease * 1.95;    // Sweeps up into sky (-0.95 rad)
      thrustX = 2.0 + ease * 13.0;
      thrustY = 3.5 - ease * 9.5;
      smear = Math.sin(p * Math.PI);
    } else if (phase < 0.64) {
      // 3. Apex Hold (挑顶定格)
      stage = 'impact';
      const p = (phase - 0.48) / 0.16;
      torsoLean = -0.23;
      lungeX = 15.0;
      squatY = -3.0;
      recoil = Math.sin(p * Math.PI * 4) * 0.035;
      shoulderAngle = -0.95 + recoil;
      elbowAngle = -0.05;
      wristAngle = -0.15;
      weaponAngle = -0.95 + recoil;
      thrustX = 15.0;
      thrustY = -6.0;
      smear = 0.4 * (1 - p);
    } else {
      // 4. Recovery (平稳收势)
      stage = 'recovery';
      const p = (phase - 0.64) / 0.36;
      const ease = 1 - Math.cos((p * Math.PI) / 2);
      torsoLean = -0.23 * (1 - ease);
      lungeX = 15.0 * (1 - ease);
      squatY = -3.0 * (1 - ease);
      shoulderAngle = -0.95 + ease * 0.95;
      elbowAngle = -0.05 * (1 - ease);
      wristAngle = -0.15 * (1 - ease);
      weaponAngle = -0.95 + ease * 1.15;
      thrustX = 15.0 * (1 - ease);
      thrustY = -6.0 * (1 - ease);
      smear = 0;
    }

    return {
      isActive: true,
      phase,
      stage,
      comboStep,
      subType,
      isTwoHanded,
      torso: { offsetX: lungeX, offsetY: squatY, rotation: torsoLean, squashX: 0.95, squashY: 1.05 },
      head: { offsetX: lungeX * 0.6, offsetY: squatY * 0.7, rotation: torsoLean * 0.45 },
      legs: {
        lungeX,
        leftLegRot: -0.3 + torsoLean,
        rightLegRot: 0.35 - torsoLean,
        leftLift: Math.max(0, -squatY),
        rightLift: Math.max(0, -squatY * 0.8),
      },
      armRight: {
        shoulderAngle,
        elbowAngle,
        wristAngle,
        handOffsetX: thrustX,
        handOffsetY: thrustY,
      },
      armLeft: {
        angle: isTwoHanded ? shoulderAngle * 0.9 : -shoulderAngle * 0.5,
        offsetX: isTwoHanded ? thrustX - 2 : -lungeX * 0.3,
        offsetY: isTwoHanded ? thrustY + 2 : 0,
      },
      weapon: {
        angle: weaponAngle,
        pivotOffsetX: 0,
        pivotOffsetY: 0,
        thrustX,
        thrustY,
        recoilShake: recoil,
        smearIntensity: smear,
        smearArcStart: Math.PI * 0.35,
        smearArcEnd: -Math.PI * 0.45,
        smearRadius: subType === 'greatsword' ? 40 : 30,
      },
    };
  }

  /**
   * Combo 3: Finisher Earth-Shattering Leap & Slam (双手跃起过顶暴烈下砸)
   */
  public static solveFinisherSlam(
    phase: number,
    subType: string,
    isTwoHanded: boolean,
    comboStep: number
  ): MeleeSlashPose {
    let stage: MeleeSlashPose['stage'] = 'windup';
    let torsoLean = 0;
    let lungeX = 0;
    let squatY = 0;
    let shoulderAngle = 0;
    let elbowAngle = 0;
    let wristAngle = 0;
    let weaponAngle = 0;
    let thrustX = 0;
    let thrustY = 0;
    let recoil = 0;
    let smear = 0;

    if (phase < 0.28) {
      // 1. Airborne Leap & Overhead Raise (跃起腾空双手举刀过顶)
      stage = 'windup';
      const p = phase / 0.28;
      const ease = Math.sin(p * Math.PI * 0.5);
      torsoLean = -0.15 * ease;
      lungeX = 4.0 * ease;
      squatY = -12.0 * ease; // High jump in the air!
      shoulderAngle = -1.45 * ease; // Arms raised high overhead
      elbowAngle = -0.25 * ease;
      wristAngle = -0.10 * ease;
      weaponAngle = -0.55 * ease;
      thrustX = 3.0 * ease;
      thrustY = -10.0 * ease;
    } else if (phase < 0.52) {
      // 2. Thunderous Plunge (泰山压顶狂暴下砸): Full body mass drives blade into earth
      stage = 'slash';
      const p = (phase - 0.28) / 0.24;
      const ease = p * p * p; // Violent gravitational acceleration

      torsoLean = -0.15 + ease * 0.60;
      lungeX = 4.0 + ease * 12.0;
      squatY = -12.0 + ease * 20.0; // Slams down into ground +8px
      shoulderAngle = -1.45 + ease * 2.05; // Plunges to +0.60 rad
      elbowAngle = -0.25 + ease * 0.35;
      wristAngle = -0.10 + ease * 0.25;
      weaponAngle = -0.55 + ease * 1.55; // Vertical plunge into earth (+1.0 rad)
      thrustX = 3.0 + ease * 14.0;
      thrustY = -10.0 + ease * 18.0;
      smear = Math.sin(p * Math.PI);
    } else if (phase < 0.70) {
      // 3. Ground Impact & Shockwave Tremble (破土冲击波与极速震颤)
      stage = 'impact';
      const p = (phase - 0.52) / 0.18;
      torsoLean = 0.45;
      lungeX = 16.0;
      squatY = 8.0;
      recoil = Math.sin(p * Math.PI * 6) * 0.05; // Violent ground impact shake
      shoulderAngle = 0.60 + recoil;
      elbowAngle = 0.10;
      wristAngle = 0.15;
      weaponAngle = 1.0 + recoil;
      thrustX = 17.0;
      thrustY = 8.0;
      smear = 0.5 * (1 - p);
    } else {
      // 4. Recovery (起身后撤收刃)
      stage = 'recovery';
      const p = (phase - 0.70) / 0.30;
      const ease = 1 - Math.cos((p * Math.PI) / 2);
      torsoLean = 0.45 * (1 - ease);
      lungeX = 16.0 * (1 - ease);
      squatY = 8.0 * (1 - ease);
      shoulderAngle = 0.60 - ease * 0.60;
      elbowAngle = 0.10 * (1 - ease);
      wristAngle = 0.15 * (1 - ease);
      weaponAngle = 1.0 - ease * 0.80;
      thrustX = 17.0 * (1 - ease);
      thrustY = 8.0 * (1 - ease);
      smear = 0;
    }

    return {
      isActive: true,
      phase,
      stage,
      comboStep,
      subType,
      isTwoHanded,
      torso: {
        offsetX: lungeX,
        offsetY: squatY,
        rotation: torsoLean,
        squashX: stage === 'slash' ? 1.15 : 1.0,
        squashY: stage === 'slash' ? 0.85 : 1.0,
      },
      head: { offsetX: lungeX * 0.6, offsetY: squatY * 0.7, rotation: torsoLean * 0.4 },
      legs: {
        lungeX,
        leftLegRot: -torsoLean * 0.8,
        rightLegRot: torsoLean * 0.9,
        leftLift: Math.max(0, squatY * 0.6),
        rightLift: Math.max(0, squatY),
      },
      armRight: {
        shoulderAngle,
        elbowAngle,
        wristAngle,
        handOffsetX: thrustX,
        handOffsetY: thrustY,
      },
      armLeft: {
        angle: shoulderAngle * 0.95, // Both hands firmly grasp the blade
        offsetX: thrustX - 2,
        offsetY: thrustY + 2,
      },
      weapon: {
        angle: weaponAngle,
        pivotOffsetX: 0,
        pivotOffsetY: 0,
        thrustX,
        thrustY,
        recoilShake: recoil,
        smearIntensity: smear,
        smearArcStart: -Math.PI * 0.65,
        smearArcEnd: Math.PI * 0.35,
        smearRadius: subType === 'greatsword' ? 44 : 34,
      },
    };
  }
}
