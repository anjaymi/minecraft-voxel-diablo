import { SpineSlotKey } from './spineTypes';

/**
 * Generate high-definition pixel-crisp PNG sprites for modular Spine slots
 */
export class SpineSlotProcedural {
  public static createSlotSprite(
    preset: 'knight' | 'mage' | 'skeleton' | 'mecha',
    slot: SpineSlotKey
  ): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.imageSmoothingEnabled = false;

    if (slot === 'head') {
      canvas.width = 44;
      canvas.height = 44;
      this.drawHead(ctx, preset);
    } else if (slot === 'torso') {
      canvas.width = 36;
      canvas.height = 40;
      this.drawTorso(ctx, preset);
    } else if (slot === 'armLeft' || slot === 'armRight') {
      canvas.width = 18;
      canvas.height = 32;
      this.drawArm(ctx, preset, slot === 'armRight');
    } else {
      // legLeft, legRight
      canvas.width = 16;
      canvas.height = 30;
      this.drawLeg(ctx, preset, slot === 'legRight');
    }

    return canvas.toDataURL('image/png');
  }

  private static drawHead(ctx: CanvasRenderingContext2D, preset: string) {
    if (preset === 'knight') {
      // Silver visor knight helmet with red plume
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(18, 2, 8, 12); // Red feather plume
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(8, 12, 28, 26); // Main Helmet
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 30, 28, 8); // Chin guard
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 22, 20, 6); // Visor slit
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 23, 6, 4); // Glowing eye slit
      ctx.fillRect(24, 23, 6, 4);
    } else if (preset === 'mage') {
      // Wizard pointed hat & mystical hood
      ctx.fillStyle = '#581c87'; // Hat cone
      ctx.beginPath();
      ctx.moveTo(22, 2);
      ctx.lineTo(6, 26);
      ctx.lineTo(38, 26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7e22ce'; // Brim
      ctx.fillRect(4, 24, 36, 6);
      ctx.fillStyle = '#facc15'; // Star badge
      ctx.fillRect(20, 16, 4, 4);
      // Face in hood shadow
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(10, 28, 24, 14);
      ctx.fillStyle = '#38bdf8'; // Glowing cyan eyes
      ctx.fillRect(15, 33, 4, 3);
      ctx.fillRect(25, 33, 4, 3);
    } else if (preset === 'skeleton') {
      // Skull with green soul fire
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(22, 20, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(15, 26, 14, 12); // Jaw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, 18, 5, 6); // Eye sockets
      ctx.fillRect(25, 18, 5, 6);
      ctx.fillRect(20, 25, 4, 3); // Nose cavity
      // Soul fire
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(15, 19, 3, 3);
      ctx.fillRect(26, 19, 3, 3);
    } else {
      // Mecha Brass Automaton
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 10, 28, 26);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(11, 13, 22, 20);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, 17, 16, 12);
      // Large camera lens
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(22, 23, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(20, 21, 2, 2);
    }
  }

  private static drawTorso(ctx: CanvasRenderingContext2D, preset: string) {
    if (preset === 'knight') {
      // Royal blue tabard + steel cuirass + gold belt
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(4, 4, 28, 28);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(10, 8, 16, 18); // Steel breastplate
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, 28, 24, 6); // Belt
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(15, 27, 6, 8); // Belt buckle
    } else if (preset === 'mage') {
      // Cosmic violet robe with rune mantle
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(4, 4, 28, 32);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(16, 4, 4, 32); // Center sash
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 6, 16, 4); // Collar gem
    } else if (preset === 'skeleton') {
      // Ribcage and spine
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 4, 24, 30); // Tattered dark cape under
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(16, 4, 4, 30); // Spine
      ctx.fillRect(8, 10, 20, 4); // Rib 1
      ctx.fillRect(10, 16, 16, 4); // Rib 2
      ctx.fillRect(11, 22, 14, 4); // Rib 3
    } else {
      // Mecha Furnace Core
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 4, 28, 30);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(10, 10, 16, 16); // Molten glow grate
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(12, 12, 12, 12);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(15, 15, 6, 6);
    }
  }

  private static drawArm(ctx: CanvasRenderingContext2D, preset: string, isRight: boolean) {
    const mainColor = 
      preset === 'knight' ? '#475569' :
      preset === 'mage' ? '#7e22ce' :
      preset === 'skeleton' ? '#e2e8f0' : '#b45309';
    const handColor =
      preset === 'knight' ? '#94a3b8' :
      preset === 'mage' ? '#fcd34d' :
      preset === 'skeleton' ? '#cbd5e1' : '#f59e0b';

    ctx.fillStyle = mainColor;
    ctx.fillRect(4, 4, 10, 16); // Bicep / Forearm
    ctx.fillStyle = handColor;
    ctx.fillRect(3, 20, 12, 8); // Gauntlet / Hand
  }

  private static drawLeg(ctx: CanvasRenderingContext2D, preset: string, isRight: boolean) {
    const legColor = 
      preset === 'knight' ? '#334155' :
      preset === 'mage' ? '#4c1d95' :
      preset === 'skeleton' ? '#cbd5e1' : '#78350f';
    const bootColor =
      preset === 'knight' ? '#0f172a' :
      preset === 'mage' ? '#1e1b4b' :
      preset === 'skeleton' ? '#94a3b8' : '#451a03';

    ctx.fillStyle = legColor;
    ctx.fillRect(3, 4, 10, 16); // Thigh & Shin
    ctx.fillStyle = bootColor;
    ctx.fillRect(2, 18, 12, 8); // Boot
  }
}
