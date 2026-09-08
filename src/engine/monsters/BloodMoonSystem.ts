import { DungeonFloor, ZoneType } from '../../types';
import { BIOME_ZONES } from '../map/MapConstants';

/**
 * BloodMoonSystem — 血月模式。
 *
 * 进入荒野/生态区时概率触发（22%）：魔物狂暴化——
 * 数量 ×1.5、精英率 0.2→0.45、攻血 ×1.15、绿宝石 ×1.5（高风险高回报）。
 * 离开荒野（回城/下地牢）自动解除。
 */

export interface BloodMoonSpawnMods {
  eliteChance: number;
  countMult: number;
  statMult: number;
  emeraldMult: number;
}

const WILD_ZONES = new Set<ZoneType | 'keep'>(['overworld', ...Array.from(BIOME_ZONES)] as ZoneType[]);

class BloodMoonSystem {
  public active: boolean = false;
  private floorKey: string = '';

  /** 每次生成区域实体时调用：判定是否触发血月 */
  public maybeTrigger(floor: DungeonFloor, announce: (text: string) => void): void {
    const key = `${floor.zoneType}_${floor.floorNumber}`;
    const wild = WILD_ZONES.has(floor.zoneType);

    if (!wild) {
      this.active = false;
      this.floorKey = key;
      return;
    }
    // 同一区域重复生成（往返）不重掷
    if (this.floorKey === key && this.active) return;
    this.floorKey = key;

    this.active = !this.active && Math.random() < 0.22;
    if (this.active) {
      announce('🩸 血月升起！魔物狂暴化——掉落加成 150%！');
    }
  }

  /** 当前生成与掉落乘区 */
  public getMods(): BloodMoonSpawnMods {
    return this.active
      ? { eliteChance: 0.45, countMult: 1.5, statMult: 1.15, emeraldMult: 1.5 }
      : { eliteChance: 0.2, countMult: 1, statMult: 1, emeraldMult: 1 };
  }

  public isActive(): boolean {
    return this.active;
  }
}

export const bloodMoonSystem = new BloodMoonSystem();
