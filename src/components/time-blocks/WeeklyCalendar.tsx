"use client";

import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import { DateInput } from "../ui/date-input";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = Array.from({ length: 7 }, (_, i) => i);

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 20;

export function WeeklyCalendar() {
  const { currentWorkspaceId } = useCurrentProject();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(DEFAULT_START_HOUR);
  const [endHour, setEndHour] = useState(DEFAULT_END_HOUR);
  const weekStart = startOfWeek(selectedDate);

  // Fetch time blocks for the current week
  const { data: timeBlocks, isLoading } =
    api.timeBlock.getWeeklyBlocks.useQuery({
      workspaceId: currentWorkspaceId,
      weekStart,
    });

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const displayedHours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour,
  );

  const handlePreviousWeek = () => {
    setSelectedDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate((prev) => addWeeks(prev, 1));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousWeek}>
            ←
          </Button>
          <DateInput value={selectedDate} onChange={handleDateChange} />
          <Button variant="outline" onClick={handleNextWeek}>
            →
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Start Hour:</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">End Hour:</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {/* Header with days */}
        <div className="grid grid-cols-[auto_repeat(7,1fr)] border-b">
          <div className="w-16 border-r p-2" /> {/* Time column header */}
          {DAYS.map((dayOffset) => {
            const date = addDays(weekStart, dayOffset);
            return (
              <div
                key={dayOffset}
                className="border-r p-2 text-center font-medium last:border-r-0"
              >
                {format(date, "EEE MMM d")}
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-[auto_repeat(7,1fr)]">
            {/* Time labels */}
            <div className="space-y-[1px]">
              {displayedHours.map((hour) => (
                <div key={hour} className="h-16 border-r p-2 text-sm">
                  {format(new Date().setHours(hour, 0), "h a")}
                </div>
              ))}
            </div>

            {/* Time slots for each day */}
            {DAYS.map((dayOffset) => (
              <div key={dayOffset} className="space-y-[1px]">
                {displayedHours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-r p-1 last:border-r-0"
                  />
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
