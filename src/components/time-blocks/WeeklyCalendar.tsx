"use client";

import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import { CreateTimeBlockDialog } from "./CreateTimeBlockDialog";

import { DateInput } from "../ui/date-input";

import type { TimeBlock } from "@prisma/client";

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

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<{
    x: number;
    y: number;
  }>();
  const [newBlockStart, setNewBlockStart] = useState<Date | null>(null);
  const [newBlockEnd, setNewBlockEnd] = useState<Date | null>(null);
  const [newBlockDay, setNewBlockDay] = useState<number>(0);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    hour: number;
    day: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ hour: number; day: number } | null>(
    null,
  );
  const gridRef = useRef<HTMLDivElement>(null);

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

  const getTimeFromMouseEvent = (e: React.MouseEvent) => {
    if (!gridRef.current) {
      return null;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dayWidth = rect.width / 7;
    const hourHeight = 64; // matches the h-16 class

    const day = Math.floor(x / dayWidth);
    const hour = Math.floor(y / hourHeight) + startHour;

    return {
      day: Math.max(0, Math.min(6, day)),
      hour: Math.max(startHour, Math.min(endHour, hour)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const time = getTimeFromMouseEvent(e);
    if (!time) {
      return;
    }

    setIsDragging(true);
    setDragStart(time);
    setDragEnd(time);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      return;
    }

    const time = getTimeFromMouseEvent(e);
    if (!time) {
      return;
    }

    setDragEnd(time);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !dragEnd || !currentWorkspaceId) {
      return;
    }

    setIsDragging(false);

    const startDate = addDays(weekStart, dragStart.day);
    startDate.setHours(dragStart.hour, 0, 0, 0);

    const endDate = addDays(weekStart, dragEnd.day);
    endDate.setHours(dragEnd.hour + 1, 0, 0, 0);

    setNewBlockStart(startDate);
    setNewBlockEnd(endDate);
    setNewBlockDay(dragStart.day);

    // Position dialog near the mouse
    setDialogPosition({ x: e.clientX, y: e.clientY });
    setIsDialogOpen(true);

    setDragStart(null);
    setDragEnd(null);
  };

  const renderTimeBlock = (block: TimeBlock) => {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);

    const dayOffset = blockStart.getDay();
    const startHourOffset = blockStart.getHours() - startHour;
    const duration = blockEnd.getHours() - blockStart.getHours();

    const style = {
      position: "absolute" as const,
      left: `${(dayOffset * 100) / 7}%`,
      top: `${startHourOffset * 64}px`,
      height: `${duration * 64}px`,
      width: `${100 / 7}%`,
      backgroundColor: block.color || "#3b82f6",
      opacity: 0.8,
      borderRadius: "0.375rem",
      padding: "0.5rem",
      color: "white",
      overflow: "hidden",
      whiteSpace: "nowrap" as const,
      textOverflow: "ellipsis",
    };

    return (
      <div key={block.id} style={style}>
        {block.title || "Untitled Block"}
      </div>
    );
  };

  const renderDragPreview = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      return null;
    }

    const startHourOffset = Math.min(dragStart.hour, dragEnd.hour) - startHour;
    const endHourOffset = Math.max(dragStart.hour, dragEnd.hour) - startHour;
    const dayOffset = dragStart.day;

    const style = {
      position: "absolute" as const,
      left: `${(dayOffset * 100) / 7}%`,
      top: `${startHourOffset * 64}px`,
      height: `${(endHourOffset - startHourOffset + 1) * 64}px`,
      width: `${100 / 7}%`,
      backgroundColor: "#3b82f6",
      opacity: 0.4,
      borderRadius: "0.375rem",
      pointerEvents: "none" as const,
    };

    return <div style={style} />;
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
          <Button
            onClick={() => {
              const now = new Date();
              now.setMinutes(0, 0, 0);
              setNewBlockStart(now);
              setNewBlockEnd(new Date(now.getTime() + 60 * 60 * 1000));
              setNewBlockDay(now.getDay());
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Block
          </Button>
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
            <div
              ref={gridRef}
              className="relative col-span-7"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsDragging(false)}
            >
              {DAYS.map((dayOffset) => (
                <div
                  key={dayOffset}
                  className="absolute border-r"
                  style={{
                    left: `${(dayOffset * 100) / 7}%`,
                    width: `${100 / 7}%`,
                    height: "100%",
                  }}
                >
                  {displayedHours.map((hour) => (
                    <div key={hour} className="h-16 border-b" />
                  ))}
                </div>
              ))}
              {timeBlocks?.map(renderTimeBlock)}
              {renderDragPreview()}
            </div>
          </div>
        </ScrollArea>
      </div>

      {currentWorkspaceId && newBlockStart && newBlockEnd && (
        <CreateTimeBlockDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setDialogPosition(undefined);
          }}
          workspaceId={currentWorkspaceId}
          startTime={newBlockStart}
          endTime={newBlockEnd}
          dayOfWeek={newBlockDay}
          position={dialogPosition}
        />
      )}
    </div>
  );
}
