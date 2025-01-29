"use client";
import { Link } from "lucide-react";

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
  gridRef: React.RefObject<HTMLDivElement>;
};

export function TimeBlock({
  block,
  onDragStart,
  onResizeStart,
  isPreview = false,
  startHour,
  gridRef,
}: TimeBlockProps) {
  const openEditDialog = useEditTaskStore((state) => state.open);
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);

  const dayOffset = blockStart.getDay();
  const startHourOffset = blockStart.getHours() - startHour;
  const startMinuteOffset = blockStart.getMinutes() / 60;
  const duration =
    (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60 * 60);

  const baseWidth = 100 / 7;
  const width =
    block.totalOverlaps && block.totalOverlaps > 1
      ? baseWidth / Math.min(block.totalOverlaps, 3)
      : baseWidth;

  // Calculate the actual width in pixels to subtract 2px from each side
  const gridWidth = gridRef.current?.clientWidth ?? 0;
  const adjustedWidth = gridWidth ? width - (4 / gridWidth) * 100 : width;

  const leftOffset =
    block.totalOverlaps && block.totalOverlaps <= 3 && block.index
      ? dayOffset * baseWidth + width * (block.index || 0)
      : dayOffset * baseWidth;

  // Add 2px margin to center the block
  const adjustedLeftOffset = gridWidth
    ? leftOffset + (2 / gridWidth) * 100
    : leftOffset;

  const style = {
    position: "absolute" as const,
    left: `${adjustedLeftOffset}%`,
    top: `${(startHourOffset + startMinuteOffset) * 64}px`,
    height: `${duration * 64}px`,
    width: `${adjustedWidth}%`,
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
      style={style}
      data-time-block="true"
      onMouseDown={handleMouseDown}
      className={cn("group relative select-none")}
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
