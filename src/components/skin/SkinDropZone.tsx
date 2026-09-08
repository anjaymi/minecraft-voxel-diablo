import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';

interface SkinDropZoneProps {
  onSuccess: () => void;
}

export const SkinDropZone: React.FC<SkinDropZoneProps> = ({ onSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择有效的图片文件 (PNG, JPG, WebP)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await customSkinManager.processUploadFile(file);
      setIsLoading(false);
      onSuccess();
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : '图片加载失败');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
          isDragging
            ? 'border-amber-400 bg-amber-500/15 scale-[1.01]'
            : 'border-stone-700 bg-stone-900/60 hover:border-amber-500/70 hover:bg-stone-800/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
          {isLoading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>

        <div className="text-sm font-bold text-stone-200 group-hover:text-amber-300 transition-colors">
          点击选择 或 拖拽 PNG 图片至此处
        </div>
        <p className="mt-1 text-xs text-stone-400">
          支持透明背景 PNG / Pixel Art / 动漫立绘小人 (自动等比适配)
        </p>

        <div className="mt-3 flex items-center gap-2 rounded-full border border-stone-800 bg-stone-950/70 px-3 py-1 text-[11px] text-stone-400">
          <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
          <span>推荐规格：透明背景 PNG，长宽 32px ~ 256px 最佳</span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/70 px-3 py-2 text-xs text-red-300 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
