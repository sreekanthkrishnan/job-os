import { api } from '@/services/api';
import { Job, JobStatus, PaginatedResponse } from '@/types';

export interface CreateJobPayload {
  company: string;
  role: string;
  location?: string;
  work_mode?: 'remote' | 'hybrid' | 'onsite';
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience_required?: string;
  salary?: string;
  applied_date: string;
  status: JobStatus;
  job_url?: string;
  raw_description?: string;
  skills?: string[];
}

export interface GetJobsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  role?: string;
  work_mode?: string;
  min_match_score?: number;
  ordering?: string;
}

export interface AnalyzeJobResponse {
  company: string;
  role: string;
  location: string;
  work_mode: 'remote' | 'hybrid' | 'onsite';
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience_required: string;
  salary: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  matching_skills: string[];
  missing_skills: string[];
  match_score: number;
  source?: string;
}

export const jobsApi = {
  async getJobs(params?: GetJobsQueryParams): Promise<PaginatedResponse<Job>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.role && params.role !== 'all') query.append('role', params.role);
    if (params?.work_mode && params.work_mode !== 'all') query.append('work_mode', params.work_mode);
    if (params?.min_match_score) query.append('min_match_score', params.min_match_score.toString());
    if (params?.ordering) query.append('ordering', params.ordering);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get<any>(`/jobs/${queryString}`);
    
    if (res.data && Array.isArray(res.data)) {
      return {
        data: res.data,
        pagination: (res as any).pagination || { page: 1, pageSize: res.data.length, total: res.data.length, totalPages: 1 }
      };
    }
    return res as unknown as PaginatedResponse<Job>;
  },

  async getJobById(id: string): Promise<Job> {
    const res = await api.get<Job>(`/jobs/${id}/`);
    return res.data;
  },

  async createJob(payload: CreateJobPayload): Promise<Job> {
    const res = await api.post<Job>('/jobs/', payload);
    return res.data;
  },

  async updateJob(id: string, payload: Partial<CreateJobPayload>): Promise<Job> {
    const res = await api.patch<Job>(`/jobs/${id}/`, payload);
    return res.data;
  },

  async updateJobStatus(id: string, status: JobStatus): Promise<Job> {
    const res = await api.patch<Job>(`/jobs/${id}/status/`, { status });
    return res.data;
  },

  async deleteJob(id: string): Promise<void> {
    await api.delete(`/jobs/${id}/`);
  },

  async analyzeJobDescription(rawDescription: string): Promise<AnalyzeJobResponse> {
    const res = await api.post<AnalyzeJobResponse>('/jobs/analyze/', { raw_description: rawDescription });
    return res.data;
  },

  async exportJobsExcel(): Promise<Blob> {
    return await api.getBlob('/jobs/export/excel/');
  },

  async exportJobsCsv(): Promise<Blob> {
    return await api.getBlob('/jobs/export/csv/');
  },
};
