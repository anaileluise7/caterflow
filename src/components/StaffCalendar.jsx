import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = [
  "bg-amber-500/20 text-amber-300 border-amber-500/40",
  "bg-sky-500/20 text-sky-300 border-sky-500/40",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "bg-violet-500/20 text-violet-300 border-violet-500/40",
  "bg-rose-500/20 text-rose-300 border-rose-500/40",
  "bg-teal-500/20 text-teal-300 border-teal-500/40",
  "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function StaffCalendar({ staff, tasks, inquiries }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const staffColor = useMemo(() => {
    const m = {};
    staff.forEach((s, i) => { m[s.name] = COLORS[i % COLORS.length]; });
    return m;
  }, [staff]);

  const eventsByDate = useMemo(() => {
    const m = {};
    for (const inq of inquiries) {
      if (!inq.event_date) continue;
      const assignees = [...new Set(tasks.filter(t => t.inquiry_id === inq.id && t.assignee).map(t => t.assignee))];
      if (!m[inq.event_date]) m[inq.event_date] = [];
      m[inq.event_date].push({ inquiry: inq, assignees });
    }
    return m;
  }, [inquiries, tasks]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const today = ymd(new Date());
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const hasEvents = Object.keys(eventsByDate).length > 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">{monthLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 h-8 px-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 h-8 text-xs">Today</Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 h-8 px-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {staff.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {staff.map(s => (
            <span key={s.id} className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${staffColor[s.name] || COLORS[0]}`}>{s.name}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(w => <div key={w} className="text-center text-xs font-medium text-zinc-500 py-1">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[84px] rounded-lg bg-zinc-950/40 border border-zinc-800/50" />;
          const ds = ymd(d);
          const events = eventsByDate[ds] || [];
          const isToday = ds === today;
          return (
            <div key={i} className={`min-h-[84px] rounded-lg border p-1.5 flex flex-col gap-1 ${isToday ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800 bg-zinc-950"}`}>
              <div className={`text-xs font-medium ${isToday ? "text-amber-400" : "text-zinc-400"}`}>{d.getDate()}</div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {events.slice(0, 3).map((ev, idx) => (
                  <div key={idx} className="rounded-md bg-zinc-800/80 px-1.5 py-1">
                    <div className="text-[11px] text-zinc-200 truncate font-medium">{ev.inquiry.name}</div>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {ev.assignees.length === 0 ? (
                        <span className="text-[10px] text-zinc-600 italic">Unassigned</span>
                      ) : ev.assignees.slice(0, 3).map(a => (
                        <span key={a} className={`inline-flex items-center px-1 rounded border text-[9px] leading-tight ${staffColor[a] || "bg-zinc-700 text-zinc-300 border-zinc-600"}`}>{a.split(" ")[0]}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {events.length > 3 && <span className="text-[10px] text-zinc-500 px-1">+{events.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>

      {!hasEvents && (
        <p className="text-sm text-zinc-500 italic text-center mt-4">No scheduled events yet.</p>
      )}
    </div>
  );
}