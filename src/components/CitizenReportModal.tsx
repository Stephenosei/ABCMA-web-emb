import React, { useState } from 'react';
import { X, AlertTriangle, Upload, CheckCircle2, ArrowRight, Camera } from 'lucide-react';
import { CitizenIssue, IssueCategory } from '../types';

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueReported: (newIssue: CitizenIssue) => void;
}

export const CitizenReportModal: React.FC<CitizenReportModalProps> = ({
  isOpen,
  onClose,
  onIssueReported,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    category: 'choked_drain' as IssueCategory,
    electoralArea: 'Abossey Okai',
    landmark: '',
    title: '',
    description: '',
    reportedBy: '',
    contactPhone: '',
    hasPhoto: false,
  });
  const [generatedTicket, setGeneratedTicket] = useState<CitizenIssue | null>(null);

  const electoralAreas = [
    'Abossey Okai',
    'Lartebiokorshie',
    'Mataheko',
    'Gbortsui',
    'Sukura',
    'Town Council Line',
    'Mabrouk',
  ];

  const categories = [
    { id: 'choked_drain', label: 'Choked Storm Drain / Flood Risk' },
    { id: 'pothole_road', label: 'Potholes & Broken Road Pavement' },
    { id: 'refuse_dump', label: 'Illegal Refuse Dump / Plastic Waste' },
    { id: 'broken_streetlight', label: 'Faulty / Non-functional Streetlight' },
    { id: 'noise_pollution', label: 'Noise Pollution / Unauthorized Night Event' },
    { id: 'health_hazard', label: 'Public Health / Food Safety Hazard' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `REP-2026-${randomNum}`;

    let departmentAssigned = 'Works Directorate & Waste Management';
    if (formData.category === 'broken_streetlight') departmentAssigned = 'Urban Roads & Electrical Engineering Unit';
    if (formData.category === 'pothole_road') departmentAssigned = 'Department of Urban Roads';
    if (formData.category === 'refuse_dump' || formData.category === 'health_hazard') {
      departmentAssigned = 'Environmental Health & Sanitation Taskforce';
    }

    const newIssue: CitizenIssue = {
      id: `iss-${Date.now()}`,
      trackingCode,
      category: formData.category,
      title: formData.title || `${formData.category.replace('_', ' ')} incident in ${formData.electoralArea}`,
      description: formData.description,
      electoralArea: formData.electoralArea,
      landmark: formData.landmark,
      reportedBy: formData.reportedBy,
      contactPhone: formData.contactPhone,
      status: 'submitted',
      dateReported: new Date().toISOString().split('T')[0],
      departmentAssigned,
      resolutionNotes: 'Citizen report acknowledged by ACMA Client Service Desk. Assigned to field inspection team.',
      lastUpdated: 'Just now',
    };

    setGeneratedTicket(newIssue);
    onIssueReported(newIssue);
    setStep('success');
  };

  const handleReset = () => {
    setStep('form');
    setFormData({
      category: 'choked_drain',
      electoralArea: 'Abossey Okai',
      landmark: '',
      title: '',
      description: '',
      reportedBy: '',
      contactPhone: '',
      hasPhoto: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[11px] text-amber-400 font-semibold tracking-wider uppercase">
                Citizen Reporting Desk
              </div>
              <h3 className="text-base font-bold">Report Community Fault or Hazard</h3>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category of Issue / Fault *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Electoral Area *
                </label>
                <select
                  value={formData.electoralArea}
                  onChange={(e) => setFormData({ ...formData, electoralArea: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {electoralAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nearest Landmark / Street Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Flamingo Junction, Goil Station"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brief Subject / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Deep crater near school crossing on Link Road"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description of the Hazard *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe the severity, how long it has persisted, and any immediate risks to pedestrians or vehicles..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Photo Attachment Simulator */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Photo Evidence (Optional but recommended)
              </label>
              <div
                onClick={() => setFormData({ ...formData, hasPhoto: true })}
                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                  formData.hasPhoto
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                {formData.hasPhoto ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Photo attached: ACMA_site_evidence_001.jpg (1.8 MB)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                    <Camera className="w-4 h-4" />
                    <span>Click to attach photo from device camera or gallery</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Mensah"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Mobile Phone (for SMS updates) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="024 XXX XXXX"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Dispatch Report to Municipal Engineers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h4 className="text-xl font-bold text-slate-900">Incident Ticket Dispatched</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Thank you for keeping Ablekuma Central safe and clean. Your report has been registered in the Municipal Works system.
            </p>

            <div className="bg-slate-100 p-4 rounded-xl max-w-xs mx-auto border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Incident Tracking Code</span>
              <span className="font-mono font-bold text-lg text-emerald-900">
                {generatedTicket?.trackingCode}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Assigned to: <strong>{generatedTicket?.departmentAssigned}</strong>. You can track ongoing progress in the Community Feed or with the header tracking tool.
            </p>

            <div className="pt-2">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Return to Community Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
