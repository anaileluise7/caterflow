import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Calendar, Users, MapPin, PoundSterling, Utensils, StickyNote, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-amber-700"><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
        <div className="text-sm text-stone-800 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function ProposalView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("getProposalByToken", { token });
        if (!active) return;
        if (res.data && res.data.error) setError(res.data.error);
        else setData(res.data);
      } catch (err) {
        if (active) setError(err.message || "Could not load proposal");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf7f0] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#fbf7f0] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-stone-900 mb-2">Proposal not found</h1>
          <p className="text-stone-600">This link may have expired or is no longer available. Please contact our team for assistance.</p>
        </div>
      </div>
    );
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-[#fbf7f0] text-stone-800">
      <header className="bg-gradient-to-b from-amber-50 to-[#fbf7f0] border-b border-amber-100/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium tracking-wide uppercase mb-5">
            <Sparkles className="w-3 h-3" /> Your Proposal
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 leading-tight mb-2">
            {data.name ? `Hello, ${data.name.split(" ")[0]}.` : "Your proposal"}
          </h1>
          <p className="text-stone-600">
            Here's a tailored proposal for your upcoming {data.event_type ? data.event_type.toLowerCase() : "event"}.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8">
          <h2 className="font-serif text-xl text-stone-900 mb-5">Event details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Detail icon={Calendar} label="Event date" value={fmtDate(data.event_date)} />
            <Detail icon={Users} label="Guest count" value={data.guest_count ? `${data.guest_count} guests` : "—"} />
            <Detail icon={MapPin} label="Venue" value={data.venue} />
            <Detail icon={PoundSterling} label="Budget per head" value={data.budget_per_head} />
          </div>
          {(data.dietary_requirements || data.additional_notes) && (
            <div className="mt-5 pt-5 border-t border-stone-100 space-y-4">
              {data.dietary_requirements && <Detail icon={Utensils} label="Dietary requirements" value={data.dietary_requirements} />}
              {data.additional_notes && <Detail icon={StickyNote} label="Additional notes" value={data.additional_notes} />}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8">
          <h2 className="font-serif text-xl text-stone-900 mb-5">Proposal summary</h2>
          {data.proposal ? (
            <div className="prose prose-stone prose-sm max-w-none">
              <ReactMarkdown>{data.proposal}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-stone-500 italic">Your proposal is being prepared — please check back shortly.</p>
          )}
        </section>

        <p className="text-center text-xs text-stone-400 pt-2">
          This proposal is preliminary and subject to final confirmation with our team.
        </p>
      </main>
    </div>
  );
}