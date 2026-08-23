import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, CalendarClock, Users } from "lucide-react";

function parseBudget(b) {
  if (!b) return 0;
  const m = String(b).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function fmtMoney(n) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);
}

function asDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function monthKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function RevenueSummary({ inquiries }) {
  const { next30Total, next30Events, next30Guests, byMonth } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);

    const confirmed = inquiries.filter(i => i.status === "Confirmed" && asDate(i.event_date));
    let n30Total = 0, n30Events = 0, n30Guests = 0;
    const groups = {};
    for (const i of confirmed) {
      const d = asDate(i.event_date);
      if (d < today) continue;
      const revenue = (i.guest_count || 0) * parseBudget(i.budget_per_head);
      const k = monthKey(i.event_date);
      if (!groups[k]) groups[k] = { key: k, revenue: 0, events: 0 };
      groups[k].revenue += revenue;
      groups[k].events += 1;
      if (d <= horizon) {
        n30Total += revenue;
        n30Events += 1;
        n30Guests += i.guest_count || 0;
      }
    }
    const byMonth = Object.values(groups).sort((a, b) => a.key.localeCompare(b.key)).map(g => ({ ...g, label: monthLabel(g.key) }));
    return { next30Total: n30Total, next30Events: n30Events, next30Guests: n30Guests, byMonth };
  }, [inquiries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Next 30 days card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Confirmed Revenue</h2>
            <p className="text-xs text-zinc-500">Next 30 days</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="text-3xl font-semibold text-emerald-400">{fmtMoney(next30Total)}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
            <CalendarClock className="w-3.5 h-3.5" />
            {next30Events} {next30Events === 1 ? "event" : "events"} confirmed
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            {next30Guests} guests
          </div>
        </div>
      </div>

      {/* Upcoming chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 lg:col-span-2">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-100">Estimated Revenue · Upcoming Events</h2>
          <p className="text-xs text-zinc-500">Confirmed bookings grouped by event month</p>
        </div>
        {byMonth.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
            <CalendarClock className="w-8 h-8 mb-2" />
            <p className="text-sm">No upcoming confirmed events.</p>
          </div>
        ) : (
          <div className="h-52 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" />
                <YAxis tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" tickFormatter={v => fmtMoney(v)} width={72} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ background: "hsl(0 0% 9%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "hsl(0 0% 98%)", fontSize: 12 }}
                  formatter={(v, _name, p) => [fmtMoney(v), `${p.payload.events} ${p.payload.events === 1 ? "event" : "events"}`]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(142 70% 45%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}