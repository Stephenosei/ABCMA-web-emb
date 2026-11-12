import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle,
  AlertCircle,
  Calculator,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Building,
  Store,
  HelpCircle,
  Filter
} from 'lucide-react';
import { BillRecord } from '../types';
import { Pagination } from './Pagination';

interface BillingSectionProps {
  bills: BillRecord[];
  onOpenPaymentGateway: (bill: BillRecord) => void;
  onViewReceipt: (bill: BillRecord) => void;
}

export const BillingSection: React.FC<BillingSectionProps> = ({
  bills,
  onOpenPaymentGateway,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('PROP-2026-4019');
  const [searchedBill, setSearchedBill] = useState<BillRecord | null>(
    bills.find((b) => b.billNumber === 'PROP-2026-4019') || bills[0]
  );
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Fee Calculator state
  const [calculatorTab, setCalculatorTab] = useState<'property' | 'bop'>('property');

  // Property Rate estimator
  const [calcPropertyClass, setCalcPropertyClass] = useState<'res_1st' | 'res_2nd' | 'commercial' | 'industrial'>('commercial');
  const [calcZone, setCalcZone] = useState('Abossey Okai');
  const [calcPropertyValue, setCalcPropertyValue] = useState<number>(450000);

  // BOP estimator
  const [calcBusinessType, setCalcBusinessType] = useState('spare_parts_wholesale');
  const [calcEmployees, setCalcEmployees] = useState('4_10');

  // Bill Registry Browse & Pagination state
  const [billTypeFilter, setBillTypeFilter] = useState<'all' | 'property_rate' | 'business_operating_permit' | 'market_toll'>('all');
  const [billStatusFilter, setBillStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [currentBillPage, setCurrentBillPage] = useState(1);
  const BILLS_PER_PAGE = 4;

  useEffect(() => {
    setCurrentBillPage(1);
  }, [billTypeFilter, billStatusFilter]);

  const filteredBills = bills.filter((b) => {
    const matchType = billTypeFilter === 'all' || b.type === billTypeFilter;
    const matchStatus = billStatusFilter === 'all' || b.status === billStatusFilter;
    return matchType && matchStatus;
  });

  const totalBillPages = Math.ceil(filteredBills.length / BILLS_PER_PAGE) || 1;
  const paginatedBills = filteredBills.slice(
    (currentBillPage - 1) * BILLS_PER_PAGE,
    currentBillPage * BILLS_PER_PAGE
  );

  const handleSelectBillFromList = (bill: BillRecord) => {
    setSearchedBill(bill);
    setSearchQuery(bill.billNumber);
    setSearchFeedback(null);
    const elem = document.getElementById('billing');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = (queryToUse?: string) => {
    const term = (queryToUse || searchQuery).trim().toLowerCase();
    if (!term) return;

    const match = bills.find(
      (b) =>
        b.billNumber.toLowerCase().includes(term) ||
        b.ghanaCardOrTin.toLowerCase().includes(term) ||
        b.phone.includes(term) ||
        b.taxpayerName.toLowerCase().includes(term)
    );

    if (match) {
      setSearchedBill(match);
      setSearchFeedback(null);
    } else {
      setSearchFeedback(`No municipal bill record found matching "${term}". Try one of the sample references below.`);
    }
  };

  // Property calculation math based on ACMA 2026 Fee-Fixing Resolution
  const calculatePropertyRate = () => {
    let rateImpost = 0.0018; // default
    if (calcPropertyClass === 'res_1st') rateImpost = 0.0022;
    if (calcPropertyClass === 'res_2nd') rateImpost = 0.0015;
    if (calcPropertyClass === 'commercial') rateImpost = 0.0035;
    if (calcPropertyClass === 'industrial') rateImpost = 0.0042;

    const baseRate = calcPropertyValue * rateImpost;
    const sanitationLevy = baseRate * 0.08;
    const total = baseRate + sanitationLevy;
    return { baseRate, sanitationLevy, total };
  };

  // BOP calculation math
  const calculateBopFee = () => {
    let base = 500;
    if (calcBusinessType === 'spare_parts_wholesale') base = 950;
    if (calcBusinessType === 'retail_shop') base = 350;
    if (calcBusinessType === 'pharmacy') base = 650;
    if (calcBusinessType === 'restaurant_chopbar') base = 450;
    if (calcBusinessType === 'financial_agent') base = 750;
    if (calcBusinessType === 'artisan_workshop') base = 250;

    let multiplier = 1.0;
    if (calcEmployees === '1_3') multiplier = 1.0;
    if (calcEmployees === '4_10') multiplier = 1.35;
    if (calcEmployees === '11_50') multiplier = 1.8;
    if (calcEmployees === '50_plus') multiplier = 2.5;

    return Math.round(base * multiplier);
  };

  const propEstimate = calculatePropertyRate();
  const bopEstimate = calculateBopFee();

  return (
    <section id="billing" className="py-12 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5">
            Finance & Revenue Mobilization
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Municipal Rates, Bills & Online Settlement Center
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Settle your Property Rates, Business Operating Permits (BOP), and Market Tolls securely via Mobile Money (MTN, Telecel, AT) or Bank Card with instant official e-receipts.
          </p>
        </div>

        {/* 2-Column Split: Bill Search & Payment Card (Left) + Rate Calculator (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Bill Lookup & Settlement (7 Cols) */}
          <div className="lg:col-span-7 bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Search & Pay Rate Notice
                </h3>
                <span className="text-xs text-slate-500 font-mono">2026 Fiscal Year</span>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Enter your Bill Reference Number (e.g. PROP-2026-4019), Ghana Card ID, or registered mobile phone number.
              </p>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter Bill No. (e.g. PROP-2026-4019) or Ghana Card..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Verify Bill
                </button>
              </div>

              {/* Quick sample bills buttons for instant tester access */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-slate-500">
                <span>Quick demo records:</span>
                <button
                  onClick={() => {
                    setSearchQuery('PROP-2026-4019');
                    handleSearch('PROP-2026-4019');
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px] cursor-pointer"
                >
                  PROP-2026-4019
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('BOP-2026-8812');
                    handleSearch('BOP-2026-8812');
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px] cursor-pointer"
                >
                  BOP-2026-8812
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('MKT-2026-0314');
                    handleSearch('MKT-2026-0314');
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px] cursor-pointer"
                >
                  MKT-2026-0314
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('PROP-2026-1044');
                    handleSearch('PROP-2026-1044');
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-emerald-800 rounded font-mono text-[11px] cursor-pointer"
                >
                  Paid Receipt (1044)
                </button>
              </div>

              {searchFeedback && (
                <div className="mt-3 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{searchFeedback}</span>
                </div>
              )}
            </div>

            {/* Bill Result Details Card */}
            {searchedBill && (
              <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-400 font-mono uppercase block">
                      {searchedBill.period}
                    </span>
                    <h4 className="text-sm font-bold">{searchedBill.title}</h4>
                  </div>
                  <div>
                    {searchedBill.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-900 text-emerald-300 border border-emerald-700 rounded text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Fully Settled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-900/60 text-amber-300 border border-amber-700 rounded text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Payment Due</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Ratepayer / Business Name:</span>
                      <strong className="text-slate-900 text-sm block">{searchedBill.taxpayerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ghana Card / TIN:</span>
                      <span className="font-mono text-slate-800 font-medium">{searchedBill.ghanaCardOrTin}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Electoral Area:</span>
                      <span className="text-slate-800 font-medium">{searchedBill.electoralArea}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Property / Stall Location:</span>
                      <span className="text-slate-800">{searchedBill.propertyAddressOrStore}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-slate-200 text-center font-mono">
                    <div>
                      <span className="text-[11px] text-slate-500 block font-sans">Total Assessed</span>
                      <span className="font-bold text-slate-800 text-sm tabular-nums">
                        GHS {searchedBill.amountDueGHS.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-sans">Amount Settled</span>
                      <span className="font-bold text-emerald-800 text-sm tabular-nums">
                        GHS {searchedBill.amountPaidGHS.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-sans">Current Balance</span>
                      <span className="font-bold text-amber-900 text-sm tabular-nums">
                        GHS {searchedBill.balanceGHS.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    {searchedBill.status === 'paid' ? (
                      <button
                        onClick={() => onViewReceipt(searchedBill)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 text-amber-300" />
                        <span>View & Print Official e-Receipt ({searchedBill.receiptNumber})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenPaymentGateway(searchedBill)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-amber-300" />
                        <span>Pay GHS {searchedBill.balanceGHS.toFixed(2)} via MoMo or Card</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Rate & Fee Calculator (5 Cols) */}
          <div className="lg:col-span-5 bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900">
                  Rate & Fee Estimator
                </h3>
              </div>
              <span className="text-xs text-slate-500">Gazetted 2026</span>
            </div>

            {/* Segmented Tab: Property vs BOP */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setCalculatorTab('property')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  calculatorTab === 'property'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Property Rate
              </button>
              <button
                onClick={() => setCalculatorTab('bop')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  calculatorTab === 'bop'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Business Permit (BOP)
              </button>
            </div>

            {calculatorTab === 'property' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Electoral Area / Rating Zone
                  </label>
                  <select
                    value={calcZone}
                    onChange={(e) => setCalcZone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Abossey Okai">Abossey Okai (Commercial Core)</option>
                    <option value="Lartebiokorshie">Lartebiokorshie (Class A Residential/Civic)</option>
                    <option value="Mataheko">Mataheko (Mixed Residential/Commercial)</option>
                    <option value="Town Council Line">Town Council Line (Commercial/Market)</option>
                    <option value="Sukura">Sukura (Class B Residential)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Property Classification
                  </label>
                  <select
                    value={calcPropertyClass}
                    onChange={(e) => setCalcPropertyClass(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="res_1st">1st Class Residential (Bungalows, Multi-Storey Homes)</option>
                    <option value="res_2nd">2nd Class Residential (Compound Houses, Apartments)</option>
                    <option value="commercial">Commercial Premises (Stores, Offices, Warehouses)</option>
                    <option value="industrial">Light Industrial / Workshops / Fuel Stations</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">
                      Estimated Valuation (Ghana Cedis)
                    </label>
                    <span className="font-mono font-bold text-slate-900">
                      GHS {calcPropertyValue.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={2500000}
                    step={25000}
                    value={calcPropertyValue}
                    onChange={(e) => setCalcPropertyValue(Number(e.target.value))}
                    className="w-full accent-emerald-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>GHS 50,000</span>
                    <span>GHS 1,250,000</span>
                    <span>GHS 2,500,000</span>
                  </div>
                </div>

                {/* Calculation Output Box */}
                <div className="bg-emerald-950 text-white p-4 rounded-xl space-y-2 mt-4 font-mono">
                  <div className="flex justify-between text-xs text-emerald-300 font-sans">
                    <span>Base Statutory Impost:</span>
                    <span className="tabular-nums">GHS {propEstimate.baseRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-300 font-sans">
                    <span>Sanitation & Fire Levy (8%):</span>
                    <span className="tabular-nums">GHS {propEstimate.sanitationLevy.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-800 flex justify-between items-baseline font-bold">
                    <span className="text-xs font-sans text-white">Estimated Annual Rate:</span>
                    <span className="text-xl text-amber-300 tabular-nums">
                      GHS {propEstimate.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Sector & Trade Category
                  </label>
                  <select
                    value={calcBusinessType}
                    onChange={(e) => setCalcBusinessType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="spare_parts_wholesale">Auto Spare Parts Importer / Wholesaler</option>
                    <option value="retail_shop">Retail Shop / General Provision Store</option>
                    <option value="pharmacy">Pharmacy, Drug Store & Diagnostic Lab</option>
                    <option value="restaurant_chopbar">Restaurant, Chop Bar & Food Joint</option>
                    <option value="financial_agent">Mobile Money Merchant / Micro-Finance Agent</option>
                    <option value="artisan_workshop">Automotive Repair, Welding & Vulcanizing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff / Employee Headcount
                  </label>
                  <select
                    value={calcEmployees}
                    onChange={(e) => setCalcEmployees(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="1_3">1 - 3 Employees (Micro-Enterprise)</option>
                    <option value="4_10">4 - 10 Employees (Small Business)</option>
                    <option value="11_50">11 - 50 Employees (Medium Business)</option>
                    <option value="50_plus">50+ Employees (Large Commercial Entity)</option>
                  </select>
                </div>

                {/* BOP Output */}
                <div className="bg-emerald-950 text-white p-4 rounded-xl space-y-2 mt-6 font-mono">
                  <div className="text-xs text-emerald-300 font-sans">
                    Statutory Category: <strong>Class A Licensed Operator</strong>
                  </div>
                  <div className="pt-2 border-t border-emerald-800 flex justify-between items-baseline font-bold">
                    <span className="text-xs font-sans text-white">Estimated Annual BOP:</span>
                    <span className="text-xl text-amber-300 tabular-nums">
                      GHS {bopEstimate.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500 leading-tight">
              *Estimates are calculated per the approved ACMA 2026 Fee-Fixing Resolution gazetted under the Local Governance Act 2016 (Act 936).
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. MUNICIPAL BILL REGISTRY & RATE NOTICES DIRECTORY (WITH PAGINATION)
            ========================================================================= */}
        <div className="mt-14 bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Statutory Rate Assessments Directory</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Browse Municipal Rate Notices & Commercial Assessments
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Don't have your bill reference? Select your property, business or market toll from the active municipal register to settle or view official receipts.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                {[
                  { id: 'all', label: 'All Bills' },
                  { id: 'property_rate', label: 'Property Rates' },
                  { id: 'business_operating_permit', label: 'BOP' },
                  { id: 'market_toll', label: 'Market Tolls' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setBillTypeFilter(tf.id as any)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      billTypeFilter === tf.id
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <select
                value={billStatusFilter}
                onChange={(e) => setBillStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
              >
                <option value="all">All Statuses</option>
                <option value="unpaid">Unpaid Only</option>
                <option value="paid">Settled / Paid</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredBills.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Rate Records Match Filter</h4>
              <p className="text-xs text-slate-500">
                Try selecting "All Bills" or "All Statuses" to display records.
              </p>
              <button
                onClick={() => {
                  setBillTypeFilter('all');
                  setBillStatusFilter('all');
                }}
                className="px-3.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedBills.map((b) => (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    searchedBill?.id === b.id
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                        {b.billNumber}
                      </span>
                      {b.status === 'paid' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Settled</span>
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Payment Due</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {b.title}
                    </h4>
                    <div className="text-xs text-slate-600 mt-1">
                      Taxpayer: <strong className="text-slate-800">{b.taxpayerName}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {b.propertyAddressOrStore} · {b.electoralArea}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-sans">Amount Due:</span>
                      <span className="text-sm font-bold text-slate-900">
                        GHS {b.amountDueGHS.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSelectBillFromList(b)}
                      className="text-xs text-slate-700 hover:text-emerald-900 font-semibold cursor-pointer"
                    >
                      Inspect in Calculator ↑
                    </button>

                    {b.status === 'paid' ? (
                      <button
                        onClick={() => onViewReceipt(b)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>e-Receipt</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenPaymentGateway(b)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay GHS {b.balanceGHS.toFixed(2)}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredBills.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={currentBillPage}
                totalPages={totalBillPages}
                totalItems={filteredBills.length}
                itemsPerPage={BILLS_PER_PAGE}
                onPageChange={setCurrentBillPage}
                itemName="rate notices"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
