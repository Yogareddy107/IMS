'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Intern,
  InternshipRole,
  Project,
  Task,
  OnboardingItem,
  CalendarEvent,
  IMSDocument,
  CheckInLog,
  Announcement,
  PerformanceReview,
  Certificate,
  ActivityLog,
  SystemSettings,
  TaskStatus,
  CertificateStatus,
} from '@/types';
import {
  INITIAL_INTERNS,
  INITIAL_ROLES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_ONBOARDING_ITEMS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_DOCUMENTS,
  INITIAL_CHECKINS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_REVIEWS,
  INITIAL_CERTIFICATES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SETTINGS,
  DEFAULT_CHECKLIST_TEMPLATE,
} from '@/lib/sample-data';
import { useAuth } from './auth-context';
import { dispatchNotification } from '@/lib/notifications';

interface DataContextType {
  interns: Intern[];
  roles: InternshipRole[];
  projects: Project[];
  tasks: Task[];
  onboardingItems: OnboardingItem[];
  calendarEvents: CalendarEvent[];
  documents: IMSDocument[];
  checkins: CheckInLog[];
  announcements: Announcement[];
  reviews: PerformanceReview[];
  certificates: Certificate[];
  activityLogs: ActivityLog[];
  settings: SystemSettings;
  // Mutations
  addIntern: (newIntern: Omit<Intern, 'id' | 'created_at' | 'updated_at'>) => void;
  updateIntern: (id: string, updates: Partial<Intern>) => void;
  archiveIntern: (id: string) => void;
  toggleOnboardingItem: (itemId: string, isCompleted: boolean, blockerNotes?: string) => void;
  addOnboardingItem: (item: Omit<OnboardingItem, 'id'>) => void;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addTaskComment: (taskId: string, content: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  createProject: (project: Omit<Project, 'id' | 'created_at'>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  createDocument: (doc: Omit<IMSDocument, 'id' | 'created_at'>) => void;
  updateDocument: (docId: string, updates: Partial<IMSDocument>) => void;
  approveOfferLetter: (docId: string) => void;
  issueOfferLetter: (docId: string) => void;
  submitCheckin: (checkin: Omit<CheckInLog, 'id' | 'created_at'>) => void;
  reviewCheckin: (checkinId: string, notes: string) => void;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at'>) => void;
  submitReview: (review: Omit<PerformanceReview, 'id' | 'created_at'>) => void;
  createCertificate: (cert: Omit<Certificate, 'id' | 'created_at'>) => void;
  updateCertificateStatus: (certId: string, status: CertificateStatus) => void;
  createCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'created_at'>) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetDemoData: () => void;
  // Role-filtered helpers
  filteredInterns: Intern[];
  filteredTasks: Task[];
  filteredProjects: Project[];
  filteredCheckins: CheckInLog[];
  filteredDocuments: IMSDocument[];
  filteredReviews: PerformanceReview[];
  filteredAnnouncements: Announcement[];
  currentInternRecord: Intern | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'isl_ims_prod_v2_';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, currentRole, isDemoMode } = useAuth();

