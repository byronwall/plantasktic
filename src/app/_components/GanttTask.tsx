"use client";

import { addDays, differenceInDays, startOfDay } from "date-fns";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { cn } from "~/lib/utils";

import { TaskAvatar } from "./TaskAvatar";

import type { Task } from "@prisma/client";

// Function to select a color from the current palette based on string input

type GanttTaskProps = {
  task: Task;
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
  onResizeStart: (
    taskId: number,
    edge: "left" | "right",
    offset: { x: number; y: number },
  ) => void;
  onMoveStart: (taskId: number, offset: { x: number; y: number }) => void;
  previewOffset?: number;
  previewDuration?: number;
  isUpdating?: boolean;
  size: "small" | "medium" | "large";
  visibleDateRange?: {
    start: Date;
    end: Date;
  };
};

export function GanttTask({
  task,
  startDate,
  daysToShow,
  dayWidth,
  onResizeStart,
  onMoveStart,
  previewOffset,
  previewDuration,
  isUpdating,
  size,
  visibleDateRange,
}: GanttTaskProps) {
  const taskStartDate = task.start_date
    ? startOfDay(task.start_date)
    : startOfDay(new Date());
  const taskDuration = task.duration ?? 1;
  const taskEndDate = addDays(taskStartDate, taskDuration);

  const _leftOffset =
    differenceInDays(taskStartDate, startDate) * dayWidth +
    (previewOffset ?? 0);

  const leftOffset = Math.max(0, _leftOffset);

  const width = Math.min(
    (previewDuration ?? taskDuration) * dayWidth,
    daysToShow * dayWidth - leftOffset,
  );

  const expectedWidth = (previewDuration ?? taskDuration) * dayWidth;

  // Calculate visibility states using date ranges if provided
  const isStartVisible = visibleDateRange
    ? taskStartDate >= visibleDateRange.start &&
      taskStartDate <= visibleDateRange.end
    : leftOffset >= 0 && leftOffset < daysToShow * dayWidth;

  const isEndVisible = visibleDateRange
    ? taskEndDate >= visibleDateRange.start &&
      taskEndDate <= visibleDateRange.end
    : expectedWidth < daysToShow * dayWidth - leftOffset;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isUpdating) {
      return;
    }

    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.pageX;
    const localOffsetX = offsetX - rect.left;

    // Check if clicking on resize handles - only allow if that edge is visible
    if (localOffsetX < 8 && isStartVisible) {
      onResizeStart(task.task_id, "left", { x: e.pageX, y: e.pageY });
    } else if (localOffsetX > rect.width - 8 && isEndVisible) {
      onResizeStart(task.task_id, "right", { x: e.pageX, y: e.pageY });
    } else {
      // Always allow moving, even if not fully visible
      onMoveStart(task.task_id, { x: offsetX, y: 0 });
    }
  };

  // Don't render if completely outside view
  if (visibleDateRange) {
    const taskEndDate = addDays(taskStartDate, previewDuration ?? taskDuration);
    if (
      taskEndDate < visibleDateRange.start ||
      taskStartDate > visibleDateRange.end
    ) {
      console.log("not rendering", task.title);
      return null;
    }
  } else if (leftOffset > daysToShow * dayWidth || leftOffset + width < 0) {
    console.log("not rendering", task.title);
    return null;
  }

  console.log("rendering", task.title, leftOffset, width);

  return (
    <div
      style={
        {
          width: `${width}px`,
          left: `${leftOffset}px`,
        } as React.CSSProperties
      }
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute flex h-full select-none items-center border border-gray-700 bg-white p-0.5 shadow-sm",
        isUpdating ? "cursor-wait text-gray-600" : "cursor-grab text-gray-900",
        isStartVisible ? "rounded-l-lg" : "",
        isEndVisible ? "rounded-r-lg" : "",
      )}
    >
      <TaskAvatar title={task.title} task={task} size={20} />
      <SimpleTooltip
        content={task.title}
        className="max-w-lg"
        contentProps={{
          align: "start",
        }}
      >
        <div
          className={cn(
            "ml-2 h-full flex-1 text-wrap [overflow-wrap:anywhere]",
            {
              "line-clamp-1": size === "small",
              "line-clamp-2": size === "medium",
              "line-clamp-3": size === "large",
            },
          )}
        >
          {task.title}
        </div>
      </SimpleTooltip>
      {!isUpdating && (
        <>
          {isStartVisible && (
            <div className="absolute left-0 top-0 h-full w-2 cursor-ew-resize" />
          )}
          {isEndVisible && (
            <div className="absolute right-0 top-0 h-full w-2 cursor-ew-resize" />
          )}
        </>
      )}
    </div>
  );
}
