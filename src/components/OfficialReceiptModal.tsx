import React from 'react';
import { X, Printer, CheckCircle, Download, ShieldCheck, QrCode } from 'lucide-react';
import { PaymentTransaction, BillRecord } from '../types';

interface OfficialReceiptModalProps {
  transaction: PaymentTransaction | null;
  bill?: BillRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  transaction,
  bill,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-4 sm:my-8 print:m-0 print:border-none print:shadow-none print:max-h-none">
        {/* Receipt Header Strip */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-tight">Official ACMA Digital Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Print / Save PDF</span>
              <span className="xs:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="p-4 sm:p-8 font-sans text-slate-900 bg-white overflow-y-auto flex-1">
          {/* Municipal Crest & Republic Header */}
          <div className="text-center pb-6 border-b-2 border-slate-800">
            <div className="w-16 h-16 mx-auto mb-2.5 rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
              <img
                src="/assets/aistudio/abcma_logo_74f7cef4.jpeg"
                alt="Ablekuma Central Municipal Assembly Crest"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain scale-[1.42]"
              />
            </div>
            <div className="inline-block px-3 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              Republic of Ghana · Local Governance System
            </div>
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-950 font-serif-civic">
              Ablekuma Central Municipal Assembly
            </h2>
            <div className="text-xs text-slate-600 mt-0.5">
              Department of Finance & Revenue Mobilization
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Municipal Assembly Complex, Lartebiokorshie, Accra · P.O. Box AC 214
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-xs font-bold uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Official Electronic General Revenue Receipt</span>
            </div>
          </div>

          {/* Receipt Identifiers */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Receipt Number:</span>
              <span className="font-mono font-bold text-sm text-slate-900">{transaction.receiptNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Date & Time Issued:</span>
              <span className="font-medium text-slate-800">{transaction.timestamp}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bill Reference No:</span>
              <span className="font-mono font-semibold text-slate-800">{transaction.billNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Payment Method:</span>
              <span className="font-semibold text-emerald-800 uppercase">
                {transaction.paymentMethod.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Taxpayer Information */}
          <div className="py-4 border-b border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Taxpayer / Ratepayer Name:</span>
              <span className="font-bold text-slate-900 text-right">{transaction.taxpayerName}</span>
            </div>
            {bill && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ghana Card / TIN:</span>
                  <span className="font-mono text-slate-800">{bill.ghanaCardOrTin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Electoral Area:</span>
                  <span className="text-slate-800">{bill.electoralArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Premises / Store Address:</span>
                  <span className="text-slate-800 text-right max-w-[260px] truncate">{bill.propertyAddressOrStore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assessment Period:</span>
                  <span className="font-medium text-slate-800">{bill.period}</span>
                </div>
              </>
            )}
          </div>

          {/* Financial Breakdown Table */}
          <div className="py-4 border-b-2 border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 text-left">
                  <th className="py-2">Description of Revenue Item</th>
                  <th className="py-2 text-right">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2 text-slate-800 font-sans">
                    {bill ? bill.title : 'Municipal Statutory Rate Settlement'}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    GHS {transaction.amountPaidGHS.toFixed(2)}
                  </td>
                </tr>
                <tr className="font-bold text-sm bg-slate-50 font-sans">
                  <td className="py-2.5 px-2 text-slate-900">Total Settled (Ghana Cedis)</td>
                  <td className="py-2.5 px-2 text-right text-emerald-900 font-mono tabular-nums">
                    GHS {transaction.amountPaidGHS.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Verification & QR Seal */}
          <div className="pt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg p-1.5 flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                <span className="font-bold text-slate-700 block">ACMA Digital Verification Token</span>
                <span>Scan with any camera to verify validity with the ACMA Revenue Directorate database.</span>
                <span className="font-mono text-emerald-800 block mt-0.5">AUTH-KEY: {transaction.referenceId.slice(0, 12)}</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-600">
              <div className="font-serif-civic italic text-slate-800 text-sm">Hon. Finance Directorate</div>
              <div className="border-t border-slate-400 pt-1 mt-1 font-semibold text-slate-700">
                Municipal Finance Officer
              </div>
              <div className="text-[10px] text-slate-400">Ablekuma Central Assembly</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Non-printable) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Keep this receipt as legal proof of tax compliance for 2026.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
