// IntraSphere Labs – IMS Type Definitions

export type UserRole = 'admin' | 'coordinator' | 'intern';

export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
}

export type InternshipStatus =
  | 'Selected'
  | 'Offer Sent'
  | 'Onboarding'
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Discontinued';

export type WorkArrangement = 'Remote' | 'Hybrid' | 'In-office';

export interface InternshipRole {
  id: string;
  title: string;
  description: string;
  responsibilities: string[];
  required_skills: string[];
  openings: number;
  duration: string;
  work_arrangement: WorkArrangement;
  compensation_terms: string;
  application_instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Intern {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  internship_role_id: string;
  role_title: string;
  start_date: string;
  planned_end_date: string;
  coordinator_id: string;
  coordinator_name: string;
  status: InternshipStatus;
  assigned_project_id?: string | null;
  assigned_project_name?: string | null;
  skills: string[];
  learning_goals: string;
  progress_notes: string;
  final_evaluation?: string | null;
  certificate_status: 'Not Eligible' | 'Draft' | 'Approved' | 'Issued';
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingItem {
  id: string;
  intern_id: string;
  title: string;
  description: string;
  category: 'Documentation' | 'Setup' | 'Project' | 'Mentorship';
  assigned_to: 'intern' | 'staff';
  is_completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
  order_index: number;
  blocker_notes?: string | null;
}

export type ProjectStatus = 'Planning' | 'Active' | 'In Review' | 'Completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  problem_statement: string;
  goals: string;
  project_lead_id: string;
  lead_name: string;
  team_member_ids: string[];
  team_member_names: string[];
  start_date: string;
  target_completion_date: string;
  status: ProjectStatus;
  created_at: string;
  updated_at?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Blocked' | 'Completed';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to_id: string;
  assigned_to_name: string;
  project_id: string;
  project_name: string;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string;
  due_date: string;
  estimated_effort?: string;
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  created_by_id: string;
  created_by_name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export type EventType =
  | 'internship_milestone'
  | 'task_deadline'
  | 'review_meeting'
  | 'onboarding_deadline'
  | 'offer_acknowledgement'
  | 'certificate_date';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  date: string;
  end_date?: string;
  responsible_id?: string;
  responsible_name?: string;
  project_id?: string;
  created_at: string;
}

export type DocumentCategory =
  | 'Offer Letter'
  | 'Internship Agreement'
  | 'Project Document'
  | 'Meeting Notes'
  | 'Evaluation'
  | 'Certificate'
  | 'Other';

export type DocumentStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Issued' | 'Archived';

export interface IMSDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  intern_id?: string | null;
  intern_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  file_url: string;
  file_name: string;
  file_size?: string;
  owner_id: string;
  owner_name: string;
  status: DocumentStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  // Specific for Offer Letter
  offer_details?: {
    intern_name: string;
    intern_email: string;
    role_title: string;
    start_date: string;
    duration: string;
    work_arrangement: WorkArrangement;
    compensation_terms: string;
    responsibilities: string[];
    signatory_name: string;
    signatory_title: string;
    issue_date: string;
    is_approved: boolean;
    is_issued: boolean;
  };
}

export interface CheckInLog {
  id: string;
  intern_id: string;
  intern_name: string;
  date: string;
  work_summary: string;
  blockers: string;
  learning_progress: string;
  next_steps: string;
  reviewed_by_id?: string | null;
  reviewer_name?: string | null;
  reviewer_notes?: string | null;
  created_at: string;
}

export type AnnouncementAudience = 'All' | 'Coordinators' | 'Interns' | 'Specific Role';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  target_role?: string | null;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  is_archived: boolean;
  created_at: string;
}

export interface PerformanceReview {
  id: string;
  intern_id: string;
  intern_name: string;
  reviewer_id: string;
  reviewer_name: string;
  review_period: string;
  role_progress: string;
  communication_rating: string; // e.g. "Exceeds Expectations", "Meets Expectations", "Developing"
  task_completion_rating: string;
  problem_solving_rating: string;
  strengths: string;
  areas_to_improve: string;
  mentor_feedback: string;
  intern_self_reflection?: string | null;
  next_goals: string;
  private_staff_notes?: string | null; // Restricted: only admin & reviewer coordinator
  created_at: string;
  updated_at?: string;
}

export type CertificateStatus = 'Draft' | 'Approved' | 'Issued';

export interface Certificate {
  id: string;
  intern_id: string;
  intern_name: string;
  role_title: string;
  duration: string;
  completion_status: string;
  signatory_name: string;
  signatory_title: string;
  issue_date: string;
  certificate_identifier: string;
  status: CertificateStatus;
  approved_by?: string | null;
  issued_by?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  role: UserRole;
  action: string;
  module: string;
  details: string;
  created_at: string;
}

export interface SystemSettings {
  company_name: string;
  project_name: string;
  tagline: string;
  default_duration: string;
  default_work_arrangement: WorkArrangement;
  authorized_signatory_name: string;
  authorized_signatory_title: string;
  is_demo_mode: boolean;
  contact_email?: string;
  company_address?: string;
  default_stipend?: string;
}
