import { type TimeRange } from "./TaskGanttChart";

export function getGridInterval(timeRange: TimeRange): number {
  switch (timeRange) {
    case "days":
      return 1;
    case "weeks":
      return 7;
    case "months":
      return 30;
  }
}
