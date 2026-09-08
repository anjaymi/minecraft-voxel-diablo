import { CHIBI_2_0_PROFILE, CHIBI_2_5_PROFILE, ChibiStandardProfile } from './ChibiProportionStandards';

export class ChibiPsdSpecMarkdown {
  /**
   * Generate complete Markdown technical guide for 2.0 & 2.5 head standards
   */
  public static generateSpecMarkdown(): string {
    const p20 = CHIBI_2_0_PROFILE;
    const p25 = CHIBI_2_5_PROFILE;

    return `# 2.0 头身 & 2.5 头身 Q版手办骨骼 PSD 制作标准手册

## 一、 比例流派与设计定位

| 标准方案 | 头身比 | 视觉风格 | 头部占比 | 躯干占比 | 腿部占比 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2.0 头身 (游戏实装原生)** | 1.15 : 1 | 完美契合当前游戏：萌系大包子脸、短小肉感肚腩与圆萌短靴 | 54% | 23% | 23% | 当前游戏实装手办主角、萌系骑士、武器挥砍动作无穿模 |
| **2.5 头身 (GoodSmile)** | 1 : 1.5 | 手办级微Q版、二次元精致开脸、修长动感挥砍姿势 | 40% | 30% | 30% | 进阶动作手办、近战跳劈斩、修长高挑战铠 |

---

## 二、 画布与参考线标尺系统 (Photoshop Guides)

标准推荐画布尺寸为 **512 × 512 像素** (72 DPI，透明背景 RGB/8)。

### 1. 2.0 头身核心基准参考线 (游戏实装原生)
- **垂直中轴**: \`X = 256px\` (角色左右对称中心)
- **头顶发冠线**: \`Y = 90px\`
- **萌系大眼瞳中位线**: \`Y = 176px\`
- **下颌颈部连接线**: \`Y = 256px\`
- **肩部肉拳关节轴线**: \`Y = 266px\`
- **肚腹与短腿骨盆轴线**: \`Y = 328px\`
- **短靴稳健着地线**: \`Y = 392px\`

### 2. 2.5 头身核心基准参考线 (手办级黄金比例)
- **垂直中轴**: \`X = 256px\` (角色左右对称对称中心)
- **头顶发冠线**: \`Y = 60px\`
- **双眼视线水平面**: \`Y = 140px\`
- **下颏与颈部骨骼点**: \`Y = 204px\`
- **双肩铰接水平线**: \`Y = 224px\`
- **腰带金扣中线**: \`Y = 268px\`
- **大腿根部与骨盆水平线**: \`Y = 308px\`
- **膝关节高度**: \`Y = 360px\`
- **战靴接地踏平面**: \`Y = 418px\`

---

## 三、 PSD 图层结构与命名规范 (严禁重名)

PSD 内必须使用图层组（Group / Folder）包裹对应的部件与骨骼标记点：

\`\`\`text
root (512x512)
├── head/
│   ├── bone_head          [骨骼点：红白十字圆环标记层]
│   └── head_sprite        [图案层：头部与发型，留1~2px透明边缘]
├── torso/
│   ├── bone_torso         [骨骼点：胸腔/腹部旋转中心]
│   └── torso_sprite       [图案层：上身盔甲、内衬、腰带]
├── armRight/ (主手/握剑手)
│   ├── bone_armRight      [骨骼点：右肩球关节插槽]
│   └── armRight_sprite    [图案层：右大臂、小臂与握拳]
├── armLeft/ (副手/施法手)
│   ├── bone_armLeft       [骨骼点：左肩球关节插槽]
│   └── armLeft_sprite     [图案层：左大臂、小臂与手掌]
├── legRight/ (前侧腿)
│   ├── bone_legRight      [骨骼点：右侧大腿根部转轴]
│   └── legRight_sprite    [图案层：右大腿与战靴]
├── legLeft/ (后侧腿)
│   ├── bone_legLeft       [骨骼点：左侧大腿根部转轴]
│   └── legLeft_sprite     [图案层：左大腿与战靴]
└── weapon_socket/ (可选)
    └── bone_weapon        [骨骼点：主手手心武器卡槽点]
\`\`\`

---

## 四、 各部件推荐尺寸与轴心点坐标表

### 2.0 头身部件参数表
| 部件图层 | 推荐宽度 | 推荐高度 | 轴心 Pivot X | 轴心 Pivot Y | 关节连接说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **head** | 192 px | 176 px | 0.50 | 0.88 | 颈部下方中央，微低头摆头转轴 |
| **torso** | 100 px | 94 px | 0.50 | 0.48 | 腹心位置，身体浮动中心 |
| **armRight** | 48 px | 76 px | 0.25 | 0.16 | 肩部球关节点，向外自然下垂 |
| **armLeft** | 48 px | 76 px | 0.75 | 0.16 | 肩部球关节点，向外自然下垂 |
| **legRight** | 44 px | 86 px | 0.45 | 0.12 | 髋部转轴，钟摆摆动根部 |
| **legLeft** | 44 px | 86 px | 0.55 | 0.12 | 髋部转轴，钟摆摆动根部 |

### 2.5 头身部件参数表
| 部件图层 | 推荐宽度 | 推荐高度 | 轴心 Pivot X | 轴心 Pivot Y | 关节连接说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **head** | 160 px | 148 px | 0.50 | 0.86 | 精致二次元下颌，贴合领口阴影 |
| **torso** | 104 px | 110 px | 0.50 | 0.47 | 战铠胸膛重心，支持连招俯身倾斜 |
| **armRight** | 52 px | 98 px | 0.35 | 0.16 | 手腕预留持握武器插座 |
| **armLeft** | 52 px | 98 px | 0.65 | 0.16 | 手掌支持副手盾牌/法球挂载 |
| **legRight** | 46 px | 118 px | 0.48 | 0.08 | 大腿根至战靴，支持跨步飞踢 |
| **legLeft** | 46 px | 118 px | 0.52 | 0.08 | 大腿根至战靴，支撑站立平衡 |

---

## 五、 制作与导出黄金准则 (防穿模要点)

1. **关节球形倒角 (Ball-Joint Convexity)**:
   - 四肢（肩部、髋部）在旋转连接端建议设计为**向外微凸的圆弧形**，即便做 ±45° 大幅度挥砍摆动，也绝不会露出断层黑缝。
2. **边缘裁切与透明边距 (Alpha Trimming)**:
   - 部件图案边界需紧密贴合外框，建议仅留 **1~2 像素** 安全透明边距。严禁留有大范围透明空白，避免系统计算轴心产生伪漂移。
3. **武器持握避脸原则 (Weapon Clearance)**:
   - 待机时主手武器斜向后下方（约 135°~150° 夹角），剑尖避开角色脸颊与大头轮廓。
`;
  }

  public static downloadSpecMarkdown(): void {
    const text = this.generateSpecMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CHIBI_2.0_2.5_PSD_STANDARD_SPEC.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
