import React, { useState, useEffect } from 'react';
import { analyticsApi, AnalyticsOverviewData } from '@/services/analyticsApi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RoleDistributionChart } from './RoleDistributionChart';
import { StatusFunnelChart } from './StatusFunnelChart';
import { SkillGapHeatmapWidget } from './SkillGapHeatmapWidget';
import { RecentApplicationsTable } from './RecentApplicationsTable';
import { UpcomingInterviewsWidget } from '@/features/interviews/UpcomingInterviewsWidget';
import {
  Briefcase, Calendar, CheckCircle2, Sparkles, TrendingUp,
  XCircle, Percent, Award, Plus, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const res = await analyticsApi.getOverview();
        setData(res);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const overview = data || {
    total_jobs: 0,
    total_applied: 0,
    interviews_scheduled: 0,
    rejected_count: 0,
    active_count: 0,
    offers_count: 0,
    response_rate: 0.0,
    conversion_rate: 0.0,
    role_distribution: [],
    status_funnel: [],
    top_missing_skills: [],
    recent_jobs: [],
    upcoming_interviews: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative glass-panel rounded-2xl p-6 sm:p-8 overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo" pulse>Phase 8 Analytics Dashboard Live</Badge>
            <Badge variant="purple">AI Skills Engine Active</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            Career Command Center — <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">JobOS</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Monitor real-time application conversion funnels, target role breakdowns, AI skill match gap heatmaps, and interview schedules.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button variant="gradient" onClick={() => navigate('/jobs')} leftIcon={<Plus className="w-4 h-4" />}>
              Add Application
            </Button>
            <Button variant="outline" onClick={() => navigate('/courses')}>
              View Courses & Skills
            </Button>
          </div>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 hidden md:block">
          <Sparkles className="w-64 h-64 text-indigo-400" />
        </div>
      </div>

      {/* 7 Dynamic KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card hoverEffect className="space-y-1.5 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Applied</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{overview.total_applied}</div>
          <p className="text-[10px] text-slate-500">Submitted jobs</p>
        </Card>

        <Card hoverEffect className="space-y-1.5 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Interviews</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{overview.interviews_scheduled}</div>
          <p className="text-[10px] text-slate-500">Rounds active</p>
        </Card>

        <Card hoverEffect className="space-y-1.5 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{overview.active_count}</div>
          <p className="text-[10px] text-slate-500">In pipeline</p>
        </Card>

        <Card hoverEffect className="space-y-1.5 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Offers</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{overview.offers_count}</div>
          <p className="text-[10px] text-slate-500">Secured offers</p>
        </Card>

        <Card hoverEffect className="space-y-1.5 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{overview.rejected_count}</div>
          <p className="text-[10px] text-slate-500">Closed outcomes</p>
        </Card>

        <Card hoverEffect className="space-y-1.5 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Response %</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">{overview.response_rate}%</div>
          <p className="text-[10px] text-slate-500">Outreach response</p>
        </Card>

        <Card hoverEffect className="space-y-1.5 p-3.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Conversion</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400">{overview.conversion_rate}%</div>
          <p className="text-[10px] text-slate-500">Offer conversion</p>
        </Card>
      </div>

      {/* Recharts Analytics Grid: Role Distribution & Status Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoleDistributionChart data={overview.role_distribution} />
        <StatusFunnelChart data={overview.status_funnel} />
      </div>

      {/* Grid: Skill Gap Heatmap & Upcoming Interviews Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillGapHeatmapWidget topMissingSkills={overview.top_missing_skills} />
        <UpcomingInterviewsWidget />
      </div>

      {/* Resume Performance & AI Insight Card */}
      {overview.best_performing_resume && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card hoverEffect className="p-4 bg-gradient-to-tr from-indigo-950/40 via-slate-900 to-purple-950/20 border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">🏆 Top Performing Resume</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-base font-bold text-slate-100 truncate">{overview.best_performing_resume.name}</p>
            <div className="flex items-center gap-3 text-xs pt-1">
              <span className="text-emerald-400 font-semibold">{overview.best_performing_resume.response_rate}% Response</span>
              <span className="text-cyan-400 font-semibold">{overview.best_performing_resume.interview_rate}% Interview</span>
            </div>
          </Card>

          <Card hoverEffect className="md:col-span-2 p-4 bg-slate-900/60 border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Top Resume Improvement Opportunity
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate('/resumes')}>
                Manage Resumes
              </Button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
              {overview.top_resume_improvement_opportunity || "Regularly update target role resumes with verified skill proficiencies to boost call probability estimates."}
            </p>
          </Card>
        </div>
      )}

      {/* Recent Applications Table */}
      <RecentApplicationsTable recentJobs={overview.recent_jobs} />
    </div>
  );
};
