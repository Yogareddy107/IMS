'use client';

import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Lock,
  User,
  Star,
  CheckCircle2,
  Calendar,
  Eye,
  MessageSquare,
  Shield,
  Send,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { PerformanceReview } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const FeedbackModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    filteredReviews,
    interns,
    filteredInterns,
    submitReview,
    currentInternRecord,
  } = useData();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  // New Review Form
  const [formData, setFormData] = useState({
    intern_id: interns[0]?.id || '',
    review_period: 'Month 1 Milestone Review',
    role_progress: 'Exceeds Expectations',
    communication_rating: 'Strong & Proactive',
    task_completion_rating: 'Consistently on Schedule',
    problem_solving_rating: 'High Autonomy & Insight',
    strengths: '',
    areas_to_improve: '',
    mentor_feedback: '',
    next_goals: '',
    private_staff_notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const intern = interns.find((i) => i.id === formData.intern_id);

    submitReview({
      intern_id: formData.intern_id,
      intern_name: intern?.full_name || 'Intern',
      reviewer_id: currentUser?.id || 'staff',
      reviewer_name: currentUser?.full_name || 'Staff Mentor',
      review_period: formData.review_period,
      role_progress: formData.role_progress,
      communication_rating: formData.communication_rating,
      task_completion_rating: formData.task_completion_rating,
      problem_solving_rating: formData.problem_solving_rating,
      strengths: formData.strengths,
      areas_to_improve: formData.areas_to_improve,
      mentor_feedback: formData.mentor_feedback,
      intern_self_reflection: null,
      next_goals: formData.next_goals,
      private_staff_notes: formData.private_staff_notes || null,
    });

    setIsSubmitModalOpen(false);
    setFormData({
      intern_id: interns[0]?.id || '',
      review_period: 'Mid-term Performance Review',
      role_progress: 'Exceeds Expectations',
      communication_rating: 'Strong & Proactive',
      task_completion_rating: 'Consistently on Schedule',
      problem_solving_rating: 'High Autonomy & Insight',
      strengths: '',
      areas_to_improve: '',
      mentor_feedback: '',
      next_goals: '',
      private_staff_notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {currentRole === 'intern' ? 'My Milestone Reviews & Growth' : 'Feedback & Milestone Reviews'}
          </h2>
          <p className="text-xs text-[#6B7280]">
            Qualitative milestone evaluations, mentorship guidance, and learning reflections.
          </p>
        </div>

        {currentRole !== 'intern' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Conduct Review
          </Button>
        )}
      </div>

      {/* Reviews Stream */}
      {filteredReviews.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-6 h-6" />}
          title="No performance reviews recorded yet"
          description="Milestone reviews and mentor reflections will be displayed here."
        />
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev: PerformanceReview) => (
            <div
              key={rev.id}
              className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-4 hover:border-neutral-400 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#111111]">{rev.intern_name}</h3>
                    <Badge variant="dark">{rev.review_period}</Badge>
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">
                    Evaluator: <strong className="text-neutral-900">{rev.reviewer_name}</strong> • Logged:{' '}
                    <span className="font-mono">{rev.created_at.split('T')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant="neutral">Progress: {rev.role_progress}</Badge>
                </div>
              </div>

              {/* Rubric Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-neutral-50 rounded border border-[#E5E7EB] text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Communication</span>
                  <span className="font-semibold text-neutral-900">{rev.communication_rating}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Task Execution</span>
                  <span className="font-semibold text-neutral-900">{rev.task_completion_rating}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Problem Solving</span>
                  <span className="font-semibold text-neutral-900">{rev.problem_solving_rating}</span>
                </div>
              </div>

              {/* Mentor Feedback & Strengths */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-neutral-800 uppercase tracking-wider text-[11px] block mb-1">
                    Mentor Feedback
                  </span>
                  <p className="text-neutral-800 bg-white p-3 rounded border border-[#E5E7EB] leading-relaxed italic">
                    &ldquo;{rev.mentor_feedback}&rdquo;
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-neutral-800 text-[11px] block mb-1">
                      Identified Strengths
                    </span>
                    <p className="text-neutral-700 bg-neutral-50 p-2.5 rounded border border-[#E5E7EB]">
                      {rev.strengths}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-neutral-800 text-[11px] block mb-1">
                      Areas for Growth
                    </span>
                    <p className="text-neutral-700 bg-neutral-50 p-2.5 rounded border border-[#E5E7EB]">
                      {rev.areas_to_improve}
                    </p>
                  </div>
                </div>

                {rev.next_goals && (
                  <div>
                    <span className="font-semibold text-neutral-800 text-[11px] block mb-1">
                      Agreed Next Goals
                    </span>
                    <p className="text-neutral-700 bg-neutral-50 p-2.5 rounded border border-[#E5E7EB]">
                      {rev.next_goals}
                    </p>
                  </div>
                )}
              </div>

              {/* STRICT RESTRICTION: Private Staff Notes (Only visible to Admin & Coordinator!) */}
              {currentRole !== 'intern' && rev.private_staff_notes && (
                <div className="p-3 bg-neutral-100 border border-neutral-300 rounded text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 mb-1">
                    <Lock className="w-3.5 h-3.5 text-black" />
                    <span>Private Coordinator & Admin Notes (Restricted from intern view)</span>
                  </div>
                  <p className="text-neutral-700 italic">{rev.private_staff_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Conduct Review Modal (Staff Only) */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Conduct Milestone Performance Review"
          description="Assess qualitative growth, technical deliverables, and goals."
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Select Intern</label>
                <select
                  value={formData.intern_id}
                  onChange={(e) => setFormData({ ...formData, intern_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {filteredInterns.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.full_name} ({i.role_title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Review Milestone</label>
                <input
                  type="text"
                  required
                  value={formData.review_period}
                  onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                  placeholder="e.g. Month 1 Review or Mid-term Milestone"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Communication</label>
                <select
                  value={formData.communication_rating}
                  onChange={(e) => setFormData({ ...formData, communication_rating: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Strong & Proactive">Strong & Proactive</option>
                  <option value="Meets Expectations">Meets Expectations</option>
                  <option value="Developing">Developing</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Task Completion</label>
                <select
                  value={formData.task_completion_rating}
                  onChange={(e) => setFormData({ ...formData, task_completion_rating: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Consistently on Schedule">Consistently on Schedule</option>
                  <option value="Satisfactory Output">Satisfactory Output</option>
                  <option value="Needs Pacing Support">Needs Pacing Support</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Problem Solving</label>
                <select
                  value={formData.problem_solving_rating}
                  onChange={(e) => setFormData({ ...formData, problem_solving_rating: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="High Autonomy & Insight">High Autonomy & Insight</option>
                  <option value="Competent & Methodical">Competent & Methodical</option>
                  <option value="Requires Guidance">Requires Guidance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Mentor Qualitative Feedback *
              </label>
              <textarea
                rows={3}
                required
                value={formData.mentor_feedback}
                onChange={(e) => setFormData({ ...formData, mentor_feedback: e.target.value })}
                placeholder="Comprehensive feedback shared with intern..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Core Strengths</label>
                <textarea
                  rows={2}
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  placeholder="Key areas of excellence..."
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Areas to Improve</label>
                <textarea
                  rows={2}
                  value={formData.areas_to_improve}
                  onChange={(e) => setFormData({ ...formData, areas_to_improve: e.target.value })}
                  placeholder="Recommended skills to practice..."
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Private Coordinator Notes (Restricted from intern)
              </label>
              <textarea
                rows={2}
                value={formData.private_staff_notes}
                onChange={(e) => setFormData({ ...formData, private_staff_notes: e.target.value })}
                placeholder="Internal staffing considerations or full-time conversion notes..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Review
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
