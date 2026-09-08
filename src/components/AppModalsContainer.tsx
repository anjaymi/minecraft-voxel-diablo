import React from 'react';
import { GameEngine } from '../engine/gameEngine';
import { Player, Item, EnchantmentChoice } from '../types';
import { InventoryModal } from './InventoryModal';
import { LevelUpModal } from './LevelUpModal';
import { CampHubModal } from './CampHubModal';
import { ClassSelectModal } from './ClassSelectModal';
import { SkillTreeModal } from './SkillTreeModal';
import { CustomSkinModal } from './skin/CustomSkinModal';
import { WeaponSocketModal } from './skin/weapon/WeaponSocketModal';
import { AttackMotionConfigModal } from './AttackMotionConfigModal';
import { GameOverModal } from './GameOverModal';
import { GameGuideModal } from './GameGuideModal';
import { soundManager } from '../audio/soundManager';

interface AppModalsContainerProps {
  engine: GameEngine | null;
  player: Player | undefined;
  isInventoryOpen: boolean;
  setIsInventoryOpen: (open: boolean) => void;
  isCampOpen: boolean;
  setIsCampOpen: (open: boolean) => void;
  isClassSelectOpen: boolean;
  setIsClassSelectOpen: (open: boolean) => void;
  isSkillTreeOpen: boolean;
  setIsSkillTreeOpen: (open: boolean) => void;
  isSkinModalOpen: boolean;
  setIsSkinModalOpen: (open: boolean) => void;
  isWeaponModalOpen: boolean;
  setIsWeaponModalOpen: (open: boolean) => void;
  isAttackMotionModalOpen: boolean;
  setIsAttackMotionModalOpen: (open: boolean) => void;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  onSkillTreeUpdate: () => void;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = ({
  engine,
  player,
  isInventoryOpen,
  setIsInventoryOpen,
  isCampOpen,
  setIsCampOpen,
  isClassSelectOpen,
  setIsClassSelectOpen,
  isSkillTreeOpen,
  setIsSkillTreeOpen,
  isSkinModalOpen,
  setIsSkinModalOpen,
  isWeaponModalOpen,
  setIsWeaponModalOpen,
  isAttackMotionModalOpen,
  setIsAttackMotionModalOpen,
  isGuideOpen,
  setIsGuideOpen,
  onSkillTreeUpdate,
}) => {
  return (
    <div
      className="modal-portal-root"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {/* Inventory & Gear Paper Doll Modal */}
      {isInventoryOpen && player && (
        <InventoryModal
          player={player}
          onClose={() => setIsInventoryOpen(false)}
          onOpenSkinModal={() => setIsSkinModalOpen(true)}
          onOpenWeaponModal={() => setIsWeaponModalOpen(true)}
          onEquipItem={(item: Item) => engine?.equipItem(item)}
          onUnequipItem={(slot) => engine?.unequipItem(slot)}
          onSellItem={(item: Item) => {
            if (!engine) return;
            engine.player.stats.emeralds += item.value;
            const idx = engine.player.inventory.indexOf(item);
            if (idx !== -1) engine.player.inventory.splice(idx, 1);
            soundManager.playEmeraldPickup();
          }}
        />
      )}

      {/* Roguelike 3-Card Level Up Enchantment Draft */}
      {engine?.isLevelingUp && (
        <LevelUpModal
          level={player?.stats.level || 1}
          choices={engine.currentLevelUpChoices}
          onSelect={(choice: EnchantmentChoice) => engine.selectEnchantment(choice)}
        />
      )}

      {/* Village Hub Modal */}
      {isCampOpen && player && (
        <CampHubModal
          player={player}
          onClose={() => setIsCampOpen(false)}
          onEnchantAdded={(name: string) => {
            engine?.addFloatingText(engine.player.x, engine.player.y, `觉醒附魔: ${name}`, '#c084fc', 18);
          }}
        />
      )}

      {/* Hero Class Selection Sanctuary Modal */}
      {isClassSelectOpen && player && (
        <ClassSelectModal
          currentClassId={player.characterClass || 'warrior'}
          onSelectClass={(classId, replaceGear) => {
            engine?.changePlayerClass(classId, replaceGear);
          }}
          onClose={() => setIsClassSelectOpen(false)}
        />
      )}

      {/* Skill Tree Modal */}
      {isSkillTreeOpen && player && (
        <SkillTreeModal
          player={player}
          onClose={() => setIsSkillTreeOpen(false)}
          onUpdate={onSkillTreeUpdate}
        />
      )}

      {/* Custom Avatar & PNG Skin Modal */}
      {isSkinModalOpen && (
        <CustomSkinModal
          onClose={() => setIsSkinModalOpen(false)}
          onOpenWeaponModal={() => setIsWeaponModalOpen(true)}
        />
      )}

      {/* Weapon Socket & Hand Bone Real-time Configurator Modal */}
      {isWeaponModalOpen && (
        <WeaponSocketModal
          isOpen={isWeaponModalOpen}
          onClose={() => setIsWeaponModalOpen(false)}
          player={player}
        />
      )}

      {/* Attack Motion & Keyframe Tween Controller Modal */}
      {isAttackMotionModalOpen && engine && (
        <AttackMotionConfigModal
          engine={engine}
          isOpen={isAttackMotionModalOpen}
          onClose={() => setIsAttackMotionModalOpen(false)}
        />
      )}

      {/* Game Over / Victory Modal */}
      {(engine?.isGameOver || engine?.isVictory) && player && (
        <GameOverModal
          isVictory={Boolean(engine.isVictory)}
          player={player}
          floorNumber={engine.floor.floorNumber}
          totalKills={engine.totalKills}
          bossesDefeated={engine.bossDefeatedCount}
          onRestart={() => engine.resetRun()}
        />
      )}

      {/* Game Guide Modal */}
      <GameGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
