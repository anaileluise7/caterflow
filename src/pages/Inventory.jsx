import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, RefreshCw, Package, Minus, AlertTriangle, Boxes } from "lucide-react";
import { Link } from "react-router-dom";
import InventoryReservations from "@/components/InventoryReservations";

const CATEGORIES = ["Furniture", "Glassware", "Tableware", "Linen", "Kitchen Equipment", "Other"];
const EMPTY = { name: "", category: "Furniture", total_quantity: 0, available_quantity: 0, unit: "pcs", low_stock_threshold: 0, notes: "" };

function statusOf(item) {
  const avail = item.available_quantity ?? 0;
  if (avail <= 0) return { label: "Out of stock", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
  if (item.low_stock_threshold && avail <= item.low_stock_threshold) return { label: "Low stock", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
  return { label: "In stock", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("stock");

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Inventory.list("-created_date", 500);
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const unsub = base44.entities.Inventory.subscribe(() => load());
    return unsub;
  }, []);

  const filtered = useMemo(() => filter === "All" ? items : items.filter(i => i.category === filter), [items, filter]);

  const stats = useMemo(() => {
    const total = items.length;
    const low = items.filter(i => (i.low_stock_threshold || 0) > 0 && (i.available_quantity ?? 0) <= (i.low_stock_threshold || 0) && (i.available_quantity ?? 0) > 0).length;
    const out = items.filter(i => (i.available_quantity ?? 0) <= 0).length;
    return { total, low, out };
  }, [items]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...EMPTY, ...m }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Inventory.update(editing.id, form);
      } else {
        await base44.entities.Inventory.create({
          ...form,
          available_quantity: form.available_quantity || form.total_quantity,
        });
      }
      setOpen(false);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name} from inventory?`)) return;
    try { await base44.entities.Inventory.delete(m.id); load(); }
    catch (err) { console.error(err); }
  };

  const adjust = async (item, delta) => {
    const next = Math.max(0, Math.min(item.total_quantity, (item.available_quantity ?? 0) + delta));
    try {
      const updated = await base44.entities.Inventory.update(item.id, { available_quantity: next });
      setItems(list => list.map(i => i.id === updated.id ? updated : i));
    } catch (err) { console.error(err); }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Inventory</h1>
              <p className="text-xs text-zinc-500">{items.length} item{items.length === 1 ? "" : "s"} tracked</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              <button onClick={() => setView("stock")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "stock" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Stock</button>
              <button onClick={() => setView("reservations")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "reservations" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Reservations</button>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">Dashboard</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={load} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" onClick={openAdd} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add item
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === "reservations" ? (
          <InventoryReservations inventory={items} />
        ) : (
        <>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs text-zinc-500">Items tracked</div>
            <div className="text-2xl font-semibold mt-0.5">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs text-zinc-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> Low stock</div>
            <div className="text-2xl font-semibold mt-0.5 text-amber-300">{stats.low}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs text-zinc-500">Out of stock</div>
            <div className="text-2xl font-semibold mt-0.5 text-rose-300">{stats.out}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          {["All", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filter === c ? "bg-zinc-800 text-white border border-zinc-700" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"}`}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <Package className="w-10 h-10 mb-3" />
            <p className="text-sm mb-4">No inventory items yet.</p>
            <Button size="sm" onClick={openAdd} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => {
              const st = statusOf(item);
              const pct = item.total_quantity > 0 ? Math.min(100, Math.round(((item.available_quantity ?? 0) / item.total_quantity) * 100)) : 0;
              return (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-100 truncate">{item.name}</h3>
                      <p className="text-xs text-zinc-500">{item.category}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs whitespace-nowrap ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-end justify-between mb-1">
                      <span className="text-xs text-zinc-500">Available</span>
                      <span className="text-sm text-zinc-200">{item.available_quantity ?? 0} / {item.total_quantity} {item.unit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-zinc-500">Adjust:</span>
                    <Button variant="outline" size="sm" onClick={() => adjust(item, -1)} className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-7 w-7 p-0"><Minus className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => adjust(item, 1)} className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-7 w-7 p-0"><Plus className="w-3.5 h-3.5" /></Button>
                  </div>
                  {item.notes && <p className="text-xs text-zinc-500 pt-3 border-t border-zinc-800 line-clamp-2">{item.notes}</p>}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white">
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(item)} className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit inventory item" : "Add inventory item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-400">Item name</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" placeholder="Chiavari chairs" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">Category</Label>
                <Select value={form.category} onValueChange={v => update("category", v)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-zinc-100 focus:bg-zinc-800">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400">Unit</Label>
                <Input value={form.unit} onChange={e => update("unit", e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" placeholder="pcs" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-zinc-400">Total qty</Label>
                <Input type="number" value={form.total_quantity} onChange={e => update("total_quantity", Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" />
              </div>
              <div>
                <Label className="text-zinc-400">Available</Label>
                <Input type="number" value={form.available_quantity} onChange={e => update("available_quantity", Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" />
              </div>
              <div>
                <Label className="text-zinc-400">Low-stock alert</Label>
                <Input type="number" value={form.low_stock_threshold} onChange={e => update("low_stock_threshold", Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400">Notes</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5 resize-none" placeholder="Storage location, condition…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700">Cancel</Button>
            </DialogClose>
            <Button onClick={save} disabled={saving || !form.name.trim()} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              {editing ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}