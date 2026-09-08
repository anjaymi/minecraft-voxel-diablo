import React, { useState, useEffect } from 'react';
import { GameEngine } from '../engine/gameEngine';
import { AttackKeyframe, HandWeaponTweenConfig } from '../engine/combat/motion/AttackMotionTypes';
import { WeaponSocketConfigSection } from './WeaponSocketConfigSection';
import { Swords, Sliders, RotateCcw, X, Crosshair, Play, Activity } from 'lucide-react';

interface AttackMotionConfigModalProps {
  engine: GameEngine;
  isOpen: boolean;
  onClose: () => void;
}

export const AttackMotionConfigModal: React.FC<AttackMotionConfigModalProps> = ({
  engine,
  isOpen,
  onClose,
}) => {
  const controller = engine.attackMotionController;
  const [activeTab, setActiveTab] = useState<'position' | 'motion'>('position');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [tweenConfig, setTweenConfig] = useState<HandWeaponTweenConfig>(controller.getTweenConfig());
  const [keyframes, setKeyframes] = useState<AttackKeyframe[]>(controller.getKeyframesForStep(0));

  useEffect(() => {
    if (!isOpen) return;
    setTweenConfig({ ...controller.getTweenConfig() });
    setKeyframes([...controller.getKeyframesForStep(activeStep)]);
  }, [isOpen, activeStep, controller]);

  if (!isOpen) return null;

  const handleUpdateTween = (field: keyof HandWeaponTweenConfig, value: number) => {
    const updated = { ...tweenConfig, [field]: value };
    setTweenConfig(updated);
    controller.updateTweenConfig(updated);
  };

  const handleUpdateKeyframeAngle = (index: number, field: 'wristAngle' | 'weaponAngle' | 'shoulderAngle', val: number) => {
    const updated = [...keyframes];
    updated[index] = { ...updated[index], [field]: val };
    setKeyframes(updated);
    controller.setCustomKeyframes(activeStep, updated);
  };

  const handleResetMotion = () => {
    controller.resetKeyframes(activeStep);
    controller.updateTweenConfig({
      weaponAngleOffset: 0,
      wristInertia: 0.12,
      impactRecoilIntensity: 0.035,
    });
    setTweenConfig({ ...controller.getTweenConfig() });
    setKeyframes([...controller.getKeyframesForStep(activeStep)]);
  };

  const triggerTestSlash = () => {
    const p = engine.player;
    p.isAttacking = true;
    p.currentSlashStep = activeStep;
    p.attackTimer = 0.26;
    p.comboStep = (activeStep + 1) % 3;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-stone-700 bg-stone-900/95 text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-400">
              <Crosshair className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-stone-100">
                武器位置与动作控制器 (Weapon Socket & Motion)
              </h2>
              <p className="text-xs text-stone-400">
                适配武器持握插槽、待机避脸角度、手部贴合与打击补间动效
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-6">
          <button
            onClick={() => setActiveTab('position')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'position'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Crosshair className="h-4 w-4" />
            <span>武器位置与手部适配 (Position & Socket)</span>
          </button>

          <button
            onClick={() => setActiveTab('motion')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'motion'
                ? 'border-red-500 text-red-400 bg-red-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Swords className="h-4 w-4" />
            <span>挥砍关键帧与补间动效 (Attack Tween)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'position' ? (
            <WeaponSocketConfigSection engine={engine} />
          ) : (
            <div className="space-y-6">
              {/* Combo Step Selector & Test Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950/40 p-3 rounded-lg border border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-400">连招段落:</span>
                  {[
                    { step: 0, label: 'Combo 1: 雷霆下劈' },
                    { step: 1, label: 'Combo 2: 升龙挑斩' },
                    { step: 2, label: 'Combo 3: 碎地终结' },
                  ].map(({ step, label }) => (
                    <button
                      key={step}
                      onClick={() => setActiveStep(step)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        activeStep === step
                          ? 'bg-red-700 text-white shadow'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={triggerTestSlash}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-xs font-bold text-white shadow active:scale-95 transition-all"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>挥刀测试</span>
                </button>
              </div>

              {/* Hand & Weapon Tween Configuration */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4" />
                  <span>全局手腕与武器补间参数 (Tween Dynamics)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950/30 p-4 rounded-lg border border-stone-800/80">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-300">武器插槽补间偏置角</span>
                      <span className="font-mono text-amber-400">
                        {(tweenConfig.weaponAngleOffset * (180 / Math.PI)).toFixed(1)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.05}
                      value={tweenConfig.weaponAngleOffset}
                      onChange={(e) => handleUpdateTween('weaponAngleOffset', parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-300">击退震颤强度</span>
                      <span className="font-mono text-amber-400">
                        {(tweenConfig.impactRecoilIntensity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.1}
                      step={0.005}
                      value={tweenConfig.impactRecoilIntensity}
                      onChange={(e) =>
                        handleUpdateTween('impactRecoilIntensity', parseFloat(e.target.value))
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Keyframe Visual Sliders */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  <span>挥砍全阶段关键帧角度 (Keyframe Angles)</span>
                </h3>

                <div className="space-y-2">
                  {keyframes.map((kf, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-950/40 rounded-lg border border-stone-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-bold">
                          {(kf.time * 100).toFixed(0)}%
                        </span>
                        <span className="text-stone-400">
                          {idx === 0
                            ? '起始预备'
                            : idx === 1
                            ? '引刀蓄势'
                            : idx === 2
                            ? '爆发破空'
                            : idx === 3
                            ? '击中止动'
                            : '顺势收刀'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400">手腕角度:</span>
                          <input
                            type="range"
                            min={-Math.PI}
                            max={Math.PI}
                            step={0.05}
                            value={kf.wristAngle}
                            onChange={(e) =>
                              handleUpdateKeyframeAngle(idx, 'wristAngle', parseFloat(e.target.value))
                            }
                            className="w-24 accent-indigo-500"
                          />
                          <span className="font-mono text-indigo-400 w-10 text-right">
                            {(kf.wristAngle * (180 / Math.PI)).toFixed(0)}°
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-stone-400">武器角度:</span>
                          <input
                            type="range"
                            min={-Math.PI}
                            max={Math.PI}
                            step={0.05}
                            value={kf.weaponAngle}
                            onChange={(e) =>
                              handleUpdateKeyframeAngle(idx, 'weaponAngle', parseFloat(e.target.value))
                            }
                            className="w-24 accent-red-500"
                          />
                          <span className="font-mono text-red-400 w-10 text-right">
                            {(kf.weaponAngle * (180 / Math.PI)).toFixed(0)}°
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-800 px-6 py-3 bg-stone-950/80">
          {activeTab === 'motion' ? (
            <button
              onClick={handleResetMotion}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>重置当前段落配置</span>
            </button>
          ) : (
            <span className="text-xs text-stone-400">
              提示: 调整滑块时游戏画面中的角色武器将即时刷新生效
            </span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-100 transition-colors"
          >
            完成并应用
          </button>
        </div>
      </div>
    </div>
  );
};
