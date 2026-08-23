import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowUp, ArrowDown, ArrowUpDown, RefreshCw, UtensilsCrossed, Inbox, LayoutGrid, CalendarDays, List } from "lucide-react";
import { Link } from "react-router-dom";
import CalendarView from "@/components/CalendarView";
import { StatusBadge } from "@/components/StatusBadge";
import InquiryDetail from "@/components/InquiryDetail";

const STATUSES = ["All", "New", "Quoted", "Tasting Booked", "Confirmed", "Declined"];
const SORTABLE = ["event_date", "status"];

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function Dashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState("event_date");
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("list");

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CateringInquiry.list("-created_date", 200);
      setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const unsub = base44.entities.CateringInquiry.subscribe(() => { load(); });
    return unsub;
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = inquiries;
    if (statusFilter !== "All") list = list.filter(i => i.status === statusFilter);
    return [...list].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [inquiries, statusFilter, sortField, sortDir]);

  const counts = useMemo(() => {
    const c = { All: inquiries.length };
    for (const s of STATUSES.slice(1)) c[s] = inquiries.filter(i => i.status === s).length;
    return c;
  }, [inquiries]);

  const handleUpdated = (updated) => {
    setInquiries(list => list.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Saffron &amp; Sage</h1>
              <p className="text-xs text-zinc-500">Inquiries Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "list" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "calendar" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Calendar
              </button>
            </div>
            <Link to="/requests">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Cards
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={load} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-left rounded-xl border p-3 transition ${statusFilter === s ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}
            >
              <div className="text-xs text-zinc-500">{s}</div>
              <div className="text-2xl font-semibold mt-0.5">{counts[s] ?? 0}</div>
            </button>
          ))}
        </div>

        {view === "list" && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Filter:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {STATUSES.map(s => <SelectItem key={s} value={s} className="text-zinc-200 focus:bg-zinc-800">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-zinc-500">{filtered.length} {filtered.length === 1 ? "inquiry" : "inquiries"}</div>
        </div>
        )}

        {view === "calendar" ? (
          <CalendarView inquiries={inquiries} onSelect={setSelected} />
        ) : (
        <>
        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <Inbox className="w-10 h-10 mb-3" />
            <p className="text-sm">No inquiries match this filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="text-left font-medium px-4 py-3">Name</th>
                    <th className="text-left font-medium px-4 py-3">
                      <button className="inline-flex items-center gap-1.5 hover:text-zinc-300" onClick={() => toggleSort("event_date")}>
                        Event Date <SortIcon field="event_date" />
                      </button>
                    </th>
                    <th className="text-left font-medium px-4 py-3">Event Type</th>
                    <th className="text-left font-medium px-4 py-3">Guests</th>
                    <th className="text-left font-medium px-4 py-3">
                      <button className="inline-flex items-center gap-1.5 hover:text-zinc-300" onClick={() => toggleSort("status")}>
                        Status <SortIcon field="status" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(i => (
                    <tr
                      key={i.id}
                      onClick={() => setSelected(i)}
                      className="border-t border-zinc-800 hover:bg-zinc-900 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-100">{i.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{fmtDate(i.event_date)}</td>
                      <td className="px-4 py-3 text-zinc-300">{i.event_type}</td>
                      <td className="px-4 py-3 text-zinc-300">{i.guest_count}</td>
                      <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(i => (
                <button
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className="block w-full text-left rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-zinc-100">{i.name}</span>
                    <StatusBadge status={i.status} />
                  </div>
                  <div className="text-sm text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{fmtDate(i.event_date)}</span>
                    <span>·</span>
                    <span>{i.event_type}</span>
                    <span>·</span>
                    <span>{i.guest_count} guests</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
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