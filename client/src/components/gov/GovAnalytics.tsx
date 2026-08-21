import React from 'react';
import { motion } from 'motion/react';
import { useCivicMotion } from '../../lib/civicMotion.js';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { GovCategoryStatus } from '../../types/index.js';

interface GovAnalyticsProps {
  daily: Array<{ date: string; count: number }>;
  categories: Record<string, number>;
  categoryStatus?: GovCategoryStatus[];
}

const tooltipStyle = {
  background: 'var(--color-card, #fcfbf8)',
  border: '1px solid var(--color-border, #d4cec2)',
  borderRadius: 8,
  fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(11, 37, 69, 0.1)',
  padding: '10px 14px',
};

const CIVIC_PALETTE = [
  'var(--color-navy, #0b2545)',
  'var(--color-saffron, #c65d12)',  
  'var(--color-success, #17663f)',
  'var(--color-muted, #5c6370)',
  'var(--color-primary-hover, #163a66)',
  'var(--color-danger, #b42318)',
  'var(--color-border, #c8c2b4)',
  'var(--color-intel, #4a2bc2)',
  'var(--color-accent-hover, #a34c0e)',
  'var(--color-status-resolved, #17663f)',
];

export const GovAnalytics: React.FC<GovAnalyticsProps> = ({
  daily,
  categories,
  categoryStatus = [],
}) => {
  const civicMotion = useCivicMotion();

  const trendData = daily.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  const categoryData = Object.entries(categories)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const donutTotal = categoryData.reduce((n, d) => n + d.count, 0);
  const stacked = categoryStatus.map((row) => ({
    ...row,
    name: row.category,
  }));

  const hasTrend = trendData.length > 0;
  const hasCats = categoryData.length > 0;
  const hasStacked = stacked.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <motion.div className="grid grid-cols-1 xl:grid-cols-2 gap-4" {...civicMotion.list}>
        <motion.section className="card-elevated p-5 min-w-0" {...civicMotion.item}>
          <p className="civic-label mb-1">Trends</p>
          <h3 className="section-heading">Filings over time</h3>
          <p className="font-body text-sm text-retro-muted mt-0.5 mb-4">
            Daily counts from the live database (last 30 days with activity).
          </p>
          {!hasTrend ? (
            <p className="font-body text-sm text-retro-muted py-10 text-center">No dated filings yet.</p>
          ) : (
            <div className="w-full h-64 min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd8cc" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#5a6170', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                    axisLine={{ stroke: '#c8c2b4' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#5a6170', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Reports"
                    stroke="#0b2545"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#e07020', stroke: '#0b2545' }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.section>

        <motion.section className="card-elevated p-5 min-w-0" {...civicMotion.item}>
          <p className="civic-label mb-1">Categories</p>
          <h3 className="section-heading">Issue mix</h3>
          <p className="font-body text-sm text-retro-muted mt-0.5 mb-4">
            Share of classified reports. Unclassified is included when present.
          </p>
          {!hasCats ? (
            <p className="font-body text-sm text-retro-muted py-10 text-center">No categories yet.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="w-full sm:w-[46%] h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={1}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={entry.name} fill={CIVIC_PALETTE[i % CIVIC_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => {
                        const n = Number(value ?? 0);
                        return [
                          `${n} (${donutTotal ? Math.round((n / donutTotal) * 100) : 0}%)`,
                          String(name),
                        ];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 w-full max-h-56 overflow-y-auto font-body text-xs space-y-1.5 pr-1">
                {categoryData.map((d, i) => (
                  <li key={d.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 shrink-0 border border-black/10"
                        style={{ backgroundColor: CIVIC_PALETTE[i % CIVIC_PALETTE.length] }}
                        aria-hidden
                      />
                      <span className="truncate text-retro-text">{d.name}</span>
                    </span>
                    <span className="tabular-nums text-retro-muted shrink-0">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.section>
      </motion.div>

      <motion.div className="grid grid-cols-1 xl:grid-cols-2 gap-4" {...civicMotion.list}>
        <motion.section className="card-elevated p-5 min-w-0" {...civicMotion.item}>
          <p className="civic-label mb-1">Categories</p>
          <h3 className="section-heading">Volume by issue type</h3>
          <p className="font-body text-sm text-retro-muted mt-0.5 mb-4">
            Absolute counts from the same category totals as the snapshot.
          </p>
          {!hasCats ? (
            <p className="font-body text-sm text-retro-muted py-10 text-center">No categories yet.</p>
          ) : (
            <div className="w-full h-64 min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ddd8cc" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#5a6170', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={118}
                    tick={{ fill: '#12151c', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Reports" fill="#0b2545" maxBarSize={18} radius={[0, 2, 2, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.section>

        <motion.section className="card-elevated p-5 min-w-0" {...civicMotion.item}>
          <p className="civic-label mb-1">Pipeline</p>
          <h3 className="section-heading">Status by category</h3>
          <p className="font-body text-sm text-retro-muted mt-0.5 mb-4">
            Open, in progress, resolved, and closed — stacked from live complaint status.
          </p>
          {!hasStacked ? (
            <p className="font-body text-sm text-retro-muted py-10 text-center">No status mix yet.</p>
          ) : (
            <div className="w-full h-64 min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stacked} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ddd8cc" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#5a6170', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={118}
                    tick={{ fill: '#12151c', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontFamily: 'IBM Plex Sans', fontSize: 11 }}
                    formatter={(v) => {
                      if (v === 'open') return 'Open';
                      if (v === 'in_progress') return 'In progress';
                      if (v === 'resolved') return 'Resolved';
                      if (v === 'rejected') return 'Closed';
                      return v;
                    }}
                  />
                  <Bar dataKey="open" stackId="s" fill="#0b2545" maxBarSize={16} name="open" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                  <Bar dataKey="in_progress" stackId="s" fill="#e07020" maxBarSize={16} name="in_progress" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                  <Bar dataKey="resolved" stackId="s" fill="#17663f" maxBarSize={16} name="resolved" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                  <Bar dataKey="rejected" stackId="s" fill="#5a6170" maxBarSize={16} name="rejected" radius={[0, 2, 2, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
};
