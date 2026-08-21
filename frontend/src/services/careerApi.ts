import { api } from './api';

export interface CareerProfile {
  id: string;
  user_email: string;
  current_role?: string;
  years_of_experience: number;
  current_ctc?: string;
  expected_ctc_min?: string;
  expected_ctc_max?: string;
  notice_period?: string;
  preferred_locations: string[];
  preferred_work_modes: string[];
  career_goal?: string;
  created_at: string;
  updated_at: string;
}

export interface TargetRole {
  id: string;
  name: string;
  priority: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export const careerApi = {
  async getProfile(): Promise<CareerProfile> {
    const res = await api.get<CareerProfile>('/career/profile/');
    return res.data;
  },

  async updateProfile(payload: Partial<CareerProfile>): Promise<CareerProfile> {
    const res = await api.patch<CareerProfile>('/career/profile/', payload);
    return res.data;
  },

  async getTargetRoles(): Promise<TargetRole[]> {
    const res = await api.get<TargetRole[]>('/career/target-roles/');
    return res.data || [];
  },

  async createTargetRole(payload: { name: string; priority?: number; is_primary?: boolean }): Promise<TargetRole> {
    const res = await api.post<TargetRole>('/career/target-roles/', payload);
    return res.data;
  },

  async updateTargetRole(id: string, payload: Partial<TargetRole>): Promise<TargetRole> {
    const res = await api.patch<TargetRole>(`/career/target-roles/${id}/`, payload);
    return res.data;
  },

  async deleteTargetRole(id: string): Promise<void> {
    await api.delete(`/career/target-roles/${id}/`);
  },
};
