"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { useTaskColumns } from "./hooks/useTaskColumns";
import { TaskField } from "./TaskField";

import type { Task } from "./TaskList";

type KanbanColumn = {
  id: string;
  title: string;
  tasks: Task[];
};

type SortableTaskCardProps = {
  task: Task;
  selectedField: keyof Task;
};

function SortableTaskCard({ task, selectedField }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.task_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-full cursor-grab rounded-lg border bg-card p-4 shadow-sm"
    >
      <TaskField task={task} field="title" />
      <TaskField task={task} field={selectedField} />
    </div>
  );
}

type DroppableColumnProps = {
  column: KanbanColumn;
  children: React.ReactNode;
};

function DroppableColumn({ column, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-80 shrink-0 flex-col rounded-lg border bg-muted/50 p-4",
        isOver && "ring-2 ring-primary",
      )}
    >
      <h3 className="mb-4 font-medium">{column.title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

const GROUPABLE_FIELDS = ["status", "category", "priority"] as const;
type GroupableField = (typeof GROUPABLE_FIELDS)[number];

export function TaskKanbanView({ tasks }: { tasks: Task[] }) {
  const [selectedField, setSelectedField] = useState<GroupableField>("status");
  const [activeId, setActiveId] = useState<number | null>(null);
  const { TASK_STATUSES } = useTaskColumns();
  const updateTask = api.task.updateTask.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  // Group tasks by the selected field
  const columns = tasks.reduce<KanbanColumn[]>((acc, task) => {
    const value = String(task[selectedField] ?? "None");
    const existingColumn = acc.find((col) => col.id === value);
    if (existingColumn) {
      existingColumn.tasks.push(task);
    } else {
      acc.push({ id: value, title: value, tasks: [task] });
    }
    return acc;
  }, []);

  // If using status field, ensure all status columns exist even if empty
  if (selectedField === "status") {
    TASK_STATUSES.forEach((status) => {
      if (!columns.find((col) => col.id === status)) {
        columns.push({ id: status, title: status, tasks: [] });
      }
    });
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const activeTask = tasks.find((t) => t.task_id === active.id);
    const targetColumnId = over.id as string;

    if (activeTask && targetColumnId !== activeTask[selectedField]) {
      await updateTask.mutateAsync({
        taskId: activeTask.task_id,
        data: { [selectedField]: targetColumnId },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Group by:</span>
        <ComboBox
          value={selectedField}
          onChange={(value) =>
            value && setSelectedField(value as GroupableField)
          }
          options={[...GROUPABLE_FIELDS]}
          placeholder="Select field..."
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <DroppableColumn key={column.id} column={column}>
              <SortableContext
                items={column.tasks.map((t) => t.task_id)}
                strategy={rectSortingStrategy}
              >
                {column.tasks.map((task) => (
                  <SortableTaskCard
                    key={task.task_id}
                    task={task}
                    selectedField={selectedField}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeId && (
            <div className="w-72 rounded-lg border bg-card p-4 shadow-lg">
              <TaskField
                task={tasks.find((t) => t.task_id === activeId)!}
                field="title"
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
