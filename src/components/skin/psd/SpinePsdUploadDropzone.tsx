import React, { useRef, useState } from 'react';
import { Upload, FileCode, Download, Loader2, AlertCircle, BookOpen, Sparkles } from 'lucide-react';
import { SpinePsdTemplateGenerator } from '../../../engine/skin/psd/spinePsdTemplateGenerator';
import { ChibiPsdStandardModal } from './ChibiPsdStandardModal';

interface SpinePsdUploadDropzoneProps {
  onFileLoaded: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
}

export const SpinePsdUploadDropzone: React.FC<SpinePsdUploadDropzoneProps> = ({
  onFileLoaded,
  isLoading,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.psd')) {
      alert('请上传 .psd 格式的 Photoshop 文件');
      return;
    }
    onFileLoaded(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_16px_rgba(251,191,36,0.3)]'
            : 'border-stone-700 bg-stone-900/50 hover:border-amber-500/60 hover:bg-stone-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".psd"
          onChange={handleFileChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-amber-300">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-semibold">正在解析 PSD 图层结构与骨骼点坐标...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/50 text-amber-400 group-hover:scale-105 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-200">
                拖拽 Photoshop <span className="text-amber-400">.PSD</span> 文件至此处，或点击浏览
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                支持 2.0头身(黏土人) 与 2.5头身(手办级) 自动识别对齐图层与骨骼锚点
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-800/80 bg-rose-950/50 p-2.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Standard & Template Download Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-xs">
        <div className="flex items-center gap-2 text-stone-300">
          <FileCode className="h-4 w-4 text-cyan-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-stone-200">
              Q版骨骼 PSD 规范工程与模板
            </span>
            <span className="text-[11px] text-stone-400">
              提供 2.0 头身 (Q版粘土人) 与 2.5 头身 (手办级微Q版) 标准模板
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsStandardModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-purple-700/60 bg-purple-950/70 px-2.5 py-1.5 font-semibold text-purple-300 hover:bg-purple-900/90 hover:text-purple-100 transition-colors shadow"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>查看 2.0 / 2.5 头身标准</span>
          </button>

          <button
            onClick={() => SpinePsdTemplateGenerator.download25HeadTemplate()}
            className="flex items-center gap-1 rounded-lg border border-amber-600/60 bg-amber-950/70 px-2.5 py-1.5 font-semibold text-amber-300 hover:bg-amber-900/90 hover:text-amber-100 transition-colors shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>2.5头身 PSD</span>
          </button>

          <button
            onClick={() => SpinePsdTemplateGenerator.download20HeadTemplate()}
            className="flex items-center gap-1 rounded-lg border border-cyan-700/60 bg-cyan-950/70 px-2.5 py-1.5 font-semibold text-cyan-300 hover:bg-cyan-900/90 hover:text-cyan-100 transition-colors shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>2.0头身 PSD</span>
          </button>
        </div>
      </div>

      {/* Standard Specification Modal */}
      <ChibiPsdStandardModal
        isOpen={isStandardModalOpen}
        onClose={() => setIsStandardModalOpen(false)}
      />
    </div>
  );
};
