import { getGridInterval } from "./getGridInterval";
import { type TimeRange } from "./TaskGanttChart";

export function GanttGrid({
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
