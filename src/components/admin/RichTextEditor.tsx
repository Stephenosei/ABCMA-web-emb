import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Link as LinkIcon,
  Table as TableIcon,
  Image as ImageIcon,
  Code,
} from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';
import { escapeHtmlAttr, sanitizeHtml, sanitizeUrl } from '../../utils/security';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write structured municipal content...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    if (!htmlMode && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = sanitizeHtml(value || '');
    }
  }, [value, htmlMode]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertHtml = (snippet: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, snippet);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead>
          <tr>
            <th style="border:1px solid #cbd5e1;padding:8px;background:#f1f5f9;text-align:left;">Column 1</th>
            <th style="border:1px solid #cbd5e1;padding:8px;background:#f1f5f9;text-align:left;">Column 2</th>
            <th style="border:1px solid #cbd5e1;padding:8px;background:#f1f5f9;text-align:left;">Column 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #cbd5e1;padding:8px;">Item A</td>
            <td style="border:1px solid #cbd5e1;padding:8px;">Details</td>
            <td style="border:1px solid #cbd5e1;padding:8px;">GHS 0.00</td>
          </tr>
        </tbody>
      </table><p><br/></p>
    `;
    insertHtml(tableHtml);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    const safeLink = sanitizeUrl(linkUrl, {
      allowRelative: true,
      allowHash: true,
      allowMailtoTel: true,
    });
    if (!safeLink) {
      setLinkError('Enter a valid http(s), mailto, tel, hash, or relative URL.');
      return;
    }
    setLinkError(null);
    exec('createLink', safeLink);
    setLinkDialogOpen(false);
    setLinkUrl('https://');
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => exec('formatBlock', '<h2>')}
            disabled={htmlMode}
            title="Heading 2"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<h3>')}
            disabled={htmlMode}
            title="Heading 3"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('formatBlock', '<p>')}
            disabled={htmlMode}
            title="Paragraph"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <Pilcrow className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => exec('bold')}
            disabled={htmlMode}
            title="Bold"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            disabled={htmlMode}
            title="Italic"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            disabled={htmlMode}
            title="Underline"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <Underline className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            disabled={htmlMode}
            title="Bullet List"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            disabled={htmlMode}
            title="Numbered List"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => setLinkDialogOpen(!linkDialogOpen)}
            disabled={htmlMode}
            title="Insert Link"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            disabled={htmlMode}
            title="Insert Table"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMediaOpen(true)}
            disabled={htmlMode}
            title="Insert Image from Media Library"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer inline-flex items-center gap-1 text-xs font-medium"
          >
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Image</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (htmlMode) {
              const cleaned = sanitizeHtml(value || '');
              if (cleaned !== value) {
                onChange(cleaned);
              }
            }
            setHtmlMode(!htmlMode);
          }}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
            htmlMode
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Code className="w-3 h-3" />
          <span>{htmlMode ? 'Visual Editor' : 'HTML Source'}</span>
        </button>
      </div>

      {linkDialogOpen && !htmlMode && (
        <form
          onSubmit={handleApplyLink}
          className="px-3 py-2 bg-emerald-50 border-b border-emerald-200 space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (linkError) setLinkError(null);
              }}
              placeholder="https://example.gov.gh or /page/slug"
              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-md cursor-pointer"
            >
              Apply Link
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkDialogOpen(false);
                setLinkError(null);
              }}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          {linkError && <div className="text-[11px] font-medium text-rose-700">{linkError}</div>}
        </form>
      )}

      {/* Editable surface */}
      {htmlMode ? (
        <textarea
          rows={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 text-xs font-mono text-slate-800 bg-slate-50 focus:outline-none"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (editorRef.current) {
              onChange(editorRef.current.innerHTML);
            }
          }}
          data-placeholder={placeholder}
          className="min-h-[260px] max-h-[460px] overflow-y-auto p-4 text-sm text-slate-800 leading-relaxed focus:outline-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-emerald-700 [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2"
        />
      )}

      <MediaPickerModal
        isOpen={mediaOpen}
        acceptKind="image"
        defaultFolder="pages"
        onClose={() => setMediaOpen(false)}
        onSelect={(asset) => {
          const safeImgUrl = sanitizeUrl(asset.public_url, {
            allowRelative: true,
            allowHash: false,
            allowMailtoTel: false,
          });
          if (safeImgUrl) {
            const safeAlt = escapeHtmlAttr(asset.alt_text || asset.file_name);
            insertHtml(
              `<p><img src="${escapeHtmlAttr(safeImgUrl)}" alt="${safeAlt}" style="max-width:100%;border-radius:12px;" /></p>`
            );
          }
          setMediaOpen(false);
        }}
      />
    </div>
  );
};
