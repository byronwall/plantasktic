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
  // Determine the border color based on state or block data
  const borderColor = isDuplicating
    ? "border-green-500"
    : isResizing
      ? "border-yellow-500"
      : isCreating
        ? "border-blue-500"
        : isMoving
          ? "border-gray-500"
          : blockData.color
            ? undefined // Use inline style for custom color
            : "border-gray-400"; // Default border

  const inlineBorderColor =
    blockData.color && !borderColor ? blockData.color : undefined;

  return (
    <div
      // Remove background classes, keep base styles
      className={cn(
        "pointer-events-none absolute z-20 select-none rounded-md border-2 border-dashed", // Use border-2 for visibility
        borderColor, // Apply dynamic border color class if not using inline style
      )}
      style={{
        top: `${top}px`,
        left: left,
        width: width,
        height: `${height}px`,
        borderColor: inlineBorderColor, // Apply inline border color if needed
        backgroundColor: "transparent", // Ensure no background fill
      }}
    ></div>
  );
};
