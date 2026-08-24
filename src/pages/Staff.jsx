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
import { Loader2, Plus, Pencil, Trash2, RefreshCw, Users, Mail, Phone, Briefcase, UtensilsCrossed, ListTodo, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import StaffCalendar from "@/components/StaffCalendar";
import StaffHeatmap from "@/components/StaffHeatmap";

const STATUSES = ["Active", "On Leave", "Inactive"];
const STATUS_STYLES = {
  "Active": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "On Leave": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Inactive": "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const EMPTY = { name: "", role: "", email: "", phone: "", status: "Active", notes: "" };

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
  catch { return d; }
}

function isOverdue(d) {
  if (!d) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(d + "T00:00:00") < today;
}

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("directory");
  const [inquiries, setInquiries] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t, i] = await Promise.all([
        base44.entities.Staff.list("-created_date", 200),
        base44.entities.Task.list("-created_date", 500),
        base44.entities.CateringInquiry.list("-created_date", 500),
      ]);
      setStaff(s);
      setTasks(t);
      setInquiries(i);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const unsubS = base44.entities.Staff.subscribe(() => load());
    const unsubT = base44.entities.Task.subscribe(() => load());
    return () => { unsubS(); unsubT(); };
  }, []);

  const taskCounts = useMemo(() => {
    const c = {};
    for (const t of tasks) {
      if (t.assignee) c[t.assignee] = (c[t.assignee] || 0) + 1;
    }
    return c;
  }, [tasks]);

  const inquiryMap = useMemo(() => {
    const m = {};
    for (const i of inquiries) m[i.id] = i;
    return m;
  }, [inquiries]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...EMPTY, ...m }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Staff.update(editing.id, form);
      } else {
        await base44.entities.Staff.create(form);
      }
      setOpen(false);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name} from the directory?`)) return;
    try { await base44.entities.Staff.delete(m.id); load(); }
    catch (err) { console.error(err); }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Staff Directory</h1>
              <p className="text-xs text-zinc-500">{staff.length} team {staff.length === 1 ? "member" : "members"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              <button onClick={() => setView("directory")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "directory" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Directory</button>
              <button onClick={() => setView("tasks")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "tasks" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Tasks</button>
              <button onClick={() => setView("calendar")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "calendar" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Calendar</button>
              <button onClick={() => setView("workload")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === "workload" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Workload</button>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">Dashboard</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={load} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" onClick={openAdd} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add member
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <Users className="w-10 h-10 mb-3" />
            <p className="text-sm mb-4">No team members yet.</p>
            <Button size="sm" onClick={openAdd} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add member
            </Button>
          </div>
        ) : view === "tasks" ? (
          <div className="space-y-5">
            {staff.map(m => {
              const pending = tasks
                .filter(t => t.assignee === m.name && t.status !== "Done")
                .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
              return (
                <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-100 truncate">{m.name}</h3>
                      <p className="text-xs text-zinc-500">{m.role || "—"}</p>
                    </div>
                    <span className="text-xs text-zinc-400 whitespace-nowrap">{pending.length} pending</span>
                  </div>
                  {pending.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No pending duties</p>
                  ) : (
                    <ul className="space-y-2">
                      {pending.map(t => {
                        const inq = inquiryMap[t.inquiry_id];
                        const overdue = isOverdue(t.due_date);
                        return (
                          <li key={t.id} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${t.status === "In Progress" ? "bg-amber-400" : "bg-zinc-500"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-zinc-100">{t.title}</div>
                              <div className="text-xs text-zinc-500 flex flex-wrap gap-x-2 gap-y-0.5">
                                {inq && <span className="truncate">{inq.name} · {fmtDate(inq.event_date)}</span>}
                                {t.due_date && <span className={overdue ? "text-rose-400" : ""}>due {fmtDate(t.due_date)}{overdue ? " · overdue" : ""}</span>}
                                <span>{t.status}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ) : view === "calendar" ? (
          <StaffCalendar staff={staff} tasks={tasks} inquiries={inquiries} />
        ) : view === "workload" ? (
          <StaffHeatmap staff={staff} tasks={tasks} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map(m => (
              <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-100 truncate">{m.name}</h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><Briefcase className="w-3 h-3" />{m.role || "—"}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs whitespace-nowrap ${STATUS_STYLES[m.status] || STATUS_STYLES.Active}`}>{m.status}</span>
                </div>
                <div className="space-y-1.5 text-sm text-zinc-400 flex-1">
                  {m.email && <div className="flex items-center gap-2 min-w-0"><Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" /><span className="truncate">{m.email}</span></div>}
                  {m.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />{m.phone}</div>}
                  <div className="flex items-center gap-2"><UtensilsCrossed className="w-3.5 h-3.5 text-zinc-600 shrink-0" />{taskCounts[m.name] || 0} assigned task{(taskCounts[m.name] || 0) === 1 ? "" : "s"}</div>
                </div>
                {m.notes && <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-800 line-clamp-2">{m.notes}</p>}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                  <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white">
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(m)} className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit team member" : "Add team member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-400">Name</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" placeholder="Jane Doe" />
            </div>
            <div>
              <Label className="text-zinc-400">Role</Label>
              <Input value={form.role} onChange={e => update("role", e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" placeholder="Head Chef" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">Email</Label>
                <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" placeholder="jane@saffronsage.com" />
              </div>
              <div>
                <Label className="text-zinc-400">Phone</Label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5" placeholder="07123 456789" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400">Status</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="text-zinc-100 focus:bg-zinc-800">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400">Notes</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5 resize-none" placeholder="Skills, availability, allergies…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700">Cancel</Button>
            </DialogClose>
            <Button onClick={save} disabled={saving || !form.name.trim()} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              {editing ? "Save changes" : "Add member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}