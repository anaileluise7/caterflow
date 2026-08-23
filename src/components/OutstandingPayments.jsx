import React, { useMemo } from "react";
import { fmtMoney, asDate, CONFIRMED_STATUSES } from "@/lib/finance";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

export default function OutstandingPayments({ inquiries }) {
  const rows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out = [];
    for (const i of inquiries) {
      if (!CONFIRMED_STATUSES.includes(i.status)) continue;
      const items = [];
      if (i.deposit_amount && !i.deposit_paid) {
        items.push({ kind: "Deposit", amount: i.deposit_amount, due: i.deposit_due_date });
      }
      if (i.balance_amount && !i.balance_paid) {
        items.push({ kind: "Balance", amount: i.balance_amount, due: i.balance_due_date });
      }
      if (items.length === 0) continue;
      const dates = items.map(x => asDate(x.due)).filter(Boolean).sort((a, b) => a - b);
      out.push({ inquiry: i, items, earliest: dates[0] || null });
    }
    out.sort((a, b) => {
      if (!a.earliest && !b.earliest) return 0;
      if (!a.earliest) return 1;
      if (!b.earliest) return -1;
      return a.earliest - b.earliest;
    });
    return { out, today };
  }, [inquiries]);

  const { out, today } = rows;
  const totalOutstanding = out.reduce((s, r) => s + r.items.reduce((a, x) => a + (x.amount || 0), 0), 0);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Outstanding Payments</h2>
          <p className="text-xs text-zinc-500">Unpaid deposits & balances · sorted by due date</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-rose-400">{fmtMoney(totalOutstanding)}</div>
          <div className="text-xs text-zinc-500">{out.length} {out.length === 1 ? "booking" : "bookings"}</div>
        </div>
      </div>

      {out.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
          <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/60" />
          <p className="text-sm">All confirmed bookings are fully paid.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {out.map(({ inquiry: i, items }) => (
            <div key={i.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-100 truncate">{i.name}</div>
                  <div className="text-xs text-zinc-500">{i.event_type} · {fmtDate(i.event_date)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((it, idx) => {
                  const due = asDate(it.due);
                  const overdue = due && due < today;
                  return (
                    <div key={idx} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${overdue ? "border-rose-500/50 bg-rose-500/10 text-rose-300" : "border-zinc-700 bg-zinc-800/60 text-zinc-300"}`}>
                      {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                      <span className="font-medium">{it.kind}</span>
                      <span>{fmtMoney(it.amount)}</span>
                      <span className="text-zinc-500">· due {fmtDate(it.due)}</span>
                      {overdue && <span className="font-semibold text-rose-400">overdue</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}