import { MoreVertical } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import { TaskActions } from "./TaskActions";
import { TaskField } from "./TaskField";

import type { Task } from "@prisma/client";

interface TaskSummaryDisplayProps {
  task: Task;
  fields: Array<keyof Task>;
}

export function TaskSummaryDisplay({ task, fields }: TaskSummaryDisplayProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <TaskActions task={task} />
        </PopoverContent>
      </Popover>
      <div className="flex flex-1 items-center gap-2">
        {fields.map((field) => (
          <TaskField key={field} task={task} field={field} />
        ))}
      </div>
    </div>
  );
}
