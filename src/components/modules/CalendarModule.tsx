'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { CalendarEvent, EventType } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const CalendarModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    calendarEvents,
    tasks,
    interns,
    createCalendarEvent,
    currentInternRecord,
  } = useData();

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active month navigation state
  const [currentDate, setCurrentDate] = useState(new Date('2026-02-15'));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'task_deadline' as EventType,
    date: new Date().toISOString().split('T')[0],
    responsible_name: 'All Cohort',
  });

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Generate days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter events based on role
  const permittedEvents = calendarEvents.filter((ev) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') return true;
    if (currentRole === 'intern') {
      return (
        !ev.responsible_name ||
        ev.responsible_name === 'All Cohort' ||
        ev.responsible_name === currentInternRecord?.full_name ||
        ev.responsible_name === currentUser?.full_name
      );
    }
    return true;
  });

  const filteredEvents = permittedEvents.filter((ev) => {
    if (typeFilter === 'ALL') return true;
    return ev.event_type === typeFilter;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCalendarEvent({
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      date: formData.date,
      responsible_name: formData.responsible_name,
    });
    setIsAddModalOpen(false);
    setFormData({
      title: '',
      description: '',
      event_type: 'task_deadline',
      date: new Date().toISOString().split('T')[0],
      responsible_name: 'All Cohort',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {currentRole === 'intern' ? 'My Key Deadlines & Schedule' : 'Calendar & Deadlines'}
          </h2>
          <p className="text-xs text-[#6B7280]">
            Track internship cohorts, sprint milestones, offer acknowledgements, and review syncs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Event Types</option>
            <option value="internship_milestone">Milestone</option>
            <option value="task_deadline">Task Deadline</option>
            <option value="review_meeting">Review Meeting</option>
            <option value="onboarding_deadline">Onboarding Deadline</option>
            <option value="offer_acknowledgement">Offer Acknowledgment</option>
            <option value="certificate_date">Certificate Date</option>
          </select>

          {currentRole !== 'intern' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid + Upcoming Deadlines Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month View (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#111111]">
              {monthName} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1 rounded hover:bg-neutral-100 text-[#6B7280]"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded hover:bg-neutral-100 text-[#6B7280]"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#6B7280] mb-2 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank slots before month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[70px] bg-neutral-50/50 rounded-md p-1" />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.date === dateString);

              return (
                <div
                  key={`day-${dayNum}`}
                  className="min-h-[75px] bg-white border border-[#E5E7EB] rounded-md p-1.5 flex flex-col justify-between hover:border-black transition-colors"
                >
                  <span className="text-[11px] font-mono font-medium text-neutral-800">
                    {dayNum}
                  </span>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-1 rounded bg-neutral-900 text-white text-[9px] font-medium truncate leading-tight"
                        title={`${ev.title} (${ev.responsible_name || 'All'})`}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines List (1 column) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#111111]">Upcoming Cohort Deadlines</h3>
          {filteredEvents.length === 0 ? (
            <div className="p-6 text-center bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">
              No upcoming events found for this filter.
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB] shadow-xs">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[#111111]">{event.title}</span>
                    <Badge variant="neutral" size="sm">
                      {event.event_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-[11px] text-[#6B7280]">{event.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                    <span className="font-mono font-medium text-neutral-900">{event.date}</span>
                    <span>Assignee: {event.responsible_name || 'Cohort'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Schedule Milestone or Deadline"
          description="Add a date to the team calendar."
          maxWidth="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Mid-term Sprint Showcase"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Location, video meeting link, or instructions..."
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value as EventType })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="task_deadline">Task Deadline</option>
                  <option value="review_meeting">Review Meeting</option>
                  <option value="internship_milestone">Milestone</option>
                  <option value="onboarding_deadline">Onboarding Deadline</option>
                  <option value="offer_acknowledgement">Offer Acknowledgment</option>
                  <option value="certificate_date">Certificate Date</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Event
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
