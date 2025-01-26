"use client";

import { differenceInDays, startOfDay } from "date-fns";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { cn } from "~/lib/utils";
import { useColorPaletteStore } from "~/stores/useColorPaletteStore";

import { TaskAvatar } from "./TaskAvatar";

import type { Task } from "@prisma/client";

// Function to select a color from the current palette based on string input
const getColorFromString = (str: string, index: number): string => {
  const selectedColors = useColorPaletteStore.getState().selectedColors;

  // Return a default color if no colors are selected
  if (selectedColors.length === 0) {
    return "#6366f1";
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to select a color from the palette
  const colorIndex = Math.abs(hash + index * 137) % selectedColors.length;
  return selectedColors[colorIndex]!;
};

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
}: GanttTaskProps) {
  const taskStartDate = task.start_date
    ? startOfDay(task.start_date)
    : startOfDay(new Date());
  const taskDuration = task.duration ?? 1;

  const leftOffset =
    Math.max(0, differenceInDays(taskStartDate, startDate)) * dayWidth +
    (previewOffset ?? 0);

  const width = Math.min(
    (previewDuration ?? taskDuration) * dayWidth,
    daysToShow * dayWidth - leftOffset,
  );

  const expectedWidth = (previewDuration ?? taskDuration) * dayWidth;

  // Calculate visibility states
  const isStartVisible = leftOffset >= 0 && leftOffset < daysToShow * dayWidth;
  const isEndVisible = expectedWidth < daysToShow * dayWidth - leftOffset;

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
  if (leftOffset > daysToShow * dayWidth || leftOffset + width < 0) {
    return null;
  }

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
        <div className="ml-2 h-full flex-1 overflow-hidden text-ellipsis whitespace-break-spaces text-wrap break-words">
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
