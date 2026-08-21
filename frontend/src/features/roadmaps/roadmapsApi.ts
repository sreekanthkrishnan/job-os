import { api } from '@/services/api';
import {
  LearningRoadmap,
  LearningResource,
  RoadmapDashboardStats,
  NextTopicRecommendation,
  RoadmapTopic
} from '@/types';

export interface CreateRoadmapPayload {
  goal: string;
  reason?: string;
  current_level?: string;
  target_level?: string;
  weekly_hours?: number;
  target_role?: string;
  target_date?: string;
}

export interface DiscoverPayload {
  topic_title: string;
  topic_description?: string;
  target_skills?: string[];
  user_level?: string;
}

export interface AddResourcePayload {
  title: string;
  url: string;
  provider?: string;
  resource_type?: string;
  difficulty?: string;
  duration?: string;
  is_free?: boolean;
  why_recommended?: string;
  add_to_my_courses?: boolean;
}

export const roadmapsApi = {
  getRoadmaps: async (params?: { status?: string; search?: string }): Promise<LearningRoadmap[]> => {
    let url = '/courses/roadmaps/';
    const qp = new URLSearchParams();
    if (params?.status) qp.append('status', params.status);
    if (params?.search) qp.append('search', params.search);
    const str = qp.toString();
    if (str) url += '?' + str;
    const res = await api.get<LearningRoadmap[]>(url);
    return res.data;
  },

  getRoadmap: async (id: string): Promise<LearningRoadmap> => {
    const res = await api.get<LearningRoadmap>(`/courses/roadmaps/${id}/`);
    return res.data;
  },

  generateRoadmap: async (payload: CreateRoadmapPayload): Promise<LearningRoadmap> => {
    const res = await api.post<LearningRoadmap>('/courses/roadmaps/generate/', payload);
    return res.data;
  },

  generateFromSkillGap: async (): Promise<LearningRoadmap> => {
    const res = await api.post<LearningRoadmap>('/courses/roadmaps/generate-from-skill-gap/');
    return res.data;
  },

  generateFromJob: async (jobId: string): Promise<LearningRoadmap> => {
    const res = await api.post<LearningRoadmap>(`/jobs/${jobId}/learning-roadmap/`);
    return res.data;
  },

  discoverResources: async (payload: DiscoverPayload): Promise<{ topic_title: string; resources: LearningResource[] }> => {
    const res = await api.post<{ topic_title: string; resources: LearningResource[] }>('/courses/roadmaps/discover/', payload);
    return res.data;
  },

  discoverTopicResources: async (topicId: string, payload?: Partial<DiscoverPayload>): Promise<{ topic_id: string; topic_title: string; resources: LearningResource[] }> => {
    const res = await api.post<{ topic_id: string; topic_title: string; resources: LearningResource[] }>(`/courses/roadmaps/topics/${topicId}/discover/`, payload || {});
    return res.data;
  },

  addResourceToTopic: async (topicId: string, resourceData: AddResourcePayload): Promise<LearningResource> => {
    const res = await api.post<LearningResource>(`/courses/roadmaps/topics/${topicId}/resources/`, resourceData);
    return res.data;
  },

  updateTopicProgress: async (topicId: string, progress: number, status?: string): Promise<RoadmapTopic> => {
    const res = await api.patch<RoadmapTopic>(`/courses/roadmaps/topics/${topicId}/progress/`, { progress, status });
    return res.data;
  },

  updateResourceProgress: async (resourceId: string, progress: number, status?: string): Promise<LearningResource> => {
    const res = await api.patch<LearningResource>(`/courses/roadmaps/resources/${resourceId}/`, { progress, status });
    return res.data;
  },

  getNextTopic: async (roadmapId: string): Promise<NextTopicRecommendation> => {
    const res = await api.post<NextTopicRecommendation>(`/courses/roadmaps/${roadmapId}/next-topic/`);
    return res.data;
  },

  adaptTopic: async (topicId: string, actionType: 'skip' | 'need_help'): Promise<{ topic: RoadmapTopic; prerequisite_resources?: LearningResource[] }> => {
    const res = await api.post<{ topic: RoadmapTopic; prerequisite_resources?: LearningResource[] }>(`/courses/roadmaps/topics/${topicId}/adapt/`, { action_type: actionType });
    return res.data;
  },

  getDashboardStats: async (): Promise<RoadmapDashboardStats> => {
    const res = await api.get<RoadmapDashboardStats>('/courses/roadmaps/dashboard-stats/');
    return res.data;
  },

  deleteRoadmap: async (id: string): Promise<void> => {
    await api.delete(`/courses/roadmaps/${id}/`);
  }
};
