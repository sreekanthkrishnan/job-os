import { api } from '@/services/api';
import {
  Resume,
  ResumeJobAnalysis,
  ResumeOptimization,
  OutreachMessage
} from '@/types';

export interface CreateResumePayload {
  name: string;
  target_role?: string;
  description?: string;
  version?: number;
  file: File;
}

export interface UpdateResumePayload {
  name?: string;
  target_role?: string;
  description?: string;
  is_active?: boolean;
}

export interface GenerateOutreachPayload {
  resume_id?: string;
  channel: 'email' | 'linkedin';
  tone: 'professional' | 'concise' | 'confident' | 'friendly' | 'technical';
  recipient_name?: string;
  recipient_role?: string;
  modifier?: 'shorter' | 'direct' | 'technical' | '';
}

export const resumesApi = {
  async getResumes(): Promise<Resume[]> {
    const res = await api.get<any>('/resumes/');
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data?.results)) return res.data.results;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.results)) return res.results;
    return [];
  },

  async getResumeById(id: string): Promise<Resume> {
    const res = await api.get<Resume>(`/resumes/${id}/`);
    return res.data;
  },

  async uploadResume(payload: CreateResumePayload): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('name', payload.name);
    if (payload.target_role) formData.append('target_role', payload.target_role);
    if (payload.description) formData.append('description', payload.description);
    if (payload.version) formData.append('version', payload.version.toString());

    const res = await api.postForm<Resume>('/resumes/', formData);
    return res.data;
  },

  async updateResume(id: string, payload: UpdateResumePayload): Promise<Resume> {
    const res = await api.patch<Resume>(`/resumes/${id}/`, payload);
    return res.data;
  },

  async deleteResume(id: string): Promise<void> {
    await api.delete(`/resumes/${id}/`);
  },

  async analyzeResume(id: string): Promise<Resume> {
    const res = await api.post<Resume>(`/resumes/${id}/analyze/`);
    return res.data;
  },

  async createResumeVersion(id: string, payload: { notes?: string; raw_text?: string; job_id?: string }): Promise<any> {
    const res = await api.post(`/resumes/${id}/create-version/`, payload);
    return res.data;
  },

  // Job Resume Intelligence endpoints

  async analyzeJobResumes(jobId: string): Promise<ResumeJobAnalysis[]> {
    const res = await api.post<ResumeJobAnalysis[]>(`/jobs/${jobId}/analyze-resumes/`);
    return res.data || [];
  },

  async getJobResumeAnalyses(jobId: string): Promise<ResumeJobAnalysis[]> {
    const res = await api.get<ResumeJobAnalysis[]>(`/jobs/${jobId}/resume-analysis/`);
    return res.data || [];
  },

  async getRecommendedResume(jobId: string): Promise<ResumeJobAnalysis> {
    const res = await api.get<ResumeJobAnalysis>(`/jobs/${jobId}/recommended-resume/`);
    return res.data;
  },

  async optimizeResumeForJob(jobId: string, resumeId?: string): Promise<ResumeOptimization> {
    const res = await api.post<ResumeOptimization>(`/jobs/${jobId}/resume-optimize/`, { resume_id: resumeId });
    return res.data;
  },

  async generateOutreach(jobId: string, payload: GenerateOutreachPayload): Promise<OutreachMessage> {
    const res = await api.post<OutreachMessage>(`/jobs/${jobId}/generate-outreach/`, payload);
    return res.data;
  },

  async getJobOutreachMessages(jobId: string): Promise<OutreachMessage[]> {
    const res = await api.get<OutreachMessage[]>(`/jobs/${jobId}/outreach/`);
    return res.data || [];
  },

  async selectJobResume(jobId: string, resumeId: string | null): Promise<void> {
    await api.post(`/jobs/${jobId}/select-resume/`, { resume_id: resumeId });
  }
};
