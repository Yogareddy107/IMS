-- ==============================================================================
-- IntraSphere Labs — Internship Management System (IMS)
-- Supabase Clean Migration & Real-Time Backend Schema
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CLEAN DROP EXISTING IMS TABLES TO AVOID SCHEMA DRIFT / COLUMN MISMATCHES
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.onboarding_items CASCADE;
DROP TABLE IF EXISTS public.interns CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.internship_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. PROFILES / USERS (Passwordless, email-based authorization)
CREATE TABLE public.profiles (
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

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 4. INTERNSHIP ROLES
CREATE TABLE public.internship_roles (
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
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT NOT NULL DEFAULT '',
  goals TEXT NOT NULL DEFAULT '',
  project_lead_id TEXT,
  lead_name TEXT DEFAULT '',
  team_member_ids TEXT[] DEFAULT '{}',
  team_member_names TEXT[] DEFAULT '{}',
  start_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  target_completion_date TEXT NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days')::text,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. INTERNS
CREATE TABLE public.interns (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  internship_role_id TEXT,
  role_title TEXT DEFAULT '',
  start_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  planned_end_date TEXT NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days')::text,
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

CREATE INDEX idx_interns_email ON public.interns(email);
CREATE INDEX idx_interns_coordinator ON public.interns(coordinator_id);
CREATE INDEX idx_interns_status ON public.interns(status);

-- 7. ONBOARDING ITEMS
CREATE TABLE public.onboarding_items (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Setup',
  assigned_to TEXT NOT NULL DEFAULT 'intern',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  order_index INT NOT NULL DEFAULT 1,
  blocker_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_onboarding_intern ON public.onboarding_items(intern_id);

-- 8. TASKS
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assigned_to_id TEXT,
  assigned_to_name TEXT DEFAULT '',
  project_id TEXT,
  project_name TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'To Do',
  start_date TEXT DEFAULT CURRENT_DATE::text,
  due_date TEXT,
  estimated_effort TEXT DEFAULT '',
  subtasks JSONB NOT NULL DEFAULT '[]',
  comments JSONB NOT NULL DEFAULT '[]',
  created_by_id TEXT,
  created_by_name TEXT DEFAULT '',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- 9. CALENDAR EVENTS
CREATE TABLE public.calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Sprint Review',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location_or_link TEXT DEFAULT '',
  description TEXT DEFAULT '',
  attendees TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. DOCUMENTS
CREATE TABLE public.documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Offer Letter',
  intern_id TEXT,
  intern_name TEXT DEFAULT '',
  project_id TEXT,
  project_name TEXT DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '#',
  file_name TEXT NOT NULL DEFAULT '',
  file_size TEXT NOT NULL DEFAULT '',
  owner_id TEXT,
  owner_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  offer_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_documents_intern ON public.documents(intern_id);

-- 11. ATTENDANCE & CHECK-IN LOGS
CREATE TABLE public.attendance_logs (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  intern_name TEXT DEFAULT '',
  date TEXT NOT NULL,
  work_summary TEXT NOT NULL DEFAULT '',
  blockers TEXT DEFAULT '',
  learning_progress TEXT DEFAULT '',
  next_steps TEXT DEFAULT '',
  reviewed_by_id TEXT,
  reviewer_name TEXT,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_attendance_intern ON public.attendance_logs(intern_id);

-- 12. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'All',
  target_role TEXT,
  author_id TEXT,
  author_name TEXT DEFAULT '',
  author_role TEXT DEFAULT 'admin',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. PERFORMANCE REVIEWS
CREATE TABLE public.reviews (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  intern_name TEXT DEFAULT '',
  reviewer_id TEXT,
  reviewer_name TEXT DEFAULT '',
  review_period TEXT NOT NULL DEFAULT 'Mid-Term',
  role_progress TEXT NOT NULL DEFAULT 'Meets Expectations',
  communication_rating TEXT NOT NULL DEFAULT 'Strong & Proactive',
  task_completion_rating TEXT NOT NULL DEFAULT 'Consistently on Schedule',
  problem_solving_rating TEXT NOT NULL DEFAULT 'High Autonomy & Insight',
  strengths TEXT NOT NULL DEFAULT '',
  areas_to_improve TEXT NOT NULL DEFAULT '',
  mentor_feedback TEXT NOT NULL DEFAULT '',
  intern_self_reflection TEXT,
  next_goals TEXT NOT NULL DEFAULT '',
  private_staff_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_reviews_intern ON public.reviews(intern_id);

-- 14. CERTIFICATES
CREATE TABLE public.certificates (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL,
  intern_name TEXT DEFAULT '',
  role_title TEXT DEFAULT '',
  duration TEXT NOT NULL DEFAULT '3 Months',
  completion_status TEXT NOT NULL DEFAULT 'Completed',
  signatory_name TEXT NOT NULL DEFAULT 'IntraSphere Leadership',
  signatory_title TEXT NOT NULL DEFAULT 'Program Director',
  issue_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  certificate_identifier TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  approved_by TEXT,
  issued_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_certificates_ident ON public.certificates(certificate_identifier);

-- 15. ACTIVITY LOGS
CREATE TABLE public.activity_logs (
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
CREATE TABLE public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'IntraSphere Labs',
  project_name TEXT NOT NULL DEFAULT 'IntraSphere IMS',
  tagline TEXT NOT NULL DEFAULT 'Next-Gen Internship Management',
  default_duration TEXT NOT NULL DEFAULT '3 Months',
  default_work_arrangement TEXT NOT NULL DEFAULT 'Remote',
  authorized_signatory_name TEXT NOT NULL DEFAULT 'IntraSphere Operations Lead',
  authorized_signatory_title TEXT NOT NULL DEFAULT 'Operations Director',
  support_email TEXT NOT NULL DEFAULT 'teamintrasphere@gmail.com',
  default_stipend TEXT NOT NULL DEFAULT 'Stipend: $1,400/month',
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

CREATE POLICY "ims_profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_roles_all" ON public.internship_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_projects_all" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_interns_all" ON public.interns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_onboarding_all" ON public.onboarding_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_tasks_all" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_calendar_all" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_documents_all" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_attendance_all" ON public.attendance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_announcements_all" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_reviews_all" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_certificates_all" ON public.certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_activity_logs_all" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ims_system_settings_all" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. Default System Settings
INSERT INTO public.system_settings (
  id, company_name, project_name, tagline, default_duration, default_work_arrangement,
  authorized_signatory_name, authorized_signatory_title, support_email, default_stipend
) VALUES (
  'default', 'IntraSphere Labs', 'IntraSphere IMS', 'Next-Gen Internship Management',
  '3 Months', 'Remote', 'IntraSphere Operations Lead', 'Operations Director',
  'teamintrasphere@gmail.com', 'Stipend: $1,400/month'
) ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 2. Admin & Coordinator Profiles
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES
  ('1aba0833-091a-4d00-979b-976507530e0c', 'teamintrasphere@gmail.com', 'IntraSphere Admin', 'admin', 'active'),
  ('usr-yoga-coord', 'yogareddy107@gmail.com', 'Yoga Reddy', 'coordinator', 'active')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 3. Preconfigured Cohort Roles
INSERT INTO public.internship_roles (id, title, description, responsibilities, required_skills, openings, duration, work_arrangement, compensation_terms, application_instructions, is_active)
VALUES
  ('role-prod-res', 'Product Research Intern', 'Focuses on identifying user pain points, analyzing market trends, synthesizing competitive intelligence, and validating early product hypotheses.', ARRAY['Conduct user interview synthesis and survey analysis', 'Benchmark competing SaaS platforms and identify feature gaps', 'Translate qualitative research into structured product problem statements', 'Collaborate with engineering leads on feature prioritization briefs'], ARRAY['User Research & Discovery', 'Market Analysis', 'Wireframing & FigJam'], 3, '3 Months', 'Remote', 'Stipend: Performance-based / Milestone', 'Internal record only. Candidates selected through standard vetting by IntraSphere Labs team.', true),
  ('role-full-stack', 'Full Stack Developer Intern', 'Builds responsive full-stack features, integrates REST & Supabase APIs, writes unit tests, and contributes to the core IntraSphere Labs web products.', ARRAY['Develop clean React and Next.js frontend components adhering to strict design guidelines', 'Implement backend services, database schema migrations, and secure RLS policies', 'Write integration tests and participate in technical peer code reviews', 'Assist in deployment pipelines and bug resolution sprints'], ARRAY['TypeScript & Next.js', 'Tailwind CSS & Component Architecture', 'PostgreSQL & Supabase', 'Git & Version Control'], 4, '3 Months', 'Remote', 'Stipend: Performance-based / Milestone', 'Internal record only. Pre-vetted technical background required.', true),
  ('role-biz-dev', 'Business Development Intern', 'Supports strategic outreach, partnership sourcing, B2B customer pipeline qualification, and startup ecosystem engagement.', ARRAY['Research target accounts and key decision-maker contact intelligence', 'Draft tailored value proposition decks and pilot partnership memos', 'Track pipeline metrics and prepare weekly commercial growth briefings', 'Coordinate intro calls and client feedback documentation'], ARRAY['B2B Market Research', 'Outreach Strategy', 'CRM & Pipeline Hygiene', 'Written Communication & Presentation'], 2, '3 Months', 'Remote', 'Stipend: Performance-based / Milestone', 'Internal record only. Evaluated by growth leadership.', true),
  ('role-prop-acq', 'Property Acquisition Intern', 'Performs real estate market underwriting, site feasibility assessments, municipal zoning research, and asset valuation modeling.', ARRAY['Analyze spatial real estate datasets and property records', 'Perform cash flow modeling and preliminary IRR calculations', 'Examine zoning bylaws and municipal permitting constraints', 'Assemble comprehensive acquisition investment summaries'], ARRAY['Real Estate Financial Modeling', 'Zoning & Feasibility Research', 'Excel & Financial Spreadsheets', 'Asset Valuation Principles'], 2, '3 Months', 'Hybrid', 'Stipend: Performance-based / Milestone', 'Internal record only. Specialized asset analysis cohort.', true)
ON CONFLICT (title) DO NOTHING;

-- 4. Core Project
INSERT INTO public.projects (id, name, description, problem_statement, goals, project_lead_id, lead_name, start_date, target_completion_date, status)
VALUES
  ('proj-pri-1', 'IntraSphere Labs — Product Research & Innovation', 'Central cross-functional initiative focused on discovering, scoping, and prototyping scalable SaaS solutions for modern digital operations.', 'Organizations struggle with disconnected tools, slow feedback loops, and lack of verified data models during product development and talent scaling.', 'Deliver working prototypes, establish verified market fit criteria, streamline remote check-in workflows, and validate production architectures.', '1aba0833-091a-4d00-979b-976507530e0c', 'IntraSphere Admin', '2026-02-01', '2026-05-01', 'Active')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 5. ENABLE SUPABASE REALTIME WEBSOCKETS BROADCASTING
-- Allows live instantaneous multi-device updates across laptops, phones & desktops
-- ==============================================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks, public.interns, public.projects, public.onboarding_items, public.attendance_logs, public.announcements, public.documents, public.reviews, public.certificates, public.calendar_events, public.profiles, public.system_settings;
EXCEPTION WHEN others THEN null;
END $$;

