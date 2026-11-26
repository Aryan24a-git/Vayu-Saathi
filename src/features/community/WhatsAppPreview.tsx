import React from 'react';
import { Copy, ExternalLink, CheckCheck } from 'lucide-react';

interface WhatsAppPreviewProps {
  bulletinText: string;
  lang: 'en' | 'hi';
  onCopy: () => void;
}

export function WhatsAppPreview({ bulletinText, lang, onCopy }: WhatsAppPreviewProps) {
  return (
    <>
      <div className="wa-bg rounded-2xl p-3.5 border border-stone-200/90">
        <div className="bg-[#E7FFDB] text-slate-900 rounded-xl rounded-tl-none p-3.5 shadow-sm max-w-full relative">
          <pre
            lang={lang}
            className="font-sans text-xs sm:text-[13px] whitespace-pre-wrap leading-relaxed text-slate-800"
          >
            {bulletinText}
          </pre>
          <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-500">
            <span>08:00 AM</span>
            <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs sm:text-sm font-semibold border border-stone-200 transition"
        >
          <Copy className="w-4 h-4" />
          <span>Copy Text</span>
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(bulletinText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-semibold shadow-sm transition"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open in WhatsApp</span>
        </a>
      </div>
    </>
  );
}
