import { Loader2, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";

interface BulkImportButtonProps {
  projectId?: string;
}

export function BulkImportButton({ projectId }: BulkImportButtonProps) {
  const [bulkText, setBulkText] = useState("");
  const bulkCreateTasksMutater = api.task.bulkCreateTasks.useMutation();

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      return;
    }

    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const tasks = lines
      .map((line) => {
        line = line.replace(/^-?\s*\[ \]/, "").trim();
        line = line.replace(/^[-*•]/, "").trim();
        return line;
      })
      .filter((line) => line.length > 0);

    if (tasks.length > 0) {
      await bulkCreateTasksMutater.mutateAsync({
        tasks,
        projectId,
      });
      setBulkText("");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="end">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Bulk Import Tasks</h4>
          <p className="text-sm text-muted-foreground">
            Paste your tasks below, one per line. Supports markdown checkboxes
            and bullet points.
          </p>
          <textarea
            className="h-[200px] w-full rounded-md border p-2"
            placeholder="- [ ] Task 1&#10;- [ ] Task 2&#10;- Task 3"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => void handleBulkImport()}
              disabled={bulkCreateTasksMutater.isPending}
            >
              {bulkCreateTasksMutater.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import Tasks
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
