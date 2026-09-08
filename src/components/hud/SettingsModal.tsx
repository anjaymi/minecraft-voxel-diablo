import React, { useState, useEffect, useRef } from 'react';
import { perfManager, tileChunkCache, gpuAcceleration, GpuMode } from '../../engine/perf/exports';
import {
  X, Volume2, VolumeX, Crosshair, Activity, Compass,
  HelpCircle, ZoomIn, Settings as SettingsIcon, Keyboard, Palette, Swords, Focus,
  Save, FolderOpen, Download, Upload,
} from 'lucide-react';
import { gameViewportManager, ZOOM_PRESETS } from '../../engine/camera/GameViewportManager';

interface SettingsModalProps {
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  bgmVolume: number;
  onBgmVolume: (v: number) => void;
  onOpenGuide: () => void;
  showHitboxes: boolean;
  onToggleHitboxes: () => void;
  showBlendDebug: boolean;
  onToggleBlendDebug: () => void;
  onToggleOrientation: () => void;
  onOpenSkinModal?: () => void;
  onOpenAttackMotionModal?: () => void;
  onOpenWeaponModal?: () => void;
  onSaveGame?: () => string;
  onLoadGame?: () => string;
  onExportSave?: () => string;
  onImportSave?: (file: File) => Promise<string>;
}

/** 设置行：左标签说明 + 右控件 */
const SettingRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}> = ({ icon, title, desc, children }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-stone-900/60 px-3 py-2.5">
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="text-stone-400">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-bold text-stone-200">{title}</div>
        <div className="text-[10px] text-stone-500 truncate">{desc}</div>
      </div>
    </div>
    {children}
  </div>
);

