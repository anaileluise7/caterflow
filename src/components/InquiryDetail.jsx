import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { X, Loader2, RefreshCw, Calendar, Users, MapPin, Mail, Phone, PoundSterling, Utensils, StickyNote } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { StatusBadge } from "@/components/StatusBadge";

const STATUSES = ["New", "Quoted", "Tasting Booked", "Confirmed", "Declined"];

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-zinc-500"><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
        <div className="text-sm text-zinc-100 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function InquiryDetail({ inquiry, onClose, onUpdated }) {
  const [status, setStatus] = useState(inquiry.status);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  const saveStatus = async (newStatus) => {
    setStatus(newStatus);
    try {
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, { status: newStatus });
      onUpdated(updated);
    } catch (err) {
      setError(err.message || "Could not update status");
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateProposal", {
        name: inquiry.name,
        event_date: inquiry.event_date,
        event_type: inquiry.event_type,
        guest_count: inquiry.guest_count,
        venue: inquiry.venue,
        budget_per_head: inquiry.budget_per_head,
        dietary_requirements: inquiry.dietary_requirements,
        additional_notes: inquiry.additional_notes,
      });
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, { proposal: res.data.proposal });
      onUpdated(updated);
    } catch (err) {
      setError(err.message || "Could not regenerate proposal");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{inquiry.name}</h2>
            <p className="text-sm text-zinc-400">{inquiry.event_type} · {inquiry.event_date}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status + regenerate */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-zinc-500">Status</span>
              <Select value={status} onValueChange={saveStatus}>
                <SelectTrigger className="w-[170px] bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="text-zinc-100 focus:bg-zinc-700">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Inquiry details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Inquiry Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field icon={Calendar} label="Event Date" value={inquiry.event_date} />
              <Field icon={Users} label="Guest Count" value={inquiry.guest_count} />
              <Field icon={MapPin} label="Venue" value={inquiry.venue} />
              <Field icon={PoundSterling} label="Budget / Head" value={inquiry.budget_per_head} />
              <Field icon={Mail} label="Email" value={inquiry.email} />
              <Field icon={Phone} label="Phone" value={inquiry.phone} />
            </div>
            <div className="mt-5 space-y-5">
              <Field icon={Utensils} label="Dietary Requirements" value={inquiry.dietary_requirements} />
              <Field icon={StickyNote} label="Additional Notes" value={inquiry.additional_notes} />
            </div>
          </div>

          {/* Proposal */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Generated Proposal</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerate}
                disabled={regenerating}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
              >
                {regenerating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                Regenerate
              </Button>
            </div>
            {error && (
              <div className="text-sm text-rose-400 mb-3">{error}</div>
            )}
            {regenerating ? (
              <div className="flex items-center justify-center py-16 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : inquiry.proposal ? (
              <div className="prose prose-invert prose-sm max-w-none bg-zinc-800/50 border border-zinc-800 rounded-xl p-5">
                <ReactMarkdown>{inquiry.proposal}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-sm text-zinc-500 italic py-8 text-center border border-dashed border-zinc-800 rounded-xl">
                No proposal yet. Click "Regenerate" to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}