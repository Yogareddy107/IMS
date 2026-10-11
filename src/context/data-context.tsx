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
import { supabase } from '@/lib/supabase/client';

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
  filteredDocuments: IMSDocument[];
  filteredCheckins: CheckInLog[];
  filteredAnnouncements: Announcement[];
  filteredReviews: PerformanceReview[];
  currentInternRecord: Intern | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, currentRole } = useAuth();

  const [interns, setInterns] = useState<Intern[]>(INITIAL_INTERNS);
  const [roles, setRoles] = useState<InternshipRole[]>(INITIAL_ROLES);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [onboardingItems, setOnboardingItems] = useState<OnboardingItem[]>(INITIAL_ONBOARDING_ITEMS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [documents, setDocuments] = useState<IMSDocument[]>(INITIAL_DOCUMENTS);
  const [checkins, setCheckins] = useState<CheckInLog[]>(INITIAL_CHECKINS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [reviews, setReviews] = useState<PerformanceReview[]>(INITIAL_REVIEWS);
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);

  // Helper to safely write to Supabase in the background
  const syncSupabase = (fn: () => PromiseLike<unknown>) => {
    if (!supabase) return;
    try {
      Promise.resolve(fn()).catch((err) => {
        console.warn('Supabase sync notice:', err);
      });
    } catch (err) {
      console.warn('Supabase operation notice:', err);
    }
  };

  // Register Service Worker for mobile push and lock-screen alerts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('IMS Service worker registration notice:', err);
      });
    }
  }, []);

  // Fetch all collections directly from Supabase on mount (NO LOCAL STORAGE)
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const loadSupabaseData = async () => {
      try {
        const [
          internsRes,
          rolesRes,
          projectsRes,
          tasksRes,
          onboardingRes,
          calendarRes,
          documentsRes,
          checkinsRes,
          announcementsRes,
          reviewsRes,
          certificatesRes,
          logsRes,
          settingsRes,
        ] = await Promise.allSettled([
          client.from('interns').select('*').order('created_at', { ascending: false }),
          client.from('internship_roles').select('*'),
          client.from('projects').select('*'),
          client.from('tasks').select('*').order('created_at', { ascending: false }),
          client.from('onboarding_items').select('*'),
          client.from('calendar_events').select('*'),
          client.from('documents').select('*').order('created_at', { ascending: false }),
          client.from('attendance_logs').select('*').order('created_at', { ascending: false }),
          client.from('announcements').select('*').order('created_at', { ascending: false }),
          client.from('reviews').select('*').order('created_at', { ascending: false }),
          client.from('certificates').select('*').order('created_at', { ascending: false }),
          client.from('activity_logs').select('*').order('created_at', { ascending: false }),
          client.from('system_settings').select('*').maybeSingle(),
        ]);

        if (internsRes.status === 'fulfilled' && internsRes.value.data && internsRes.value.data.length > 0) {
          setInterns(internsRes.value.data as Intern[]);
        }
        if (rolesRes.status === 'fulfilled' && rolesRes.value.data && rolesRes.value.data.length > 0) {
          setRoles(rolesRes.value.data as InternshipRole[]);
        }
        if (projectsRes.status === 'fulfilled' && projectsRes.value.data && projectsRes.value.data.length > 0) {
          setProjects(projectsRes.value.data as Project[]);
        }
        if (tasksRes.status === 'fulfilled' && tasksRes.value.data && tasksRes.value.data.length > 0) {
          setTasks(tasksRes.value.data as Task[]);
        }
        if (onboardingRes.status === 'fulfilled' && onboardingRes.value.data && onboardingRes.value.data.length > 0) {
          setOnboardingItems(onboardingRes.value.data as OnboardingItem[]);
        }
        if (calendarRes.status === 'fulfilled' && calendarRes.value.data && calendarRes.value.data.length > 0) {
          setCalendarEvents(calendarRes.value.data as CalendarEvent[]);
        }
        if (documentsRes.status === 'fulfilled' && documentsRes.value.data && documentsRes.value.data.length > 0) {
          setDocuments(documentsRes.value.data as IMSDocument[]);
        }
        if (checkinsRes.status === 'fulfilled' && checkinsRes.value.data && checkinsRes.value.data.length > 0) {
          setCheckins(checkinsRes.value.data as CheckInLog[]);
        }
        if (announcementsRes.status === 'fulfilled' && announcementsRes.value.data && announcementsRes.value.data.length > 0) {
          setAnnouncements(announcementsRes.value.data as Announcement[]);
        }
        if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data && reviewsRes.value.data.length > 0) {
          setReviews(reviewsRes.value.data as PerformanceReview[]);
        }
        if (certificatesRes.status === 'fulfilled' && certificatesRes.value.data && certificatesRes.value.data.length > 0) {
          setCertificates(certificatesRes.value.data as Certificate[]);
        }
        if (logsRes.status === 'fulfilled' && logsRes.value.data && logsRes.value.data.length > 0) {
          setActivityLogs(logsRes.value.data as ActivityLog[]);
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
          setSettings((prev) => ({ ...prev, ...(settingsRes.value.data as unknown as Partial<SystemSettings>) }));
        }
      } catch (err) {
        console.warn('Supabase bulk load note:', err);
      }
    };

    loadSupabaseData();
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
    syncSupabase(() => supabase!.from('activity_logs').insert(newLog));
  };

  // Find intern record for current logged in user if intern
  const currentInternRecord =
    interns.find(
      (i) =>
        i.user_id === currentUser?.id ||
        (i.email && currentUser?.email && i.email.toLowerCase() === currentUser.email.toLowerCase())
    ) || null;

  // Add Intern & Auto-populate Onboarding Checklist directly in Supabase
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

    // Save directly to Supabase
    syncSupabase(() => supabase!.from('interns').insert(createdIntern));
    syncSupabase(() => supabase!.from('onboarding_items').insert(initialItems));
    syncSupabase(() => supabase!.from('documents').insert(offerDoc));

    logActivity('Added Intern', 'Interns', `Added intern ${createdIntern.full_name} (${createdIntern.role_title})`);
  };

  const updateIntern = (id: string, updates: Partial<Intern>) => {
    const updatedPayload = { ...updates, updated_at: new Date().toISOString() };
    setInterns((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updatedPayload } : i))
    );

    syncSupabase(() => supabase!.from('interns').update(updatedPayload).eq('id', id));

    logActivity('Updated Intern Profile', 'Interns', `Updated intern profile ID ${id}`);
  };

  const archiveIntern = (id: string) => {
    setInterns((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_archived: true, updated_at: new Date().toISOString() } : i))
    );

    syncSupabase(() => supabase!.from('interns').update({ is_archived: true }).eq('id', id));

    logActivity('Archived Intern', 'Interns', `Archived intern record ${id}`);
  };

  const toggleOnboardingItem = (itemId: string, isCompleted: boolean, blockerNotes?: string) => {
    const patch = {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? currentUser?.full_name || 'Staff' : null,
      blocker_notes: blockerNotes !== undefined ? blockerNotes : undefined,
    };

    setOnboardingItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );

    syncSupabase(() => supabase!.from('onboarding_items').update(patch).eq('id', itemId));

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

    syncSupabase(() => supabase!.from('onboarding_items').insert(newItem));

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

    syncSupabase(() => supabase!.from('tasks').insert(newTask));

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
          const merged = { ...t, ...updates, updated_at: now, completed_at: completedAt };
          syncSupabase(() => supabase!.from('tasks').update(merged).eq('id', taskId));
          return merged;
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
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedComments = [...t.comments, comment];
          syncSupabase(() => supabase!.from('tasks').update({ comments: updatedComments }).eq('id', taskId));
          return { ...t, comments: updatedComments };
        }
        return t;
      })
    );
    logActivity('Added Task Comment', 'Tasks', `Comment on task ${taskId}`);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          syncSupabase(() => supabase!.from('tasks').update({ subtasks: updatedSubtasks }).eq('id', taskId));
          return { ...t, subtasks: updatedSubtasks };
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

    syncSupabase(() => supabase!.from('projects').insert(newProj));

    logActivity('Created Project', 'Projects', `Project: ${newProj.name}`);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const merged = { ...p, ...updates, updated_at: new Date().toISOString() };
          syncSupabase(() => supabase!.from('projects').update(merged).eq('id', projectId));
          return merged;
        }
        return p;
      })
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

    syncSupabase(() => supabase!.from('documents').insert(newDoc));

    logActivity('Added Document', 'Documents', `Document: ${newDoc.title}`);
  };

  const updateDocument = (docId: string, updates: Partial<IMSDocument>) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const merged = {
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

          syncSupabase(() => supabase!.from('documents').update(merged).eq('id', docId));

          return merged;
        }
        return d;
      })
    );
    logActivity('Updated Document', 'Documents', `Document terms updated: ${docId}`);
  };

  const approveOfferLetter = (docId: string) => {
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId && d.offer_details) {
          const merged = {
            ...d,
            status: 'Approved' as const,
            approved_by: currentUser?.full_name,
            approved_at: now,
            offer_details: {
              ...d.offer_details,
              is_approved: true,
            },
          };
          syncSupabase(() => supabase!.from('documents').update(merged).eq('id', docId));
          return merged;
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
          if (d.intern_id) {
            updateIntern(d.intern_id, { status: 'Offer Sent' });
          }
          const merged = {
            ...d,
            status: 'Issued' as const,
            offer_details: {
              ...d.offer_details,
              is_issued: true,
            },
          };
          syncSupabase(() => supabase!.from('documents').update(merged).eq('id', docId));
          return merged;
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

    syncSupabase(() => supabase!.from('attendance_logs').insert(newCheckin));

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
      prev.map((c) => {
        if (c.id === checkinId) {
          const merged = {
            ...c,
            reviewed_by_id: currentUser?.id,
            reviewer_name: currentUser?.full_name,
            reviewer_notes: notes,
          };
          syncSupabase(() => supabase!.from('attendance_logs').update(merged).eq('id', checkinId));
          return merged;
        }
        return c;
      })
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

    syncSupabase(() => supabase!.from('announcements').insert(newAnn));

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

    syncSupabase(() => supabase!.from('reviews').insert(newRev));

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

    syncSupabase(() => supabase!.from('certificates').insert(newCert));

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
          const merged = {
            ...c,
            status,
            approved_by: approvedBy,
            issued_by: issuedBy,
          };
          syncSupabase(() => supabase!.from('certificates').update(merged).eq('id', certId));
          return merged;
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

    syncSupabase(() => supabase!.from('calendar_events').insert(newEv));

    logActivity('Created Calendar Event', 'Calendar', `Event: ${newEv.title}`);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      syncSupabase(() => supabase!.from('system_settings').upsert({ id: 'default', ...merged }));
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
  };

  // Role-filtered helpers
  const filteredInterns = interns.filter((intern) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      return intern.coordinator_id === currentUser?.id || intern.coordinator_name === currentUser?.full_name;
    }
    if (currentRole === 'intern') {
      return intern.user_id === currentUser?.id || intern.email.toLowerCase() === currentUser?.email.toLowerCase();
    }
    return false;
  });

  const filteredTasks = tasks.filter((task) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      const assignedIntern = interns.find((i) => i.id === task.assigned_to_id);
      return (
        task.created_by_id === currentUser?.id ||
        (assignedIntern &&
          (assignedIntern.coordinator_id === currentUser?.id ||
            assignedIntern.coordinator_name === currentUser?.full_name))
      );
    }
    if (currentRole === 'intern') {
      return (
        task.assigned_to_id === currentUser?.id ||
        (currentInternRecord && task.assigned_to_id === currentInternRecord.id)
      );
    }
    return false;
  });

  const filteredProjects = projects.filter((project) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      return (
        project.project_lead_id === currentUser?.id ||
        project.team_member_ids?.includes(currentUser?.id || '')
      );
    }
    if (currentRole === 'intern') {
      return (
        project.team_member_ids?.includes(currentUser?.id || '') ||
        (currentInternRecord && currentInternRecord.assigned_project_id === project.id)
      );
    }
    return false;
  });

  const filteredDocuments = documents.filter((doc) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      const docIntern = interns.find((i) => i.id === doc.intern_id);
      return (
        doc.owner_id === currentUser?.id ||
        (docIntern &&
          (docIntern.coordinator_id === currentUser?.id ||
            docIntern.coordinator_name === currentUser?.full_name))
      );
    }
    if (currentRole === 'intern') {
      const isMyDoc =
        doc.intern_id === currentUser?.id ||
        (currentInternRecord && doc.intern_id === currentInternRecord.id);
      return isMyDoc && (doc.status === 'Approved' || doc.status === 'Issued');
    }
    return false;
  });

  const filteredCheckins = checkins.filter((chk) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      const chkIntern = interns.find((i) => i.id === chk.intern_id);
      return (
        chkIntern &&
        (chkIntern.coordinator_id === currentUser?.id ||
          chkIntern.coordinator_name === currentUser?.full_name)
      );
    }
    if (currentRole === 'intern') {
      return (
        chk.intern_id === currentUser?.id ||
        (currentInternRecord && chk.intern_id === currentInternRecord.id)
      );
    }
    return false;
  });

  const filteredAnnouncements = announcements.filter((a) => {
    if (currentRole === 'admin') return true;
    if (a.audience === 'All') return true;
    if (currentRole === 'coordinator' && a.audience === 'Coordinators') return true;
    if (currentRole === 'intern' && a.audience === 'Interns') return true;
    return false;
  });

  const filteredReviews = reviews.filter((rev) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') {
      const assignedIntern = interns.find((i) => i.id === rev.intern_id);
      return (
        rev.reviewer_id === currentUser?.id ||
        (assignedIntern &&
          (assignedIntern.coordinator_id === currentUser?.id ||
            assignedIntern.coordinator_name === currentUser?.full_name))
      );
    }
    if (currentRole === 'intern') {
      return (
        rev.intern_id === currentUser?.id ||
        (currentInternRecord && rev.intern_id === currentInternRecord.id)
      );
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
        filteredDocuments,
        filteredCheckins,
        filteredAnnouncements,
        filteredReviews,
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
