"use client";
import { Link, Lock } from "lucide-react";
import { type RefObject, useMemo } from "react";

import { cn } from "~/lib/utils";
import { useEditTaskStore } from "~/stores/useEditTaskStore";

import { type TimeBlockWithPosition } from "./WeeklyCalendar";

export type TimeBlockProps = {
  block: TimeBlockWithPosition;
  onDragStart: (blockId: string, offset: { x: number; y: number }) => void;
  onResizeStart: (
    blockId: string,
    edge: "top" | "bottom",
    startTime: Date,
    endTime: Date,
  ) => void;
  isPreview?: boolean;
  startHour: number;
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

  const style = useMemo(() => {
    if (!gridRef.current) {
      return {};
    }

    const startTime = block.startTime;
    const endTime = block.endTime;

    // Calculate days since week start
    const daysDiff = Math.floor(
      (startTime.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const dayOfWeek = Math.max(0, Math.min(numberOfDays - 1, daysDiff));

    const startHourDecimal = startTime.getHours() + startTime.getMinutes() / 60;
    const endHourDecimal = endTime.getHours() + endTime.getMinutes() / 60;
    const duration = endHourDecimal - startHourDecimal;

    const top = (startHourDecimal - startHour) * blockHeight + topOffset;
    const height = duration * blockHeight;

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
      borderRadius: "0.375rem",
      padding: "0.5rem",
      color: "white",
      overflow: "hidden",
      whiteSpace: "nowrap" as const,
      textOverflow: "ellipsis",
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
    block.endTime,
    block.totalOverlaps,
    block.index,
    block.color,
    startHour,
    topOffset,
    isPreview,
    numberOfDays,
    weekStart,
    blockHeight,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreview) {
      return;
    }
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Check if clicking on resize handles
    if (offsetY < 8) {
      onResizeStart(block.id, "top", blockStart, blockEnd);
    } else if (offsetY > rect.height - 8) {
      onResizeStart(block.id, "bottom", blockStart, blockEnd);
    } else {
      onDragStart(block.id, { x: offsetX, y: offsetY });
    }
  };

  return (
    <div
      data-time-block="true"
      className={cn(
        "group absolute z-10 rounded-md border p-2 text-sm",
        isPreview
          ? "border-dashed border-gray-400 bg-gray-100/50"
          : "border-solid bg-card shadow-sm hover:shadow-md",
        isClipped && "border-dashed",
      )}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {!isPreview && (
        <>
          <div className="absolute inset-x-0 top-0 h-2 cursor-ns-resize hover:bg-black/10" />
          <div className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-black/10" />
        </>
      )}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-wrap">
          {block.title || "Untitled Block"}
        </span>
        {block.isFixedTime && <Lock className="h-3 w-3" />}
        {block.taskAssignments?.length > 0 && (
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              if (block.taskAssignments?.[0]?.task) {
                openEditDialog(block.taskAssignments[0].task);
              }
            }}
            className="rounded p-0.5 hover:bg-black/10"
          >
            <Link className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
