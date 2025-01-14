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
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <TaskField task={row.original} field="title" />,
      },
    },
    {
      value: "category",
      label: "Category",
      columnDef: {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <TaskField task={row.original} field="category" />,
      },
    },
    {
      value: "description",
      label: "Description",
      columnDef: {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <TaskField task={row.original} field="description" />
        ),
      },
    },
    {
      value: "comments",
      label: "Comments",
      columnDef: {
        accessorKey: "comments",
        header: "Comments",
        cell: ({ row }) => <TaskField task={row.original} field="comments" />,
      },
    },
    {
      value: "due_date",
      label: "Due Date",
      columnDef: {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => <TaskField task={row.original} field="due_date" />,
      },
    },
    {
      value: "start_date",
      label: "Start Date",
      columnDef: {
        accessorKey: "start_date",
        header: "Start Date",
        cell: ({ row }) => <TaskField task={row.original} field="start_date" />,
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
        cell: ({ row }) => <TaskField task={row.original} field="duration" />,
      },
    },
    {
      value: "priority",
      label: "Priority",
      columnDef: {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <TaskField task={row.original} field="priority" />,
      },
    },
    {
      value: "status",
      label: "Status",
      columnDef: {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <TaskField task={row.original} field="status" />,
      },
    },
    {
      value: "created_at",
      label: "Created At",
      columnDef: {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => <TaskField task={row.original} field="created_at" />,
      },
    },
    {
      value: "updated_at",
      label: "Updated At",
      columnDef: {
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ row }) => <TaskField task={row.original} field="updated_at" />,
      },
    },
  ];

  return {
    AVAILABLE_COLUMNS,
    TASK_STATUSES,
  };
}
