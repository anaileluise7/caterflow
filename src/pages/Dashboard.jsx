import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowUp, ArrowDown, ArrowUpDown, RefreshCw, UtensilsCrossed, Inbox, LayoutGrid, CalendarDays, List, Trash2, LayoutDashboard, Sheet, ExternalLink, Mail, LineChart, FileText, BellRing, Users, CloudSun, Boxes } from "lucide-react";
import { Link } from "react-router-dom";
import CalendarView from "@/components/CalendarView";
import KanbanView from "@/components/KanbanView";
import RevenueSummary from "@/components/RevenueSummary";
import { StatusBadge } from "@/components/StatusBadge";
import InquiryDetail from "@/components/InquiryDetail";
import WeatherLookup from "@/components/WeatherLookup";
import { PIPELINE_STATUSES } from "@/lib/pipeline";

const STATUSES = ["All", ...PIPELINE_STATUSES];
const EVENT_TYPES = ["All", "Wedding", "Corporate", "Birthday", "Private Dinner", "Cocktail Reception", "Other"];
const LEAD_SOURCES = ["All", "Instagram", "Facebook", "Google", "Word of Mouth", "Referral", "Wedding Fair", "Other"];
const SORTABLE = ["event_date", "status"];

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function isFollowUpDue(i) {
  if (!i.follow_up_date) return false;
  if (["Completed", "Declined"].includes(i.status)) return false;
  const todayStr = new Date().toLocaleDateString("en-CA");
  return i.follow_up_date <= todayStr;
}

