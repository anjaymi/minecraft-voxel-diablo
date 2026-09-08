import React, { useState } from 'react';
import { SpinePuppetConfig, SpineSlotKey } from '../../engine/skin/spineTypes';
import { SPINE_PART_SPECS, SpineSpecExporter } from '../../engine/skin/SpineSpecExporter';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SpinePsdTemplateGenerator } from '../../engine/skin/psd/spinePsdTemplateGenerator';
import { ChibiPsdStandardModal } from './psd/ChibiPsdStandardModal';
import { Download, FileText, Package, Check, Sparkles, Image as ImageIcon, FileCode, Ruler } from 'lucide-react';

interface SpineExportPanelProps {
  onClose?: () => void;
}

export const SpineExportPanel: React.FC<SpineExportPanelProps> = () => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
  const puppet = customSkinManager.getSpinePuppet();

  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      await SpineSpecExporter.exportFullPackageZip(puppet);
    } catch (e) {
      console.error('Failed to export zip', e);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportMarkdown = () => {
    SpineSpecExporter.exportMarkdownFile(puppet);
  };

  const handleExportJson = () => {
    SpineSpecExporter.exportJsonConfig(puppet);
  };

  const handleCopySpec = () => {
    const md = SpineSpecExporter.generateMarkdownGuide(puppet);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPsdTemplate = () => {
    SpinePsdTemplateGenerator.downloadTemplate();
  };

  const slotKeys = Object.keys(SPINE_PART_SPECS) as SpineSlotKey[];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-900/70 p-4 text-stone-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-amber-300 font-cinzel">
            骨骼素材部件制作规范与全套导出
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySpec}
            className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs text-stone-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileText className="h-3.5 w-3.5 text-sky-400" />}
            <span>{copied ? '已复制规范' : '复制规范文本'}</span>
          </button>
          <button
            onClick={() => setIsStandardModalOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-purple-700/70 bg-purple-950/70 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-900 transition-colors shadow"
          >
            <Ruler className="h-3.5 w-3.5 text-purple-400" />
            <span>📐 2.0 & 2.5 头身标准</span>
          </button>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs text-stone-300 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>下载 Markdown 说明</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs text-stone-300 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-purple-400" />
            <span>导出 JSON 配置</span>
          </button>
          <button
            onClick={() => SpinePsdTemplateGenerator.download25HeadTemplate()}
            className="flex items-center gap-1 rounded-lg border border-amber-700/70 bg-amber-950/70 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900 transition-colors shadow"
          >
            <FileCode className="h-3.5 w-3.5 text-amber-400" />
            <span>2.5头身 PSD</span>
          </button>
          <button
            onClick={() => SpinePsdTemplateGenerator.download20HeadTemplate()}
            className="flex items-center gap-1 rounded-lg border border-cyan-700/70 bg-cyan-950/70 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition-colors shadow"
          >
            <FileCode className="h-3.5 w-3.5 text-cyan-400" />
            <span>2.0头身 PSD</span>
          </button>
          <button
            onClick={handleExportZip}
            disabled={isExportingZip}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/80 bg-amber-600 px-3 py-1 text-xs font-bold text-stone-950 shadow hover:bg-amber-500 active:scale-95 transition-all"
          >
            <Package className="h-3.5 w-3.5" />
            <span>{isExportingZip ? '打包中...' : '📦 打包下载全套 PNG (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Parts Specification Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {slotKeys.map((k) => {
          const spec = SPINE_PART_SPECS[k];
          const slot = puppet.slots[k];
          const hasCustomImg = !!slot?.dataUrl;

          return (
            <div
              key={k}
              className="flex flex-col justify-between rounded-lg border border-stone-800 bg-stone-950/70 p-3 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <span>{spec.label}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-amber-950/60 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-400 border border-amber-800/40">
                      {spec.recommendedWidth} × {spec.recommendedHeight} px
                    </span>
                    <span className="text-[10px] text-stone-400">高清: {spec.hiResWidth}×{spec.hiResHeight}</span>
                  </div>
                </div>

                {/* Preview Thumbnail */}
                <div className="flex h-10 w-10 items-center justify-center rounded border border-stone-700 bg-stone-900 overflow-hidden">
                  {hasCustomImg ? (
                    <img
                      src={slot.dataUrl}
                      alt={spec.label}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-stone-600" />
                  )}
                </div>
              </div>

              <p className="mt-2 text-[11px] text-stone-400 leading-relaxed">
                {spec.description}
              </p>

              <div className="mt-2.5 flex items-center justify-between border-t border-stone-900 pt-2 text-[10px] font-mono text-stone-500">
                <span>推荐轴心: ({spec.defaultPivotX}, {spec.defaultPivotY})</span>
                <span>当前偏移: ({slot?.offsetX ?? 0}, {slot?.offsetY ?? 0})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guidance Footnote */}
      <div className="rounded-lg border border-blue-900/30 bg-blue-950/20 p-2.5 text-xs text-blue-300/90 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          <strong>制作贴士：</strong>点击上方【打包下载全套 PNG (ZIP)】将自动生成包含全部 6 个部位的标准透明尺寸模板及说明书。在画软件（如 Photoshop / Aseprite / Krita）中直接按模板尺寸绘制并保存为 32 位透明 PNG，即可完美嵌入骨骼动画无缝拼接。
        </div>
      </div>

      {/* 2.0 & 2.5 Head Standard Specification Modal */}
      <ChibiPsdStandardModal
        isOpen={isStandardModalOpen}
        onClose={() => setIsStandardModalOpen(false)}
      />
    </div>
  );
};
