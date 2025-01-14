import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { addDays, differenceInDays, format, startOfDay } from "date-fns";
import { useState } from "react";

import { api } from "~/trpc/react";

import type { Task } from "@prisma/client";

type GanttTaskProps = {
  task: Task;
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
  onResizeStart: (edge: "left" | "right") => void;
  onResizeMove: (dx: number) => void;
  onResizeEnd: () => void;
  previewOffset?: number;
  previewDuration?: number;
};

function GanttTask({
  task,
  startDate,
  daysToShow,
  dayWidth,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  previewOffset,
  previewDuration,
}: GanttTaskProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.task_id,
  });

  const taskStartDate = task.start_date
    ? startOfDay(task.start_date)
    : startOfDay(new Date());
  const taskDuration = task.duration ?? 1;

  const leftOffset =
    Math.max(0, differenceInDays(taskStartDate, startDate)) * dayWidth +
    (previewOffset ?? 0);
  const width = Math.min(
    (previewDuration ?? taskDuration) * dayWidth,
    daysToShow * dayWidth - leftOffset,
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    width: `${width}px`,
    left: `${leftOffset}px`,
  };

  const handleMouseMove = (e: React.MouseEvent, edge: "left" | "right") => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const dx = e.clientX - (edge === "left" ? rect.left : rect.right);
    onResizeMove(dx);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="absolute flex h-8 cursor-grab items-center rounded-md bg-blue-500 px-2 text-white shadow-sm"
    >
      <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {task.title}
      </div>
      <div
        className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
        onMouseDown={() => onResizeStart("left")}
        onMouseMove={(e) => handleMouseMove(e, "left")}
        onMouseUp={onResizeEnd}
      />
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
        onMouseDown={() => onResizeStart("right")}
        onMouseMove={(e) => handleMouseMove(e, "right")}
        onMouseUp={onResizeEnd}
      />
    </div>
  );
}

function GanttHeader({
  startDate,
  daysToShow,
  dayWidth,
}: {
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
}) {
  return (
    <div className="relative h-8 border-b">
      {Array.from({ length: daysToShow }).map((_, index) => {
        const date = addDays(startDate, index);
        return (
          <div
            key={index}
            className="absolute border-r px-2 text-sm"
            style={{ left: index * dayWidth, width: dayWidth }}
          >
            {format(date, "MMM d")}
          </div>
        );
      })}
    </div>
  );
}

function GanttGrid({
  daysToShow,
  dayWidth,
  children,
}: {
  daysToShow: number;
  dayWidth: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {Array.from({ length: daysToShow }).map((_, index) => (
        <div
          key={index}
          className="absolute h-full border-r border-gray-200"
          style={{ left: index * dayWidth }}
        />
      ))}
      {children}
    </div>
  );
}

export function TaskGanttChart({ tasks }: { tasks: Task[] }) {
  const [startDate] = useState(() => startOfDay(new Date()));
  const [daysToShow] = useState(30);
  const [dayWidth] = useState(80);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<"left" | "right" | null>(null);
  const [previewOffset, setPreviewOffset] = useState(0);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);

  const updateTask = api.task.updateTask.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!isResizing) {
      setActiveId(event.active.id as number);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);
    setPreviewOffset(0);

    if (!active || isResizing) {
      return;
    }

    const task = tasks.find((t) => t.task_id === active.id);
    if (!task) {
      return;
    }

    const daysDelta = Math.round(delta.x / dayWidth);
    const newStartDate = task.start_date
      ? addDays(task.start_date, daysDelta)
      : addDays(new Date(), daysDelta);

    await updateTask.mutateAsync({
      taskId: task.task_id,
      data: {
        start_date: newStartDate,
      },
    });
  };

  const handleResizeStart = (edge: "left" | "right") => {
    setIsResizing(true);
    setResizeEdge(edge);
  };

  const handleResizeMove = (dx: number) => {
    if (!isResizing || !resizeEdge) {
      return;
    }

    const daysChange = Math.round(dx / dayWidth);

    if (resizeEdge === "left") {
      setPreviewOffset(daysChange * dayWidth);
      const task = tasks.find((t) => t.task_id === activeId);
      if (task) {
        setPreviewDuration((task.duration ?? 1) - daysChange);
      }
    } else {
      const task = tasks.find((t) => t.task_id === activeId);
      if (task) {
        setPreviewDuration((task.duration ?? 1) + daysChange);
      }
    }
  };

  const handleResizeEnd = async () => {
    setIsResizing(false);
    setResizeEdge(null);

    if (activeId) {
      const task = tasks.find((t) => t.task_id === activeId);
      if (task && previewDuration !== null) {
        await updateTask.mutateAsync({
          taskId: task.task_id,
          data: {
            duration: Math.max(1, previewDuration),
            ...(resizeEdge === "left" && task.start_date
              ? {
                  start_date: addDays(
                    task.start_date,
                    Math.round(previewOffset / dayWidth),
                  ),
                }
              : {}),
          },
        });
      }
    }

    setPreviewOffset(0);
    setPreviewDuration(null);
    setActiveId(null);
  };

  return (
    <div className="flex flex-col gap-4 overflow-x-auto">
      <div className="relative" style={{ width: `${daysToShow * dayWidth}px` }}>
        <GanttHeader
          startDate={startDate}
          daysToShow={daysToShow}
          dayWidth={dayWidth}
        />

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <GanttGrid daysToShow={daysToShow} dayWidth={dayWidth}>
            <div className="relative mt-4">
              {tasks.map((task) => (
                <div key={task.task_id} className="relative mb-2 h-8">
                  <GanttTask
                    task={task}
                    startDate={startDate}
                    daysToShow={daysToShow}
                    dayWidth={dayWidth}
                    onResizeStart={handleResizeStart}
                    onResizeMove={handleResizeMove}
                    onResizeEnd={handleResizeEnd}
                    previewOffset={
                      task.task_id === activeId ? previewOffset : undefined
                    }
                    previewDuration={
                      task.task_id === activeId
                        ? (previewDuration ?? undefined)
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </GanttGrid>

          <DragOverlay>
            {activeId && !isResizing && (
              <div className="rounded-md bg-blue-500/50 px-2 py-1 text-white">
                {tasks.find((t) => t.task_id === activeId)?.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
