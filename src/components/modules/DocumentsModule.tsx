'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Shield,
  Search,
  ExternalLink,
  Lock,
  Eye,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { IMSDocument, DocumentCategory, DocumentStatus } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';

export const DocumentsModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const {
    documents,
    filteredDocuments,
    interns,
    projects,
    approveOfferLetter,
    issueOfferLetter,
    createDocument,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Preview Offer Letter Modal
  const [previewDoc, setPreviewDoc] = useState<IMSDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // New Upload / Document Form
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Project Document' as DocumentCategory,
    intern_id: '',
    project_id: '',
    file_name: '',
    file_size: '250 KB',
  });

  const displayDocs = filteredDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.intern_name && doc.intern_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const intern = interns.find((i) => i.id === uploadForm.intern_id);
    const proj = projects.find((p) => p.id === uploadForm.project_id);

    createDocument({
      title: uploadForm.title,
      category: uploadForm.category,
      intern_id: uploadForm.intern_id || null,
      intern_name: intern?.full_name || null,
      project_id: uploadForm.project_id || null,
      project_name: proj?.name || null,
      file_url: '#',
      file_name: uploadForm.file_name || 'document.pdf',
      file_size: uploadForm.file_size,
      owner_id: currentUser?.id || 'staff',
      owner_name: currentUser?.full_name || 'Staff',
      status: 'Approved',
      approved_by: currentUser?.full_name,
      approved_at: new Date().toISOString(),
    });

    setIsUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-3 bg-neutral-50 border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-neutral-800 shrink-0" />
          <span>
            <strong>Access-Controlled Document Vault:</strong> Private offer letters and internship agreements are restricted to authorized parties and served via secured sessions.
          </span>
        </div>

        {currentRole === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Add Document
          </Button>
        )}
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#E5E7EB] rounded-lg">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search documents by title or intern name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Categories</option>
            <option value="Offer Letter">Offer Letters</option>
            <option value="Internship Agreement">Internship Agreements</option>
            <option value="Project Document">Project Documents</option>
            <option value="Meeting Notes">Meeting Notes</option>
            <option value="Evaluation">Evaluations</option>
            <option value="Certificate">Certificates</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      {displayDocs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No documents found"
          description="Try adjusting your search criteria or category filter."
        />
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Document Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Associated Intern / Project</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {displayDocs.map((doc) => {
                const isOffer = doc.category === 'Offer Letter';

                return (
                  <tr key={doc.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-[#111111] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                      <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                        {doc.file_name} • {doc.file_size || '120 KB'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="subtle">{doc.category}</Badge>
                    </td>
                    <td className="p-3.5 text-neutral-800">
                      {doc.intern_name ? (
                        <div>
                          <span className="font-medium">{doc.intern_name}</span>
                          <span className="block text-[11px] text-[#6B7280]">Intern</span>
                        </div>
                      ) : doc.project_name ? (
                        <div>
                          <span className="font-medium truncate block max-w-[180px]">
                            {doc.project_name}
                          </span>
                          <span className="block text-[11px] text-[#6B7280]">Project</span>
                        </div>
                      ) : (
                        <span className="text-[#6B7280]">General Organization</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          doc.status === 'Issued'
                            ? 'dark'
                            : doc.status === 'Approved'
                            ? 'neutral'
                            : 'outline'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-neutral-600">
                      {doc.created_at.split('T')[0]}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setPreviewDoc(doc)}
                        >
                          {isOffer ? 'View Letter' : 'Preview'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Offer Letter / Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          description={`Category: ${previewDoc.category} • Status: ${previewDoc.status}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs text-[#111111]">
            {/* Status bar & Staff Actions */}
            <div className="p-3 bg-neutral-50 border border-[#E5E7EB] rounded-md flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280]">Document Status:</span>
                <Badge
                  variant={
                    previewDoc.status === 'Issued'
                      ? 'dark'
                      : previewDoc.status === 'Approved'
                      ? 'neutral'
                      : 'outline'
                  }
                >
                  {previewDoc.status}
                </Badge>
                {previewDoc.approved_by && (
                  <span className="text-[11px] text-neutral-500">
                    Approved by {previewDoc.approved_by}
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
                  Print / Save PDF
                </Button>

                {currentRole === 'admin' && previewDoc.category === 'Offer Letter' && (
                  <>
                    {previewDoc.status === 'Draft' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          approveOfferLetter(previewDoc.id);
                          setPreviewDoc({ ...previewDoc, status: 'Approved' });
                        }}
                      >
                        Approve Offer Letter
                      </Button>
                    )}
                    {previewDoc.status === 'Approved' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          issueOfferLetter(previewDoc.id);
                          setPreviewDoc({ ...previewDoc, status: 'Issued' });
                        }}
                      >
                        Officially Issue Letter
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* HIGH FIDELITY LETTERHEAD DOCUMENT CONTAINER */}
            <div className="p-8 sm:p-12 bg-white border border-[#E5E7EB] rounded-lg shadow-sm space-y-6 print-container text-[#111111]">
              {/* Header Letterhead */}
              <div className="border-b-2 border-black pb-6 flex items-start justify-between">
                <div>
                  <div className="text-xl font-bold tracking-tight text-black">
                    IntraSphere Labs
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    Building Real-World Products Through Innovation
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Headquarters: Innovation District • Contact: hr@intraspherelabs.com
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase font-mono tracking-widest text-neutral-500">
                    Official Document
                  </div>
                  <div className="text-xs font-mono font-semibold text-black mt-1">
                    REF: {previewDoc.id.toUpperCase()}
                  </div>
                  <div className="text-xs font-mono text-neutral-600">
                    Date: {previewDoc.offer_details?.issue_date || previewDoc.created_at.split('T')[0]}
                  </div>
                </div>
              </div>

              {previewDoc.category === 'Offer Letter' && previewDoc.offer_details ? (
                /* OFFICIAL OFFER LETTER CONTENT */
                <div className="space-y-5 text-xs text-neutral-900 leading-relaxed">
                  <div>
                    <p className="font-semibold">{previewDoc.offer_details.intern_name}</p>
                    <p className="text-neutral-600">{previewDoc.offer_details.intern_email}</p>
                  </div>

                  <p>
                    Dear <strong>{previewDoc.offer_details.intern_name}</strong>,
                  </p>

                  <p>
                    On behalf of <strong>IntraSphere Labs</strong>, we are pleased to offer you the position of{' '}
                    <strong>{previewDoc.offer_details.role_title}</strong> in our upcoming quarterly internship cohort. We were impressed with your background and are excited to welcome you into our product innovation squad.
                  </p>

                  <div className="p-4 bg-neutral-50 rounded border border-[#E5E7EB] space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-black">
                      Summary of Internship Terms
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Internship Role:</span>
                        <span className="font-medium">{previewDoc.offer_details.role_title}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Work Arrangement:</span>
                        <span className="font-medium">{previewDoc.offer_details.work_arrangement}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Duration & Period:</span>
                        <span className="font-medium">{previewDoc.offer_details.duration}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Compensation Terms:</span>
                        <span className="font-medium">{previewDoc.offer_details.compensation_terms}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs mb-1.5">Scope of Responsibilities:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                      {previewDoc.offer_details.responsibilities.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <p>
                    This offer is subject to the execution of our standard IntraSphere Labs Confidentiality and Intellectual Property Agreement. We look forward to creating real-world products together.
                  </p>

                  {/* Signatures */}
                  <div className="pt-8 grid grid-cols-2 gap-8 border-t border-neutral-200">
                    <div>
                      <div className="text-[11px] text-neutral-500 uppercase font-mono">
                        Authorized Signatory:
                      </div>
                      <div className="mt-4 font-serif text-sm italic font-semibold text-black">
                        {previewDoc.offer_details.signatory_name}
                      </div>
                      <div className="text-xs font-semibold text-neutral-900 mt-1">
                        {previewDoc.offer_details.signatory_name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {previewDoc.offer_details.signatory_title}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-neutral-500 uppercase font-mono">
                        Candidate Acceptance:
                      </div>
                      <div className="mt-4 border-b border-neutral-400 pb-1 font-mono text-neutral-400">
                        {previewDoc.status === 'Issued' ? 'Accepted & Acknowledged' : 'Awaiting Signature'}
                      </div>
                      <div className="text-xs font-semibold text-neutral-900 mt-1">
                        {previewDoc.offer_details.intern_name}
                      </div>
                      <div className="text-[11px] text-neutral-500">Candidate</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* STANDARD DOCUMENT PREVIEW */
                <div className="space-y-4 text-xs text-neutral-800 leading-relaxed">
                  <div className="p-4 bg-neutral-50 rounded border border-[#E5E7EB]">
                    <div className="font-semibold text-black mb-1">{previewDoc.title}</div>
                    <p className="text-[#6B7280]">
                      This is an authorized internal document registered within the IntraSphere Labs IMS repository.
                    </p>
                  </div>
                  <div className="p-6 bg-white border border-dashed border-neutral-300 rounded text-center text-neutral-500">
                    Document binary content encrypted and verified by IntraSphere Vault.
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end no-print">
              <Button variant="secondary" size="sm" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload or Register Document"
          description="Add a file to the secure IMS storage vault."
          maxWidth="md"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-800 mb-1">Document Title *</label>
              <input
                type="text"
                required
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="e.g. Mid-term Sprint Architecture Evaluation"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      category: e.target.value as DocumentCategory,
                    })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Project Document">Project Document</option>
                  <option value="Internship Agreement">Internship Agreement</option>
                  <option value="Meeting Notes">Meeting Notes</option>
                  <option value="Evaluation">Evaluation</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Associate Intern</label>
                <select
                  value={uploadForm.intern_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, intern_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">General (None)</option>
                  {interns.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 mb-1">File Name</label>
              <input
                type="text"
                value={uploadForm.file_name}
                onChange={(e) => setUploadForm({ ...uploadForm, file_name: e.target.value })}
                placeholder="ISL_Architecture_Doc.pdf"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Document
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
