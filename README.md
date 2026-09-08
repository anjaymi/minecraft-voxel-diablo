# 方块暗黑破坏神 (Minecraft Voxel Diablo)

2.5D 等距视角的 Minecraft 风格动作肉鸽游戏：暗黑破坏神式砍杀、战利品掉落、
100+ 怪物图鉴、六大生态区、巨型世界首领、城塞前哨与程序化地牢。

## 本地开发

```bash
npm install
npx vite --port=3456
```

## 打包

```bash
npx vite build   # 产出 dist/（已配置相对路径 base，可直接托管到任意子路径）
```

## 在线游玩（GitHub Pages 部署）

push 到 main 自动发布：

👉 https://anjaymi.github.io/minecraft-voxel-diablo/

首次部署步骤：

1. 在 GitHub 新建仓库，把本项目推上去（`dist/` 无需提交，workflow 会自动构建）。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 之后每次 push 到 `main`，`.github/workflows/deploy.yml` 自动构建并发布。

## 操作

- 鼠标左键移动 / 攻击，右键技能
- `E` 交互（NPC / 宝箱 / 传送门）
- `B` / `I` 背包，`Q` 喝药水，`1-4` 技能
- 设置面板可开 GPU 加速与地形分块缓存
