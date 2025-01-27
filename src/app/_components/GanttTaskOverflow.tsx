"use client";

import { addDays, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import type { Task } from "@prisma/client";
import type { RowHeight } from "./TaskGanttChart";

type GanttTaskOverflowProps = {
  tasks: Task[];
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
  rowHeight: RowHeight;
  onNavigateToTask: (date: Date) => void;
};

export function GanttTaskOverflow({
  tasks,
  startDate,
  daysToShow,
  dayWidth,
  rowHeight,
  onNavigateToTask,
}: GanttTaskOverflowProps) {
  const visibleDateRange = {
    start: startDate,
    end: addDays(startDate, daysToShow),
  };

  // Filter tasks to only those outside the visible range and group them by direction
  const { beforeTasks, afterTasks } = tasks.reduce<{
    beforeTasks: Task[];
    afterTasks: Task[];
  }>(
    (acc, task) => {
      const taskStartDate = task.start_date
        ? startOfDay(task.start_date)
        : startOfDay(new Date());
      const taskDuration = task.duration ?? 1;
      const taskEndDate = addDays(taskStartDate, taskDuration);

      if (taskEndDate < visibleDateRange.start) {
        acc.beforeTasks.push(task);
      } else if (taskStartDate > visibleDateRange.end) {
        acc.afterTasks.push(task);
      }

      return acc;
    },
    { beforeTasks: [], afterTasks: [] },
  );

  const overflowTasks = [...beforeTasks, ...afterTasks];

  if (overflowTasks.length === 0) {
    return null;
  }

  const handleNavigateToEarlierTask = () => {
    // Find the task with the latest start_date among tasks that start before the visible range
    const latestBeforeTask = beforeTasks
      .filter((task) => task.start_date)
      .sort((a, b) => {
        const aDate = a.start_date ?? new Date();
        const bDate = b.start_date ?? new Date();
        return bDate.getTime() - aDate.getTime(); // Sort descending
      })[0];

    if (latestBeforeTask?.start_date) {
      onNavigateToTask(latestBeforeTask.start_date);
    }
  };

  const handleNavigateToLaterTask = () => {
    // Find the task with the earliest start_date among tasks that start after the visible range
    const earliestAfterTask = afterTasks
      .filter((task) => task.start_date)
      .sort((a, b) => {
        const aDate = a.start_date ?? new Date();
        const bDate = b.start_date ?? new Date();
        return aDate.getTime() - bDate.getTime(); // Sort ascending
      })[0];

    if (earliestAfterTask?.start_date) {
      onNavigateToTask(earliestAfterTask.start_date);
    }
  };

  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-between rounded-lg border bg-muted/50 p-2",
        {
          "h-8": rowHeight === "small",
          "h-12": rowHeight === "medium",
          "h-24": rowHeight === "large",
        },
      )}
    >
      <div className="flex items-center gap-4">
        {beforeTasks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigateToEarlierTask}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {beforeTasks.length} earlier
          </Button>
        )}
        <div className="text-sm text-muted-foreground">
          {overflowTasks.length} task{overflowTasks.length === 1 ? "" : "s"}{" "}
          outside visible range
        </div>
      </div>
      {afterTasks.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigateToLaterTask}
          className="gap-2"
        >
          {afterTasks.length} later
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