const TogglePill: React.FC<{ on: boolean; onClick: () => void; onText: string; offText: string }> = ({
  on, onClick, onText, offText,
}) => (
  <button
    onClick={onClick}
    className={`relative h-6 w-14 shrink-0 rounded-full border transition-colors ${
      on ? 'border-emerald-500/60 bg-emerald-900/60' : 'border-stone-700 bg-stone-800'
    }`}
  >
    <span
      className={`absolute top-0.5 h-4.5 w-6 rounded text-[9px] font-bold leading-[18px] transition-all ${
        on ? 'left-7 bg-emerald-500 text-stone-950' : 'left-0.5 bg-stone-600 text-stone-300'
      }`}
    >
      {on ? onText : offText}
    </span>
  </button>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-1.5 pt-1">
    <SettingsIcon className="h-3 w-3 text-amber-500" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{children}</span>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  soundEnabled,
  onToggleSound,
  bgmVolume,
  onBgmVolume,
  onOpenGuide,
  showHitboxes,
  onToggleHitboxes,
  showBlendDebug,
  onToggleBlendDebug,
  onToggleOrientation,
  onOpenSkinModal,
  onOpenAttackMotionModal,
  onOpenWeaponModal,
  onSaveGame,
  onLoadGame,
  onExportSave,
  onImportSave,
}) => {
  const [saveMsg, setSaveMsg] = useState('');
  const [fps, setFps] = useState(60);
  const [chunkCacheOn, setChunkCacheOn] = useState(tileChunkCache.isEnabled());
  const [gpuMode, setGpuMode] = useState<GpuMode>(gpuAcceleration.getMode());
  const [gpuNeedReload, setGpuNeedReload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // FPS 实时采样（每 0.5s 刷新显示）
  useEffect(() => {
    const t = setInterval(() => setFps(perfManager.getFps()), 500);
    return () => clearInterval(t);
  }, []);
  const runAction = (fn: (() => string) | undefined) => {
    if (!fn) return;
    setSaveMsg(fn());
  };
  /** 打开外部工坊弹窗（先收起设置面板） */
  const openWorkshop = (fn?: () => void) => {
    onClose();
    fn?.();
  };
  const [zoom, setZoom] = useState<number>(gameViewportManager.getZoom());

  useEffect(() => gameViewportManager.subscribe(setZoom), []);
  const currentZoomLabel =
    ZOOM_PRESETS.find((p) => Math.abs(p.value - zoom) < 0.05)?.label || `${Math.round(zoom * 100)}%`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-2 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border-2 border-stone-700 bg-stone-900 text-stone-100 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10">
              <SettingsIcon className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-base font-bold text-amber-300">设置 (Settings)</h2>
            <span
              className={`ml-2 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                fps >= 50 ? 'bg-emerald-900/60 text-emerald-300' : fps >= 30 ? 'bg-amber-900/60 text-amber-300' : 'bg-red-900/60 text-red-300'
              }`}
            >
              {fps} FPS{perfManager.isLowQuality() ? ' · 省电模式' : ''}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 overflow-y-auto p-4">
          <SectionTitle>性能</SectionTitle>
          <SettingRow
            icon={<Activity className={`h-4 w-4 ${perfManager.isLowQuality() ? 'text-red-400' : 'text-emerald-400'}`} />}
            title="地形分块缓存（GPU 加速）"
            desc="静态地形预渲染为离屏位图，帧数提升显著"
          >
            <TogglePill
              on={chunkCacheOn}
              onClick={() => {
                const next = !chunkCacheOn;
                tileChunkCache.setEnabled(next);
                setChunkCacheOn(next);
              }}
              onText="开"
              offText="关"
            />
          </SettingRow>
          <SettingRow
            icon={<Activity className={`h-4 w-4 ${gpuMode !== 'off' ? 'text-emerald-400' : 'text-stone-600'}`} />}
            title="主画布 GPU 加速"
            desc={
              gpuMode === 'off'
                ? '关闭后画布回到 CPU 混合路径'
                : gpuAcceleration.getStats().desynchronized
                ? '不透明画布 + 低延迟呈现已生效'
                : '不透明画布 + 合成层提升（低延迟呈现由浏览器决定）'
            }
          >
            <div className="flex items-center gap-2">
              {gpuNeedReload && gpuMode !== 'off' && (
                <span className="text-[10px] text-amber-400">刷新后完全生效</span>
              )}
              <TogglePill
                on={gpuMode !== 'off'}
                onClick={() => {
                  const next: GpuMode = gpuMode === 'off' ? 'auto' : 'off';
                  gpuAcceleration.setMode(next);
                  setGpuMode(next);
                  setGpuNeedReload(true);
                }}
                onText="开"
                offText="关"
              />
            </div>
          </SettingRow>

          <SectionTitle>音频</SectionTitle>
          <SettingRow
            icon={soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4 text-stone-600" />}
            title="音效"
            desc="全部音效、环境音与战斗音乐"
          >
            <TogglePill on={soundEnabled} onClick={onToggleSound} onText="开" offText="关" />
          </SettingRow>
          <SettingRow
            icon={<Volume2 className="h-4 w-4 text-amber-400" />}
            title="背景音乐音量"
            desc="程序化 BGM 音量 · 随区域与战斗自动变奏"
          >
            <input
              type="range"
              min={0}
              max={100}
              value={bgmVolume}
              onChange={(e) => onBgmVolume(Number(e.target.value))}
              className="h-1.5 w-28 cursor-pointer accent-amber-500"
              aria-label="背景音乐音量"
            />
          </SettingRow>

          <SectionTitle>显示</SectionTitle>
          <SettingRow
            icon={<ZoomIn className="h-4 w-4 text-cyan-400" />}
            title="视口缩放"
            desc={`当前 ${currentZoomLabel} · 场景与怪物比例`}
          >
            <div className="flex gap-1">
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => gameViewportManager.setZoom(preset.value)}
                  title={preset.desc}
                  className={`rounded px-1.5 py-1 text-[10px] font-mono font-bold transition-colors ${
                    Math.abs(preset.value - zoom) < 0.05
                      ? 'bg-cyan-900/70 text-cyan-300 border border-cyan-500/50'
                      : 'text-stone-400 bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SectionTitle>操作辅助</SectionTitle>
          <SettingRow
            icon={<HelpCircle className="h-4 w-4 text-sky-400" />}
            title="操作指南"
            desc="键位、战斗与系统说明"
          >
            <button
              onClick={() => {
                onClose();
                onOpenGuide();
              }}
              className="shrink-0 rounded border border-sky-500/50 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/20"
            >
              打开
            </button>
          </SettingRow>

          <SectionTitle>存档</SectionTitle>
          <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-2.5 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: '保存游戏', icon: <Save className="h-3.5 w-3.5" />, fn: onSaveGame },
                { label: '读取游戏', icon: <FolderOpen className="h-3.5 w-3.5" />, fn: onLoadGame },
                { label: '导出存档', icon: <Download className="h-3.5 w-3.5" />, fn: onExportSave },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => runAction(b.fn)}
                  className="flex items-center justify-center gap-1.5 rounded border border-stone-700 bg-stone-800 px-2 py-1.5 text-[11px] font-bold text-stone-200 hover:border-amber-500/60 hover:text-amber-300 transition-colors"
                >
                  {b.icon}
                  {b.label}
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 rounded border border-stone-700 bg-stone-800 px-2 py-1.5 text-[11px] font-bold text-stone-200 hover:border-amber-500/60 hover:text-amber-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                导入存档
              </button>
            </div>
            {saveMsg && (
              <div className="rounded bg-stone-950/80 px-2 py-1 text-[10px] font-bold text-emerald-300">{saveMsg}</div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onImportSave) {
                  onImportSave(file).then(setSaveMsg).catch((err) => setSaveMsg(String(err)));
                }
                e.target.value = '';
              }}
            />
          </div>

          <SectionTitle>外观与调校</SectionTitle>
          {onOpenSkinModal && (
            <SettingRow
              icon={<Palette className="h-4 w-4 text-amber-400" />}
              title="换肤工坊"
              desc="自定义角色外观与 PNG 换肤（P）"
            >
              <button
                onClick={() => openWorkshop(onOpenSkinModal)}
                className="shrink-0 rounded border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
              >
                打开
              </button>
            </SettingRow>
          )}
          {onOpenAttackMotionModal && (
            <SettingRow
              icon={<Swords className="h-4 w-4 text-red-400" />}
              title="动效调校"
              desc="攻击动效与关键帧补间（V）"
            >
              <button
                onClick={() => openWorkshop(onOpenAttackMotionModal)}
                className="shrink-0 rounded border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"
              >
                打开
              </button>
            </SettingRow>
          )}
          {onOpenWeaponModal && (
            <SettingRow
              icon={<Focus className="h-4 w-4 text-cyan-400" />}
              title="武器挂点调校"
              desc="武器手部骨骼挂点位移（U）"
            >
              <button
                onClick={() => openWorkshop(onOpenWeaponModal)}
                className="shrink-0 rounded border border-cyan-500/50 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/20"
              >
                打开
              </button>
            </SettingRow>
          )}

          <SectionTitle>调试工具</SectionTitle>
          <SettingRow
            icon={<Crosshair className={`h-4 w-4 ${showHitboxes ? 'text-emerald-400' : 'text-stone-600'}`} />}
            title="碰撞体显示"
            desc="可视化攻击范围与走位判定（H）"
          >
            <TogglePill on={showHitboxes} onClick={onToggleHitboxes} onText="显" offText="隐" />
          </SettingRow>
          <SettingRow
            icon={<Activity className={`h-4 w-4 ${showBlendDebug ? 'text-sky-400' : 'text-stone-600'}`} />}
            title="骨骼混合曲线"
            desc="动作交叉过渡调试示波器（B）"
          >
            <TogglePill on={showBlendDebug} onClick={onToggleBlendDebug} onText="显" offText="隐" />
          </SettingRow>
          <SettingRow
            icon={<Compass className="h-4 w-4 text-amber-400" />}
            title="素体朝向校正"
            desc="修复向左攻击时角色朝向翻转（O）"
          >
            <button
              onClick={() => {
                onToggleOrientation();
                onClose();
              }}
              className="shrink-0 rounded border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20"
            >
              立即校正
            </button>
          </SettingRow>

          <SectionTitle>快捷键</SectionTitle>
          <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/40 px-3 py-2 text-[10px] text-stone-500">
            <Keyboard className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono leading-relaxed">
              WASD 移动 · E 交互 · Q 药水 · 1-4 技能 · B 背包 · H 碰撞体 · Esc 关闭窗口
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
