import React, { useState } from 'react';
import { X, CheckCircle, Upload, FileText, ArrowRight, ShieldAlert, Calendar } from 'lucide-react';
import { MunicipalService } from '../types';

interface ServiceApplicationModalProps {
  service: MunicipalService | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (trackingCode: string, serviceTitle: string) => void;
}

export const ServiceApplicationModal: React.FC<ServiceApplicationModalProps> = ({
  service,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  if (!isOpen || !service) return null;

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    applicantName: '',
    phone: '',
    email: '',
    ghanaCard: '',
    electoralArea: 'Abossey Okai',
    digitalAddress: '',
    businessOrProjectName: '',
    description: '',
    hasUploadedDocs: false,
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const electoralAreas = [
    'Abossey Okai',
    'Lartebiokorshie',
    'Mataheko',
    'Gbortsui',
    'Sukura',
    'Town Council Line',
    'Mabrouk',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const prefix = service.id === 'srv-bop' ? 'ACMA-BOP' : service.id === 'srv-building-permit' ? 'ACMA-DEV' : service.id === 'srv-marriage' ? 'ACMA-MAR' : 'ACMA-SRV';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const code = `${prefix}-2026-${randomNum}`;

      setGeneratedCode(code);
      setIsSubmitting(false);
      setStep('success');
      onSubmitted(code, service.title);
    }, 600);
  };

  const handleReset = () => {
    setStep('form');
    setFormData({
      applicantName: '',
      phone: '',
      email: '',
      ghanaCard: '',
      electoralArea: 'Abossey Okai',
      digitalAddress: '',
      businessOrProjectName: '',
      description: '',
      hasUploadedDocs: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs text-emerald-400 font-medium">ACMA Electronic Services Desk</div>
            <h3 className="text-lg font-bold tracking-tight">{service.title}</h3>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong>Statutory Timeline:</strong> {service.processingTime} · <strong>Administered by:</strong> {service.department}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name of Applicant / Entity Representative *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National ID (Ghana Card Number) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="GHA-XXXXXXXXX-X"
                  value={formData.ghanaCard}
                  onChange={(e) => setFormData({ ...formData, ghanaCard: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (for SMS Alerts) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="024 XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="citizen@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Electoral Area in Ablekuma Central *
                </label>
                <select
                  value={formData.electoralArea}
                  onChange={(e) => setFormData({ ...formData, electoralArea: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {electoralAreas.map((area) => (
                    <option key={area} value={area}>
                      {area} Electoral Area
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GhanaPost GPS Digital Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GA-142-9981"
                  value={formData.digitalAddress}
                  onChange={(e) => setFormData({ ...formData, digitalAddress: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business, Trade or Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. K. Boakye Auto Spares / Residential 2-Storey / Wedding Registry"
                value={formData.businessOrProjectName}
                onChange={(e) => setFormData({ ...formData, businessOrProjectName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Request Details & Premises Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide street landmarks, building dimensions, or specific permit scope..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Document Upload Simulator */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Mandatory Supporting Documentation (PDF, PNG, JPG)
              </label>
              <div
                onClick={() => setFormData({ ...formData, hasUploadedDocs: true })}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  formData.hasUploadedDocs
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                {formData.hasUploadedDocs ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Documents attached: SitePlan_Drawings_GhanaCard.pdf (3.4 MB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700">Click to attach required files</span>
                    <span className="text-[11px] text-slate-400">RGD registration / Architectural drawings / Land deed</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Submission...</span>
                ) : (
                  <>
                    <span>Submit Official Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h4 className="text-xl font-bold text-slate-900">Application Lodged Successfully!</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your application for <strong>{service.title}</strong> has been received by the Ablekuma Central Municipal Assembly {service.department}.
            </p>

            <div className="bg-slate-100 p-4 rounded-xl max-w-sm mx-auto text-center border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Your Official ACMA Tracking Code</span>
              <span className="text-lg font-mono font-bold text-emerald-900 tracking-wider">
                {generatedCode}
              </span>
            </div>

            <div className="text-xs text-slate-500 max-w-md mx-auto">
              An SMS confirmation has been dispatched to <strong>{formData.phone}</strong>. A municipal field officer will schedule physical verification within {service.processingTime}.
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done / Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
