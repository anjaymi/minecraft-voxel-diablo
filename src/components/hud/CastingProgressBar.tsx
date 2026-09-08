import React, { useState, useEffect, useRef } from 'react';
import { Player, CharacterClassId } from '../../types';
import { Sparkles, Flame, Zap, Wand2 } from 'lucide-react';

interface CastingProgressBarProps {
  player: Player;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

export const CastingProgressBar: React.FC<CastingProgressBarProps> = ({ player }) => {
  const classId: CharacterClassId = player.characterClass || 'warrior';
  const isCasterClass = classId === 'mage' || classId === 'druid' || classId === 'summoner';

  // Charging attack state
  const isCharging = Boolean(player.isChargingAttack && (player.chargeTime || 0) > 0.04);
  const chargeTime = player.chargeTime || 0;
  const maxChargeTime = player.maxChargeTime || 0.72;
  const chargeRatio = Math.min(1.0, Math.max(0, chargeTime / Math.max(0.1, maxChargeTime)));

  // Channeled or cast-lock skill state
  const isCasting = Boolean(player.isCastingSpell && (player.castLockTimer || 0) > 0);
  const castElapsed = (player.castTotalTime || 0.5) - (player.castLockTimer || 0);
  const castRatio = Math.min(1.0, Math.max(0, castElapsed / Math.max(0.1, player.castTotalTime || 0.5)));

  const isActive = isCharging || isCasting;
  const currentRatio = isCharging ? chargeRatio : castRatio;
  const isMaxCharged = isCharging ? chargeRatio >= 0.98 : currentRatio >= 0.95;

  // Track release event for Screen Shake & Particle Explosion
  const wasActiveRef = useRef(false);
  const lastRatioRef = useRef(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showReleaseBanner, setShowReleaseBanner] = useState(false);
  const [releaseLabel, setReleaseLabel] = useState('');
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);

  // Update ratio tracking
  useEffect(() => {
    if (isActive) {
      lastRatioRef.current = currentRatio;
    }
  }, [isActive, currentRatio]);

  // Handle release trigger
  useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      const releasedRatio = lastRatioRef.current;
      if (releasedRatio >= 0.25) {
        // Trigger Screen Shake
        setIsShaking(true);
        setShowReleaseBanner(true);
        setReleaseLabel(
          releasedRatio >= 0.95
            ? '🔥 满额极度爆发 · 强力震荡!'
            : '⚡ 破空引爆 · 蓄能释放!'
        );

        // Spawn Burst Particles
        const newParticles: BurstParticle[] = [];
        const particleCount = releasedRatio >= 0.9 ? 28 : 16;
        const colorPalette =
          classId === 'druid'
            ? ['#10b981', '#34d399', '#f59e0b', '#a7f3d0']
            : classId === 'summoner'
            ? ['#06b6d4', '#22d3ee', '#c084fc', '#e0f2fe']
            : ['#a855f7', '#c084fc', '#38bdf8', '#f43f5e'];

        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
          const speed = 40 + Math.random() * 90;
          newParticles.push({
            id: Date.now() + i,
            x: 0,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: colorPalette[i % colorPalette.length],
            size: 4 + Math.random() * 6,
            life: 1.0,
          });
        }
        setBurstParticles(newParticles);

        const timer = setTimeout(() => {
          setIsShaking(false);
        }, 320);

        const bannerTimer = setTimeout(() => {
          setShowReleaseBanner(false);
          setBurstParticles([]);
        }, 550);

