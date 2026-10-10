'use client';

import React, { useState } from 'react';
import {
  Award,
  Plus,
  CheckCircle2,
  Printer,
  Shield,
  Clock,
  User,
  Eye,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Certificate, CertificateStatus } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const CertificatesModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    certificates,
    interns,
    settings,
    onboardingItems,
    tasks,
    createCertificate,
    updateCertificateStatus,
    currentInternRecord,
  } = useData();

  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Certificate Form
  const [formData, setFormData] = useState({
    intern_id: interns[0]?.id || '',
    signatory_name: settings.authorized_signatory_name,
    signatory_title: settings.authorized_signatory_title,
    issue_date: new Date().toISOString().split('T')[0],
  });

  // Filter for intern
  const displayCerts = certificates.filter((c) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinator') return true;
    if (currentRole === 'intern') {
      return (
        c.intern_id === currentInternRecord?.id ||
        c.intern_name === currentInternRecord?.full_name
      );
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const intern = interns.find((i) => i.id === formData.intern_id);
    if (!intern) return;

    const certId = `ISL-CERT-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    createCertificate({
      intern_id: intern.id,
      intern_name: intern.full_name,
      role_title: intern.role_title,
      duration: `${intern.start_date} – ${intern.planned_end_date}`,
      completion_status: 'Internship Requirements Satisfied',
      signatory_name: formData.signatory_name,
      signatory_title: formData.signatory_title,
      issue_date: formData.issue_date,
      certificate_identifier: certId,
      status: 'Draft',
      approved_by: null,
      issued_by: null,
    });

    setIsCreateModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 border border-[#E5E7EB] rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {currentRole === 'intern' ? 'My Internship Certificate' : 'Certificate Management & Issuance'}
          </h2>
          <p className="text-xs text-[#6B7280]">
            Officially verified internship completion credentials with unique serial identifiers.
          </p>
        </div>

        {currentRole === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Certificate Draft
          </Button>
        )}
      </div>

      {/* Cohort Eligibility Checklist Summary for Staff */}
      {currentRole !== 'intern' && (
        <div className="p-4 bg-neutral-50 border border-[#E5E7EB] rounded-lg space-y-2 text-xs">
          <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>Completion Requirements Verification Matrix</span>
          </div>
          <p className="text-neutral-600">
            A certificate is eligible for issuance once all designated onboarding checklist items are verified and active sprint tasks have reached completion.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {interns.map((intern) => {
              const internOnb = onboardingItems.filter((o) => o.intern_id === intern.id);
              const doneOnb = internOnb.filter((o) => o.is_completed).length;
              const isEligible = internOnb.length > 0 && doneOnb === internOnb.length;

              return (
                <div key={intern.id} className="p-2.5 bg-white rounded border border-[#E5E7EB]">
                  <div className="font-medium text-neutral-900 truncate">{intern.full_name}</div>
                  <div className="text-[11px] text-[#6B7280]">{intern.role_title}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono">
                      {doneOnb}/{internOnb.length} Onboarding
                    </span>
                    <Badge variant={isEligible ? 'dark' : 'neutral'} size="sm">
                      {isEligible ? 'Eligible' : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificates List */}
      {displayCerts.length === 0 ? (
        <EmptyState
          icon={<Award className="w-6 h-6" />}
          title="No certificate records available"
          description={
            currentRole === 'intern'
              ? 'Your certificate will be prepared and approved by leadership upon conclusion of your internship duration.'
              : 'Create a draft certificate for eligible interns who have met requirements.'
          }
        />
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Intern Name</th>
                <th className="p-3.5">Track / Role</th>
                <th className="p-3.5">Identifier</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5 text-right">Certificate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {displayCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-[#111111]">{cert.intern_name}</div>
                    <div className="text-[11px] text-[#6B7280] font-mono">{cert.duration}</div>
                  </td>
                  <td className="p-3.5 text-neutral-800 font-medium">{cert.role_title}</td>
                  <td className="p-3.5 font-mono text-neutral-900 font-semibold">
                    {cert.certificate_identifier}
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        cert.status === 'Issued'
                          ? 'dark'
                          : cert.status === 'Approved'
                          ? 'neutral'
                          : 'outline'
                      }
                    >
                      {cert.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-neutral-600">{cert.issue_date}</td>
                  <td className="p-3.5 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreviewCert(cert)}
                    >
                      Preview Certificate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {previewCert && (
        <Modal
          isOpen={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title={`Certificate — ${previewCert.intern_name}`}
          description={`Status: ${previewCert.status} • Identifier: ${previewCert.certificate_identifier}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs text-[#111111]">
            {/* Action Bar */}
            <div className="p-3 bg-neutral-50 border border-[#E5E7EB] rounded-md flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280]">State:</span>
                <Badge
                  variant={
                    previewCert.status === 'Issued'
                      ? 'dark'
                      : previewCert.status === 'Approved'
                      ? 'neutral'
                      : 'outline'
                  }
                >
                  {previewCert.status}
                </Badge>
                {previewCert.approved_by && (
                  <span className="text-[11px] text-neutral-500">
                    Approved by {previewCert.approved_by}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={handlePrint}
                >
                  Print / Export PDF
                </Button>

                {currentRole === 'admin' && (
                  <>
                    {previewCert.status === 'Draft' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          updateCertificateStatus(previewCert.id, 'Approved');
                          setPreviewCert({ ...previewCert, status: 'Approved' });
                        }}
                      >
                        Approve Certificate
                      </Button>
                    )}
                    {previewCert.status === 'Approved' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          updateCertificateStatus(previewCert.id, 'Issued');
                          setPreviewCert({ ...previewCert, status: 'Issued' });
                        }}
                      >
                        Officially Issue
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* HIGH-FIDELITY MONOCHROME PRINTABLE CERTIFICATE */}
            <div className="p-12 sm:p-16 bg-white border-4 border-black rounded-lg shadow-sm print-container text-center space-y-6 text-black">
              {/* Top Branding */}
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-widest font-mono font-bold text-neutral-500">
                  Certificate of Internship Completion
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-black pt-2">
                  IntraSphere Labs
                </div>
                <div className="text-xs text-neutral-600 font-medium">
                  Building Real-World Products Through Innovation
                </div>
              </div>

              <div className="w-24 h-0.5 bg-black mx-auto my-4" />

              <p className="text-xs text-neutral-600 uppercase tracking-wider font-mono">
                This is to officially certify that
              </p>

              <div className="text-2xl sm:text-3xl font-serif italic font-bold text-black py-2 border-b border-neutral-300 max-w-md mx-auto">
                {previewCert.intern_name}
              </div>

              <p className="text-xs text-neutral-700 max-w-lg mx-auto leading-relaxed">
                has successfully and honorably fulfilled all requirements and responsibilities as a{' '}
                <strong>{previewCert.role_title}</strong> during the internship cohort period of{' '}
                <strong>{previewCert.duration}</strong> at IntraSphere Labs.
              </p>

              {/* Status Ribbon inside Certificate */}
              <div className="py-2">
                <span className="inline-block px-3 py-1 rounded bg-neutral-100 text-[11px] font-mono border border-neutral-300 font-semibold">
                  STATUS: {previewCert.status.toUpperCase()} • ID: {previewCert.certificate_identifier}
                </span>
              </div>

              {/* Signature Row */}
              <div className="pt-10 grid grid-cols-2 gap-12 max-w-lg mx-auto text-center border-t border-neutral-200 mt-8">
                <div>
                  <div className="font-serif italic text-base font-bold text-black">
                    {previewCert.signatory_name}
                  </div>
                  <div className="text-xs font-bold text-neutral-900 mt-1">
                    {previewCert.signatory_name}
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    {previewCert.signatory_title}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-xs font-semibold text-neutral-800">
                    {previewCert.issue_date}
                  </div>
                  <div className="text-xs font-bold text-neutral-900 mt-1">Date of Issuance</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    Official Registry Stamp
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end no-print">
              <Button variant="secondary" size="sm" onClick={() => setPreviewCert(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Certificate Draft Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Prepare Certificate Draft"
          description="Prepare completion credentials for an intern."
          maxWidth="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Select Intern</label>
              <select
                value={formData.intern_id}
                onChange={(e) => setFormData({ ...formData, intern_id: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              >
                {interns.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.full_name} ({i.role_title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Authorized Signatory</label>
              <input
                type="text"
                required
                value={formData.signatory_name}
                onChange={(e) => setFormData({ ...formData, signatory_name: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Signatory Title</label>
              <input
                type="text"
                required
                value={formData.signatory_title}
                onChange={(e) => setFormData({ ...formData, signatory_title: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Certificate Draft
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
