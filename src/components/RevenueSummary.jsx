import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, CalendarClock } from "lucide-react";

function parseBudget(b) {
  if (!b) return 0;
  const m = String(b).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; }
}

function fmtMoney(n) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);
}

export default function RevenueSummary({ inquiries }) {
  const data = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 30);
    return inquiries
      .filter(i => i.status === "Confirmed" && i.event_date)
      .map(i => ({
        id: i.id,
        name: i.name,
        date: i.event_date,
        revenue: (i.guest_count || 0) * parseBudget(i.budget_per_head),
        d: new Date(i.event_date),
      }))
      .filter(i => i.d >= now && i.d <= limit)
      .sort((a, b) => a.d - b.d)
      .map(i => ({ ...i, label: fmtDate(i.date) }));
  }, [inquiries]);

  const total = data.reduce((s, i) => s + i.revenue, 0);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Estimated Revenue</h2>
            <p className="text-xs text-zinc-500">Confirmed bookings · next 30 days</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-emerald-400">{fmtMoney(total)}</div>
          <div className="text-xs text-zinc-500">{data.length} {data.length === 1 ? "event" : "events"}</div>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
          <CalendarClock className="w-8 h-8 mb-2" />
          <p className="text-sm">No confirmed bookings in the next 30 days.</p>
        </div>
      ) : (
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" />
              <YAxis tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" tickFormatter={v => fmtMoney(v)} width={72} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{ background: "hsl(0 0% 9%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "hsl(0 0% 98%)", fontSize: 12 }}
                formatter={v => [fmtMoney(v), "Est. revenue"]}
                labelFormatter={(l, payload) => payload && payload[0] ? `${payload[0].payload.name} · ${l}` : l}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(142 70% 45%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}