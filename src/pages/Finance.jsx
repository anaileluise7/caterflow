import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { ArrowLeft, Loader2, TrendingUp, Wallet, Scale, RefreshCw, PieChart as PieIcon } from "lucide-react";
import { fmtMoney, asDate, monthKey, monthLabel, inquiryValue, CONFIRMED_STATUSES } from "@/lib/finance";
import OutstandingPayments from "@/components/OutstandingPayments";

const EVENT_COLORS = ["hsl(12 76% 61%)", "hsl(173 58% 45%)", "hsl(197 37% 50%)", "hsl(43 74% 60%)", "hsl(280 60% 65%)", "hsl(340 75% 60%)"];

export default function Finance() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.CateringInquiry.list("-created_date", 500);
      setInquiries(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.CateringInquiry.subscribe(load);
    return unsub;
  }, []);

  const m = useMemo(() => {
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const active = inquiries.filter(i => i.status !== "Declined");
    const confirmed = inquiries.filter(i => CONFIRMED_STATUSES.includes(i.status));

    let monthRevenue = 0;
    for (const i of confirmed) {
      if (asDate(i.event_date) && monthKey(i.event_date) === curKey) monthRevenue += inquiryValue(i);
    }

    const pipelineValue = active.reduce((s, i) => s + inquiryValue(i), 0);
    const valuedActive = active.filter(i => inquiryValue(i) > 0);
    const avgDeal = valuedActive.length ? pipelineValue / valuedActive.length : 0;

    const byType = {};
    for (const i of confirmed) {
      const t = i.event_type || "Other";
      byType[t] = (byType[t] || 0) + inquiryValue(i);
    }
    const typeData = Object.entries(byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const trend = {};
    for (const i of confirmed) {
      if (!asDate(i.event_date)) continue;
      const k = monthKey(i.event_date);
      trend[k] = (trend[k] || 0) + inquiryValue(i);
    }
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key: k, label: monthLabel(k), revenue: trend[k] || 0 });
    }

    return { monthRevenue, pipelineValue, avgDeal, typeData, months, confirmedCount: confirmed.length, activeCount: active.length };
  }, [inquiries]);

  const tooltipStyle = {
    background: "hsl(0 0% 9%)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, color: "hsl(0 0% 98%)", fontSize: 12,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Dashboard
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Finance</h1>
          <Button variant="outline" size="sm" onClick={load} className="ml-auto bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon={TrendingUp} tint="emerald" label="Confirmed Revenue" sub="This month" value={fmtMoney(m.monthRevenue)} />
              <StatCard icon={Wallet} tint="amber" label="Pipeline Value" sub={`${m.activeCount} active ${m.activeCount === 1 ? "deal" : "deals"}`} value={fmtMoney(m.pipelineValue)} />
              <StatCard icon={Scale} tint="sky" label="Average Deal Size" sub={`${m.confirmedCount} confirmed`} value={fmtMoney(m.avgDeal)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly trend */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-zinc-100">Monthly Revenue Trend</h2>
                  <p className="text-xs text-zinc-500">Confirmed bookings by event month · last 12 months</p>
                </div>
                <div className="h-64 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={m.months} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" />
                      <YAxis tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" tickFormatter={v => fmtMoney(v)} width={72} />
                      <Tooltip cursor={{ stroke: "rgba(255,255,255,0.2)" }} contentStyle={tooltipStyle} formatter={(v) => [fmtMoney(v), "Revenue"]} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(142 70% 50%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(142 70% 50%)" }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by event type */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-zinc-100">Revenue by Event Type</h2>
                  <p className="text-xs text-zinc-500">Confirmed bookings</p>
                </div>
                {m.typeData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                    <PieIcon className="w-8 h-8 mb-2" />
                    <p className="text-sm">No confirmed revenue yet.</p>
                  </div>
                ) : (
                  <div className="h-64 -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={m.typeData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" tickFormatter={v => fmtMoney(v)} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "hsl(0 0% 63.9%)", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" width={120} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={tooltipStyle} formatter={(v) => [fmtMoney(v), "Revenue"]} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {m.typeData.map((_, idx) => (
                            <Cell key={idx} fill={EVENT_COLORS[idx % EVENT_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <OutstandingPayments inquiries={inquiries} />
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, tint, label, sub, value }) {
  const tints = {
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    amber: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    sky: "bg-sky-500/15 border-sky-500/30 text-sky-400",
  };
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${tints[tint]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{label}</h2>
          <p className="text-xs text-zinc-500">{sub}</p>
        </div>
      </div>
      <div className="text-3xl font-semibold mt-4 text-zinc-50">{value}</div>
    </div>
  );
}