import React, { useState } from 'react';
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
import { Layers } from 'lucide-react';
import type { CitizenRequest } from '../../types/index.js';
import { retroAudio } from '../../utils/retroAudio.js';

interface WardAnalyticsChartProps {
  requests: CitizenRequest[];
  onSelectWard?: (ward: string) => void;
  selectedWard?: string;
}

export const WardAnalyticsChart: React.FC<WardAnalyticsChartProps> = ({
  requests,
  onSelectWard,
  selectedWard = 'all',
}) => {
  const [chartMode, setChartMode] = useState<'grouped' | 'stacked'>('grouped');

  const wardNames = Array.from(new Set(requests.map((r) => r.ward).filter(Boolean)));

  const chartData = wardNames.map((wardName) => {
    const wardRequests = requests.filter((r) => r.ward === wardName);
    const completed = wardRequests.filter((r) => r.status === 'completed').length;
    const pending = wardRequests.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;
    const total = wardRequests.length;
    const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const shortLabel =
      'W' + wardName.split(' - ')[0].replace('Ward ', '') + ' ' + (wardName.split(' - ')[1]?.split(' ')[0] || '');

    return { ward: wardName, shortLabel, completed, pending, total, resolutionRate };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-retro-card text-retro-text p-3 border border-retro-border rounded-[3px] text-sm font-body shadow-pixel-sm">
          <p className="font-semibold mb-2">{data.ward}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-6">
              <span>Resolved</span>
              <span className="tabular-nums font-semibold">{data.completed}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Open</span>
              <span className="tabular-nums font-semibold">{data.pending}</span>
            </div>
            <div className="flex justify-between gap-6 text-retro-muted">
              <span>Total</span>
              <span className="tabular-nums">{data.total}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Resolution</span>
              <span className="tabular-nums">{data.resolutionRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.section className="card-elevated p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-retro-border">
        <div>
          <p className="civic-label mb-1">Wards</p>
          <h3 className="section-heading">Workload by jurisdiction</h3>
          <p className="font-body text-sm text-retro-muted mt-0.5">
            Resolved versus remaining reports. Click a bar to filter the table.
          </p>
        </div>
        <div className="inline-flex card-elevated p-1 rounded-lg">
          <button
            onClick={() => {
              retroAudio.playClick();
              setChartMode('grouped');
            }}
            className={`px-4 py-1.5 font-body text-sm font-semibold transition-all duration-200 ${
              chartMode === 'grouped' ? 'bg-retro-navy text-white rounded-md shadow-sm' : 'text-retro-muted hover:text-retro-text'
            }`}
          >
            Grouped
          </button>
          <button
            onClick={() => {
              retroAudio.playClick();
              setChartMode('stacked');
            }}
            className={`px-4 py-1.5 font-body text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              chartMode === 'stacked' ? 'bg-retro-navy text-white rounded-md shadow-sm' : 'text-retro-muted hover:text-retro-text'
            }`}
          >
            <Layers className="w-4 h-4" /> Stacked
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="font-body text-sm text-retro-muted py-10 text-center">No ward labels on filed reports yet.</p>
      ) : (
      <div className="mt-5 w-full h-72 sm:h-80 min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length && onSelectWard) {
                retroAudio.playClick();
                const clickedWard = state.activePayload[0].payload.ward;
                onSelectWard(selectedWard === clickedWard ? 'all' : clickedWard);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd8cc" />
            <XAxis
              dataKey="shortLabel"
              tick={{ fill: '#5a6170', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
              axisLine={{ stroke: '#c8c2b4' }}
              tickLine={false}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={48}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#5a6170', fontSize: 12, fontFamily: 'IBM Plex Sans' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11, 37, 69, 0.06)' }} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 8, fontFamily: 'IBM Plex Sans', fontSize: 12 }}
              formatter={(value) => {
                if (value === 'completed') return <span className="text-retro-success">Resolved</span>;
                if (value === 'pending') return <span className="text-retro-saffron">Open</span>;
                return value;
              }}
            />
            <Bar
              dataKey="completed"
              name="completed"
              fill="#17663f"
              stackId={chartMode === 'stacked' ? 'a' : undefined}
              radius={[2, 2, 0, 0]}
              maxBarSize={36}
              className="cursor-pointer"
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="pending"
              name="pending"
              fill="#e07020"
              stackId={chartMode === 'stacked' ? 'a' : undefined}
              radius={[2, 2, 0, 0]}
              maxBarSize={36}
              className="cursor-pointer"
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
    </motion.section>
  );
};
