import React from 'react';
import { motion } from 'motion/react';
import { CitySignal } from './CitySignal.js';
import { AIProcessing } from './AIProcessing.js';
import { GOV_REFRESH_STAGES, GOV_REFRESH_LABEL } from '../../constants/pipeline.js';

interface GovIntelligenceHeroProps {
  loading: boolean;
  processingStep: number;
  overview: Record<string, any> | null;
  lastFetchedAt: string | null;
  urgentCount: number;
}

export const GovIntelligenceHero: React.FC<GovIntelligenceHeroProps> = ({
  loading,
  processingStep,
  overview,
  lastFetchedAt,
  urgentCount,
}) => {
  return (
    <section className="relative overflow-hidden card-elevated rounded-[var(--radius-lg)] min-w-0">
      <div className="civic-grid opacity-40" aria-hidden />
      <div
        className="civic-glow w-48 h-48 -top-12 -right-8 bg-[color:var(--color-intel)]"
        aria-hidden
      />
      <div
        className="civic-glow w-36 h-36 -bottom-16 left-8 bg-retro-navy opacity-20"
        aria-hidden
      />

      <div className="relative z-[1] p-4 sm:p-5 flex flex-col gap-4 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="civic-label mb-1 text-[color:var(--color-intel)]">Civic intelligence command</p>
            <h2 className="section-heading-lg text-retro-navy break-words">
              Anonymous reports → structured civic intelligence
            </h2>
            <p className="font-body text-sm text-retro-muted mt-1 max-w-xl">
              Live queue, clusters, and AI briefing — grounded in filed reports, not identities.
            </p>
          </div>

          <dl className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
            {[
              { label: 'Total', value: overview?.total ?? '—' },
              { label: 'Urgent', value: urgentCount },
              { label: 'Clusters', value: overview?.clusters ?? '—' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-3 py-2 border border-retro-border rounded-[8px] bg-retro-card/90 min-w-[4.5rem]"
              >
                <dt className="civic-label text-[10px]">{stat.label}</dt>
                <dd className="kpi-number text-lg text-retro-text tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <CitySignal className="max-w-full" />

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-1 border-t border-retro-border/80"
          >
            <AIProcessing
              steps={GOV_REFRESH_STAGES}
              activeIndex={processingStep}
              labels={GOV_REFRESH_LABEL}
              title="Synchronizing intelligence"
              compact
            />
          </motion.div>
        ) : lastFetchedAt ? (
          <p className="font-body text-[11px] text-retro-muted flex items-center gap-1.5 pt-1 border-t border-retro-border/80">
            <span className="intel-pulse" aria-hidden />
            Last synchronized {lastFetchedAt}
          </p>
        ) : null}
      </div>
    </section>
  );
};
