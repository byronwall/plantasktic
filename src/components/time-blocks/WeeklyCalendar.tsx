"use client";

import { addDays, addWeeks, format, startOfDay, subWeeks } from "date-fns";
import { List, Settings, Table, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api, type RouterOutputs } from "~/trpc/react";

import { DayMetadataSection } from "./DayMetadataSection";
import { getTimeFromGridPosition } from "./getTimeFromGridPosition";
import { ListTimeBlocksDialog } from "./ListTimeBlocksDialog";
import { MetadataSummaryDialog } from "./MetadataSummaryDialog";
import { getOverlappingGroups } from "./overlapHelpers";
import { TimeBlock } from "./TimeBlock";
import { TimeBlockDialog } from "./TimeBlockDialog";
import { useTimeBlockMouseEvents } from "./useTimeBlockMouseEvents";

import { DateInput } from "../ui/date-input";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

import type { TimeBlock as PrismaTimeBlock } from "@prisma/client";

type WeeklyCalendarProps = {
  defaultStartHour?: number;
  defaultEndHour?: number;
  defaultNumberOfDays?: number;
  defaultHeight?: number;
};

type TimeBlockTask =
  RouterOutputs["timeBlock"]["getWeeklyBlocks"][number]["taskAssignments"][number];

export type TimeBlock = PrismaTimeBlock & {
  taskAssignments: TimeBlockTask[];
};

export type TimeBlockWithPosition = TimeBlock & {
  index?: number;
  totalOverlaps?: number;
  isClipped?: boolean;
};

type DayMetadataItem = {
  id: string;
  date: Date;
  key: string;
  value: string;
  created_at: Date;
  updated_at: Date;
  workspaceId: string;
};

