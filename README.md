# IntraSphere Labs – IMS (Internship Management System)

> **Tagline:** Building Real-World Products Through Innovation  
> **Brand Theme:** Clean Monochrome Dashboard (White `#FFFFFF`, Black `#111111`, Neutral Gray `#E5E7EB`, `#6B7280`)

A centralized, responsive, enterprise SaaS platform built for **IntraSphere Labs** to manage selected interns, onboarding, tasks, projects, deadlines, documents, offer letters, attendance/check-ins, announcements, feedback, performance reviews, and certificates.

---

## 📌 Scope Clarification

This platform begins **AFTER** a person has been selected for an internship.  
- **Careers & Recruitment:** Handled on IntraSphere Labs' existing public website.
- **Not Included by Design:** Job postings, public application forms, applicant tracking (ATS), or recruitment funnels.
- **Platform Role:** Authorized staff manually register selected candidates and govern their full lifecycle through completion and certificate issuance.

---

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Strict monochrome design token system)
- **Icons:** Lucide React (`lucide-react`)
- **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security, Private Storage Buckets)
- **Dual Mode:** Full Interactive Demo Mode (zero-config localStorage sandbox) with Supabase Production Mode

---

## 👥 User Roles & Permissions

The platform enforces strict role-based access control (RBAC):

### 1. Admin (e.g., Dr. Sarah Jenkins)
- Organization-wide analytics, metrics, and live audit feed
- Add, edit, view, and archive intern records
- Provision coordinator and intern user accounts
- Approve and officially issue offer letters and completion certificates
- Manage the 4 preconfigured internship tracks and company settings
- Export filtered cohort and task reports as CSV

### 2. Internship Coordinator (e.g., Alex Rivera)
- View and manage assigned cohort interns and active projects
- Assign tasks, set priorities, and track milestones
- Review submitted task deliverables and leave qualitative feedback
- Track and verify intern onboarding checklists
- Record feedback on daily/weekly check-in updates
- Conduct milestone performance reviews (with restricted private staff notes)

### 3. Intern (e.g., Maya Lin)
- Personalized portal displaying assigned project and deliverables
- Update assigned task statuses and submit progress notes
- Complete self-assigned onboarding checklist items
- Submit daily or weekly remote check-in logs
- View approved and issued offer letters and completion certificates
- Update permitted personal profile fields (phone, skills, learning goals)
- **Restricted:** Cannot view other interns' records, cannot view private coordinator feedback, cannot elevate role permissions

---

## 📋 Preconfigured Internship Tracks

IntraSphere Labs supports four predefined tracks with configured responsibilities and terms:
1. **Product Research Intern** (User research, market benchmarking, problem statements)
2. **Full Stack Developer Intern** (Next.js, TypeScript, PostgreSQL, Supabase RLS)
3. **Business Development Intern** (Partner outreach, CRM hygiene, venture briefs)
4. **Property Acquisition Intern** (Real estate underwriting, zoning, cash flow modeling)

---

## 📁 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── globals.css          # Monochrome styles, print letterhead rules
│   │   ├── layout.tsx           # Global HTML shell & Geist font
│   │   └── page.tsx             # Root IMS App with dynamic module routing
│   ├── components/
│   │   ├── common/              # Button, Modal, Badge, EmptyState
│   │   ├── layout/              # Sidebar, Header, DemoBanner
│   │   └── modules/             # 14 distinct feature modules:
│   │       ├── DashboardModule.tsx
│   │       ├── InternsModule.tsx
│   │       ├── RolesModule.tsx
│   │       ├── OnboardingModule.tsx
│   │       ├── TasksModule.tsx
│   │       ├── ProjectsModule.tsx
│   │       ├── CalendarModule.tsx
│   │       ├── DocumentsModule.tsx
│   │       ├── AttendanceModule.tsx
│   │       ├── AnnouncementsModule.tsx
│   │       ├── FeedbackModule.tsx
│   │       ├── CertificatesModule.tsx
│   │       ├── ReportsModule.tsx
│   │       ├── UserManagementModule.tsx
│   │       ├── SettingsModule.tsx
│   │       └── ProfileModule.tsx
│   ├── context/
│   │   ├── auth-context.tsx     # Persona switcher & Supabase session listener
│   │   └── data-context.tsx     # Unified reactive store with RBAC filters
│   ├── lib/
│   │   ├── sample-data.ts       # Realistic IntraSphere Labs seed dataset
│   │   └── supabase/
│   │       └── client.ts        # Supabase client initializer & config validation
│   └── types/
│       └── index.ts             # Complete TypeScript data model
└── supabase/
    └── schema.sql               # Full PostgreSQL schema with RLS policies
```

---

## 🛠️ Setup & Running Locally

### 1. Prerequisites
- Node.js 18+ (tested on Node v22.12.0)
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The app runs immediately in **DEMO MODE** with pre-seeded, realistic IntraSphere Labs records.

---

## 🔐 Supabase Production Configuration

To switch from Demo Mode to production Supabase persistence:

### 1. Create a Supabase Project
Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run Database Migrations
Copy the entire content of [`supabase/schema.sql`](supabase/schema.sql) and execute it in the **Supabase SQL Editor**. This sets up:
- 15 relational tables with foreign keys and cascade rules
- Indexes on status, coordinator, and date columns
- Row Level Security (RLS) policies for private intern records, documents, and reviews
- Audit logging triggers

### 3. Configure Private Storage Buckets
In the Supabase Storage dashboard, create two private buckets:
- `documents`
- `offer-letters`  
*(Disable public access; the system utilizes authenticated short-lived signed URLs).*

### 4. Set Environment Variables
Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...your-anon-key
```

### 5. Provision the First Administrator
Public admin registration is blocked. In your Supabase SQL Editor, run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@intraspherelabs.com';
```

---

## 🖨️ PDF Export & Document Generation

Both **Offer Letters** (under Documents) and **Completion Certificates** (under Certificates) feature:
- Clean, high-fidelity letterhead typography adhering to company branding
- Live state differentiation: Draft vs Approved vs Issued
- One-click print styling (`@media print` rules) formatted for single-page standard PDF printing via browser print dialog.

---

## 📄 License & Attribution

Developed for **IntraSphere Labs**. All rights reserved.
