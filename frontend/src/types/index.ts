export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  } | null;
  message: string | null;
  errors?: Record<string, string[]>;
}

export type JobStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'technical'
  | 'managerial'
  | 'hr'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'on_hold';

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  source: 'manual' | 'course' | 'imported';
  created_at: string;
  updated_at: string;
}

export interface JobSkillItem {
  id: string;
  skill_name: string;
  is_required: boolean;
}

export interface Job {
  id: string;
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
  match_score: number | string;
  job_skills?: JobSkillItem[];
  required_skills?: string[];
  matching_skills?: string[];
  missing_skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  course_url?: string;
  start_date?: string;
  target_completion_date?: string;
  progress: number;
  status: 'planned' | 'in_progress' | 'completed' | 'paused' | 'dropped';
  skills: string[];
  notes_count?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseNote {
  id: string;
  course_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  job: string;
  round_type: 'hr_screening' | 'technical' | 'coding' | 'system_design' | 'managerial' | 'hr' | 'final' | 'other';
  scheduled_at: string;
  interviewer?: string;
  result: 'scheduled' | 'completed' | 'passed' | 'failed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  notes?: string;
  job_company?: string;
  job_role?: string;
  job_status?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_applied: number;
  interviews_scheduled: number;
  rejected_count: number;
  active_count: number;
  offers_count: number;
  response_rate: number;
  conversion_rate: number;
  role_distribution: Array<{ name: string; count: number; percentage: number }>;
  status_funnel: Array<{ status: string; count: number }>;
  recent_jobs: Job[];
  upcoming_interviews: Interview[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
