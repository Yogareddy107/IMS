'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Lock,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export const ProfileModule: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { currentInternRecord, updateIntern } = useData();

  const [phone, setPhone] = useState(currentInternRecord?.phone || '');
  const [skills, setSkills] = useState(currentInternRecord?.skills.join(', ') || '');
  const [learningGoals, setLearningGoals] = useState(currentInternRecord?.learning_goals || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInternRecord) return;

    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateIntern(currentInternRecord.id, {
      phone,
      skills: skillsArray,
      learning_goals: learningGoals,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  if (!currentInternRecord && currentRole === 'intern') {
    return (
      <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">
        No linked intern profile found for this account.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">My Internship Profile</h2>
          <p className="text-xs text-[#6B7280]">
            Review your cohort assignment and update permitted contact information and skills.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-900 font-medium bg-neutral-100 px-3 py-1.5 rounded border border-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>Profile updated</span>
          </div>
        )}
      </div>

      {/* Profile Overview Card */}
      <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-base">
              {currentInternRecord?.full_name?.charAt(0) || 'I'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111111]">
                {currentInternRecord?.full_name || currentUser?.full_name}
              </h3>
              <p className="text-xs text-[#6B7280]">{currentInternRecord?.role_title}</p>
              <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                {currentInternRecord?.email}
              </div>
            </div>
          </div>

          <div className="text-right">
            <Badge variant="dark">{currentInternRecord?.status}</Badge>
            <div className="text-[11px] text-neutral-500 mt-1">
              Mentor: {currentInternRecord?.coordinator_name}
            </div>
          </div>
        </div>

        {/* Read-Only Cohort Terms (Locked) */}
        <div className="p-3 bg-neutral-50 rounded border border-[#E5E7EB] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
            <Lock className="w-3.5 h-3.5" />
            <span>Official Cohort Terms (Staff Admin Managed)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-neutral-700 pt-1">
            <div>
              <span className="text-[#6B7280] block text-[11px]">Track / Role:</span>
              <span className="font-medium text-neutral-900">{currentInternRecord?.role_title}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">Start Date:</span>
              <span className="font-mono text-neutral-900">{currentInternRecord?.start_date}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[11px]">Planned End Date:</span>
              <span className="font-mono text-neutral-900">{currentInternRecord?.planned_end_date}</span>
            </div>
          </div>
        </div>

        {/* Permitted Editable Fields */}
        <form onSubmit={handleSave} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block font-medium text-neutral-800 mb-1">Contact Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-800 mb-1">
              Skills & Tech Stack (comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Next.js, TypeScript, PostgreSQL"
              className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-800 mb-1">Personal Learning Goals</label>
            <textarea
              rows={3}
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              placeholder="What specific skills or milestones do you hope to accomplish?"
              className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Update Profile Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
