import React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';

interface AIProcessingProps {
  steps: readonly string[];
  activeIndex: number;
  labels?: Record<string, string>;
  title?: string;
  compact?: boolean;
  className?: string;
}

export const AIProcessing: React.FC<AIProcessingProps> = ({
  steps,
  activeIndex,
  labels = {},
  title = 'Processing',
  compact = false,
  className = '',
}) => {
  const reduce = useReducedMotion();
  const done = activeIndex >= steps.length;

  return (
    <div
      className={`min-w-0 ${className}`}
      aria-live="polite"
      aria-busy={!done}
    >
      <div className="flex items-center gap-2 mb-2">
        {!reduce && !done && <span className="ai-dot shrink-0" aria-hidden />}
        <p className="civic-label text-[color:var(--color-intel)]">
          {title}
          {!done && steps[activeIndex] ? ` · ${labels[steps[activeIndex]] || steps[activeIndex]}` : done ? ' · complete' : ''}
        </p>
      </div>

      <ol className={`flex ${compact ? 'flex-wrap gap-1' : 'flex-col sm:flex-row sm:flex-wrap gap-1.5'}`}>
        {steps.map((step, i) => {
          const complete = i < activeIndex || done;
          const active = !done && i === activeIndex;
          const label = labels[step] || step;

          return (
            <motion.li
              key={step}
              layout={!reduce}
              className={`inline-flex items-center gap-1.5 font-body text-[11px] font-medium px-2 py-1 rounded-[6px] border min-w-0 max-w-full ${
                complete
                  ? 'border-retro-success/40 text-retro-success bg-[#e6f4ec]'
                  : active
                  ? 'border-[color:var(--color-intel)] text-[color:var(--color-intel)] bg-[color-mix(in_srgb,var(--color-intel)_8%,var(--color-card))] civic-step-active'
                  : 'border-retro-border text-retro-muted bg-retro-card'
              }`}
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.22 }}
            >
              {complete ? (
                <Check className="w-3 h-3 shrink-0" aria-hidden />
              ) : (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    active ? 'bg-[color:var(--color-intel)]' : 'bg-retro-border'
                  }`}
                  aria-hidden
                />
              )}
              <span className="truncate">{label}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
};
