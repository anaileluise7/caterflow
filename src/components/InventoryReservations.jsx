import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, CalendarDays, Users, AlertTriangle } from "lucide-react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EQUIP_TO_CATEGORY = {
  "Linens": "Linen",
  "Glassware": "Glassware",
  "Serveware": "Tableware",
  "China & Plates": "Tableware",
  "Cutlery": "Tableware",
  "Tables & Chairs": "Furniture",
  "Bar Equipment": "Kitchen Equipment",
  "Chafing Dishes": "Kitchen Equipment",
  "Serving Trays": "Kitchen Equipment",
  "Audio / Visual": "Other",
};

const TYPE_BADGE = {
  "Wedding": "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Corporate": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Birthday": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Private Dinner": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Cocktail Reception": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Other": "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

const DOT = {
  "Wedding": "bg-rose-400",
  "Corporate": "bg-blue-400",
  "Birthday": "bg-purple-400",
  "Private Dinner": "bg-emerald-400",
  "Cocktail Reception": "bg-amber-400",
  "Other": "bg-zinc-400",
};

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
const iso = (d) => d.toISOString().slice(0, 10);

export default function InventoryReservations({ inventory }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => iso(new Date()));
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await base44.entities.CateringInquiry.list("-created_date", 500);
        setInquiries(data.filter(i => i.status !== "Declined"));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const byDate = useMemo(() => {
    const m = {};
    for (const i of inquiries) {
      if (!i.event_date) continue;
      (m[i.event_date] = m[i.event_date] || []).push(i);
    }
    return m;
  }, [inquiries]);

  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startDay = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startDay);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const todayIso = iso(new Date());
  const selectedEvents = selected ? (byDate[selected] || []) : [];
  const selectedDateObj = selected ? new Date(selected + "T00:00:00") : null;

  const demand = useMemo(() => {
    const catCount = {};
    for (const ev of selectedEvents) {
      const cats = new Set((ev.equipment || []).map(e => EQUIP_TO_CATEGORY[e]).filter(Boolean));
      for (const c of cats) catCount[c] = (catCount[c] || 0) + 1;
    }
    return catCount;
  }, [selectedEvents]);

  const availByCategory = useMemo(() => {
    const m = {};
    for (const it of inventory) {
      m[it.category] = (m[it.category] || 0) + (it.available_quantity ?? 0);
    }
    return m;
  }, [inventory]);

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const hasConflict = Object.values(demand).some(c => c > 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-amber-400" /> {monthLabel}</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => { setCursor(startOfMonth(new Date())); setSelected(todayIso); }} className="px-2 py-1 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white">Today</button>
            <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(d => <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, idx) => {
            const ds = iso(d);
            const events = byDate[ds] || [];
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = ds === todayIso;
            const isSelected = ds === selected;
            return (
              <button
                key={idx}
                onClick={() => setSelected(ds)}
                className={`min-h-[56px] rounded-lg border p-1.5 text-left transition ${isSelected ? "border-amber-500 bg-amber-500/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"} ${!inMonth ? "opacity-40" : ""}`}
              >
                <div className={`text-xs ${isToday ? "font-bold text-amber-400" : "text-zinc-400"}`}>{d.getDate()}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {events.slice(0, 3).map((e, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${DOT[e.event_type] || DOT.Other}`} />
                  ))}
                  {events.length > 3 && <span className="text-[10px] text-zinc-500">+{events.length - 3}</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
          {Object.entries(DOT).map(([t, c]) => (
            <span key={t} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${c}`} /> {t}</span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="font-semibold text-zinc-100 mb-3">
          {selectedDateObj ? selectedDateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Select a day"}
        </h3>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading events…</p>
        ) : selectedEvents.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No events booked this day — equipment is free.</p>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map(ev => (
              <div key={ev.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-100 truncate">{ev.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${TYPE_BADGE[ev.event_type] || TYPE_BADGE.Other}`}>{ev.event_type}</span>
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-1 mb-2"><Users className="w-3 h-3" /> {ev.guest_count || 0} guests · {ev.venue || "No venue"}</div>
                <div className="flex flex-wrap gap-1">
                  {(ev.equipment || []).map(e => <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{e}</span>)}
                  {(!ev.equipment || ev.equipment.length === 0) && <span className="text-[10px] text-zinc-600 italic">No equipment listed</span>}
                </div>
              </div>
            ))}

            {Object.keys(demand).length > 0 && (
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Equipment demand</div>
                {Object.entries(demand).map(([cat, count]) => {
                  const avail = availByCategory[cat] || 0;
                  const conflict = count > 1;
                  return (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5">
                        {conflict && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {cat}
                      </span>
                      <span className={conflict ? "text-amber-300" : "text-zinc-500"}>
                        {count} event{count === 1 ? "" : "s"} · {avail} avail
                      </span>
                    </div>
                  );
                })}
                {hasConflict && (
                  <p className="text-xs text-amber-300 flex items-start gap-1.5 pt-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    Multiple events share equipment this day — check stock before confirming to avoid double-booking.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}