export function WeeklyCalendar({
  defaultStartHour = 6,
  defaultEndHour = 20,
  defaultNumberOfDays = 7,
  defaultHeight = 64,
}: WeeklyCalendarProps) {
  const { currentWorkspaceId } = useCurrentProject();

  const [startHour, setStartHour] = useState(defaultStartHour);
  const [endHour, setEndHour] = useState(defaultEndHour);
  const [numberOfDays, setNumberOfDays] = useState(defaultNumberOfDays);
  const [snapMinutes, setSnapMinutes] = useState(15);
  const [blockHeight, setBlockHeight] = useState(defaultHeight);

  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfDay(new Date()),
  );
  const weekStart = selectedDate;

  const gridRef = useRef<HTMLDivElement>(null);

  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isMetadataSummaryOpen, setIsMetadataSummaryOpen] = useState(false);

  const DAYS = Array.from({ length: numberOfDays }, (_, i) => i);

  // Fetch time blocks for the current week
  const { data: timeBlocks = [] } = api.timeBlock.getWeeklyBlocks.useQuery(
    {
      weekStart,
      workspaceId: currentWorkspaceId,
      numberOfDays,
    },
    {
      enabled: !!currentWorkspaceId,
    },
  );

  // Add metadata query
  const { data: weekMetadata = [] as DayMetadataItem[] } =
    api.timeBlock.getWeekMetadata.useQuery(
      {
        workspaceId: currentWorkspaceId || "",
        weekStart,
        weekEnd: addDays(weekStart, numberOfDays),
      },
      {
        enabled: !!currentWorkspaceId,
      },
    );

  // Add current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Check if current time is within the selected week range
    const weekEnd = addDays(weekStart, numberOfDays);
    if (now < weekStart || now >= weekEnd) {
      return null;
    }

    if (hour < startHour || hour > endHour) {
      return null;
    }

    // Calculate days since week start
    const daysSinceStart = Math.floor(
      (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    const top = (hour - startHour + minutes / 60) * blockHeight;
    const left = `${(daysSinceStart * 100) / numberOfDays}%`;
    const width = `${100 / numberOfDays}%`;

    return { top, left, width };
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(startOfDay(date));
    }
  };

  const displayedHours = Array.from(
    { length: endHour - startHour },
    (_, i) => i + startHour,
  );

  const handlePreviousWeek = () => {
    setSelectedDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate((prev) => addWeeks(prev, 1));
  };

  // Add proper typing for the overlapping groups calculation
  const overlappingGroups = useMemo(() => {
    return Object.values(getOverlappingGroups(timeBlocks) || {})
      .flat()
      .map((block) => ({
        ...block,
        startTime: new Date(block.startTime),
        endTime: new Date(block.endTime),
      }));
  }, [timeBlocks]);

  const categorizedBlocks = useMemo(() => {
    if (!timeBlocks) {
      return { before: [], after: [], visible: [] };
    }

    const startOfDay = new Date(weekStart);
    startOfDay.setHours(startHour, 0, 0, 0);

    const endOfDay = new Date(weekStart);
    endOfDay.setHours(endHour, 59, 59, 999);

    return overlappingGroups.reduce(
      (
        acc: {
          before: TimeBlockWithPosition[];
          after: TimeBlockWithPosition[];
          visible: TimeBlockWithPosition[];
        },
        block,
      ) => {
        const blockStart = new Date(block.startTime);
        const blockEnd = new Date(block.endTime);

        // Get the day-specific start and end times for comparison
        const dayStart = new Date(startOfDay);
        dayStart.setDate(blockStart.getDate());
        dayStart.setMonth(blockStart.getMonth());
        dayStart.setFullYear(blockStart.getFullYear());

        const dayEnd = new Date(endOfDay);
        dayEnd.setDate(blockStart.getDate());
        dayEnd.setMonth(blockStart.getMonth());
        dayEnd.setFullYear(blockStart.getFullYear());

        // Create normalized times for comparison while preserving the original day
        const normalizedStart = new Date(blockStart);
        normalizedStart.setHours(
          blockStart.getHours(),
          blockStart.getMinutes(),
          0,
          0,
        );

        const normalizedEnd = new Date(blockEnd);
        normalizedEnd.setHours(
          blockEnd.getHours(),
          blockEnd.getMinutes(),
          0,
          0,
        );

        if (normalizedEnd <= dayStart) {
          acc.before.push(block);
        } else if (normalizedStart >= dayEnd) {
          acc.after.push(block);
        } else {
          // For visible blocks, keep original times but mark if they're clipped
          const isClippedStart = normalizedStart < dayStart;
          const isClippedEnd = normalizedEnd > dayEnd;

          const visibleBlock = {
            ...block,
            isClipped: isClippedStart || isClippedEnd,
            isClippedStart,
            isClippedEnd,
          };
          acc.visible.push(visibleBlock);
        }
        return acc;
      },
      { before: [], after: [], visible: [] },
    );
  }, [timeBlocks, weekStart, startHour, endHour, overlappingGroups]);

  const topOffset = categorizedBlocks.before.length > 0 ? 32 : 0;

  // Get drag indicator positions
  const getDragIndicatorPositions = () => {
    if (dragState.type === "idle") {
      return null;
    }

    const getPosition = (hour: number, minute = 0) => {
      return (hour - startHour + minute / 60) * blockHeight + topOffset;
    };

    switch (dragState.type) {
      case "drag_new": {
        const { startTime, currentTime } = dragState;

        function getLaterTime(time: { hour: number; minute: number }) {
          if (time.hour === currentTime.hour) {
            return time.minute > currentTime.minute ? time : currentTime;
          }
          return time.hour > currentTime.hour ? time : currentTime;
        }

        function getEarlierTime(time: { hour: number; minute: number }) {
          if (time.hour === currentTime.hour) {
            return time.minute < currentTime.minute ? time : currentTime;
          }
          return time.hour < currentTime.hour ? time : currentTime;
        }

        const laterTime = getLaterTime(startTime);
        const earlierTime = getEarlierTime(startTime);

        const startPos = getPosition(earlierTime.hour, earlierTime.minute);
        const endPos = getPosition(laterTime.hour, laterTime.minute);

        return { startPos, endPos };
      }
      case "drag_existing": {
        const time = getTimeFromGridPosition(
          dragState.currentPosition.x,
          dragState.currentPosition.y,
          gridRef,
          topOffset,
          startHour,
          endHour,
          snapMinutes,
          numberOfDays,
          blockHeight,
        );
        if (!time) {
          return null;
        }
        const block = timeBlocks?.find((b) => b.id === dragState.blockId);
        if (!block) {
          return null;
        }
        const duration =
          (new Date(block.endTime).getTime() -
            new Date(block.startTime).getTime()) /
          (1000 * 60 * 60);
        const startPos = getPosition(time.hour, time.minute);
        const endPos = getPosition(time.hour + duration, time.minute);
        return { startPos, endPos };
      }
      case "resize_block_top":
      case "resize_block_bottom": {
        const time = getTimeFromGridPosition(
          dragState.currentPosition.x,
          dragState.currentPosition.y,
          gridRef,
          topOffset,
          startHour,
          endHour,
          snapMinutes,
          numberOfDays,
          blockHeight,
        );
        if (!time) {
          return null;
        }
        return { startPos: getPosition(time.hour, time.minute) };
      }
    }
  };

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleBlockDragStart,
    handleBlockResizeStart,
    dragState,
    isControlPressed,
    mousePosition,
  } = useTimeBlockMouseEvents(
    gridRef,
    startHour,
    endHour,
    snapMinutes,
    timeBlocks,
    weekStart,
    topOffset,
    numberOfDays,
    blockHeight,
  );

  const renderDragPreview = () => {
    if (dragState.type === "idle") {
      return null;
    }

    switch (dragState.type) {
      case "drag_new": {
        const { startTime, currentTime } = dragState;
        const previewStartHour = Math.min(
          Math.max(Math.min(startTime.hour, currentTime.hour), startHour),
          endHour,
        );
        const previewEndHour = Math.min(
          Math.max(Math.max(startTime.hour, currentTime.hour), startHour),
          endHour,
        );

        const startDate = addDays(weekStart, startTime.day);
        startDate.setHours(previewStartHour, 0, 0, 0);

        const endDate = addDays(weekStart, startTime.day);
        endDate.setHours(previewEndHour, 0, 0, 0);

        // Add minutes to respect snap schedule
        const startMinutes =
          Math.round((startTime.minute || 0) / snapMinutes) * snapMinutes;
        const endMinutes =
          Math.round((currentTime.minute || 0) / snapMinutes) * snapMinutes;

        startDate.setMinutes(startMinutes);
        endDate.setMinutes(endMinutes);

        // Ensure minimum block size of one snap interval
        if (endDate.getTime() <= startDate.getTime()) {
          endDate.setTime(startDate.getTime() + snapMinutes * 60 * 1000);
        }

        const now = new Date();
        return (
          <TimeBlock
            block={{
              id: "preview",
              startTime: startDate,
              endTime: endDate,
              title: "New Block",
              workspaceId: currentWorkspaceId || "",
              color: null,
              created_at: now,
              updated_at: now,
              taskAssignments: [],
              isFixedTime: false,
            }}
            onDragStart={() => undefined}
            onResizeStart={() => undefined}
            isPreview
            startHour={startHour}
            endHour={endHour}
            gridRef={gridRef}
            topOffset={topOffset}
            numberOfDays={numberOfDays}
            weekStart={weekStart}
            blockHeight={blockHeight}
          />
        );
      }
      case "drag_existing": {
        const { blockId, currentPosition } = dragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          return null;
        }

        const time = getTimeFromGridPosition(
          currentPosition.x,
          currentPosition.y,
          gridRef,
          topOffset,
          startHour,
          endHour,
          snapMinutes,
          numberOfDays,
          blockHeight,
        );
        if (!time) {
          return null;
        }

        const blockStart = new Date(block.startTime);
        const blockEnd = new Date(block.endTime);
        const duration =
          (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60 * 60);

        const previewStart = new Date(weekStart);
        previewStart.setDate(previewStart.getDate() + time.day);
        previewStart.setHours(
          Math.max(time.hour, startHour),
          time.minute,
          0,
          0,
        );

        const previewEnd = new Date(previewStart.getTime());
        previewEnd.setTime(previewStart.getTime() + duration * 60 * 60 * 1000);

        if (previewEnd.getHours() > endHour) {
          const hoursToAdjust = previewEnd.getHours() - endHour;
          previewStart.setHours(previewStart.getHours() - hoursToAdjust);
          previewEnd.setHours(endHour);
        }

        return (
          <TimeBlock
            block={{
              ...block,
              startTime: previewStart,
              endTime: previewEnd,
            }}
            onDragStart={() => undefined}
            onResizeStart={() => undefined}
            isPreview
            startHour={startHour}
            endHour={endHour}
            gridRef={gridRef}
            topOffset={topOffset}
            numberOfDays={numberOfDays}
            weekStart={weekStart}
            blockHeight={blockHeight}
          />
        );
      }
      case "resize_block_top":
      case "resize_block_bottom": {
        const { blockId, startTime, endTime, currentPosition } = dragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          return null;
        }

        const time = getTimeFromGridPosition(
          currentPosition.x,
          currentPosition.y,
          gridRef,
          topOffset,
          startHour,
          endHour,
          snapMinutes,
          numberOfDays,
          blockHeight,
        );
        if (!time) {
          return null;
        }

        // delta between the start of the week and the block's start time
        const dayOffset =
          (new Date(block.startTime).getTime() - weekStart.getTime()) /
          (1000 * 60 * 60 * 24);

        const newTime = new Date(weekStart);
        newTime.setDate(newTime.getDate() + dayOffset);
        newTime.setHours(
          Math.min(Math.max(time.hour, startHour), endHour),
          time.minute,
          0,
          0,
        );

        // For top resize, update start time but keep end time
        // For bottom resize, keep start time but update end time
        const previewStart =
          dragState.type === "resize_block_top" ? newTime : startTime;
        const previewEnd =
          dragState.type === "resize_block_bottom" ? newTime : endTime;

        if (
          previewEnd.getTime() <= previewStart.getTime() ||
          previewStart.getHours() < startHour ||
          previewEnd.getHours() > endHour
        ) {
          return null;
        }

        return (
          <TimeBlock
            block={{
              ...block,
              startTime: previewStart,
              endTime: previewEnd,
            }}
            onDragStart={() => undefined}
            onResizeStart={() => undefined}
            isPreview
            startHour={startHour}
            endHour={endHour}
            gridRef={gridRef}
            topOffset={topOffset}
            numberOfDays={numberOfDays}
            weekStart={weekStart}
            blockHeight={blockHeight}
          />
        );
      }
    }
  };

  const handleBeforeClick = () => {
    if (categorizedBlocks.before.length === 0) {
      return;
    }

    // Find the latest block that's before the current view
    const latestBefore = categorizedBlocks.before.reduce((latest, current) => {
      return new Date(current.endTime) > new Date(latest.endTime)
        ? current
        : latest;
    });

    // Get the hour from the block's end time
    const blockEndHour = new Date(latestBefore.endTime).getHours();

    // Adjust start hour to show this block
    setStartHour(Math.max(0, blockEndHour - 1));
  };

  const handleAfterClick = () => {
    if (categorizedBlocks.after.length === 0) {
      return;
    }

    // Find the earliest block that's after the current view
    const earliestAfter = categorizedBlocks.after.reduce(
      (earliest, current) => {
        return new Date(current.startTime) < new Date(earliest.startTime)
          ? current
          : earliest;
      },
    );

    // Get the hour from the block's start time
    const blockStartHour = new Date(earliestAfter.startTime).getHours();

    // Adjust end hour to show this block
    setEndHour(Math.min(23, blockStartHour + 1));
  };

  const bulkUpdateMutation = api.timeBlock.bulkUpdate.useMutation();

  const correctOverlappingBlocks = (date: Date) => {
    // Find blocks for the given date by comparing year/month/day
    const dayBlocks = timeBlocks?.filter((block) => {
      const blockDate = new Date(block.startTime);
      return (
        blockDate.getFullYear() === date.getFullYear() &&
        blockDate.getMonth() === date.getMonth() &&
        blockDate.getDate() === date.getDate()
      );
    });

    if (!dayBlocks?.length) {
      return;
    }

    // Sort blocks by start time
    const sortedBlocks = [...dayBlocks].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const updates: { id: string; startTime: Date; endTime: Date }[] = [];

    // First pass: keep fixed blocks in their original positions
    sortedBlocks.forEach((block) => {
      if (block.isFixedTime) {
        updates.push({
          id: block.id,
          startTime: new Date(block.startTime),
          endTime: new Date(block.endTime),
        });
      }
    });

    // Second pass: arrange non-fixed blocks
    sortedBlocks.forEach((block) => {
      if (block.isFixedTime) {
        return; // Skip fixed blocks as they're already handled
      }

      const blockDuration =
        new Date(block.endTime).getTime() - new Date(block.startTime).getTime();

      let newStartTime: Date;

      if (updates.length === 0) {
        // If no blocks yet, use the original start time
        newStartTime = new Date(block.startTime);
      } else {
        // Find the last block's end time
        const lastUpdate = updates[updates.length - 1];
        if (!lastUpdate) {
          newStartTime = new Date(block.startTime);
        } else {
          newStartTime = new Date(lastUpdate.endTime);
        }
      }

      const newEndTime = new Date(newStartTime.getTime() + blockDuration);

      updates.push({
        id: block.id,
        startTime: newStartTime,
        endTime: newEndTime,
      });
    });

    // Sort updates by start time to ensure proper ordering
    updates.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    bulkUpdateMutation.mutate(updates);
  };

  // Add view buttons section after the existing buttons
  const handleViewChange = (height: number) => {
    setBlockHeight(height);
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

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Time Range</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm">Start Hour</span>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={startHour}
                        onChange={(e) => setStartHour(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="text-sm">End Hour</span>
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        value={endHour}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value > startHour) {
                            setEndHour(value);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">View Settings</h4>
                  <div className="grid gap-4">
                    <div>
                      <span className="text-sm">Days to Show</span>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={numberOfDays}
                        onChange={(e) => {
                          const value = Math.max(
                            1,
                            Math.min(31, Number(e.target.value)),
                          );
                          setNumberOfDays(value);
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-sm">Snap Minutes</span>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={snapMinutes}
                        onChange={(e) => {
                          const value = Math.max(
                            1,
                            Math.min(60, Number(e.target.value)),
                          );
                          setSnapMinutes(value);
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-sm">Block Height</span>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant={blockHeight === 64 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleViewChange(64)}
                          className="flex-1"
                        >
                          Normal
                        </Button>
                        <Button
                          variant={blockHeight === 96 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleViewChange(96)}
                          className="flex-1"
                        >
                          Detailed
                        </Button>
                        <Button
                          variant={blockHeight === 128 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleViewChange(128)}
                          className="flex-1"
                        >
                          Very Detailed
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={() => setIsMetadataSummaryOpen(true)}
          >
            <Table className="mr-2 h-4 w-4" />
            Summary
          </Button>

          <Button variant="outline" onClick={() => setIsListDialogOpen(true)}>
            <List className="mr-2 h-4 w-4" />
            List View
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border bg-card">
          {/* Header with days */}
          <div
            className="grid select-none border-b"
            style={{
              gridTemplateColumns: `64px repeat(${numberOfDays}, minmax(0, 1fr))`,
            }}
          >
            <div className="w-16 border-r p-2" /> {/* Time column header */}
            {DAYS.map((dayOffset, index) => {
              const date = addDays(weekStart, dayOffset);
              return (
                <div
                  key={dayOffset}
                  className={`flex items-center justify-between p-2 ${index < DAYS.length - 1 ? "border-r" : ""}`}
                >
                  <span className="font-medium">
                    {format(date, "EEE MMM d")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => correctOverlappingBlocks(date)}
                    title="Compact time blocks"
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `64px repeat(${numberOfDays}, minmax(0, 1fr))`,
            }}
          >
            {/* Time labels */}
            <div className="relative w-16 select-none">
              {/* Show count of blocks before visible area */}
              {categorizedBlocks.before.length > 0 && (
                <div
                  className="h-8 cursor-pointer border-b border-r bg-muted/50 pr-1 text-right text-sm hover:bg-muted/80"
                  onClick={handleBeforeClick}
                  title="Click to adjust view to show earlier blocks"
                >
                  {categorizedBlocks.before.length} before
                </div>
              )}

              {displayedHours.map((hour, index) => (
                <div
                  key={hour}
                  className={`border-r pr-1 text-right text-sm ${index < displayedHours.length - 1 ? "border-b" : ""}`}
                  style={{ height: `${blockHeight}px` }}
                >
                  {format(new Date().setHours(hour, 0), "h a")}
                </div>
              ))}

              {/* Show count of blocks after visible area */}
              {categorizedBlocks.after.length > 0 && (
                <div
                  className="h-8 cursor-pointer border-r border-t bg-muted/50 pr-1 text-right text-sm hover:bg-muted/80"
                  onClick={handleAfterClick}
                  title="Click to adjust view to show later blocks"
                >
                  {categorizedBlocks.after.length} after
                </div>
              )}

              {/* Drag operation indicators */}
              {(() => {
                const positions = getDragIndicatorPositions();
                if (!positions) {
                  return null;
                }

                return (
                  <>
                    {positions.startPos !== undefined && (
                      <div
                        className="absolute right-0 h-0.5 w-4 bg-red-500"
                        style={{ top: positions.startPos }}
                      />
                    )}
                    {positions.endPos !== undefined && (
                      <div
                        className="absolute right-0 h-0.5 w-4 bg-red-500"
                        style={{ top: positions.endPos }}
                      />
                    )}
                  </>
                );
              })()}
            </div>

            {/* Time slots for each day */}
            <div
              id="main-grid"
              ref={gridRef}
              className="relative select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{
                gridColumn: `span ${numberOfDays}`,
                cursor:
                  dragState.type === "drag_existing" && isControlPressed
                    ? "copy"
                    : undefined,
              }}
            >
              {/* Add spacer for blocks before */}
              {categorizedBlocks.before.length > 0 && (
                <div className="absolute left-0 h-8 w-full border-b bg-muted/50" />
              )}

              {/* Current time indicator */}
              {(() => {
                const position = getCurrentTimePosition();
                if (!position) {
                  return null;
                }

                return (
                  <div
                    className="absolute z-10 h-0.5 bg-blue-500"
                    style={{
                      top:
                        position.top +
                        (categorizedBlocks.before.length > 0 ? 32 : 0),
                      left: `calc(${position.left} + 1px)`,
                      width: `calc(${position.width} - 2px)`,
                    }}
                  />
                );
              })()}

              {DAYS.map((dayOffset, index) => (
                <div
                  key={dayOffset}
                  className={`absolute ${index < DAYS.length - 1 ? "border-r" : ""}`}
                  style={{
                    left: `calc(${(dayOffset * 100) / numberOfDays}% + 1px)`,
                    width: `calc(${100 / numberOfDays}% - 2px)`,
                    height: `calc(100% - ${categorizedBlocks.before.length > 0 ? "32px" : "0px"} - ${
                      categorizedBlocks.after.length > 0 ? "32px" : "0px"
                    })`,
                    top: categorizedBlocks.before.length > 0 ? "32px" : "0px",
                  }}
                >
                  {displayedHours.map((hour, hourIndex) => (
                    <div
                      key={hour}
                      className="relative"
                      style={{ height: `${blockHeight}px` }}
                    >
                      {/* Minor tick marks */}
                      {Array.from(
                        { length: Math.floor(60 / snapMinutes) - 1 },
                        (_, i) => (
                          <div
                            key={i}
                            className="absolute left-0 w-full border-b border-gray-100"
                            style={{
                              top: `${((i + 1) * snapMinutes * blockHeight) / 60}px`,
                            }}
                          />
                        ),
                      )}
                      {/* Hour border */}
                      {hourIndex < displayedHours.length - 1 && (
                        <div className="absolute bottom-0 left-0 w-full border-b" />
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Add spacer for blocks after */}
              {categorizedBlocks.after.length > 0 && (
                <div
                  className="absolute left-0 h-8 w-full border-t bg-muted/50"
                  style={{
                    bottom: "0",
                  }}
                />
              )}

              {categorizedBlocks.visible.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  onDragStart={handleBlockDragStart}
                  onResizeStart={handleBlockResizeStart}
                  startHour={startHour}
                  endHour={endHour}
                  gridRef={gridRef}
                  isClipped={block.isClipped}
                  topOffset={topOffset}
                  numberOfDays={numberOfDays}
                  weekStart={weekStart}
                  blockHeight={blockHeight}
                />
              ))}
              {renderDragPreview()}

              {/* Mouse position indicator */}
              {mousePosition && dragState.type === "idle" && (
                <div
                  className="absolute z-20 h-1 w-4 bg-red-300 opacity-50"
                  style={{
                    left: `calc(${(mousePosition.day * 100) / numberOfDays}% + 1px)`,
                    top:
                      (mousePosition.hour -
                        startHour +
                        mousePosition.minute / 60) *
                        blockHeight +
                      topOffset,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Day Metadata Section */}
        {currentWorkspaceId && (
          <div
            className="grid gap-4 rounded-lg border bg-card"
            style={{
              gridTemplateColumns: `64px repeat(${numberOfDays}, minmax(0, 1fr))`,
            }}
          >
            <div className="w-16 border-r" />

            {DAYS.map((dayOffset) => {
              const date = addDays(weekStart, dayOffset);
              const dayMetadata = weekMetadata.filter(
                (meta) =>
                  format(startOfDay(meta.date), "yyyy-MM-dd") ===
                  format(startOfDay(date), "yyyy-MM-dd"),
              );

              return (
                <div key={dayOffset} className="border-r p-1">
                  <DayMetadataSection
                    workspaceId={currentWorkspaceId}
                    date={date}
                    metadata={dayMetadata}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TimeBlockDialog />

      <ListTimeBlocksDialog
        isOpen={isListDialogOpen}
        onClose={() => setIsListDialogOpen(false)}
        weekStart={weekStart}
        numberOfDays={numberOfDays}
      />

      <MetadataSummaryDialog
        isOpen={isMetadataSummaryOpen}
        onClose={() => setIsMetadataSummaryOpen(false)}
        weekStart={weekStart}
      />
    </div>
  );
}
