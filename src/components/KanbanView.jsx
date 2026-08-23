import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Users, Calendar, UtensilsCrossed } from "lucide-react";

const COLUMNS = ["New", "Quoted", "Tasting Booked", "Confirmed", "Declined"];

const COLUMN_ACCENT = {
  "New": "border-t-blue-500",
  "Quoted": "border-t-amber-500",
  "Tasting Booked": "border-t-purple-500",
  "Confirmed": "border-t-emerald-500",
  "Declined": "border-t-rose-500",
};

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

export default function KanbanView({ inquiries, onUpdated, onSelect }) {
  const columns = COLUMNS.reduce((acc, s) => {
    acc[s] = inquiries.filter(i => i.status === s);
    return acc;
  }, {});

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    const moved = columns[source.droppableId]?.[source.index];
    if (!moved) return;
    try {
      const updated = await base44.entities.CateringInquiry.update(moved.id, { status: destination.droppableId });
      onUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {COLUMNS.map(col => (
          <div key={col} className="w-64 shrink-0">
            <div className={`rounded-xl border border-zinc-800 bg-zinc-900 border-t-2 ${COLUMN_ACCENT[col]} overflow-hidden flex flex-col max-h-[calc(100vh-220px)]`}>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
                <span className="text-sm font-medium text-zinc-200">{col}</span>
                <span className="text-xs text-zinc-400 bg-zinc-800 rounded-full px-2 py-0.5">{columns[col].length}</span>
              </div>
              <Droppable droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto transition ${snapshot.isDraggingOver ? "bg-zinc-800/50" : ""}`}
                  >
                    {columns[col].map((i, index) => (
                      <Draggable key={i.id} draggableId={i.id} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            onClick={() => onSelect(i)}
                            className={`rounded-lg border border-zinc-800 bg-zinc-950 p-3 cursor-pointer hover:border-zinc-600 transition ${snap.isDragging ? "shadow-2xl ring-1 ring-amber-500/50" : ""}`}
                          >
                            <div className="font-medium text-sm text-zinc-100 truncate">{i.name}</div>
                            <div className="mt-2 space-y-1 text-xs text-zinc-400">
                              <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 shrink-0" />{fmtDate(i.event_date)}</div>
                              <div className="flex items-center gap-1.5"><UtensilsCrossed className="w-3 h-3 shrink-0" />{i.event_type}</div>
                              <div className="flex items-center gap-1.5"><Users className="w-3 h-3 shrink-0" />{i.guest_count} guests</div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {columns[col].length === 0 && (
                      <div className="text-xs text-zinc-600 text-center py-6 border border-dashed border-zinc-800 rounded-lg">Drop here</div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}