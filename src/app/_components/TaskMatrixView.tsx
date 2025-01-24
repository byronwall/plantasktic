"use client";

import { useState } from "react";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { cn } from "~/lib/utils";
import { useEditTaskStore } from "~/stores/useEditTaskStore";

import { ComboBox } from "./ComboBox";
import { useTaskColumns } from "./hooks/useTaskColumns";
import { TaskAvatar } from "./TaskAvatar";

import type { Task } from "./TaskList";

type MatrixCell = {
  rowValue: string;
  colValue: string;
  tasks: Task[];
};

const GROUPABLE_FIELDS = ["status", "category", "priority"] as const;
type GroupableField = (typeof GROUPABLE_FIELDS)[number];

type TaskGridCellProps = {
  cell: MatrixCell;
  isSelected: boolean;
  onSelect: () => void;
};

function TaskGridCell({ cell, isSelected, onSelect }: TaskGridCellProps) {
  const { open } = useEditTaskStore();

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex h-full min-h-[100px] flex-wrap content-start gap-2 rounded-lg border bg-muted/50 p-2",
        isSelected && "ring-2 ring-primary",
      )}
    >
      {cell.tasks.map((task) => (
        <SimpleTooltip
          content={task.title}
          key={task.task_id}
          className="max-w-sm text-wrap break-words text-base"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              open(task);
            }}
            className="rounded-full hover:ring-2 hover:ring-primary"
          >
            <TaskAvatar title={task.title} size={32} />
          </button>
        </SimpleTooltip>
      ))}
    </div>
  );
}

export function TaskMatrixView({ tasks }: { tasks: Task[] }) {
  const [rowField, setRowField] = useState<GroupableField>("status");
  const [colField, setColField] = useState<GroupableField>("priority");
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const { TASK_STATUSES } = useTaskColumns();

  const { open } = useEditTaskStore();

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

  const selectedTasks = selectedCell
    ? (matrixCells.find(
        (cell) => `${cell.rowValue}:${cell.colValue}` === selectedCell,
      )?.tasks ?? [])
    : tasks;

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

        <div className="">
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
                        open(task);
                      }}
                    >
                      <TaskAvatar title={task.title} size={24} />
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
                      open(task);
                    }}
                  >
                    <TaskAvatar title={task.title} size={24} />
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
