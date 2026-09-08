/**
 * Isometric 2.5D coordinate transformation and camera helper
 */

import { GameViewportManager } from './camera/GameViewportManager';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const BLOCK_HEIGHT = 30; // 3D block thickness

export interface ScreenCoord {
  x: number;
  y: number;
}

export interface WorldCoord {
  x: number;
  y: number;
}

/**
 * Converts continuous world coordinates (x, y, z) into screen pixel coordinates
 */
export function worldToScreen(
  wx: number,
  wy: number,
  wz: number,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number
): ScreenCoord {
  const relX = wx - camX;
  const relY = wy - camY;

  const sx = (relX - relY) * (TILE_WIDTH / 2) + viewportWidth / 2;
  const sy = (relX + relY) * (TILE_HEIGHT / 2) - wz * BLOCK_HEIGHT + viewportHeight / 2;

  return { x: sx, y: sy };
}

/**
 * Converts screen pixel coordinates back into ground (z=0) world coordinates
 * Accounts for global camera zoom scale
 */
export function screenToWorld(
  sx: number,
  sy: number,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number,
  customZoom?: number
): WorldCoord {
  // Convert zoomed screen pixel back to unzoomed scene pixel
  const scenePt = GameViewportManager.canvasToSceneCoord(
    sx,
    sy,
    viewportWidth,
    viewportHeight,
    customZoom
  );

  const relSx = scenePt.x - viewportWidth / 2;
  const relSy = scenePt.y - viewportHeight / 2;

  const relX = (relSx / (TILE_WIDTH / 2) + relSy / (TILE_HEIGHT / 2)) / 2;
  const relY = (relSy / (TILE_HEIGHT / 2) - relSx / (TILE_WIDTH / 2)) / 2;

  return {
    x: relX + camX,
    y: relY + camY,
  };
}

/**
 * Calculate sorting depth for isometric rendering (draw order: back to front)
 */
export function calculateDepth(x: number, y: number, z: number = 0): number {
  return (x + y) * 1000 + z * 10;
}
