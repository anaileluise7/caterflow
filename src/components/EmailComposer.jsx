import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Check } from "lucide-react";

function fill(text, inquiry) {
  if (!text) return "";
  return text.replace(/\{(\w+)\}/g, (_m, key) => {
    const v = inquiry[key];
    return v == null ? "" : String(v);
  });
}

export default function EmailComposer({ inquiry }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = () => base44.entities.EmailTemplate.list("-updated_date", 100).then(d => mounted && setTemplates(d)).catch(() => {});
    load().finally(() => mounted && setLoading(false));
    const unsub = base44.entities.EmailTemplate.subscribe(load);
    return () => { mounted = false; unsub && unsub(); };
  }, []);

  const chooseTemplate = (id) => {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    setSelectedId(id);
    setSubject(fill(t.subject, inquiry));
    setBody(fill(t.body, inquiry));
    setSent(false);
    setError("");
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { setError("Subject and message are required"); return; }
    if (!inquiry.email) { setError("This inquiry has no client email address"); return; }
    setSending(true);
    setSent(false);
    setError("");
    try {
      await base44.functions.invoke("sendInquiryEmail", { inquiry_id: inquiry.id, subject, body });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Reply to Client</h3>
      <div className="space-y-3 bg-zinc-800/50 border border-zinc-800 rounded-xl p-4">
        <div>
          <Label className="text-xs text-zinc-400">Template</Label>
          <Select value={selectedId} onValueChange={chooseTemplate}>
            <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue placeholder={loading ? "Loading templates..." : templates.length === 0 ? "No templates yet — create some on the Templates page" : "Choose a template"} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-zinc-100 focus:bg-zinc-700">
                  {t.name} <span className="text-zinc-500 ml-1">· {t.event_type || "General"}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Subject</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="Email subject" />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Message</Label>
          <Textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100 resize-y" placeholder="Write your message... (use {name}, {event_date}, {event_type}, {guest_count}, {venue})" />
        </div>
        {error && <div className="text-sm text-rose-400">{error}</div>}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={send} disabled={sending || !inquiry.email} className="bg-amber-600 hover:bg-amber-500 text-white">
            {sending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : sent ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            {sent ? "Sent" : "Send message"}
          </Button>
          {!inquiry.email && <span className="text-xs text-zinc-500">No client email on file</span>}
        </div>
      </div>
    </div>
  );
}