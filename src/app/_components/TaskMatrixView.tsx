"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { useTaskColumns } from "./hooks/useTaskColumns";
import { TaskField } from "./TaskField";

import type { Task } from "./TaskList";

type MatrixCell = {
  rowValue: string;
  colValue: string;
  tasks: Task[];
};

type DraggableTaskCardProps = {
  task: Task;
  rowField: keyof Task;
  colField: keyof Task;
};

function DraggableTaskCard({
  task,
  rowField,
  colField,
}: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.task_id,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full rounded-lg border bg-card p-2 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <TaskField task={task} field="title" />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <TaskField task={task} field={rowField} />
            <span>•</span>
            <TaskField task={task} field={colField} />
          </div>
        </div>
      </div>
    </div>
  );
}

type DroppableMatrixCellProps = {
  cell: MatrixCell;
  children: React.ReactNode;
};

function DroppableMatrixCell({ cell, children }: DroppableMatrixCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${cell.rowValue}:${cell.colValue}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[100px] flex-col gap-2 rounded-lg border bg-muted/50 p-2",
        isOver && "ring-2 ring-primary",
      )}
    >
      {children}
    </div>
  );
}

const GROUPABLE_FIELDS = ["status", "category", "priority"] as const;
type GroupableField = (typeof GROUPABLE_FIELDS)[number];

export function TaskMatrixView({ tasks }: { tasks: Task[] }) {
  const [rowField, setRowField] = useState<GroupableField>("status");
  const [colField, setColField] = useState<GroupableField>("priority");
  const [activeId, setActiveId] = useState<number | null>(null);
  const { TASK_STATUSES } = useTaskColumns();
  const updateTask = api.task.updateTask.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Get unique values for rows and columns
  const rowValues = new Set<string>();
  const colValues = new Set<string>();
  tasks.forEach((task) => {
    rowValues.add(String(task[rowField] ?? "None"));
    colValues.add(String(task[colField] ?? "None"));
  });

  // If using status field, ensure all status values exist
  if (rowField === "status") {
    TASK_STATUSES.forEach((status) => rowValues.add(status));
  }
  if (colField === "status") {
    TASK_STATUSES.forEach((status) => colValues.add(status));
  }

  // Create matrix cells
  const matrixCells: MatrixCell[] = [];
  Array.from(rowValues).forEach((rowValue) => {
    Array.from(colValues).forEach((colValue) => {
      const cellTasks = tasks.filter(
        (task) =>
          String(task[rowField] ?? "None") === rowValue &&
          String(task[colField] ?? "None") === colValue,
      );
      matrixCells.push({ rowValue, colValue, tasks: cellTasks });
    });
  });

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
    if (!activeTask) {
      return;
    }

    const [newRowValue, newColValue] = (over.id as string).split(":");
    const currentRowValue = String(activeTask[rowField] ?? "None");
    const currentColValue = String(activeTask[colField] ?? "None");

    if (newRowValue !== currentRowValue || newColValue !== currentColValue) {
      await updateTask.mutateAsync({
        taskId: activeTask.task_id,
        data: {
          [rowField]: newRowValue === "None" ? null : newRowValue,
          [colField]: newColValue === "None" ? null : newColValue,
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Rows:</span>
          <ComboBox
            value={rowField}
            onChange={(value) => value && setRowField(value as GroupableField)}
            options={[...GROUPABLE_FIELDS]}
            placeholder="Select field..."
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Columns:</span>
          <ComboBox
            value={colField}
            onChange={(value) => value && setColField(value as GroupableField)}
            options={[...GROUPABLE_FIELDS]}
            placeholder="Select field..."
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `auto repeat(${colValues.size}, minmax(200px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="h-8" /> {/* Empty corner cell */}
          {Array.from(colValues).map((colValue) => (
            <div key={colValue} className="text-center font-medium">
              {colValue}
            </div>
          ))}
          {/* Matrix rows */}
          {Array.from(rowValues).map((rowValue) => (
            <div key={rowValue} className="contents">
              <div className="flex h-full items-center font-medium">
                {rowValue}
              </div>
              {Array.from(colValues).map((colValue) => {
                const cell = matrixCells.find(
                  (c) => c.rowValue === rowValue && c.colValue === colValue,
                )!;
                return (
                  <DroppableMatrixCell
                    key={`${rowValue}:${colValue}`}
                    cell={cell}
                  >
                    {cell.tasks.map((task) => (
                      <DraggableTaskCard
                        key={task.task_id}
                        task={task}
                        rowField={rowField}
                        colField={colField}
                      />
                    ))}
                  </DroppableMatrixCell>
                );
              })}
            </div>
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
