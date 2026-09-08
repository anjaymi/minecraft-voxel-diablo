import React, { useState } from 'react';
import { SpineSlotKey } from '../../engine/skin/spineTypes';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SpinePreviewCanvas } from './SpinePreviewCanvas';
import { SpineSlotSelector } from './SpineSlotSelector';
import { SpineSlotEditor } from './SpineSlotEditor';
import { SpinePresetGrid } from './SpinePresetGrid';
import { SpineWeaponSocketPanel } from './psd/SpineWeaponSocketPanel';
import { SpineOrientationSettingsPanel } from './SpineOrientationSettingsPanel';

interface SpinePuppetSectionProps {
  onUpdate: () => void;
}

export const SpinePuppetSection: React.FC<SpinePuppetSectionProps> = ({ onUpdate }) => {
  const [selectedSlot, setSelectedSlot] = useState<SpineSlotKey>('head');
  const puppetConfig = customSkinManager.getSpinePuppet();

  const handleUpdate = () => {
    onUpdate();
  };

  const activeSlotData = puppetConfig.slots[selectedSlot];

  return (
    <div className="flex flex-col gap-4">
      {/* Live Animated Canvas Preview with Motion Test Buttons */}
      <SpinePreviewCanvas config={puppetConfig} onUpdate={handleUpdate} />

      {/* Base Body Orientation & Mirror Settings */}
      <SpineOrientationSettingsPanel config={puppetConfig} onUpdate={handleUpdate} />

      {/* 6-Slot Visual Modular Selector */}
      <SpineSlotSelector
        slots={puppetConfig.slots}
        selectedSlot={selectedSlot}
        onSelectSlot={(slot) => setSelectedSlot(slot)}
      />

      {/* Active Slot Fine-Tuner & PNG Uploader */}
      {activeSlotData && (
        <SpineSlotEditor
          slotId={selectedSlot}
          slotData={activeSlotData}
          onUpdate={handleUpdate}
        />
      )}

      {/* Weapon Position & Layer Adjustment Panel (Always accessible) */}
      <SpineWeaponSocketPanel
        config={puppetConfig}
        onUpdate={handleUpdate}
      />

      {/* Presets & Config Import/Export */}
      <SpinePresetGrid
        currentPresetName={puppetConfig.name}
        onSelect={handleUpdate}
      />
    </div>
  );
};
