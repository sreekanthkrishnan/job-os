import { api } from '@/services/api';
import { Skill } from '@/types';

export interface CreateSkillPayload {
  name: string;
  category?: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  source?: 'manual' | 'course' | 'imported';
}

export interface SkillStats {
  total: number;
  by_category: Array<{ category: string; count: number }>;
  by_proficiency: Array<{ proficiency: string; count: number }>;
}

export interface NormalizePreviewResult {
  raw: string;
  canonical: string;
  inferred_category: string;
}

export const skillsApi = {
  async getSkills(params?: { category?: string; search?: string; proficiency?: string }): Promise<Skill[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.proficiency) query.append('proficiency', params.proficiency);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get<Skill[]>(`/skills/${queryString}`);
    return res.data || [];
  },

  async createSkill(payload: CreateSkillPayload): Promise<Skill> {
    const res = await api.post<Skill>('/skills/', payload);
    return res.data;
  },

  async updateSkill(id: string, payload: Partial<CreateSkillPayload>): Promise<Skill> {
    const res = await api.patch<Skill>(`/skills/${id}/`, payload);
    return res.data;
  },

  async deleteSkill(id: string): Promise<void> {
    await api.delete(`/skills/${id}/`);
  },

  async getStats(): Promise<SkillStats> {
    const res = await api.get<SkillStats>('/skills/stats/');
    return res.data;
  },

  async previewNormalize(rawSkill: string): Promise<NormalizePreviewResult> {
    const res = await api.post<NormalizePreviewResult>('/skills/normalize/', { skill: rawSkill });
    return res.data;
  },
};
