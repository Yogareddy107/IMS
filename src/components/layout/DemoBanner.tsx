'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Database,
  RefreshCw,
  Key,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const DemoBanner: React.FC = () => {
  const { isDemoMode } = useAuth();
  const { resetDemoData } = useData();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseConfigured = isSupabaseConfigured();

  const handleReset = () => {
    resetDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const copySqlNotice = () => {
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <>
      <div className="bg-[#111111] text-white border-b border-neutral-800 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          {supabaseConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-white font-medium border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              SUPABASE CONNECTED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-white font-medium border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-pulse" />
              DEMO MODE
            </span>
          )}

          <span className="text-neutral-300 hidden sm:inline">
            {supabaseConfigured
              ? 'jkzsfjsawebqvyhjkwzv.supabase.co connected. Schema migration & persona switching active.'
              : 'Sample Data Active. Supabase credentials not connected.'}
          </span>
          <span className="text-neutral-400 text-[11px] hidden md:inline">
            Role switching enabled for testing.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSetupModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-[#111111] hover:bg-neutral-200 transition-colors font-medium text-[11px]"
          >
            <Database className="w-3.5 h-3.5" />
            {supabaseConfigured ? 'Database Schema & Setup' : 'Backend Setup Guide'}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-neutral-300 hover:text-white hover:bg-white/10 transition-colors text-[11px]"
            title="Reset to default sample data"
          >
            <RefreshCw className={`w-3 h-3 ${resetSuccess ? 'animate-spin' : ''}`} />
            {resetSuccess ? 'Reset!' : 'Reset Data'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="Supabase Database Configuration & Schema"
        description="Verify backend integration and run PostgreSQL migration script."
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs text-[#111111]">
          {/* Status Box */}
          <div className="p-3 bg-neutral-50 border border-[#E5E7EB] rounded-md flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div className="text-neutral-700">
              <strong className="text-[#111111]">Supabase Project Linked:</strong>{' '}
              <code className="font-mono text-black font-semibold">https://jkzsfjsawebqvyhjkwzv.supabase.co</code>
              <p className="mt-1 text-[11px] text-[#6B7280]">
                API URL and Anon Key are configured in <code className="text-black">.env.local</code>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-[#111111]">
              1. Execute SQL Migration in Supabase SQL Editor
            </h4>
            <p className="text-[#6B7280]">
              To instantiate the 15 PostgreSQL tables, RLS security policies, and indexes on your Supabase database:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-[#6B7280]">
              <li>
                Open the Supabase SQL Editor for your project:{' '}
                <a
                  href="https://supabase.com/dashboard/project/jkzsfjsawebqvyhjkwzv/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-black underline underline-offset-2 inline-flex items-center gap-1"
                >
                  Open Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Open the file <code className="px-1.5 py-0.5 bg-neutral-100 rounded text-black font-mono">supabase/schema.sql</code> in this project.
              </li>
              <li>Copy and paste the entire script into the SQL Editor and click <strong>Run</strong>.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-[#111111]">
              2. Provision the First Administrator
            </h4>
            <p className="text-[#6B7280]">
              Public self-registration for Admin is disabled to prevent privilege escalation. Once your user creates an account via Supabase Auth:
            </p>
            <div className="p-2.5 bg-neutral-900 text-neutral-100 rounded font-mono text-[11px] overflow-x-auto">
{`UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin@intraspherelabs.com';`}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-[#111111]">
              3. Private Storage Buckets
            </h4>
            <p className="text-[#6B7280]">
              In your Supabase Storage dashboard, create two private buckets named <code className="text-black font-mono">documents</code> and <code className="text-black font-mono">offer-letters</code> with public access turned off.
            </p>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280]">
              IntraSphere Labs IMS • Dual Mode Architecture
            </span>
            <Button variant="primary" size="sm" onClick={() => setShowSetupModal(false)}>
              Close Guide
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
