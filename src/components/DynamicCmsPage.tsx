import React from 'react';
import { ArrowLeft, Calendar, Download, FileText, Globe } from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface DynamicCmsPageProps {
  slug: string;
  onNavigate: (page: string) => void;
}

export const DynamicCmsPage: React.FC<DynamicCmsPageProps> = ({ slug, onNavigate }) => {
  const { pages, loading } = useCms();
  const page = pages.find((p) => p.slug === slug);

  if (loading && !page) {
    return (
      <section className="py-16 min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl px-6 py-5 text-xs font-semibold text-slate-600 shadow-sm">
          Loading official ABCMA page...
        </div>
      </section>
    );
  }

  if (!page) {
    return (
      <section className="py-16 min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-lg">
          <Globe className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900">Page Not Available</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              The requested page (<span className="font-mono">/page/{slug}</span>) is either unpublished or does not exist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>
      </section>
    );
  }

  const publishedDate = page.published_at || page.updated_at;

  return (
    <section className="py-10 lg:py-14 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-emerald-800 transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate">{page.title}</span>
        </nav>

        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/85 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <article className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl">
          {page.featured_image_url && (
            <div className="relative h-60 sm:h-72 bg-slate-900 overflow-hidden">
              <img
                src={page.featured_image_url}
                alt={page.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Published{' '}
                  {new Date(publishedDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif-civic leading-snug">
                {page.title}
              </h1>
              {page.summary && (
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {page.summary}
                </p>
              )}
            </div>

            <div
              className="text-sm sm:text-base text-slate-700 leading-relaxed space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-emerald-800 [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2.5 [&_th]:text-left [&_th]:text-xs [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:text-xs [&_img]:rounded-xl [&_img]:my-4 [&_img]:max-w-full"
              dangerouslySetInnerHTML={{ __html: page.content_html || '' }}
            />

            {Array.isArray(page.attachments) && page.attachments.length > 0 && (
              <div className="pt-6 border-t border-slate-200 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Official Attachments & Downloads</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {page.attachments.map((att, idx) => (
                    <a
                      key={`${att.url}-${idx}`}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.name}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{att.name}</div>
                        {att.size && (
                          <div className="text-[11px] font-mono text-slate-500">{att.size}</div>
                        )}
                      </div>
                      <Download className="w-4 h-4 text-emerald-700 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
};
