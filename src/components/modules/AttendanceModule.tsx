'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { CheckInLog } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const AttendanceModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    checkins,
    filteredCheckins,
    interns,
    submitCheckin,
    reviewCheckin,
    currentInternRecord,
  } = useData();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [reviewModalCheckin, setReviewModalCheckin] = useState<CheckInLog | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Submit Check-in Form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    work_summary: '',
    blockers: '',
    learning_progress: '',
    next_steps: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const internName = currentInternRecord?.full_name || currentUser?.full_name || 'Intern';
    const internId = currentInternRecord?.id || 'intern-1';

    submitCheckin({
      intern_id: internId,
      intern_name: internName,
      date: formData.date,
      work_summary: formData.work_summary,
      blockers: formData.blockers,
      learning_progress: formData.learning_progress,
      next_steps: formData.next_steps,
    });

    setIsSubmitModalOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      work_summary: '',
      blockers: '',
      learning_progress: '',
      next_steps: '',
    });
  };

  const handleReviewSave = () => {
    if (reviewModalCheckin) {
      reviewCheckin(reviewModalCheckin.id, reviewNotes);
      setReviewModalCheckin(null);
      setReviewNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {currentRole === 'intern' ? 'My Daily & Weekly Check-ins' : 'Attendance & Progress Updates'}
          </h2>
          <p className="text-xs text-[#6B7280]">
            Asynchronous remote check-in logs capturing daily work, blockers, and learning progress.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsSubmitModalOpen(true)}
        >
          Submit Check-in Log
        </Button>
      </div>

      {/* Check-ins Stream */}
      {filteredCheckins.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-6 h-6" />}
          title="No check-in logs submitted yet"
          description="Log daily accomplishments, blockers, and key technical takeaways."
          actionLabel="Submit First Check-in"
          onAction={() => setIsSubmitModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {filteredCheckins.map((chk) => (
            <div
              key={chk.id}
              className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-3.5 hover:border-neutral-400 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#111111]">{chk.intern_name}</span>
                  <Badge variant="neutral">Check-in</Badge>
                </div>
                <div className="font-mono text-xs text-[#6B7280] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{chk.date}</span>
                </div>
              </div>

              {/* Work Summary */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider block mb-1">
                  Summary of Completed Work
                </span>
                <p className="text-xs text-neutral-800 bg-neutral-50 p-3 rounded border border-[#E5E7EB] leading-relaxed">
                  {chk.work_summary}
                </p>
              </div>

              {/* Two columns: Blockers & Learning Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider block mb-1">
                    Blockers & Challenges
                  </span>
                  <div className="p-2.5 bg-neutral-50 rounded border border-[#E5E7EB] text-neutral-700 min-h-[48px]">
                    {chk.blockers || 'None flagged.'}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider block mb-1">
                    Learning Progress & Takeaways
                  </span>
                  <div className="p-2.5 bg-neutral-50 rounded border border-[#E5E7EB] text-neutral-700 min-h-[48px]">
                    {chk.learning_progress || 'Continuing routine sprint execution.'}
                  </div>
                </div>
              </div>

              {/* Next steps */}
              {chk.next_steps && (
                <div className="text-xs text-[#6B7280]">
                  <strong className="text-neutral-900">Next Steps:</strong> {chk.next_steps}
                </div>
              )}

              {/* Mentor Review Notes */}
              <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                {chk.reviewed_by_id ? (
                  <div className="text-xs text-neutral-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neutral-900 shrink-0" />
                    <span>
                      Reviewed by <strong>{chk.reviewer_name}</strong>: &ldquo;{chk.reviewer_notes}&rdquo;
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-[#6B7280] italic">
                    Awaiting mentor / coordinator acknowledgment
                  </div>
                )}

                {currentRole !== 'intern' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setReviewModalCheckin(chk);
                      setReviewNotes(chk.reviewer_notes || '');
                    }}
                  >
                    {chk.reviewed_by_id ? 'Edit Feedback' : 'Leave Feedback'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Check-in Modal */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit Daily/Weekly Check-in"
          description="Record your progress, lessons learned, and next priorities."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Check-in Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Work Summary *
              </label>
              <textarea
                rows={3}
                required
                value={formData.work_summary}
                onChange={(e) => setFormData({ ...formData, work_summary: e.target.value })}
                placeholder="What tasks or research items did you advance today?"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Blockers & Roadblocks</label>
                <textarea
                  rows={2}
                  value={formData.blockers}
                  onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                  placeholder="Any access issues, pending reviews, or technical questions?"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Learning Takeaways</label>
                <textarea
                  rows={2}
                  value={formData.learning_progress}
                  onChange={(e) => setFormData({ ...formData, learning_progress: e.target.value })}
                  placeholder="What new concepts or tools did you explore?"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Next Priority Steps</label>
              <input
                type="text"
                value={formData.next_steps}
                onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                placeholder="Target goals for next session..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Submit Check-in
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Review Modal for Mentors */}
      {reviewModalCheckin && (
        <Modal
          isOpen={Boolean(reviewModalCheckin)}
          onClose={() => setReviewModalCheckin(null)}
          title={`Mentor Feedback — ${reviewModalCheckin.intern_name}`}
          description={`Check-in date: ${reviewModalCheckin.date}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Mentor Notes & Feedback
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Acknowledge progress, offer recommendations, or provide guidance..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setReviewModalCheckin(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleReviewSave}>
                Save Feedback
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
