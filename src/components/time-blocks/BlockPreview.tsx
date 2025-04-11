"use client";

import { type TimeBlockWithPosition } from "./WeeklyCalendar"; // Re-use for base block structure

import { cn } from "../../lib/utils";

// Props might evolve, starting simple
type BlockPreviewProps = {
  blockData: Partial<TimeBlockWithPosition>; // Use partial as not all data needed/available
  top: number;
  left: string; // Percentage string
  width: string; // Percentage string
  height: number;
  isDuplicating?: boolean;
  isResizing?: boolean;
  isCreating?: boolean;
  isMoving?: boolean;
};

export const BlockPreview = ({
  blockData,
  top,
  left,
  width,
  height,
  isDuplicating = false,
  isResizing = false,
  isCreating = false,
  isMoving = false,
}: BlockPreviewProps) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 select-none rounded-md border border-dashed bg-opacity-40",
        isDuplicating && "border-green-500 bg-green-500/30",
        isResizing && "border-yellow-500 bg-yellow-500/30",
        isCreating && "border-blue-500 bg-blue-500/30",
        isMoving && !isDuplicating && "border-gray-500 bg-gray-500/30",
      )}
      style={{
        top: `${top}px`,
        left: left,
        width: width,
        height: `${height}px`,
        backgroundColor: blockData.color
          ? `${blockData.color}66` // Add alpha if color exists
          : undefined,
        borderColor: blockData.color || undefined,
      }}
    >
      <div className="h-full overflow-hidden p-1 text-xs text-white">
        {blockData.title || (isCreating ? "New Block" : "Preview")}
      </div>
    </div>
  );
};
