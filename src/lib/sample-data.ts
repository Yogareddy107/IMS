import {
  UserProfile,
  InternshipRole,
  Intern,
  OnboardingItem,
  Project,
  Task,
  CalendarEvent,
  IMSDocument,
  CheckInLog,
  Announcement,
  PerformanceReview,
  Certificate,
  ActivityLog,
  SystemSettings,
} from '@/types';

export const INITIAL_SETTINGS: SystemSettings = {
  company_name: 'IntraSphere Labs',
  project_name: 'IntraSphere Labs – IMS',
  tagline: 'Building Real-World Products Through Innovation',
  default_duration: '3 Months (Quarterly Cohort)',
  default_work_arrangement: 'Remote',
  authorized_signatory_name: 'IntraSphere Admin',
  authorized_signatory_title: 'Operations & Platform Lead',
  is_demo_mode: false,
};

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: '1aba0833-091a-4d00-979b-976507530e0c',
    email: 'teamintrasphere@gmail.com',
    full_name: 'IntraSphere Admin',
    role: 'admin',
    avatar_url: null,
    phone: '',
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_ROLES: InternshipRole[] = [
  {
    id: 'role-prod-res',
    title: 'Product Research Intern',
    description:
      'Focuses on identifying user pain points, analyzing market trends, synthesizing competitive intelligence, and validating early product hypotheses.',
    responsibilities: [
      'Conduct user interview synthesis and survey analysis',
      'Benchmark competing SaaS platforms and identify feature gaps',
      'Translate qualitative research into structured product problem statements',
      'Collaborate with engineering leads on feature prioritization briefs',
    ],
    required_skills: [
      'User Research & Discovery',
      'Market Analysis',
      'Wireframing & FigJam',
      'Qualitative Data Synthesis',
    ],
    openings: 3,
    duration: '3 Months',
    work_arrangement: 'Remote',
    compensation_terms: 'Stipend: Performance-based / Milestone',
    application_instructions:
      'Internal record only. Candidates selected through standard vetting by IntraSphere Labs team.',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-full-stack',
    title: 'Full Stack Developer Intern',
    description:
      'Builds responsive full-stack features, integrates REST & Supabase APIs, writes unit tests, and contributes to the core IntraSphere Labs web products.',
    responsibilities: [
      'Develop clean React and Next.js frontend components adhering to strict design guidelines',
      'Implement backend services, database schema migrations, and secure RLS policies',
      'Write integration tests and participate in technical peer code reviews',
      'Assist in deployment pipelines and bug resolution sprints',
    ],
    required_skills: [
      'TypeScript & Next.js',
      'Tailwind CSS & Component Architecture',
      'PostgreSQL & Supabase',
      'Git & Version Control',
    ],
    openings: 4,
    duration: '3 Months',
    work_arrangement: 'Remote',
    compensation_terms: 'Stipend: Performance-based / Milestone',
    application_instructions:
      'Internal record only. Pre-vetted technical background required.',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-biz-dev',
    title: 'Business Development Intern',
    description:
      'Supports strategic outreach, partnership sourcing, B2B customer pipeline qualification, and startup ecosystem engagement.',
    responsibilities: [
      'Research target accounts and key decision-maker contact intelligence',
      'Draft tailored value proposition decks and pilot partnership memos',
      'Track pipeline metrics and prepare weekly commercial growth briefings',
      'Coordinate intro calls and client feedback documentation',
    ],
    required_skills: [
      'B2B Market Research',
      'Outreach Strategy',
      'CRM & Pipeline Hygiene',
      'Written Communication & Presentation',
    ],
    openings: 2,
    duration: '3 Months',
    work_arrangement: 'Remote',
    compensation_terms: 'Stipend: Performance-based / Milestone',
    application_instructions:
      'Internal record only. Evaluated by growth leadership.',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-prop-acq',
    title: 'Property Acquisition Intern',
    description:
      'Performs real estate market underwriting, site feasibility assessments, municipal zoning research, and asset valuation modeling.',
    responsibilities: [
      'Analyze spatial real estate datasets and property records',
      'Perform cash flow modeling and preliminary IRR calculations',
      'Examine zoning bylaws and municipal permitting constraints',
      'Assemble comprehensive acquisition investment summaries',
    ],
    required_skills: [
      'Real Estate Financial Modeling',
      'Zoning & Feasibility Research',
      'Excel & Financial Spreadsheets',
      'Asset Valuation Principles',
    ],
    openings: 2,
    duration: '3 Months',
    work_arrangement: 'Hybrid',
    compensation_terms: 'Stipend: Performance-based / Milestone',
    application_instructions:
      'Internal record only. Specialized asset analysis cohort.',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-pri-1',
    name: 'IntraSphere Labs — Product Research & Innovation',
    description:
      'Central cross-functional initiative focused on discovering, scoping, and prototyping scalable SaaS solutions for modern digital operations.',
    problem_statement:
      'Organizations struggle with disconnected tools, slow feedback loops, and lack of verified data models during product development and talent scaling.',
    goals:
      'Deliver working prototypes, establish verified market fit criteria, streamline remote check-in workflows, and validate production architectures.',
    project_lead_id: '1aba0833-091a-4d00-979b-976507530e0c',
    lead_name: 'IntraSphere Admin',
    team_member_ids: [],
    team_member_names: [],
    start_date: '2026-02-01',
    target_completion_date: '2026-05-01',
    status: 'Active',
    created_at: '2026-01-15T09:00:00Z',
  },
];

