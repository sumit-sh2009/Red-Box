import React, { useState } from 'react';
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
import { BarChart2, Layers, Trophy } from 'lucide-react';
import type { CitizenRequest } from '../types';
import { WARDS } from '../data/mockRequests';
import { retroAudio } from '../utils/retroAudio';

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

  // Compute live data for each ward
  const chartData = WARDS.map((wardName) => {
    const wardRequests = requests.filter((r) => r.ward === wardName);
    const completed = wardRequests.filter((r) => r.status === 'completed').length;
    const pending = wardRequests.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;
    const total = wardRequests.length;
    const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const shortLabel = 'W' + wardName.split(' - ')[0].replace('Ward ', '') + ' ' + (wardName.split(' - ')[1]?.split(' ')[0] || '');

    return {
      ward: wardName,
      shortLabel,
      completed,
      pending,
      total,
      resolutionRate,
    };
  });

  const topWard = [...chartData].sort((a, b) => b.completed - a.completed)[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#000000] text-white p-3 border-4 border-[#ffe600] shadow-[4px_4px_0_#000] text-xs max-w-xs font-pixel">
          <p className="text-[#ffe600] text-[10px] mb-2 border-b-2 border-[#1f0a42] pb-1">
            ZONE: {data.ward}
          </p>
          <div className="space-y-1.5 font-retro text-base">
            <div className="flex items-center justify-between text-[#00ff88]">
              <span>■ COMPLETED:</span>
              <span className="font-bold font-pixel text-xs">{data.completed}</span>
            </div>
            <div className="flex items-center justify-between text-[#ffe600]">
              <span>■ REMAINING:</span>
              <span className="font-bold font-pixel text-xs">{data.pending}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-[#1f0a42]">
              <span>TOTAL QUESTS:</span>
              <span className="font-pixel text-xs text-white">{data.total}</span>
            </div>
            <div className="flex items-center justify-between text-[#00f0ff]">
              <span>CLEAR RATE:</span>
              <span className="font-pixel text-xs">{data.resolutionRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="pixel-panel p-5 sm:p-7 mb-8">
      
      {/* 8-Bit Window Header Bar */}
      <div className="pixel-window-header -mt-5 -mx-5 sm:-mt-7 sm:-mx-7 mb-5">
        <span className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#ffe600]" />
          TELEMETRY // WARD BATTLEGROUND METRICS
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-[#00ff88] border border-black cursor-pointer" />
          <span className="inline-block w-3 h-3 bg-[#ffe600] border border-black cursor-pointer" />
          <span className="inline-block w-3 h-3 bg-[#ff0055] border border-black cursor-pointer" />
        </div>
      </div>

      {/* Control Area */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b-2 border-[#000000]">
        <div>
          <h3 className="font-pixel text-xs sm:text-sm text-white tracking-tight flex items-center gap-2">
            <span className="text-[#00f0ff]">►</span> MUNICIPAL JURISDICTION PERFORMANCE
          </h3>
          <p className="font-retro text-lg text-[#ff9900]">
            Grouped comparison: Completed Quests vs. Pending Backlog per Division
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {topWard && topWard.completed > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#000000] text-[#ffe600] border-2 border-[#ffe600] shadow-[2px_2px_0_#000] font-pixel text-[9px]">
              <Trophy className="w-3.5 h-3.5 text-[#ffe600]" />
              <span>MVP ZONE: {topWard.shortLabel} ({topWard.completed})</span>
            </div>
          )}

          {/* Grouped / Stacked toggle */}
          <div className="inline-flex bg-[#000000] p-1 border-2 border-[#000000] shadow-[2px_2px_0_#000]">
            <button
              onClick={() => {
                retroAudio.playClick();
                setChartMode('grouped');
              }}
              className={`px-3 py-1 font-pixel text-[9px] transition ${
                chartMode === 'grouped'
                  ? 'bg-[#ffe600] text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GROUPED
            </button>
            <button
              onClick={() => {
                retroAudio.playClick();
                setChartMode('stacked');
              }}
              className={`px-3 py-1 font-pixel text-[9px] transition ${
                chartMode === 'stacked'
                  ? 'bg-[#ffe600] text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" /> STACKED
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Pixel Bar Graph */}
      <div className="mt-6 w-full h-72 sm:h-80 bg-[#08041a] p-3 border-2 border-[#000000] shadow-[inset_3px_3px_0_#000]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length && onSelectWard) {
                retroAudio.playClick();
                const clickedWard = state.activePayload[0].payload.ward;
                onSelectWard(selectedWard === clickedWard ? 'all' : clickedWard);
              }
            }}
          >
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#1f0a42" />
            <XAxis
              dataKey="shortLabel"
              tick={{ fill: '#ffe600', fontSize: 10, fontFamily: 'Press Start 2P' }}
              axisLine={{ stroke: '#ffe600', strokeWidth: 2 }}
              tickLine={{ stroke: '#ffe600' }}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#00f0ff', fontSize: 11, fontFamily: 'Press Start 2P' }}
              axisLine={{ stroke: '#00f0ff', strokeWidth: 2 }}
              tickLine={{ stroke: '#00f0ff' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 230, 0, 0.1)' }} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 12, fontFamily: 'Press Start 2P', fontSize: 9 }}
              formatter={(value) => {
                if (value === 'completed') return <span className="text-[#00ff88] mr-3 font-pixel">COMPLETED TASKS</span>;
                if (value === 'pending') return <span className="text-[#ffe600] font-pixel">PENDING REMAINING</span>;
                return value;
              }}
            />
            <Bar
              dataKey="completed"
              name="completed"
              fill="#00ff88"
              stackId={chartMode === 'stacked' ? 'a' : undefined}
              radius={[0, 0, 0, 0]} /* STRICT BLOCKY */
              maxBarSize={44}
              className="cursor-pointer"
            />
            <Bar
              dataKey="pending"
              name="pending"
              fill="#ff9900"
              stackId={chartMode === 'stacked' ? 'a' : undefined}
              radius={[0, 0, 0, 0]} /* STRICT BLOCKY */
              maxBarSize={44}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ward Quick Selection Chips */}
      <div className="mt-4 pt-4 border-t-2 border-[#000000] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {chartData.map((item) => (
          <button
            key={item.ward}
            onClick={() => {
              retroAudio.playClick();
              onSelectWard && onSelectWard(selectedWard === item.ward ? 'all' : item.ward);
            }}
            className={`p-2 text-left transition border-2 ${
              selectedWard === item.ward
                ? 'bg-[#ffe600] text-black border-black shadow-[3px_3px_0_#000] font-bold'
                : 'bg-[#08041a] hover:bg-[#1a0933] text-slate-200 border-black shadow-[2px_2px_0_#000]'
            }`}
          >
            <div className="font-pixel text-[8px] truncate" title={item.ward}>
              {item.shortLabel}
            </div>
            <div className="flex items-center gap-2 mt-1 font-retro text-sm">
              <span className="text-[#00ff88] font-bold">✓ {item.completed}</span>
              <span className="text-[#ffe600] font-bold">⏳ {item.pending}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
