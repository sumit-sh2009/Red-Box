import React from 'react';
import { Activity, AlertTriangle, Landmark, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { BriefingMarkdown } from '../BriefingMarkdown.js';
import type { CitizenRequest, GovDepartmentRank } from '../../types/index.js';
import { useCivicMotion, sectionStagger } from '../../lib/civicMotion.js';

interface IntelligenceBriefingProps {
  narrative: string;
  briefingModel: string;
  overview: Record<string, any> | null;
  clusters: Array<Record<string, any>>;
  departments: GovDepartmentRank[];
  requests: CitizenRequest[];
  generatedAt?: string;
}

function topEntry(map: Record<string, number> | undefined): { name: string; count: number; pct: number } | null {
  if (!map) return null;
  const entries = Object.entries(map);
  if (!entries.length) return null;
  const total = entries.reduce((s, [, n]) => s + Number(n), 0) || 1;
  const [name, count] = entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  return { name, count: Number(count), pct: Math.round((Number(count) / total) * 100) };
}

export const IntelligenceBriefing: React.FC<IntelligenceBriefingProps> = ({
  narrative,
  briefingModel,
  overview,
  clusters,
  departments,
  requests,
  generatedAt,
}) => {
  const topCat = topEntry(overview?.categories);
  const topWard = topEntry(overview?.wards);
  const topCluster = [...clusters].sort((a, b) => (b.size || 0) - (a.size || 0))[0];
  const worstDept = [...departments].sort((a, b) => (b.open + b.in_progress) - (a.open + a.in_progress))[0];
  const urgent = Number(overview?.urgent ?? requests.filter((r) => r.priority === 'high').length);
  const total = Number(overview?.total ?? requests.length) || 1;
  const { reduce } = useCivicMotion();

  const actions: string[] = [];
  if (topCluster) {
    actions.push(
      `Inspect the ${topCluster.title || 'largest'} cluster (${topCluster.size} related reports${topCluster.department ? `, ${topCluster.department}` : ''}).`
    );
  }
  if (topWard) {
    actions.push(`Prioritize field capacity in ${topWard.name} (${topWard.count} filings, ${topWard.pct}% of volume).`);
  }
  if (worstDept) {
    actions.push(
      `Clear unresolved workload in ${worstDept.name} (${worstDept.open + worstDept.in_progress} open or in progress).`
    );
  }

  return (
    <section className="intel-surface overflow-hidden" aria-labelledby="intel-briefing-title">
      <div 
        className="intel-surface-header flex flex-wrap items-start justify-between gap-3"
        style={{ backgroundImage: 'radial-gradient(circle at 90% 20%, color-mix(in srgb, var(--color-intel) 8%, transparent) 0%, transparent 50%)' }}
      >
        <div>
          <p className="civic-label mb-1 text-intel flex items-center gap-2">
            <span className="intel-pulse" aria-hidden />
            Red-Box intelligence briefing
          </p>
          <h2 id="intel-briefing-title" className="font-body text-lg font-semibold text-retro-text">
            Situation overview
          </h2>
        </div>
        <div className="flex items-center gap-2 font-body text-xs text-retro-muted">
          <span className="inline-flex items-center gap-1.5">
            Grounded in live civic store
          </span>
          {generatedAt && <span>· {generatedAt}</span>}
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
        <div className="xl:col-span-7 min-w-0">
          <div className="bg-retro-subtle/30 rounded-lg p-4">
            <BriefingMarkdown
              text={
                narrative ||
                'Counts below are from the civic store. The model only narrates those totals.'
              }
            />
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 bg-retro-subtle rounded-full border border-retro-border font-mono text-[11px] text-retro-muted">
            <span>{total} reports</span>
            <span>·</span>
            <span>{urgent} urgent</span>
            <span>·</span>
            <span>{overview?.clusters ?? clusters.length} clusters</span>
            {briefingModel && (
              <>
                <span>·</span>
                <span>{briefingModel.replace(/^openrouter:/, '')}</span>
              </>
            )}
          </div>
        </div>

        <motion.div
          className="xl:col-span-5 min-w-0 flex flex-col gap-3"
          variants={reduce ? undefined : sectionStagger.container}
          initial={reduce ? false : 'initial'}
          animate={reduce ? undefined : 'animate'}
        >
          <p className="civic-label">Critical signals</p>
          {topCat && (
            <motion.div variants={reduce ? undefined : sectionStagger.item} className="card-elevated border-l-[3px] border-[color:var(--color-intel)] rounded-[6px] p-3 min-w-0">
              <div className="flex items-center gap-2 civic-label mb-1">
                <Activity className="w-3.5 h-3.5 text-[color:var(--color-intel)]" />
                Dominant category
              </div>
              <p className="font-body text-sm font-semibold text-retro-text break-words">{topCat.name}</p>
              <p className="font-body text-xs text-retro-muted mt-1 tabular-nums">
                {topCat.count} filings · {topCat.pct}% of volume
              </p>
            </motion.div>
          )}
          {topWard && (
            <motion.div variants={reduce ? undefined : sectionStagger.item} className="card-elevated border-l-[3px] border-retro-saffron rounded-[6px] p-3 min-w-0">
              <div className="flex items-center gap-2 civic-label mb-1">
                <MapPin className="w-3.5 h-3.5 text-retro-saffron" />
                Geographic concentration
              </div>
              <p className="font-body text-sm font-semibold text-retro-text break-words">{topWard.name}</p>
              <p className="font-body text-xs text-retro-muted mt-1 tabular-nums">
                {topWard.count} filings · {topWard.pct}% of volume
              </p>
            </motion.div>
          )}
          {topCluster && (
            <motion.div variants={reduce ? undefined : sectionStagger.item} className="card-elevated border-l-[3px] border-retro-danger rounded-[6px] p-3 min-w-0">
              <div className="flex items-center gap-2 civic-label mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-retro-danger" />
                Largest cluster
              </div>
              <p className="font-body text-sm font-semibold text-retro-text break-words">{topCluster.title}</p>
              <p className="font-body text-xs text-retro-muted mt-1">
                {topCluster.size} reports · {topCluster.support_total ?? 0} support
                {topCluster.department ? ` · ${topCluster.department}` : ''}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {actions.length > 0 && (
        <div className="px-5 pb-5">
          <p className="civic-label mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[color:var(--color-intel)]" />
            Recommended actions
          </p>
          <motion.ol
            className="flex flex-col gap-2"
            variants={reduce ? undefined : sectionStagger.container}
            initial={reduce ? false : 'initial'}
            animate={reduce ? undefined : 'animate'}
          >
            {actions.map((a, i) => (
              <motion.li key={i} variants={reduce ? undefined : sectionStagger.item} className="card-elevated flex items-center gap-3 p-3 rounded-lg min-w-0">
                <span className="shrink-0 flex items-center justify-center font-mono text-lg font-bold text-[color:var(--color-intel)] w-8 h-8 bg-[color-mix(in_srgb,var(--color-intel)_10%,transparent)] rounded">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 font-body text-sm text-retro-text">{a}</span>
              </motion.li>
            ))}
          </motion.ol>
          {worstDept && (
            <p className="mt-3 font-body text-xs text-retro-muted flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Highest unresolved load: {worstDept.name}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
