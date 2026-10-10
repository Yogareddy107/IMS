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
  const { interns, roles, projects, addIntern } = useData();

  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const generatePassword = () => `ISL@${Math.floor(1000 + Math.random() * 9000)}`;

  const [provisionForm, setProvisionForm] = useState({
    full_name: '',
    email: '',
    role: 'coordinator' as UserRole,
    password: generatePassword(),
    send_email: true,
  });

  const [provisionResult, setProvisionResult] = useState<{
    account: UserProfile;
    tempPassword: string;
    emailDispatched: boolean;
    emailMessage?: string;
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
    setProvisionForm({
      full_name: '',
      email: '',
      role: 'coordinator',
      password: generatePassword(),
      send_email: true,
    });
    setProvisionResult(null);
    setShowPassword(false);
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
      const finalPassword = provisionForm.password.trim() || generatePassword();

      // 1. Provision user in auth context
      const res = await provisionUser({
        full_name: provisionForm.full_name.trim(),
        email: cleanEmail,
        role: provisionForm.role,
        password: finalPassword,
      });

      if (!res.success || !res.account) {
        alert(res.error || 'Failed to provision user');
        setIsSubmitting(false);
        return;
      }

      // 2. If role is 'intern', ensure intern record exists in DataContext
      if (provisionForm.role === 'intern') {
        const internExists = interns.some(
          (i) => i.email.toLowerCase() === cleanEmail
        );
        if (!internExists) {
          const selectedRole = roles[0];
          const selectedProject = projects[0];
          addIntern({
            full_name: provisionForm.full_name.trim(),
            email: cleanEmail,
            phone: '',
            internship_role_id: selectedRole?.id || 'role-prod-res',
            role_title: selectedRole?.title || 'Product Research Intern',
            start_date: new Date().toISOString().split('T')[0],
            planned_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            coordinator_id: currentUser?.id || 'admin',
            coordinator_name: currentUser?.full_name || 'IntraSphere Admin',
            status: 'Active',
            assigned_project_id: selectedProject?.id || null,
            assigned_project_name: selectedProject?.name || null,
            skills: ['Research', 'Collaboration'],
            learning_goals: 'Complete cohort onboarding and sprint deliverables.',
            progress_notes: 'Account provisioned by Administrator.',
            certificate_status: 'Not Eligible',
            is_archived: false,
          });
        }
      }

      // 3. Dispatch Invitation Email if requested
      let emailDispatched = false;
      let emailMessage = '';
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
            title: `Your IntraSphere IMS ${roleTitle} Account Credentials`,
            body: `Welcome to IntraSphere Labs Internship Management System.\n\nYour account has been provisioned with the following credentials:\n\nRole: ${roleTitle}\nEmail: ${cleanEmail}\nPassword: ${finalPassword}\n\nPlease sign in to access your portal, onboarding roadmap, and tasks.`,
            type: 'general',
          });

          emailDispatched = !!notifRes.delivered?.email;
          emailMessage = notifRes.message || 'Invitation sent';
        } catch (err) {
          console.error('Failed to dispatch invite email:', err);
        }
      }

      setProvisionResult({
        account: res.account,
        tempPassword: finalPassword,
        emailDispatched,
        emailMessage,
      });
    } catch (err) {
      console.error('Provisioning error:', err);
      alert('An unexpected error occurred while provisioning account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map provisioned accounts to their passwords for quick reference
  const provisionedAccounts = getProvisionedAccounts();
  const passwordMap = new Map<string, string>();
  provisionedAccounts.forEach((p) => {
    if (p.password) passwordMap.set(p.email.toLowerCase(), p.password);
  });

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
              Admin enters the person’s Name, Email, Role, and sets or auto-generates a password.
            </p>
          </div>
          <div className="p-2.5 bg-white border border-[#E5E7EB] rounded-md space-y-1">
            <div className="font-semibold text-black">2. Invitation Dispatched</div>
            <p>
              An automated email is sent to their inbox with their login credentials and direct portal link.
            </p>
          </div>
          <div className="p-2.5 bg-white border border-[#E5E7EB] rounded-md space-y-1">
            <div className="font-semibold text-black">3. Immediate Access</div>
            <p>
              The user opens the sign-in page, types their email and password, and enters their dedicated workspace.
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
              const userPass = passwordMap.get(user.email.toLowerCase());
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
                      {userPass && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `Email: ${user.email}\nPassword: ${userPass}`,
                              `copy-${user.id}`
                            )
                          }
                          className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy login email and password"
                        >
                          {copiedKey === `copy-${user.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-3 h-3 text-neutral-600" />
                              <span>Copy Credentials</span>
                            </>
                          )}
                        </button>
                      )}

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
          title={provisionResult ? 'Account Provisioned' : 'Provision User Account'}
          description={
            provisionResult
              ? 'Authorized login credentials have been created and activated.'
              : 'Grant internship coordinator or intern credentials with direct sign-in access.'
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
                      Account Created & Activated
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">
                      The user can immediately log in on the sign-in page.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E5E7EB] rounded-md space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <span className="text-[#6B7280]">Full Name:</span>
                    <strong className="text-black">{provisionResult.account.full_name}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <span className="text-[#6B7280]">Email:</span>
                    <strong className="text-black">{provisionResult.account.email}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <span className="text-[#6B7280]">Role:</span>
                    <Badge variant="dark">{provisionResult.account.role.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#6B7280]">Temporary Password:</span>
                    <strong className="text-black font-mono bg-neutral-100 px-1.5 py-0.5 rounded">
                      {provisionResult.tempPassword}
                    </strong>
                  </div>
                </div>

                {provisionResult.emailDispatched ? (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Invitation email sent to inbox ({provisionResult.emailMessage}).</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Credentials saved in database. Share these details with the user.</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={copiedKey === 'modal-copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  onClick={() =>
                    handleCopy(
                      `IntraSphere IMS Login Credentials:\nEmail: ${provisionResult.account.email}\nPassword: ${provisionResult.tempPassword}\nPortal: ${window.location.origin}`,
                      'modal-copy'
                    )
                  }
                >
                  {copiedKey === 'modal-copy' ? 'Copied to Clipboard' : 'Copy Credentials'}
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
                  Assign System Role *
                </label>
                <select
                  value={provisionForm.role}
                  onChange={(e) =>
                    setProvisionForm({
                      ...provisionForm,
                      role: e.target.value as UserRole,
                    })
                  }
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-neutral-800">
                    Temporary Sign-In Password *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setProvisionForm({
                        ...provisionForm,
                        password: generatePassword(),
                      })
                    }
                    className="text-[11px] text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={provisionForm.password}
                    onChange={(e) =>
                      setProvisionForm({ ...provisionForm, password: e.target.value })
                    }
                    placeholder="Enter password..."
                    className="w-full pl-3 pr-10 py-2 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:border-black font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

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
                      Send invitation email with login credentials
                    </span>
                    <p className="text-[#6B7280] mt-0.5">
                      Sends an automated welcome email via Resend with the account email, password, and portal link.
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
