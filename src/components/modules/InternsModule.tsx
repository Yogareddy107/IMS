'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Archive,
  Eye,
  CheckCircle2,
  Calendar,
  Briefcase,
  User,
  Mail,
  Phone,
  FolderKanban,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Intern, InternshipStatus, UserRole } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const InternsModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    interns,
    filteredInterns,
    roles,
    projects,
    tasks,
    onboardingItems,
    documents,
    addIntern,
    updateIntern,
    archiveIntern,
  } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    internship_role_id: roles[0]?.id || '',
    role_title: roles[0]?.title || '',
    start_date: new Date().toISOString().split('T')[0],
    planned_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    coordinator_id: currentUser?.id || 'admin',
    coordinator_name: currentUser?.full_name || 'IntraSphere Admin',
    status: 'Selected' as InternshipStatus,
    assigned_project_id: projects[0]?.id || '',
    assigned_project_name: projects[0]?.name || '',
    skills: '',
    learning_goals: '',
    progress_notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [emailDuplicateWarning, setEmailDuplicateWarning] = useState(false);

  // Filter interns list
  const displayInterns = filteredInterns.filter((intern) => {
    if (intern.is_archived) return false;
    const matchesSearch =
      intern.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.role_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || intern.role_title === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || intern.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email format';
    }

    // Check duplicate email
    const duplicate = interns.some(
      (i) =>
        i.email.toLowerCase() === formData.email.trim().toLowerCase() &&
        (!editingIntern || i.id !== editingIntern.id)
    );
    if (duplicate) {
      setEmailDuplicateWarning(true);
      errors.email = 'An intern record with this email already exists';
    } else {
      setEmailDuplicateWarning(false);
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRoleSelect = (roleId: string) => {
    const selected = roles.find((r) => r.id === roleId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        internship_role_id: selected.id,
        role_title: selected.title,
      }));
    }
  };

  const handleProjectSelect = (projId: string) => {
    const selected = projects.find((p) => p.id === projId);
    setFormData((prev) => ({
      ...prev,
      assigned_project_id: projId || '',
      assigned_project_name: selected?.name || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const skillsArray = formData.skills
      ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (editingIntern) {
      updateIntern(editingIntern.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        internship_role_id: formData.internship_role_id,
        role_title: formData.role_title,
        start_date: formData.start_date,
        planned_end_date: formData.planned_end_date,
        coordinator_id: formData.coordinator_id,
        coordinator_name: formData.coordinator_name,
        status: formData.status,
        assigned_project_id: formData.assigned_project_id || null,
        assigned_project_name: formData.assigned_project_name || null,
        skills: skillsArray,
        learning_goals: formData.learning_goals,
        progress_notes: formData.progress_notes,
      });
      setEditingIntern(null);
    } else {
      addIntern({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        internship_role_id: formData.internship_role_id,
        role_title: formData.role_title,
        start_date: formData.start_date,
        planned_end_date: formData.planned_end_date,
        coordinator_id: formData.coordinator_id,
        coordinator_name: formData.coordinator_name,
        status: formData.status,
        assigned_project_id: formData.assigned_project_id || null,
        assigned_project_name: formData.assigned_project_name || null,
        skills: skillsArray,
        learning_goals: formData.learning_goals,
        progress_notes: formData.progress_notes,
        certificate_status: 'Not Eligible',
        is_archived: false,
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      internship_role_id: roles[0]?.id || '',
      role_title: roles[0]?.title || '',
      start_date: new Date().toISOString().split('T')[0],
      planned_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      coordinator_id: currentUser?.id || 'admin',
      coordinator_name: currentUser?.full_name || 'IntraSphere Admin',
      status: 'Selected',
      assigned_project_id: projects[0]?.id || '',
      assigned_project_name: projects[0]?.name || '',
      skills: '',
      learning_goals: '',
      progress_notes: '',
    });
    setFormErrors({});
    setEmailDuplicateWarning(false);
  };

  const openEditModal = (intern: Intern) => {
    setEditingIntern(intern);
    setFormData({
      full_name: intern.full_name,
      email: intern.email,
      phone: intern.phone || '',
      internship_role_id: intern.internship_role_id,
      role_title: intern.role_title,
      start_date: intern.start_date,
      planned_end_date: intern.planned_end_date,
      coordinator_id: intern.coordinator_id,
      coordinator_name: intern.coordinator_name,
      status: intern.status,
      assigned_project_id: intern.assigned_project_id || '',
      assigned_project_name: intern.assigned_project_name || '',
      skills: intern.skills.join(', '),
      learning_goals: intern.learning_goals,
      progress_notes: intern.progress_notes,
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Scope Disclaimer Banner */}
      <div className="p-3 bg-neutral-50 border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-neutral-800 shrink-0" />
          <span>
            <strong>Post-Selection Platform:</strong> Candidates are manually added after official selection. This platform does not include job postings, application funnels, or candidate tracking.
          </span>
        </div>
        {currentRole === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              resetForm();
              setEditingIntern(null);
              setIsAddModalOpen(true);
            }}
          >
            Add Selected Intern
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#E5E7EB] rounded-lg">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.title}>
                {r.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Statuses</option>
            <option value="Selected">Selected</option>
            <option value="Offer Sent">Offer Sent</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
            <option value="Discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      {/* Interns Data Table */}
      {displayInterns.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No intern records match filter criteria"
          description="Try clearing your search query or adjusting role and status filters."
          actionLabel={currentRole === 'admin' ? 'Add New Intern' : undefined}
          onAction={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Intern Name</th>
                <th className="p-3.5">Internship Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Coordinator / Mentor</th>
                <th className="p-3.5">Cohort Period</th>
                <th className="p-3.5">Onboarding %</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {displayInterns.map((intern) => {
                const internOnb = onboardingItems.filter((o) => o.intern_id === intern.id);
                const doneOnb = internOnb.filter((o) => o.is_completed).length;
                const onbPct = internOnb.length > 0 ? Math.round((doneOnb / internOnb.length) * 100) : 0;

                return (
                  <tr key={intern.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-[#111111]">{intern.full_name}</div>
                      <div className="text-[11px] text-[#6B7280]">{intern.email}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-neutral-800">{intern.role_title}</div>
                      <div className="text-[11px] text-[#6B7280]">
                        {intern.assigned_project_name || 'No project assigned'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          intern.status === 'Active'
                            ? 'dark'
                            : intern.status === 'Completed'
                            ? 'neutral'
                            : 'subtle'
                        }
                      >
                        {intern.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-neutral-700">{intern.coordinator_name}</td>
                    <td className="p-3.5 font-mono text-[11px] text-neutral-600">
                      {intern.start_date} <br />
                      <span className="text-neutral-400">to</span> {intern.planned_end_date}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#111111] h-full rounded-full"
                            style={{ width: `${onbPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-neutral-700">{onbPct}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedIntern(intern)}
                          title="View detailed profile"
                        >
                          View
                        </Button>
                        {currentRole === 'admin' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                              onClick={() => openEditModal(intern)}
                              title="Edit intern details"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Archive className="w-3.5 h-3.5 text-neutral-500 hover:text-black" />}
                              onClick={() => {
                                if (confirm(`Archive intern record for ${intern.full_name}?`)) {
                                  archiveIntern(intern.id);
                                }
                              }}
                              title="Archive record"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Intern Profile Drawer / Modal */}
      {selectedIntern && (
        <Modal
          isOpen={Boolean(selectedIntern)}
          onClose={() => setSelectedIntern(null)}
          title={`Intern Profile — ${selectedIntern.full_name}`}
          description={`Full details, assigned tasks, onboarding items, and learning goals.`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-[#111111]">
            {/* Summary Header */}
            <div className="p-4 bg-neutral-50 border border-[#E5E7EB] rounded-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-[#111111]">{selectedIntern.full_name}</div>
                <div className="text-neutral-600 mt-0.5">{selectedIntern.role_title}</div>
                <div className="text-neutral-500 text-[11px] mt-1">
                  {selectedIntern.email} {selectedIntern.phone ? `• ${selectedIntern.phone}` : ''}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="dark">{selectedIntern.status}</Badge>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Mentor: {selectedIntern.coordinator_name}
                </div>
              </div>
            </div>

            {/* Quick Transition button: Convert Selected to Active */}
            {currentRole === 'admin' && selectedIntern.status === 'Selected' && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-md flex items-center justify-between">
                <span>Convert selected candidate into Active Cohort Intern?</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    updateIntern(selectedIntern.id, { status: 'Active' });
                    setSelectedIntern({ ...selectedIntern, status: 'Active' });
                  }}
                >
                  Activate Internship
                </Button>
              </div>
            )}

            {/* Dates & Projects */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white border border-[#E5E7EB] rounded-md">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Start Date</span>
                <span className="font-medium font-mono">{selectedIntern.start_date}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Target End Date</span>
                <span className="font-medium font-mono">{selectedIntern.planned_end_date}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Assigned Project</span>
                <span className="font-medium truncate block">
                  {selectedIntern.assigned_project_name || 'None'}
                </span>
              </div>
            </div>

            {/* Skills & Learning Goals */}
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-neutral-800 mb-1">Skills & Tools</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIntern.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-800 mb-1">Learning Goals</h4>
                <p className="text-neutral-600 bg-neutral-50 p-2.5 rounded border border-[#E5E7EB]">
                  {selectedIntern.learning_goals || 'No specific learning goals recorded yet.'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-800 mb-1">Coordinator Progress Notes</h4>
                <p className="text-neutral-600 bg-neutral-50 p-2.5 rounded border border-[#E5E7EB]">
                  {selectedIntern.progress_notes || 'No progress notes logged yet.'}
                </p>
              </div>
            </div>

            {/* Linked Onboarding & Tasks */}
            <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
              <h4 className="font-semibold text-neutral-800">Assigned Tasks</h4>
              {tasks.filter((t) => t.assigned_to_id === selectedIntern.id).length === 0 ? (
                <p className="text-[#6B7280]">No tasks currently assigned to this intern.</p>
              ) : (
                <div className="space-y-1.5">
                  {tasks
                    .filter((t) => t.assigned_to_id === selectedIntern.id)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-2 bg-neutral-50 rounded border border-[#E5E7EB] flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-neutral-900">{t.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-neutral-500">Due {t.due_date}</span>
                          <Badge variant="neutral">{t.status}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedIntern(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Intern Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
          title={editingIntern ? `Edit Intern — ${editingIntern.full_name}` : 'Add Selected Intern'}
          description="Enter post-selection details for the new cohort member."
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {emailDuplicateWarning && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded text-neutral-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>An intern record with this email address is already registered.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">
                  Full Name <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
                {formErrors.full_name && (
                  <p className="mt-1 text-[11px] text-neutral-600 font-medium">{formErrors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">
                  Email Address <span className="text-black">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. maya.lin@intraspherelabs.com"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
                {formErrors.email && (
                  <p className="mt-1 text-[11px] text-neutral-600 font-medium">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">
                  Internship Role <span className="text-black">*</span>
                </label>
                <select
                  value={formData.internship_role_id}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Planned End Date</label>
                <input
                  type="date"
                  required
                  value={formData.planned_end_date}
                  onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Internship Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as InternshipStatus })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Selected">Selected</option>
                  <option value="Offer Sent">Offer Sent</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Assigned Project</label>
                <select
                  value={formData.assigned_project_id || ''}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">No Project Assigned</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. Next.js, TypeScript, PostgreSQL"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Learning Goals</label>
              <textarea
                rows={2}
                value={formData.learning_goals}
                onChange={(e) => setFormData({ ...formData, learning_goals: e.target.value })}
                placeholder="What objectives does this intern plan to accomplish?"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingIntern ? 'Save Changes' : 'Add Intern Record'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
