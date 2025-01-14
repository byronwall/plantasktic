import { Check } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

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
    <div className="flex items-center gap-2">
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Columns
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px]">
          <Command>
            <CommandInput placeholder="Search columns..." />
            <CommandList>
              <CommandEmpty>No columns found.</CommandEmpty>
              <CommandGroup>
                {availableColumns.map((column) => {
                  const isSelected = selectedColumns.includes(
                    column.value as ColumnKey,
                  );
                  return (
                    <CommandItem
                      key={column.value}
                      onSelect={() => {
                        const newColumns = isSelected
                          ? selectedColumns.filter((c) => c !== column.value)
                          : [...selectedColumns, column.value as ColumnKey];
                        onColumnToggle(newColumns);
                      }}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      {column.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
