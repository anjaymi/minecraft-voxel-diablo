import { GameSaveData } from '../../types';

/**
 * SaveSystem — 存档存储层（纯函数）。
 *
 * localStorage 槽位存取 + JSON 文件导出/导入。
 * 序列化对象由引擎的 exportSaveState() 生成（GameSaveData 结构）。
 */

const STORAGE_PREFIX = 'mvxd_save_';
const SAVE_VERSION = 1;

export function saveToSlot(data: GameSaveData, slot = 0): void {
  if (data.version !== SAVE_VERSION) throw new Error(`不支持的存档版本: ${data.version}`);
  localStorage.setItem(STORAGE_PREFIX + slot, JSON.stringify(data));
}

export function loadFromSlot(slot = 0): GameSaveData | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + slot);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as GameSaveData;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function deleteSlot(slot = 0): void {
  localStorage.removeItem(STORAGE_PREFIX + slot);
}

export function hasSlot(slot = 0): boolean {
  return localStorage.getItem(STORAGE_PREFIX + slot) !== null;
}

export function getSlotSummary(slot = 0): { savedAt: string; zoneName: string; level: number } | null {
  const data = loadFromSlot(slot);
  if (!data) return null;
  return {
    savedAt: data.savedAt,
    zoneName: data.floor.zoneName,
    level: data.player.stats.level,
  };
}

/** 导出为可下载的 JSON 文件 */
export function exportToFile(data: GameSaveData, filename?: string): void {
  const name = filename ?? `mvxd_save_Lv${data.player.stats.level}_${data.savedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 解析导入的存档文本（校验版本与结构） */
export async function importFromFile(file: File): Promise<GameSaveData> {
  const text = await file.text();
  return parseImportedSave(text);
}

export function parseImportedSave(text: string): GameSaveData {
  const data = JSON.parse(text) as GameSaveData;
  if (!data || data.version !== 1 || !data.player || !data.floor || !Array.isArray(data.floor.tiles)) {
    throw new Error('存档文件结构无效');
  }
  return data;
}
