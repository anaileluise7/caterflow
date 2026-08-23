import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2 } from "lucide-react";

const ITEMS = [
  "Linens",
  "Glassware",
  "Serveware",
  "China & Plates",
  "Cutlery",
  "Tables & Chairs",
  "Bar Equipment",
  "Chafing Dishes",
  "Serving Trays",
  "Audio / Visual",
];

export default function EquipmentChecklist({ inquiry, onUpdated }) {
  const selected = new Set(inquiry.equipment || []);
  const [pending, setPending] = useState(null);

  const toggle = async (item) => {
    const next = new Set(selected);
    if (next.has(item)) next.delete(item); else next.add(item);
    setPending(item);
    try {
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, { equipment: [...next] });
      onUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(null);
    }
  };

  const done = selected.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Equipment Checklist</h3>
        <span className="text-xs text-zinc-500">{done}/{ITEMS.length} ready</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ITEMS.map(item => {
          const checked = selected.has(item);
          const isPending = pending === item;
          return (
            <button
              key={item}
              onClick={() => toggle(item)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition text-left ${checked ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"}`}
            >
              <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${checked ? "bg-amber-500 border-amber-500 text-zinc-950" : "border-zinc-600"}`}>
                {isPending ? <Loader2 className="w-3 h-3 animate-spin text-zinc-400" /> : checked ? <Check className="w-3 h-3" /> : null}
              </span>
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}