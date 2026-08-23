import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Check, PoundSterling } from "lucide-react";

function num(v) { return v === "" || v == null ? null : Number(v); }

export default function PaymentTracker({ inquiry, onUpdated }) {
  const [form, setForm] = useState({
    total_quoted: inquiry.total_quoted ?? "",
    deposit_amount: inquiry.deposit_amount ?? "",
    deposit_due_date: inquiry.deposit_due_date ?? "",
    deposit_paid: !!inquiry.deposit_paid,
    balance_amount: inquiry.balance_amount ?? "",
    balance_due_date: inquiry.balance_due_date ?? "",
    balance_paid: !!inquiry.balance_paid,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, {
        total_quoted: num(form.total_quoted),
        deposit_amount: num(form.deposit_amount),
        deposit_due_date: form.deposit_due_date || null,
        deposit_paid: !!form.deposit_paid,
        balance_amount: num(form.balance_amount),
        balance_due_date: form.balance_due_date || null,
        balance_paid: !!form.balance_paid,
      });
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Could not save payment details");
    } finally {
      setSaving(false);
    }
  };

  const autoBalance = () => {
    const total = Number(form.total_quoted) || 0;
    const dep = Number(form.deposit_amount) || 0;
    set("balance_amount", Math.max(0, total - dep));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <PoundSterling className="w-4 h-4 text-zinc-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Payment Tracking</h3>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-4">
        <div>
          <Label className="text-xs text-zinc-400">Total Quoted (£)</Label>
          <Input type="number" value={form.total_quoted} onChange={e => set("total_quoted", e.target.value)}
            className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="0" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-zinc-400">Deposit (£)</Label>
            <Input type="number" value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)}
              className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Deposit Due</Label>
            <Input type="date" value={form.deposit_due_date} onChange={e => set("deposit_due_date", e.target.value)}
              className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md bg-zinc-800/60 px-3 py-2">
          <span className="text-sm text-zinc-300">Deposit paid</span>
          <Switch checked={form.deposit_paid} onCheckedChange={v => set("deposit_paid", v)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Balance (£)</Label>
              <button onClick={autoBalance} className="text-[11px] text-amber-400 hover:underline">auto</button>
            </div>
            <Input type="number" value={form.balance_amount} onChange={e => set("balance_amount", e.target.value)}
              className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Balance Due</Label>
            <Input type="date" value={form.balance_due_date} onChange={e => set("balance_due_date", e.target.value)}
              className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md bg-zinc-800/60 px-3 py-2">
          <span className="text-sm text-zinc-300">Balance paid</span>
          <Switch checked={form.balance_paid} onCheckedChange={v => set("balance_paid", v)} />
        </div>

        {error && <div className="text-sm text-rose-400">{error}</div>}

        <Button size="sm" onClick={save} disabled={saving} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
          {saved ? "Saved" : "Save payments"}
        </Button>
      </div>
    </div>
  );
}