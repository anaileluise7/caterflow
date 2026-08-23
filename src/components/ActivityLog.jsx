import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Phone, Mail, Utensils, StickyNote } from "lucide-react";

const ENTRY_TYPES = ["Call", "Email", "Tasting", "Note"];

const TYPE_META = {
  Call: { icon: Phone, badge: "text-blue-300 bg-blue-500/15 border-blue-500/30" },
  Email: { icon: Mail, badge: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
  Tasting: { icon: Utensils, badge: "text-purple-300 bg-purple-500/15 border-purple-500/30" },
  Note: { icon: StickyNote, badge: "text-zinc-300 bg-zinc-500/15 border-zinc-500/30" },
};

function fmtTimestamp(d) {
  try {
    return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

export default function ActivityLog({ inquiryId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entryType, setEntryType] = useState("Note");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await base44.entities.ActivityLog.filter({ inquiry_id: inquiryId }, "-created_date", 200);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [inquiryId]);

  const add = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await base44.entities.ActivityLog.create({
        inquiry_id: inquiryId,
        entry_type: entryType,
        content: content.trim(),
      });
      setLogs(l => [created, ...l]);
      setContent("");
    } catch (err) {
      setError(err.message || "Could not save entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Activity Log</h3>

      <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3 space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {ENTRY_TYPES.map(t => <SelectItem key={t} value={t} className="text-zinc-100 focus:bg-zinc-800">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={add} disabled={saving || !content.trim()} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            Add
          </Button>
        </div>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Note a call, email, tasting feedback, or any follow-up..."
          className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[70px] resize-none"
        />
        {error && <div className="text-xs text-rose-400">{error}</div>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-sm text-zinc-500 italic py-6 text-center border border-dashed border-zinc-800 rounded-xl">
          No activity logged yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const meta = TYPE_META[log.entry_type] || TYPE_META.Note;
            const Icon = meta.icon;
            return (
              <div key={log.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${meta.badge}`}>
                    <Icon className="w-3 h-3" />
                    {log.entry_type}
                  </span>
                  <span className="text-xs text-zinc-500">{fmtTimestamp(log.created_date)}</span>
                </div>
                <div className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{log.content}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}