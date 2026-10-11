-- ==============================================================================
-- IntraSphere Labs — Internship Management System (IMS)
-- PostgreSQL Database Schema & Row Level Security (RLS) Policies
-- ==============================================================================
-- IMPORTANT NOTE:
-- This platform manages interns AFTER selection. It does NOT contain candidate
-- pipelines, job listings, application tracking, or recruitment workflows.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role_enum AS ENUM ('admin', 'coordinator', 'intern');
CREATE TYPE user_status_enum AS ENUM ('active', 'inactive');
CREATE TYPE internship_status_enum AS ENUM (
  'Selected',
  'Offer Sent',
  'Onboarding',
  'Active',
  'Paused',
  'Completed',
  'Discontinued'
);
CREATE TYPE work_arrangement_enum AS ENUM ('Remote', 'Hybrid', 'In-office');
CREATE TYPE project_status_enum AS ENUM ('Planning', 'Active', 'In Review', 'Completed');
CREATE TYPE task_priority_enum AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE task_status_enum AS ENUM ('To Do', 'In Progress', 'In Review', 'Blocked', 'Completed');
CREATE TYPE doc_category_enum AS ENUM (
  'Offer Letter',
  'Internship Agreement',
  'Project Document',
  'Meeting Notes',
  'Evaluation',
  'Certificate',
  'Other'
);
CREATE TYPE doc_status_enum AS ENUM ('Draft', 'Pending Review', 'Approved', 'Issued', 'Archived');
CREATE TYPE cert_status_enum AS ENUM ('Draft', 'Approved', 'Issued');
CREATE TYPE audience_enum AS ENUM ('All', 'Coordinators', 'Interns', 'Specific Role');

-- 3. PROFILES / USERS
-- Tied to Supabase auth.users via id
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'intern',
  phone TEXT,
  avatar_url TEXT,
  status user_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 4. INTERNSHIP ROLES (Preconfigured cohort roles)
CREATE TABLE IF NOT EXISTS public.internship_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  openings INT NOT NULL DEFAULT 1,
  duration TEXT NOT NULL DEFAULT '3 Months',
  work_arrangement work_arrangement_enum NOT NULL DEFAULT 'Remote',
  compensation_terms TEXT NOT NULL DEFAULT 'Stipend provided',
  application_instructions TEXT NOT NULL DEFAULT 'Internal reference only.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  goals TEXT NOT NULL,
  project_lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,
  status project_status_enum NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (project_id, user_id)
);

-- 6. INTERNS
CREATE TABLE IF NOT EXISTS public.interns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  internship_role_id UUID NOT NULL REFERENCES public.internship_roles(id),
  start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  coordinator_id UUID NOT NULL REFERENCES public.profiles(id),
  status internship_status_enum NOT NULL DEFAULT 'Selected',
  assigned_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  learning_goals TEXT NOT NULL DEFAULT '',
  progress_notes TEXT NOT NULL DEFAULT '',
  final_evaluation TEXT,
  certificate_status cert_status_enum NOT NULL DEFAULT 'Draft',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_interns_coordinator ON public.interns(coordinator_id);
CREATE INDEX idx_interns_status ON public.interns(status);
CREATE INDEX idx_interns_user_id ON public.interns(user_id);

-- 7. ONBOARDING ITEMS & PROGRESS
CREATE TABLE IF NOT EXISTS public.onboarding_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Setup',
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('intern', 'staff')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  order_index INT NOT NULL DEFAULT 1,
  blocker_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_onboarding_intern_id ON public.onboarding_items(intern_id);

