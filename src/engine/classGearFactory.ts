import { CharacterClassId, EquippedGear } from '../types';
import { MagicClassGearFactory } from './magicClassGearFactory';

/**
 * Generates distinct, specialized starting gear for each character class.
 * Ensures zero-homogeneity in equipment, offhand mechanics, and playstyle identity.
 */
export class ClassGearFactory {
  public static generateStartingGear(classId: CharacterClassId): EquippedGear {
    const timeId = Date.now();

    switch (classId) {
      case 'mage':
        return MagicClassGearFactory.generateMageGear(timeId);

      case 'summoner':
        return MagicClassGearFactory.generateSummonerGear(timeId);

      case 'druid':
        return MagicClassGearFactory.generateDruidGear(timeId);
      case 'warrior':
        return {
          weapon: {
            id: `wp_war_${timeId}`,
            name: '炽钢重剑 (Greatsword)',
            rarity: 'magic',
            slot: 'weapon',
            subType: 'sword',
            level: 1,
            icon: '🗡️',
            attackBonus: 18,
            speedBonus: -0.2,
            attackSpeedRating: 'B',
            weaponRange: 2.3,
            weaponSweepArc: Math.PI * 0.75,
            knockbackForce: 4.5,
            refineLevel: 0,
            recommendedClass: 'warrior',
            glowColor: '#f97316',
            glowIntensity: 0.85,
            vfxType: '炽炎破空裂斩',
            appearanceDesc: '锻铁赤钢重刃，挥舞时伴随炽烈火星与宽幅断空烈弧',
            weaponPerk: '均衡斩击：三连击流畅，第3击跳跃重砸震荡波',
            description: '势大力沉的双手重剑，普攻拥有三连重斩与巨大横扫判定',
            affixes: ['近战猛击 +18', '攻击范围 +25%', '重击强击退'],
            value: 40,
          },
          offhand: {
            id: `oh_war_${timeId}`,
            name: '破阵精钢重盾 (Tower Shield)',
            rarity: 'magic',
            slot: 'offhand',
            subType: 'shield',
            level: 1,
            icon: '🛡️',
            defenseBonus: 8,
            hpBonus: 35,
            description: '右键长按架起盾御格挡减伤80%，松开释放盾猛冲击波击晕前方敌人',
            affixes: ['护甲 +8', '生命值 +35', '盾御减伤 80%'],
            value: 45,
          },
          armor: {
            id: `ar_war_${timeId}`,
            name: '禁卫玄铁重铠',
            rarity: 'common',
            slot: 'armor',
            level: 1,
            icon: '🛡️',
            defenseBonus: 7,
            hpBonus: 30,
            description: '重装步兵锻铁重铠，赋予极佳的受创抵抗',
            affixes: ['物理防御 +7', '生命 +30'],
            value: 30,
          },
          helmet: null,
          boots: {
            id: `bt_war_${timeId}`,
            name: '破阵精铁战靴',
            rarity: 'common',
            slot: 'boots',
            level: 1,
            icon: '🥾',
            defenseBonus: 3,
            speedBonus: 0.2,
            description: '加重合金铁战靴，稳固身形抵抗击退',
            affixes: ['击退抵抗 +30%', '防御 +3'],
            value: 20,
          },
          ring: null,
        };

      case 'ranger':
        return {
          weapon: {
            id: `wp_ran_${timeId}`,
            name: '疾风追猎长弓 (Windrunner Bow)',
            rarity: 'magic',
            slot: 'weapon',
            subType: 'bow',
            level: 1,
            icon: '🏹',
            attackBonus: 14,
            critChanceBonus: 0.22,
            speedBonus: 0.3,
            attackSpeedRating: 'A',
            weaponRange: 14.0,
            weaponSweepArc: 0,
            knockbackForce: 3.5,
            refineLevel: 0,
            recommendedClass: 'ranger',
            glowColor: '#22c55e',
            glowIntensity: 0.8,
            vfxType: '疾风螺旋贯穿箭',
            appearanceDesc: '翡翠风灵战弓，拉弦时汇聚风旋流线，箭矢破空带出青绿尾焰',
            weaponPerk: '鹰眼穿杨：普攻连珠疾箭，右键蓄力破空贯穿狙击箭',
            description: '高精密度复合轻弓，普攻连珠快速平射，右键长按蓄力贯穿狙击箭',
            affixes: ['远程伤害 +14', '暴击率 +22%', '箭矢射速 +35%'],
            value: 45,
          },
          offhand: {
            id: `oh_ran_${timeId}`,
            name: '穿心猎手短匕 (Hunter Dirk)',
            rarity: 'magic',
            slot: 'offhand',
            subType: 'dagger',
            level: 1,
            icon: '🔪',
            attackBonus: 6,
            speedBonus: 0.4,
            description: '精巧锋锐的自卫短匕，大幅提升机动性并在近身遇袭时迅速反击',
            affixes: ['移动速度 +0.4', '近战急袭 +6', '翻滚冷却 -15%'],
            value: 30,
          },
          armor: {
            id: `ar_ran_${timeId}`,
            name: '巡林客风行皮甲',
            rarity: 'common',
            slot: 'armor',
            level: 1,
            icon: '🦺',
            defenseBonus: 4,
            speedBonus: 0.5,
            description: '柔软轻盈的林地斗篷式猎手皮甲，行动无声如风',
            affixes: ['移速 +0.5', '闪避几率 +8%'],
            value: 25,
          },
          helmet: null,
          boots: {
            id: `bt_ran_${timeId}`,
            name: '疾行鹿皮长靴',
            rarity: 'common',
            slot: 'boots',
            level: 1,
            icon: '👢',
            defenseBonus: 2,
            speedBonus: 0.6,
            description: '耐磨柔韧的鹿皮猎靴，使冲刺距离显著延长',
            affixes: ['移速 +0.6', '冲刺距离 +20%'],
            value: 20,
          },
          ring: null,
        };

      case 'rogue':
        return {
          weapon: {
            id: `wp_rog_${timeId}`,
            name: '影杀利刃 (Shadowfang Dagger)',
            rarity: 'magic',
            slot: 'weapon',
            subType: 'dagger',
            level: 1,
            icon: '🗡️',
            attackBonus: 16,
            critChanceBonus: 0.22, // 数值平衡(2026-09)：0.28→0.22
            speedBonus: 0.4,
            attackSpeedRating: 'S',
            weaponRange: 1.7,
            weaponSweepArc: Math.PI * 0.45,
            knockbackForce: 2.0,
            refineLevel: 0,
            recommendedClass: 'rogue',
            glowColor: '#e11d48',
            glowIntensity: 0.85,
            vfxType: '暗影绝息瞬刺',
            appearanceDesc: '冷冽黑曜石暗影短刃，划过空气时留下一抹嗜血紫红残影',
            weaponPerk: '暗影绝息刺：超频疾速连刺，背刺1.85x爆发伤害',
            description: '淬毒双刺之主刃，攻速迅疾，在目标侧背突袭造成惊人背刺暴击',
            affixes: ['攻速 +35%', '暴击率 +22%', '背刺伤害 +50%'],
            value: 45,
          },
          offhand: {
            id: `oh_rog_${timeId}`,
            name: '淬毒剧痛暗刺 (Venom Spike)',
            rarity: 'magic',
            slot: 'offhand',
            subType: 'dagger',
            level: 1,
            icon: '🧪',
            attackBonus: 8,
            critChanceBonus: 0.08, // 数值平衡(2026-09)：0.12→0.08
            description: '右键投掷暗影淬毒飞刀，命中目标后附加持续剧毒扣血与减速',
            affixes: ['攻击附带剧毒', '飞刀流血 +20%', '暴击率 +8%'],
            value: 35,
          },
          armor: {
            id: `ar_rog_${timeId}`,
            name: '暗夜潜行隐衣',
            rarity: 'common',
            slot: 'armor',
            level: 1,
            icon: '🥷',
            defenseBonus: 3,
            speedBonus: 0.5,
            description: '暗夜刺客特制紧身战衣，在阴影中移动获得极速加成',
            affixes: ['移动速度 +0.5', '潜行暴击 +40%'],
            value: 25,
          },
          helmet: null,
          boots: {
            id: `bt_rog_${timeId}`,
            name: '绝影消音软靴',
            rarity: 'common',
            slot: 'boots',
            level: 1,
            icon: '👢',
            defenseBonus: 2,
            speedBonus: 0.7,
            description: '无声踏雪的特制软靴，大幅缩短暗影翻滚与突进冷却',
            affixes: ['移速 +0.7', '位移冷却 -35%'],
            value: 25,
          },
          ring: null,
        };
    }
  }
}
