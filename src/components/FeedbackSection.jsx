import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Check, UtensilsCrossed, StickyNote, MessageSquare } from "lucide-react";

export default function FeedbackSection({ inquiry, onUpdated }) {
  const [tasting, setTasting] = useState(inquiry.tasting_notes || "");
  const [special, setSpecial] = useState(inquiry.special_requests || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTasting(inquiry.tasting_notes || "");
    setSpecial(inquiry.special_requests || "");
  }, [inquiry.id, inquiry.tasting_notes, inquiry.special_requests]);

  const dirty = tasting !== (inquiry.tasting_notes || "") || special !== (inquiry.special_requests || "");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, {
        tasting_notes: tasting,
        special_requests: special,
      });
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Could not save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-zinc-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Client Feedback</h3>
      </div>
      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <Label className="text-zinc-400 flex items-center gap-1.5"><UtensilsCrossed className="w-3.5 h-3.5" /> Tasting Notes</Label>
          <Textarea
            value={tasting}
            onChange={e => setTasting(e.target.value)}
            rows={3}
            placeholder="Dishes sampled, preferences, likes and dislikes from the tasting…"
            className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5 resize-none"
          />
        </div>
        <div>
          <Label className="text-zinc-400 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" /> Special Client Requests</Label>
          <Textarea
            value={special}
            onChange={e => setSpecial(e.target.value)}
            rows={3}
            placeholder="Specific client asks — timings, presentation, surprises, must-haves…"
            className="bg-zinc-950 border-zinc-800 text-zinc-100 mt-1.5 resize-none"
          />
        </div>
        {error && <div className="text-sm text-rose-400">{error}</div>}
        <Button size="sm" onClick={save} disabled={saving || !dirty} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5 mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          {saved ? "Saved" : "Save notes"}
        </Button>
      </div>
    </div>
  );
}