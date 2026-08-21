import React from 'react';
import { Card } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Filter } from 'lucide-react';

interface StatusFunnelChartProps {
  data: Array<{ status: string; label: string; count: number }>;
}

const FUNNEL_COLORS: Record<string, string> = {
  wishlist: '#64748b',
  applied: '#6366f1',
  screening: '#a855f7',
  interview: '#06b6d4',
  technical: '#3b82f6',
  managerial: '#8b5cf6',
  hr: '#d946ef',
  offer: '#10b981',
  accepted: '#059669',
  rejected: '#f43f5e',
  withdrawn: '#94a3b8',
  on_hold: '#f59e0b',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0];
    const label = dataItem.payload?.label || dataItem.name || 'Stage';
    const count = dataItem.value || 0;
    const color = dataItem.payload?.fill || FUNNEL_COLORS[dataItem.payload?.status] || '#6366f1';

    return (
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1.5 text-slate-100 z-50 min-w-40">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="font-bold text-xs text-slate-100">{label}</span>
        </div>
        <div className="text-xs text-slate-300 flex items-center justify-between gap-4">
          <span className="text-slate-400">Applications:</span>
          <span className="font-extrabold text-cyan-400">{count}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const StatusFunnelChart: React.FC<StatusFunnelChartProps> = ({ data }) => {
  const activeData = data?.filter(item => item.count > 0) || [];

  if (activeData.length === 0) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Filter className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-100">Application Pipeline Funnel</h3>
        </div>
        <div className="h-56 flex items-center justify-center text-xs text-slate-400">
          No application status data recorded yet.
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-100">Application Pipeline Funnel</h3>
        </div>
        <span className="text-xs text-slate-300 font-mono font-medium">12 Pipeline Stages</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }} allowDecimals={false} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(99, 102, 241, 0.12)' }}
              wrapperStyle={{ zIndex: 1000 }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {activeData.map((entry) => (
                <Cell key={entry.status} fill={FUNNEL_COLORS[entry.status] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
