import { useMemo } from "react";
import isEqual from "react-fast-compare";

import MultipleSelector from "~/components/ui/multi-select";

export const COLUMN_PRESETS = {
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

export type PresetKey = keyof typeof COLUMN_PRESETS;
export type ColumnKey = (typeof COLUMN_PRESETS)[PresetKey]["columns"][number];

export type AvailableColumn = {
  value: string;
  label: string;
};

interface ColumnSelectorProps {
  selectedColumns: ColumnKey[];
  onColumnToggle: (columns: ColumnKey[]) => void;
  availableColumns: AvailableColumn[];
}

export function ColumnSelector({
  selectedColumns,
  onColumnToggle,
  availableColumns,
}: ColumnSelectorProps) {
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