export const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    title: 'Offer letter prepared and shared',
    description: 'Generate, approve, and deliver authorized internship offer documentation.',
    category: 'Documentation' as const,
    assigned_to: 'staff' as const,
  },
  {
    title: 'Internship terms acknowledged',
    description: 'Candidate reviews and submits signed acknowledgment of confidentiality and terms.',
    category: 'Documentation' as const,
    assigned_to: 'intern' as const,
  },
  {
    title: 'Profile completed',
    description: 'Intern updates personal contact info, skills, and emergency contact details.',
    category: 'Setup' as const,
    assigned_to: 'intern' as const,
  },
  {
    title: 'Mentor assigned',
    description: 'Designate primary Internship Coordinator and introduce cadence expectations.',
    category: 'Mentorship' as const,
    assigned_to: 'staff' as const,
  },
  {
    title: 'Project explained',
    description: 'Review project overview, problem statement, and expected quarterly milestones.',
    category: 'Project' as const,
    assigned_to: 'staff' as const,
  },
  {
    title: 'Communication channels shared',
    description: 'Provide invite to internal Slack workspace, announcement groups, and team calendar.',
    category: 'Setup' as const,
    assigned_to: 'staff' as const,
  },
  {
    title: 'Tools and access configured',
    description: 'Grant repository access, design workspace, and issue system credentials.',
    category: 'Setup' as const,
    assigned_to: 'staff' as const,
  },
  {
    title: 'First task assigned',
    description: 'Assign starter task with clear rubric, instructions, and target due date.',
    category: 'Project' as const,
    assigned_to: 'staff' as const,
  },
  {
    title: 'Introductory check-in completed',
    description: 'First weekly sync between intern and assigned coordinator.',
    category: 'Mentorship' as const,
    assigned_to: 'intern' as const,
  },
];

// Clean empty transactional datasets — real data added through the platform
export const INITIAL_INTERNS: Intern[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_ONBOARDING_ITEMS: OnboardingItem[] = [];
export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [];
export const INITIAL_DOCUMENTS: IMSDocument[] = [];
export const INITIAL_CHECKINS: CheckInLog[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_REVIEWS: PerformanceReview[] = [];
export const INITIAL_CERTIFICATES: Certificate[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    user_id: '1aba0833-091a-4d00-979b-976507530e0c',
    user_name: 'IntraSphere Admin',
    role: 'admin',
    action: 'Platform Initialized',
    module: 'System',
    details: 'IntraSphere Labs IMS initialized. Connected to live Supabase backend and Resend email engine.',
    created_at: new Date().toISOString(),
  },
];
