'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  AlertCircle,
  Plus,
  Clock,
  User,
  Shield,
  Layers,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { OnboardingItem } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const OnboardingModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    interns,
    filteredInterns,
    onboardingItems,
    toggleOnboardingItem,
    addOnboardingItem,
    currentInternRecord,
  } = useData();

  // Active Selected Intern for Admin & Coordinator
  const [selectedInternId, setSelectedInternId] = useState<string>(() => {
    if (currentRole === 'intern') {
      return currentInternRecord?.id || filteredInterns[0]?.id || '';
    }
    return filteredInterns[0]?.id || '';
  });

  // Blocker edit state
  const [blockerModalItem, setBlockerModalItem] = useState<OnboardingItem | null>(null);
  const [blockerText, setBlockerText] = useState('');

  // Add custom item modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customItem, setCustomItem] = useState<{
    title: string;
    description: string;
    category: OnboardingItem['category'];
    assigned_to: 'intern' | 'staff';
  }>({
    title: '',
    description: '',
    category: 'Setup',
    assigned_to: 'intern',
  });

  const activeIntern =
    currentRole === 'intern'
      ? currentInternRecord || filteredInterns.find((i) => i.id === selectedInternId) || filteredInterns[0]
      : interns.find((i) => i.id === selectedInternId) || filteredInterns[0];

  const internItems = onboardingItems
    .filter((item) => item.intern_id === activeIntern?.id)
    .sort((a, b) => a.order_index - b.order_index);

  const completedCount = internItems.filter((i) => i.is_completed).length;
  const progressPct = internItems.length > 0 ? Math.round((completedCount / internItems.length) * 100) : 0;
  const pendingCount = internItems.length - completedCount;
  const blockersCount = internItems.filter((i) => Boolean(i.blocker_notes)).length;

  const handleToggle = (item: OnboardingItem) => {
    // Permission check:
    // Intern can toggle if item.assigned_to === 'intern'
    // Staff (Admin/Coordinator) can toggle any item
    if (currentRole === 'intern' && item.assigned_to !== 'intern') {
      alert('This step is designated for administrative or coordinator verification.');
      return;
    }
    toggleOnboardingItem(item.id, !item.is_completed);
  };

  const handleSaveBlocker = () => {
    if (blockerModalItem) {
      toggleOnboardingItem(blockerModalItem.id, blockerModalItem.is_completed, blockerText);
      setBlockerModalItem(null);
      setBlockerText('');
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntern) return;
    addOnboardingItem({
      intern_id: activeIntern.id,
      title: customItem.title,
      description: customItem.description,
      category: customItem.category,
      assigned_to: customItem.assigned_to,
      is_completed: false,
      completed_at: null,
      completed_by: null,
      order_index: internItems.length + 1,
    });
    setIsAddModalOpen(false);
    setCustomItem({
      title: '',
      description: '',
      category: 'Setup',
      assigned_to: 'intern',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Cohort Selector */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {currentRole === 'intern'
              ? 'Your Onboarding Journey'
              : `Onboarding Checklist — ${activeIntern?.full_name || 'Select Intern'}`}
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Role: <strong className="text-neutral-900">{activeIntern?.role_title}</strong> • Mentor:{' '}
            <strong className="text-neutral-900">{activeIntern?.coordinator_name}</strong>
          </p>
        </div>

        {/* Intern Selector (Staff only) */}
        {currentRole !== 'intern' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#6B7280]">Select Intern:</label>
            <select
              value={selectedInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-neutral-50 border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
            >
              {filteredInterns.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.full_name} ({i.role_title})
                </option>
              ))}
            </select>

            {currentRole === 'admin' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Item
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Completion Rate</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{progressPct}%</div>
          <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#111111] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Verified Completed</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{completedCount}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">Confirmed with timestamp</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Pending Actions</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{pendingCount}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">Remaining onboarding items</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs">
          <div className="text-xs text-[#6B7280]">Flagged Blockers</div>
          <div className="text-2xl font-bold text-[#111111] mt-2">{blockersCount}</div>
          <div className="text-[11px] text-neutral-600 mt-1 font-medium">
            {blockersCount > 0 ? 'Requires attention' : 'No blockers flagged'}
          </div>
        </div>
      </div>

      {/* Checklist Table / List */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs divide-y divide-[#E5E7EB]">
        {internItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B7280]">
            No onboarding items found for this intern.
          </div>
        ) : (
          internItems.map((item, idx) => {
            const isInternAction = item.assigned_to === 'intern';
            const canToggle = currentRole !== 'intern' || isInternAction;

            return (
              <div
                key={item.id}
                className={`p-4 transition-colors ${
                  item.is_completed ? 'bg-neutral-50/50' : 'bg-white hover:bg-neutral-50/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={!canToggle}
                      className={`mt-0.5 p-1 rounded hover:bg-neutral-200 transition-colors ${
                        !canToggle ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                      aria-label={item.is_completed ? 'Mark incomplete' : 'Mark complete'}
                      title={
                        !canToggle
                          ? 'This step must be checked off by administrative or coordinator staff.'
                          : 'Click to toggle'
                      }
                    >
                      {item.is_completed ? (
                        <CheckSquare className="w-4 h-4 text-[#111111]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#6B7280]" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-400">#{idx + 1}</span>
                        <h4
                          className={`text-xs font-semibold ${
                            item.is_completed
                              ? 'line-through text-neutral-400'
                              : 'text-[#111111]'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <Badge variant="subtle" size="sm">
                          {item.category}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {isInternAction ? 'Assigned: Intern' : 'Assigned: Staff'}
                        </Badge>
                      </div>

                      <p className="text-xs text-[#6B7280] mt-1">{item.description}</p>

                      {/* Blocker Notes Alert */}
                      {item.blocker_notes && (
                        <div className="mt-2 p-2 bg-neutral-100 border border-neutral-300 rounded text-[11px] text-neutral-800 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                          <span>
                            <strong>Blocker note:</strong> {item.blocker_notes}
                          </span>
                        </div>
                      )}

                      {/* Completed metadata */}
                      {item.is_completed && item.completed_at && (
                        <div className="mt-2 text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-neutral-700" />
                          <span>
                            Completed on {item.completed_at.replace('T', ' ').slice(0, 16)} UTC
                            {item.completed_by ? ` by ${item.completed_by}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Blocker Flagging) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setBlockerModalItem(item);
                        setBlockerText(item.blocker_notes || '');
                      }}
                      className="text-[11px] text-neutral-600 hover:text-black font-medium underline underline-offset-2"
                    >
                      {item.blocker_notes ? 'Edit Blocker' : 'Flag Blocker'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Blocker Edit Modal */}
      {blockerModalItem && (
        <Modal
          isOpen={Boolean(blockerModalItem)}
          onClose={() => setBlockerModalItem(null)}
          title={`Flag or Resolve Blocker — ${blockerModalItem.title}`}
          description="Document any impediment preventing completion of this onboarding item."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Blocker Description (leave blank to clear)
              </label>
              <textarea
                rows={3}
                value={blockerText}
                onChange={(e) => setBlockerText(e.target.value)}
                placeholder="e.g. Waiting on GitHub invitation or staging database credentials..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setBlockerModalItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveBlocker}>
                Save Blocker Status
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Custom Item Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Custom Onboarding Item"
          description={`Add a specialized milestone for ${activeIntern?.full_name}.`}
          maxWidth="md"
        >
          <form onSubmit={handleAddCustom} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Item Title</label>
              <input
                type="text"
                required
                value={customItem.title}
                onChange={(e) => setCustomItem({ ...customItem, title: e.target.value })}
                placeholder="e.g. Review Security Vulnerability Checklist"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Description</label>
              <textarea
                rows={2}
                required
                value={customItem.description}
                onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                placeholder="Specific instructions or verification links..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Category</label>
                <select
                  value={customItem.category}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      category: e.target.value as OnboardingItem['category'],
                    })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Documentation">Documentation</option>
                  <option value="Setup">Setup</option>
                  <option value="Project">Project</option>
                  <option value="Mentorship">Mentorship</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Responsible Party</label>
                <select
                  value={customItem.assigned_to}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      assigned_to: e.target.value as 'intern' | 'staff',
                    })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="intern">Intern Action</option>
                  <option value="staff">Staff Verification</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Add Item
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
