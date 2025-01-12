"use client";

import { useMemo, useState } from "react";
import isEqual from "react-fast-compare";

import {
  SelectEditor,
  SelectEditorCombobox,
  SelectEditorContent,
  SelectEditorInput,
} from "~/components/plate-ui/select-editor";

import { GenericTable } from "./tables/GenericTable";

import type { Task } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";

const AVAILABLE_COLUMNS = [
  { value: "title", label: "Title" },
  { value: "category", label: "Category" },
  { value: "description", label: "Description" },
  { value: "comments", label: "Comments" },
  { value: "due_date", label: "Due Date" },
  { value: "start_date", label: "Start Date" },
  { value: "duration", label: "Duration" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
] as const;

type ColumnKey = (typeof AVAILABLE_COLUMNS)[number]["value"];

function ColumnSelector({
  selectedColumns,
  onColumnToggle,
}: {
  selectedColumns: ColumnKey[];
  onColumnToggle: (columns: ColumnKey[]) => void;
}) {
  const selectedColumnsValue = useMemo(
    () => selectedColumns.map((col) => ({ value: col })),
    [selectedColumns],
  );

  const availableColumnsItems = useMemo(
    () => Array.from(AVAILABLE_COLUMNS),
    [],
  );

  const handleValueChange = (columns: { value: string }[]) => {
    const newColumns = columns.map((col) => col.value as ColumnKey);
    if (isEqual(newColumns, selectedColumns)) {
      return;
    }
    onColumnToggle(newColumns);
  };

  return (
    <SelectEditor
      value={selectedColumnsValue}
      onValueChange={handleValueChange}
      items={availableColumnsItems}
    >
      <SelectEditorContent>
        <SelectEditorInput placeholder="Select columns..." />
        <SelectEditorCombobox />
      </SelectEditorContent>
    </SelectEditor>
  );
}

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    "title",
    "category",
  ]);

  const handleColumnToggle = (columns: ColumnKey[]) => {
    // Ensure at least one column is selected
    if (columns.length === 0) {
      columns.push("title");
    }
    setSelectedColumns(columns);
  };

  const columns: ColumnDef<Task>[] = selectedColumns.map((key) => ({
    accessorKey: key,
    header: AVAILABLE_COLUMNS.find((col) => col.value === key)?.label ?? key,
    enableColumnFilter: false,
  }));

  return (
    <div>
      <div className="mb-4">
        <ColumnSelector
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
        />
      </div>
      <GenericTable columns={columns} data={tasks} shouldHideGLobalFilter />
    </div>
  );
}
