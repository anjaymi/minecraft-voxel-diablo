import React, { useState } from 'react';
import {
  ChibiProportionType,
  ChibiPartSpec,
  CHIBI_PROFILES,
} from '../../../engine/skin/psd/ChibiProportionStandards';
import { ChibiPsdTemplateBuilder } from '../../../engine/skin/psd/ChibiPsdTemplateBuilder';
import { ChibiPsdSpecMarkdown } from '../../../engine/skin/psd/ChibiPsdSpecMarkdown';
import { ChibiProportionVisualizer } from './ChibiProportionVisualizer';
import {
  X,
  Download,
  BookOpen,
  Layers,
  Ruler,
  FileCode,
  Shield,
  Sparkles,
} from 'lucide-react';

interface ChibiPsdStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (type: ChibiProportionType) => void;
}

export const ChibiPsdStandardModal: React.FC<ChibiPsdStandardModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Default to calibrated game-native 2.0_head as requested by user
  const [selectedType, setSelectedType] = useState<ChibiProportionType>('2.0_head');
  const profile = CHIBI_PROFILES[selectedType];

  if (!isOpen) return null;

  const handleDownloadCurrentPsd = () => {
    ChibiPsdTemplateBuilder.downloadTemplate(selectedType);
  };

  const handleDownloadMarkdown = () => {
    ChibiPsdSpecMarkdown.downloadSpecMarkdown();
  };

  const partsList: ChibiPartSpec[] = Object.values(profile.parts) as ChibiPartSpec[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[92vh] max-h-[92dvh] flex flex-col rounded-2xl border border-stone-700 bg-stone-900 text-stone-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400 shadow">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-amber-300">
                  Q版手办骨骼 PSD 制作标准体系
                </h2>
                <span className="rounded-full bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  ✨ 180% 放大规范与实装标准
                </span>
              </div>
              <p className="text-xs text-stone-400">
                完美契合游戏实装角色的比例解构、骨骼铰接点及 Photoshop 参考线体系
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Proportion Selector Tabs */}
        <div className="grid grid-cols-2 border-b border-stone-800 bg-stone-950/60 p-2.5 gap-2.5">
          <button
            onClick={() => setSelectedType('2.0_head')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedType === '2.0_head'
                ? 'border-emerald-500/80 bg-emerald-950/40 shadow-lg text-emerald-200'
                : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs sm:text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span>🧸 2.0 头身 · 游戏原生粘土手办标准</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50">
                🟢 当前游戏实装
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              头身比 1.15 : 1（头54%、身23%、短萌腿23%），圆润包子脸与短粗球形靴，与游戏战斗挥砍100%契合
            </p>
          </button>

          <button
            onClick={() => setSelectedType('2.5_head')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedType === '2.5_head'
                ? 'border-amber-500/80 bg-amber-950/40 shadow-lg text-amber-200'
                : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs sm:text-sm font-bold tracking-wide">
                ✨ 2.5 头身 · 手办级微Q版 (GoodSmile 动作标准)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                进阶动作流
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              头身比 1 : 1.5（头40%、身30%、腿30%），修长身型动感挥斩，适合高挑战铠与施法动作
            </p>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 180% Zoom Proportion Visualizer */}
          <ChibiProportionVisualizer profile={profile} />

          {/* Parts Specs Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-stone-200 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>{profile.title} · 各部件尺寸与骨骼点规范</span>
              </h3>
              <span className="text-xs text-stone-400 font-mono">
                512×512 画布精准映射
              </span>
            </div>

            <div className="rounded-xl border border-stone-800 overflow-hidden bg-stone-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/80 text-stone-400">
                    <th className="py-2 px-3">部件</th>
                    <th className="py-2 px-3">图层命名</th>
                    <th className="py-2 px-3">推荐尺寸 (宽×高)</th>
                    <th className="py-2 px-3">骨骼中心点</th>
                    <th className="py-2 px-3">推荐轴心 (Pivot)</th>
                    <th className="py-2 px-3">装配说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  {partsList.map((p) => (
                    <tr key={p.slot} className="hover:bg-stone-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span>{p.label}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cyan-300">
                        {p.folderName} / bone_{p.slot}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-200 font-bold">
                        {p.width} × {p.height} px
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-400">
                        ({p.boneX}, {p.boneY})
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-300">
                        ({p.recommendedPivotX.toFixed(2)}, {p.recommendedPivotY.toFixed(2)})
                      </td>
                      <td className="py-2.5 px-3 text-stone-400 text-xs">
                        {p.slot === 'head' && '下颌与领口贴合点，下巴与包子脸无缝连接'}
                        {p.slot === 'torso' && '腹部重心，短小圆润微凸肚腹'}
                        {p.slot === 'armRight' && '右肩球关节，手心紧贴握持武器握把'}
                        {p.slot === 'armLeft' && '左肩球关节，手心连接副手护盾'}
                        {p.slot === 'legRight' && '前侧圆短靴，短小有力不穿模'}
                        {p.slot === 'legLeft' && '后侧圆短靴，短粗稳固支撑站立'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reference Guides Overview */}
          <div className="rounded-xl border border-stone-800 bg-stone-950/40 p-3.5 space-y-2">
            <h3 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-purple-400" />
              <span>Photoshop 标尺参考线列表 (已内置在 PSD 模板)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {profile.guides.map((g, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-stone-800/80 bg-stone-900/60 p-2 text-stone-300 flex flex-col justify-between"
                >
                  <span className="text-stone-400">{g.label}</span>
                  <span className="font-mono text-amber-400 font-bold mt-0.5">
                    {g.direction === 'vertical' ? 'X' : 'Y'} = {g.location} px
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 space-y-2 text-xs text-stone-300">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Shield className="h-4 w-4" />
              <span>严防穿模与游戏原生契合的美术黄金法则</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-400 leading-relaxed">
              <li>
                <strong className="text-stone-200">短萌球形关节：</strong>
                四肢与躯干衔接端（肩部、髋部）务必绘制为圆弧，避免大幅度摆动产生断层黑缝。
              </li>
              <li>
                <strong className="text-stone-200">紧凑肚腩与包子脸：</strong>
                头部略带肉感且下巴短平圆润，躯干紧贴下巴，保持手办玩偶的紧凑软萌感。
              </li>
              <li>
                <strong className="text-stone-200">透明安全边距：</strong>
                图案图层外边框留 1~2px 透明像素即可，严禁整张画布留白导致自动计算轴心偏移。
              </li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-stone-800 bg-stone-950/90 px-6 py-3.5 gap-3">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 px-3.5 py-1.5 text-xs text-stone-300 hover:text-white transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            <span>下载规范手册 (.MD)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCurrentPsd}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/80 bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 active:scale-95 px-4 py-2 text-xs font-bold text-stone-950 shadow transition-all"
            >
              <Download className="h-4 w-4" />
              <span>下载 {selectedType === '2.0_head' ? '2.0 头身 (游戏实装原生)' : '2.5 头身'} PSD 模板</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 px-4 py-2 text-xs text-stone-300 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
