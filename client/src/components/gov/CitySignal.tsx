import React from 'react';
import { Users, FileText, Sparkles, Radio, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';

const STAGES = [
  { id: 'citizens', label: 'Citizens', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'signals', label: 'Signals', icon: Radio },
  { id: 'action', label: 'Action', icon: ArrowRight },
] as const;

interface CitySignalProps {
  className?: string;
  compact?: boolean;
}

export const CitySignal: React.FC<CitySignalProps> = ({ className = '', compact = false }) => {
  const reduce = useReducedMotion();

  return (
    <div
      className={`relative w-full min-w-0 overflow-x-auto scrollbar-none ${className}`}
      aria-hidden={compact}
      role="img"
      aria-label="Anonymous reports flow through AI into civic intelligence and action"
    >
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2 sm:gap-3'} min-w-0`}>
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isAi = stage.id === 'ai';
          return (
            <React.Fragment key={stage.id}>
              <motion.div
                className={`flex flex-col items-center shrink-0 ${compact ? 'gap-0.5' : 'gap-1.5'}`}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={`relative flex items-center justify-center rounded-full border ${
                    isAi
                      ? 'border-[color:var(--color-intel)] bg-[color-mix(in_srgb,var(--color-intel)_10%,var(--color-card))]'
                      : 'border-retro-border bg-retro-card'
                  } ${compact ? 'w-7 h-7' : 'w-9 h-9 sm:w-10 sm:h-10'}`}
                >
                  <Icon
                    className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} ${
                      isAi ? 'text-[color:var(--color-intel)]' : 'text-retro-navy'
                    }`}
                  />
                  {isAi && !reduce && <span className="ai-dot absolute -top-0.5 -right-0.5" />}
                </div>
                {!compact && (
                  <span className="font-body text-[10px] sm:text-[11px] font-medium text-retro-muted whitespace-nowrap">
                    {stage.label}
                  </span>
                )}
              </motion.div>

              {i < STAGES.length - 1 && (
                <div className={`flex-1 min-w-[12px] max-w-[72px] relative ${compact ? 'h-px' : 'h-2'}`}>
                  <div className="city-signal-track h-full w-full rounded-full">
                    {!reduce && <span className="city-signal-pulse" style={{ animationDelay: `${i * 0.9}s` }} />}
                    {!reduce &&
                      [25, 50, 75].map((left, ni) => (
                        <span
                          key={`${stage.id}-${left}`}
                          className="city-signal-node"
                          style={{
                            left: `${left}%`,
                            animationDelay: `${i * 0.6 + ni * 0.35}s`,
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
