import React, { useState } from 'react';
import { X, Smartphone, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { BillRecord, PaymentMethod, PaymentTransaction } from '../types';

interface PaymentGatewayModalProps {
  bill: BillRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transaction: PaymentTransaction, updatedBill: BillRecord) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  bill,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  if (!isOpen || !bill) return null;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [phone, setPhone] = useState(bill.phone || '024');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(bill.balanceGHS);

  const [paymentState, setPaymentState] = useState<'idle' | 'authorizing' | 'success'>('idle');
  const [authCountdown, setAuthCountdown] = useState(3);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentState('authorizing');

    // Simulate USSD push prompt on phone / 3D secure
    setTimeout(() => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const randomReceiptSeq = Math.floor(10000 + Math.random() * 90000);
      const receiptNo = `ACMA-REC-2026-${randomReceiptSeq}`;
      const ref = `GH-TXN-${Date.now()}`;

      const transaction: PaymentTransaction = {
        receiptNumber: receiptNo,
        billNumber: bill.billNumber,
        taxpayerName: bill.taxpayerName,
        billType: bill.type,
        amountPaidGHS: customAmount,
        paymentMethod: paymentMethod,
        phoneNumberOrCard: paymentMethod === 'card_ghlink' ? `**** **** ${cardNumber.slice(-4) || '8821'}` : phone,
        timestamp: formattedDate,
        referenceId: ref,
        status: 'successful',
        qrCodeToken: `https://acma.gov.gh/verify/${receiptNo}`,
      };

      const newAmountPaid = bill.amountPaidGHS + customAmount;
      const newBalance = Math.max(0, bill.amountDueGHS - newAmountPaid);
      const updatedBill: BillRecord = {
        ...bill,
        amountPaidGHS: newAmountPaid,
        balanceGHS: newBalance,
        status: newBalance === 0 ? 'paid' : 'partial',
        lastPaymentDate: formattedDate,
        receiptNumber: receiptNo,
      };

      setPaymentState('success');
      onPaymentSuccess(transaction, updatedBill);
    }, 1500);
  };

  const handleClose = () => {
    setPaymentState('idle');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">
                ACMA Secure Revenue Gateway
              </div>
              <h3 className="text-sm sm:text-base font-bold">Pay Municipal Rate</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentState === 'idle' && (
          <form onSubmit={handlePay} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Bill Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill Number:</span>
                <span className="font-mono font-bold text-slate-900">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ratepayer:</span>
                <span className="font-semibold text-slate-900">{bill.taxpayerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Electoral Area:</span>
                <span className="text-slate-700">{bill.electoralArea}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold text-sm">
                <span className="text-slate-800">Outstanding Balance:</span>
                <span className="font-mono text-emerald-900 tabular-nums">
                  GHS {bill.balanceGHS.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount (GHS)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">GHS</span>
                <input
                  type="number"
                  min={1}
                  max={bill.balanceGHS}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full pl-12 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Ghana Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mtn_momo')}
                  className={`p-2.5 border rounded-xl text-left transition-all cursor-pointer ${
                    paymentMethod === 'mtn_momo'
                      ? 'border-amber-500 bg-amber-50 text-slate-900 ring-1 ring-amber-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold">MTN MoMo</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">*170# Instant Prompt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('telecel_cash')}
                  className={`p-2.5 border rounded-xl text-left transition-all cursor-pointer ${
                    paymentMethod === 'telecel_cash'
                      ? 'border-red-500 bg-red-50 text-slate-900 ring-1 ring-red-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold">Telecel Cash</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">*110# Prompt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('at_money')}
                  className={`p-2.5 border rounded-xl text-left transition-all cursor-pointer ${
                    paymentMethod === 'at_money'
                      ? 'border-blue-500 bg-blue-50 text-slate-900 ring-1 ring-blue-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold">AT Money</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">AirtelTigo Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card_ghlink')}
                  className={`p-2.5 border rounded-xl text-left transition-all cursor-pointer ${
                    paymentMethod === 'card_ghlink'
                      ? 'border-emerald-600 bg-emerald-50 text-slate-900 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold">GhQR / Card</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Visa, MC, GH-Link</span>
                </button>
              </div>
            </div>

            {/* Mobile Money Input */}
            {paymentMethod !== 'card_ghlink' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Money Wallet Number (024, 054, 020, 027, etc.) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="024 XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  You will receive an automatic prompt on this phone to enter your 4-digit MoMo PIN.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="4123 4567 8901 2345"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expiry (MM/YY) *
                    </label>
                    <input
                      type="text"
                      placeholder="08/28"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CVV *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Authorize & Pay GHS {customAmount.toFixed(2)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {paymentState === 'authorizing' && (
          <div className="p-10 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto" />
            <h4 className="text-lg font-bold text-slate-900">Push Notification Sent</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Please check your phone <strong>{phone}</strong> and approve the prompt of <strong>GHS {customAmount.toFixed(2)}</strong> from <em>Ablekuma Central Assembly</em>.
            </p>
            <div className="text-[11px] text-slate-400 animate-pulse">
              Awaiting Ghana Interbank Payment & Settlement Systems (GhIPSS) authorization...
            </div>
          </div>
        )}

        {paymentState === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              GHS {customAmount.toFixed(2)} has been credited to the ACMA Municipal Revenue Account. Your official digital receipt has been generated.
            </p>
            <div className="pt-2">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
              >
                View Official Digital Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
