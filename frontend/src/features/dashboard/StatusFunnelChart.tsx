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

export const StatusFunnelChart: React.FC<StatusFunnelChartProps> = ({ data }) => {
  const activeData = data?.filter(item => item.count > 0) || [];

  if (activeData.length === 0) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Filter className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-200">Application Pipeline Funnel</h3>
        </div>
        <div className="h-56 flex items-center justify-center text-xs text-slate-500">
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
          <h3 className="font-semibold text-sm text-slate-200">Application Pipeline Funnel</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">12 Pipeline Stages</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any) => [`${value} Applications`, 'Count']}
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
