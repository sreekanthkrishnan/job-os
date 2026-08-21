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
  applied_resume?: string | null;
  applied_resume_name?: string | null;
  job_skills?: JobSkillItem[];
  required_skills?: string[];
  matching_skills?: string[];
  missing_skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface ResumeSkill {
  id: string;
  name: string;
  category: string;
  experience_years?: number | null;
}

export interface ResumeParsedProfile {
  candidate_name?: string;
  current_role?: string;
  years_of_experience?: number;
  seniority_level?: string;
  professional_summary?: string;
  companies?: string[];
  experience?: Array<{
    company?: string;
    role?: string;
    duration?: string;
    responsibilities?: string[];
    achievements?: string[];
  }>;
  skills?: string[];
  skill_categories?: Record<string, string[]>;
  education?: Array<{ degree?: string; institution?: string; year?: string }>;
  certifications?: string[];
  projects?: Array<{ name?: string; description?: string; technologies?: string[] }>;
  quantifiable_achievements?: string[];
  keywords?: string[];
}

export interface Resume {
  id: string;
  name: string;
  file: string;
  file_url?: string;
  file_type: string;
  file_size: number;
  target_role?: string;
  description?: string;
  version: number;
  is_active: boolean;
  parsed_status: 'pending' | 'completed' | 'failed';
  analysis_status: 'pending' | 'completed' | 'failed';
  raw_text?: string;
  parsed_data?: ResumeParsedProfile;
  resume_skills?: ResumeSkill[];
  versions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeJobAnalysis {
  id: string;
  resume: string;
  resume_name: string;
  resume_version: number;
  job: string;
  suitability_score: number | string;
  skill_match_score: number | string;
  experience_match_score: number | string;
  role_match_score: number | string;
  seniority_match_score: number | string;
  keyword_score: number | string;
  domain_score: number | string;
  ats_score: number | string;
  ai_call_probability_estimate: number;
  ai_confidence: 'Low' | 'Medium' | 'High';
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
  analysis_json?: {
    risks?: string[];
    why_reasoning?: string[];
  };
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeOptimization {
  id: string;
  resume: string;
  job: string;
  current_score: number | string;
  potential_score: number | string;
  potential_improvement: number | string;
  missing_keywords: string[];
  weak_sections: string[];
  suggested_improvements: string[];
  ats_formatting_concerns: string[];
  created_at: string;
}

export interface OutreachMessage {
  id: string;
  job: string;
  resume?: string;
  channel: 'email' | 'linkedin';
  tone: 'professional' | 'concise' | 'confident' | 'friendly' | 'technical';
  recipient_name?: string;
  recipient_role?: string;
  subject_lines: string[];
  selected_subject?: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ResumePerformanceStat {
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

export type RoadmapStatus = 'active' | 'completed' | 'paused' | 'archived';
export type TopicDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type ResourceType = 'course' | 'tutorial' | 'documentation' | 'video' | 'book' | 'project' | 'article' | 'certification';

export interface LearningResource {
  id: string;
  topic?: string;
  course?: string;
  title: string;
  provider?: string;
  url: string;
  resource_type: ResourceType;
  difficulty?: string;
  duration?: string;
  is_free: boolean;
  rating?: number;
  why_recommended?: string;
  relevance_score?: number;
  matches?: string[];
  status: TopicStatus;
  progress: number;
  notes?: string;
  added_to_my_courses: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapTopic {
  id: string;
  roadmap: string;
  module?: string;
  title: string;
  description?: string;
  order: number;
  difficulty: TopicDifficulty;
  estimated_hours: number;
  prerequisites: string[];
  learning_objectives: string[];
  target_skills: string[];
  status: TopicStatus;
  progress: number;
  notes?: string;
  resources?: LearningResource[];
  resources_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RoadmapModule {
  id: string;
  roadmap: string;
  title: string;
  description?: string;
  order: number;
  topics: RoadmapTopic[];
  created_at: string;
}

export interface LearningRoadmap {
  id: string;
  title: string;
  description?: string;
  goal: string;
  reason?: string;
  current_level: string;
  target_level: string;
  target_role?: string;
  estimated_duration_weeks: number;
  weekly_hours: number;
  overall_progress: number;
  status: RoadmapStatus;
  source_job?: string | null;
  modules: RoadmapModule[];
  topics: RoadmapTopic[];
  completed_topics_count?: number;
  total_topics_count?: number;
  total_estimated_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface RoadmapDashboardStats {
  total_courses: number;
  active_roadmaps_count: number;
  courses_in_progress: number;
  skills_in_progress: number;
  completed_courses: number;
  active_roadmap?: LearningRoadmap | null;
  ai_insights: string[];
}

export interface NextTopicRecommendation {
  topic_id?: string | null;
  title: string;
  why: string;
  estimated_hours: number;
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
  resumes_performance?: ResumePerformanceStat[];
  best_performing_resume?: {
    id: string;
    name: string;
    response_rate: number;
    interview_rate: number;
    applications_count: number;
  } | null;
  top_resume_improvement_opportunity?: string;
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
