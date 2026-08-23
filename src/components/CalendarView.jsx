import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, format, addMonths, parseISO
} from "date-fns";

const STATUS_DOT = {
  "New": "bg-blue-500",
  "Quoted": "bg-amber-500",
  "Tasting Booked": "bg-purple-500",
  "Confirmed": "bg-emerald-500",
  "Declined": "bg-rose-500",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView({ inquiries, onSelect }) {
  const [cursor, setCursor] = useState(new Date());

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const i of inquiries) {
      if (!i.event_date) continue;
      if (!map[i.event_date]) map[i.event_date] = [];
      map[i.event_date].push(i);
    }
    return map;
  }, [inquiries]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const monthLabel = format(cursor, "MMMM yyyy");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-100">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCursor(addMonths(cursor, -1))} className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())} className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 px-2 text-xs">
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(addMonths(cursor, 1))} className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
        {Object.entries(STATUS_DOT).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className={`w-2 h-2 rounded-full ${c}`} />
            {s}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const events = eventsByDate[key] || [];
              const inMonth = isSameMonth(day, cursor);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              return (
                <div
                  key={key}
                  className={`min-h-[72px] rounded-lg border p-1.5 text-left ${
                    inMonth ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-900 bg-zinc-950/20 opacity-50"
                  } ${isToday ? "ring-1 ring-amber-500/50" : ""}`}
                >
                  <div className={`text-xs mb-1 ${isToday ? "font-bold text-amber-400" : "text-zinc-500"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 2).map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => onSelect(ev)}
                        className="flex items-center gap-1 w-full rounded px-1 py-0.5 bg-zinc-800/80 hover:bg-zinc-700 transition text-left"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[ev.status] || "bg-zinc-500"}`} />
                        <span className="text-[11px] text-zinc-200 truncate">{ev.name}</span>
                      </button>
                    ))}
                    {events.length > 2 && (
                      <div className="text-[10px] text-zinc-500 px-1">+{events.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}