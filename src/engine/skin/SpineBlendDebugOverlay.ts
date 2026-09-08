import { Player } from '../../types';
import { SpineKinematics } from './SpineKinematics';
import { SpineActionType } from './spineTypes';
import { SpineBlendTransitionSample } from './SpineAnimationBlender';

interface DebugButton {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  from: SpineActionType;
  to: SpineActionType;
}

/**
 * SpineBlendDebugOverlay:
 * Renders real-time interpolation waveforms and 0.2s cross-fading curves
 * across bone nodes (head, torso, arms, legs) inside GameRenderer.
 */
export class SpineBlendDebugOverlay {
  public static isVisible: boolean = false;
  private static buttons: DebugButton[] = [];
  private static panelBounds = { x: 0, y: 0, w: 370, h: 265 };

  public static toggle(): boolean {
    this.isVisible = !this.isVisible;
    return this.isVisible;
  }

  public static handleClick(screenX: number, screenY: number, player: Player): boolean {
    if (!this.isVisible) return false;

    for (const btn of this.buttons) {
      if (
        screenX >= btn.x &&
        screenX <= btn.x + btn.w &&
        screenY >= btn.y &&
        screenY <= btn.y + btn.h
      ) {
        const blender = SpineKinematics.getOrCreatePlayerBlender(player);
        // Force test state transition
        blender.resetTo(btn.from, 0.2);
        blender.switchAction(btn.to, 0.2);
        return true;
      }
    }

    // Clicked inside panel area
    const p = this.panelBounds;
    if (screenX >= p.x && screenX <= p.x + p.w && screenY >= p.y && screenY <= p.y + p.h) {
      return true;
    }
    return false;
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.isVisible) return;

    const blender = SpineKinematics.getOrCreatePlayerBlender(player);
    const debug = blender.getDebugState();

    const w = 370;
    const h = 265;
    const x = Math.max(16, canvasWidth - w - 20);
    const y = Math.min(canvasHeight - h - 20, 75);
    this.panelBounds = { x, y, w, h };

    ctx.save();

    // 1. Panel Background & Frame
    ctx.fillStyle = 'rgba(12, 16, 28, 0.94)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // 2. Title & Status Header
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px "Cinzel", "Press Start 2P", monospace';
    ctx.fillText('SPINE CROSS-FADING OSCILLOSCOPE', x + 14, y + 20);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('0.20s Hermite S(t)=3t²-2t³ Transition', x + 14, y + 34);

    // State Pills
    this.drawActionPill(ctx, x + 230, y + 10, debug.fromAction, '#64748b');
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('➔', x + 295, y + 24);
    this.drawActionPill(ctx, x + 308, y + 10, debug.toAction, '#38bdf8');

    // 3. Progress Bar (0.00s -> 0.20s)
    const barX = x + 14;
    const barY = y + 42;
    const barW = w - 28;
    const barH = 10;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    const fillW = Math.max(0, Math.min(barW, barW * debug.progress));
    const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(
      `${(debug.elapsedTime).toFixed(3)}s / ${(debug.duration).toFixed(2)}s  (${(debug.progress * 100).toFixed(0)}%)`,
      barX + 6,
      barY + 8
    );

    // 4. Oscilloscope Waveform Grid
    const graphX = x + 14;
    const graphY = y + 60;
    const graphW = w - 28;
    const graphH = 125;

    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(graphX, graphY, graphW, graphH, 6);
    ctx.fill();
    ctx.stroke();

    // Zero Mid-Line
    const midY = graphY + graphH / 2;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(graphX, midY);
    ctx.lineTo(graphX + graphW, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot Bone Curves
    const samples = debug.curveSamples;
    if (samples.length > 1) {
      this.drawChannelCurve(ctx, samples, graphX, graphY, graphW, graphH, (s) => s.headAngleDeg, '#f59e0b', 45);
      this.drawChannelCurve(ctx, samples, graphX, graphY, graphW, graphH, (s) => s.torsoAngleDeg, '#38bdf8', 45);
      this.drawChannelCurve(ctx, samples, graphX, graphY, graphW, graphH, (s) => s.armRightAngleDeg, '#10b981', 65);
      this.drawChannelCurve(ctx, samples, graphX, graphY, graphW, graphH, (s) => s.legRightAngleDeg, '#c084fc', 65);
    }

    // Live Playhead Cursor
    const cursorX = graphX + graphW * debug.progress;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cursorX, graphY);
    ctx.lineTo(cursorX, graphY + graphH);
    ctx.stroke();

    // 5. Channel Legends & Live Values
    const curPose = debug.currentPose;
    const hDeg = (curPose.head.rotation * 180 / Math.PI).toFixed(1);
    const tDeg = (curPose.torso.rotation * 180 / Math.PI).toFixed(1);
    const aDeg = (curPose.armRight.rotation * 180 / Math.PI).toFixed(1);
    const lDeg = (curPose.legRight.rotation * 180 / Math.PI).toFixed(1);

    ctx.font = 'bold 9px monospace';
    this.drawLegendItem(ctx, x + 14, y + 198, '● 头部(Head):', `${hDeg}°`, '#f59e0b');
    this.drawLegendItem(ctx, x + 105, y + 198, '● 躯干(Torso):', `${tDeg}°`, '#38bdf8');
    this.drawLegendItem(ctx, x + 195, y + 198, '● 手臂(Arm):', `${aDeg}°`, '#10b981');
    this.drawLegendItem(ctx, x + 285, y + 198, '● 腿部(Leg):', `${lDeg}°`, '#c084fc');

    // 6. Interactive Transition Buttons
    this.renderButtons(ctx, x + 14, y + 220, w - 28);

    ctx.restore();
  }

  private static drawChannelCurve(
    ctx: CanvasRenderingContext2D,
    samples: SpineBlendTransitionSample[],
    gx: number,
    gy: number,
    gw: number,
    gh: number,
    valueGetter: (s: SpineBlendTransitionSample) => number,
    color: string,
    maxDeg: number
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    const midY = gy + gh / 2;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const px = gx + gw * s.progress;
      const val = valueGetter(s);
      const clamped = Math.max(-maxDeg, Math.min(maxDeg, val));
      const py = midY - (clamped / maxDeg) * (gh * 0.44);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  private static drawActionPill(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    action: SpineActionType,
    color: string
  ): void {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, 54, 18, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(action.toUpperCase(), x + 27, y + 12);
    ctx.textAlign = 'left';
  }

  private static drawLegendItem(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    val: string,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(val, x + 56, y);
  }

  private static renderButtons(ctx: CanvasRenderingContext2D, bx: number, by: number, totalW: number): void {
    const btnW = (totalW - 16) / 3;
    const btnH = 26;

    const defs: { label: string; from: SpineActionType; to: SpineActionType }[] = [
      { label: '🏃➔⚔️ 跑动/挥砍', from: 'run', to: 'slash' },
      { label: '🏃➔✨ 跑动/施法', from: 'run', to: 'cast' },
      { label: '⚔️➔🧘 挥砍/待机', from: 'slash', to: 'idle' },
    ];

    this.buttons = [];
    defs.forEach((def, i) => {
      const x = bx + i * (btnW + 8);
      const y = by;
      this.buttons.push({ x, y, w: btnW, h: btnH, ...def });

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, btnW, btnH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def.label, x + btnW / 2, y + 16);
      ctx.textAlign = 'left';
    });
  }
}
