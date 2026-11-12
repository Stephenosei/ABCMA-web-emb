import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { BillRecord, CitizenIssue } from '../types';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  bills: BillRecord[];
  issues: CitizenIssue[];
  onOpenPaymentGateway: (bill: BillRecord) => void;
  onViewReceipt: (bill: BillRecord) => void;
}

export const TrackModal: React.FC<TrackModalProps> = ({
  isOpen,
  onClose,
  initialCode,
  bills,
  issues,
  onOpenPaymentGateway,
  onViewReceipt,
}) => {
  if (!isOpen) return null;

  const [searchCode, setSearchCode] = useState(initialCode || '');
  const [matchedBill, setMatchedBill] = useState<BillRecord | null>(null);
  const [matchedIssue, setMatchedIssue] = useState<CitizenIssue | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performLookup = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    setHasSearched(true);
    const billMatch = bills.find(
      (b) =>
        b.billNumber.toLowerCase().includes(clean) ||
        (b.receiptNumber && b.receiptNumber.toLowerCase().includes(clean))
    );
    const issueMatch = issues.find((i) => i.trackingCode.toLowerCase().includes(clean));

    setMatchedBill(billMatch || null);
    setMatchedIssue(issueMatch || null);
  };

  useEffect(() => {
    if (initialCode) {
      setSearchCode(initialCode);
      performLookup(initialCode);
    }
  }, [initialCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">
                ACMA Verification & Tracking Center
              </div>
              <h3 className="text-base font-bold">Track Any Permit, Bill or Report</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Enter Tracking Code, Bill No., or Receipt Reference
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. REP-2026-1049, PROP-2026-4019, ACMA-..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Track Now
              </button>
            </div>
            <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
              <span>Try:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchCode('REP-2026-1049');
                  performLookup('REP-2026-1049');
                }}
                className="text-emerald-800 hover:underline font-mono"
              >
                REP-2026-1049
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setSearchCode('PROP-2026-4019');
                  performLookup('PROP-2026-4019');
                }}
                className="text-emerald-800 hover:underline font-mono"
              >
                PROP-2026-4019
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setSearchCode('REP-2026-1033');
                  performLookup('REP-2026-1033');
                }}
                className="text-emerald-800 hover:underline font-mono"
              >
                REP-2026-1033
              </button>
            </div>
          </form>

          {/* Results Area */}
          {matchedIssue && (
            <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {matchedIssue.trackingCode}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold text-[11px] uppercase">
                  {matchedIssue.status.replace('_', ' ')}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">{matchedIssue.title}</h4>
              <p className="text-slate-600 leading-relaxed">{matchedIssue.description}</p>

              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Electoral Area:</span>
                  <span className="font-semibold text-slate-800">{matchedIssue.electoralArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department Assigned:</span>
                  <span className="text-slate-800">{matchedIssue.departmentAssigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date Logged:</span>
                  <span className="font-mono text-slate-800">{matchedIssue.dateReported}</span>
                </div>
              </div>

              {matchedIssue.resolutionNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 space-y-1">
                  <strong className="block text-[11px] font-bold">Field Engineer Update:</strong>
                  <p className="text-[11px]">{matchedIssue.resolutionNotes}</p>
                </div>
              )}
            </div>
          )}

          {matchedBill && (
            <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {matchedBill.billNumber}
                </span>
                <span className={`px-2 py-0.5 rounded font-semibold text-[11px] uppercase ${
                  matchedBill.status === 'paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}>
                  {matchedBill.status === 'paid' ? 'Fully Paid' : 'Payment Due'}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">{matchedBill.title}</h4>

              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ratepayer Name:</span>
                  <span className="font-bold text-slate-800">{matchedBill.taxpayerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800">{matchedBill.propertyAddressOrStore}</span>
                </div>
                <div className="flex justify-between font-mono font-semibold pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-sans">Outstanding Balance:</span>
                  <span className="text-emerald-900 text-sm">GHS {matchedBill.balanceGHS.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2">
                {matchedBill.status === 'paid' ? (
                  <button
                    onClick={() => {
                      onClose();
                      onViewReceipt(matchedBill);
                    }}
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    View Official Digital Receipt
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaymentGateway(matchedBill);
                    }}
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs shadow transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Pay GHS {matchedBill.balanceGHS.toFixed(2)} Now via MoMo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {hasSearched && !matchedBill && !matchedIssue && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Record Found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No active permit, rate bill, or fault ticket was found matching "{searchCode}". If you submitted an application recently, please allow up to 2 hours for centralized registry indexing.
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
