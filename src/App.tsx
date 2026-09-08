import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from './engine/gameEngine';
import { GameRenderer } from './engine/renderer';
import { screenToWorld } from './engine/isometric';
import { DiabloHUD } from './components/DiabloHUD';
import { MiniMap } from './components/MiniMap';
import { QuestTracker } from './components/QuestTracker';
import { GameTopBarControls } from './components/hud/GameTopBarControls';
import { SettingsModal } from './components/hud/SettingsModal';
import { MerchantShopModal } from './components/MerchantShopModal';
import { BossIntroBanner } from './components/BossIntroBanner';
import { TouchControls } from './components/TouchControls';
import { saveToSlot, loadFromSlot, exportToFile, importFromFile, hasSlot, getSlotSummary } from './engine/save/SaveSystem';
import { gpuAcceleration } from './engine/perf/exports';
import { AppModalsContainer } from './components/AppModalsContainer';
import { soundManager } from './audio/soundManager';
import { bgmSystem } from './audio/bgmSystem';
import { SpineBlendDebugOverlay } from './engine/skin/SpineBlendDebugOverlay';
import { CharacterOrientationManager } from './engine/orientation/CharacterOrientationManager';
import { customSkinManager } from './engine/skin/CustomSkinManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCampOpen, setIsCampOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
  const [isWeaponModalOpen, setIsWeaponModalOpen] = useState(false);
  const [isAttackMotionModalOpen, setIsAttackMotionModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // BGM 音量 0~100，localStorage 持久化（默认 80）
  const [bgmVolume, setBgmVolume] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem('mvxd_bgm_volume'));
      return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 80;
    } catch {
      return 80;
    }
  });
  const [showHitboxes, setShowHitboxes] = useState(false);
  const showHitboxesRef = useRef(false);
  const [showBlendDebug, setShowBlendDebug] = useState(false);
  const showBlendDebugRef = useRef(false);

  const isDraggingOnCanvasRef = useRef(false);
  const isAnyModalOpenRef = useRef(false);

  // Reactive state for HUD updates
  const [, setFrameTick] = useState(0);
  // 巨型首领入场横幅（进入有巢穴首领的区域时播报一次）
  const [bossIntro, setBossIntro] = useState<{ name: string; zone: string } | null>(null);

  useEffect(() => {
    showHitboxesRef.current = showHitboxes;
  }, [showHitboxes]);

  useEffect(() => {
    showBlendDebugRef.current = showBlendDebug;
    SpineBlendDebugOverlay.isVisible = showBlendDebug;
  }, [showBlendDebug]);

  // 存档检测：启动时若有存档提示续档
  const [savePrompt, setSavePrompt] = useState<{ zone: string; level: number } | null>(null);
  useEffect(() => {
    if (hasSlot(0)) {
      const sum = getSlotSummary(0);
      if (sum) {
        setSavePrompt({ zone: sum.zoneName, level: sum.level });
        const t = setTimeout(() => setSavePrompt(null), 8000);
        return () => clearTimeout(t);
      }
    }
  }, []);

  // Initialize engine & renderer
  useEffect(() => {
    const engine = new GameEngine();
    engine.onOpenClassMaster = () => {
      setIsClassSelectOpen(true);
    };
    engine.onOpenCampHub = () => {
      setIsCampOpen(true);
    };
    engine.onOpenShop = () => {
      setIsShopOpen(true);
    };
    engine.onBossIntro = (info) => {
      setBossIntro({ ...info, zone: info.zone });
    };
    // 开发调试句柄（仅 dev 构建暴露）
    if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
      (window as unknown as { __game: GameEngine }).__game = engine;
    }
    engineRef.current = engine;

    const canvas = canvasRef.current;
    if (canvas) {
      // GPU 加速：不透明画布 + desynchronized 呈现提示 + 合成层提升
      const ctx = gpuAcceleration.createContext(canvas);
      if (ctx) {
        rendererRef.current = new GameRenderer(ctx);
      }
    }

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.08);
      lastTime = currentTime;

      const eng = engineRef.current;
      const rnd = rendererRef.current;

      if (eng && rnd && canvas) {
        eng.update(dt);

        rnd.render(
          eng.floor,
          eng.player,
          eng.enemies,
          eng.npcs,
          eng.projectiles,
          eng.drops,
          eng.particles,
          eng.floatingTexts,
          eng.adventurerManager.getAll(),
          eng.effectiveCamX,
          eng.effectiveCamY,
          eng.gameTime,
          eng.mouseWorldX,
          eng.mouseWorldY,
          showHitboxesRef.current,
          showBlendDebugRef.current,
          eng.hitStopTimer
        );

        // Periodically trigger React render for HUD bars
        setFrameTick((t) => t + 1);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Window resize observer for canvas
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;
      if (rendererRef.current) {
        rendererRef.current.resize(w, h);
      }
    };

    const observer = new ResizeObserver(() => handleResize());
    observer.observe(container);
    handleResize();

    return () => observer.disconnect();
  }, []);

  // Keep active player config in sync with customSkinManager updates
  useEffect(() => {
    const unsub = customSkinManager.subscribe(() => {
      const eng = engineRef.current;
      if (eng && eng.player) {
        eng.player.spinePuppet = customSkinManager.getSpinePuppet();
        eng.player.customSkin = customSkinManager.getSkin();
      }
    });
    return unsub;
  }, []);

  // Compute whether any UI overlay / modal is currently active
  const eng = engineRef.current;
  const player = eng?.player;
  const boss = eng?.enemies.find((en) => en.type === 'wither_boss');

  const isAnyModalOpen = Boolean(
    isInventoryOpen ||
    isCampOpen ||
    isSettingsOpen ||
    isShopOpen ||
    isClassSelectOpen ||
    isSkillTreeOpen ||
    isSkinModalOpen ||
    isWeaponModalOpen ||
    isAttackMotionModalOpen ||
    isGuideOpen ||
    eng?.isLevelingUp ||
    eng?.isGameOver ||
    eng?.isVictory
  );

  // Synchronize ref and halt character momentum whenever any modal opens
  useEffect(() => {
    isAnyModalOpenRef.current = isAnyModalOpen;
    if (isAnyModalOpen) {
      isDraggingOnCanvasRef.current = false;
      engineRef.current?.cancelMovementAndInput();
    }
  }, [isAnyModalOpen]);

  // Keyboard Event Listeners with strict modal lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;

      // Ignore when focused in text inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // If any modal is open, only allow Escape to close them; block all gameplay actions
      if (isAnyModalOpenRef.current) {
        if (e.code === 'Escape') {
          e.preventDefault();
          setIsInventoryOpen(false);
          setIsSettingsOpen(false);
          setIsCampOpen(false);
          setIsClassSelectOpen(false);
          setIsSkillTreeOpen(false);
          setIsSkinModalOpen(false);
          setIsWeaponModalOpen(false);
          setIsAttackMotionModalOpen(false);
          setIsGuideOpen(false);
        }
        return;
      }

      if (e.code === 'KeyO') {
        const flipped = CharacterOrientationManager.toggleInvertFacing(eng.player);
        eng.addFloatingText(
          eng.player.x,
          eng.player.y - 0.8,
          flipped ? '🔄 素体朝向: 已镜像翻转 (Inverted)' : '🔄 素体朝向: 正常无翻转 (Normal)',
          '#f59e0b',
          16,
          true
        );
        return;
      }
      if (e.code === 'KeyI' || e.code === 'KeyB') {
        setIsInventoryOpen((prev) => !prev);
        return;
      }
      if (e.code === 'KeyC') {
        setIsCampOpen((prev) => !prev);
        return;
      }
      if (e.code === 'KeyV') {
        setIsAttackMotionModalOpen((prev) => !prev);
        return;
      }
      if (e.code === 'KeyT' || e.code === 'KeyK') {
        setIsSkillTreeOpen((prev) => !prev);
        return;
      }
      if (e.code === 'KeyP') {
        setIsSkinModalOpen((prev) => !prev);
        return;
      }
      if (e.code === 'KeyU') {
        setIsWeaponModalOpen((prev) => !prev);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        eng.playerDash();
        return;
      }
      if (e.code === 'Digit1') {
        eng.useHotkey('1');
        return;
      }
      if (e.code === 'Digit2') {
        eng.useHotkey('2');
        return;
      }
      if (e.code === 'Digit3') {
        eng.useHotkey('3');
        return;
      }
      if (e.code === 'KeyE') {
        if (eng.nearbyClassMaster) {
          setIsClassSelectOpen(true);
          return;
        }
        eng.useHotkey('4');
        return;
      }
      if (e.code === 'Digit4') {
        eng.useHotkey('4');
        return;
      }
      if (e.code === 'KeyQ') {
        eng.useHotkey('q');
        return;
      }
      if (e.code === 'KeyH' || e.code === 'F3') {
        e.preventDefault();
        setShowHitboxes((prev) => !prev);
        return;
      }

      // Prevent page scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      eng.keys[e.code] = true;
      if (e.key) {
        eng.keys[e.key] = true;
        eng.keys[e.key.toLowerCase()] = true;
        eng.keys[e.key.toUpperCase()] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      eng.keys[e.code] = false;
      if (e.key) {
        eng.keys[e.key] = false;
        eng.keys[e.key.toLowerCase()] = false;
        eng.keys[e.key.toUpperCase()] = false;
      }
    };

    const handleBlur = () => {
      isDraggingOnCanvasRef.current = false;
      engineRef.current?.cancelMovementAndInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Mouse coordinate updates in world space
  const updateMouseWorldCoord = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const eng = engineRef.current;
    if (!canvas || !eng) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    const sx = (clientX - rect.left) * scaleX;
    const sy = (clientY - rect.top) * scaleY;

    const world = screenToWorld(sx, sy, eng.effectiveCamX, eng.effectiveCamY, canvas.width, canvas.height);
    eng.mouseWorldX = world.x;
    eng.mouseWorldY = world.y;
  }, []);

  // Dedicated Canvas Mouse Down (only triggers when clicking the actual game field)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    if (!eng || isAnyModalOpenRef.current) return;

    updateMouseWorldCoord(e.clientX, e.clientY);

    const canvas = canvasRef.current;
    if (canvas && showBlendDebugRef.current) {
      const rect = canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
      if (SpineBlendDebugOverlay.handleClick(sx, sy, eng.player)) {
        return;
      }
    }

    isDraggingOnCanvasRef.current = true;

    if (e.button === 0) {
      if (eng.interactNPC(eng.mouseWorldX, eng.mouseWorldY)) {
        return;
      }
      eng.onMouseDown();
      eng.player.targetX = eng.mouseWorldX;
      eng.player.targetY = eng.mouseWorldY;
    } else if (e.button === 2) {
      eng.isRightMouseDown = true;
    }
  };

  // ===== 触屏输入：映射到与鼠标一致的引擎语义 =====
  // 单指 = 左键（点按移动/攻击，长按蓄力；拖动持续移动）
  // 双指第二指点下 = 右键（副手特技，按住持续）
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    if (!eng || isAnyModalOpenRef.current) return;
    e.preventDefault();

    const t = e.changedTouches[0];
    if (!t) return;
    updateMouseWorldCoord(t.clientX, t.clientY);

    if (e.touches.length === 1) {
      // 单指：先尝试交互（NPC/宝箱），否则进入攻击/移动
      if (eng.interactNPC(eng.mouseWorldX, eng.mouseWorldY)) return;
      eng.onMouseDown();
      eng.player.targetX = eng.mouseWorldX;
      eng.player.targetY = eng.mouseWorldY;
      isDraggingOnCanvasRef.current = true;
    } else if (e.touches.length === 2) {
      // 第二根手指 = 副手特技（右键语义）
      eng.isRightMouseDown = true;
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    if (!eng || isAnyModalOpenRef.current) return;
    e.preventDefault();

    const t = e.touches[0];
    if (!t) return;
    updateMouseWorldCoord(t.clientX, t.clientY);

    if (eng.player.isChargingAttack) {
      const dx = eng.mouseWorldX - eng.player.x;
      const dy = eng.mouseWorldY - eng.player.y;
      if (Math.hypot(dx, dy) > 0.05) {
        eng.player.facingAngle = Math.atan2(dy, dx);
      }
    } else if (isDraggingOnCanvasRef.current && eng.isMouseDown) {
      eng.player.targetX = eng.mouseWorldX;
      eng.player.targetY = eng.mouseWorldY;
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    if (!eng) return;
    e.preventDefault();

    if (e.touches.length === 0) {
      eng.onMouseUp();
      isDraggingOnCanvasRef.current = false;
      eng.isRightMouseDown = false;
    } else if (e.touches.length === 1) {
      eng.isRightMouseDown = false;
    }
  };

  // Global mouse move and release listeners so click-to-move dragging is smooth
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const eng = engineRef.current;
      if (!eng || isAnyModalOpenRef.current) return;

      updateMouseWorldCoord(e.clientX, e.clientY);

      if (eng.player.isChargingAttack) {
        const dx = eng.mouseWorldX - eng.player.x;
        const dy = eng.mouseWorldY - eng.player.y;
        if (Math.hypot(dx, dy) > 0.05) {
          eng.player.facingAngle = Math.atan2(dy, dx);
        }
      } else if (isDraggingOnCanvasRef.current && eng.isMouseDown) {
        eng.player.targetX = eng.mouseWorldX;
        eng.player.targetY = eng.mouseWorldY;
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      const eng = engineRef.current;
      isDraggingOnCanvasRef.current = false;
      if (!eng) return;

      if (e.button === 0) eng.onMouseUp();
      if (e.button === 2) eng.isRightMouseDown = false;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [updateMouseWorldCoord]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
  };

  const changeBgmVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    setBgmVolume(clamped);
    try {
      localStorage.setItem('mvxd_bgm_volume', String(clamped));
    } catch {
      // 存储不可用时不打断调节
    }
    bgmSystem.setVolume(clamped / 100);
  };

  // 启动时把持久化的 BGM 音量应用到引擎
  useEffect(() => {
    bgmSystem.setVolume(bgmVolume / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-viewport"
      className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 2.5D Isometric Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
        onTouchEnd={handleCanvasTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 cursor-crosshair block w-full h-full"
      />

      {/* Giant boss intro banner */}
      <BossIntroBanner banner={bossIntro} />

      {/* 竖屏时提示横屏游玩（CSS 控制只在手机竖屏显示） */}
      <div className="orientation-hint pointer-events-none absolute left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-xl border border-amber-600/50 bg-stone-950/90 px-6 py-4 text-center">
        <span className="text-3xl animate-pulse">📱↻</span>
        <p className="text-sm font-bold text-amber-300">建议横屏游玩</p>
        <p className="text-[11px] text-stone-400">旋转设备获得完整视野与操控布局</p>
      </div>

      {/* 移动端虚拟摇杆与技能轮盘（暗黑不朽风格，md 以下才显示） */}
      {eng && player && (
        <TouchControls
          player={player}
          onMove={(x, y) => {
            eng.touchMoveX = x;
            eng.touchMoveY = y;
          }}
          onPrimaryDown={() => eng.onMouseDown()}
          onPrimaryUp={() => eng.onMouseUp()}
          onSecondaryDown={() => {
            eng.isRightMouseDown = true;
          }}
          onSecondaryUp={() => {
            eng.isRightMouseDown = false;
          }}
          onSkill={(slot) => eng.useHotkey(slot)}
          onPotion={() => eng.useHotkey('q')}
          onDash={() => eng.playerDash()}
          onInteract={() => eng.tryInteract()}
        />
      )}

      {/* Diablo Bottom Action Bar & Health/Mana Globes */}
      {player && eng && (
        <DiabloHUD
          player={player}
          boss={boss}
          zoneName={eng.floor.zoneName}
          totalKills={eng.totalKills}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenCamp={() => setIsCampOpen(true)}
          onOpenClassSelect={() => setIsClassSelectOpen(true)}
          onOpenSkillTree={() => setIsSkillTreeOpen(true)}
          onUseSkill1={() => eng.useHotkey('1')}
          onUseSkill2={() => eng.useHotkey('2')}
          onUseSkill3={() => eng.useHotkey('3')}
          onUseSkill4={() => eng.useHotkey('4')}
          onUsePotion={() => eng.useHotkey('q')}
        />
      )}

      {/* Class Master Proximity Prompt (Dungeon & Camp) */}
      {eng?.nearbyClassMaster && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            onClick={() => setIsClassSelectOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 border-2 border-purple-400/90 text-purple-100 hover:text-white hover:bg-purple-950/90 shadow-2xl shadow-purple-950/80 transition-all hover:scale-105 active:scale-95"
          >
            <span className="text-lg animate-pulse">🧙‍♂️</span>
            <div className="text-left">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>职业导师 艾尔德温</span>
                <span className="bg-purple-800/90 text-[10px] px-1.5 py-0.2 rounded text-purple-100 font-mono">按 E 键 或 点击对话</span>
              </div>
              <div className="text-[11px] text-stone-300">切换奥术法师 / 死灵召唤 / 荒野德鲁伊职业并觉醒天赋</div>
            </div>
          </button>
        </div>
      )}

      {/* Top Right Corner: MiniMap & Dynamic Dungeon Quest Tracker */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-none">
        {eng && player && (
          <div className="pointer-events-auto">
            <MiniMap floor={eng.floor} player={player} enemies={eng.enemies} adventurers={eng.adventurerManager.getAll()} />
          </div>
        )}
        {eng && eng.questSystem && (
          <div className="pointer-events-auto">
            <QuestTracker quest={typeof eng.questSystem.getCurrentQuest === 'function' ? eng.questSystem.getCurrentQuest() : eng.questSystem.currentQuest || null} />
          </div>
        )}
      </div>

      {/* Floating Sound & Help & Hitbox Controls */}
      <GameTopBarControls onOpenSettings={() => setIsSettingsOpen(true)} />
      {isShopOpen && player && (
        <MerchantShopModal
          player={player}
          onClose={() => setIsShopOpen(false)}
          onPurchase={(msg, ok) => {
            const eng = engineRef.current;
            if (eng) {
              eng.addFloatingText(eng.player.x, eng.player.y - 0.8, msg, ok ? '#4ade80' : '#f87171', 14);
            }
          }}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          bgmVolume={bgmVolume}
          onBgmVolume={changeBgmVolume}
          onOpenGuide={() => {
            setIsSettingsOpen(false);
            setIsGuideOpen(true);
          }}
          showHitboxes={showHitboxes}
          onToggleHitboxes={() => setShowHitboxes((prev) => !prev)}
          showBlendDebug={showBlendDebug}
          onToggleBlendDebug={() => setShowBlendDebug((prev) => !prev)}
          onToggleOrientation={() => {
            const engInstance = engineRef.current;
            if (!engInstance) return;
            const flipped = CharacterOrientationManager.toggleInvertFacing(engInstance.player);
            engInstance.addFloatingText(
              engInstance.player.x,
              engInstance.player.y - 0.8,
              flipped ? '🔄 素体朝向: 已镜像翻转 (Inverted)' : '🔄 素体朝向: 正常无翻转 (Normal)',
              '#f59e0b',
              16,
              true
            );
          }}
          onOpenSkinModal={() => setIsSkinModalOpen(true)}
          onOpenAttackMotionModal={() => setIsAttackMotionModalOpen(true)}
          onOpenWeaponModal={() => setIsWeaponModalOpen(true)}
          onSaveGame={() => {
            const eng = engineRef.current;
            if (!eng) return '引擎未就绪';
            try {
              saveToSlot(eng.exportSaveState(), 0);
              eng.addFloatingText(eng.player.x, eng.player.y - 1, '💾 游戏已保存', '#38bdf8', 16);
              return '✔ 已保存到槽位 1';
            } catch {
              return '保存失败';
            }
          }}
          onLoadGame={() => {
            const eng = engineRef.current;
            if (!eng) return '引擎未就绪';
            const data = loadFromSlot(0);
            if (!data) return '没有找到存档';
            eng.applySaveState(data);
            eng.addFloatingText(eng.player.x, eng.player.y - 1, '📂 存档已读取', '#38bdf8', 16);
            return '✔ 存档已读取';
          }}
          onExportSave={() => {
            const eng = engineRef.current;
            if (!eng) return '引擎未就绪';
            exportToFile(eng.exportSaveState());
            return '✔ 已导出存档文件';
          }}
          onImportSave={async (file) => {
            const eng = engineRef.current;
            if (!eng) return '引擎未就绪';
            const data = await importFromFile(file);
            eng.applySaveState(data);
            eng.addFloatingText(eng.player.x, eng.player.y - 1, '📂 存档已导入', '#38bdf8', 16);
            return '✔ 存档已导入';
          }}
        />
      )}

      {/* Modals and Overlay Windows */}
      <AppModalsContainer
        engine={eng}
        player={player}
        isInventoryOpen={isInventoryOpen}
        setIsInventoryOpen={setIsInventoryOpen}
        isCampOpen={isCampOpen}
        setIsCampOpen={setIsCampOpen}
        isClassSelectOpen={isClassSelectOpen}
        setIsClassSelectOpen={setIsClassSelectOpen}
        isSkillTreeOpen={isSkillTreeOpen}
        setIsSkillTreeOpen={setIsSkillTreeOpen}
        isSkinModalOpen={isSkinModalOpen}
        setIsSkinModalOpen={setIsSkinModalOpen}
        isWeaponModalOpen={isWeaponModalOpen}
        setIsWeaponModalOpen={setIsWeaponModalOpen}
        isAttackMotionModalOpen={isAttackMotionModalOpen}
        setIsAttackMotionModalOpen={setIsAttackMotionModalOpen}
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
        onSkillTreeUpdate={() => setFrameTick((t) => t + 1)}
      />
    </div>
  );
}
