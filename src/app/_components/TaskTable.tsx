"use client";

import { useMemo, useState } from "react";
import isEqual from "react-fast-compare";

import MultipleSelector from "~/components/ui/multi-select";

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
} satisfies Record<string, { label: string; columns: ColumnKey[] }>;

type PresetKey = keyof typeof COLUMN_PRESETS;

function ColumnSelector({
  selectedColumns,
  onColumnToggle,
}: {
  selectedColumns: ColumnKey[];
  onColumnToggle: (columns: ColumnKey[]) => void;
}) {
  const selectedColumnsValue = useMemo(
    () => selectedColumns.map((col) => ({ value: col, label: col })),
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
    />
  );
}

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(
    COLUMN_PRESETS.basic.columns,
  );

  const handleColumnToggle = (columns: ColumnKey[]) => {
    // Ensure at least one column is selected
    if (columns.length === 0) {
      columns.push("title");
    }
    setSelectedColumns(columns);
  };

  const handlePresetClick = (preset: PresetKey) => {
    setSelectedColumns([...COLUMN_PRESETS[preset].columns]);
  };

  const columns: ColumnDef<Task>[] = selectedColumns.map((key) => ({
    accessorKey: key,
    header: AVAILABLE_COLUMNS.find((col) => col.value === key)?.label ?? key,
    enableColumnFilter: false,
  }));

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
        />
      </div>
      <GenericTable columns={columns} data={tasks} shouldHideGLobalFilter />
    </div>
  );
}
