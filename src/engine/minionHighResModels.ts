import { SummonedMinion } from '../types';
import { MinionBeastModels } from './minionBeastModels';
import { MinionUndeadModels } from './minionUndeadModels';

export class MinionHighResModels {
  public static drawWolf(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    MinionBeastModels.drawWolf(ctx, minion, time);
  }

  public static drawSkeleton(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    MinionUndeadModels.drawSkeleton(ctx, minion, time);
  }

  public static drawTreant(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    MinionBeastModels.drawTreant(ctx, minion, time);
  }
}
