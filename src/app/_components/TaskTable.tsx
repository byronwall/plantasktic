"use client";

import { type Row, type Table } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useSelectedTasksStore } from "~/stores/useSelectedTasksStore";

import { useTaskColumns } from "./hooks/useTaskColumns";
import {
  COLUMN_PRESETS,
  type ColumnKey,
  ColumnSelector,
  type PresetKey,
} from "./tables/ColumnSelector";
import { GenericTable } from "./tables/GenericTable";
import { TaskActions } from "./TaskActions";

import type { Task } from "@prisma/client";
import type { TaskColumnDef } from "./hooks/useTaskColumns";

type TaskTableProps = {
  tasks: Task[];
};

export function TaskTable({ tasks }: TaskTableProps) {
  const { selectedTasks, toggleTask } = useSelectedTasksStore();
  const { AVAILABLE_COLUMNS } = useTaskColumns();
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

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

  const columns: TaskColumnDef[] = [
    {
      id: "select",
      header: ({ table }: { table: Table<Task> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: Row<Task> }) => (
        <Checkbox
          checked={selectedTasks.has(row.original.task_id)}
          onCheckedChange={() => toggleTask(row.original.task_id)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<Task> }) => {
        return (
          <Popover>
            <PopoverTrigger>
              <Button variant="ghost" size="icon">
                <MoreVertical />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <TaskActions task={row.original} />
            </PopoverContent>
          </Popover>
        );
      },
    },
    ...selectedColumns.map((field) => {
      const column = AVAILABLE_COLUMNS.find((col) => col.value === field);
      return (
        column?.columnDef ?? {
          accessorKey: field,
          header: column?.label ?? field,
        }
      );
    }),
  ];

  return (
    <>
      <div className="mb-4 space-y-2">
        <ColumnSelector
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
          availableColumns={AVAILABLE_COLUMNS}
          onPresetClick={handlePresetClick}
        />
      </div>
      <div className="w-fit max-w-full">
        <GenericTable columns={columns} data={tasks} shouldHideGLobalFilter />
      </div>
    </>
  );
}
