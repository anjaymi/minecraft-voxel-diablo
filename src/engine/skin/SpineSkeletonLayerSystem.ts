import { Player } from '../../types';
import { customSkinManager } from './CustomSkinManager';
import { ModularSpineRenderer } from './ModularSpineRenderer';

/**
 * Unified Spine Skeletal Layer System.
 * Delegates directly to the canonical ModularSpineRenderer to guarantee
 * 100% visual consistency between the workshop preview and in-game rendering.
 */
export class SpineSkeletonLayerSystem {
  public static renderPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    _isFacingLeft: boolean
  ): boolean {
    const config = customSkinManager.getSpinePuppet();
    if (!config || !config.enabled) {
      return false;
    }
    return ModularSpineRenderer.renderSpinePuppet(ctx, config, player, time);
  }
}
