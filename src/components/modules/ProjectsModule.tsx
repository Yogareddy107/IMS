'use client';

import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  Edit2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Project, ProjectStatus } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

export const ProjectsModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    projects,
    filteredProjects,
    tasks,
    interns,
    documents,
    createProject,
    updateProject,
  } = useData();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    problem_statement: '',
    goals: '',
    project_lead_id: currentUser?.id || 'admin',
    lead_name: currentUser?.full_name || 'IntraSphere Admin',
    team_member_ids: [] as string[],
    team_member_names: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    target_completion_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Active' as ProjectStatus,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject({
      name: formData.name,
      description: formData.description,
      problem_statement: formData.problem_statement,
      goals: formData.goals,
      project_lead_id: formData.project_lead_id,
      lead_name: formData.lead_name,
      team_member_ids: formData.team_member_ids,
      team_member_names: formData.team_member_names,
      start_date: formData.start_date,
      target_completion_date: formData.target_completion_date,
      status: formData.status,
    });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {currentRole === 'intern' ? 'Your Assigned Projects' : 'Projects & Innovation Initiatives'}
          </h2>
          <p className="text-xs text-[#6B7280]">
            Central cross-functional product development initiatives at IntraSphere Labs.
          </p>
        </div>

        {currentRole === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create New Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => {
          const linkedTasks = tasks.filter((t) => t.project_id === project.id);
          const doneTasks = linkedTasks.filter((t) => t.status === 'Completed').length;
          const pct = linkedTasks.length > 0 ? Math.round((doneTasks / linkedTasks.length) * 100) : 0;
          const linkedDocs = documents.filter((d) => d.project_id === project.id);

          return (
            <div
              key={project.id}
              className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs hover:border-neutral-400 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="dark">{project.status}</Badge>
                      <span className="text-xs text-[#6B7280] font-mono">
                        {project.start_date} to {project.target_completion_date}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#6B7280] mt-3 leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-4 p-3 bg-neutral-50 rounded border border-[#E5E7EB] space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-800">Problem Statement:</span>
                    <p className="text-neutral-600 mt-0.5 line-clamp-2">
                      {project.problem_statement}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">Expected Outcomes:</span>
                    <p className="text-neutral-600 mt-0.5 line-clamp-2">{project.goals}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">Task Progress</span>
                    <span className="font-mono font-medium text-neutral-900">
                      {doneTasks} / {linkedTasks.length} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#111111] h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Team Members */}
                <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                  <div>Lead: <strong className="text-neutral-900">{project.lead_name}</strong></div>
                  <div>{project.team_member_names.length} Assigned Members</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">
                  {linkedDocs.length} linked documents
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedProject(project)}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          title={selectedProject.name}
          description="Detailed initiative briefing, linked tasks, and documents."
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs text-[#111111]">
            <div className="p-3 bg-neutral-50 rounded border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="dark">{selectedProject.status}</Badge>
                <span className="font-mono text-neutral-600">
                  {selectedProject.start_date} to {selectedProject.target_completion_date}
                </span>
              </div>
              <p className="text-neutral-700">{selectedProject.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-1">Problem Statement</h4>
              <p className="text-neutral-700 bg-white p-2.5 rounded border border-[#E5E7EB]">
                {selectedProject.problem_statement}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-1">Expected Goals & Deliverables</h4>
              <p className="text-neutral-700 bg-white p-2.5 rounded border border-[#E5E7EB]">
                {selectedProject.goals}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-800 mb-1.5">Linked Sprint Tasks</h4>
              <div className="space-y-1.5">
                {tasks
                  .filter((t) => t.project_id === selectedProject.id)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="p-2 bg-neutral-50 rounded border border-[#E5E7EB] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-neutral-900">{t.title}</span>
                        <div className="text-[11px] text-[#6B7280]">Assignee: {t.assigned_to_name}</div>
                      </div>
                      <Badge variant={t.status === 'Completed' ? 'dark' : 'neutral'}>
                        {t.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Innovation Project"
          description="Establish a collaborative initiative for cohort interns."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. IntraSphere Labs — Autonomous Agent Testing Suite"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Description *</label>
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Scope and purpose of this project..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Problem Statement</label>
              <textarea
                rows={2}
                value={formData.problem_statement}
                onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                placeholder="What market or technical friction are we resolving?"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Goals & Expected Outcomes</label>
              <textarea
                rows={2}
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="Expected deliverables and metrics..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  required
                  value={formData.target_completion_date}
                  onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
