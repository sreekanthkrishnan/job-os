import { api } from '@/services/api';
import { Course, CourseNote } from '@/types';

export interface CreateCoursePayload {
  name: string;
  description?: string;
  provider?: string;
  course_url?: string;
  start_date?: string;
  target_completion_date?: string;
  progress?: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'paused' | 'dropped';
  skills?: string[];
}

export interface CreateCourseNotePayload {
  title: string;
  content: string;
}

export const coursesApi = {
  async getCourses(params?: { status?: string; search?: string }): Promise<Course[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get<Course[]>(`/courses/${queryString}`);
    return res.data || [];
  },

  async createCourse(payload: CreateCoursePayload): Promise<Course> {
    const res = await api.post<Course>('/courses/', payload);
    return res.data;
  },

  async updateCourse(id: string, payload: Partial<CreateCoursePayload>): Promise<Course> {
    const res = await api.patch<Course>(`/courses/${id}/`, payload);
    return res.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/courses/${id}/`);
  },

  async getCourseNotes(courseId: string): Promise<CourseNote[]> {
    const res = await api.get<CourseNote[]>(`/courses/${courseId}/notes/`);
    return res.data || [];
  },

  async createCourseNote(courseId: string, payload: CreateCourseNotePayload): Promise<CourseNote> {
    const res = await api.post<CourseNote>(`/courses/${courseId}/notes/`, payload);
    return res.data;
  },

  async updateCourseNote(noteId: string, payload: Partial<CreateCourseNotePayload>): Promise<CourseNote> {
    const res = await api.patch<CourseNote>(`/courses/notes/${noteId}/`, payload);
    return res.data;
  },

  async deleteCourseNote(noteId: string): Promise<void> {
    await api.delete(`/courses/notes/${noteId}/`);
  },
};
