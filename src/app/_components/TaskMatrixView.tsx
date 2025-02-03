"use client";

import { useState } from "react";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { cn } from "~/lib/utils";
import { useEditTaskStore } from "~/stores/useEditTaskStore";

import { ComboBox } from "./ComboBox";
import { useTaskColumns } from "./hooks/useTaskColumns";
import { TaskAvatar } from "./TaskAvatar";

import type { Task } from "./TaskList";

const GROUPABLE_FIELDS = [
  "status",
  "category",
  "priority",
  "duration_bucket",
  "due_date_bucket",
] as const;
type GroupableField = (typeof GROUPABLE_FIELDS)[number];

type MatrixPreset = {
  label: string;
  rowField: GroupableField;
  colField: GroupableField;
};

const MATRIX_PRESETS: MatrixPreset[] = [
  { label: "Status × Priority", rowField: "status", colField: "priority" },
  { label: "Category × Status", rowField: "category", colField: "status" },
  {
    label: "Due Date × Duration",
    rowField: "due_date_bucket",
    colField: "duration_bucket",
  },
  {
    label: "Status × Due Date",
    rowField: "status",
    colField: "due_date_bucket",
  },
  {
    label: "Due Date × Priority",
    rowField: "due_date_bucket",
    colField: "priority",
  },
];

const getDurationBucket = (duration: number | null): string => {
  if (!duration) {
    return "None";
  }
  if (duration <= 10) {
    return "Short (1-10)";
  }
  if (duration <= 60) {
    return "Medium (11-60)";
  }
  return "Long (>60)";
};

const getDueDateBucket = (dueDate: Date | null): string => {
  if (!dueDate) {
    return "None";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateTime = new Date(dueDate);
  dueDateTime.setHours(0, 0, 0, 0);

  if (dueDateTime < today) {
    return "Past Due";
  }
  if (dueDateTime.getTime() === today.getTime()) {
    return "Today";
  }

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  if (dueDateTime <= nextWeek) {
    if (dueDateTime.getTime() <= today.getTime() + 7 * 24 * 60 * 60 * 1000) {
      return "This Week";
    }
  }

  const followingWeek = new Date(nextWeek);
  followingWeek.setDate(nextWeek.getDate() + 7);
  if (dueDateTime <= followingWeek) {
    return "Next Week";
  }

  return "Later";
};

type MatrixCell = {
  rowValue: string;
  colValue: string;
  tasks: Task[];
};

type TaskGridCellProps = {
  cell: MatrixCell;
  isSelected: boolean;
  onSelect: () => void;
};

function TaskGridCell({ cell, isSelected, onSelect }: TaskGridCellProps) {
  const isEmpty = cell.tasks.length === 0;

  return (
    <div
      onClick={isEmpty ? undefined : onSelect}
      className={cn(
        "flex h-full min-h-[100px] flex-wrap content-start gap-2 rounded-lg border p-2",
        isEmpty
          ? "cursor-default bg-white"
          : "cursor-pointer bg-muted/50 hover:bg-muted/70",
        !isEmpty && isSelected && "ring-2 ring-primary",
      )}
    >
      {cell.tasks.map((task) => (
        <SimpleTooltip
          content={task.title}
          key={task.task_id}
          className="max-w-sm text-wrap break-words text-base"
        >
          <TaskAvatar title={task.title} task={task} size={24} />
        </SimpleTooltip>
      ))}
    </div>
  );
}

const formatFieldName = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/bucket/g, "")
    .trim()
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
};

