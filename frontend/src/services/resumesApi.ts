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

function unpackObject<T>(res: any): T {
  if (res && typeof res === 'object') {
    if ('data' in res && res.data !== undefined && !Array.isArray(res.data) && typeof res.data === 'object') {
      return res.data as T;
    }
    return res as T;
  }
  return res as T;
}

function unpackArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res?.data)) return res.data as T[];
  if (Array.isArray(res?.data?.results)) return res.data.results as T[];
  if (Array.isArray(res?.results)) return res.results as T[];
  return [];
}

export const resumesApi = {
  async getResumes(): Promise<Resume[]> {
    const res = await api.get<any>('/resumes/');
    return unpackArray<Resume>(res);
  },

  async getResumeById(id: string): Promise<Resume> {
    const res = await api.get<any>(`/resumes/${id}/`);
    return unpackObject<Resume>(res);
  },

  async uploadResume(payload: CreateResumePayload): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('name', payload.name);
    if (payload.target_role) formData.append('target_role', payload.target_role);
    if (payload.description) formData.append('description', payload.description);
    if (payload.version) formData.append('version', payload.version.toString());

    const res = await api.postForm<any>('/resumes/', formData);
    return unpackObject<Resume>(res);
  },

  async updateResume(id: string, payload: UpdateResumePayload): Promise<Resume> {
    const res = await api.patch<any>(`/resumes/${id}/`, payload);
    return unpackObject<Resume>(res);
  },

  async deleteResume(id: string): Promise<void> {
    await api.delete(`/resumes/${id}/`);
  },

  async analyzeResume(id: string): Promise<Resume> {
    const res = await api.post<any>(`/resumes/${id}/analyze/`);
    return unpackObject<Resume>(res);
  },

  async createResumeVersion(id: string, payload: { notes?: string; raw_text?: string; job_id?: string }): Promise<any> {
    const res = await api.post<any>(`/resumes/${id}/create-version/`, payload);
    return unpackObject<any>(res);
  },

  // Job Resume Intelligence endpoints

  async analyzeJobResumes(jobId: string): Promise<ResumeJobAnalysis[]> {
    const res = await api.post<any>(`/jobs/${jobId}/analyze-resumes/`);
    return unpackArray<ResumeJobAnalysis>(res);
  },

  async getJobResumeAnalyses(jobId: string): Promise<ResumeJobAnalysis[]> {
    const res = await api.get<any>(`/jobs/${jobId}/resume-analysis/`);
    return unpackArray<ResumeJobAnalysis>(res);
  },

  async getRecommendedResume(jobId: string): Promise<ResumeJobAnalysis> {
    const res = await api.get<any>(`/jobs/${jobId}/recommended-resume/`);
    return unpackObject<ResumeJobAnalysis>(res);
  },

  async optimizeResumeForJob(jobId: string, resumeId?: string): Promise<ResumeOptimization> {
    const res = await api.post<any>(`/jobs/${jobId}/resume-optimize/`, { resume_id: resumeId });
    return unpackObject<ResumeOptimization>(res);
  },

  async generateOutreach(jobId: string, payload: GenerateOutreachPayload): Promise<OutreachMessage> {
    const res = await api.post<any>(`/jobs/${jobId}/generate-outreach/`, payload);
    return unpackObject<OutreachMessage>(res);
  },

  async getJobOutreachMessages(jobId: string): Promise<OutreachMessage[]> {
    const res = await api.get<any>(`/jobs/${jobId}/outreach/`);
    return unpackArray<OutreachMessage>(res);
  },

  async selectJobResume(jobId: string, resumeId: string | null): Promise<void> {
    await api.post(`/jobs/${jobId}/select-resume/`, { resume_id: resumeId });
  }
};
