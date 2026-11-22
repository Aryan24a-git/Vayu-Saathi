// Satisfies: REQ-011, SEC-004, D5, A11Y-004
'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

export function FollowUpChat() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ q: string; a: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = question.trim();
    if (!clean || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { q: clean, a: data.answer || 'No answer available.' }]);
      setQuestion('');
    } catch {
      setMessages((prev) => [
        ...prev,
        { q: clean, a: 'Service temporarily unavailable. Please try again later.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="chat-heading" className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <div>
          <h2 id="chat-heading" className="text-base font-bold text-slate-900">Ask Clear Air Companion</h2>
          <p className="text-xs text-slate-500">Ask questions about smog precautions, masks, ventilation, or your plan.</p>
        </div>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div key={idx} className="space-y-1 text-xs">
            <p className="font-semibold text-slate-800">You: {m.q}</p>
            <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
              {m.a}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="followup-input" className="sr-only">Ask a question</label>
        <input
          id="followup-input"
          type="text"
          placeholder="e.g. Can I open windows during cooking?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-3 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Ask</span>
        </button>
      </form>
    </section>
  );
}
