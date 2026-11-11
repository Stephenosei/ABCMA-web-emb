import React, { useState } from 'react';
import { X, Send, CheckCircle2, MessageSquare, Calendar } from 'lucide-react';
import { TownHallMeeting } from '../types';

interface TownHallMemoModalProps {
  meeting: TownHallMeeting | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (memoText: string) => void;
}

export const TownHallMemoModal: React.FC<TownHallMemoModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  if (!isOpen || !meeting) return null;

  const [citizenName, setCitizenName] = useState('');
  const [electoralArea, setElectoralArea] = useState('Abossey Okai');
  const [memoSubject, setMemoSubject] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    onSubmitted(memoSubject);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setCitizenName('');
    setMemoSubject('');
    setMemoContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">
                Citizen Consultation Desk
              </div>
              <h3 className="text-sm font-bold">Submit Memo to Municipal Assembly</h3>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <span className="text-slate-500 block">Hearing / Town Hall:</span>
              <strong className="text-slate-900 block">{meeting.title}</strong>
              <div className="flex items-center gap-2 text-slate-600 mt-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>{meeting.date} · {meeting.time}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwabena Mensah"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Electoral Area *</label>
                <select
                  value={electoralArea}
                  onChange={(e) => setElectoralArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Abossey Okai">Abossey Okai</option>
                  <option value="Lartebiokorshie">Lartebiokorshie</option>
                  <option value="Mataheko">Mataheko</option>
                  <option value="Sukura">Sukura</option>
                  <option value="Town Council Line">Town Council Line</option>
                  <option value="Gbortsui">Gbortsui</option>
                  <option value="Mabrouk">Mabrouk</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Memo Topic / Question *</label>
              <input
                type="text"
                required
                placeholder="e.g. Inflow drainage at spare parts market lane 4"
                value={memoSubject}
                onChange={(e) => setMemoSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Citizen Memo / Submission to Presiding Member & MCE *
              </label>
              <textarea
                rows={4}
                required
                placeholder="State your observation, proposed community solution, or specific question for the Assembly session..."
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
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
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Citizen Memo</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Citizen Memo Received</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Your memo has been submitted to the Office of the Presiding Member and Municipal Coordinating Directorate for inclusion in the official Town Hall hearing dossier.
            </p>
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
