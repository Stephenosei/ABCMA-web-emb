import React from 'react';
import { Eye, X, ExternalLink } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  htmlContent?: string;
  paragraphs?: string[];
  metaTags?: { label: string; value: string }[];
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  title,
  subtitle,
  imageUrl,
  htmlContent,
  paragraphs,
  metaTags,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <span>Public Portal Live Preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {imageUrl && (
            <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={imageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            {subtitle && (
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                {subtitle}
              </div>
            )}
            <h2 className="text-2xl font-bold text-slate-900 font-serif-civic leading-snug">
              {title || 'Untitled Content'}
            </h2>
          </div>

          {metaTags && metaTags.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              {metaTags.map((tag, idx) => (
                <div key={idx}>
                  <span className="text-slate-500 block text-[11px]">{tag.label}</span>
                  <span className="font-semibold text-slate-900 break-words">{tag.value}</span>
                </div>
              ))}
            </div>
          )}

          {htmlContent && (
            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_a]:text-emerald-700 [&_a]:underline [&_img]:rounded-xl [&_img]:max-h-80 [&_img]:my-3"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}

          {paragraphs && paragraphs.length > 0 && (
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Preview reflects how citizens will view this item once published.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
