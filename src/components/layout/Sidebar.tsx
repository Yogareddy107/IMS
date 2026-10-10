'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  FolderKanban,
  Calendar,
  FileText,
  Clock,
  Bell,
  Award,
  FileBarChart2,
  UserCheck,
  Settings,
  Sparkles,
  User,
  Activity,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  onClose,
}) => {
  const { currentRole, currentUser } = useAuth();

  // Navigation configurations mapped to exact specifications
  const getNavItems = (role: UserRole): NavItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'interns', label: 'Interns', icon: <Users className="w-4 h-4" /> },
          { id: 'roles', label: 'Internship Roles', icon: <Briefcase className="w-4 h-4" /> },
          { id: 'onboarding', label: 'Onboarding', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'tasks-projects', label: 'Tasks & Projects', icon: <FolderKanban className="w-4 h-4" /> },
          { id: 'calendar', label: 'Calendar & Deadlines', icon: <Calendar className="w-4 h-4" /> },
          { id: 'documents', label: 'Documents & Offer Letters', icon: <FileText className="w-4 h-4" /> },
          { id: 'attendance', label: 'Attendance & Activity', icon: <Clock className="w-4 h-4" /> },
          { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" /> },
          { id: 'feedback', label: 'Feedback & Performance', icon: <Activity className="w-4 h-4" /> },
          { id: 'certificates', label: 'Certificates', icon: <Award className="w-4 h-4" /> },
          { id: 'reports', label: 'Reports', icon: <FileBarChart2 className="w-4 h-4" /> },
          { id: 'user-management', label: 'User Management', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        ];
      case 'coordinator':
        return [
          { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'interns', label: 'My Interns', icon: <Users className="w-4 h-4" /> },
          { id: 'onboarding', label: 'Onboarding', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'tasks-projects', label: 'Tasks & Projects', icon: <FolderKanban className="w-4 h-4" /> },
          { id: 'calendar', label: 'Calendar & Deadlines', icon: <Calendar className="w-4 h-4" /> },
          { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
          { id: 'attendance', label: 'Attendance & Activity', icon: <Clock className="w-4 h-4" /> },
          { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" /> },
          { id: 'feedback', label: 'Feedback & Performance', icon: <Activity className="w-4 h-4" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        ];
      case 'intern':
        return [
          { id: 'overview', label: 'My Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
          { id: 'onboarding', label: 'My Onboarding', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'tasks', label: 'My Tasks', icon: <FolderKanban className="w-4 h-4" /> },
          { id: 'projects', label: 'My Projects', icon: <Briefcase className="w-4 h-4" /> },
          { id: 'calendar', label: 'My Deadlines', icon: <Calendar className="w-4 h-4" /> },
          { id: 'documents', label: 'My Documents', icon: <FileText className="w-4 h-4" /> },
          { id: 'attendance', label: 'My Check-ins', icon: <Clock className="w-4 h-4" /> },
          { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" /> },
          { id: 'feedback', label: 'My Progress', icon: <Activity className="w-4 h-4" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(currentRole);

  const roleBadgeLabel = {
    admin: 'Administrator',
    coordinator: 'Internship Coordinator',
    intern: 'Intern',
  }[currentRole];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#111111] text-white flex flex-col border-r border-[#262626] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#262626] flex items-start justify-between">
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>IntraSphere Labs</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#111111] font-semibold">
                IMS
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-1 leading-snug line-clamp-1">
              Building Real-World Products Through Innovation
            </p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-[#9CA3AF] hover:text-white rounded"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="px-4 py-3 mx-3 my-3 bg-[#1A1A1A] border border-[#262626] rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Active Role
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
              {roleBadgeLabel}
            </span>
          </div>
          <div className="mt-2 text-xs font-medium text-white truncate">
            {currentUser?.full_name || 'Authorized User'}
          </div>
          <div className="text-[11px] text-[#9CA3AF] truncate">{currentUser?.email}</div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-[#1E1E1E]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#111111]' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#111111]" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] text-[11px] text-neutral-400">
          <div className="flex items-center justify-between">
            <span>IntraSphere IMS v1.0</span>
            <span className="text-neutral-500">Post-Selection</span>
          </div>
        </div>
      </aside>
    </>
  );
};
