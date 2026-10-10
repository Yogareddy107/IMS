'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  FileText,
  Calendar,
  Bell,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

interface DashboardModuleProps {
  onNavigate: (tab: string) => void;
  onOpenQuickAction: (action: string) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  onNavigate,
  onOpenQuickAction,
}) => {
  const { currentRole, currentUser } = useAuth();
  const {
    interns,
    tasks,
    projects,
    onboardingItems,
    calendarEvents,
    documents,
    checkins,
    announcements,
    reviews,
    activityLogs,
    filteredInterns,
    filteredTasks,
    filteredProjects,
    currentInternRecord,
  } = useData();

  const todayStr = new Date().toISOString().split('T')[0];

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================
  if (currentRole === 'admin') {
    const totalInterns = interns.length;
    const activeInterns = interns.filter((i) => i.status === 'Active').length;
    const onboardingInterns = interns.filter((i) => i.status === 'Onboarding').length;
    const completedInterns = interns.filter((i) => i.status === 'Completed').length;

    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'To Do' || t.status === 'In Review').length;
    const overdueTasks = tasks.filter((t) => t.status !== 'Completed' && t.due_date < todayStr).length;

    // Overall Onboarding %
    const totalOnb = onboardingItems.length;
    const completedOnb = onboardingItems.filter((o) => o.is_completed).length;
    const onboardingPct = totalOnb > 0 ? Math.round((completedOnb / totalOnb) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Total Interns</span>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{totalInterns}</div>
            <div className="text-[11px] text-[#6B7280] mt-1 flex items-center gap-1.5">
              <span className="font-medium text-neutral-900">{activeInterns} Active</span> •{' '}
              <span>{onboardingInterns} Onboarding</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Tasks In Progress</span>
              <FolderKanban className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{inProgressTasks}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">
              <span>{pendingTasks} Pending review or queue</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Overdue Tasks</span>
              <AlertTriangle className="w-4 h-4 text-neutral-700" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{overdueTasks}</div>
            <div className="text-[11px] text-neutral-600 mt-1 font-medium">
              {overdueTasks === 0 ? 'All tasks on schedule' : 'Requires coordinator attention'}
            </div>
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Onboarding Progress</span>
              <CheckCircle2 className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{onboardingPct}%</div>
            <div className="text-[11px] text-[#6B7280] mt-1">
              <span>{completedOnb} of {totalOnb} checklist items</span>
            </div>
          </div>
        </div>

        {/* Quick Action Ribbon */}
        <div className="p-4 bg-neutral-50 border border-[#E5E7EB] rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
              Admin Quick Actions
            </div>
            <div className="text-xs text-[#6B7280]">
              Quickly provision new records and communicate with cohorts
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenQuickAction('add-intern')}
            >
              Add Selected Intern
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenQuickAction('create-task')}
            >
              Create Task
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenQuickAction('create-project')}
            >
              Create Project
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenQuickAction('post-announcement')}
            >
              Post Announcement
            </Button>
          </div>
        </div>

        {/* Two Column Layout: Projects & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111111]">Active Projects & Workstreams</h2>
              <button
                onClick={() => onNavigate('tasks-projects')}
                className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 font-medium"
              >
                View all tasks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => {
                const projTasks = tasks.filter((t) => t.project_id === proj.id);
                const doneTasks = projTasks.filter((t) => t.status === 'Completed').length;
                const pct = projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs hover:border-neutral-400 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#111111]">{proj.name}</h3>
                          <Badge variant="neutral">{proj.status}</Badge>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                          {proj.description}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-medium text-neutral-800">
                        {pct}% Complete
                      </span>
                    </div>

                    <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-[#111111] h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                      <div>Lead: <span className="text-neutral-900 font-medium">{proj.lead_name}</span></div>
                      <div>{projTasks.length} linked tasks ({doneTasks} completed)</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upcoming Deadlines Mini List */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#111111]">Upcoming Cohort Deadlines</h2>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 font-medium"
                >
                  Open Calendar <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB]">
                {calendarEvents.length === 0 ? (
                  <div className="p-4 text-xs text-[#6B7280] text-center">
                    No upcoming cohort deadlines scheduled.
                  </div>
                ) : (
                  calendarEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                        <div>
                          <div className="font-medium text-[#111111]">{event.title}</div>
                          <div className="text-[11px] text-[#6B7280]">{event.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-neutral-900">{event.date}</div>
                        <Badge variant="subtle" size="sm">
                          {event.responsible_name || 'All'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed (1 column) */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#111111]">Live Activity Log</h2>
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-3">
              {activityLogs.length === 0 ? (
                <div className="text-xs text-[#6B7280] py-2 text-center">
                  No activity recorded yet.
                </div>
              ) : (
                activityLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="text-xs pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                      <span className="font-medium text-neutral-900">{log.user_name}</span>
                      <span className="font-mono">{log.created_at.split('T')[0]}</span>
                    </div>
                    <div className="mt-1 text-neutral-800 font-medium">{log.action}</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">{log.details}</div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Cohort Summary Box */}
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
              <div className="text-xs font-semibold text-[#111111]">Internship Cohort Status</div>
              <div className="mt-3 space-y-2 text-xs">
                {interns.length === 0 ? (
                  <div className="py-2 text-[11px] text-[#6B7280] text-center">
                    No interns registered yet. Use &ldquo;Add Selected Intern&rdquo; to begin.
                  </div>
                ) : (
                  interns.map((intern) => (
                    <div key={intern.id} className="flex items-center justify-between py-1 border-b border-neutral-100 last:border-0">
                      <div>
                        <div className="font-medium text-neutral-900">{intern.full_name}</div>
                        <div className="text-[11px] text-neutral-500">{intern.role_title}</div>
                      </div>
                      <Badge variant={intern.status === 'Active' ? 'dark' : 'neutral'}>
                        {intern.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // COORDINATOR DASHBOARD
  // ==========================================
  if (currentRole === 'coordinator') {
    const assignedInterns = filteredInterns;
    const assignedTasks = filteredTasks;
    const awaitingReviewTasks = assignedTasks.filter((t) => t.status === 'In Review');
    const inProgressTasks = assignedTasks.filter((t) => t.status === 'In Progress');
    const overdueTasks = assignedTasks.filter((t) => t.status !== 'Completed' && t.due_date < todayStr);

    return (
      <div className="space-y-6">
        {/* Coordinator Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Assigned Interns</span>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{assignedInterns.length}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">In your direct mentorship squad</div>
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Awaiting Review</span>
              <Clock className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{awaitingReviewTasks.length}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">Submissions ready for your feedback</div>
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Active Sprints</span>
              <FolderKanban className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{inProgressTasks.length}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">Tasks currently in development</div>
          </div>

          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Overdue Items</span>
              <AlertTriangle className="w-4 h-4 text-neutral-700" />
            </div>
            <div className="text-2xl font-bold text-[#111111] mt-2">{overdueTasks.length}</div>
            <div className="text-[11px] text-neutral-600 mt-1">
              {overdueTasks.length === 0 ? 'All milestones on schedule' : 'Needs coordinator followup'}
            </div>
          </div>
        </div>

        {/* Quick Action Ribbon */}
        <div className="p-4 bg-neutral-50 border border-[#E5E7EB] rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
              Coordinator Actions
            </div>
            <div className="text-xs text-[#6B7280]">
              Assign tasks, leave milestone reviews, and coordinate project progress
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenQuickAction('create-task')}
            >
              Assign Task
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('tasks-projects')}
            >
              Review Submissions
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('attendance')}
            >
              Record Check-in Review
            </Button>
          </div>
        </div>

        {/* Assigned Interns Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111111]">Assigned Interns Overview</h2>
            <button
              onClick={() => onNavigate('interns')}
              className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 font-medium"
            >
              View Full Directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedInterns.map((intern) => {
              const internTasks = tasks.filter((t) => t.assigned_to_id === intern.id);
              const doneTasks = internTasks.filter((t) => t.status === 'Completed').length;
              const internOnb = onboardingItems.filter((o) => o.intern_id === intern.id);
              const doneOnb = internOnb.filter((o) => o.is_completed).length;
              const onbPct = internOnb.length > 0 ? Math.round((doneOnb / internOnb.length) * 100) : 0;

              return (
                <div
                  key={intern.id}
                  className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs hover:border-neutral-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#111111]">{intern.full_name}</h3>
                      <p className="text-xs text-[#6B7280]">{intern.role_title}</p>
                    </div>
                    <Badge variant={intern.status === 'Active' ? 'dark' : 'neutral'}>
                      {intern.status}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Onboarding</span>
                      <span className="font-mono text-neutral-900 font-medium">{onbPct}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#111111] h-full rounded-full"
                        style={{ width: `${onbPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[#6B7280] pt-1">
                      <span>Tasks Complete</span>
                      <span className="font-mono text-neutral-900 font-medium">
                        {doneTasks} / {internTasks.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submissions Pending Review */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#111111]">Tasks Awaiting Coordinator Review</h2>
          {awaitingReviewTasks.length === 0 ? (
            <div className="p-6 text-center bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">
              No tasks currently awaiting review. All submissions are up to date.
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB]">
              {awaitingReviewTasks.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-[#111111]">{t.title}</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">
                      Submitted by: <span className="text-neutral-900 font-medium">{t.assigned_to_name}</span> • Project: {t.project_name}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('tasks-projects')}
                  >
                    Open Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // INTERN DASHBOARD
  // ==========================================
  const myTasks = filteredTasks;
  const inProgressMyTasks = myTasks.filter((t) => t.status === 'In Progress');
  const completedMyTasks = myTasks.filter((t) => t.status === 'Completed');
  const overdueMyTasks = myTasks.filter((t) => t.status !== 'Completed' && t.due_date < todayStr);

  const myOnbItems = onboardingItems.filter(
    (o) => o.intern_id === currentInternRecord?.id
  );
  const myCompletedOnb = myOnbItems.filter((o) => o.is_completed).length;
  const myOnbPct = myOnbItems.length > 0 ? Math.round((myCompletedOnb / myOnbItems.length) * 100) : 0;

  const myReviews = reviews.filter(
    (r) => r.intern_id === currentInternRecord?.id || r.intern_name === currentInternRecord?.full_name
  );

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Card */}
      <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Intern Portal
            </div>
            <h2 className="text-lg font-bold text-[#111111]">
              Welcome back, {currentUser?.full_name || 'Intern'}!
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Role: <strong className="text-neutral-900">{currentInternRecord?.role_title || 'Selected Intern'}</strong> • Mentor:{' '}
              <strong className="text-neutral-900">{currentInternRecord?.coordinator_name || 'Assigned Coordinator'}</strong>
            </p>
            <p className="text-xs text-[#6B7280]">
              Duration: {currentInternRecord?.start_date} to {currentInternRecord?.planned_end_date}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenQuickAction('submit-checkin')}
            >
              Submit Check-in
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('tasks')}
            >
              My Tasks
            </Button>
          </div>
        </div>
      </div>

      {/* Intern Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Assigned Tasks</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{myTasks.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">
            {completedMyTasks.length} completed
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">In Progress</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{inProgressMyTasks.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">Active sprint deliverables</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Onboarding Progress</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{myOnbPct}%</div>
          <div className="text-[11px] text-[#6B7280] mt-1">
            {myCompletedOnb} / {myOnbItems.length} checklist items
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Certificate Status</div>
          <div className="text-base font-bold text-[#111111] mt-2">
            {currentInternRecord?.certificate_status || 'Draft'}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-1">Issued at end of internship</div>
        </div>
      </div>

      {/* Assigned Tasks & Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111111]">Active Tasks</h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 font-medium"
            >
              View all tasks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="p-6 text-center bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">
                No tasks assigned yet. Your coordinator will allocate your first starter task shortly.
              </div>
            ) : (
              myTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs hover:border-neutral-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#111111]">{t.title}</h3>
                        <Badge variant={t.status === 'Completed' ? 'dark' : 'neutral'}>
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    </div>
                    <Badge variant="subtle" size="sm">
                      {t.priority}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                    <div>Due: <span className="font-mono text-neutral-900">{t.due_date}</span></div>
                    <div>{t.subtasks.filter((s) => s.completed).length} / {t.subtasks.length} subtasks</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mentor Feedback & Announcements */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#111111]">Recent Feedback & Reviews</h2>
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg space-y-3">
            {myReviews.length === 0 ? (
              <div className="text-xs text-[#6B7280] text-center py-4">
                No formal milestone reviews submitted yet. Feedback will appear here after your first review.
              </div>
            ) : (
              myReviews.map((rev) => (
                <div key={rev.id} className="text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold text-[#111111]">
                    <span>{rev.review_period}</span>
                    <Badge variant="neutral">{rev.role_progress}</Badge>
                  </div>
                  <p className="text-[#6B7280] italic">
                    &ldquo;{rev.mentor_feedback}&rdquo;
                  </p>
                  <div className="text-[11px] text-neutral-500">
                    Reviewed by {rev.reviewer_name}
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="text-sm font-semibold text-[#111111]">Cohort Announcements</h2>
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg space-y-3">
            {announcements.slice(0, 2).map((a) => (
              <div key={a.id} className="text-xs space-y-1 pb-2 border-b border-neutral-100 last:border-0 last:pb-0">
                <div className="font-semibold text-[#111111]">{a.title}</div>
                <p className="text-[#6B7280] line-clamp-2">{a.message}</p>
                <div className="text-[10px] text-neutral-400 font-mono">
                  {a.created_at.split('T')[0]} • By {a.author_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
