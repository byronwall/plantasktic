import { addDays, differenceInDays, format, startOfDay } from "date-fns";

import { cn } from "~/lib/utils";

import { getGridInterval } from "./getGridInterval";
import { type TimeRange } from "./TaskGanttChart";

export function getDateFormat(timeRange: TimeRange): string {
  switch (timeRange) {
    case "days":
      return "MMM d";
    case "weeks":
      return "MMM d";
    case "months":
      return "MMM yyyy";
  }
}

export function GanttHeader({
  startDate,
  daysToShow,
  dayWidth,
  timeRange,
  previewDates,
}: {
  startDate: Date;
  daysToShow: number;
  dayWidth: number;
  timeRange: TimeRange;
  previewDates?: {
    type: "move" | "resize";
    edge?: "left" | "right";
    startDate?: Date;
    endDate?: Date;
  };
}) {
  const interval = getGridInterval(timeRange);
  const numIntervals = Math.ceil(daysToShow / interval);

  const today = startOfDay(new Date());
  const todayOffset = differenceInDays(today, startDate) * dayWidth;

  // Only show if today is within the visible range
  const showTodayLine =
    todayOffset >= 0 && todayOffset <= daysToShow * dayWidth;

  return (
    <div className="relative h-12 border-b">
      {/* Main interval labels */}
      {Array.from({ length: numIntervals }).map((_, index) => {
        const date = addDays(startDate, index * interval);
        const dateFormat = getDateFormat(timeRange);
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

      {/* Today line */}
      {showTodayLine && (
        <div
          className="absolute bottom-0 h-4 w-0.5 bg-blue-400/50"
          style={{ left: todayOffset }}
        />
      )}

      {/* Preview markers */}
      {previewDates && (
        <>
          {previewDates.startDate &&
            (previewDates.type === "move" || previewDates.edge === "left") && (
              <div
                className="absolute bottom-0 h-4 w-1 animate-pulse bg-red-500"
                style={{
                  left:
                    differenceInDays(previewDates.startDate, startDate) *
                    dayWidth,
                }}
              />
            )}
          {previewDates.endDate &&
            (previewDates.type === "move" || previewDates.edge === "right") && (
              <div
                className="absolute bottom-0 h-4 w-1 animate-pulse bg-red-500"
                style={{
                  left:
                    differenceInDays(previewDates.endDate, startDate) *
                    dayWidth,
                }}
              />
            )}
        </>
      )}

      {/* Sub-markers for days/weeks */}
      {timeRange !== "days" && (
        <div className="absolute bottom-0 h-4 w-full">
          {Array.from({ length: daysToShow }).map((_, index) => {
            const date = addDays(startDate, index);
            const isWeekStart = timeRange === "months" && date.getDay() === 0;
            const shouldShowMarker = timeRange === "weeks" || isWeekStart;

            if (!shouldShowMarker) {
              return null;
            }

            return (
              <div
                key={index}
                className={cn(
                  "absolute bottom-0 border-r",
                  timeRange === "weeks"
                    ? "h-2 border-gray-300"
                    : "h-3 border-gray-400",
                )}
                style={{
                  left: index * dayWidth,
                }}
              >
                {timeRange === "weeks" && (
                  <div className="absolute -top-3 -translate-x-1/2 text-[10px] text-gray-500">
                    {format(date, "d")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
