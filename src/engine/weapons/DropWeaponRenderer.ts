import { Item } from '../../types';
import { WeaponVisualUtils } from './WeaponRenderTypes';

export class DropWeaponRenderer {
  /**
   * Renders high-fidelity weapon icons for dropped loot items in the isometric world.
   */
  public static drawDroppedWeapon(
    ctx: CanvasRenderingContext2D,
    item: Item | undefined,
    fallbackRarityColor: string
  ): boolean {
    if (!item) return false;
    const sub = item.subType || 'sword';
    const colors = WeaponVisualUtils.getWeaponColors(item, fallbackRarityColor);

    ctx.save();

    if (sub === 'bow') {
      // Elegant Recurve Bow Loot Model
      ctx.strokeStyle = colors.handle;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(6.0, -7.5);
      ctx.lineTo(6.0, 7.5);
      ctx.stroke();

      ctx.fillStyle = colors.glow;
      ctx.fillRect(4.8, -9.0, 2.2, 2.2);
      ctx.fillRect(4.8, 6.8, 2.2, 2.2);
      ctx.restore();
      return true;
    }

    if (sub === 'crossbow') {
      // Heavy Crossbow Loot Model
      ctx.fillStyle = colors.handle;
      ctx.fillRect(-2, -2, 12, 4);
      ctx.fillStyle = colors.blade;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 5;
      ctx.fillRect(8, -8, 2.5, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(1, 1, 2, 2);
      ctx.restore();
      return true;
    }

    if (sub === 'staff' || sub === 'wand') {
      // Magic Staff / Wand Loot Model
      ctx.fillStyle = colors.handle;
      ctx.fillRect(-1.5, -6, 3, 15);

      ctx.fillStyle = colors.blade;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(0, -8, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -8, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    }

    if (sub === 'dagger') {
      // Shadow Dagger Loot Model
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-1, 3, 2, 4);

      ctx.fillStyle = colors.blade;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(-2, 3);
      ctx.quadraticCurveTo(-3.5, -4, 1.2, -9);
      ctx.quadraticCurveTo(2.2, -3, 2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    }

    if (sub === 'axe') {
      // Battleaxe Loot Model
      ctx.fillStyle = colors.handle;
      ctx.fillRect(-1.5, -7, 3, 16);
      ctx.fillStyle = colors.blade;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-1.5, -7);
      ctx.bezierCurveTo(-9, -9, -9, 0, -1.5, -1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1.5, -7);
      ctx.bezierCurveTo(9, -9, 9, 0, 1.5, -1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8.5, -6, 1, 4);
      ctx.fillRect(7.5, -6, 1, 4);
      ctx.restore();
      return true;
    }

    if (sub === 'hammer') {
      // Warhammer Loot Model
      ctx.fillStyle = colors.handle;
      ctx.fillRect(-1.5, -5, 3, 14);
      ctx.fillStyle = colors.blade;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(-7, -9, 14, 7.5, 2);
      ctx.fill();
      ctx.restore();
      return true;
    }

    if (sub === 'greatsword') {
      // Zweihänder Greatsword Loot Model
      ctx.fillStyle = colors.handle;
      ctx.fillRect(-1.2, 3, 2.4, 7);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-5.5, 2, 11, 2);
      ctx.fillStyle = colors.blade;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.moveTo(-2.5, 2);
      ctx.lineTo(-2.2, -11);
      ctx.lineTo(0, -14.5);
      ctx.lineTo(2.2, -11);
      ctx.lineTo(2.5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    }

    if (sub === 'sword') {
      // Broadsword Loot Model
      ctx.fillStyle = colors.handle;
      ctx.fillRect(-1, 3, 2, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-4.5, 2, 9, 1.8);
      ctx.fillStyle = colors.blade;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-2.2, 2);
      ctx.lineTo(-1.8, -8);
      ctx.lineTo(0, -11.5);
      ctx.lineTo(1.8, -8);
      ctx.lineTo(2.2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    }

    ctx.restore();
    return false;
  }
}
