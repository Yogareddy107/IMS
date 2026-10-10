'use client';

import React, { useState } from 'react';
import {
  FileBarChart2,
  Download,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  FolderKanban,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export const ReportsModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    interns,
    tasks,
    projects,
    onboardingItems,
    checkins,
    roles,
    filteredInterns,
  } = useData();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredCohort = filteredInterns.filter((i) => {
    if (selectedRoleFilter === 'ALL') return true;
    return i.role_title === selectedRoleFilter;
  });

  // Calculate statistics from actual records
  const total = filteredCohort.length;
  const active = filteredCohort.filter((i) => i.status === 'Active').length;
  const onboarding = filteredCohort.filter((i) => i.status === 'Onboarding').length;
  const completed = filteredCohort.filter((i) => i.status === 'Completed').length;
  const selectedCount = filteredCohort.filter((i) => i.status === 'Selected').length;

  const relevantTasks = tasks.filter((t) =>
    filteredCohort.some((i) => i.id === t.assigned_to_id)
  );
  const doneTasks = relevantTasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = relevantTasks.filter((t) => t.status !== 'Completed').length;
  const overdueTasks = relevantTasks.filter(
    (t) => t.status !== 'Completed' && t.due_date < todayStr
  ).length;

  // CSV Export Function
  const exportInternsCSV = () => {
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Internship Role',
      'Status',
      'Coordinator',
      'Start Date',
      'Planned End Date',
      'Certificate Status',
    ];

    const rows = filteredCohort.map((i) => [
      `"${i.full_name}"`,
      `"${i.email}"`,
      `"${i.phone || ''}"`,
      `"${i.role_title}"`,
      `"${i.status}"`,
      `"${i.coordinator_name}"`,
      `"${i.start_date}"`,
      `"${i.planned_end_date}"`,
      `"${i.certificate_status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `IntraSphere_Cohort_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTasksCSV = () => {
    const headers = [
      'Task Title',
      'Assignee',
      'Project',
      'Priority',
      'Status',
      'Due Date',
      'Estimated Effort',
    ];

    const rows = relevantTasks.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.assigned_to_name}"`,
      `"${t.project_name}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.due_date}"`,
      `"${t.estimated_effort || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `IntraSphere_Tasks_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Trigger */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">Cohort Reports & Analytics</h2>
          <p className="text-xs text-[#6B7280]">
            Export verified internship statistics, onboarding progress, and sprint output.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-50 border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Internship Tracks</option>
            {roles.map((r) => (
              <option key={r.id} value={r.title}>
                {r.title}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={exportInternsCSV}
          >
            Export Interns CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={exportTasksCSV}
          >
            Export Tasks CSV
          </Button>
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Active Cohort Members</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{active}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">{total} total selected records</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Onboarding In Progress</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{onboarding}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">{completed} internships completed</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Sprint Tasks Finished</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{doneTasks}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">{pendingTasks} pending or in review</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Overdue Items</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{overdueTasks}</div>
          <div className="text-[11px] text-[#6B7280] mt-1 font-mono">
            {Math.round((overdueTasks / (relevantTasks.length || 1)) * 100)}% of workload
          </div>
        </div>
      </div>

      {/* Breakdown by Internship Track */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#111111]">Track Breakdown & Capacity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-neutral-600 bg-neutral-50 text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-3">Track Role</th>
                <th className="p-3">Arrangement</th>
                <th className="p-3">Enrolled</th>
                <th className="p-3">Active</th>
                <th className="p-3">Tasks Finished</th>
                <th className="p-3">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {roles.map((role) => {
                const trackInterns = interns.filter((i) => i.internship_role_id === role.id);
                const trackActive = trackInterns.filter((i) => i.status === 'Active').length;
                const trackTasks = tasks.filter((t) =>
                  trackInterns.some((i) => i.id === t.assigned_to_id)
                );
                const trackDone = trackTasks.filter((t) => t.status === 'Completed').length;

                return (
                  <tr key={role.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3 font-semibold text-[#111111]">{role.title}</td>
                    <td className="p-3">
                      <Badge variant="subtle">{role.work_arrangement}</Badge>
                    </td>
                    <td className="p-3 font-mono">{trackInterns.length}</td>
                    <td className="p-3 font-mono">{trackActive}</td>
                    <td className="p-3 font-mono">
                      {trackDone} / {trackTasks.length}
                    </td>
                    <td className="p-3 font-mono text-neutral-600">
                      {trackInterns.length} / {role.openings} target
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-ins Frequency Summary */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111111]">Recent Check-in Logs Aggregation</h3>
          <span className="text-xs text-[#6B7280] font-mono">{checkins.length} total submissions</span>
        </div>

        <div className="divide-y divide-[#E5E7EB] text-xs">
          {checkins.slice(0, 5).map((chk) => (
            <div key={chk.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-neutral-900">{chk.intern_name}</span>
                <span className="text-neutral-500 text-[11px] ml-2 font-mono">{chk.date}</span>
                <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">{chk.work_summary}</p>
              </div>
              <Badge variant={chk.reviewed_by_id ? 'dark' : 'neutral'}>
                {chk.reviewed_by_id ? 'Reviewed' : 'Pending'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
