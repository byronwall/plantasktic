"use client";

import { format } from "date-fns";
import { useMemo, useState } from "react";
import isEqual from "react-fast-compare";

import { DateInput } from "~/components/ui/date-input";
import MultipleSelector from "~/components/ui/multi-select";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { DateRangePicker } from "./DateRangePicker";
import { GenericTable } from "./tables/GenericTable";
import { TaskCategory } from "./TaskCategory";
import { TaskComments } from "./TaskComments";
import { TaskTitle } from "./TaskTitle";

import type { Task } from "@prisma/client";
import type { Column, ColumnDef, Row } from "@tanstack/react-table";

const TASK_STATUSES = [
  "open",
  "completed",
  "pending",
  "waiting",
  "blocked",
  "cancelled",
] as const;

type TaskStatus = (typeof TASK_STATUSES)[number];

type TaskColumnDef = ColumnDef<Task> & {
  Filter?: (props: { column: Column<Task> }) => JSX.Element;
};

type AvailableColumn = {
  value: string;
  label: string;
  columnDef: TaskColumnDef;
};

function useTableColumns(): AvailableColumn[] {
  const updateTask = api.task.updateTask.useMutation();

  return useMemo(
    () => [
      {
        value: "title",
        label: "Title",
        columnDef: {
          accessorKey: "title",
          header: "Title",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const title = row.getValue<string>("title");
            return <TaskTitle taskId={taskId} title={title} />;
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "category",
        label: "Category",
        columnDef: {
          accessorKey: "category",
          header: "Category",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const category = row.getValue<string | null>("category");
            return <TaskCategory taskId={taskId} currentCategory={category} />;
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "description",
        label: "Description",
        columnDef: {
          accessorKey: "description",
          header: "Description",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const description = row.getValue<string | null>("description");
            return (
              <div className="flex items-center gap-2">
                <span>
                  {description ? description.slice(0, 50) + "..." : ""}
                </span>
                <button
                  onClick={() => {
                    const newDescription = window.prompt(
                      "Enter new description:",
                      description ?? "",
                    );
                    if (newDescription !== null) {
                      void updateTask.mutateAsync({
                        taskId,
                        data: { description: newDescription || null },
                      });
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
              </div>
            );
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "comments",
        label: "Comments",
        columnDef: {
          accessorKey: "comments",
          header: "Comments",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const comments = row.getValue<string | null>("comments");
            return <TaskComments taskId={taskId} comments={comments} />;
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "due_date",
        label: "Due Date",
        columnDef: {
          accessorKey: "due_date",
          header: "Due Date",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const date = row.getValue<Date | null>("due_date");
            return (
              <DateInput
                value={date ?? undefined}
                onChange={(date) => {
                  void updateTask.mutateAsync({
                    taskId,
                    data: { due_date: date ?? null },
                  });
                }}
              />
            );
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "start_date",
        label: "Start Date",
        columnDef: {
          accessorKey: "start_date",
          header: "Start Date",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const date = row.getValue<Date | null>("start_date");
            return (
              <DateInput
                value={date ?? undefined}
                onChange={(date) => {
                  void updateTask.mutateAsync({
                    taskId,
                    data: { start_date: date ?? null },
                  });
                }}
              />
            );
          },
          Filter: ({ column }: { column: Column<Task> }) => {
            const [min, max] = (column.getFilterValue() as [
              Date | undefined,
              Date | undefined,
            ]) ?? [undefined, undefined];
            return (
              <DateRangePicker
                startDate={min}
                endDate={max}
                onChange={(start, end) => column.setFilterValue([start, end])}
              />
            );
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "duration",
        label: "Duration",
        columnDef: {
          accessorKey: "duration",
          header: "Duration",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const duration = row.getValue<number | null>("duration");
            return (
              <div className="flex items-center gap-2">
                <span>{duration ?? ""}</span>
                <button
                  onClick={() => {
                    const newDuration = window.prompt(
                      "Enter new duration (in hours):",
                      duration?.toString() ?? "",
                    );
                    if (newDuration !== null) {
                      const parsed = parseFloat(newDuration);
                      if (!isNaN(parsed) || newDuration === "") {
                        void updateTask.mutateAsync({
                          taskId,
                          data: {
                            duration: newDuration === "" ? null : parsed,
                          },
                        });
                      }
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
              </div>
            );
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "priority",
        label: "Priority",
        columnDef: {
          accessorKey: "priority",
          header: "Priority",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const priority = row.getValue<string | null>("priority");
            return (
              <div className="flex items-center gap-2">
                <span>{priority ?? ""}</span>
                <button
                  onClick={() => {
                    const newPriority = window.prompt(
                      "Enter new priority:",
                      priority ?? "",
                    );
                    if (newPriority !== null) {
                      void updateTask.mutateAsync({
                        taskId,
                        data: { priority: newPriority || null },
                      });
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
              </div>
            );
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "status",
        label: "Status",
        columnDef: {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }: { row: Row<Task> }) => {
            const taskId = row.original.task_id;
            const status = row.getValue<TaskStatus>("status");
            return (
              <ComboBox
                options={[...TASK_STATUSES]}
                value={status}
                onChange={(newStatus) => {
                  if (newStatus) {
                    void updateTask.mutateAsync({
                      taskId,
                      data: { status: newStatus as TaskStatus },
                    });
                  }
                }}
              />
            );
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "created_at",
        label: "Created At",
        columnDef: {
          accessorKey: "created_at",
          header: "Created At",
          cell: ({ row }: { row: Row<Task> }) => {
            const date = row.getValue<Date>("created_at");
            return date ? format(date, "MMM d, yyyy") : "";
          },
        } satisfies TaskColumnDef,
      },
      {
        value: "updated_at",
        label: "Updated At",
        columnDef: {
          accessorKey: "updated_at",
          header: "Updated At",
          cell: ({ row }: { row: Row<Task> }) => {
            const date = row.getValue<Date>("updated_at");
            return date ? format(date, "MMM d, yyyy") : "";
          },
        } satisfies TaskColumnDef,
      },
    ],
    [updateTask],
  );
}

const COLUMN_PRESETS = {
  basic: {
    label: "Basic",
    columns: ["title", "category"],
  },
  projectManagement: {
    label: "Project Management",
    columns: [
      "title",
      "start_date",
      "due_date",
      "duration",
      "status",
      "priority",
    ],
  },
  communication: {
    label: "Communication",
    columns: ["title", "comments", "description"],
  },
  tracking: {
    label: "Tracking",
    columns: ["title", "status", "category", "priority"],
  },
  timeline: {
    label: "Timeline",
    columns: ["title", "created_at", "updated_at", "start_date", "due_date"],
  },
  detailed: {
    label: "Detailed",
    columns: [
      "title",
      "category",
      "description",
      "status",
      "priority",
      "due_date",
    ],
  },
  compact: {
    label: "Compact",
    columns: ["title", "status", "due_date"],
  },
} as const;

type PresetKey = keyof typeof COLUMN_PRESETS;
type ColumnKey = (typeof COLUMN_PRESETS)[PresetKey]["columns"][number];

function ColumnSelector({
  selectedColumns,
  onColumnToggle,
  availableColumns,
}: {
  selectedColumns: ColumnKey[];
  onColumnToggle: (columns: ColumnKey[]) => void;
  availableColumns: AvailableColumn[];
}) {
  const selectedColumnsValue = useMemo(
    () =>
      selectedColumns.map((col) => ({
        value: col,
        label: availableColumns.find((c) => c.value === col)?.label ?? col,
      })),
    [selectedColumns, availableColumns],
  );

  const availableColumnsItems = useMemo(
    () =>
      availableColumns.map((col) => ({
        value: col.value,
        label: col.label,
      })),
    [availableColumns],
  );

  const handleValueChange = (columns: { value: string }[]) => {
    const newColumns = columns.map((col) => col.value) as ColumnKey[];
    if (isEqual(newColumns, selectedColumns)) {
      return;
    }
    onColumnToggle(newColumns);
  };

  return (
    <MultipleSelector
      defaultOptions={availableColumnsItems}
      placeholder="Select columns..."
      value={selectedColumnsValue}
      onChange={handleValueChange}
      emptyIndicator={
        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
          no results found.
        </p>
      }
      badgeClassName="text-base"
    />
  );
}

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

  const availableColumns = useTableColumns();

  const handleColumnToggle = (columns: ColumnKey[]) => {
    // Ensure at least one column is selected
    if (columns.length === 0) {
      columns = ["title" as const];
    }
    setSelectedColumns(columns);
  };

  const handlePresetClick = (preset: PresetKey) => {
    setSelectedColumns([...COLUMN_PRESETS[preset].columns]);
  };

  const columns = selectedColumns.map(
    (key) =>
      availableColumns.find((col) => col.value === key)?.columnDef ?? {
        accessorKey: key,
        header: availableColumns.find((col) => col.value === key)?.label ?? key,
      },
  );

  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(key as PresetKey)}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <ColumnSelector
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
          availableColumns={availableColumns}
        />
      </div>
      <GenericTable columns={columns} data={tasks} shouldHideGLobalFilter />
    </div>
  );
}
