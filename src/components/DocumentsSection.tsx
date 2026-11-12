import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Search, Filter, CheckCircle, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { GazettedDocument } from '../types';
import { GAZETTED_DOCUMENTS } from '../data/mockData';
import { Pagination } from './Pagination';

interface DocumentsSectionProps {
  onDocumentDownloaded?: (title: string) => void;
  isStandalonePage?: boolean;
  onNavigateHome?: () => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  onDocumentDownloaded,
  isStandalonePage = false,
  onNavigateHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<GazettedDocument | null>(null);
  const [downloadSuccessDoc, setDownloadSuccessDoc] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const categories = [
    { id: 'all', label: 'All Documents' },
    { id: 'Fee-Fixing', label: 'Fee-Fixing Resolution' },
    { id: 'Bye-Laws', label: 'Municipal Bye-Laws' },
    { id: 'Budget', label: 'Composite Budget & IGF' },
    { id: 'Tenders', label: 'Procurement & Tenders' },
  ];

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const filteredDocs = GAZETTED_DOCUMENTS.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.gazetteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE) || 1;
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownload = (doc: GazettedDocument) => {
    setDownloadSuccessDoc(doc.title);
    if (onDocumentDownloaded) {
      onDocumentDownloaded(doc.title);
    }
    setTimeout(() => {
      setDownloadSuccessDoc(null);
    }, 3500);
  };

  return (
    <section id="documents" className="py-12 lg:py-16 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation when Standalone Page */}
        {isStandalonePage && (
          <div className="mb-6 space-y-4">
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <button
                onClick={onNavigateHome}
                className="hover:text-emerald-800 transition-colors cursor-pointer"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-slate-800 font-semibold">
                Gazetted Documents & Legislative Repository
              </span>
            </nav>

            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/85 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>
        )}
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5">
              Public Records & Legislative Repository
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Gazetted Documents, Bye-Laws & Resolutions
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Access and download official statutory instruments, the 2026 Fee-Fixing Resolution, municipal environmental bye-laws, and procurement tenders.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents or L.I. numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white/90 backdrop-blur-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-lg mb-8 overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Download Success Notice */}
        {downloadSuccessDoc && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Download Initiated:</strong> {downloadSuccessDoc} has been saved to your downloads folder.
              </span>
            </div>
            <span className="text-[11px] text-emerald-800 font-mono">PDF · Official Copy</span>
          </div>
        )}

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-600/50 hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-semibold text-emerald-800 uppercase tracking-wider">
                    {doc.category} · {doc.gazetteNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{doc.fileSize}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="text-xs text-slate-700 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 cursor-pointer py-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Read Brief</span>
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[38px]"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="hidden xs:inline">Download Gazetted PDF</span>
                  <span className="xs:hidden">Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state if search yields no result */}
        {filteredDocs.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 p-8">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">No documents found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your category filter or search keywords.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDocs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            itemName="gazetted documents"
          />
        </div>

        {/* Cross-Page Navigation Bridges */}
        <div className="mt-8 p-6 sm:p-8 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-950">
              Ready to pay statutory fees or settle 2026 property rates?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 max-w-2xl">
              Pay your Property Rates, Business Operating Permit (BOP), and Market Tolls instantly via our secure mobile money and card billing gateway.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                window.location.hash = '#service';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Read More on Public Services & Rates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">
                  Official Gazette Summary
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
              <div><strong>Gazette / L.I. Reference:</strong> {previewDoc.gazetteNumber}</div>
              <div><strong>Gazetted Year:</strong> {previewDoc.year}</div>
              <div><strong>File Size:</strong> {previewDoc.fileSize}</div>
              <div className="pt-2 border-t border-slate-200 leading-relaxed">
                <strong>Executive Purpose:</strong> {previewDoc.summary}
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              This document is legally enforceable across all 7 electoral areas of Ablekuma Central Municipal Assembly under Section 181 of Act 936.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow cursor-pointer"
              >
                Download Full PDF Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
