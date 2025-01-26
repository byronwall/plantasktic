import {
  addDays,
  differenceInDays,
  format,
  isFirstDayOfMonth,
  isSameDay,
  startOfDay,
} from "date-fns";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { TaskAvatar } from "./TaskAvatar";

import type { Task } from "@prisma/client";

type TimeRange = "days" | "weeks" | "months";

type DragState =
  | { type: "idle" }
  | {
      type: "move";
      taskId: number;
      startOffset: { x: number; y: number };
      currentPosition: { x: number; y: number };
      initialTaskDate: Date;
      totalMovement: number;
    }
  | {
      type: "resize";
      taskId: number;
      edge: "left" | "right";
      startDate: Date;
      duration: number;
      currentPosition: { x: number; y: number };
      startOffset: { x: number; y: number };
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

function GanttTask({
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
      style={{
        width: `${width}px`,
        left: `${leftOffset}px`,
      }}
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute flex h-8 select-none items-center px-2 text-white shadow-sm",
        isUpdating ? "cursor-wait bg-blue-400/70" : "cursor-grab bg-blue-500",
        isEndVisible ? "rounded-r-md" : "",
        isStartVisible ? "rounded-l-md" : "",
      )}
    >
      <TaskAvatar title={task.title} task={task} size={20} />
      <div className="ml-2 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {task.title}
      </div>
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

function getDateFormat(timeRange: TimeRange, date: Date): string {
  switch (timeRange) {
    case "days":
      return "MMM d";
    case "weeks":
      return isSameDay(date, startOfDay(date)) ? "MMM d" : "";
    case "months":
      return isFirstDayOfMonth(date) ? "MMM yyyy" : "";
  }
}

function getGridInterval(timeRange: TimeRange): number {
  switch (timeRange) {
    case "days":
      return 1;
    case "weeks":
      return 7;
    case "months":
      return 7;
  }
}

function GanttHeader({
  startDate,
  daysToShow,
  dayWidth,
  timeRange,
}: {
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
  timeRange: TimeRange;
}) {
  const interval = getGridInterval(timeRange);
  const numIntervals = Math.ceil(daysToShow / interval);

  return (
    <div className="relative h-8 border-b">
      {Array.from({ length: numIntervals }).map((_, index) => {
        const date = addDays(startDate, index * interval);
        const dateFormat = getDateFormat(timeRange, date);
        if (!dateFormat) {
          return null;
        }

        return (
          <div
            key={index}
            className="absolute border-r px-2 text-sm"
            style={{
              left: index * interval * dayWidth,
              width: interval * dayWidth,
            }}
          >
            {format(date, dateFormat)}
          </div>
        );
      })}
    </div>
  );
}

function GanttGrid({
  daysToShow,
  dayWidth,
  timeRange,
  children,
}: {
  daysToShow: number;
  dayWidth: number;
  timeRange: TimeRange;
  children: React.ReactNode;
}) {
  const interval = getGridInterval(timeRange);
  const numIntervals = Math.ceil(daysToShow / interval);

  return (
    <div className="relative">
      {Array.from({ length: numIntervals }).map((_, index) => (
        <div
          key={index}
          className="absolute h-full border-r border-gray-200"
          style={{ left: index * interval * dayWidth }}
        />
      ))}
      {children}
    </div>
  );
}

type PreviewState = {
  taskId: number;
  updatedAt: Date;
  offset?: number;
  duration?: number;
} | null;

export function TaskGanttChart({ tasks }: { tasks: Task[] }) {
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [timeRange, setTimeRange] = useState<TimeRange>("days");
  const [daysToShow, setDaysToShow] = useState(14);
  const [dayWidth, setDayWidth] = useState(80);
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>(null);

  const updateTask = api.task.updateTask.useMutation({
    onMutate: ({ taskId }) => {
      const task = tasks.find((t) => t.task_id === taskId);
      if (task) {
        setUpdatingTaskId(taskId);
        // Update the preview state with the current task's updatedAt
        setPreviewState((prev) =>
          prev?.taskId === taskId
            ? { ...prev, updatedAt: task.updated_at }
            : prev,
        );
      }
    },
    onSettled: () => {
      setUpdatingTaskId(null);
      setPreviewState(null);
    },
  });

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);

    switch (newRange) {
      case "days":
        setDaysToShow(14);
        setDayWidth(80);
        break;
      case "weeks":
        setDaysToShow(14 * 7);
        setDayWidth(20);
        break;
      case "months":
        setDaysToShow(14 * 30);
        setDayWidth(8);
        break;
    }
  };

  const handlePanLeft = () => {
    setStartDate((prev) => {
      const newDate = addDays(prev, -daysToShow);
      return newDate;
    });
  };

  const handlePanRight = () => {
    setStartDate((prev) => {
      const newDate = addDays(prev, daysToShow);
      return newDate;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.type === "idle" || updatingTaskId !== null) {
      return;
    }

    switch (dragState.type) {
      case "move": {
        const { taskId, totalMovement, startOffset } = dragState;
        const task = tasks.find((t) => t.task_id === taskId);
        if (!task) {
          return;
        }

        const dx = e.pageX - (startOffset.x || e.pageX);
        const newMovement = totalMovement + Math.abs(dx);

        setDragState({
          ...dragState,
          currentPosition: { x: e.pageX, y: e.pageY },
          totalMovement: newMovement,
        });

        const daysMoved = Math.round((e.pageX - startOffset.x) / dayWidth);
        const newOffset = daysMoved * dayWidth;

        // Prevent dragging too far left
        if (
          newOffset <
          -differenceInDays(task.start_date ?? new Date(), startDate) * dayWidth
        ) {
          return;
        }

        setPreviewState({
          taskId,
          updatedAt: task.updated_at,
          offset: newOffset,
        });
        break;
      }
      case "resize": {
        const { taskId, edge, duration, startDate: taskStartDate } = dragState;
        const task = tasks.find((t) => t.task_id === taskId);
        if (!task) {
          return;
        }

        const daysDelta = Math.round(
          (e.pageX - dragState.startOffset.x) / dayWidth,
        );

        const newDuration =
          edge === "left" ? duration - daysDelta : duration + daysDelta;

        // Prevent invalid resizing operations
        if (newDuration < 1) {
          return;
        }

        // For left edge, prevent resizing beyond view start
        if (edge === "left") {
          const taskOffset = differenceInDays(taskStartDate, startDate);
          if (taskOffset + daysDelta < 0) {
            return;
          }
        }

        setDragState({
          ...dragState,
          currentPosition: { x: e.pageX, y: e.pageY },
        });

        setPreviewState({
          taskId,
          updatedAt: task.updated_at,
          offset: edge === "left" ? daysDelta * dayWidth : 0,
          duration: newDuration,
        });
        break;
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.type === "idle" || updatingTaskId !== null) {
      return;
    }

    const task = tasks.find((t) => t.task_id === dragState.taskId);
    if (!task) {
      setDragState({ type: "idle" });
      return;
    }

    switch (dragState.type) {
      case "move": {
        const MOVEMENT_THRESHOLD = 5;

        if (dragState.totalMovement < MOVEMENT_THRESHOLD) {
          break;
        }

        const daysMoved = Math.round(
          (dragState.currentPosition.x - dragState.startOffset.x) / dayWidth,
        );
        const newStartDate = addDays(dragState.initialTaskDate, daysMoved);

        updateTask.mutate({
          taskId: task.task_id,
          data: {
            start_date: newStartDate,
          },
        });
        break;
      }
      case "resize": {
        const {
          edge,
          currentPosition,
          startDate: taskStartDate,
          duration,
        } = dragState;

        const daysDelta = Math.round(
          (currentPosition.x - dragState.startOffset.x) / dayWidth,
        );

        const newDuration =
          edge === "left" ? duration - daysDelta : duration + daysDelta;
        const newStartDate =
          edge === "left" ? addDays(taskStartDate, daysDelta) : taskStartDate;

        if (newDuration >= 1) {
          updateTask.mutate({
            taskId: dragState.taskId,
            data: {
              ...(edge === "left" && { start_date: newStartDate }),
              duration: newDuration,
            },
          });
        }
        break;
      }
    }

    setDragState({ type: "idle" });
  };

  const handleMoveStart = (
    taskId: number,
    offset: { x: number; y: number },
  ) => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) {
      return;
    }

    setDragState({
      type: "move",
      taskId,
      startOffset: offset,
      currentPosition: offset,
      initialTaskDate: task.start_date ?? new Date(),
      totalMovement: 0,
    });
  };

  const handleResizeStart = (
    taskId: number,
    edge: "left" | "right",
    offset: { x: number; y: number },
  ) => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) {
      return;
    }

    setDragState({
      type: "resize",
      taskId,
      edge,
      startDate: task.start_date ?? new Date(),
      duration: task.duration ?? 1,
      currentPosition: offset,
      startOffset: offset,
    });
  };

  return (
    <div className="flex flex-col gap-4 overflow-x-auto">
      <div className="flex items-center gap-4 p-2">
        <button
          onClick={() => handleTimeRangeChange("days")}
          className={`rounded-md px-3 py-1 ${
            timeRange === "days"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          14 Days
        </button>
        <button
          onClick={() => handleTimeRangeChange("weeks")}
          className={`rounded-md px-3 py-1 ${
            timeRange === "weeks"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          14 Weeks
        </button>
        <button
          onClick={() => handleTimeRangeChange("months")}
          className={`rounded-md px-3 py-1 ${
            timeRange === "months"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          14 Months
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePanLeft}
            className="rounded-md bg-gray-100 px-3 py-1 hover:bg-gray-200"
          >
            ← Pan Left
          </button>
          <button
            onClick={handlePanRight}
            className="rounded-md bg-gray-100 px-3 py-1 hover:bg-gray-200"
          >
            Pan Right →
          </button>
        </div>
      </div>
      <div
        className="relative"
        style={{ width: `${daysToShow * dayWidth}px` }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (updatingTaskId === null) {
            setDragState({ type: "idle" });
            setPreviewState(null);
          }
        }}
      >
        <GanttHeader
          startDate={startDate}
          daysToShow={daysToShow}
          dayWidth={dayWidth}
          timeRange={timeRange}
        />

        <GanttGrid
          daysToShow={daysToShow}
          dayWidth={dayWidth}
          timeRange={timeRange}
        >
          <div className="relative mt-4">
            {[...tasks]
              .sort((a, b) => {
                const aDate = a.start_date
                  ? startOfDay(a.start_date)
                  : startOfDay(new Date());
                const bDate = b.start_date
                  ? startOfDay(b.start_date)
                  : startOfDay(new Date());
                return aDate.getTime() - bDate.getTime();
              })
              .map((task) => {
                const isUpdating = updatingTaskId === task.task_id;
                const preview =
                  previewState?.taskId === task.task_id &&
                  previewState.updatedAt.getTime() === task.updated_at.getTime()
                    ? previewState
                    : null;

                return (
                  <div key={task.task_id} className="relative mb-2 h-8">
                    <GanttTask
                      task={task}
                      startDate={startDate}
                      daysToShow={daysToShow}
                      dayWidth={dayWidth}
                      onResizeStart={handleResizeStart}
                      onMoveStart={handleMoveStart}
                      previewOffset={preview?.offset}
                      previewDuration={preview?.duration}
                      isUpdating={isUpdating}
                    />
                  </div>
                );
              })}
          </div>
        </GanttGrid>
      </div>
    </div>
  );
}
