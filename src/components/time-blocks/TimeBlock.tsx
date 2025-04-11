"use client";
import { Link, Lock } from "lucide-react";
import { useMemo, type MouseEvent, type RefObject } from "react";

import { cn } from "~/lib/utils";
import { useEditTaskStore } from "~/stores/useEditTaskStore";

import { type TimeBlockWithPosition } from "./WeeklyCalendar";

export type TimeBlockProps = {
  block: TimeBlockWithPosition & {
    isClippedStart?: boolean;
    isClippedEnd?: boolean;
  };
  onDragStart: (
    blockId: string,
    offset: { x: number; y: number },
    e: MouseEvent,
  ) => void;
  onResizeStart: (
    blockId: string,
    edge: "top" | "bottom",
    startTime: Date,
    endTime: Date,
    e: MouseEvent,
  ) => void;
  isPreview?: boolean;
  startHour: number;
  endHour: number;
  gridRef: RefObject<HTMLDivElement>;
  isClipped?: boolean;
  topOffset?: number;
  numberOfDays?: number;
  weekStart: Date;
  blockHeight?: number;
};

export function TimeBlock({
  block,
  onDragStart,
  onResizeStart,
  isPreview = false,
  startHour,
  endHour,
  gridRef,
  isClipped = false,
  topOffset = 0,
  numberOfDays = 7,
  weekStart,
  blockHeight = 64,
}: TimeBlockProps) {
  const openEditDialog = useEditTaskStore((state) => state.open);
  const blockStart = block.startTime;
  const blockEnd = block.endTime;

  const startHourDecimal = blockStart.getHours() + blockStart.getMinutes() / 60;
  const endHourDecimal = blockEnd.getHours() + blockEnd.getMinutes() / 60;

  const style = useMemo(() => {
    if (!gridRef.current) {
      return {};
    }

    const startTime = block.startTime;

    // Calculate days since week start
    const daysDiff = Math.floor(
      (startTime.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const dayOfWeek = Math.max(0, Math.min(numberOfDays - 1, daysDiff));

    // Calculate position and size based on visible portion
    const visibleStartHour = block.isClippedStart
      ? startHour
      : startHourDecimal;
    const visibleEndHour = block.isClippedEnd ? endHour : endHourDecimal;
    const duration = visibleEndHour - visibleStartHour;

    // Calculate position and size
    const top = (visibleStartHour - startHour) * blockHeight + topOffset;
    const height = Math.max(duration * blockHeight, 0);

    const width =
      (block.totalOverlaps ?? 1) > 1
        ? `${100 / (block.totalOverlaps ?? 1)}%`
        : "100%";
    const left =
      block.index !== undefined && block.totalOverlaps
        ? `${(block.index * 100) / block.totalOverlaps}%`
        : "0%";

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${(dayOfWeek * 100) / numberOfDays + parseFloat(left) / numberOfDays}%`,
      width: `${parseFloat(width) / numberOfDays}%`,
      backgroundColor: block.color || "#3b82f6",
      opacity: isPreview ? 0.4 : 0.8,
      borderRadius: isClipped ? "0" : "0.375rem",
      borderStyle: isClipped ? "dashed" : "solid",
      color: "white",
      overflow: "hidden",
      cursor: isPreview ? "default" : "grab",
      zIndex:
        block.totalOverlaps && block.totalOverlaps > 3
          ? (block.index || 0) + 1
          : 1,
      pointerEvents: (isPreview
        ? "none"
        : "auto") as React.CSSProperties["pointerEvents"],
    };
  }, [
    gridRef,
    block.startTime,
    block.isClippedStart,
    block.isClippedEnd,
    block.totalOverlaps,
    block.index,
    block.color,
    weekStart,
    numberOfDays,
    startHour,
    startHourDecimal,
    endHour,
    endHourDecimal,
    blockHeight,
    topOffset,
    isPreview,
    isClipped,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreview) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Check if clicking on resize handles
    if (offsetY < 8) {
      onResizeStart(block.id, "top", blockStart, blockEnd, e);
    } else if (offsetY > rect.height - 8) {
      onResizeStart(block.id, "bottom", blockStart, blockEnd, e);
    } else {
      onDragStart(block.id, { x: offsetX, y: offsetY }, e);
    }
  };

  return (
    <div
      data-time-block="true"
      className={cn(
        "group absolute z-10 rounded-md border",
        isPreview
          ? "border-dashed border-gray-400 bg-gray-100/50"
          : "border-solid bg-card shadow-sm hover:shadow-md",
        isClipped && "rounded-none border-dashed",
        block.isClippedStart && "rounded-t-none border-t-0",
        block.isClippedEnd && "rounded-b-none border-b-0",
      )}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <div className="h-full p-2 text-sm">
        {!isPreview && (
          <>
            <div className="absolute inset-x-0 top-0 h-2 cursor-ns-resize hover:bg-black/10" />
            <div className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-black/10" />
          </>
        )}
        <div className="flex h-full flex-col justify-between overflow-hidden">
          <div className="flex items-start gap-2">
            <span className="flex-1 overflow-hidden">
              {block.title || "Untitled Block"}
            </span>
            <div className="flex items-center gap-1">
              {block.isFixedTime && <Lock className="h-3 w-3" />}
              {block.taskAssignments?.length > 0 && (
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (block.taskAssignments?.[0]?.task) {
                      openEditDialog(block.taskAssignments[0].task.task_id);
                    }
                  }}
                  className="rounded p-0.5 hover:bg-black/10"
                >
                  <Link className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
