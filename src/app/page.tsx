'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { DataProvider } from '@/context/data-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoginScreen } from '@/components/auth/LoginScreen';

import { DashboardModule } from '@/components/modules/DashboardModule';
import { InternsModule } from '@/components/modules/InternsModule';
import { RolesModule } from '@/components/modules/RolesModule';
import { OnboardingModule } from '@/components/modules/OnboardingModule';
import { TasksModule } from '@/components/modules/TasksModule';
import { ProjectsModule } from '@/components/modules/ProjectsModule';
import { CalendarModule } from '@/components/modules/CalendarModule';
import { DocumentsModule } from '@/components/modules/DocumentsModule';
import { AttendanceModule } from '@/components/modules/AttendanceModule';
import { AnnouncementsModule } from '@/components/modules/AnnouncementsModule';
import { FeedbackModule } from '@/components/modules/FeedbackModule';
import { CertificatesModule } from '@/components/modules/CertificatesModule';
import { ReportsModule } from '@/components/modules/ReportsModule';
import { UserManagementModule } from '@/components/modules/UserManagementModule';
import { SettingsModule } from '@/components/modules/SettingsModule';
import { ProfileModule } from '@/components/modules/ProfileModule';

function IMSAppContent() {
  const { currentUser, currentRole, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If session is resolving, show minimal clean loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-lg bg-[#111111] text-white font-bold flex items-center justify-center text-sm mb-3">
          IMS
        </div>
        <p className="text-xs text-[#6B7280] font-medium tracking-wide">
          Loading IntraSphere Labs IMS...
        </p>
      </div>
    );
  }

  // If no user authenticated, present Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  const handleOpenQuickAction = (action: string) => {
    switch (action) {
      case 'add-intern':
        setCurrentTab('interns');
        break;
      case 'create-task':
        setCurrentTab(currentRole === 'intern' ? 'tasks' : 'tasks-projects');
        break;
      case 'create-project':
        setCurrentTab(currentRole === 'intern' ? 'projects' : 'tasks-projects');
        break;
      case 'post-announcement':
        setCurrentTab('announcements');
        break;
      case 'submit-checkin':
        setCurrentTab('attendance');
        break;
      default:
        break;
    }
  };

  const renderModule = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <DashboardModule
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQuickAction={handleOpenQuickAction}
          />
        );
      case 'interns':
        return <InternsModule />;
      case 'roles':
        return <RolesModule />;
      case 'onboarding':
        return <OnboardingModule />;
      case 'tasks-projects':
      case 'tasks':
        return <TasksModule />;
      case 'projects':
        return <ProjectsModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'documents':
        return <DocumentsModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'announcements':
        return <AnnouncementsModule />;
      case 'feedback':
        return <FeedbackModule />;
      case 'certificates':
        return <CertificatesModule />;
      case 'reports':
        return <ReportsModule />;
      case 'user-management':
        return <UserManagementModule />;
      case 'settings':
        return <SettingsModule />;
      case 'profile':
        return <ProfileModule />;
      default:
        return (
          <DashboardModule
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQuickAction={handleOpenQuickAction}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      <div className="flex-1 flex">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:pl-64 min-w-0">
          {/* Header */}
          <Header
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            currentTab={currentTab}
            onOpenQuickAction={handleOpenQuickAction}
          />

          {/* Module Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <DataProvider>
        <IMSAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
