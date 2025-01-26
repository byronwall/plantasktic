import { differenceInDays, startOfDay } from "date-fns";

import { getGridInterval } from "./getGridInterval";
import { type TimeRange } from "./TaskGanttChart";

export function GanttGrid({
  daysToShow,
  dayWidth,
  timeRange,
  startDate,
  children,
}: {
  daysToShow: number;
  dayWidth: number;
  timeRange: TimeRange;
  startDate: Date;
  children: React.ReactNode;
}) {
  const interval = getGridInterval(timeRange);
  const numIntervals = Math.ceil(daysToShow / interval);

  const today = startOfDay(new Date());
  const todayOffset = differenceInDays(today, startDate) * dayWidth;

  // Only show if today is within the visible range
  const showTodayLine =
    todayOffset >= 0 && todayOffset <= daysToShow * dayWidth;

  return (
    <div className="relative">
      {Array.from({ length: numIntervals }).map((_, index) => (
        <div
          key={index}
          className="absolute h-full border-r border-gray-200"
          style={{ left: index * interval * dayWidth }}
        />
      ))}
      {showTodayLine && (
        <div
          className="absolute h-full w-0.5 bg-blue-400/50"
          style={{ left: todayOffset }}
        />
      )}
      {children}
    </div>
  );
}