        return () => {
          clearTimeout(timer);
          clearTimeout(bannerTimer);
        };
      }
    }
    wasActiveRef.current = isActive;
  }, [isActive, classId]);

  // Particle animation tick
  useEffect(() => {
    if (burstParticles.length === 0) return;
    const interval = setInterval(() => {
      setBurstParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.03,
            y: p.y + p.vy * 0.03,
            life: p.life - 0.07,
          }))
          .filter((p) => p.life > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [burstParticles.length]);

  if (!isActive && !showReleaseBanner && burstParticles.length === 0) {
    return null;
  }

  // Visual Theme Configuration
  const getCastConfig = () => {
    if (classId === 'druid') {
      const isBear = player.wildShapeForm === 'bear';
      return {
        title: isBear ? '🐻 巨熊远古裂地 · 蓄势狂扑' : '🌿 自然风暴 · 荆棘引渡',
        colorBar: 'from-emerald-700 via-green-500 to-amber-300',
        glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.7)]',
        border: 'border-emerald-500',
        icon: isBear ? '🐾' : '🍃',
      };
    }
    if (classId === 'summoner') {
      return {
        title: player.castSpellName || '💀 噬魂聚灵仪式 · 灵魂引导',
        colorBar: 'from-slate-900 via-cyan-600 to-purple-400',
        glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.7)]',
        border: 'border-cyan-500',
        icon: '👻',
      };
    }
    if (classId === 'mage') {
      return {
        title: player.castSpellName || '🔮 星辉奥术爆发 · 聚焦引导',
        colorBar: 'from-indigo-600 via-purple-500 to-cyan-300',
        glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.7)]',
        border: 'border-purple-500',
        icon: '🪄',
      };
    }
    return {
      title: '⚔️ 狂暴蓄力重击 · 巨力汇聚',
      colorBar: 'from-red-700 via-amber-500 to-yellow-300',
      glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.7)]',
      border: 'border-amber-500',
      icon: '💥',
    };
  };

  const config = getCastConfig();

  return (
    <div
      className={`fixed bottom-36 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center select-none transition-transform ${
        isShaking ? 'animate-bounce scale-105' : ''
      }`}
    >
      {/* Screen Shake Tremor Overlay */}
      {isShaking && (
        <div className="fixed inset-0 pointer-events-none z-50 bg-white/10 mix-blend-overlay animate-pulse" />
      )}

      {/* Particle Explosion Canvas Simulation */}
      {burstParticles.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {burstParticles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full filter drop-shadow-md"
              style={{
                transform: `translate(${p.x}px, ${p.y}px)`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.life,
              }}
            />
          ))}
        </div>
      )}

      {/* Release Instant Banner Flash */}
      {showReleaseBanner && (
        <div className="mb-2 px-3.5 py-1 rounded-full bg-stone-900/95 border-2 border-amber-400 text-amber-200 text-xs font-bold font-cinzel shadow-2xl animate-pulse">
          {releaseLabel}
        </div>
      )}

      {/* Active Casting Bar Frame */}
      {isActive && (
        <div
          className={`w-72 md:w-84 rounded-lg border-2 ${config.border} bg-stone-950/95 p-2 ${config.glowColor} backdrop-blur-md flex flex-col gap-1.5`}
        >
          {/* Header & Spell Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-sm animate-pulse">{config.icon}</span>
              <span className="font-bold font-cinzel text-stone-100 tracking-wide">
                {config.title}
              </span>
            </div>
            {isMaxCharged ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500 text-stone-950 animate-bounce">
                MAX 充能完毕!
              </span>
            ) : (
              <span className="text-[10px] font-mono text-stone-400">
                {Math.round(currentRatio * 100)}%
              </span>
            )}
          </div>

          {/* Progress Bar Container */}
          <div className="relative h-4 w-full rounded bg-stone-900 border border-stone-700/80 overflow-hidden shadow-inner">
            {/* Progress Fill */}
            <div
              className={`h-full bg-gradient-to-r ${config.colorBar} transition-all duration-75 relative`}
              style={{ width: `${currentRatio * 100}%` }}
            >
              {/* Leading Sparkle Head */}
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/80 blur-[1px] animate-pulse" />
              {/* Animated Light Sweep Stripe */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>

            {/* Notch markers at 25%, 50%, 75% */}
            <div className="absolute inset-0 flex justify-between px-6 pointer-events-none opacity-40">
              <div className="w-0.5 h-full bg-white/30" />
              <div className="w-0.5 h-full bg-white/40" />
              <div className="w-0.5 h-full bg-white/30" />
            </div>
          </div>

          {/* Subtext info */}
          <div className="flex justify-between items-center text-[10px] text-stone-400 px-0.5">
            <span>{isCharging ? '释放左键释放重击' : '引导施法中...'}</span>
            <span className="font-mono text-amber-300/90">
              {isMaxCharged ? '🔥 击退 + 僵直 MAX' : '蓄力提升威力与僵直'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
