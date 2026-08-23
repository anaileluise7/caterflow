import React from "react";
import ReactMarkdown from "react-markdown";
import { X, Eye, Calendar, Users, MapPin } from "lucide-react";

const CLIENT_STATUS = {
  "New Inquiry": "We've received your inquiry",
  "Quoted": "Proposal sent",
  "Tasting Booked": "Tasting scheduled",
  "Confirmed": "Booking confirmed",
  "Invoiced": "Invoice sent",
  "Paid": "Payment received",
  "Completed": "Event completed",
  "Declined": "On hold",
};

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}

export default function ClientPreviewModal({ inquiry, onClose }) {
  const clientStatus = CLIENT_STATUS[inquiry.status] || inquiry.status;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-800">Client Preview</h2>
            <span className="text-xs text-stone-400">· Read-only</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Saffron &amp; Sage</span>
              </div>
              <h3 className="text-lg font-semibold text-stone-800">Your Catering Proposal</h3>
              <p className="text-sm text-stone-500">Hi {inquiry.name || "there"}, here's an update on your event.</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-stone-400">Status</span>
                <span className="text-sm font-medium text-stone-700">{clientStatus}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-stone-600"><Calendar className="w-4 h-4 text-stone-400" /> {fmtDate(inquiry.event_date)}</div>
                <div className="flex items-center gap-2 text-stone-600"><Users className="w-4 h-4 text-stone-400" /> {inquiry.guest_count || "—"} guests</div>
                <div className="flex items-center gap-2 text-stone-600"><MapPin className="w-4 h-4 text-stone-400" /> {inquiry.venue || "—"}</div>
              </div>
              <div className="border-t border-stone-200 pt-4">
                {inquiry.proposal ? (
                  <div className="prose prose-stone prose-sm max-w-none">
                    <ReactMarkdown>{inquiry.proposal}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 italic">No proposal has been generated yet.</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-4 text-center">This is how the client will see your proposal and current status.</p>
        </div>
      </div>
    </div>
  );
}