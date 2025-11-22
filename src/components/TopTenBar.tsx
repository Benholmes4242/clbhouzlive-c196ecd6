import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useMemo, useState } from "react";
import { useTopTen, Course } from "@/context/TopTenContext";
import { toast } from "sonner";

type SlotId = `slot-${number}`;

const slotId = (i: number): SlotId => `slot-${i}`;

export const TopTenBar: React.FC = () => {
  const { topTen, moveCourse, removeCourse, addCourseAtIndex, isInTopTen } = useTopTen();
  
  // Debug logging
  console.log("TopTenBar topTen state:", topTen);
  console.log("TopTenBar filled courses:", topTen.filter(Boolean));
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 8, // Start dragging after moving 8px
      }
    })
  );

  const items = useMemo(() => topTen.map((_, i) => slotId(i)), [topTen]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const addCourseIntoSlot = (course: Course, toIndex: number) => {
    if (isInTopTen(course.id)) {
      toast.error("Already in your Top 10");
      return;
    }
    addCourseAtIndex(course, toIndex);
    toast.success(`Added ${course.name} to position ${toIndex + 1}`);
  };

  const onDragStart = (e: DragStartEvent) => {
    if (String(e.active.id).startsWith("slot-")) {
      const idx = parseInt(String(e.active.id).replace("slot-", ""), 10);
      setActiveIndex(Number.isFinite(idx) ? idx : null);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveIndex(null);
    
    if (!over) return;

    // Case A: reordering inside bar
    if (String(active.id).startsWith("slot-") && String(over.id).startsWith("slot-")) {
      const from = parseInt(String(active.id).replace("slot-", ""), 10);
      const to = parseInt(String(over.id).replace("slot-", ""), 10);
      if (Number.isFinite(from) && Number.isFinite(to)) {
        moveCourse(from, to);
      }
      return;
    }

    // Case B: dragging from course grid into a slot
    const payload = (active.data.current as any)?.course as Course | undefined;
    if (payload && String(over.id).startsWith("slot-")) {
      const to = parseInt(String(over.id).replace("slot-", ""), 10);
      if (Number.isFinite(to)) {
        addCourseIntoSlot(payload, to);
      }
    }
  };

  return (
    <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="text-body-md font-semibold text-foreground">Your Top 10</div>
        <div className="text-meta text-muted-foreground">Drag to reorder • Tap ✕ to remove</div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <ol className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {topTen.map((course, i) => (
              <TopTenSlot 
                key={slotId(i)} 
                id={slotId(i)} 
                index={i} 
                course={course} 
                onRemove={() => removeCourse(i)} 
              />
            ))}
          </ol>
        </SortableContext>

        <DragOverlay>
          {activeIndex != null && topTen[activeIndex] ? (
            <GhostCard course={topTen[activeIndex]!} index={activeIndex} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

const TopTenSlot: React.FC<{
  id: SlotId;
  index: number;
  course?: Course;
  onRemove: () => void;
}> = ({ id, index, course, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!course) {
    return (
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-body-md text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        {index + 1}
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative h-24 rounded-xl overflow-hidden shadow-sm ring-1 ring-border bg-card flex flex-col cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="w-full h-12 shrink-0 bg-muted">
        {course.thumbnail_image ? (
          <img src={course.thumbnail_image} alt="" className="w-full h-12 object-cover" />
        ) : (
          <div className="w-full h-12 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
        )}
      </div>
      <div className="px-2 py-1 flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-meta font-semibold text-foreground leading-tight">
          {index + 1}. {course.name}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground w-5 h-5 text-meta shadow-sm hover:bg-destructive/80 flex items-center justify-center z-10 rounded-full"
        aria-label="Remove"
      >
        ✕
      </button>
    </li>
  );
};

const GhostCard: React.FC<{ course: Course; index: number }> = ({ course, index }) => (
  <div className="h-24 w-38 rounded-xl shadow-lg bg-card border border-border flex flex-col opacity-90">
    <div className="w-full h-12 bg-muted">
      {course.thumbnail_image ? (
        <img src={course.thumbnail_image} alt="" className="w-full h-12 object-cover" />
      ) : (
        <div className="w-full h-12 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        </div>
      )}
    </div>
    <div className="px-2 py-1 flex-1 min-w-0 flex flex-col justify-center">
      <div className="text-meta font-semibold text-foreground leading-tight">
        {index + 1}. {course.name}
      </div>
    </div>
  </div>
);