export function TaskMatrixView({ tasks }: { tasks: Task[] }) {
  const [rowField, setRowField] = useState<GroupableField>("due_date_bucket");
  const [colField, setColField] = useState<GroupableField>("priority");
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const { TASK_STATUSES } = useTaskColumns();

  const { open } = useEditTaskStore();

  // Get field value based on field type
  const getFieldValue = (task: Task, field: GroupableField): string => {
    switch (field) {
      case "duration_bucket":
        return getDurationBucket(task.duration);
      case "due_date_bucket":
        return getDueDateBucket(task.due_date);
      default:
        return String(task[field] ?? "None");
    }
  };

  // Get unique values for rows and columns
  const rowValues = new Set<string>();
  const colValues = new Set<string>();
  tasks.forEach((task) => {
    rowValues.add(getFieldValue(task, rowField));
    colValues.add(getFieldValue(task, colField));
  });

  // If using status field, ensure all status values exist
  if (rowField === "status") {
    TASK_STATUSES.forEach((status) => rowValues.add(status));
  }
  if (colField === "status") {
    TASK_STATUSES.forEach((status) => colValues.add(status));
  }

  // Add all duration buckets if using duration_bucket
  if (rowField === "duration_bucket") {
    ["None", "Short (1-10)", "Medium (11-60)", "Long (>60)"].forEach((bucket) =>
      rowValues.add(bucket),
    );
  }
  if (colField === "duration_bucket") {
    ["None", "Short (1-10)", "Medium (11-60)", "Long (>60)"].forEach((bucket) =>
      colValues.add(bucket),
    );
  }

  // Add all due date buckets if using due_date_bucket
  if (rowField === "due_date_bucket") {
    ["Past Due", "Today", "This Week", "Next Week", "Later", "None"].forEach(
      (bucket) => rowValues.add(bucket),
    );
  }
  if (colField === "due_date_bucket") {
    ["Past Due", "Today", "This Week", "Next Week", "Later", "None"].forEach(
      (bucket) => colValues.add(bucket),
    );
  }

  // Create matrix cells
  const matrixCells: MatrixCell[] = [];
  Array.from(rowValues).forEach((rowValue) => {
    Array.from(colValues).forEach((colValue) => {
      const cellTasks = tasks.filter(
        (task) =>
          getFieldValue(task, rowField) === rowValue &&
          getFieldValue(task, colField) === colValue,
      );
      matrixCells.push({ rowValue, colValue, tasks: cellTasks });
    });
  });

  const selectedTasks = selectedCell
    ? (matrixCells.find(
        (cell) => `${cell.rowValue}:${cell.colValue}` === selectedCell,
      )?.tasks ?? [])
    : tasks;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Preset:</span>
          <ComboBox
            value={`${rowField}:${colField}`}
            onChange={(value) => {
              if (value) {
                const preset = MATRIX_PRESETS.find(
                  (p) => `${p.rowField}:${p.colField}` === value,
                );
                if (preset) {
                  setRowField(preset.rowField);
                  setColField(preset.colField);
                }
              }
            }}
            options={MATRIX_PRESETS.map((p) => `${p.rowField}:${p.colField}`)}
            renderOption={(value: string) =>
              MATRIX_PRESETS.find(
                (p) => `${p.rowField}:${p.colField}` === value,
              )?.label ?? value
            }
            placeholder="Select preset..."
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Rows:</span>
          <ComboBox
            value={rowField}
            onChange={(value) => value && setRowField(value as GroupableField)}
            options={[...GROUPABLE_FIELDS]}
            renderOption={(value: string) => formatFieldName(value)}
            placeholder="Select field..."
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Columns:</span>
          <ComboBox
            value={colField}
            onChange={(value) => value && setColField(value as GroupableField)}
            options={[...GROUPABLE_FIELDS]}
            renderOption={(value: string) => formatFieldName(value)}
            placeholder="Select field..."
          />
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1">
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
                  const cellId = `${rowValue}:${colValue}`;
                  return (
                    <TaskGridCell
                      key={cellId}
                      cell={cell}
                      isSelected={selectedCell === cellId}
                      onSelect={() => setSelectedCell(cellId)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-[300px]">
          <h3 className="mb-2 text-lg font-medium">Selected Tasks</h3>
          <div className="rounded-lg border bg-card p-2">
            {selectedCell === null ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  All tasks (select a cell to filter)
                </p>
                <ul className="space-y-2">
                  {tasks.map((task) => (
                    <li
                      key={task.task_id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/50 p-2 hover:bg-muted/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        open(task.task_id);
                      }}
                    >
                      <TaskAvatar title={task.title} task={task} size={24} />
                      <span>{task.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : selectedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks in selected cell
              </p>
            ) : (
              <ul className="space-y-2">
                {selectedTasks.map((task) => (
                  <li
                    key={task.task_id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/50 p-2 hover:bg-muted/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      open(task.task_id);
                    }}
                  >
                    <TaskAvatar title={task.title} task={task} size={24} />
                    <span>{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
