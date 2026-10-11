'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Shield,
  Mail,
  User,
  CheckCircle2,
  Lock,
  AlertCircle,
  Key,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { UserProfile, UserRole } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { dispatchNotification } from '@/lib/notifications';

export const UserManagementModule: React.FC = () => {
  const {
    currentRole,
    currentUser,
    availableProfiles,
    provisionUser,
    deleteUser,
    getProvisionedAccounts,
  } = useAuth();
  const { interns, roles, projects, addIntern, updateIntern } = useData();

  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Coordinators and Admins available for mentorship assignment
  const coordinators = availableProfiles.filter(
    (p) => p.role === 'coordinator' || p.role === 'admin'
  );

  const [provisionForm, setProvisionForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'coordinator' as UserRole,
    coordinator_id: '',
    coordinator_name: '',
    send_email: true,
  });

  const [provisionResult, setProvisionResult] = useState<{
    account: UserProfile;
    emailDispatched: boolean;
    emailMessage?: string;
    isSandboxForwarded?: boolean;
    deliveredTo?: string;
    loginUrl?: string;
  } | null>(null);

  // If not admin, access denied
  if (currentRole !== 'admin') {
    return (
      <div className="p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
        <Lock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#111111]">Access Denied</h3>
        <p className="text-xs text-[#6B7280] mt-1">
          User account provisioning is strictly restricted to authorized Administrators.
        </p>
      </div>
    );
  }

  const handleOpenModal = () => {
    const defaultCoord =
      coordinators.find((c) => c.role === 'coordinator') ||
      coordinators[0] ||
      currentUser;

    setProvisionForm({
      full_name: '',
      email: '',
      phone: '',
      role: 'coordinator',
      coordinator_id: defaultCoord?.id || '',
      coordinator_name: defaultCoord?.full_name || '',
      send_email: true,
    });
    setProvisionResult(null);
    setIsProvisionModalOpen(true);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanEmail = provisionForm.email.trim().toLowerCase();

      // 1. Provision user in auth context (Direct Supabase persist)
      const res = await provisionUser({
        full_name: provisionForm.full_name.trim(),
        email: cleanEmail,
        role: provisionForm.role,
        phone: provisionForm.phone.trim(),
      });

      if (!res.success || !res.account) {
        alert(res.error || 'Failed to provision user');
        setIsSubmitting(false);
        return;
      }

      // 2. If role is 'intern', ensure intern record exists in DataContext with assigned coordinator
      if (provisionForm.role === 'intern') {
        const existingIntern = interns.find(
          (i) => i.email.toLowerCase() === cleanEmail
        );
        const selectedCoord =
          coordinators.find((c) => c.id === provisionForm.coordinator_id) ||
          coordinators.find((c) => c.role === 'coordinator') ||
          coordinators[0] ||
          currentUser;

        if (!existingIntern) {
          const selectedRole = roles[0];
          const selectedProject = projects[0];
          addIntern({
            full_name: provisionForm.full_name.trim(),
            email: cleanEmail,
            phone: provisionForm.phone.trim(),
            internship_role_id: selectedRole?.id || 'role-prod-res',
            role_title: selectedRole?.title || 'Product Research Intern',
            start_date: new Date().toISOString().split('T')[0],
            planned_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            coordinator_id: selectedCoord?.id || currentUser?.id || 'admin',
            coordinator_name: selectedCoord?.full_name || currentUser?.full_name || 'IntraSphere Admin',
            status: 'Active',
            assigned_project_id: selectedProject?.id || null,
            assigned_project_name: selectedProject?.name || null,
            skills: ['Research', 'Collaboration'],
            learning_goals: 'Complete cohort onboarding and sprint deliverables.',
            progress_notes: `Account provisioned by Administrator. Assigned Mentor: ${selectedCoord?.full_name || 'Coordinator'}.`,
            certificate_status: 'Not Eligible',
            is_archived: false,
          });
        } else {
          // If intern already exists, update their coordinator to the selected coordinator
          updateIntern(existingIntern.id, {
            coordinator_id: selectedCoord?.id || currentUser?.id || 'admin',
            coordinator_name: selectedCoord?.full_name || currentUser?.full_name || 'IntraSphere Admin',
          });
        }
      }

      // 3. Dispatch Invitation Email if requested (Passwordless)
      let emailDispatched = false;
      let emailMessage = '';
      let isSandboxForwarded = false;
      let deliveredTo = '';
      const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const loginUrl = `${appOrigin}/?login=true&email=${encodeURIComponent(cleanEmail)}`;

      if (provisionForm.send_email) {
        try {
          const roleTitle =
            provisionForm.role === 'coordinator'
              ? 'Internship Coordinator'
              : provisionForm.role === 'intern'
              ? 'Intern'
              : 'Administrator';

          const notifRes = await dispatchNotification({
            recipientEmail: cleanEmail,
            recipientName: provisionForm.full_name.trim(),
            senderName: currentUser?.full_name || 'IntraSphere Admin',
            title: `Your IntraSphere IMS ${roleTitle} Portal Authorization`,
            body: `Welcome to IntraSphere Labs Internship Management System.\n\nYour account has been authorized with the following details:\n\nRole: ${roleTitle}\nAuthorized Email: ${cleanEmail}\nSign-In Link: ${loginUrl}\n\nPlease click the link above and sign in directly using your email address. No password is required.`,
            actionUrl: loginUrl,
            type: 'general',
          });

          emailDispatched = !!notifRes.delivered?.email;
          emailMessage = notifRes.message || 'Invitation sent';
          deliveredTo = notifRes.delivered?.deliveredTo || '';
          isSandboxForwarded =
            !!notifRes.delivered?.isSandboxForwarded ||
            deliveredTo.includes('Sandbox') ||
            deliveredTo.includes('Forwarded');
        } catch (err) {
          console.error('Failed to dispatch invite email:', err);
        }
      }

      setProvisionResult({
        account: res.account,
        emailDispatched,
        emailMessage,
        isSandboxForwarded,
        deliveredTo,
        loginUrl,
      });
    } catch (err) {
      console.error('Provisioning error:', err);
      alert('An unexpected error occurred while provisioning account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter profiles
  const displayProfiles = availableProfiles.filter((prof) => {
    const matchesSearch =
      prof.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || prof.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            Staff & Cohort User Access Control
          </h2>
          <p className="text-xs text-[#6B7280]">
            Provision authorized accounts for Internship Coordinators and Interns. Public signups are disabled.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={handleOpenModal}
        >
          Provision User Account
        </Button>
      </div>

      {/* Access Flow Guidance Box */}
      <div className="p-4 bg-neutral-50 border border-[#E5E7EB] rounded-lg text-xs space-y-2.5">
        <div className="font-semibold flex items-center gap-2 text-black">
          <HelpCircle className="w-4 h-4 text-black shrink-0" />
          <span>How User Provisioning & Sign In Works</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-neutral-600 text-[11px] leading-relaxed">
          <div className="p-2.5 bg-white border border-[#E5E7EB] rounded-md space-y-1">
            <div className="font-semibold text-black">1. Admin Provisions Account</div>
            <p>
              Admin enters Name, Email, Role, and assigns an Internship Coordinator / Mentor for interns.
            </p>
          </div>
          <div className="p-2.5 bg-white border border-[#E5E7EB] rounded-md space-y-1">
            <div className="font-semibold text-black">2. Invitation Dispatched</div>
            <p>
              An automated invitation email is sent to their inbox with their direct portal access link.
            </p>
          </div>
          <div className="p-2.5 bg-white border border-[#E5E7EB] rounded-md space-y-1">
            <div className="font-semibold text-black">3. Immediate Access</div>
            <p>
              The user enters their authorized email address on the sign-in page to access their dedicated workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#E5E7EB] rounded-lg">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B7280]">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="coordinator">Internship Coordinator</option>
            <option value="intern">Intern</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3.5">User Profile</th>
              <th className="p-3.5">Assigned System Role</th>
              <th className="p-3.5">Account Status</th>
              <th className="p-3.5">Access Scope</th>
              <th className="p-3.5">Created Date</th>
              <th className="p-3.5 text-right">Credentials & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {displayProfiles.map((user) => {
              const isPrimaryAdmin = user.email.toLowerCase() === 'teamintrasphere@gmail.com';

              return (
                <tr key={user.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-[#111111]">{user.full_name}</div>
                    <div className="text-[11px] text-[#6B7280] font-mono">{user.email}</div>
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        user.role === 'admin'
                          ? 'dark'
                          : user.role === 'coordinator'
                          ? 'neutral'
                          : 'outline'
                      }
                    >
                      {user.role === 'coordinator'
                        ? 'COORDINATOR'
                        : user.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Active
                    </span>
                  </td>
                  <td className="p-3.5 text-neutral-700">
                    {user.role === 'admin' && 'Organization-wide administration'}
                    {user.role === 'coordinator' && 'Assigned cohort interns & projects'}
                    {user.role === 'intern' && 'Personal internship workspace only'}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-neutral-600">
                    {user.created_at ? user.created_at.split('T')[0] : 'Standard'}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const link = `${origin}/?login=true&email=${encodeURIComponent(user.email)}`;
                          handleCopy(link, `copy-${user.id}`);
                        }}
                        className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy direct portal sign-in link"
                      >
                        {copiedKey === `copy-${user.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-600" />
                            <span>Copy Login Link</span>
                          </>
                        )}
                      </button>

                      {!isPrimaryAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Revoke access and delete account for ${user.email}?`)) {
                              deleteUser(user.id);
                            }
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {isProvisionModalOpen && (
        <Modal
          isOpen={isProvisionModalOpen}
          onClose={() => setIsProvisionModalOpen(false)}
          title={provisionResult ? 'Account Authorized' : 'Provision User Account'}
          description={
            provisionResult
              ? 'Authorized login access has been created and synced with Supabase.'
              : 'Grant passwordless portal access for an Internship Coordinator or Intern.'
          }
          maxWidth="md"
        >
          {provisionResult ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-[#111111]">
                      Account Authorized in Supabase
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">
                      The user can immediately sign in using their email address.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E5E7EB] rounded-md space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <span className="text-[#6B7280]">Full Name:</span>
                    <strong className="text-black">{provisionResult.account.full_name}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <span className="text-[#6B7280]">Authorized Email:</span>
                    <strong className="text-black">{provisionResult.account.email}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <span className="text-[#6B7280]">Role:</span>
                    <Badge variant="dark">{provisionResult.account.role.toUpperCase()}</Badge>
                  </div>
                  {provisionResult.account.role === 'intern' && (
                    <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                      <span className="text-[#6B7280]">Assigned Coordinator:</span>
                      <strong className="text-black">
                        {coordinators.find((c) => c.id === provisionForm.coordinator_id)?.full_name ||
                          provisionForm.coordinator_name ||
                          'Assigned Coordinator'}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#6B7280]">Sign-In Method:</span>
                    <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Direct Email Login (Passwordless)
                    </strong>
                  </div>
                </div>

                {provisionResult.isSandboxForwarded ? (
                  <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1.5">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Invitation Routed to Admin Email (Resend Sandbox Mode)</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      Resend&apos;s testing domain (<code>onboarding@resend.dev</code>) delivers to registered admin inbox (<strong>teamintrasphere@gmail.com</strong>).
                    </p>
                  </div>
                ) : provisionResult.emailDispatched ? (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Invitation email sent to inbox ({provisionResult.emailMessage}).</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Account saved in Supabase database. Share the portal link with the user.</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={`mailto:${provisionResult.account.email}?subject=${encodeURIComponent(
                    `Your IntraSphere IMS Access Link (${provisionResult.account.role.toUpperCase()})`
                  )}&body=${encodeURIComponent(
                    `Hello ${provisionResult.account.full_name},\n\nYour IntraSphere IMS account has been authorized.\n\nSign-In Link: ${provisionResult.loginUrl || (typeof window !== 'undefined' ? `${window.location.origin}/?login=true&email=${encodeURIComponent(provisionResult.account.email)}` : '')}\nAuthorized Email: ${provisionResult.account.email}\n\nYou can sign in directly by clicking the link above or entering your email on the IMS portal. No password is required.\n\nBest regards,\nIntraSphere Labs Team`
                  )}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300"
                >
                  <Mail className="w-3 h-3 text-neutral-700" />
                  Email Candidate via Mail App
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={
                      copiedKey === 'modal-copy' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={() => {
                      const link = provisionResult.loginUrl || (typeof window !== 'undefined' ? `${window.location.origin}/?login=true&email=${encodeURIComponent(provisionResult.account.email)}` : '');
                      handleCopy(
                        `IntraSphere IMS Portal Access:\nName: ${provisionResult.account.full_name}\nRole: ${provisionResult.account.role.toUpperCase()}\nAuthorized Email: ${provisionResult.account.email}\nLogin Link: ${link}\n(Sign in directly with your email - no password required)`,
                        'modal-copy'
                      );
                    }}
                  >
                    {copiedKey === 'modal-copy' ? 'Copied to Clipboard' : 'Copy Login Link'}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsProvisionModalOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={provisionForm.full_name}
                  onChange={(e) =>
                    setProvisionForm({ ...provisionForm, full_name: e.target.value })
                  }
                  placeholder="e.g. Jordan Cole"
                  className="w-full px-3 py-2 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  User Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={provisionForm.email}
                  onChange={(e) =>
                    setProvisionForm({ ...provisionForm, email: e.target.value })
                  }
                  placeholder="e.g. jordan@intraspherelabs.com"
                  className="w-full px-3 py-2 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={provisionForm.phone}
                  onChange={(e) =>
                    setProvisionForm({ ...provisionForm, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Assign System Role *
                </label>
                <select
                  value={provisionForm.role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    const defaultCoord =
                      coordinators.find((c) => c.role === 'coordinator') ||
                      coordinators[0] ||
                      currentUser;
                    setProvisionForm({
                      ...provisionForm,
                      role: newRole,
                      coordinator_id:
                        provisionForm.coordinator_id || defaultCoord?.id || '',
                      coordinator_name:
                        provisionForm.coordinator_name || defaultCoord?.full_name || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:border-black font-medium"
                >
                  <option value="coordinator">Internship Coordinator</option>
                  <option value="intern">Intern</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {provisionForm.role === 'coordinator' &&
                    'Coordinators manage cohorts, assign tasks, review check-ins, and track attendance.'}
                  {provisionForm.role === 'intern' &&
                    'Interns access their private dashboard, submit daily check-ins, tasks, and view offer letters.'}
                  {provisionForm.role === 'admin' &&
                    'Administrators possess full platform and organization management rights.'}
                </p>
              </div>

              {provisionForm.role === 'intern' && (
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    Assign Coordinator / Mentor <span className="text-black">*</span>
                  </label>
                  <select
                    value={
                      provisionForm.coordinator_id ||
                      coordinators.find((c) => c.role === 'coordinator')?.id ||
                      coordinators[0]?.id ||
                      ''
                    }
                    onChange={(e) => {
                      const selected = coordinators.find((c) => c.id === e.target.value);
                      setProvisionForm({
                        ...provisionForm,
                        coordinator_id: e.target.value,
                        coordinator_name: selected?.full_name || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:border-black font-medium"
                  >
                    {coordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email}) {c.role === 'admin' ? '[Admin]' : '[Coordinator]'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Select which Coordinator will oversee this intern&apos;s check-ins, tasks, documents, and attendance.
                  </p>
                </div>
              )}

              <div className="p-3 bg-neutral-50 rounded border border-[#E5E7EB]">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={provisionForm.send_email}
                    onChange={(e) =>
                      setProvisionForm({
                        ...provisionForm,
                        send_email: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded border-neutral-300 text-black focus:ring-black"
                  />
                  <div className="text-[11px] text-neutral-700">
                    <span className="font-semibold text-black">
                      Send authorization email with portal link
                    </span>
                    <p className="text-[#6B7280] mt-0.5">
                      Sends an automated welcome email via Resend with the portal sign-in link.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsProvisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision User Account'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
