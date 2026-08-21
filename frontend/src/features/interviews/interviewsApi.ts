import { api } from '@/services/api';
import { Interview } from '@/types';

export interface CreateInterviewPayload {
  round_type: 'hr_screening' | 'technical' | 'coding' | 'system_design' | 'managerial' | 'hr' | 'final' | 'other';
  scheduled_at: string;
  interviewer?: string;
  result?: 'scheduled' | 'completed' | 'passed' | 'failed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  notes?: string;
}

export const interviewsApi = {
  async getJobInterviews(jobId: string): Promise<Interview[]> {
    const res = await api.get<Interview[]>(`/interviews/job/${jobId}/`);
    return res.data || [];
  },

  async scheduleInterview(jobId: string, payload: CreateInterviewPayload): Promise<Interview> {
    const res = await api.post<Interview>(`/interviews/job/${jobId}/`, payload);
    return res.data;
  },

  async updateInterview(id: string, payload: Partial<CreateInterviewPayload>): Promise<Interview> {
    const res = await api.patch<Interview>(`/interviews/${id}/`, payload);
    return res.data;
  },

  async deleteInterview(id: string): Promise<void> {
    await api.delete(`/interviews/${id}/`);
  },

  async getUpcomingInterviews(): Promise<Interview[]> {
    const res = await api.get<Interview[]>('/interviews/upcoming/');
    return res.data || [];
  },
};
