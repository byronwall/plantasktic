"use client";

import { format } from "date-fns";

export type TimeIndicatorProps = {
  top: number;
  left: string; // Percentage string
  width: string; // Percentage string
  time: Date;
  type: "current" | "selection-start" | "selection-end";
  labelOnLeft?: boolean; // Add optional prop
};

export function TimeIndicator({
  top,
  left,
  width,
  time,
  type,
  labelOnLeft = false, // Default to false
}: TimeIndicatorProps) {
  const isCurrent = type === "current";
  const color = isCurrent ? "bg-blue-500" : "bg-gray-500";
  const zIndex = isCurrent ? "z-10" : "z-5"; // Ensure current time is above selection

  return (
    <div
      className={`pointer-events-none absolute h-0.5 ${color} ${zIndex}`}
      style={{ top, left, width }}
    >
      <div
        className={`time-label absolute top-1/2 -translate-y-1/2 transform rounded px-1 py-0.5 text-xs text-white ${labelOnLeft ? "-left-14 bg-orange-500" : "-right-14 bg-red-500"}`}
        // Changed colors to easily see the difference during testing
      >
        {format(time, "h:mm a")}
      </div>
    </div>
  );
}
