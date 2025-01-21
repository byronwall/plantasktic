"use client";

import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import { CreateTimeBlockDialog } from "./CreateTimeBlockDialog";
import { EditTimeBlockDialog } from "./EditTimeBlockDialog";

import { DateInput } from "../ui/date-input";
import { Input } from "../ui/input";

import type { TimeBlock } from "@prisma/client";

const DAYS = Array.from({ length: 7 }, (_, i) => i);

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 20;

type TimeBlockWithPosition = TimeBlock & {
  index?: number;
  totalOverlaps?: number;
};

const doBlocksOverlap = (block1: TimeBlock, block2: TimeBlock) => {
  const start1 = new Date(block1.startTime);
  const end1 = new Date(block1.endTime);
  const start2 = new Date(block2.startTime);
  const end2 = new Date(block2.endTime);

  return start1 < end2 && start2 < end1;
};

const getOverlappingGroups = (
  blocks: TimeBlock[],
): TimeBlockWithPosition[][] => {
  const groups: TimeBlockWithPosition[][] = [];

  // Sort blocks by start time
  const sortedBlocks = [...blocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  for (const block of sortedBlocks) {
    let addedToGroup = false;

    // Try to add to an existing group
    for (const group of groups) {
      if (
        group.some((existingBlock) => doBlocksOverlap(existingBlock, block))
      ) {
        if (group.length < 3) {
          // Add the new block and update all blocks in the group
          const newTotalOverlaps = group.length + 1;
          // Update existing blocks in the group
          group.forEach((existingBlock, idx) => {
            existingBlock.totalOverlaps = newTotalOverlaps;
            existingBlock.index = idx;
          });
          // Add new block
          group.push({
            ...block,
            index: group.length,
            totalOverlaps: newTotalOverlaps,
          });
        } else {
          group.push({
            ...block,
            index: group.length,
            totalOverlaps: group.length + 1,
          });
        }
        addedToGroup = true;
        break;
      }
    }

    // If not added to any group, create a new one
    if (!addedToGroup) {
      groups.push([{ ...block, index: 0, totalOverlaps: 1 }]);
    }
  }

  return groups;
};

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

  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | null>(
    null,
  );

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
    // Check if we clicked on a time block
    if ((e.target as HTMLElement).closest('[data-time-block="true"]')) {
      return;
    }

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

  const renderTimeBlock = (block: TimeBlockWithPosition) => {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);

    const dayOffset = blockStart.getDay();
    const startHourOffset = blockStart.getHours() - startHour;
    const duration = blockEnd.getHours() - blockStart.getHours();

    // Calculate width and offset based on overlaps
    const baseWidth = 100 / 7; // Width for one day
    const width =
      block.totalOverlaps && block.totalOverlaps > 1
        ? baseWidth / Math.min(block.totalOverlaps, 3)
        : baseWidth;

    const leftOffset =
      block.totalOverlaps && block.totalOverlaps <= 3 && block.index
        ? dayOffset * baseWidth + width * (block.index || 0)
        : dayOffset * baseWidth;

    const style = {
      position: "absolute" as const,
      left: `${leftOffset}%`,
      top: `${startHourOffset * 64}px`,
      height: `${duration * 64}px`,
      width: `${width}%`,
      backgroundColor: block.color || "#3b82f6",
      opacity: 0.8,
      borderRadius: "0.375rem",
      padding: "0.5rem",
      color: "white",
      overflow: "hidden",
      whiteSpace: "nowrap" as const,
      textOverflow: "ellipsis",
      cursor: "pointer",
      zIndex:
        block.totalOverlaps && block.totalOverlaps > 3
          ? (block.index || 0) + 1
          : 1,
    };

    return (
      <div
        key={block.id}
        style={style}
        data-time-block="true"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTimeBlock(block);
        }}
      >
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Blocks</h1>
          <p className="text-muted-foreground">
            Schedule and organize your tasks with time blocks
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              Previous
            </Button>
            <DateInput value={selectedDate} onChange={handleDateChange} />
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              Next
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Start</span>
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
              <span className="text-sm">End</span>
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

          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Block
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
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
              {timeBlocks &&
                getOverlappingGroups(timeBlocks).flat().map(renderTimeBlock)}
              {renderDragPreview()}
            </div>
          </div>
        </div>
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

      {selectedTimeBlock && (
        <EditTimeBlockDialog
          isOpen={!!selectedTimeBlock}
          onClose={() => setSelectedTimeBlock(null)}
          timeBlock={selectedTimeBlock}
        />
      )}
    </div>
  );
}
