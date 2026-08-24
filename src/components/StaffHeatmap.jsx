import React, { useMemo } from "react";
import { UtensilsCrossed, ListTodo, AlertTriangle } from "lucide-react";

function heatLevel(value, max) {
  if (max <= 0 || value === 0) return 0;
  const r = value / max;
  if (r >= 0.75) return 3;
  if (r >= 0.4) return 2;
  return 1;
}

const HEAT = {
  0: "bg-zinc-900 border-zinc-800",
  1: "bg-emerald-500/10 border-emerald-500/30",
  2: "bg-amber-500/15 border-amber-500/40",
  3: "bg-rose-500/20 border-rose-500/40",
};

export default function StaffHeatmap({ staff, tasks }) {
  const rows = useMemo(() => {
    const data = staff.map(m => {
      const mine = tasks.filter(t => t.assignee === m.name);
      const eventIds = new Set(mine.map(t => t.inquiry_id).filter(Boolean));
      const open = mine.filter(t => t.status !== "Done").length;
      return { member: m, events: eventIds.size, tasks: mine.length, open };
    });
    const max = Math.max(1, ...data.map(d => d.events + d.open));
    return data
      .map(d => ({ ...d, score: d.events + d.open, level: heatLevel(d.events + d.open, max) }))
      .sort((a, b) => b.score - a.score);
  }, [staff, tasks]);

  const totalEvents = useMemo(() => {
    const s = new Set();
    tasks.forEach(t => { if (t.assignee && t.inquiry_id) s.add(t.inquiry_id); });
    return s.size;
  }, [tasks]);

  const avg = staff.length ? rows.reduce((a, b) => a + b.score, 0) / staff.length : 0;
  const heaviest = rows[0];
  const lightest = rows[rows.length - 1];
  const imbalanced = rows.length > 1 && heaviest && lightest && heaviest.score > 0 && lightest.score < heaviest.score;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Light</span>
          <span className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/30" />
          <span className="w-5 h-5 rounded bg-amber-500/15 border border-amber-500/40" />
          <span className="w-5 h-5 rounded bg-rose-500/20 border border-rose-500/40" />
          <span>Heavy</span>
        </div>
        <div className="text-xs text-zinc-500">
          {totalEvents} event{totalEvents === 1 ? "" : "s"} assigned · avg {avg.toFixed(1)} pts/member
        </div>
      </div>

      {rows.length === 0 || rows.every(r => r.score === 0) ? (
        <div className="text-center py-16 text-zinc-500 text-sm">No tasks assigned yet — assign duties to see workload distribution.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {rows.map(({ member, events, open, score, level }) => (
            <div key={member.id} className={`rounded-xl border p-4 ${HEAT[level]}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold truncate text-zinc-100">{member.name}</h3>
                <span className="text-2xl font-bold leading-none text-zinc-100">{score}</span>
              </div>
              <p className="text-xs text-zinc-400 truncate mb-3">{member.role || "—"}</p>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {events} event{events === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" /> {open} open</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {imbalanced && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong className="text-amber-100">{heaviest.member.name}</strong> has the heaviest workload ({heaviest.score} pts). Consider rebalancing toward {lightest.member.name} ({lightest.score} pts).</span>
        </div>
      )}
    </div>
  );
}