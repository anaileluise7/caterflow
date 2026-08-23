import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, Sparkles, Calendar, Users, MapPin, Mail, Phone, PoundSterling, Utensils, StickyNote, UtensilsCrossed } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Private Dinner", "Cocktail Reception", "Other"];

function FormField({ icon: Icon, label, children, required }) {
  return (
    <div>
      <Label className="flex items-center gap-1.5 text-stone-700 mb-1.5 text-sm font-medium">
        <Icon className="w-3.5 h-3.5 text-amber-700" />
        {label}{required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function InquiryForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", event_date: "", event_type: "",
    guest_count: "", venue: "", budget_per_head: "", dietary_requirements: "", additional_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        guest_count: Number(form.guest_count) || 0,
        status: "New Inquiry",
      };
      const created = await base44.entities.CateringInquiry.create(payload);
      const res = await base44.functions.invoke("generateProposal", payload);
      const updated = await base44.entities.CateringInquiry.update(created.id, {
        proposal: res.data.proposal,
        status: "Quoted",
      });
      setResult(updated);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#fbf7f0] text-stone-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 mb-2">Thank you, {result.name.split(" ")[0]}.</h1>
            <p className="text-stone-600">Your inquiry is in. Here's a first proposal from our team — we'll be in touch shortly to refine it together.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 mb-6">
            <div className="prose prose-stone prose-sm max-w-none">
              <ReactMarkdown>{result.proposal}</ReactMarkdown>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => { setResult(null); setForm({ name: "", email: "", phone: "", event_date: "", event_type: "", guest_count: "", venue: "", budget_per_head: "", dietary_requirements: "", additional_notes: "" }); }}
              className="border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Submit another inquiry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7f0] text-stone-800">
      {/* Hero */}
      <header className="bg-gradient-to-b from-amber-50 to-[#fbf7f0] border-b border-amber-100/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium tracking-wide uppercase mb-5">
            <Sparkles className="w-3 h-3" /> Catering Inquiries
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 leading-tight mb-3">
            Let's craft something <span className="italic text-amber-700">delicious</span>.
          </h1>
          <p className="text-stone-600 max-w-md mx-auto">
            Tell us about your event and our team will prepare a tailored proposal — usually within moments.
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField icon={Mail} label="Full Name" required>
              <Input required value={form.name} onChange={e => update("name", e.target.value)} placeholder="Jane Doe" className="bg-stone-50 border-stone-200 focus:border-amber-400" />
            </FormField>
            <FormField icon={Mail} label="Email" required>
              <Input type="email" required value={form.email} onChange={e => update("email", e.target.value)} placeholder="jane@email.com" className="bg-stone-50 border-stone-200 focus:border-amber-400" />
            </FormField>
            <FormField icon={Phone} label="Phone">
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="07123 456789" className="bg-stone-50 border-stone-200 focus:border-amber-400" />
            </FormField>
            <FormField icon={Calendar} label="Event Date" required>
              <Input type="date" required value={form.event_date} onChange={e => update("event_date", e.target.value)} className="bg-stone-50 border-stone-200 focus:border-amber-400" />
            </FormField>
            <FormField icon={UtensilsCrossed} label="Event Type" required>
              <Select required value={form.event_type} onValueChange={v => update("event_type", v)}>
                <SelectTrigger className="bg-stone-50 border-stone-200 focus:border-amber-400">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField icon={Users} label="Guest Count" required>
              <Input type="number" min="1" required value={form.guest_count} onChange={e => update("guest_count", e.target.value)} placeholder="80" className="bg-stone-50 border-stone-200 focus:border-amber-400" />
            </FormField>
            <FormField icon={MapPin} label="Venue / Location">
              <Input value={form.venue} onChange={e => update("venue", e.target.value)} placeholder="The Old Barn, Surrey" className="bg-stone-50 border-stone-200 focus:border-amber-400" />
            </FormField>
            <FormField icon={PoundSterling} label="Budget Per Head">
              <Input value={form.budget_per_head} onChange={e => update("budget_per_head", e.target.value)} placeholder="£45–£60" className="bg-stone-50 border-stone-200 focus:border-amber-400" />
            </FormField>
          </div>

          <FormField icon={Utensils} label="Dietary Requirements">
            <Textarea value={form.dietary_requirements} onChange={e => update("dietary_requirements", e.target.value)} placeholder="e.g. 2 vegetarian, 1 vegan, nut allergy" rows={2} className="bg-stone-50 border-stone-200 focus:border-amber-400 resize-none" />
          </FormField>

          <FormField icon={StickyNote} label="Additional Notes">
            <Textarea value={form.additional_notes} onChange={e => update("additional_notes", e.target.value)} placeholder="Anything else we should know — theme, timings, favourite cuisines…" rows={3} className="bg-stone-50 border-stone-200 focus:border-amber-400 resize-none" />
          </FormField>

          {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">{error}</div>}

          <Button type="submit" disabled={submitting} className="w-full bg-stone-900 hover:bg-stone-800 text-white h-12 text-base">
            {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing your proposal…</>) : (<>Request Proposal</>)}
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-stone-400">
          <Link to="/dashboard" className="hover:text-stone-600 transition">Staff dashboard →</Link>
        </div>
      </main>
    </div>
  );
}