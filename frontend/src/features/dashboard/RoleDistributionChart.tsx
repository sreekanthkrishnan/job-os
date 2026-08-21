import React from 'react';
import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface RoleDistributionChartProps {
  data: Array<{ name: string; count: number; percentage: number }>;
}

const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <PieIcon className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-sm text-slate-200">Role Distribution</h3>
        </div>
        <div className="h-56 flex items-center justify-center text-xs text-slate-500">
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
          <h3 className="font-semibold text-sm text-slate-200">Target Role Breakdown</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">{data.length} Roles</span>
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
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: any, props: any) => [
                `${value} Applications (${props.payload.percentage}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
