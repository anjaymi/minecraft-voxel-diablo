import JSZip from 'jszip';
import { SpinePuppetConfig, SpineSlotKey } from './spineTypes';

export interface SpinePartSpec {
  key: SpineSlotKey;
  label: string;
  recommendedWidth: number;
  recommendedHeight: number;
  hiResWidth: number;
  hiResHeight: number;
  defaultPivotX: number;
  defaultPivotY: number;
  description: string;
}

export const SPINE_PART_SPECS: Record<SpineSlotKey, SpinePartSpec> = {
  head: {
    key: 'head',
    label: '头部 (Head)',
    recommendedWidth: 44,
    recommendedHeight: 44,
    hiResWidth: 64,
    hiResHeight: 64,
    defaultPivotX: 0.5,
    defaultPivotY: 0.85,
    description: '面容与发饰主层。轴心点位于脖颈连接处(0.5, 0.85)，以消除晃动时的脱节伪影。',
  },
  torso: {
    key: 'torso',
    label: '躯干 (Torso)',
    recommendedWidth: 36,
    recommendedHeight: 42,
    hiResWidth: 48,
    hiResHeight: 56,
    defaultPivotX: 0.5,
    defaultPivotY: 0.5,
    description: '胸甲或服饰主结构。轴心位于重心中心(0.5, 0.5)，承接头部并衔接四肢关节。',
  },
  armRight: {
    key: 'armRight',
    label: '右臂/主手 (Arm Right)',
    recommendedWidth: 18,
    recommendedHeight: 32,
    hiResWidth: 24,
    hiResHeight: 48,
    defaultPivotX: 0.5,
    defaultPivotY: 0.15,
    description: '持握主武器的前侧手臂。轴心位于肩膀关节(0.5, 0.15)，大幅挥击时保持贴合。',
  },
  armLeft: {
    key: 'armLeft',
    label: '左臂/副手 (Arm Left)',
    recommendedWidth: 18,
    recommendedHeight: 32,
    hiResWidth: 24,
    hiResHeight: 48,
    defaultPivotX: 0.5,
    defaultPivotY: 0.15,
    description: '副手防御或法术咏唱臂。轴心位于左肩(0.5, 0.15)，层级置于躯干后侧。',
  },
  legRight: {
    key: 'legRight',
    label: '右腿/前腿 (Leg Right)',
    recommendedWidth: 16,
    recommendedHeight: 32,
    hiResWidth: 20,
    hiResHeight: 40,
    defaultPivotX: 0.5,
    defaultPivotY: 0.1,
    description: '近侧奔跑跨步腿部。轴心位于盆骨髋关节(0.5, 0.10)，负责大跨度运动步态。',
  },
  legLeft: {
    key: 'legLeft',
    label: '左腿/后腿 (Leg Left)',
    recommendedWidth: 16,
    recommendedHeight: 32,
    hiResWidth: 20,
    hiResHeight: 40,
    defaultPivotX: 0.5,
    defaultPivotY: 0.1,
    description: '远侧奔跑蹬地腿部。轴心位于盆骨髋关节(0.5, 0.10)，后侧遮挡防穿帮。',
  },
};

