import { ChevronDown, Columns } from "lucide-react";

import { Button } from "~/components/ui/button";
import MultipleSelector from "~/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export const COLUMN_PRESETS = {
  basic: {
    label: "Basic",
    columns: ["title", "status", "priority", "due_date"],
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
}

export function ColumnSelector({
  availableColumns,
  selectedColumns,
  onColumnToggle,
}: ColumnSelectorProps) {
  const presetPopover = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-auto">
          <Columns className="mr-2 h-4 w-4" />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="flex flex-col gap-1">
          {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="ghost"
              className="justify-start"
              onClick={() => onColumnToggle([...preset.columns])}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
  return (
    <div className="flex items-stretch gap-2">
      <MultipleSelector
        options={availableColumns}
        value={selectedColumns.map((col) => ({
          value: col,
          label: col,
        }))}
        onChange={(options) =>
          onColumnToggle(options.map((c) => c.value) as ColumnKey[])
        }
        className=""
        badgeClassName="text-sm"
      />
      {presetPopover}
    </div>
  );
}
