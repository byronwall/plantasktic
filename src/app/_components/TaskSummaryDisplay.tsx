import { format } from "date-fns";
import { MoreVertical } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import { TaskActions } from "./TaskActions";
import { TaskAvatar } from "./TaskAvatar";

import type { Task } from "@prisma/client";

interface TaskSummaryDisplayProps {
  task: Task;
  fields: Array<keyof Task>;
}

export function TaskSummaryDisplay({ task, fields }: TaskSummaryDisplayProps) {
  const formatDate = (date: Date | null) => {
    if (!date) {
      return "";
    }
    return format(date, "MMM d, yyyy");
  };

  const getDateField = () => {
    if (fields.includes("created_at")) {
      return formatDate(task.created_at);
    }
    if (fields.includes("due_date")) {
      return formatDate(task.due_date);
    }
    return "";
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <TaskActions task={task} />
        </PopoverContent>
      </Popover>

      <TaskAvatar task={task} size={32} />

      <div className="flex flex-1 flex-col gap-1">
        <div className="font-medium leading-none">{task.title}</div>
        <div className="text-sm text-muted-foreground">{getDateField()}</div>
      </div>

      {fields.includes("priority") && task.priority && (
        <div className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Priority: {task.priority}
        </div>
      )}
    </div>
  );
}
