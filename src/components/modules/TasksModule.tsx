'use client';

import React, { useState } from 'react';
import {
  FolderKanban,
  ListFilter,
  LayoutGrid,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  ChevronRight,
  Send,
  CheckSquare,
  Square,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const TasksModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    tasks,
    filteredTasks,
    interns,
    projects,
    createTask,
    updateTask,
    addTaskComment,
    toggleSubtask,
    currentInternRecord,
  } = useData();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modals & Panels
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  // New Task Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to_id: interns[0]?.id || '',
    assigned_to_name: interns[0]?.full_name || '',
    project_id: projects[0]?.id || '',
    project_name: projects[0]?.name || '',
    priority: 'Medium' as TaskPriority,
    status: 'To Do' as TaskStatus,
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimated_effort: '10 hrs',
    subtasksInput: '',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const displayTasks = filteredTasks.filter((task) => {
    if (task.is_archived) return false;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'ALL' || task.project_id === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assigned = interns.find((i) => i.id === formData.assigned_to_id);
    const proj = projects.find((p) => p.id === formData.project_id);

    const subtasks = formData.subtasksInput
      ? formData.subtasksInput
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((title, idx) => ({
            id: `sub-${Date.now()}-${idx}`,
            title: title.trim(),
            completed: false,
          }))
      : [];

    createTask({
      title: formData.title,
      description: formData.description,
      assigned_to_id: formData.assigned_to_id,
      assigned_to_name: assigned?.full_name || 'Assigned Intern',
      project_id: formData.project_id,
      project_name: proj?.name || 'Assigned Project',
      priority: formData.priority,
      status: formData.status,
      start_date: formData.start_date,
      due_date: formData.due_date,
      estimated_effort: formData.estimated_effort,
      subtasks,
      comments: [],
      created_by_id: currentUser?.id || 'staff',
      created_by_name: currentUser?.full_name || 'Staff',
      is_archived: false,
    });

    setIsCreateModalOpen(false);
    setFormData({
      title: '',
      description: '',
      assigned_to_id: interns[0]?.id || '',
      assigned_to_name: interns[0]?.full_name || '',
      project_id: projects[0]?.id || '',
      project_name: projects[0]?.name || '',
      priority: 'Medium',
      status: 'To Do',
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimated_effort: '10 hrs',
      subtasksInput: '',
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim()) return;
    addTaskComment(selectedTask.id, newCommentText.trim());
    setNewCommentText('');
    // refresh selectedTask reference
    const updated = tasks.find((t) => t.id === selectedTask.id);
    if (updated) setSelectedTask(updated);
  };

  const kanbanColumns: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Completed'];

  return (
    <div className="space-y-6">
      {/* Controls & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#E5E7EB] rounded-lg">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Statuses</option>
            {kanbanColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-md border border-[#E5E7EB] bg-neutral-50 p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs'
                  : 'text-[#6B7280] hover:text-black'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs'
                  : 'text-[#6B7280] hover:text-black'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          {currentRole !== 'intern' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
          {kanbanColumns.map((column) => {
            const columnTasks = displayTasks.filter((t) => t.status === column);

            return (
              <div
                key={column}
                className="bg-neutral-50/70 border border-[#E5E7EB] rounded-lg p-3 min-h-[500px] flex flex-col"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111111]">{column}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-800 font-mono">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {columnTasks.map((task) => {
                    const isOverdue = task.status !== 'Completed' && task.due_date < todayStr;
                    const doneSubtasks = task.subtasks.filter((s) => s.completed).length;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-3 bg-white border border-[#E5E7EB] rounded-md shadow-xs hover:border-black cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-[#111111] line-clamp-2 group-hover:text-black">
                            {task.title}
                          </h4>
                          <Badge
                            variant={
                              task.priority === 'Urgent' || task.priority === 'High'
                                ? 'dark'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {task.priority}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-[#6B7280] line-clamp-2">
                          {task.description}
                        </p>

                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-[#6B7280]">
                          <span className="truncate max-w-[100px] font-medium text-neutral-800">
                            {task.assigned_to_name}
                          </span>
                          <span
                            className={`font-mono flex items-center gap-1 ${
                              isOverdue ? 'text-black font-semibold' : ''
                            }`}
                          >
                            {isOverdue && <AlertTriangle className="w-3 h-3 text-black" />}
                            {task.due_date}
                          </span>
                        </div>

                        {task.subtasks.length > 0 && (
                          <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-[#111111] h-full rounded-full"
                              style={{
                                width: `${Math.round(
                                  (doneSubtasks / task.subtasks.length) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Task Title</th>
                <th className="p-3.5">Assignee</th>
                <th className="p-3.5">Project</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {displayTasks.map((task) => {
                const isOverdue = task.status !== 'Completed' && task.due_date < todayStr;
                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-neutral-50/70 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5">
                      <div className="font-semibold text-[#111111]">{task.title}</div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-1">
                        {task.description}
                      </div>
                    </td>
                    <td className="p-3.5 text-neutral-800 font-medium">
                      {task.assigned_to_name}
                    </td>
                    <td className="p-3.5 text-neutral-600 truncate max-w-[150px]">
                      {task.project_name}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="subtle">{task.priority}</Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={task.status === 'Completed' ? 'dark' : 'neutral'}>
                        {task.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className={isOverdue ? 'text-black font-semibold' : 'text-neutral-700'}>
                        {task.due_date}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <ChevronRight className="w-4 h-4 text-neutral-400 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Details Side Panel / Modal */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          description={`Project: ${selectedTask.project_name} • Assignee: ${selectedTask.assigned_to_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-[#111111]">
            {/* Status & Priority Control Ribbon */}
            <div className="p-3 bg-neutral-50 rounded-md border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280]">Status:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TaskStatus;
                    updateTask(selectedTask.id, { status: newStatus });
                    setSelectedTask({ ...selectedTask, status: newStatus });
                  }}
                  className="px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded font-medium focus:ring-1 focus:ring-black"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                </select>

                <span className="text-[#6B7280] ml-2">Priority:</span>
                <Badge variant="dark">{selectedTask.priority}</Badge>
              </div>

              <div className="text-right font-mono text-[11px] text-[#6B7280]">
                Due: <strong className="text-neutral-900">{selectedTask.due_date}</strong> (Effort:{' '}
                {selectedTask.estimated_effort || 'N/A'})
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-neutral-800 mb-1">Task Instructions & Scope</h4>
              <p className="text-neutral-700 bg-white p-3 rounded border border-[#E5E7EB] leading-relaxed whitespace-pre-wrap">
                {selectedTask.description}
              </p>
            </div>

            {/* Subtasks / Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-neutral-800">Checklist & Subtasks</h4>
                <span className="text-[11px] text-[#6B7280]">
                  {selectedTask.subtasks.filter((s) => s.completed).length} of{' '}
                  {selectedTask.subtasks.length} completed
                </span>
              </div>

              {selectedTask.subtasks.length === 0 ? (
                <p className="text-[#6B7280] italic">No subtasks defined for this item.</p>
              ) : (
                <div className="space-y-1.5 bg-neutral-50 p-2.5 rounded border border-[#E5E7EB]">
                  {selectedTask.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => {
                        toggleSubtask(selectedTask.id, st.id);
                        setSelectedTask({
                          ...selectedTask,
                          subtasks: selectedTask.subtasks.map((s) =>
                            s.id === st.id ? { ...s, completed: !s.completed } : s
                          ),
                        });
                      }}
                      className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100 p-1.5 rounded transition-colors"
                    >
                      {st.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#111111]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#6B7280]" />
                      )}
                      <span className={st.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments & Progress Submission */}
            <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
              <h4 className="font-semibold text-neutral-800">Progress Updates & Feedback</h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedTask.comments.length === 0 ? (
                  <p className="text-[#6B7280] italic">No progress updates logged yet.</p>
                ) : (
                  selectedTask.comments.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-2.5 bg-neutral-50 rounded border border-[#E5E7EB] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span className="font-semibold text-neutral-900">
                          {comm.author_name} ({comm.author_role})
                        </span>
                        <span className="font-mono">{comm.created_at.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="text-neutral-800">{comm.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    currentRole === 'intern'
                      ? 'Submit progress update or note...'
                      : 'Leave coordinator feedback or request changes...'
                  }
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
                <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                  Post
                </Button>
              </form>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create & Assign Sprint Task"
          description="Allocate a measurable deliverable with target deadlines."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Conduct Competitive Benchmarking Analysis"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Specific instructions, acceptance criteria, or documentation links..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Assign to Intern</label>
                <select
                  value={formData.assigned_to_id}
                  onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {interns.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.full_name} ({i.role_title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Related Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Est. Effort</label>
                <input
                  type="text"
                  value={formData.estimated_effort}
                  onChange={(e) => setFormData({ ...formData, estimated_effort: e.target.value })}
                  placeholder="e.g. 12 hrs"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Subtasks / Checklist (one item per line)
              </label>
              <textarea
                rows={2}
                value={formData.subtasksInput}
                onChange={(e) => setFormData({ ...formData, subtasksInput: e.target.value })}
                placeholder="Draft evaluation outline&#10;Synthesize competitor features&#10;Prepare review slides"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create & Assign Task
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