  // Helper to load or fallback, purging old mock data
  const loadState = <T,>(key: string, initial: T): T => {
    if (typeof window === 'undefined') return initial;
    try {
      // Purge old mock prefix if present
      localStorage.removeItem('isl_ims_data_' + key);
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  };

  const [interns, setInterns] = useState<Intern[]>(() => loadState('interns', INITIAL_INTERNS));
  const [roles, setRoles] = useState<InternshipRole[]>(() => loadState('roles', INITIAL_ROLES));
  const [projects, setProjects] = useState<Project[]>(() => loadState('projects', INITIAL_PROJECTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadState('tasks', INITIAL_TASKS));
  const [onboardingItems, setOnboardingItems] = useState<OnboardingItem[]>(() =>
    loadState('onboarding', INITIAL_ONBOARDING_ITEMS)
  );
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() =>
    loadState('calendar', INITIAL_CALENDAR_EVENTS)
  );
  const [documents, setDocuments] = useState<IMSDocument[]>(() =>
    loadState('documents', INITIAL_DOCUMENTS)
  );
  const [checkins, setCheckins] = useState<CheckInLog[]>(() =>
    loadState('checkins', INITIAL_CHECKINS)
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    loadState('announcements', INITIAL_ANNOUNCEMENTS)
  );
  const [reviews, setReviews] = useState<PerformanceReview[]>(() =>
    loadState('reviews', INITIAL_REVIEWS)
  );
  const [certificates, setCertificates] = useState<Certificate[]>(() =>
    loadState('certificates', INITIAL_CERTIFICATES)
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadState('logs', INITIAL_ACTIVITY_LOGS)
  );
  const [settings, setSettings] = useState<SystemSettings>(() =>
    loadState('settings', INITIAL_SETTINGS)
  );

  // Register Service Worker for mobile push and lock-screen alerts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('IMS Service worker registration notice:', err);
      });
    }
  }, []);

  // Debounced persistence to prevent blocking the main thread during high concurrency
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PREFIX + 'interns', JSON.stringify(interns));
        localStorage.setItem(STORAGE_PREFIX + 'roles', JSON.stringify(roles));
        localStorage.setItem(STORAGE_PREFIX + 'projects', JSON.stringify(projects));
        localStorage.setItem(STORAGE_PREFIX + 'tasks', JSON.stringify(tasks));
        localStorage.setItem(STORAGE_PREFIX + 'onboarding', JSON.stringify(onboardingItems));
        localStorage.setItem(STORAGE_PREFIX + 'calendar', JSON.stringify(calendarEvents));
        localStorage.setItem(STORAGE_PREFIX + 'documents', JSON.stringify(documents));
        localStorage.setItem(STORAGE_PREFIX + 'checkins', JSON.stringify(checkins));
        localStorage.setItem(STORAGE_PREFIX + 'announcements', JSON.stringify(announcements));
        localStorage.setItem(STORAGE_PREFIX + 'reviews', JSON.stringify(reviews));
        localStorage.setItem(STORAGE_PREFIX + 'certificates', JSON.stringify(certificates));
        localStorage.setItem(STORAGE_PREFIX + 'logs', JSON.stringify(activityLogs));
        localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
      } catch (err) {
        console.warn('Storage write note:', err);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [
    interns,
    roles,
    projects,
    tasks,
    onboardingItems,
    calendarEvents,
    documents,
    checkins,
    announcements,
    reviews,
    certificates,
    activityLogs,
    settings,
  ]);

  // Real-time synchronization across browser tabs and concurrent sessions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === STORAGE_PREFIX + 'tasks') setTasks(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'interns') setInterns(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'announcements') setAnnouncements(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'onboarding') setOnboardingItems(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'checkins') setCheckins(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'documents') setDocuments(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'reviews') setReviews(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'projects') setProjects(JSON.parse(e.newValue));
        else if (e.key === STORAGE_PREFIX + 'certificates') setCertificates(JSON.parse(e.newValue));
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logActivity = (action: string, module: string, details: string) => {
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
      user_id: currentUser?.id || 'sys',
      user_name: currentUser?.full_name || 'System',
      role: currentRole,
      action,
      module,
      details,
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Find intern record for current logged in user if intern
  const currentInternRecord =
    interns.find(
      (i) =>
        i.user_id === currentUser?.id ||
        i.email.toLowerCase() === currentUser?.email.toLowerCase()
    ) || null;

  // Add Intern & Auto-populate Onboarding Checklist
  const addIntern = (newInternData: Omit<Intern, 'id' | 'created_at' | 'updated_at'>) => {
    const id = 'intern-' + Date.now();
    const now = new Date().toISOString();
    const createdIntern: Intern = {
      ...newInternData,
      id,
      created_at: now,
      updated_at: now,
    };
    setInterns((prev) => [createdIntern, ...prev]);

    // Initialize 9 default onboarding checklist items for this intern
    const initialItems: OnboardingItem[] = DEFAULT_CHECKLIST_TEMPLATE.map((tmpl, idx) => ({
      id: `onb-${id}-${idx + 1}`,
      intern_id: id,
      title: tmpl.title,
      description: tmpl.description,
      category: tmpl.category,
      assigned_to: tmpl.assigned_to,
      is_completed: false,
      completed_at: null,
      completed_by: null,
      order_index: idx + 1,
    }));
    setOnboardingItems((prev) => [...prev, ...initialItems]);

    // Create Draft Offer Letter document
    const offerDoc: IMSDocument = {
      id: 'doc-offer-' + Date.now(),
      title: `Offer Letter — ${createdIntern.full_name} (${createdIntern.role_title})`,
      category: 'Offer Letter',
      intern_id: id,
      intern_name: createdIntern.full_name,
      project_id: createdIntern.assigned_project_id,
      project_name: createdIntern.assigned_project_name,
      file_url: '#',
      file_name: `ISL_Offer_Letter_${createdIntern.full_name.replace(/\s+/g, '_')}.pdf`,
      file_size: '140 KB',
      owner_id: currentUser?.id || 'admin',
      owner_name: currentUser?.full_name || 'Staff',
      status: 'Draft',
      created_at: now,
      offer_details: {
        intern_name: createdIntern.full_name,
        intern_email: createdIntern.email,
        role_title: createdIntern.role_title,
        start_date: createdIntern.start_date,
        duration: settings.default_duration || '3 Months',
        work_arrangement: settings.default_work_arrangement || 'Remote',
        compensation_terms: settings.default_stipend || 'Stipend: $1,400/month',
        responsibilities: [
          'Fulfill designated cohort project deliverables and sprint requirements.',
          'Submit regular check-ins and participate in weekly milestone reviews.',
          'Collaborate effectively with team members, mentors, and project coordinators.',
        ],
        signatory_name: settings.authorized_signatory_name,
        signatory_title: settings.authorized_signatory_title,
        issue_date: now.split('T')[0],
        is_approved: false,
        is_issued: false,
      },
    };
    setDocuments((prev) => [offerDoc, ...prev]);

    logActivity('Added Intern', 'Interns', `Added intern ${createdIntern.full_name} (${createdIntern.role_title})`);
  };

  const updateIntern = (id: string, updates: Partial<Intern>) => {
    setInterns((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i))
    );
    logActivity('Updated Intern Profile', 'Interns', `Updated intern profile ID ${id}`);
  };

  const archiveIntern = (id: string) => {
    setInterns((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_archived: true, updated_at: new Date().toISOString() } : i))
    );
    logActivity('Archived Intern', 'Interns', `Archived intern record ${id}`);
  };

  const toggleOnboardingItem = (itemId: string, isCompleted: boolean, blockerNotes?: string) => {
    setOnboardingItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              is_completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : null,
              completed_by: isCompleted ? currentUser?.full_name : null,
              blocker_notes: blockerNotes !== undefined ? blockerNotes : item.blocker_notes,
            }
          : item
      )
    );
    logActivity(
      isCompleted ? 'Completed Onboarding Step' : 'Reopened Onboarding Step',
      'Onboarding',
      `Onboarding step updated: ${itemId}`
    );
  };

  const addOnboardingItem = (itemData: Omit<OnboardingItem, 'id'>) => {
    const newItem: OnboardingItem = {
      ...itemData,
      id: 'onb-custom-' + Date.now(),
    };
    setOnboardingItems((prev) => [...prev, newItem]);
    logActivity('Added Custom Onboarding Item', 'Onboarding', `Item: ${itemData.title}`);
  };

  const createTask = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      created_at: now,
      updated_at: now,
    };
    setTasks((prev) => [newTask, ...prev]);
    logActivity('Created Task', 'Tasks', `Created task "${newTask.title}" for ${newTask.assigned_to_name}`);

    // Out-of-app notification
    const assigned = interns.find((i) => i.id === newTask.assigned_to_id);
    dispatchNotification({
      recipientEmail: assigned?.email,
      recipientName: newTask.assigned_to_name,
      title: `New Task Assigned: ${newTask.title}`,
      body: `You have been assigned "${newTask.title}" on project "${newTask.project_name}". Due date: ${newTask.due_date}. Priority: ${newTask.priority}.`,
      type: 'task_assigned',
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const completedAt =
            updates.status === 'Completed' && t.status !== 'Completed'
              ? now
              : updates.status && updates.status !== 'Completed'
              ? null
              : t.completed_at;
          return { ...t, ...updates, updated_at: now, completed_at: completedAt };
        }
        return t;
      })
    );
    logActivity('Updated Task', 'Tasks', `Task ${taskId} status/fields updated`);

    if (updates.status === 'Completed' || updates.status === 'In Review') {
      const currentTask = tasks.find((t) => t.id === taskId);
      if (currentTask) {
        dispatchNotification({
          title: `Task Updated: ${currentTask.title} (${updates.status})`,
          body: `${currentUser?.full_name || 'User'} marked task as "${updates.status}". Assigned to: ${currentTask.assigned_to_name}.`,
          type: 'task_completed',
          senderName: currentUser?.full_name,
        });
      }
    }
  };

  const addTaskComment = (taskId: string, content: string) => {
    const comment = {
      id: 'comm-' + Date.now(),
      author_id: currentUser?.id || 'sys',
      author_name: currentUser?.full_name || 'User',
      author_role: currentRole,
      content,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t))
    );
    logActivity('Added Task Comment', 'Tasks', `Comment on task ${taskId}`);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ),
          };
        }
        return t;
      })
    );
  };

  const createProject = (projectData: Omit<Project, 'id' | 'created_at'>) => {
    const newProj: Project = {
      ...projectData,
      id: 'proj-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...prev]);
    logActivity('Created Project', 'Projects', `Project: ${newProj.name}`);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
    logActivity('Updated Project', 'Projects', `Project updated: ${projectId}`);
  };

  const createDocument = (docData: Omit<IMSDocument, 'id' | 'created_at'>) => {
    const newDoc: IMSDocument = {
      ...docData,
      id: 'doc-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    logActivity('Added Document', 'Documents', `Document: ${newDoc.title}`);
  };

  const updateDocument = (docId: string, updates: Partial<IMSDocument>) => {
    setDocuments((prev) => {
      const next = prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            ...updates,
            offer_details: updates.offer_details
              ? {
                  ...(d.offer_details || {
                    intern_name: d.intern_name || '',
                    intern_email: '',
                    role_title: '',
                    start_date: new Date().toISOString().split('T')[0],
                    duration: settings.default_duration || '3 Months',
                    work_arrangement: settings.default_work_arrangement || 'Remote',
                    compensation_terms: settings.default_stipend || 'Stipend: $1,400/month',
                    responsibilities: [],
                    signatory_name: settings.authorized_signatory_name || 'IntraSphere Admin',
                    signatory_title: settings.authorized_signatory_title || 'Operations Lead',
                    issue_date: new Date().toISOString().split('T')[0],
                    is_approved: false,
                    is_issued: false,
                  }),
                  ...updates.offer_details,
                }
              : d.offer_details,
          };
        }
        return d;
      });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_PREFIX + 'documents', JSON.stringify(next));
        } catch (e) {
          console.warn('Documents immediate save notice:', e);
        }
      }
      return next;
    });
    logActivity('Updated Document', 'Documents', `Document terms updated: ${docId}`);
  };

  const approveOfferLetter = (docId: string) => {
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId && d.offer_details) {
          return {
            ...d,
            status: 'Approved',
            approved_by: currentUser?.full_name,
            approved_at: now,
            offer_details: {
              ...d.offer_details,
              is_approved: true,
            },
          };
        }
        return d;
      })
    );
    logActivity('Approved Offer Letter', 'Documents', `Offer letter approved: ${docId}`);
  };

  const issueOfferLetter = (docId: string) => {
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId && d.offer_details) {
          // Update associated intern status if present
          if (d.intern_id) {
            updateIntern(d.intern_id, { status: 'Offer Sent' });
          }
          return {
            ...d,
            status: 'Issued',
            offer_details: {
              ...d.offer_details,
              is_issued: true,
            },
          };
        }
        return d;
      })
    );
    logActivity('Issued Offer Letter', 'Documents', `Offer letter officially issued: ${docId}`);

    const targetDoc = documents.find((doc) => doc.id === docId);
    if (targetDoc?.offer_details) {
      dispatchNotification({
        recipientEmail: targetDoc.offer_details.intern_email,
        recipientName: targetDoc.offer_details.intern_name,
        title: 'Official Internship Offer Letter Issued',
        body: `Your official offer letter for ${targetDoc.offer_details.role_title} has been approved and issued by IntraSphere Labs.`,
        type: 'offer_letter',
      });
    }
  };

  const submitCheckin = (checkinData: Omit<CheckInLog, 'id' | 'created_at'>) => {
    const newCheckin: CheckInLog = {
      ...checkinData,
      id: 'chk-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setCheckins((prev) => [newCheckin, ...prev]);
    logActivity('Submitted Check-in', 'Attendance', `Check-in for ${newCheckin.intern_name} on ${newCheckin.date}`);

    const hasBlocker = Boolean(newCheckin.blockers && newCheckin.blockers.trim().length > 0);
    dispatchNotification({
      title: hasBlocker
        ? `[Urgent Blocker] ${newCheckin.intern_name} reported an obstacle`
        : `Check-in Logged: ${newCheckin.intern_name}`,
      body: hasBlocker
        ? `Blocker reported: "${newCheckin.blockers}". Worked on: "${newCheckin.work_summary}".`
        : `Work summary: "${newCheckin.work_summary}". Key learning: "${newCheckin.learning_progress || 'N/A'}".`,
      type: hasBlocker ? 'blocker_alert' : 'checkin_submitted',
      senderName: newCheckin.intern_name,
    });
  };

  const reviewCheckin = (checkinId: string, notes: string) => {
    setCheckins((prev) =>
      prev.map((c) =>
        c.id === checkinId
          ? {
              ...c,
              reviewed_by_id: currentUser?.id,
              reviewer_name: currentUser?.full_name,
              reviewer_notes: notes,
            }
          : c
      )
    );
    logActivity('Reviewed Check-in', 'Attendance', `Reviewed check-in: ${checkinId}`);

    const chk = checkins.find((c) => c.id === checkinId);
    if (chk) {
      const targetIntern = interns.find((i) => i.id === chk.intern_id);
      dispatchNotification({
        recipientEmail: targetIntern?.email,
        recipientName: chk.intern_name,
        senderName: currentUser?.full_name || 'Coordinator',
        title: 'Mentor Feedback on Your Daily Check-in',
        body: `${currentUser?.full_name || 'Coordinator'} reviewed your check-in: "${notes}"`,
        type: 'checkin_reviewed',
      });
    }
  };

  const createAnnouncement = (data: Omit<Announcement, 'id' | 'created_at'>) => {
    const newAnn: Announcement = {
      ...data,
      id: 'ann-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    logActivity('Posted Announcement', 'Announcements', `Announcement: ${newAnn.title}`);

    dispatchNotification({
      title: `IntraSphere Announcement: ${newAnn.title}`,
      body: newAnn.message,
      senderName: newAnn.author_name,
      type: 'announcement',
    });
  };

  const submitReview = (data: Omit<PerformanceReview, 'id' | 'created_at'>) => {
    const newRev: PerformanceReview = {
      ...data,
      id: 'rev-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setReviews((prev) => [newRev, ...prev]);
    logActivity('Submitted Performance Review', 'Feedback', `Review for ${newRev.intern_name}`);

    const targetIntern = interns.find((i) => i.id === newRev.intern_id);
    dispatchNotification({
      recipientEmail: targetIntern?.email,
      recipientName: newRev.intern_name,
      senderName: newRev.reviewer_name,
      title: `Milestone Performance Review: ${newRev.review_period}`,
      body: `Your review for ${newRev.review_period} has been submitted by ${newRev.reviewer_name} (Task Completion: ${newRev.task_completion_rating}). Sign in to IntraSphere IMS to see your full rubric and feedback.`,
      type: 'performance_review',
    });
  };

  const createCertificate = (data: Omit<Certificate, 'id' | 'created_at'>) => {
    const newCert: Certificate = {
      ...data,
      id: 'cert-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setCertificates((prev) => [newCert, ...prev]);
    logActivity('Created Certificate Draft', 'Certificates', `Certificate for ${newCert.intern_name}`);
  };

  const updateCertificateStatus = (certId: string, status: CertificateStatus) => {
    setCertificates((prev) =>
      prev.map((c) => {
        if (c.id === certId) {
          const approvedBy = status === 'Approved' ? currentUser?.full_name : c.approved_by;
          const issuedBy = status === 'Issued' ? currentUser?.full_name : c.issued_by;
          if (status === 'Issued' && c.intern_id) {
            updateIntern(c.intern_id, {
              status: 'Completed',
              certificate_status: 'Issued',
            });
          } else if (status === 'Approved' && c.intern_id) {
            updateIntern(c.intern_id, { certificate_status: 'Approved' });
          }
          return {
            ...c,
            status,
            approved_by: approvedBy,
            issued_by: issuedBy,
          };
        }
        return c;
      })
    );
    logActivity('Updated Certificate Status', 'Certificates', `Certificate ${certId} set to ${status}`);
  };

  const createCalendarEvent = (data: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    const newEv: CalendarEvent = {
      ...data,
      id: 'cal-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setCalendarEvents((prev) => [newEv, ...prev]);
    logActivity('Created Calendar Event', 'Calendar', `Event: ${newEv.title}`);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(merged));
        } catch (e) {
          console.warn('Settings direct save notice:', e);
        }
      }
      return merged;
    });
    logActivity('Updated System Settings', 'Settings', 'Configured brand identity and platform parameters');
  };

  const resetDemoData = () => {
    setInterns(INITIAL_INTERNS);
    setRoles(INITIAL_ROLES);
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setOnboardingItems(INITIAL_ONBOARDING_ITEMS);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setDocuments(INITIAL_DOCUMENTS);
    setCheckins(INITIAL_CHECKINS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setReviews(INITIAL_REVIEWS);
    setCertificates(INITIAL_CERTIFICATES);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setSettings(INITIAL_SETTINGS);
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('isl_ims_')) localStorage.removeItem(k);
      });
    }
  };

  // ---------------------------------------------------------
  // ROLE-BASED ACCESS CONTROL (DATA FILTERING)
  // ---------------------------------------------------------
  // 1. Interns list
  const filteredInterns = interns.filter((i) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      return i.coordinator_id === currentUser?.id || i.coordinator_name === currentUser?.full_name;
    }
    if (currentRole === 'intern') {
      // Intern only sees themselves
      return (
        i.user_id === currentUser?.id ||
        i.email.toLowerCase() === currentUser?.email.toLowerCase()
      );
    }
    return false;
  });

  // 2. Tasks
  const filteredTasks = tasks.filter((t) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      // Coordinator sees tasks for interns assigned to them
      const assignedIntern = interns.find((i) => i.id === t.assigned_to_id);
      return (
        assignedIntern?.coordinator_id === currentUser?.id ||
        assignedIntern?.coordinator_name === currentUser?.full_name ||
        t.created_by_id === currentUser?.id
      );
    }
    if (currentRole === 'intern') {
      // Intern only sees tasks assigned to them
      return (
        t.assigned_to_id === currentInternRecord?.id ||
        t.assigned_to_name === currentInternRecord?.full_name ||
        t.assigned_to_name === currentUser?.full_name
      );
    }
    return false;
  });

  // 3. Projects
  const filteredProjects = projects.filter((p) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      return (
        p.project_lead_id === currentUser?.id ||
        p.lead_name === currentUser?.full_name ||
        p.team_member_ids.includes(currentUser?.id || '')
      );
    }
    if (currentRole === 'intern') {
      // Intern only sees projects they are a member of
      return (
        p.team_member_ids.includes(currentUser?.id || '') ||
        p.team_member_names.includes(currentInternRecord?.full_name || '')
      );
    }
    return false;
  });

  // 4. Checkins
  const filteredCheckins = checkins.filter((c) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      const assignedIntern = interns.find((i) => i.id === c.intern_id);
      return (
        assignedIntern?.coordinator_id === currentUser?.id ||
        assignedIntern?.coordinator_name === currentUser?.full_name
      );
    }
    if (currentRole === 'intern') {
      return (
        c.intern_id === currentInternRecord?.id ||
        c.intern_name === currentInternRecord?.full_name ||
        c.intern_name === currentUser?.full_name
      );
    }
    return false;
  });

  // 5. Documents
  const filteredDocuments = documents.filter((d) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      if (d.owner_id === currentUser?.id) return true;
      if (d.intern_id) {
        const assignedIntern = interns.find((i) => i.id === d.intern_id);
        return (
          assignedIntern?.coordinator_id === currentUser?.id ||
          assignedIntern?.coordinator_name === currentUser?.full_name
        );
      }
      return true;
    }
    if (currentRole === 'intern') {
      // Intern can only see documents addressed to them and only if Approved or Issued!
      const isTarget =
        d.intern_id === currentInternRecord?.id ||
        d.intern_name === currentInternRecord?.full_name;
      return isTarget && (d.status === 'Approved' || d.status === 'Issued');
    }
    return false;
  });

  // 6. Performance Reviews
  const filteredReviews = reviews.filter((r) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      return r.reviewer_id === currentUser?.id || r.reviewer_name === currentUser?.full_name;
    }
    if (currentRole === 'intern') {
      return (
        r.intern_id === currentInternRecord?.id ||
        r.intern_name === currentInternRecord?.full_name
      );
    }
    return false;
  });

  // 7. Announcements
  const filteredAnnouncements = announcements.filter((a) => {
    if (a.is_archived) return false;
    if (currentRole === 'admin') return true;
    if (a.audience === 'All') return true;
    if (currentRole === 'coordinator' && a.audience === 'Coordinators') return true;
    if (currentRole === 'intern' && a.audience === 'Interns') return true;
    if (a.audience === 'Specific Role' && currentInternRecord?.role_title === a.target_role) {
      return true;
    }
    return false;
  });

  return (
    <DataContext.Provider
      value={{
        interns,
        roles,
        projects,
        tasks,
        onboardingItems,
        calendarEvents,
        documents,
        checkins,
        announcements,
        reviews,
        certificates,
        activityLogs,
        settings,
        addIntern,
        updateIntern,
        archiveIntern,
        toggleOnboardingItem,
        addOnboardingItem,
        createTask,
        updateTask,
        addTaskComment,
        toggleSubtask,
        createProject,
        updateProject,
        createDocument,
        updateDocument,
        approveOfferLetter,
        issueOfferLetter,
        submitCheckin,
        reviewCheckin,
        createAnnouncement,
        submitReview,
        createCertificate,
        updateCertificateStatus,
        createCalendarEvent,
        updateSettings,
        resetDemoData,
        filteredInterns,
        filteredTasks,
        filteredProjects,
        filteredCheckins,
        filteredDocuments,
        filteredReviews,
        filteredAnnouncements,
        currentInternRecord,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
