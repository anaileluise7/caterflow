import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, RefreshCw, Download, FileText, Inbox } from "lucide-react";
import { fmtMoney } from "@/lib/finance";
import { downloadInvoicePdf } from "@/lib/invoicePdf";

const STATUSES = ["All", "Draft", "Sent", "Paid"];

const BADGE = {
  Draft: "bg-zinc-700 text-zinc-200",
  Sent: "bg-sky-500/20 text-sky-300 border border-sky-500/40",
  Paid: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
};

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    try {
      const data = await base44.entities.Invoice.list("-created_date", 500);
      setInvoices(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Invoice.subscribe(load);
    return unsub;
  }, []);

  const filtered = useMemo(
    () => (filter === "All" ? invoices : invoices.filter(i => i.status === filter)),
    [invoices, filter]
  );

  const outstanding = useMemo(
    () => invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.balance || 0), 0),
    [invoices]
  );
  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + (i.total || 0), 0), [invoices]);
  const paidTotal = useMemo(() => invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.total || 0), 0), [invoices]);

  const setStatus = async (id, status) => {
    try { await base44.entities.Invoice.update(id, { status }); }
    catch (err) { console.error(err); }
  };

  const download = async (inv) => {
    try {
      const inquiry = await base44.entities.CateringInquiry.get(inv.inquiry_id);
      downloadInvoicePdf(inquiry, inv);
    } catch (err) { console.error(err); }
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
          <h1 className="text-lg font-semibold">Invoices</h1>
          <Button variant="outline" size="sm" onClick={load} className="ml-auto bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
            <div className="text-xs uppercase tracking-wide text-rose-300/80">Outstanding</div>
            <div className="text-3xl font-semibold text-rose-400 mt-1">{fmtMoney(outstanding)}</div>
            <div className="text-xs text-zinc-500 mt-1">Unpaid balances</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Total Invoiced</div>
            <div className="text-3xl font-semibold text-zinc-50 mt-1">{fmtMoney(totalInvoiced)}</div>
            <div className="text-xs text-zinc-500 mt-1">{invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Paid</div>
            <div className="text-3xl font-semibold text-emerald-400 mt-1">{fmtMoney(paidTotal)}</div>
            <div className="text-xs text-zinc-500 mt-1">{invoices.filter(i => i.status === "Paid").length} paid</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-zinc-500">Status:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {STATUSES.map(s => <SelectItem key={s} value={s} className="text-zinc-200 focus:bg-zinc-800">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="text-sm text-zinc-500 ml-auto">{filtered.length} {filtered.length === 1 ? "invoice" : "invoices"}</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <Inbox className="w-10 h-10 mb-3" />
            <p className="text-sm">No invoices {filter !== "All" ? `with status "${filter}"` : ""}.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="text-left font-medium px-4 py-3">Invoice #</th>
                    <th className="text-left font-medium px-4 py-3">Client</th>
                    <th className="text-left font-medium px-4 py-3">Event Date</th>
                    <th className="text-right font-medium px-4 py-3">Total</th>
                    <th className="text-right font-medium px-4 py-3">Deposit</th>
                    <th className="text-right font-medium px-4 py-3">Balance</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id} className="border-t border-zinc-800 hover:bg-zinc-900">
                      <td className="px-4 py-3 font-medium text-zinc-100">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-zinc-300">{inv.client_name}</td>
                      <td className="px-4 py-3 text-zinc-300">{fmtDate(inv.event_date)}</td>
                      <td className="px-4 py-3 text-right text-zinc-100 font-medium">{fmtMoney(inv.total)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{fmtMoney(inv.deposit)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{fmtMoney(inv.balance)}</td>
                      <td className="px-4 py-3">
                        <Select value={inv.status} onValueChange={v => setStatus(inv.id, v)}>
                          <SelectTrigger className="w-[110px] bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {STATUSES.slice(1).map(s => (
                              <SelectItem key={s} value={s} className="text-zinc-100 focus:bg-zinc-700">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => download(inv)} className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(inv => (
                <div key={inv.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-100 truncate">{inv.invoice_number}</div>
                      <div className="text-xs text-zinc-500">{inv.client_name} · {fmtDate(inv.event_date)}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[inv.status] || BADGE.Draft}`}>{inv.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="text-sm text-zinc-300">
                      Total <span className="font-medium text-zinc-100">{fmtMoney(inv.total)}</span>
                      <span className="text-zinc-500 mx-1.5">·</span>
                      Balance <span className="font-medium text-zinc-100">{fmtMoney(inv.balance)}</span>
                    </div>
                    <button onClick={() => download(inv)} className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}