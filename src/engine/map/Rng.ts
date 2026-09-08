/**
 * Rng — 可播种伪随机数生成器（mulberry32）。
 *
 * 每个地图工厂持有独立实例：相同种子生成相同地图（可复现调试），
 * 不同运行使用随机种子保证 roguelike 变化性。
 */

export class Rng {
  private state: number;

  constructor(seed?: number) {
    this.state = (seed ?? (Math.random() * 0xffffffff)) >>> 0;
  }

  /** [0, 1) 均匀分布 */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** [min, max) 半开区间随机浮点 */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** [min, max) 半开区间随机整数 */
  public int(min: number, maxExclusive: number): number {
    return Math.floor(this.range(min, maxExclusive));
  }

  /** 概率判定 */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** 从数组中随机取一个元素 */
  public pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length)];
  }

  /** 正整数泊松近似的块大小（用于随机团簇半径等） */
  public weightedSize(min: number, maxSize: number): number {
    // 平方根分布：小值更常见，偶出大块
    return Math.floor(min + Math.sqrt(this.next()) * (maxSize - min));
  }
}