export class SpineSpecExporter {
  public static generateMarkdownGuide(config: SpinePuppetConfig): string {
    const lines = [
      '# Spine 2D 骨骼角色部件规范说明书',
      '',
      `> 方案名称: ${config.name} | 导出时间: ${new Date().toLocaleString()}`,
      '',
      '## 一、 各部件推荐 PNG 尺寸与锚点对照表',
      '',
      '| 部件名称 | 槽位键名 | 标准像素尺寸 | 高清像素尺寸 | 推荐轴心(PivotX, PivotY) | 当前偏移量(OffsetX, OffsetY) |',
      '| :--- | :--- | :--- | :--- | :--- | :--- |',
    ];

    (Object.keys(SPINE_PART_SPECS) as SpineSlotKey[]).forEach((k) => {
      const spec = SPINE_PART_SPECS[k];
      const slot = config.slots[k];
      lines.push(
        `| ${spec.label} | \`${k}\` | **${spec.recommendedWidth}×${spec.recommendedHeight}** px | ${spec.hiResWidth}×${spec.hiResHeight} px | (${spec.defaultPivotX.toFixed(2)}, ${spec.defaultPivotY.toFixed(2)}) | (${slot?.offsetX ?? 0}, ${slot?.offsetY ?? 0}) |`
      );
    });

    lines.push(
      '',
      '## 二、 材质美术制作规范',
      '1. **透明通道 (Alpha Channel)**: 部件必须导出为 32 位带透明通道 PNG 格式 (`PNG-32`)。',
      '2. **边缘裁切要求**: 部件图案必须紧密贴合外框，保留 1~2px 安全透明边距，严禁大面积留白，否则会导致轴心计算偏移产生伪影。',
      '3. **轴心点规范 (Pivot Coordinates)**:',
      '   - 轴心原点位于图片左上角 `(0.0, 0.0)`，中心点为 `(0.5, 0.5)`，右下角为 `(1.0, 1.0)`。',
      '   - 头部推荐轴心在下端颈部 `(0.5, 0.85)`；四肢推荐轴心在顶端关节 `(0.5, 0.10~0.15)`。',
      '4. **关节遮罩与圆弧倒角**: 肢体根部建议设计为微凸圆形，在转动或挥砍时旋转角度超 45° 仍可无缝贴合。',
      '',
      '## 三、 Photoshop (.PSD) 骨骼工程导入规范',
      '1. **图层分组与命名 (Layer / Folder Names)**:',
      '   - 头部: `head` 或 `头部`',
      '   - 躯干: `torso` 或 `body` 或 `躯干`',
      '   - 右臂(主手): `armRight` 或 `右臂`',
      '   - 左臂(副手): `armLeft` 或 `左臂`',
      '   - 右腿(前): `legRight` 或 `右腿`',
      '   - 左腿(后): `legLeft` 或 `左腿`',
      '2. **骨骼点标记层 (Bone Markers)**:',
      '   - 在每个部件组内或全局，创建一个标记图层，命名包含 `bone_[槽位]` 或 `pivot` / `anchor`（如 `bone_head`、`bone_armRight`）。',
      '   - 标记图层中心点将作为该部件与躯干铰接的标准骨骼点坐标，导入器会自动计算 `pivotX/Y` 与相对画布位移。',
      '3. **PS 标尺参考线 (Photoshop Guides)**:',
      '   - 系统支持直接读取 PSD 文件中的垂直中心线与水平颈/肩/髋参考线，辅助自动化姿态对齐。',
      '',
      '## 四、 动作过渡支持 (Cross-fading)',
      '- 引擎内置 0.20 秒 Hermite 平滑插值过渡（$S(t) = 3t^2 - 2t^3$）。',
      '- 规范化制作素材后，在跑动、近战挥砍与奥术施法动作间切换时将保持平滑无突变。'
    );

    return lines.join('\n');
  }

  public static async exportFullPackageZip(config: SpinePuppetConfig): Promise<void> {
    const zip = new JSZip();

    // 1. Add Markdown Specification
    const markdown = this.generateMarkdownGuide(config);
    zip.file('README_Spine部件规范说明.md', markdown);

    // 2. Add JSON Config
    const jsonStr = JSON.stringify(config, null, 2);
    zip.file('spine_puppet_config.json', jsonStr);

    // 3. Add Component PNG Images
    const folder = zip.folder('parts');
    const keys = Object.keys(SPINE_PART_SPECS) as SpineSlotKey[];

    for (const key of keys) {
      const spec = SPINE_PART_SPECS[key];
      const slot = config.slots[key];
      const filename = `${key}_${spec.recommendedWidth}x${spec.recommendedHeight}.png`;

      if (slot && slot.dataUrl && slot.dataUrl.startsWith('data:image/')) {
        const base64Data = slot.dataUrl.split(',')[1];
        if (folder) folder.file(filename, base64Data, { base64: true });
      } else {
        // Generate template canvas placeholder PNG
        const base64Data = this.createPartTemplateBase64(spec);
        if (folder) folder.file(filename, base64Data, { base64: true });
      }
    }

    // 4. Generate Blob and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(content, `Spine_${config.name || 'Character'}_部件全套导出包.zip`);
  }

  public static exportMarkdownFile(config: SpinePuppetConfig): void {
    const md = this.generateMarkdownGuide(config);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    this.downloadBlob(blob, `Spine_${config.name || 'Puppet'}_部件制作规范.md`);
  }

  public static exportJsonConfig(config: SpinePuppetConfig): void {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    this.downloadBlob(blob, `spine_puppet_${config.name || 'config'}.json`);
  }

  private static createPartTemplateBase64(spec: SpinePartSpec): string {
    const canvas = document.createElement('canvas');
    canvas.width = spec.recommendedWidth;
    canvas.height = spec.recommendedHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw checkered transparent indicator
    ctx.fillStyle = 'rgba(75, 85, 99, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bounding Box
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

    // Pivot Marker
    const px = canvas.width * spec.defaultPivotX;
    const py = canvas.height * spec.defaultPivotY;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(px - 4, py);
    ctx.lineTo(px + 4, py);
    ctx.moveTo(px, py - 4);
    ctx.lineTo(px, py + 4);
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.split(',')[1] || '';
  }

  private static downloadBlob(blob: Blob, filename: string): void {
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
