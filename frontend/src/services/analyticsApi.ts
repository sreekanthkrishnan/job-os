import { api } from './api';

export interface AnalyticsOverviewData {
  total_jobs: number;
  total_applied: number;
  interviews_scheduled: number;
  rejected_count: number;
  active_count: number;
  offers_count: number;
  response_rate: number;
  conversion_rate: number;
  role_distribution: Array<{ name: string; count: number; percentage: number }>;
  status_funnel: Array<{ status: string; label: string; count: number }>;
  top_missing_skills: Array<{ skill_name: string; count: number }>;
  recent_jobs: Array<{
    id: string;
    company: string;
    role: string;
    status: string;
    applied_date: string;
    match_score: number;
  }>;
  upcoming_interviews: Array<{
    id: string;
    job_id: string;
    job_company: string;
    job_role: string;
    round_type: string;
    scheduled_at: string;
    interviewer?: string;
    result: string;
  }>;
  resumes_performance?: Array<{
    id: string;
    name: string;
    target_role?: string;
    version: number;
    applications_count: number;
    responses_count: number;
    interviews_count: number;
    offers_count: number;
    response_rate: number;
    interview_rate: number;
  }>;
  best_performing_resume?: {
    id: string;
    name: string;
    response_rate: number;
    interview_rate: number;
    applications_count: number;
  } | null;
  top_resume_improvement_opportunity?: string;
}

export const analyticsApi = {
  async getOverview(): Promise<AnalyticsOverviewData> {
    const res = await api.get<AnalyticsOverviewData>('/analytics/overview/');
    return res.data;
  },
};
