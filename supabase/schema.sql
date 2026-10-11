-- ==============================================================================
-- IntraSphere Labs — Internship Management System (IMS)
-- Supabase PostgreSQL Schema (Passwordless, Supabase Backend)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('admin', 'coordinator', 'intern');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_status_enum AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE internship_status_enum AS ENUM (
    'Selected', 'Offer Sent', 'Onboarding', 'Active', 'Paused', 'Completed', 'Discontinued'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE work_arrangement_enum AS ENUM ('Remote', 'Hybrid', 'In-office');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_status_enum AS ENUM ('Planning', 'Active', 'In Review', 'Completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority_enum AS ENUM ('Low', 'Medium', 'High', 'Urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('To Do', 'In Progress', 'In Review', 'Blocked', 'Completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE doc_category_enum AS ENUM (
    'Offer Letter', 'Internship Agreement', 'Project Document', 'Meeting Notes', 'Evaluation', 'Certificate', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE doc_status_enum AS ENUM ('Draft', 'Pending Review', 'Approved', 'Issued', 'Archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE cert_status_enum AS ENUM ('Draft', 'Approved', 'Issued');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE audience_enum AS ENUM ('All', 'Coordinators', 'Interns', 'Specific Role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES / USERS (Passwordless, identified by email)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'intern',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. INTERNSHIP ROLES
CREATE TABLE IF NOT EXISTS public.internship_roles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  openings INT NOT NULL DEFAULT 1,
  duration TEXT NOT NULL DEFAULT '3 Months',
  work_arrangement TEXT NOT NULL DEFAULT 'Remote',
  compensation_terms TEXT NOT NULL DEFAULT 'Stipend provided',
  application_instructions TEXT NOT NULL DEFAULT 'Internal reference only.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT NOT NULL DEFAULT '',
  goals TEXT NOT NULL DEFAULT '',
  project_lead_id TEXT,
  lead_name TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_completion_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  status TEXT NOT NULL DEFAULT 'Active',
  team_member_ids TEXT[] DEFAULT '{}',
  team_member_names TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. INTERNS
CREATE TABLE IF NOT EXISTS public.interns (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  internship_role_id TEXT,
  role_title TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  coordinator_id TEXT,
  coordinator_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  assigned_project_id TEXT,
  assigned_project_name TEXT DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  learning_goals TEXT NOT NULL DEFAULT '',
  progress_notes TEXT NOT NULL DEFAULT '',
  final_evaluation TEXT,
  certificate_status TEXT NOT NULL DEFAULT 'Not Eligible',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_interns_email ON public.interns(email);
CREATE INDEX IF NOT EXISTS idx_interns_coordinator ON public.interns(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_interns_status ON public.interns(status);

-- 7. ONBOARDING ITEMS
CREATE TABLE IF NOT EXISTS public.onboarding_items (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Setup',
  assigned_to TEXT NOT NULL DEFAULT 'intern',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  blocker_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_onboarding_intern ON public.onboarding_items(intern_id);

-- 8. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to_id TEXT,
  assigned_to_name TEXT DEFAULT '',
  assigned_by_id TEXT,
  assigned_by_name TEXT DEFAULT '',
  project_id TEXT,
  project_name TEXT DEFAULT '',
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'To Do',
  subtasks JSONB NOT NULL DEFAULT '[]',
  comments JSONB NOT NULL DEFAULT '[]',
  feedback TEXT,
  rating INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- 9. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  attendee_ids TEXT[] DEFAULT '{}',
  attendee_names TEXT[] DEFAULT '{}',
  type TEXT NOT NULL DEFAULT 'Check-in',
  meeting_link TEXT DEFAULT '',
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  type TEXT DEFAULT 'Offer Letter',
  intern_id TEXT,
  intern_name TEXT DEFAULT '',
  owner_id TEXT,
  owner_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_documents_intern ON public.documents(intern_id);

-- 11. ATTENDANCE & CHECK-IN LOGS
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  intern_name TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_logged NUMERIC(4,2) NOT NULL DEFAULT 8.0,
  tasks_completed_summary TEXT NOT NULL DEFAULT '',
  blockers_summary TEXT DEFAULT '',
  coordinator_feedback TEXT,
  reviewed_by_id TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_attendance_intern ON public.attendance_logs(intern_id);

-- 12. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  body TEXT DEFAULT '',
  author_id TEXT,
  author_name TEXT DEFAULT '',
  author_role TEXT DEFAULT 'admin',
  audience TEXT NOT NULL DEFAULT 'All',
  priority TEXT NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. PERFORMANCE REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  intern_name TEXT DEFAULT '',
  reviewer_id TEXT,
  reviewer_name TEXT DEFAULT '',
  review_period TEXT NOT NULL DEFAULT 'Mid-Term',
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.0,
  technical_skills_rating INT NOT NULL DEFAULT 4,
  communication_rating INT NOT NULL DEFAULT 4,
  initiative_rating INT NOT NULL DEFAULT 4,
  strengths TEXT NOT NULL DEFAULT '',
  areas_for_improvement TEXT NOT NULL DEFAULT '',
  coordinator_notes TEXT DEFAULT '',
  is_shared_with_intern BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_intern ON public.reviews(intern_id);

-- 14. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  intern_name TEXT DEFAULT '',
  role_title TEXT DEFAULT '',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Issued',
  verification_code TEXT UNIQUE NOT NULL,
  signatory_name TEXT NOT NULL DEFAULT 'IntraSphere Leadership',
  signatory_title TEXT NOT NULL DEFAULT 'Program Director',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(verification_code);

-- 15. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT DEFAULT '',
  role TEXT DEFAULT '',
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  brand_name TEXT NOT NULL DEFAULT 'IntraSphere Labs',
  support_email TEXT NOT NULL DEFAULT 'teamintrasphere@gmail.com',
  internship_duration_days INT NOT NULL DEFAULT 90,
  default_stipend_terms TEXT NOT NULL DEFAULT 'Performance-based / Milestone',
  allow_self_checkin BOOLEAN NOT NULL DEFAULT true,
  require_review_for_completion BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — OPEN FOR IMS WEB APPLICATION
-- Allows seamless read, insert, update, and delete from the authenticated & anon web app
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "ims_profiles_all" ON public.profiles;
  CREATE POLICY "ims_profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

  -- Roles
  DROP POLICY IF EXISTS "ims_roles_all" ON public.internship_roles;
  CREATE POLICY "ims_roles_all" ON public.internship_roles FOR ALL USING (true) WITH CHECK (true);

  -- Projects
  DROP POLICY IF EXISTS "ims_projects_all" ON public.projects;
  CREATE POLICY "ims_projects_all" ON public.projects FOR ALL USING (true) WITH CHECK (true);

  -- Interns
  DROP POLICY IF EXISTS "ims_interns_all" ON public.interns;
  CREATE POLICY "ims_interns_all" ON public.interns FOR ALL USING (true) WITH CHECK (true);

  -- Onboarding
  DROP POLICY IF EXISTS "ims_onboarding_all" ON public.onboarding_items;
  CREATE POLICY "ims_onboarding_all" ON public.onboarding_items FOR ALL USING (true) WITH CHECK (true);

  -- Tasks
  DROP POLICY IF EXISTS "ims_tasks_all" ON public.tasks;
  CREATE POLICY "ims_tasks_all" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

  -- Calendar Events
  DROP POLICY IF EXISTS "ims_calendar_all" ON public.calendar_events;
  CREATE POLICY "ims_calendar_all" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

  -- Documents
  DROP POLICY IF EXISTS "ims_documents_all" ON public.documents;
  CREATE POLICY "ims_documents_all" ON public.documents FOR ALL USING (true) WITH CHECK (true);

  -- Attendance
  DROP POLICY IF EXISTS "ims_attendance_all" ON public.attendance_logs;
  CREATE POLICY "ims_attendance_all" ON public.attendance_logs FOR ALL USING (true) WITH CHECK (true);

  -- Announcements
  DROP POLICY IF EXISTS "ims_announcements_all" ON public.announcements;
  CREATE POLICY "ims_announcements_all" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

  -- Reviews
  DROP POLICY IF EXISTS "ims_reviews_all" ON public.reviews;
  CREATE POLICY "ims_reviews_all" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

  -- Certificates
  DROP POLICY IF EXISTS "ims_certificates_all" ON public.certificates;
  CREATE POLICY "ims_certificates_all" ON public.certificates FOR ALL USING (true) WITH CHECK (true);

  -- Activity Logs
  DROP POLICY IF EXISTS "ims_activity_logs_all" ON public.activity_logs;
  CREATE POLICY "ims_activity_logs_all" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

  -- System Settings
  DROP POLICY IF EXISTS "ims_system_settings_all" ON public.system_settings;
  CREATE POLICY "ims_system_settings_all" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN null;
END $$;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. Admin & Coordinator Profiles
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES
  ('1aba0833-091a-4d00-979b-976507530e0c', 'teamintrasphere@gmail.com', 'IntraSphere Admin', 'admin', 'active'),
  ('usr-yoga-coord', 'yogareddy107@gmail.com', 'Yoga Reddy', 'coordinator', 'active')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 2. Preconfigured Cohort Roles
INSERT INTO public.internship_roles (id, title, description, responsibilities, required_skills, openings, duration, work_arrangement, compensation_terms, application_instructions, is_active)
VALUES
  ('role-prod-res', 'Product Research Intern', 'Focuses on identifying user pain points, analyzing market trends, synthesizing competitive intelligence, and validating early product hypotheses.', ARRAY['Conduct user interview synthesis and survey analysis', 'Benchmark competing SaaS platforms and identify feature gaps', 'Translate qualitative research into structured product problem statements', 'Collaborate with engineering leads on feature prioritization briefs'], ARRAY['User Research & Discovery', 'Market Analysis', 'Wireframing & FigJam'], 3, '3 Months', 'Remote', 'Stipend: Performance-based / Milestone', 'Internal record only. Candidates selected through standard vetting by IntraSphere Labs team.', true),
  ('role-full-stack', 'Full Stack Developer Intern', 'Builds responsive full-stack features, integrates REST & Supabase APIs, writes unit tests, and contributes to the core IntraSphere Labs web products.', ARRAY['Develop clean React and Next.js frontend components adhering to strict design guidelines', 'Implement backend services, database schema migrations, and secure RLS policies', 'Write integration tests and participate in technical peer code reviews', 'Assist in deployment pipelines and bug resolution sprints'], ARRAY['TypeScript & Next.js', 'Tailwind CSS & Component Architecture', 'PostgreSQL & Supabase', 'Git & Version Control'], 4, '3 Months', 'Remote', 'Stipend: Performance-based / Milestone', 'Internal record only. Pre-vetted technical background required.', true),
  ('role-biz-dev', 'Business Development Intern', 'Supports strategic outreach, partnership sourcing, B2B customer pipeline qualification, and startup ecosystem engagement.', ARRAY['Research target accounts and key decision-maker contact intelligence', 'Draft tailored value proposition decks and pilot partnership memos', 'Track pipeline metrics and prepare weekly commercial growth briefings', 'Coordinate intro calls and client feedback documentation'], ARRAY['B2B Market Research', 'Outreach Strategy', 'CRM & Pipeline Hygiene', 'Written Communication & Presentation'], 2, '3 Months', 'Remote', 'Stipend: Performance-based / Milestone', 'Internal record only. Evaluated by growth leadership.', true),
  ('role-prop-acq', 'Property Acquisition Intern', 'Performs real estate market underwriting, site feasibility assessments, municipal zoning research, and asset valuation modeling.', ARRAY['Analyze spatial real estate datasets and property records', 'Perform cash flow modeling and preliminary IRR calculations', 'Examine zoning bylaws and municipal permitting constraints', 'Assemble comprehensive acquisition investment summaries'], ARRAY['Real Estate Financial Modeling', 'Zoning & Feasibility Research', 'Excel & Financial Spreadsheets', 'Asset Valuation Principles'], 2, '3 Months', 'Hybrid', 'Stipend: Performance-based / Milestone', 'Internal record only. Specialized asset analysis cohort.', true)
ON CONFLICT (title) DO NOTHING;

-- 3. Core Project
INSERT INTO public.projects (id, name, description, problem_statement, goals, project_lead_id, lead_name, start_date, target_completion_date, status)
VALUES
  ('proj-pri-1', 'IntraSphere Labs — Product Research & Innovation', 'Central cross-functional initiative focused on discovering, scoping, and prototyping scalable SaaS solutions for modern digital operations.', 'Organizations struggle with disconnected tools, slow feedback loops, and lack of verified data models during product development and talent scaling.', 'Deliver working prototypes, establish verified market fit criteria, streamline remote check-in workflows, and validate production architectures.', '1aba0833-091a-4d00-979b-976507530e0c', 'IntraSphere Admin', '2026-02-01', '2026-05-01', 'Active')
ON CONFLICT (id) DO NOTHING;
