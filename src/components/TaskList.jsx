import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, ListTodo } from "lucide-react";

const STATUSES = ["To Do", "In Progress", "Done"];

const STATUS_DOT = {
  "To Do": "bg-zinc-500",
  "In Progress": "bg-amber-400",
  "Done": "bg-emerald-400",
};

export default function TaskList({ inquiry }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.Task.filter({ inquiry_id: inquiry.id }, "due_date", 100);
      setTasks(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadMembers = async () => {
    try {
      const users = await base44.entities.User.list();
      setMembers(users);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    load();
    loadMembers();
    const unsub = base44.entities.Task.subscribe(() => load());
    return unsub;
  }, [inquiry.id]);

  const addTask = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Task.create({
        inquiry_id: inquiry.id,
        title: title.trim(),
        assignee: assignee || "",
        due_date: due || "",
        status: "To Do",
      });
      setTitle("");
      setAssignee("");
      setDue("");
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const setStatus = async (id, status) => {
    try {
      await base44.entities.Task.update(id, { status });
      load();
    } catch (err) { console.error(err); }
  };

  const remove = async (id) => {
    try {
      await base44.entities.Task.delete(id);
      load();
    } catch (err) { console.error(err); }
  };

  const memberLabel = (u) => u.full_name || u.email;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ListTodo className="w-4 h-4 text-zinc-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Team Tasks</h3>
        <span className="ml-auto text-xs text-zinc-500">{tasks.filter(t => t.status === "Done").length}/{tasks.length} done</span>
      </div>

      {/* Add task */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2 mb-3">
        <Input
          placeholder="New preparation duty (e.g. Order linens)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addTask(); }}
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
        />
        <div className="flex flex-wrap gap-2">
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger className="flex-1 min-w-[140px] bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue placeholder="Assign to" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {members.map(u => (
                <SelectItem key={u.id} value={memberLabel(u)} className="text-zinc-100 focus:bg-zinc-700">{memberLabel(u)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={due}
            onChange={e => setDue(e.target.value)}
            className="flex-1 min-w-[140px] bg-zinc-800 border-zinc-700 text-zinc-100"
          />
          <Button size="sm" onClick={addTask} disabled={saving || !title.trim()} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
            Add
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 italic py-4 text-center border border-dashed border-zinc-800 rounded-lg">No tasks assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <Select value={t.status} onValueChange={v => setStatus(t.id, v)}>
                <SelectTrigger className="w-[130px] bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[t.status] || "bg-zinc-500"}`} />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="text-zinc-100 focus:bg-zinc-700">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${t.status === "Done" ? "line-through text-zinc-500" : "text-zinc-100"}`}>{t.title}</div>
                <div className="text-xs text-zinc-500 flex gap-2">
                  {t.assignee && <span>{t.assignee}</span>}
                  {t.due_date && <span>· due {new Date(t.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                </div>
              </div>
              <button onClick={() => remove(t.id)} className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}