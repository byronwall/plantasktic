import { Button } from "~/components/ui/button";
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

export interface ColumnSelectorProps {
  availableColumns: { value: string; label: string }[];
  selectedColumns: ColumnKey[];
  onColumnToggle: (columns: ColumnKey[]) => void;
  onPresetClick?: (preset: PresetKey) => void;
}

export function ColumnSelector({
  availableColumns,
  selectedColumns,
  onColumnToggle,
  onPresetClick,
}: ColumnSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {onPresetClick && (
        <div className="flex gap-2">
          {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => onPresetClick(key as PresetKey)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
      <MultipleSelector
        options={availableColumns}
        value={selectedColumns.map((col) => ({
          value: col,
          label: col,
        }))}
        onChange={(options) =>
          onColumnToggle(options.map((c) => c.value) as ColumnKey[])
        }
        className="max-w-[640px]"
      />
    </div>
  );
}
