import {
  addDays,
  differenceInDays,
  format,
  isFirstDayOfMonth,
  isSameDay,
  startOfDay,
} from "date-fns";
import { useState } from "react";

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.pageX;
    const localOffsetX = offsetX - rect.left;

    // Check if clicking on resize handles
    if (localOffsetX < 8) {
      onResizeStart(task.task_id, "left", { x: e.pageX, y: e.pageY });
    } else if (localOffsetX > rect.width - 8) {
      onResizeStart(task.task_id, "right", { x: e.pageX, y: e.pageY });
    } else {
      onMoveStart(task.task_id, { x: offsetX, y: 0 });
    }
  };

  return (
    <div
      style={{
        width: `${width}px`,
        left: `${leftOffset}px`,
      }}
      onMouseDown={handleMouseDown}
      className="absolute flex h-8 cursor-grab items-center rounded-md bg-blue-500 px-2 text-white shadow-sm"
    >
      <TaskAvatar title={task.title} task={task} size={20} />
      <div className="ml-2 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {task.title}
      </div>
      <div className="absolute left-0 top-0 h-full w-2 cursor-ew-resize" />
      <div className="absolute right-0 top-0 h-full w-2 cursor-ew-resize" />
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

export function TaskGanttChart({ tasks }: { tasks: Task[] }) {
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [timeRange, setTimeRange] = useState<TimeRange>("days");
  const [daysToShow, setDaysToShow] = useState(14);
  const [dayWidth, setDayWidth] = useState(80);
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });

  const updateTask = api.task.updateTask.useMutation();

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
    if (dragState.type === "idle") {
      return;
    }

    switch (dragState.type) {
      case "move": {
        const { taskId, totalMovement, startOffset } = dragState;
        const task = tasks.find((t) => t.task_id === taskId);
        if (!task) {
          return;
        }

        // Calculate movement since last position
        const dx = e.pageX - (startOffset.x || e.pageX);
        const newMovement = totalMovement + Math.abs(dx);

        setDragState({
          ...dragState,
          currentPosition: { x: e.pageX, y: e.pageY },
          totalMovement: newMovement,
        });
        break;
      }
      case "resize": {
        const { taskId, edge, duration } = dragState;
        const task = tasks.find((t) => t.task_id === taskId);
        if (!task) {
          return;
        }

        // Calculate days delta based on relative position
        const daysDelta = Math.round(
          (e.pageX - dragState.startOffset.x) / dayWidth,
        );

        // Calculate new duration based on edge
        const newDuration =
          edge === "left" ? duration - daysDelta : duration + daysDelta;

        // Only update state if duration is valid
        if (newDuration >= 1) {
          setDragState({
            ...dragState,
            currentPosition: { x: e.pageX, y: e.pageY },
          });
        }
        break;
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.type === "idle") {
      return;
    }

    const task = tasks.find((t) => t.task_id === dragState.taskId);
    if (!task) {
      setDragState({ type: "idle" });
      return;
    }

    switch (dragState.type) {
      case "move": {
        const MOVEMENT_THRESHOLD = 5; // pixels

        if (dragState.totalMovement < MOVEMENT_THRESHOLD) {
          break;
        }

        // Calculate days moved based on total mouse movement
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

        // Calculate new values based on edge
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
        onMouseLeave={() => setDragState({ type: "idle" })}
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
            {tasks.map((task) => {
              let previewOffset =
                dragState.type !== "idle" && dragState.taskId === task.task_id
                  ? Math.round(
                      (dragState.currentPosition.x - dragState.startOffset.x) /
                        dayWidth,
                    ) * dayWidth
                  : undefined;

              if (dragState.type === "resize") {
                if (dragState.edge === "right") {
                  previewOffset = 0;
                }
              }

              const previewDuration =
                dragState.type === "resize" && dragState.taskId === task.task_id
                  ? dragState.duration +
                    (dragState.edge === "left"
                      ? -Math.round(
                          (dragState.currentPosition.x -
                            dragState.startOffset.x) /
                            dayWidth,
                        )
                      : Math.round(
                          (dragState.currentPosition.x -
                            dragState.startOffset.x) /
                            dayWidth,
                        ))
                  : undefined;
              return (
                <div key={task.task_id} className="relative mb-2 h-8">
                  <GanttTask
                    task={task}
                    startDate={startDate}
                    daysToShow={daysToShow}
                    dayWidth={dayWidth}
                    onResizeStart={handleResizeStart}
                    onMoveStart={handleMoveStart}
                    previewOffset={previewOffset}
                    previewDuration={previewDuration}
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
