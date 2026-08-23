import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BellRing, Phone } from "lucide-react";

export default function FollowUpReminder({ inquiry, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const todayStr = new Date().toLocaleDateString("en-CA");
  const due =
    inquiry.follow_up_date &&
    inquiry.follow_up_date <= todayStr &&
    !["Completed", "Declined"].includes(inquiry.status);

  const save = async (value) => {
    setSaving(true);
    try {
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, {
        follow_up_date: value || null,
      });
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Follow-up Reminder</h3>
      </div>

      {due && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <Phone className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-200">
            <span className="font-medium">Time to call {inquiry.name.split(" ")[0]}.</span>
            <span className="block text-amber-300/80 text-xs mt-0.5">
              Follow-up was due {inquiry.follow_up_date}. Give them a ring{inquiry.phone ? ` at ${inquiry.phone}` : ""}.
            </span>
          </div>
        </div>
      )}

      <div>
        <Label className="text-zinc-400 text-xs mb-1.5 block">Follow-up date</Label>
        <Input
          type="date"
          defaultValue={inquiry.follow_up_date || ""}
          disabled={saving}
          onBlur={(e) => {
            if (e.target.value !== (inquiry.follow_up_date || "")) save(e.target.value);
          }}
          className="bg-zinc-900 border-zinc-700 text-zinc-100"
        />
      </div>
    </div>
  );
}