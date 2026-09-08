import React, { useRef, useEffect } from 'react';
import { DungeonFloor, Player, Enemy } from '../types';
import { AdventurerEntity } from '../engine/adventurers/AdventurerActor';
import { Map, Maximize2, Minimize2 } from 'lucide-react';

interface MiniMapProps {
  floor: DungeonFloor;
  player: Player;
  enemies: Enemy[];
  adventurers?: AdventurerEntity[];
}

/** 环境地形雷达配色（户外与新增装饰瓦片） */
const MINI_MAP_TILE_COLORS: Record<string, string> = {
  water: '#1d4ed8',
  puddle: '#2563eb',
  bridge: '#a16207',
  road: '#57534e',
  grass: '#166534',
  tall_grass: '#22c55e',
  flower_patch: '#86efac',
  tree: '#14532d',
  bush: '#15803d',
  pebble: '#78716c',
  mushroom: '#a855f7',
  building: '#7f1d1d',
  tower: '#94a3b8',
  well: '#64748b',
  town_wall: '#475569',
  town_gate: '#059669',
  dungeon_gate: '#7e22ce',
  barrel: '#b45309',
  urn: '#92400e',
  spawner: '#dc2626',
  wall: '#3f3f46',
  snow: '#dbe3ee',
  ice: '#a5d8f3',
  sand: '#d4b483',
  scorched: '#2b2320',
  murkwater: '#3f5a34',
  cactus: '#3f8f4f',
  giant_mushroom: '#a855f7',
  dead_tree: '#4a4038',
  biome_gate: '#a855f7',
  keep_gate: '#38bdf8',
  door: '#f59e0b',
  lantern: '#fde047',
  fountain: '#38bdf8',
  vines: '#4d7c0f',
  pillar: '#71717a',
  bone_pile: '#d6d3d1',
};

export const MiniMap: React.FC<MiniMapProps> = ({ floor, player, enemies, adventurers = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const scaleX = w / floor.width;
    const scaleY = h / floor.height;

    // Draw floor tiles
    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const tile = floor.tiles[y][x];
        const decorColor = MINI_MAP_TILE_COLORS[tile];
        if (decorColor) {
          ctx.fillStyle = decorColor;
          ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
        } else if (tile === 'floor') {
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
        } else if (tile === 'chest') {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(x * scaleX, y * scaleY, scaleX * 1.4, scaleY * 1.4);
        } else if (tile === 'exit_portal') {
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(x * scaleX, y * scaleY, scaleX * 2, scaleY * 2);
        } else if (tile === 'shrine') {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x * scaleX, y * scaleY, scaleX * 1.5, scaleY * 1.5);
        } else if (tile === 'lava') {
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
        }
      }
    }

    // Draw enemies
    ctx.fillStyle = '#ef4444';
    for (const enemy of enemies) {
      if (enemy.isBoss) {
        // 巨型首领：大号紫色脉冲圆（一眼锁定位置）
        const pulse = 2.5 + Math.sin(performance.now() / 200) * 1.2;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(enemy.x * scaleX, enemy.y * scaleY, 4 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0abfc';
        ctx.beginPath();
        ctx.arc(enemy.x * scaleX, enemy.y * scaleY, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.isElite) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(enemy.x * scaleX - 1.5, enemy.y * scaleY - 1.5, 4, 4);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemy.x * scaleX - 1, enemy.y * scaleY - 1, 3, 3);
      }
    }

    // Draw 野外冒险者（青色菱形：友方求救为橙闪）
    for (const adv of adventurers) {
      const isRescue = adv.state === 'rescue';
      ctx.fillStyle = isRescue ? '#fb923c' : '#22d3ee';
      const ax = adv.actor.x * scaleX;
      const ay = adv.actor.y * scaleY;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 3);
      ctx.lineTo(ax + 3, ay);
      ctx.lineTo(ax, ay + 3);
      ctx.lineTo(ax - 3, ay);
      ctx.closePath();
      ctx.fill();
    }

    // Draw Player
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(player.x * scaleX, player.y * scaleY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [floor, player.x, player.y, enemies, isExpanded]);

  return (
    <div
      id="minimap-container"
      className="pointer-events-auto relative flex flex-col items-end"
    >
      <div className="relative rounded-lg border-2 border-stone-700 bg-stone-950/85 p-1.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-1 px-1 text-[10px] text-stone-400 font-mono">
          <div className="flex items-center gap-1">
            <Map className="h-3 w-3 text-amber-400" />
            <span>地牢雷达</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-stone-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={isExpanded ? 240 : 130}
          height={isExpanded ? 240 : 130}
          className="rounded border border-stone-800 bg-stone-900"
        />
        <div className="flex justify-between text-[8px] font-mono text-stone-400 px-1 pt-1">
          <span className="text-emerald-400">● 玩家</span>
          <span className="text-red-400">● 怪物</span>
          <span className="text-purple-400">● 传送门</span>
          <span className="text-amber-400">● 宝箱</span>
        </div>
      </div>
    </div>
  );
};
