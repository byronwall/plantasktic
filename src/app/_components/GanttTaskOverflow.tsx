import { addDays, startOfDay } from "date-fns";

import { cn } from "~/lib/utils";

import type { Task } from "@prisma/client";
import type { RowHeight } from "./TaskGanttChart";

type GanttTaskOverflowProps = {
  tasks: Task[];
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
  rowHeight: RowHeight;
};

export function GanttTaskOverflow({
  tasks,
  startDate,
  daysToShow,
  dayWidth,
  rowHeight,
}: GanttTaskOverflowProps) {
  const visibleDateRange = {
    start: startDate,
    end: addDays(startDate, daysToShow),
  };

  // Filter tasks to only those outside the visible range
  const overflowTasks = tasks.filter((task) => {
    const taskStartDate = task.start_date
      ? startOfDay(task.start_date)
      : startOfDay(new Date());
    const taskDuration = task.duration ?? 1;
    const taskEndDate = addDays(taskStartDate, taskDuration);

    return (
      taskEndDate < visibleDateRange.start ||
      taskStartDate > visibleDateRange.end
    );
  });

  if (overflowTasks.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("mt-4 rounded-lg border bg-muted/50 p-2", {
        "h-8": rowHeight === "small",
        "h-12": rowHeight === "medium",
        "h-24": rowHeight === "large",
      })}
    >
      <div className="text-sm text-muted-foreground">
        {overflowTasks.length} task{overflowTasks.length === 1 ? "" : "s"}{" "}
        outside visible range
      </div>
    </div>
  );
}
