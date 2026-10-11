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
  Edit3,
  Save,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { IMSDocument, DocumentCategory, DocumentStatus, WorkArrangement } from '@/types';
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
    updateDocument,
    settings,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Preview Offer Letter Modal
  const [previewDoc, setPreviewDoc] = useState<IMSDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Edit Offer Letter Modal State
  const [isEditOfferModalOpen, setIsEditOfferModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<IMSDocument | null>(null);
  const [editOfferForm, setEditOfferForm] = useState({
    compensation_terms: '',
    role_title: '',
    duration: '',
    work_arrangement: 'Remote' as WorkArrangement,
    start_date: '',
    issue_date: '',
    signatory_name: '',
    signatory_title: '',
    responsibilities_text: '',
    intern_name: '',
    intern_email: '',
  });
  const [editSaveSuccess, setEditSaveSuccess] = useState(false);

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

  const handleOpenEditOffer = (doc: IMSDocument) => {
    setEditingDoc(doc);
    const details = doc.offer_details;
    setEditOfferForm({
      compensation_terms:
        details?.compensation_terms || settings.default_stipend || 'Stipend: $1,400/month',
      role_title:
        details?.role_title || doc.title.replace('Offer Letter — ', '').split(' (')[0] || 'Intern',
      duration: details?.duration || settings.default_duration || '3 Months',
      work_arrangement: (details?.work_arrangement ||
        settings.default_work_arrangement ||
        'Remote') as WorkArrangement,
      start_date: details?.start_date || new Date().toISOString().split('T')[0],
      issue_date: details?.issue_date || new Date().toISOString().split('T')[0],
      signatory_name:
        details?.signatory_name || settings.authorized_signatory_name || 'IntraSphere Admin',
      signatory_title:
        details?.signatory_title || settings.authorized_signatory_title || 'Operations Lead',
      responsibilities_text: (
        details?.responsibilities || [
          'Fulfill designated cohort project deliverables and sprint requirements.',
          'Submit regular check-ins and participate in weekly milestone reviews.',
          'Collaborate effectively with team members, mentors, and project coordinators.',
        ]
      ).join('\n'),
      intern_name: details?.intern_name || doc.intern_name || '',
      intern_email: details?.intern_email || '',
    });
    setEditSaveSuccess(false);
    setIsEditOfferModalOpen(true);
  };

  const handleSaveOfferLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const responsibilities = editOfferForm.responsibilities_text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const updatedOfferDetails = {
      ...(editingDoc.offer_details || {}),
      compensation_terms: editOfferForm.compensation_terms,
      role_title: editOfferForm.role_title,
      duration: editOfferForm.duration,
      work_arrangement: editOfferForm.work_arrangement,
      start_date: editOfferForm.start_date,
      issue_date: editOfferForm.issue_date,
      signatory_name: editOfferForm.signatory_name,
      signatory_title: editOfferForm.signatory_title,
      responsibilities:
        responsibilities.length > 0
          ? responsibilities
          : ['Fulfill designated cohort project deliverables and sprint requirements.'],
      intern_name: editOfferForm.intern_name,
      intern_email: editOfferForm.intern_email,
      is_approved: editingDoc.offer_details?.is_approved ?? false,
      is_issued: editingDoc.offer_details?.is_issued ?? false,
    };

    const updatedDoc: Partial<IMSDocument> = {
      title: `Offer Letter — ${editOfferForm.intern_name} (${editOfferForm.role_title})`,
      intern_name: editOfferForm.intern_name,
      offer_details: updatedOfferDetails,
    };

    updateDocument(editingDoc.id, updatedDoc);

    // If preview modal has this document open, reflect updates immediately in preview
    if (previewDoc && previewDoc.id === editingDoc.id) {
      setPreviewDoc({
        ...previewDoc,
        ...updatedDoc,
        offer_details: updatedOfferDetails,
      });
    }

    setEditSaveSuccess(true);
    setTimeout(() => {
      setEditSaveSuccess(false);
      setIsEditOfferModalOpen(false);
    }, 1000);
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
                        {isOffer && (currentRole === 'admin' || currentRole === 'coordinator') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenEditOffer(doc)}
                          >
                            Edit Terms
                          </Button>
                        )}
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
                {(currentRole === 'admin' || currentRole === 'coordinator') && previewDoc.category === 'Offer Letter' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenEditOffer(previewDoc)}
                  >
                    Edit Terms & Salary
                  </Button>
                )}

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
                    {settings.company_name || 'IntraSphere Labs'}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    {settings.tagline || 'Building Real-World Products Through Innovation'}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {settings.company_address || 'Headquarters: Innovation District'} • Contact: {settings.contact_email || 'hr@intraspherelabs.com'}
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
                    On behalf of <strong>{settings.company_name || 'IntraSphere Labs'}</strong>, we are pleased to offer you the position of{' '}
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
                        <span className="font-medium text-emerald-800 font-semibold">{previewDoc.offer_details.compensation_terms}</span>
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
                    This offer is subject to the execution of our standard {settings.company_name || 'IntraSphere Labs'} Confidentiality and Intellectual Property Agreement. We look forward to creating real-world products together.
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

      {/* Edit Offer Letter Terms & Salary Modal */}
      {isEditOfferModalOpen && editingDoc && (
        <Modal
          isOpen={isEditOfferModalOpen}
          onClose={() => setIsEditOfferModalOpen(false)}
          title="Edit Offer Letter Terms & Compensation"
          description={`Update position salary, responsibilities, dates, and terms for ${editOfferForm.intern_name || 'candidate'}.`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveOfferLetter} className="space-y-4 text-xs">
            {editSaveSuccess && (
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Offer letter terms and salary updated successfully!
                </span>
              </div>
            )}

            {/* Recipient Details */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-3">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-700" />
                Candidate &amp; Position Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-800 mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    value={editOfferForm.intern_name}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, intern_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-800 mb-1">Candidate Email *</label>
                  <input
                    type="email"
                    required
                    value={editOfferForm.intern_email}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, intern_email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Internship Role Title *</label>
                <input
                  type="text"
                  required
                  value={editOfferForm.role_title}
                  onChange={(e) => setEditOfferForm({ ...editOfferForm, role_title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Financial / Compensation & Arrangement Terms */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-3">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-neutral-700" />
                Compensation, Salary &amp; Work Arrangement
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-800 mb-1">
                    Compensation / Salary / Stipend Terms *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stipend: $1,500/month or ₹25,000/month or Unpaid / Academic Credit"
                    value={editOfferForm.compensation_terms}
                    onChange={(e) =>
                      setEditOfferForm({ ...editOfferForm, compensation_terms: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black font-medium text-neutral-900"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    Displays directly under &quot;Compensation Terms&quot; in the formal letterhead summary.
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-neutral-800 mb-1">Work Arrangement *</label>
                  <select
                    value={editOfferForm.work_arrangement}
                    onChange={(e) =>
                      setEditOfferForm({
                        ...editOfferForm,
                        work_arrangement: e.target.value as WorkArrangement,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="In-office">In-office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-800 mb-1">Duration &amp; Period *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 Months or June 1 – Aug 31, 2025"
                    value={editOfferForm.duration}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, duration: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-800 mb-1">Cohort Start Date *</label>
                  <input
                    type="date"
                    required
                    value={editOfferForm.start_date}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-800 mb-1">Letter Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={editOfferForm.issue_date}
                    onChange={(e) => setEditOfferForm({ ...editOfferForm, issue_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Scope of Responsibilities */}
            <div>
              <label className="block font-medium text-neutral-800 mb-1">
                Scope of Responsibilities (1 item per line)
              </label>
              <textarea
                rows={4}
                required
                value={editOfferForm.responsibilities_text}
                onChange={(e) =>
                  setEditOfferForm({ ...editOfferForm, responsibilities_text: e.target.value })
                }
                placeholder="Fulfill designated cohort project deliverables and sprint requirements.&#10;Submit regular check-ins and participate in weekly milestone reviews.&#10;Collaborate with assigned mentor and team squad."
                className="w-full px-3 py-2 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black leading-relaxed"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Each line will be formatted as a professional bullet point in the official letterhead.
              </span>
            </div>

            {/* Authorized Signatory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5E7EB]">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">
                  Authorized Signatory Name *
                </label>
                <input
                  type="text"
                  required
                  value={editOfferForm.signatory_name}
                  onChange={(e) =>
                    setEditOfferForm({ ...editOfferForm, signatory_name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Signatory Title *</label>
                <input
                  type="text"
                  required
                  value={editOfferForm.signatory_title}
                  onChange={(e) =>
                    setEditOfferForm({ ...editOfferForm, signatory_title: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">
                Updates are saved instantly to the vault and reflected in real-time.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditOfferModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  {editSaveSuccess ? 'Saved!' : 'Save Offer Terms'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
