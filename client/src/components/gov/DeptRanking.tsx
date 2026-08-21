import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { GovDepartmentRank } from '../../types/index.js';

const tooltipStyle = {
  background: 'var(--color-card, #fcfbf8)',
  border: '1px solid var(--color-border, #d4cec2)',
  borderRadius: 8,
  fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(11, 37, 69, 0.1)',
  padding: '10px 14px',
};

interface DeptRankingProps {
  departments: GovDepartmentRank[];
}

export const DeptRanking: React.FC<DeptRankingProps> = ({ departments }) => {
  const chartData = departments.map((d) => ({
    name: d.name.replace(' Department', '').replace(' / ', '/'),
    fullName: d.name,
    resolved: d.resolved,
    open: d.open + d.in_progress,
    total: d.total,
  }));

  return (
    <motion.section className="card-elevated p-5 flex flex-col gap-5">
      <div>
        <p className="civic-label mb-1">Who should act</p>
        <h3 className="section-heading">Institute ranking</h3>
        <p className="font-body text-sm text-retro-muted mt-0.5">
          Departments ranked by resolved reports, then total routed load. Counts come from AI routing and cluster assignment.
        </p>
      </div>

      {departments.length === 0 ? (
        <p className="font-body text-sm text-retro-muted py-6 text-center">No routed reports yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg overflow-hidden">
            <table className="w-full text-left font-body text-sm border-collapse">
              <caption className="sr-only">Government departments ranked by work on civic reports</caption>
              <thead className="bg-retro-subtle/60">
                <tr className="civic-label border-b border-retro-border">
                  <th scope="col" className="py-2 pl-3 pr-3 font-medium">#</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Department</th>
                  <th scope="col" className="py-2 pr-3 font-medium text-right">Routed</th>
                  <th scope="col" className="py-2 pr-3 font-medium text-right">Resolved</th>
                  <th scope="col" className="py-2 pr-3 font-medium text-right">Open</th>
                  <th scope="col" className="py-2 pr-3 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d, i) => (
                  <tr key={d.id} className="border-b border-retro-border/70 hover:bg-retro-subtle/40 transition-colors duration-150">
                    <td className="py-2.5 pl-3 pr-3 font-mono text-xs text-retro-muted">{i + 1}</td>
                    <td className="py-2.5 pr-3 font-semibold text-retro-text">{d.name}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{d.total}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-retro-success">{d.resolved}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{d.open + d.in_progress}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{d.resolution_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
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
                  width={148}
                  tick={{ fill: '#12151c', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, key) => [
                    Number(value ?? 0),
                    key === 'resolved' ? 'Resolved' : 'Open load',
                  ]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                />
                <Legend
                  wrapperStyle={{ fontFamily: 'IBM Plex Sans', fontSize: 12 }}
                  formatter={(value) => (value === 'resolved' ? 'Resolved' : 'Open (incl. in progress)')}
                />
                <Bar dataKey="resolved" name="resolved" fill="#17663f" maxBarSize={16} stackId="work" radius={[0, 0, 0, 0]} animationDuration={800} animationEasing="ease-out" />
                <Bar dataKey="open" name="open" fill="#e07020" maxBarSize={16} stackId="work" radius={[0, 2, 2, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </motion.section>
  );
};
