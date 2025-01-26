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
      startPosition: { x: number; y: number };
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
    };

type GanttTaskProps = {
  task: Task;
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
  onResizeStart: (taskId: number, edge: "left" | "right") => void;
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
  console.log("task preview", {
    previewOffset,
    previewDuration,
  });

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

    console.log("Mouse Down Event:", {
      taskId: task.task_id,
      offsetX,
      rectWidth: rect.width,
    });

    // Check if clicking on resize handles
    if (localOffsetX < 8) {
      onResizeStart(task.task_id, "left");
    } else if (localOffsetX > rect.width - 8) {
      onResizeStart(task.task_id, "right");
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
    console.log("Panning left from", startDate);
    setStartDate((prev) => {
      const newDate = addDays(prev, -daysToShow);
      console.log("New start date:", newDate);
      return newDate;
    });
  };

  const handlePanRight = () => {
    console.log("Panning right from", startDate);
    setStartDate((prev) => {
      const newDate = addDays(prev, daysToShow);
      console.log("New start date:", newDate);
      return newDate;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.type === "idle") {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.pageX - rect.left;

    console.log("Mouse Move Event:", {
      type: dragState.type,
      taskId: dragState.taskId,
      pageX: e.pageX,
      pageY: e.pageY,
      relativeX: x,
      rectLeft: rect.left,
    });

    switch (dragState.type) {
      case "move": {
        const { taskId, totalMovement, startOffset } = dragState;
        const task = tasks.find((t) => t.task_id === taskId);
        if (!task) {
          console.log("Move: Task not found", { taskId });
          return;
        }

        // Calculate movement since last position
        const dx = e.pageX - (startOffset.x || e.pageX);
        const newMovement = totalMovement + Math.abs(dx);

        // Calculate days moved based on mouse movement
        const daysMoved = Math.round(dx / dayWidth);

        console.log("Move Calculations:", {
          dx,
          newMovement,
          daysMoved,
          dayWidth,
          taskTitle: task.title,
        });

        setDragState({
          ...dragState,
          currentPosition: { x: e.pageX, y: e.pageY },
          startPosition: { x: e.pageX, y: e.pageY },
          totalMovement: newMovement,
        });
        break;
      }
      case "resize": {
        const { taskId, edge, startDate: taskStartDate, duration } = dragState;
        const task = tasks.find((t) => t.task_id === taskId);
        if (!task) {
          console.log("Resize: Task not found", { taskId });
          return;
        }

        const daysDelta = Math.round(x / dayWidth);

        console.log("Resize State:", {
          edge,
          taskId,
          daysDelta,
          currentDuration: duration,
          taskTitle: task.title,
        });

        if (edge === "left") {
          const newStartDate = addDays(taskStartDate, daysDelta);
          const newDuration = duration - daysDelta;
          console.log("Resize Left:", {
            newStartDate,
            newDuration,
            originalStartDate: taskStartDate,
            daysDelta,
          });

          if (newDuration >= 1) {
            setDragState({
              ...dragState,
              currentPosition: { x: e.pageX, y: e.pageY },
            });
          } else {
            console.log("Resize Left: Invalid duration", { newDuration });
          }
        } else {
          const newDuration = duration + daysDelta;
          console.log("Resize Right:", {
            newDuration,
            originalDuration: duration,
            daysDelta,
          });

          if (newDuration >= 1) {
            setDragState({
              ...dragState,
              currentPosition: { x: e.pageX, y: e.pageY },
            });
          } else {
            console.log("Resize Right: Invalid duration", { newDuration });
          }
        }
        break;
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.type === "idle") {
      return;
    }

    console.log("Mouse Up Event:", {
      type: dragState.type,
      taskId: dragState.taskId,
      finalPosition: dragState.currentPosition,
    });

    const task = tasks.find((t) => t.task_id === dragState.taskId);
    if (!task) {
      console.log("Mouse Up: Task not found", { taskId: dragState.taskId });
      setDragState({ type: "idle" });
      return;
    }

    switch (dragState.type) {
      case "move": {
        const MOVEMENT_THRESHOLD = 5; // pixels

        console.log("Move End State:", {
          totalMovement: dragState.totalMovement,
          threshold: MOVEMENT_THRESHOLD,
          currentPosition: dragState.currentPosition,
          startPosition: dragState.startPosition,
        });

        if (dragState.totalMovement < MOVEMENT_THRESHOLD) {
          console.log("Move: Below threshold - treating as click");
          break;
        }

        // Calculate days moved based on total mouse movement
        const daysMoved = Math.round(
          (dragState.currentPosition.x - dragState.startOffset.x) / dayWidth,
        );
        const newStartDate = addDays(dragState.initialTaskDate, daysMoved);

        console.log("Move Final Update:", {
          taskId: task.task_id,
          taskTitle: task.title,
          daysMoved,
          oldStartDate: task.start_date,
          newStartDate,
        });

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
        const daysDelta = Math.round(currentPosition.x / dayWidth);

        console.log("Resize End State:", {
          edge,
          daysDelta,
          taskStartDate,
          duration,
          currentPosition,
        });

        if (edge === "left") {
          const newStartDate = addDays(taskStartDate, daysDelta);
          const newDuration = duration - daysDelta;
          console.log("Resize Left Final:", {
            newStartDate,
            newDuration,
            taskId: task.task_id,
            taskTitle: task.title,
          });

          if (newDuration >= 1) {
            updateTask.mutate({
              taskId: task.task_id,
              data: {
                start_date: newStartDate,
                duration: newDuration,
              },
            });
          } else {
            console.log("Resize Left: Final duration invalid", { newDuration });
          }
        } else {
          const newDuration = duration + daysDelta;
          console.log("Resize Right Final:", {
            newDuration,
            taskId: task.task_id,
            taskTitle: task.title,
          });

          if (newDuration >= 1) {
            updateTask.mutate({
              taskId: task.task_id,
              data: {
                duration: newDuration,
              },
            });
          } else {
            console.log("Resize Right: Final duration invalid", {
              newDuration,
            });
          }
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

    console.log("Move Start:", {
      taskId,
      offset,
      task: task.title,
    });

    setDragState({
      type: "move",
      taskId,
      startOffset: offset,
      currentPosition: offset,
      startPosition: offset,
      initialTaskDate: task.start_date ?? new Date(),
      totalMovement: 0,
    });
  };

  const handleResizeStart = (taskId: number, edge: "left" | "right") => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) {
      console.log("Resize Start: Task not found", { taskId });
      return;
    }

    console.log("Resize Start:", {
      taskId,
      edge,
      taskTitle: task.title,
      startDate: task.start_date,
      duration: task.duration,
    });

    setDragState({
      type: "resize",
      taskId,
      edge,
      startDate: task.start_date ?? new Date(),
      duration: task.duration ?? 1,
      currentPosition: { x: 0, y: 0 },
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
            {tasks.map((task) => (
              <div key={task.task_id} className="relative mb-2 h-8">
                <GanttTask
                  task={task}
                  startDate={startDate}
                  daysToShow={daysToShow}
                  dayWidth={dayWidth}
                  onResizeStart={handleResizeStart}
                  onMoveStart={handleMoveStart}
                  previewOffset={
                    dragState.type !== "idle" &&
                    dragState.taskId === task.task_id
                      ? Math.round(
                          (dragState.currentPosition.x -
                            (dragState.type === "move"
                              ? dragState.startOffset.x
                              : 0)) /
                            dayWidth,
                        ) * dayWidth
                      : undefined
                  }
                  previewDuration={
                    dragState.type === "resize" &&
                    dragState.taskId === task.task_id
                      ? dragState.duration +
                        Math.round(dragState.currentPosition.x / dayWidth)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </GanttGrid>
      </div>
    </div>
  );
}