export default function Dashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [leadSourceFilter, setLeadSourceFilter] = useState("All");
  const [sortField, setSortField] = useState("event_date");
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("list");
  const [checked, setChecked] = useState(new Set());
  const [showWeather, setShowWeather] = useState(false);

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
    if (eventTypeFilter !== "All") list = list.filter(i => i.event_type === eventTypeFilter);
    if (leadSourceFilter !== "All") list = list.filter(i => i.lead_source === leadSourceFilter);
    return [...list].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [inquiries, statusFilter, eventTypeFilter, leadSourceFilter, sortField, sortDir]);

  const counts = useMemo(() => {
    const c = { All: inquiries.length };
    for (const s of STATUSES.slice(1)) c[s] = inquiries.filter(i => i.status === s).length;
    return c;
  }, [inquiries]);

  const handleUpdated = (updated) => {
    setInquiries(list => list.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  };

  const allChecked = filtered.length > 0 && filtered.every(i => checked.has(i.id));
  const toggleCheck = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setChecked(prev => {
      const next = new Set(prev);
      if (filtered.every(i => next.has(i.id))) {
        filtered.forEach(i => next.delete(i.id));
      } else {
        filtered.forEach(i => next.add(i.id));
      }
      return next;
    });
  };
  const bulkUpdateStatus = async (newStatus) => {
    try {
      await base44.entities.CateringInquiry.bulkUpdate([...checked].map(id => ({ id, status: newStatus })));
      setChecked(new Set());
      load();
    } catch (err) { console.error(err); }
  };
  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${checked.size} selected inquiries? This cannot be undone.`)) return;
    try {
      await base44.entities.CateringInquiry.deleteMany({ id: { $in: [...checked] } });
      setChecked(new Set());
      load();
    } catch (err) { console.error(err); }
  };

  const [sheetsConnected, setSheetsConnected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState(null);

  const doExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const res = await base44.functions.invoke("exportInquiriesToSheet", { inquiry_ids: [...checked] });
      const data = res.data;
      setSheetsConnected(true);
      setExportMsg({
        type: "success",
        text: `Exported ${data.appended} ${data.appended === 1 ? "inquiry" : "inquiries"} to Google Sheet.`,
        url: data.spreadsheet_url,
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Export failed";
      if (msg === "not_connected") {
        setSheetsConnected(false);
        setExportMsg({ type: "error", text: "Connect your Google account to enable Sheet export." });
      } else {
        setExportMsg({ type: "error", text: msg });
      }
    } finally {
      setExporting(false);
    }
  };

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser("6a8b26af88276f2ae373e42b");
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setSheetsConnected(null);
          doExport();
        }
      }, 500);
    } catch (err) {
      setExportMsg({ type: "error", text: err.message || "Could not start Google connection" });
    }
  };

  const handleExport = () => {
    if (sheetsConnected === false) { handleConnect(); return; }
    doExport();
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
              <button
                onClick={() => setView("board")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "board" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Board
              </button>
            </div>
            <Link to="/invoices">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Invoices
              </Button>
            </Link>
            <Link to="/finance">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <LineChart className="w-3.5 h-3.5 mr-1.5" /> Finance
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Templates
              </Button>
            </Link>
            <Link to="/requests">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Cards
              </Button>
            </Link>
            <Link to="/staff">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <Users className="w-3.5 h-3.5 mr-1.5" /> Staff
              </Button>
            </Link>
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <Boxes className="w-3.5 h-3.5 mr-1.5" /> Inventory
              </Button>
            </Link>
            <Link to="/reminders">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                <BellRing className="w-3.5 h-3.5 mr-1.5" /> Reminders
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowWeather(true)} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <CloudSun className="w-3.5 h-3.5 mr-1.5" /> Weather
            </Button>
            <Button variant="outline" size="sm" onClick={load} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <RevenueSummary inquiries={inquiries} />

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
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[170px] bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="text-zinc-200 focus:bg-zinc-800">{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={leadSourceFilter} onValueChange={setLeadSourceFilter}>
              <SelectTrigger className="w-[170px] bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {LEAD_SOURCES.map(s => <SelectItem key={s} value={s} className="text-zinc-200 focus:bg-zinc-800">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-zinc-500">{filtered.length} {filtered.length === 1 ? "inquiry" : "inquiries"}</div>
        </div>
        )}

        {view === "list" && checked.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
            <span className="text-sm font-medium text-amber-200">{checked.size} selected</span>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <span className="text-xs text-zinc-400">Set status:</span>
              <Select value="" onValueChange={bulkUpdateStatus}>
                <SelectTrigger className="w-[170px] bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {STATUSES.slice(1).map(s => <SelectItem key={s} value={s} className="text-zinc-200 focus:bg-zinc-800">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white">
                {exporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sheet className="w-3.5 h-3.5 mr-1.5" />}
                {sheetsConnected === false ? "Connect Google Sheets" : "Export to Sheet"}
              </Button>
              <Button variant="outline" size="sm" onClick={bulkDelete} className="bg-zinc-900 border-rose-800/60 text-rose-300 hover:bg-rose-900/40 hover:text-rose-200">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setChecked(new Set())} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                Clear
              </Button>
            </div>
            {exportMsg && (
              <div className={`w-full text-xs ${exportMsg.type === "error" ? "text-rose-400" : "text-emerald-400"}`}>
                {exportMsg.text}
                {exportMsg.url && <a href={exportMsg.url} target="_blank" rel="noreferrer" className="ml-2 underline inline-flex items-center gap-1">Open sheet<ExternalLink className="w-3 h-3" /></a>}
              </div>
            )}
          </div>
        )}

        {view === "calendar" ? (
          <CalendarView inquiries={inquiries} onSelect={setSelected} />
        ) : view === "board" ? (
          loading ? (
            <div className="flex items-center justify-center py-24 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <KanbanView inquiries={inquiries} onUpdated={handleUpdated} onSelect={setSelected} />
          )
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
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                    </th>
                    <th className="text-left font-medium px-4 py-3">Name</th>
                    <th className="text-left font-medium px-4 py-3">
                      <button className="inline-flex items-center gap-1.5 hover:text-zinc-300" onClick={() => toggleSort("event_date")}>
                        Event Date <SortIcon field="event_date" />
                      </button>
                    </th>
                    <th className="text-left font-medium px-4 py-3">Event Type</th>
                    <th className="text-left font-medium px-4 py-3">Source</th>
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
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={checked.has(i.id)} onChange={() => toggleCheck(i.id)} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        <span className="inline-flex items-center gap-1.5">
                          {i.name}
                          {isFollowUpDue(i) && (
                            <BellRing className="w-3.5 h-3.5 text-amber-400" title={`Follow-up due ${i.follow_up_date}`} />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{fmtDate(i.event_date)}</td>
                      <td className="px-4 py-3 text-zinc-300">{i.event_type}</td>
                      <td className="px-4 py-3 text-zinc-300">{i.lead_source || "—"}</td>
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
                <div key={i.id} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition">
                  <input type="checkbox" checked={checked.has(i.id)} onChange={() => toggleCheck(i.id)} className="w-4 h-4 mt-0.5 rounded accent-amber-500 cursor-pointer shrink-0" />
                  <button onClick={() => setSelected(i)} className="block flex-1 text-left">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-medium text-zinc-100 inline-flex items-center gap-1.5">
                        {i.name}
                        {isFollowUpDue(i) && (
                          <BellRing className="w-3.5 h-3.5 text-amber-400" title={`Follow-up due ${i.follow_up_date}`} />
                        )}
                      </span>
                      <StatusBadge status={i.status} />
                    </div>
                    <div className="text-sm text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{fmtDate(i.event_date)}</span>
                      <span>·</span>
                      <span>{i.event_type}</span>
                      <span>·</span>
                      <span>{i.lead_source || "Unknown source"}</span>
                      <span>·</span>
                      <span>{i.guest_count} guests</span>
                    </div>
                  </button>
                </div>
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

      {showWeather && (
        <WeatherLookup onClose={() => setShowWeather(false)} />
      )}
    </div>
  );
}