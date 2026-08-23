import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Loader2, Download, Printer, FileText, ExternalLink } from "lucide-react";
import { downloadInvoicePdf, printInvoicePdf } from "@/lib/invoicePdf";
import { fmtMoney } from "@/lib/finance";

const STATUSES = ["Draft", "Sent", "Paid"];

export default function InvoicePanel({ inquiry }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const list = await base44.entities.Invoice.filter({ inquiry_id: inquiry.id }, "-created_date", 1);
      setInvoice(list[0] || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [inquiry.id]);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateInvoice", { inquiry_id: inquiry.id });
      const data = res.data.invoice;
      const record = await base44.entities.Invoice.create({
        invoice_number: data.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
        inquiry_id: inquiry.id,
        client_name: inquiry.name,
        event_date: inquiry.event_date,
        line_items: data.line_items || [],
        subtotal: data.subtotal || 0,
        tax_rate: data.tax_rate || 0,
        tax_amount: data.tax_amount || 0,
        deposit: inquiry.deposit_amount || 0,
        balance: inquiry.balance_amount || (data.total || 0),
        total: data.total || 0,
        status: "Draft",
        issued_date: new Date().toISOString().slice(0, 10),
        payment_terms: data.payment_terms || "",
        notes: data.notes || "",
      });
      setInvoice(record);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not generate invoice");
    } finally {
      setGenerating(false);
    }
  };

  const setStatus = async (status) => {
    try {
      const updated = await base44.entities.Invoice.update(invoice.id, { status });
      setInvoice(updated);
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Invoice</h3>
        </div>
        {invoice && (
          <Link to="/invoices" className="text-xs text-amber-400 hover:underline inline-flex items-center gap-1">
            All invoices <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
      ) : invoice ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-100 truncate">{invoice.invoice_number}</div>
              <div className="text-xs text-zinc-500">Issued {invoice.issued_date}</div>
            </div>
            <Select value={invoice.status} onValueChange={setStatus}>
              <SelectTrigger className="w-[110px] bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {STATUSES.map(s => <SelectItem key={s} value={s} className="text-zinc-100 focus:bg-zinc-700">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-zinc-800/60 px-2 py-1.5">
              <div className="text-zinc-500">Total</div>
              <div className="text-zinc-100 font-medium">{fmtMoney(invoice.total)}</div>
            </div>
            <div className="rounded-md bg-zinc-800/60 px-2 py-1.5">
              <div className="text-zinc-500">Deposit</div>
              <div className="text-zinc-100 font-medium">{fmtMoney(invoice.deposit)}</div>
            </div>
            <div className="rounded-md bg-zinc-800/60 px-2 py-1.5">
              <div className="text-zinc-500">Balance</div>
              <div className="text-zinc-100 font-medium">{fmtMoney(invoice.balance)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadInvoicePdf(inquiry, invoice)}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => printInvoicePdf(inquiry, invoice)}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-sm text-zinc-500 mb-3">No invoice record yet.</p>
          <Button size="sm" onClick={generate} disabled={generating || !inquiry.proposal}
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
            {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
            Generate Invoice
          </Button>
          {!inquiry.proposal && <p className="text-xs text-zinc-500 mt-2">Generate a proposal first.</p>}
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}