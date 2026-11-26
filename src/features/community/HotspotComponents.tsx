import React from 'react';
import { Megaphone, MapPin, ArrowBigUp, PlusCircle } from 'lucide-react';
import type { HotspotReport } from './hotspotTypes';

interface HotspotFormProps {
  category: HotspotReport['category'];
  setCategory: (cat: HotspotReport['category']) => void;
  locality: string;
  setLocality: (loc: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function HotspotForm({
  category,
  setCategory,
  locality,
  setLocality,
  description,
  setDescription,
  onSubmit,
}: HotspotFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="lg:col-span-4 bg-stone-50 rounded-2xl border border-stone-200/90 p-4 space-y-3 h-fit"
    >
      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
        <PlusCircle className="w-4 h-4 text-teal-700" />
        <span>Report Local Hotspot</span>
      </h4>

      <div>
        <label htmlFor="hotspot-cat" className="block text-xs font-semibold text-slate-700 mb-1">
          Issue Category
        </label>
        <select
          id="hotspot-cat"
          value={category}
          onChange={(e) => setCategory(e.target.value as HotspotReport['category'])}
          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
        >
          <option value="Open Waste Burning">Open Waste / Leaf Burning</option>
          <option value="Uncovered Construction Dust">Uncovered Construction Dust</option>
          <option value="Traffic Choke Point">Severe Traffic Choke / Idling</option>
        </select>
      </div>

      <div>
        <label htmlFor="hotspot-loc" className="block text-xs font-semibold text-slate-700 mb-1">
          Locality / Landmark
        </label>
        <input
          id="hotspot-loc"
          type="text"
          required
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="e.g. Sector 18 Metro Gate 2"
          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      <div>
        <label htmlFor="hotspot-desc" className="block text-xs font-semibold text-slate-700 mb-1">
          Brief Note
        </label>
        <textarea
          id="hotspot-desc"
          rows={2}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dry leaves being burned near park boundary wall..."
          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
      >
        <Megaphone className="w-3.5 h-3.5" />
        <span>Post to Ward Pinboard</span>
      </button>
    </form>
  );
}

function getCatStyle(cat: HotspotReport['category']) {
  if (cat === 'Open Waste Burning') return 'bg-rose-50 text-rose-800 border-rose-200';
  if (cat === 'Uncovered Construction Dust') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-indigo-50 text-indigo-800 border-indigo-200';
}

interface HotspotCardProps {
  item: HotspotReport;
  isUpvoted: boolean;
  onToggleUpvote: (id: string) => void;
}

export function HotspotCard({ item, isUpvoted, onToggleUpvote }: HotspotCardProps) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-col justify-between gap-3 hover:border-stone-300 transition">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCatStyle(item.category)}`}
            >
              {item.category}
            </span>
            {item.isSample && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Sample
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-600 font-medium">{item.timeAgo}</span>
        </div>
        <h5 className="font-bold text-sm text-slate-900">{item.locality}</h5>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-teal-700" /> {item.city}
        </span>
        <button
          type="button"
          onClick={() => onToggleUpvote(item.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
            isUpvoted
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-stone-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-stone-200'
          }`}
        >
          <ArrowBigUp className="w-3.5 h-3.5" />
          <span>{item.upvotes}</span>
        </button>
      </div>
    </article>
  );
}
