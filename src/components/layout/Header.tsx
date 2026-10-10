'use client';

import React, { useState } from 'react';
import {
  Menu,
  User,
  LogOut,
  Plus,
  CheckCircle2,
  Bell,
  ChevronDown,
  Shield,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';
import { Button } from '@/components/common/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentTab: string;
  onOpenQuickAction?: (action: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentTab,
  onOpenQuickAction,
}) => {
  const {
    currentUser,
    currentRole,
    isDemoMode,
    switchDemoRole,
    switchDemoUser,
    availableProfiles,
    logout,
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Tab Title Mapper
  const tabTitles: Record<string, string> = {
    overview: 'Overview & Analytics',
    interns: currentRole === 'coordinator' ? 'My Assigned Interns' : 'Intern Management',
    roles: 'Internship Roles',
    onboarding: 'Onboarding Checklist',
    'tasks-projects': 'Tasks & Project Workflows',
    tasks: 'My Assigned Tasks',
    projects: 'My Active Projects',
    calendar: 'Calendar & Deadlines',
    documents: 'Document Center & Offer Letters',
    attendance: currentRole === 'intern' ? 'My Daily/Weekly Check-ins' : 'Attendance & Check-in Logs',
    announcements: 'Company Announcements',
    feedback: currentRole === 'intern' ? 'My Progress & Feedback' : 'Feedback & Performance Reviews',
    certificates: 'Internship Certificates',
    reports: 'Reports & Export',
    'user-management': 'User Access Management',
    settings: 'System & Cohort Settings',
    profile: 'My Personal Profile',
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Left side: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-[#111111] hover:bg-neutral-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-xs text-[#6B7280] font-medium hidden sm:block">
            IntraSphere Labs IMS
          </div>
          <h1 className="text-base font-semibold text-[#111111]">
            {tabTitles[currentTab] || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right side: Demo Persona Switcher & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Authenticated Account Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] bg-neutral-50 text-xs">
          <span className="w-2 h-2 rounded-full bg-black" />
          <span className="text-[#6B7280] text-[11px]">Logged in:</span>
          <span className="font-semibold text-[#111111]">{currentUser?.full_name || 'Admin'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white uppercase font-mono font-bold tracking-wider">
            {currentRole}
          </span>
        </div>

        {/* Quick Actions (Admin & Coordinator) */}
        {currentRole === 'admin' && onOpenQuickAction && (
          <div className="hidden lg:flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onOpenQuickAction('add-intern')}
            >
              Add Intern
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onOpenQuickAction('create-task')}
            >
              Create Task
            </Button>
          </div>
        )}

        {currentRole === 'coordinator' && onOpenQuickAction && (
          <div className="hidden lg:flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onOpenQuickAction('create-task')}
            >
              Assign Task
            </Button>
          </div>
        )}

        {currentRole === 'intern' && onOpenQuickAction && (
          <div className="hidden sm:flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onOpenQuickAction('submit-checkin')}
            >
              Submit Check-in
            </Button>
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRoleMenu(false);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#111111] text-white font-medium text-xs hover:bg-neutral-800 transition-colors"
            aria-label="User menu"
          >
            {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md border border-[#E5E7EB] shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-[#E5E7EB]">
                <div className="text-xs font-semibold text-[#111111] truncate">
                  {currentUser?.full_name}
                </div>
                <div className="text-[11px] text-[#6B7280] truncate">{currentUser?.email}</div>
                <div className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 inline-block font-mono uppercase">
                  {currentRole}
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs text-neutral-700 hover:bg-neutral-100 hover:text-black flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
