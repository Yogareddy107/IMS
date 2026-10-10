'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Clock,
  MapPin,
  DollarSign,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { InternshipRole, WorkArrangement } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

export const RolesModule: React.FC = () => {
  const { currentRole } = useAuth();
  const { roles, interns } = useData();

  const [selectedRole, setSelectedRole] = useState<InternshipRole | null>(null);
  const [editingRole, setEditingRole] = useState<InternshipRole | null>(null);

  // Editable fields in modal
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    openings: number;
    duration: string;
    work_arrangement: WorkArrangement;
    compensation_terms: string;
    application_instructions: string;
    is_active: boolean;
  }>({
    title: '',
    description: '',
    openings: 1,
    duration: '',
    work_arrangement: 'Remote',
    compensation_terms: '',
    application_instructions: '',
    is_active: true,
  });

  const handleOpenEdit = (role: InternshipRole) => {
    setEditingRole(role);
    setEditForm({
      title: role.title,
      description: role.description,
      openings: role.openings,
      duration: role.duration,
      work_arrangement: role.work_arrangement,
      compensation_terms: role.compensation_terms,
      application_instructions: role.application_instructions,
      is_active: role.is_active,
    });
  };

  return (
    <div className="space-y-6">
      {/* Notice */}
      <div className="p-3 bg-neutral-50 border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-neutral-800 shrink-0" />
          <span>
            <strong>Internal Cohort Reference:</strong> These 4 roles define the official tracks and expectations for selected interns at IntraSphere Labs. No public job board or candidate pipeline is hosted here.
          </span>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const filledCount = interns.filter(
            (i) => i.internship_role_id === role.id && i.status !== 'Discontinued'
          ).length;

          return (
            <div
              key={role.id}
              className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs hover:border-neutral-400 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">{role.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="dark">{role.work_arrangement}</Badge>
                      <Badge variant="neutral">{role.duration}</Badge>
                      {role.is_active ? (
                        <Badge variant="subtle">Active Track</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  {currentRole === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEdit(role)}
                      title="Edit role details"
                    />
                  )}
                </div>

                <p className="text-xs text-[#6B7280] mt-3 leading-relaxed">
                  {role.description}
                </p>

                {/* Key specs */}
                <div className="mt-4 pt-3 border-t border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Cohort Allocation</span>
                    <span className="font-medium text-neutral-900">
                      {filledCount} filled / {role.openings} target
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Terms</span>
                    <span className="font-medium text-neutral-900 truncate block">
                      {role.compensation_terms}
                    </span>
                  </div>
                </div>

                {/* Responsibilities list preview */}
                <div className="mt-4 space-y-1.5">
                  <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider block">
                    Core Responsibilities
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-[#6B7280]">
                    {role.responsibilities.slice(0, 3).map((resp, idx) => (
                      <li key={idx} className="line-clamp-1">{resp}</li>
                    ))}
                  </ul>
                </div>

                {/* Skills tags */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {role.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-mono border border-neutral-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                <span className="text-[11px] font-mono">
                  Instructions: {role.application_instructions}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedRole(role)}
                >
                  View Full Brief
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Detail Modal */}
      {selectedRole && (
        <Modal
          isOpen={Boolean(selectedRole)}
          onClose={() => setSelectedRole(null)}
          title={selectedRole.title}
          description="Detailed internship specification and internal requirements."
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs text-[#111111]">
            <div className="p-3 bg-neutral-50 rounded border border-[#E5E7EB] space-y-2">
              <div className="font-semibold text-neutral-800">Role Summary</div>
              <p className="text-[#6B7280]">{selectedRole.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-1.5">Responsibilities</h4>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                {selectedRole.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-1.5">Required Competencies</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedRole.required_skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-[#E5E7EB] rounded">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Work Arrangement</span>
                <span className="font-medium text-neutral-900">{selectedRole.work_arrangement}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Duration</span>
                <span className="font-medium text-neutral-900">{selectedRole.duration}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Target Openings</span>
                <span className="font-medium text-neutral-900">{selectedRole.openings} interns</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Configured Terms</span>
                <span className="font-medium text-neutral-900">{selectedRole.compensation_terms}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedRole(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Role Modal (Admin Only) */}
      {editingRole && (
        <Modal
          isOpen={Boolean(editingRole)}
          onClose={() => setEditingRole(null)}
          title={`Edit Role — ${editingRole.title}`}
          description="Update internal terms and openings."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Role Description</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Openings</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.openings}
                  onChange={(e) => setEditForm({ ...editForm, openings: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Compensation / Terms</label>
                <input
                  type="text"
                  value={editForm.compensation_terms}
                  onChange={(e) => setEditForm({ ...editForm, compensation_terms: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  editingRole.description = editForm.description;
                  editingRole.openings = editForm.openings;
                  editingRole.compensation_terms = editForm.compensation_terms;
                  setEditingRole(null);
                }}
              >
                Save Updates
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
