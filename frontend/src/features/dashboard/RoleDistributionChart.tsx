import React from 'react';
import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface RoleDistributionChartProps {
  data: Array<{ name: string; count: number; percentage: number }>;
}

const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0];
    const roleName = dataItem.name || dataItem.payload?.name || 'Role';
    const count = dataItem.value || 0;
    const pct = dataItem.payload?.percentage ?? 0;
    const color = dataItem.color || '#6366f1';

    return (
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1.5 text-slate-100 z-50 min-w-44">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="font-bold text-xs text-slate-100 truncate">{roleName}</span>
        </div>
        <div className="text-xs text-slate-300 flex items-center justify-between gap-4">
          <span className="text-slate-400">Applications:</span>
          <span className="font-extrabold text-indigo-400">{count}</span>
        </div>
        <div className="text-xs text-slate-300 flex items-center justify-between gap-4">
          <span className="text-slate-400">Distribution:</span>
          <span className="font-extrabold text-purple-400">{pct}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <PieIcon className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-sm text-slate-100">Role Distribution</h3>
        </div>
        <div className="h-56 flex items-center justify-center text-xs text-slate-400">
          No job role data recorded yet.
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-sm text-slate-100">Target Role Breakdown</h3>
        </div>
        <span className="text-xs text-slate-300 font-mono font-medium">{data.length} Roles</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="count"
              nameKey="name"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#cbd5e1', paddingTop: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
