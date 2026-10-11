'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const shouldAutoLogin = params.get('login') === 'true';
      if (emailParam) {
        const clean = decodeURIComponent(emailParam).trim();
        setEmail(clean);
        if (shouldAutoLogin) {
          setLoading(true);
          login(clean)
            .then((res) => {
              if (!res.success) {
                setErrorMessage(res.error || 'Access denied. Account not authorized.');
              }
            })
            .catch(() => {
              setErrorMessage('An error occurred during automatic sign-in.');
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }
    }
  }, [login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await login(email.trim());
      if (!result.success) {
        setErrorMessage(
          result.error ||
            'Access denied. This email is not authorized. Authorized accounts must be provisioned by the Administrator.'
        );
      }
    } catch {
      setErrorMessage('An unexpected error occurred during sign in. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Brand Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#111111] text-white font-black text-xl mb-3 shadow-sm tracking-wider">
          IMS
        </div>
        <h1 className="text-2xl font-bold text-[#111111] tracking-tight">
          IntraSphere Labs
        </h1>
        <p className="text-xs text-[#6B7280] mt-1 font-medium">
          Internship Management System &bull; Authorized Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#111111]">Sign In to IMS</h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Access cohort dashboard, intern onboarding, tasks, and system records.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">
              Authorized Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com or your intern email"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
              Passwordless direct login for provisioned Admins, Coordinators, and Interns.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#111111] hover:bg-neutral-800 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Verifying Authorization...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Footer */}
      <div className="mt-8 text-center text-[11px] text-[#6B7280]">
        <p>IntraSphere Labs &bull; Internal Post-Selection Talent Management</p>
        <p className="mt-1">Authorized personnel only &bull; Supabase Database Linked</p>
      </div>
    </div>
  );
};
