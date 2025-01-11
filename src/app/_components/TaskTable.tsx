"use client";
import type { Task } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { GenericTable } from "./tables/GenericTable";

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Title",
      enableColumnFilter: false,
    },
    {
      accessorKey: "category",
      header: "Category",
      enableColumnFilter: false,
    },
  ];

  return <GenericTable columns={columns} data={tasks} shouldHideGLobalFilter />;
}
