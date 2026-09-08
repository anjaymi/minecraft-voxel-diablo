import { writePsdUint8Array } from 'ag-psd';
import { SpineSlotKey } from '../spineTypes';
import {
  ChibiProportionType,
  ChibiStandardProfile,
  ChibiPartSpec,
  CHIBI_PROFILES,
} from './ChibiProportionStandards';

export class ChibiPsdTemplateBuilder {
  /**
   * Procedurally generate high-quality placeholder canvas for a body part
   */
  private static createPartCanvas(
    part: ChibiPartSpec,
    profile: ChibiStandardProfile
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = part.width;
    canvas.height = part.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const w = part.width;
    const h = part.height;
    const is2_0 = profile.id === '2.0_head';

    ctx.save();
    if (part.slot === 'head') {
      // 1. Chibi Porcelain Peach Face Contour
      ctx.fillStyle = '#fde2d7';
      ctx.beginPath();
      if (is2_0) {
        // Rounder, extra chubby cheeks for 2.0-head
        ctx.roundRect(4, 4, w - 8, h - 8, [w * 0.45, w * 0.45, w * 0.38, w * 0.38]);
      } else {
        // More sculpted chin for 2.5-head
        ctx.roundRect(4, 4, w - 8, h - 8, [w * 0.40, w * 0.40, w * 0.30, w * 0.30]);
      }
      ctx.fill();

      // Border & Subsurface warmth
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cute Blush cheeks
      ctx.fillStyle = 'rgba(251, 113, 133, 0.4)';
      ctx.beginPath();
      ctx.ellipse(w * 0.22, h * 0.65, w * 0.12, h * 0.08, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.78, h * 0.65, w * 0.12, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anime Eye Positioning guides
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(w * 0.30, h * 0.52, w * 0.07, h * 0.10, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.70, h * 0.52, w * 0.07, h * 0.10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (part.slot === 'torso') {
      // 2. Chibi Adventurer Tunic & Armor
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.roundRect(4, 4, w - 8, h - 8, [w * 0.2, w * 0.2, w * 0.28, w * 0.28]);
      ctx.fill();

      // Collar
      ctx.fillStyle = '#fde2d7';
      ctx.beginPath();
      ctx.moveTo(w * 0.35, 4);
      ctx.lineTo(w * 0.50, h * 0.25);
      ctx.lineTo(w * 0.65, 4);
      ctx.closePath();
      ctx.fill();

      // Adventurer Belt & Buckle
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, h * 0.68, w - 8, h * 0.16);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(w * 0.40, h * 0.65, w * 0.20, h * 0.22);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(w * 0.45, h * 0.70, w * 0.10, h * 0.12);
    } else if (part.slot === 'armRight' || part.slot === 'armLeft') {
      // 3. Chibi Ball-joint Arm & Mitten Hand
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.roundRect(4, 4, w - 8, h * 0.60, w * 0.35);
      ctx.fill();

      // Peach Hand
      ctx.fillStyle = '#fde2d7';
      ctx.beginPath();
      ctx.arc(w * 0.50, h * 0.78, w * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // 4. Chibi Stubby Leg & Glossy Boot
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(4, 4, w - 8, h * 0.55, w * 0.28);
      ctx.fill();

      // Boot
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.roundRect(2, h * 0.45, w - 4, h * 0.50, [w * 0.2, w * 0.2, w * 0.3, w * 0.3]);
      ctx.fill();

      // Boot Trim & Highlight
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(w * 0.25, h * 0.55, w * 0.2, h * 0.25);
      ctx.globalAlpha = 1.0;
    }

    // Label Text
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(part.slot, w / 2, h * 0.42);
    ctx.fillText(part.slot, w / 2, h * 0.42);

    ctx.restore();
    return canvas;
  }

  /**
   * Create standard crosshair marker canvas for anatomical joints
   */
  private static createBoneMarkerCanvas(label: string = 'bone'): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crosshair lines
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(8, 14);
    ctx.moveTo(2, 8);
    ctx.lineTo(14, 8);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    return canvas;
  }

  /**
   * Generate Adobe Photoshop (.PSD) binary Blob for a specific chibi proportion
   */
  public static generatePsdBlob(proportionType: ChibiProportionType = '2.5_head'): Blob {
    const profile = CHIBI_PROFILES[proportionType];
    const canvasSize = profile.canvasSize;
    const children: any[] = [];

    const slotKeys: SpineSlotKey[] = ['head', 'torso', 'armRight', 'armLeft', 'legRight', 'legLeft'];

    for (const key of slotKeys) {
      const part = profile.parts[key];
      const spriteCanvas = this.createPartCanvas(part, profile);
      const markerCanvas = this.createBoneMarkerCanvas(key);

      children.push({
        name: part.folderName,
        opened: true,
        children: [
          {
            name: `bone_${part.slot}`,
            canvas: markerCanvas,
            left: Math.round(part.boneX - 8),
            top: Math.round(part.boneY - 8),
            right: Math.round(part.boneX + 8),
            bottom: Math.round(part.boneY + 8),
          },
          {
            name: part.name,
            canvas: spriteCanvas,
            left: Math.round(part.left),
            top: Math.round(part.top),
            right: Math.round(part.left + part.width),
            bottom: Math.round(part.top + part.height),
          },
        ],
      });
    }

    // Handheld Weapon Socket Group (Anchored onto Right Hand Palm Center)
    const rightArm = profile.parts.armRight;
    const weaponGripX = Math.round(rightArm.left + rightArm.width * 0.50);
    const weaponGripY = Math.round(rightArm.top + rightArm.height * 0.78);
    const weaponMarkerCanvas = this.createBoneMarkerCanvas('weapon');

    children.push({
      name: 'weapon_socket',
      opened: false,
      children: [
        {
          name: 'bone_weapon',
          canvas: weaponMarkerCanvas,
          left: Math.round(weaponGripX - 8),
          top: Math.round(weaponGripY - 8),
          right: Math.round(weaponGripX + 8),
          bottom: Math.round(weaponGripY + 8),
        },
      ],
    });

    const psdData = {
      width: canvasSize,
      height: canvasSize,
      children,
      guides: profile.guides.map((g) => ({
        location: g.location,
        direction: g.direction,
      })),
    };

    const uint8Array = writePsdUint8Array(psdData as any);
    return new Blob([uint8Array], { type: 'image/vnd.adobe.photoshop' });
  }

  /**
   * Trigger browser file download of the PSD template
   */
  public static downloadTemplate(
    proportionType: ChibiProportionType = '2.5_head',
    customFilename?: string
  ): void {
    const defaultName =
      proportionType === '2.0_head'
        ? 'chibi_2.0_head_nendoroid_template.psd'
        : 'chibi_2.5_head_goodsmile_template.psd';

    const filename = customFilename || defaultName;
    const blob = this.generatePsdBlob(proportionType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
