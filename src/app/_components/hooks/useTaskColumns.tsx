import { DateRangePicker } from "../DateRangePicker";
import { TaskField } from "../TaskField";

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
  const AVAILABLE_COLUMNS: TaskColumnConfig[] = [
    {
      value: "title",
      label: "Title",
      columnDef: {
        accessorFn: (task) => task.title ?? undefined,
        header: "Title",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="title"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "category",
      label: "Category",
      columnDef: {
        accessorFn: (task) => task.category ?? undefined,
        header: "Category",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="category"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "description",
      label: "Description",
      columnDef: {
        accessorFn: (task) => task.description ?? undefined,
        header: "Description",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="description"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "comments",
      label: "Comments",
      columnDef: {
        accessorFn: (task) => task.comments ?? undefined,
        header: "Comments",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="comments"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "due_date",
      label: "Due Date",
      columnDef: {
        accessorFn: (task) => task.due_date ?? undefined,
        header: "Due Date",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="due_date"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "start_date",
      label: "Start Date",
      columnDef: {
        accessorFn: (task) => task.start_date ?? undefined,
        header: "Start Date",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="start_date"
            className="justify-center"
          />
        ),
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
        accessorFn: (task) => task.duration ?? undefined,
        header: "Duration",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="duration"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "priority",
      label: "Priority",
      columnDef: {
        accessorFn: (task) => task.priority ?? undefined,
        header: "Priority",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="priority"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "status",
      label: "Status",
      columnDef: {
        accessorFn: (task) => task.status ?? undefined,
        header: "Status",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="status"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "created_at",
      label: "Created At",
      columnDef: {
        accessorFn: (task) => task.created_at ?? undefined,
        header: "Created At",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="created_at"
            className="justify-center"
          />
        ),
      },
    },
    {
      value: "updated_at",
      label: "Updated At",
      columnDef: {
        accessorFn: (task) => task.updated_at ?? undefined,
        header: "Updated At",
        cell: ({ row }) => (
          <TaskField
            task={row.original}
            field="updated_at"
            className="justify-center"
          />
        ),
      },
    },
  ];

  return {
    AVAILABLE_COLUMNS,
    TASK_STATUSES,
  };
}
