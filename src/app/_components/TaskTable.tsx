"use client";

import { type Row } from "@tanstack/react-table";
import { useState } from "react";

import { Checkbox } from "~/components/ui/checkbox";

import { useTaskColumns } from "./hooks/useTaskColumns";
import {
  COLUMN_PRESETS,
  type ColumnKey,
  ColumnSelector,
  type PresetKey,
} from "./tables/ColumnSelector";
import { GenericTable } from "./tables/GenericTable";

import type { Task } from "@prisma/client";

export function TaskTable({
  tasks,
  selectedTasks,
  onToggleSelect,
}: {
  tasks: Task[];
  selectedTasks: Set<number>;
  onToggleSelect: (taskIds: number[]) => void;
}) {
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

  const selectionColumn = {
    id: "select",
    cell: ({ row }: { row: Row<Task> }) => (
      <Checkbox
        checked={selectedTasks.has(row.original.task_id)}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
          onToggleSelect([row.original.task_id]);
        }}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const columns = [
    selectionColumn,
    ...selectedColumns.map(
      (key) =>
        AVAILABLE_COLUMNS.find((col) => col.value === key)?.columnDef ?? {
          accessorKey: key,
          header:
            AVAILABLE_COLUMNS.find((col) => col.value === key)?.label ?? key,
        },
    ),
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
