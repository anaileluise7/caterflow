import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Mail } from "lucide-react";

const EVENT_TYPES = ["General", "Wedding", "Corporate", "Birthday", "Private Dinner", "Cocktail Reception", "Other"];
const EMPTY = { name: "", subject: "", body: "", event_type: "General" };

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.EmailTemplate.list("-updated_date", 100);
      setTemplates(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.EmailTemplate.subscribe(() => load());
    return unsub;
  }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name || "", subject: t.subject || "", body: t.body || "", event_type: t.event_type || "General" }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.EmailTemplate.update(editing.id, form);
      } else {
        await base44.entities.EmailTemplate.create(form);
      }
      setOpen(false);
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try { await base44.entities.EmailTemplate.delete(t.id); load(); } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-400" />
            <h1 className="text-lg font-semibold">Email Templates</h1>
          </div>
          <Button onClick={openNew} size="sm" className="ml-auto bg-amber-600 hover:bg-amber-500 text-white">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New template
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <Mail className="w-10 h-10 mb-3" />
            <p className="text-sm">No templates yet. Create one to reuse when replying to inquiries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-zinc-100 truncate">{t.name}</h3>
                    <span className="text-xs text-zinc-500">{t.event_type || "General"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(t)} className="p-1.5 rounded-md text-zinc-400 hover:text-rose-300 hover:bg-rose-900/40"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="text-sm text-zinc-300 mt-2 truncate">{t.subject}</div>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-3 whitespace-pre-wrap">{t.body}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-zinc-400">Template name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="e.g. Initial response" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Event type</Label>
              <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {EVENT_TYPES.map(s => <SelectItem key={s} value={s} className="text-zinc-100 focus:bg-zinc-700">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Subject</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="Email subject" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Message body</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100 resize-y" placeholder="Hi {name}, thank you for your inquiry about your {event_type} on {event_date}..." />
              <p className="text-xs text-zinc-500 mt-1">Placeholders: {`{name}, {event_date}, {event_type}, {guest_count}, {venue}, {budget_per_head}, {email}, {phone}`}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700">Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-amber-600 hover:bg-amber-500 text-white">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {editing ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}