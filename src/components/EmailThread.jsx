import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, Send } from "lucide-react";

function fmtTime(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

export default function EmailThread({ inquiry }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.EmailMessage.filter({ inquiry_id: inquiry.id }, "created_date", 200);
      setMessages(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.EmailMessage.subscribe(() => load());
    return unsub;
  }, [inquiry.id]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-zinc-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email History</h3>
        <span className="ml-auto text-xs text-zinc-500">{messages.length} {messages.length === 1 ? "message" : "messages"}</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-zinc-500 italic py-4 text-center border border-dashed border-zinc-800 rounded-lg">No emails sent to this client yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map(m => (
            <div key={m.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-medium text-zinc-300 truncate">{m.subject}</span>
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap">{fmtTime(m.created_date)}</span>
              </div>
              {m.kind === "Proposal" && (
                <span className="inline-block text-[10px] uppercase tracking-wide text-amber-400/80 mb-1">Proposal</span>
              )}
              <div className="text-sm text-zinc-400 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">{m.body}</div>
              <div className="text-xs text-zinc-600 mt-2">To: {m.recipient}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}