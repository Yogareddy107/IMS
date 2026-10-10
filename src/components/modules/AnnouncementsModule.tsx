'use client';

import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Calendar,
  User,
  Users,
  Target,
  Megaphone,
  Archive,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Announcement, AnnouncementAudience } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const AnnouncementsModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    filteredAnnouncements,
    roles,
    createAnnouncement,
  } = useData();

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'All' as AnnouncementAudience,
    target_role: '',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncement({
      title: formData.title,
      message: formData.message,
      audience: formData.audience,
      target_role: formData.audience === 'Specific Role' ? formData.target_role : null,
      author_id: currentUser?.id || 'staff',
      author_name: currentUser?.full_name || 'Staff Leadership',
      author_role: currentRole,
      is_archived: false,
    });
    setIsPostModalOpen(false);
    setFormData({
      title: '',
      message: '',
      audience: 'All',
      target_role: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            Company & Cohort Announcements
          </h2>
          <p className="text-xs text-[#6B7280]">
            Direct communication, guidelines, showcase schedules, and milestone updates.
          </p>
        </div>

        {currentRole !== 'intern' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsPostModalOpen(true)}
          >
            Post Announcement
          </Button>
        )}
      </div>

      {/* Announcements Stream */}
      {filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No active announcements"
          description="Announcements targeted to you or your role will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-3 hover:border-neutral-400 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#111111]">{ann.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                    <span>By <strong className="text-neutral-900">{ann.author_name}</strong> ({ann.author_role})</span>
                    <span>•</span>
                    <span className="font-mono">{ann.created_at.split('T')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant="neutral">Audience: {ann.audience}</Badge>
                  {ann.target_role && (
                    <Badge variant="dark">{ann.target_role}</Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap">
                {ann.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Post Announcement Modal */}
      {isPostModalOpen && (
        <Modal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          title="Broadcast Cohort Announcement"
          description="Send an announcement to designated audiences."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Schedule for Quarterly Project Demonstrations"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Target Audience</label>
                <select
                  value={formData.audience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      audience: e.target.value as AnnouncementAudience,
                    })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="All">All Organization</option>
                  <option value="Interns">All Interns</option>
                  <option value="Coordinators">Coordinators Only</option>
                  <option value="Specific Role">Specific Internship Role</option>
                </select>
              </div>

              {formData.audience === 'Specific Role' && (
                <div>
                  <label className="block font-medium text-neutral-800 mb-1">Select Role</label>
                  <select
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Choose role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.title}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Message Content *</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your announcement details..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsPostModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Publish Announcement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