-- 8. TASKS & SUBTASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to_id UUID NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  priority task_priority_enum NOT NULL DEFAULT 'Medium',
  status task_status_enum NOT NULL DEFAULT 'To Do',
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  estimated_effort TEXT,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. CALENDAR & DEADLINES
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  responsible_id UUID REFERENCES public.profiles(id),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. DOCUMENTS & OFFER LETTERS
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category doc_category_enum NOT NULL DEFAULT 'Other',
  intern_id UUID REFERENCES public.interns(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  status doc_status_enum NOT NULL DEFAULT 'Draft',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  offer_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_documents_intern_id ON public.documents(intern_id);

-- 11. ATTENDANCE & CHECK-INS
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  work_summary TEXT NOT NULL,
  blockers TEXT NOT NULL DEFAULT '',
  learning_progress TEXT NOT NULL DEFAULT '',
  next_steps TEXT NOT NULL DEFAULT '',
  reviewed_by_id UUID REFERENCES public.profiles(id),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_attendance_intern ON public.attendance_logs(intern_id);
CREATE INDEX idx_attendance_date ON public.attendance_logs(date);

-- 12. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience audience_enum NOT NULL DEFAULT 'All',
  target_role TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. PERFORMANCE REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  review_period TEXT NOT NULL,
  role_progress TEXT NOT NULL,
  communication_rating TEXT NOT NULL,
  task_completion_rating TEXT NOT NULL,
  problem_solving_rating TEXT NOT NULL,
  strengths TEXT NOT NULL,
  areas_to_improve TEXT NOT NULL,
  mentor_feedback TEXT NOT NULL,
  intern_self_reflection TEXT,
  next_goals TEXT NOT NULL,
  private_staff_notes TEXT, -- ONLY visible to Admin & Coordinator!
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_reviews_intern ON public.reviews(intern_id);

-- 14. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intern_id UUID NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  duration TEXT NOT NULL,
  completion_status TEXT NOT NULL,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  issue_date DATE NOT NULL,
  certificate_identifier TEXT UNIQUE NOT NULL,
  status cert_status_enum NOT NULL DEFAULT 'Draft',
  approved_by UUID REFERENCES public.profiles(id),
  issued_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_certificates_intern ON public.certificates(intern_id);

-- 15. AUDIT & ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Interns Policies
-- Admin can view/edit all; Coordinator can view assigned; Intern can view only own
CREATE POLICY "Admin has full access to interns"
  ON public.interns FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Coordinators view assigned interns"
  ON public.interns FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'coordinator' AND coordinator_id = auth.uid()
  );

CREATE POLICY "Coordinators update assigned interns"
  ON public.interns FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'coordinator' AND coordinator_id = auth.uid()
  );

CREATE POLICY "Interns view only their own record"
  ON public.interns FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'intern' AND user_id = auth.uid()
  );

-- Tasks Policies
CREATE POLICY "Admin full access to tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Coordinator can manage tasks for assigned interns"
  ON public.tasks FOR ALL
  TO authenticated
  USING (
    public.current_user_role() = 'coordinator' AND EXISTS (
      SELECT 1 FROM public.interns WHERE id = tasks.assigned_to_id AND coordinator_id = auth.uid()
    )
  );

CREATE POLICY "Interns view assigned tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'intern' AND EXISTS (
      SELECT 1 FROM public.interns WHERE id = tasks.assigned_to_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Interns update task status for assigned tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'intern' AND EXISTS (
      SELECT 1 FROM public.interns WHERE id = tasks.assigned_to_id AND user_id = auth.uid()
    )
  );

-- Reviews: Restrict private notes from intern!
CREATE POLICY "Admin full access to reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Coordinator review access"
  ON public.reviews FOR ALL
  TO authenticated
  USING (
    public.current_user_role() = 'coordinator' AND reviewer_id = auth.uid()
  );

CREATE POLICY "Interns can view their own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'intern' AND EXISTS (
      SELECT 1 FROM public.interns WHERE id = reviews.intern_id AND user_id = auth.uid()
    )
  );

-- Documents Policies
CREATE POLICY "Admin full access to documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Coordinator document access"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'coordinator' AND (
      owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.interns WHERE id = documents.intern_id AND coordinator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Interns view permitted documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'intern' AND EXISTS (
      SELECT 1 FROM public.interns WHERE id = documents.intern_id AND user_id = auth.uid()
    ) AND status IN ('Approved', 'Issued')
  );

-- Attendance / Check-ins Policies
CREATE POLICY "Admin full access to attendance"
  ON public.attendance_logs FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Coordinator attendance access"
  ON public.attendance_logs FOR ALL
  TO authenticated
  USING (
    public.current_user_role() = 'coordinator' AND EXISTS (
      SELECT 1 FROM public.interns WHERE id = attendance_logs.intern_id AND coordinator_id = auth.uid()
    )
  );

CREATE POLICY "Interns manage own attendance"
  ON public.attendance_logs FOR ALL
  TO authenticated
  USING (
    public.current_user_role() = 'intern' AND EXISTS (
      SELECT 1 FROM public.interns WHERE id = attendance_logs.intern_id AND user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 17. PROVISIONED ACCOUNTS TABLE (Cross-device credentials and role synchronization)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.provisioned_accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'intern',
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_provisioned_accounts_email ON public.provisioned_accounts(email);

ALTER TABLE public.provisioned_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read provisioned_accounts"
  ON public.provisioned_accounts FOR SELECT
  USING (true);

CREATE POLICY "Allow insert/update provisioned_accounts"
  ON public.provisioned_accounts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed initial authorized coordinator account
INSERT INTO public.provisioned_accounts (id, email, full_name, role, password, status)
VALUES ('usr-yoga-coord', 'yogareddy107@gmail.com', 'Yoga Reddy', 'coordinator', 'ISL@50', 'active')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
