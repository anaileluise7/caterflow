import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, BellRing, CalendarClock, Inbox, UtensilsCrossed, Users, Mail, Phone } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import InquiryDetail from "@/components/InquiryDetail";
import { Link } from "react-router-dom";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function daysUntil(d) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

export default function Reminders() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CateringInquiry.list("-created_date", 500);
      setInquiries(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const unsub = base44.entities.CateringInquiry.subscribe(() => load());
    return unsub;
  }, []);

  const withReminders = useMemo(
    () => inquiries
      .filter(i => i.follow_up_date && !["Completed", "Declined"].includes(i.status))
      .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date)),
    [inquiries]
  );

  const groups = useMemo(() => {
    const overdue = [], today = [], upcoming = [];
    for (const i of withReminders) {
      const d = daysUntil(i.follow_up_date);
      if (d < 0) overdue.push(i);
      else if (d === 0) today.push(i);
      else upcoming.push(i);
    }
    return { overdue, today, upcoming };
  }, [withReminders]);

  const handleUpdated = (updated) => {
    setInquiries(list => list.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  };

  const Section = ({ title, items, accent }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${accent}`} />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
          <span className="text-xs text-zinc-600">{items.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(i => (
            <button
              key={i.id}
              onClick={() => setSelected(i)}
              className="text-left rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-amber-500/40 hover:bg-zinc-800/60 transition flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-zinc-100 truncate">{i.name}</h3>
                <StatusBadge status={i.status} />
              </div>
              <div className="space-y-1.5 text-sm text-zinc-400 flex-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span className={daysUntil(i.follow_up_date) < 0 ? "text-rose-400 font-medium" : "text-zinc-300"}>
                    {fmtDate(i.follow_up_date)}
                  </span>
                  {daysUntil(i.follow_up_date) < 0 && <span className="text-xs text-rose-400">· overdue</span>}
                  {daysUntil(i.follow_up_date) === 0 && <span className="text-xs text-amber-400">· today</span>}
                </div>
                <div className="flex items-center gap-2"><UtensilsCrossed className="w-3.5 h-3.5 text-zinc-600 shrink-0" />{i.event_type} · {fmtDate(i.event_date)}</div>
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-zinc-600 shrink-0" />{i.guest_count} guests</div>
                {i.email && <div className="flex items-center gap-2 min-w-0"><Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" /><span className="truncate">{i.email}</span></div>}
                {i.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />{i.phone}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Follow-up Reminders</h1>
              <p className="text-xs text-zinc-500">{withReminders.length} pending {withReminders.length === 1 ? "reminder" : "reminders"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">Dashboard</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={load} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : withReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <BellRing className="w-10 h-10 mb-3" />
            <p className="text-sm">No pending follow-ups. You're all caught up.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                <div className="text-xs text-rose-300/80">Overdue</div>
                <div className="text-2xl font-semibold text-rose-300">{groups.overdue.length}</div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="text-xs text-amber-300/80">Today</div>
                <div className="text-2xl font-semibold text-amber-300">{groups.today.length}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="text-xs text-emerald-300/80">Upcoming</div>
                <div className="text-2xl font-semibold text-emerald-300">{groups.upcoming.length}</div>
              </div>
            </div>
            <Section title="Overdue" items={groups.overdue} accent="bg-rose-400" />
            <Section title="Due Today" items={groups.today} accent="bg-amber-400" />
            <Section title="Upcoming" items={groups.upcoming} accent="bg-emerald-400" />
          </>
        )}
      </main>

      {selected && (
        <InquiryDetail
          inquiry={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}