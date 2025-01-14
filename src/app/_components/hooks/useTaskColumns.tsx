import { format } from "date-fns";

import { DateInput } from "~/components/ui/date-input";
import { api } from "~/trpc/react";

import { ComboBox } from "../ComboBox";
import { DateRangePicker } from "../DateRangePicker";
import { TaskCategory } from "../TaskCategory";
import { TaskComments } from "../TaskComments";
import { TaskTitle } from "../TaskTitle";

import type { Task } from "@prisma/client";
import type { Column, ColumnDef } from "@tanstack/react-table";

const TASK_STATUSES = [
  "open",
  "completed",
  "pending",
  "waiting",
  "blocked",
  "cancelled",
] as const;

type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskColumnDef = ColumnDef<Task> & {
  Filter?: (props: { column: Column<Task> }) => JSX.Element;
};

export interface TaskColumnConfig {
  value: string;
  label: string;
  columnDef?: TaskColumnDef;
}

export function useTaskColumns() {
  const updateTask = api.task.updateTask.useMutation();

  const AVAILABLE_COLUMNS: TaskColumnConfig[] = [
    {
      value: "title",
      label: "Title",
      columnDef: {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const taskId = row.original.task_id;
          const title = row.getValue<string>("title");
          return <TaskTitle taskId={taskId} title={title} />;
        },
      },
    },
    {
      value: "category",
      label: "Category",
      columnDef: {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const taskId = row.original.task_id;
          const category = row.getValue<string | null>("category");
          return <TaskCategory taskId={taskId} currentCategory={category} />;
        },
      },
    },
    {
      value: "description",
      label: "Description",
      columnDef: {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const taskId = row.original.task_id;
          const description = row.getValue<string | null>("description");
          return (
            <div className="flex items-center gap-2">
              <span>{description ? description.slice(0, 50) + "..." : ""}</span>
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
      },
    },
    {
      value: "comments",
      label: "Comments",
      columnDef: {
        accessorKey: "comments",
        header: "Comments",
        cell: ({ row }) => {
          const taskId = row.original.task_id;
          const comments = row.getValue<string | null>("comments");
          return <TaskComments taskId={taskId} comments={comments} />;
        },
      },
    },
    {
      value: "due_date",
      label: "Due Date",
      columnDef: {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => {
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
      },
    },
    {
      value: "start_date",
      label: "Start Date",
      columnDef: {
        accessorKey: "start_date",
        header: "Start Date",
        cell: ({ row }) => {
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
        Filter: ({ column }) => {
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
      },
    },
    {
      value: "duration",
      label: "Duration",
      columnDef: {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => {
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
      },
    },
    {
      value: "priority",
      label: "Priority",
      columnDef: {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
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
      },
    },
    {
      value: "status",
      label: "Status",
      columnDef: {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
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
      },
    },
    {
      value: "created_at",
      label: "Created At",
      columnDef: {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
          const date = row.getValue<Date>("created_at");
          return date ? format(date, "MMM d, yyyy") : "";
        },
      },
    },
    {
      value: "updated_at",
      label: "Updated At",
      columnDef: {
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ row }) => {
          const date = row.getValue<Date>("updated_at");
          return date ? format(date, "MMM d, yyyy") : "";
        },
      },
    },
  ];

  return {
    AVAILABLE_COLUMNS,
    TASK_STATUSES,
  };
}
