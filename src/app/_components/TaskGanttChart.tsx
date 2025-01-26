"use client";

import { addDays, differenceInDays, startOfDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import { DateInput } from "~/components/ui/date-input";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { GanttGrid } from "./GanttGrid";
import { GanttHeader } from "./GanttHeader";
import { GanttTask } from "./GanttTask";
import { GanttTaskOverflow } from "./GanttTaskOverflow";

import type { Task } from "@prisma/client";

export type TimeRange = "days" | "weeks" | "months";
export type RowHeight = "small" | "medium" | "large";

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
  const [rowHeight, setRowHeight] = useState<RowHeight>("small");
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>(null);
  const [previewDates, setPreviewDates] = useState<{
    type: "move" | "resize";
    edge?: "left" | "right";
    startDate?: Date;
    endDate?: Date;
  } | null>(null);

  // Calculate visible date range
  const visibleDateRange = useMemo(() => {
    const endDate = addDays(startDate, daysToShow);
    return {
      start: startDate,
      end: endDate,
    };
  }, [startDate, daysToShow]);

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
        setDaysToShow(8 * 7);
        setDayWidth(20);
        break;
      case "months":
        setDaysToShow(5 * 30);
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

        const newStartDate = addDays(dragState.initialTaskDate, daysMoved);
        const newEndDate = addDays(newStartDate, task.duration ?? 1);

        setPreviewDates({
          type: "move",
          startDate: newStartDate,
          endDate: newEndDate,
        });

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

        const newStartDate =
          edge === "left" ? addDays(taskStartDate, daysDelta) : taskStartDate;
        const newEndDate = addDays(newStartDate, newDuration);

        setPreviewDates({
          type: "resize",
          edge,
          startDate: edge === "left" ? newStartDate : undefined,
          endDate: newEndDate,
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

    setPreviewDates(null);
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
      <div className="flex items-center gap-2 p-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleTimeRangeChange("days")}
            variant={timeRange === "days" ? "default" : "outline"}
            size="sm"
          >
            <Calendar className="mr-2 h-4 w-4" />
            14 Days
          </Button>
          <Button
            onClick={() => handleTimeRangeChange("weeks")}
            variant={timeRange === "weeks" ? "default" : "outline"}
            size="sm"
          >
            <Calendar className="mr-2 h-4 w-4" />8 Weeks
          </Button>
          <Button
            onClick={() => handleTimeRangeChange("months")}
            variant={timeRange === "months" ? "default" : "outline"}
            size="sm"
          >
            <Calendar className="mr-2 h-4 w-4" />5 Months
          </Button>
        </div>
        <div className="flex items-center gap-2 rounded-md border p-1">
          <SimpleTooltip content="Small Row Height">
            <Button
              onClick={() => setRowHeight("small")}
              variant={rowHeight === "small" ? "default" : "outline"}
              size="sm"
            >
              S
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Medium Row Height">
            <Button
              onClick={() => setRowHeight("medium")}
              variant={rowHeight === "medium" ? "default" : "outline"}
              size="sm"
            >
              M
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Large Row Height">
            <Button
              onClick={() => setRowHeight("large")}
              variant={rowHeight === "large" ? "default" : "outline"}
              size="sm"
            >
              L
            </Button>
          </SimpleTooltip>
        </div>
        <div className="flex items-center gap-2">
          <SimpleTooltip content="Pan Left">
            <Button
              onClick={handlePanLeft}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <DateInput
            value={startDate}
            onChange={(date) => setStartDate(date ?? new Date())}
          />
          <SimpleTooltip content="Pan Right">
            <Button
              onClick={handlePanRight}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
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
            setPreviewDates(null);
          }
        }}
      >
        <GanttHeader
          startDate={startDate}
          daysToShow={daysToShow}
          dayWidth={dayWidth}
          timeRange={timeRange}
          previewDates={previewDates ?? undefined}
        />

        <GanttGrid
          daysToShow={daysToShow}
          dayWidth={dayWidth}
          timeRange={timeRange}
          startDate={startDate}
        >
          <div className="relative mt-4">
            {[...tasks]
              // Filter out tasks that are completely outside the visible range
              .filter((task) => {
                const taskStartDate = task.start_date
                  ? startOfDay(task.start_date)
                  : startOfDay(new Date());
                const taskDuration = task.duration ?? 1;
                const taskEndDate = addDays(taskStartDate, taskDuration);

                return !(
                  taskEndDate < visibleDateRange.start ||
                  taskStartDate > visibleDateRange.end
                );
              })
              // Sort remaining tasks by start date
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
                  <div
                    key={task.task_id}
                    className={cn("relative mb-2", {
                      "h-8": rowHeight === "small",
                      "h-12": rowHeight === "medium",
                      "h-24": rowHeight === "large",
                    })}
                  >
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
                      size={rowHeight}
                      visibleDateRange={visibleDateRange}
                    />
                  </div>
                );
              })}
            <GanttTaskOverflow
              tasks={tasks}
              startDate={startDate}
              daysToShow={daysToShow}
              dayWidth={dayWidth}
              rowHeight={rowHeight}
            />
          </div>
        </GanttGrid>
      </div>
    </div>
  );
}
