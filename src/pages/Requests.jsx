import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, RefreshCw, UtensilsCrossed, Inbox, Calendar, Users, X } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import InquiryDetail from "@/components/InquiryDetail";
import { Link } from "react-router-dom";

const STATUSES = ["All", "New", "Quoted", "Tasting Booked", "Confirmed", "Declined"];

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function Requests() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState(null);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter(i => {
      if (statusFilter !== "All" && i.status !== statusFilter) return false;
      if (q) {
        const hay = `${i.name} ${i.event_type} ${i.venue} ${i.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFrom && i.event_date && i.event_date < dateFrom) return false;
      if (dateTo && i.event_date && i.event_date > dateTo) return false;
      return true;
    });
  }, [inquiries, search, statusFilter, dateFrom, dateTo]);

  const hasFilters = search || statusFilter !== "All" || dateFrom || dateTo;
  const clearFilters = () => { setSearch(""); setStatusFilter("All"); setDateFrom(""); setDateTo(""); };

  const handleUpdated = (updated) => {
    setInquiries(list => list.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  };

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Requests</h1>
              <p className="text-xs text-zinc-500">All catering inquiries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                Table view
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={load} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, event type, venue or email…"
              className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-zinc-950 border-zinc-800 text-zinc-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {STATUSES.map(s => <SelectItem key={s} value={s} className="text-zinc-200 focus:bg-zinc-800">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-200" />
              </div>
              <span className="text-zinc-600 text-sm">to</span>
              <div className="flex-1">
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-200" />
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0">
                <X className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-zinc-500">{filtered.length} {filtered.length === 1 ? "request" : "requests"}</p>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <Inbox className="w-10 h-10 mb-3" />
            <p className="text-sm">No requests match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(i => (
              <button
                key={i.id}
                onClick={() => setSelected(i)}
                className="text-left rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-amber-500/40 hover:bg-zinc-800/60 transition group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-zinc-100 group-hover:text-white truncate">{i.name}</h3>
                  <StatusBadge status={i.status} />
                </div>
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                    {fmtDate(i.event_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-zinc-600" />
                    {i.event_type}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-zinc-600" />
                    {i.guest_count} guests
                  </div>
                </div>
              </button>
            ))}
          </div>
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