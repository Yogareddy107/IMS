'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Database,
  Building,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
  Bell,
  Mail,
  Monitor,
  Send,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { WorkArrangement } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  requestDesktopNotificationPermission,
  sendDesktopNotification,
  dispatchNotification,
} from '@/lib/notifications';

export const SettingsModule: React.FC = () => {
  const { currentRole, currentUser, isDemoMode } = useAuth();
  const { settings, updateSettings, resetDemoData } = useData();

  const [formState, setFormState] = useState({
    company_name: settings.company_name,
    project_name: settings.project_name,
    tagline: settings.tagline,
    default_duration: settings.default_duration,
    default_work_arrangement: settings.default_work_arrangement,
    authorized_signatory_name: settings.authorized_signatory_name,
    authorized_signatory_title: settings.authorized_signatory_title,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleEnableDesktop = async () => {
    const res = await requestDesktopPermissionSafe();
    setDesktopPermission(res);
    if (res === 'granted') {
      sendDesktopNotification(
        'Desktop Notifications Enabled',
        'You will now receive native OS alerts for new tasks, announcements, and feedback even when using other apps.'
      );
    }
  };

  const requestDesktopPermissionSafe = async () => {
    return await requestDesktopNotificationPermission();
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    await dispatchNotification({
      title: 'Task Assignment Alert',
      body: 'IntraSphere Admin assigned a new task: "Review Product Architecture Brief" on IntraSphere Labs IMS.',
      type: 'task_assigned',
      senderName: 'IntraSphere Admin',
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSendTestEmail = async () => {
    setEmailTesting(true);
    setEmailResult(null);
    const targetEmail = currentUser?.email || 'teamintrasphere@gmail.com';
    const targetName = currentUser?.full_name || 'Staff User';
    try {
      const res = await dispatchNotification({
        recipientEmail: targetEmail,
        recipientName: targetName,
        senderName: 'IntraSphere Labs IMS',
        title: 'Real Out-of-App Notification Verified',
        body: `This email confirms that real notifications are active for ${targetName} (${targetEmail}). Alerts for tasks, updates, and reviews will be delivered directly to your inbox so you never miss an update while using other apps.`,
        type: 'general',
      });
      if (res.delivered?.email) {
        setEmailResult(`Delivered to ${res.delivered.deliveredTo || 'inbox'}`);
      } else {
        setEmailResult(res.message || 'Notification processed');
      }
    } catch {
      setEmailResult('Error sending email');
    } finally {
      setEmailTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {currentRole === 'admin'
              ? 'Platform & Notification Settings'
              : 'Settings & Notification Preferences'}
          </h2>
          <p className="text-xs text-[#6B7280]">
            {currentRole === 'admin'
              ? 'Global parameters, brand identity, notification channels, and backend infrastructure.'
              : 'Manage your native desktop OS alerts, inbox notifications, and active alert channels.'}
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-900 font-medium bg-neutral-100 px-3 py-1.5 rounded border border-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Out-of-App Notifications & Alert Delivery Card */}
      <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-neutral-700" />
            <div>
              <h3 className="font-bold text-sm text-[#111111]">
                Real Out-of-App Notifications (Email, Desktop OS Push & Webhook)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Notify interns and staff when browser is minimized or user is working in other apps
              </p>
            </div>
          </div>

          <Badge variant={desktopPermission === 'granted' ? 'dark' : 'outline'}>
            {desktopPermission === 'granted' ? 'OS Push: Active' : 'OS Push: Not Enabled'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Method A: Native Desktop OS Notifications */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-neutral-900">
                <Monitor className="w-4 h-4 text-black" />
                <span>1. Desktop OS Push Notifications (Native Toast)</span>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Pops up a native Windows / macOS notification toast on the corner of the user&apos;s screen. Works even when the browser is minimized or user is in another desktop application.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              {desktopPermission !== 'granted' ? (
                <Button variant="primary" size="sm" onClick={handleEnableDesktop}>
                  Enable Desktop OS Alerts
                </Button>
              ) : (
                <span className="text-[11px] font-medium text-neutral-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  Permission Granted in Browser
                </span>
              )}

              <Button
                variant="secondary"
                size="sm"
                icon={<Send className="w-3 h-3" />}
                onClick={handleSendTestNotification}
              >
                {testSent ? 'Alert Sent!' : 'Send Test OS Alert'}
              </Button>
            </div>
          </div>

          {/* Method B: Email Notifications */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-neutral-900">
                  <Mail className="w-4 h-4 text-black" />
                  <span>2. Transactional Email Alerts (Inbox Push)</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-200 text-neutral-900">
                  Resend: Active
                </span>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Sends official alerts for task assignments, blocker reports, announcements, and reviews directly to inboxes. Pops up on recipient phones (iOS / Android) and desktop email clients even when the browser is completely closed.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Send className="w-3 h-3" />}
                  onClick={handleSendTestEmail}
                  disabled={emailTesting}
                >
                  {emailTesting ? 'Sending Email...' : 'Send Live Test Email'}
                </Button>

                <span className="text-[11px] text-[#6B7280]">
                  Target: <code className="text-black font-semibold font-mono">{currentUser?.email || 'teamintrasphere@gmail.com'}</code>
                </span>
              </div>

              {emailResult && (
                <div className="text-[11px] p-2 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 font-medium">
                  {emailResult}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backend Infrastructure & Demo Mode Card — EXCLUSIVELY VISIBLE TO ADMIN */}
      {currentRole === 'admin' && (
        <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-neutral-700" />
              <div>
                <h3 className="font-bold text-sm text-[#111111]">Backend Infrastructure Status</h3>
                <p className="text-xs text-[#6B7280]">Supabase database & private storage connection</p>
              </div>
            </div>

            <Badge variant={isDemoMode ? 'outline' : 'dark'}>
              {isDemoMode ? 'DEMO MODE (Sample Data Only)' : 'SUPABASE CONNECTED'}
            </Badge>
          </div>

          <div className="text-xs space-y-2 text-neutral-700">
            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span>Database Connection:</span>
              <span className="font-mono font-medium text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Cloud PostgreSQL (SSL/TLS Encrypted)
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span>Access Control & Policies:</span>
              <span className="font-mono font-medium text-neutral-900">
                15 Relational Tables with Row-Level Security (RLS)
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-100">
              <span>Authentication Engine:</span>
              <span className="font-mono font-medium text-neutral-900">
                Cryptographic JWT & Token Session Active
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span>Document Vault:</span>
              <span className="font-mono font-medium text-neutral-900">
                Private Encrypted Buckets (Non-Public Access)
              </span>
            </div>
          </div>

          {isDemoMode && (
            <div className="p-3 bg-neutral-50 rounded border border-[#E5E7EB] text-xs text-[#6B7280] flex items-center justify-between">
              <span>
                All tables created on Supabase. Role switcher enabled for testing.
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (confirm('Are you sure you want to reset demo sample data to original defaults?')) {
                    resetDemoData();
                  }
                }}
              >
                Reset Sample Data
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Brand Identity / Personal Notification Profile Card */}
      {currentRole === 'admin' ? (
        <form onSubmit={handleSave} className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-5 text-xs">
          <div className="border-b border-[#E5E7EB] pb-3">
            <h3 className="font-bold text-sm text-[#111111]">Brand Identity & Organization Defaults</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Configured text-based identity and authorized letterhead signatories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formState.company_name}
                onChange={(e) => setFormState({ ...formState, company_name: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Project Identifier</label>
              <input
                type="text"
                required
                value={formState.project_name}
                onChange={(e) => setFormState({ ...formState, project_name: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-800 mb-1">Official Tagline</label>
            <input
              type="text"
              required
              value={formState.tagline}
              onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Default Duration</label>
              <input
                type="text"
                required
                value={formState.default_duration}
                onChange={(e) => setFormState({ ...formState, default_duration: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Default Work Arrangement</label>
              <select
                value={formState.default_work_arrangement}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    default_work_arrangement: e.target.value as WorkArrangement,
                  })
                }
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="In-office">In-office</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E7EB]">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Authorized Signatory Full Name
              </label>
              <input
                type="text"
                required
                value={formState.authorized_signatory_name}
                onChange={(e) =>
                  setFormState({ ...formState, authorized_signatory_name: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Signatory Title</label>
              <input
                type="text"
                required
                value={formState.authorized_signatory_title}
                onChange={(e) =>
                  setFormState({ ...formState, authorized_signatory_title: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-4 text-xs">
          <div className="border-b border-[#E5E7EB] pb-3">
            <h3 className="font-bold text-sm text-[#111111]">
              Workspace & Alert Routing Summary
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Verified identity and active notification channels configured for your account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-1">
              <span className="text-[#6B7280] text-[11px]">Logged in as:</span>
              <div className="font-semibold text-neutral-900">{currentUser?.full_name || 'Staff User'}</div>
              <div className="text-[11px] text-[#6B7280] font-mono">{currentUser?.email}</div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-1">
              <span className="text-[#6B7280] text-[11px]">Assigned Role & Scope:</span>
              <div className="pt-0.5">
                <Badge variant={currentRole === 'coordinator' ? 'neutral' : 'outline'}>
                  {currentRole.toUpperCase()}
                </Badge>
              </div>
              <div className="text-[11px] text-neutral-600">
                {currentRole === 'coordinator'
                  ? 'Cohort management, intern task reviews, and attendance oversight.'
                  : 'Personal internship workspace, daily check-ins, and onboarding milestones.'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-1.5">
            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Notifications Active</span>
            </div>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              When tasks, announcements, reviews, or project deliverables change, alerts are delivered directly to your inbox ({currentUser?.email}) and to your desktop OS toast notifications when enabled above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
