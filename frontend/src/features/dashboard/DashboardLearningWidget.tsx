import React, { useEffect, useState } from 'react';
import { RoadmapDashboardStats } from '@/types';
import { roadmapsApi } from '@/features/roadmaps/roadmapsApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Compass, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardLearningWidget: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RoadmapDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const data = await roadmapsApi.getDashboardStats();
        setStats(data);
      } catch {
        // Error
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-44 w-full rounded-2xl" />;
  }

  const activeRm = stats?.active_roadmap;

  return (
    <Card className="p-6 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">Learning Progress</h3>
              <Badge variant="indigo" size="sm">
                Active Roadmap
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              {activeRm ? activeRm.title : 'AI Skill Gap Learning System'}
            </p>
          </div>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => navigate('/courses')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue Learning
        </Button>
      </div>

      {activeRm ? (
        <div className="space-y-3 pt-1">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Roadmap Completion</span>
              <span className="text-emerald-400 font-bold">{activeRm.overall_progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${activeRm.overall_progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Roadmaps</span>
              <p className="text-sm font-bold text-slate-100">{stats?.active_roadmaps_count ?? 1}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Courses Tracked</span>
              <p className="text-sm font-bold text-purple-400">{stats?.total_courses ?? 0}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Skills In Progress</span>
              <p className="text-sm font-bold text-amber-400">{stats?.skills_in_progress ?? 0}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-300">
            No active learning roadmap currently set. Generate a roadmap to fast-track your job matching scores!
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
            Create Roadmap
          </Button>
        </div>
      )}

      {/* AI Insights bullets */}
      {stats?.ai_insights && stats.ai_insights.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Learning Insights</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {stats.ai_insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 shrink-0">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
