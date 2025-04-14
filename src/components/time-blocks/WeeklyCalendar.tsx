"use client";

import {
  addDays,
  addWeeks,
  differenceInDays,
  format,
  startOfDay,
  subWeeks,
} from "date-fns";
import { List, Settings, Table, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { useTimeBlockActions } from "~/hooks/useTimeBlockActions";
import { api, type RouterOutputs } from "~/trpc/react";

import { BlockPreview } from "./BlockPreview";
import { DayMetadataSection } from "./DayMetadataSection";
import { ListTimeBlocksDialog } from "./ListTimeBlocksDialog";
import { MetadataSummaryDialog } from "./MetadataSummaryDialog";
import { getOverlappingGroups } from "./overlapHelpers";
import { TimeBlock } from "./TimeBlock";
import { TimeBlockDialog } from "./TimeBlockDialog";
import { TimeIndicator } from "./TimeIndicator";
import { TimePositionProvider, useTimePosition } from "./TimePositionContext";
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

// Define props for CalendarContent
type CalendarContentProps = {
  startHour: number;
  endHour: number;
  snapMinutes: number;
  numberOfDays: number;
  weekStart: Date;
  blockHeight: number;
  topOffset: number;
  // Add setters needed for before/after click handlers (or use a store)
  setStartHour: (hour: number) => void;
  setEndHour: (hour: number) => void;
  // Add dialog state setters
  setIsListDialogOpen: (isOpen: boolean) => void;
  setIsMetadataSummaryOpen: (isOpen: boolean) => void;
  setTopOffset: (topOffset: number) => void;
};

const CalendarContent = ({
  startHour,
  endHour,
  snapMinutes,
  numberOfDays,
  weekStart,
  blockHeight,
  topOffset,
  setStartHour, // Receive setters as props
  setEndHour,
  setIsListDialogOpen, // Receive setters
  setIsMetadataSummaryOpen, // Receive setters
  setTopOffset, // Receive setter
}: CalendarContentProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null); // Ref for the sticky header

  // Use position hook - remove date-fns functions
  const {
    getYPositionFromTime,
    getDayFromXPosition,
    positionToTime,
    snapTime,
  } = useTimePosition();

  const { currentWorkspaceId } = useCurrentProject();

  // Use actions hook
  const { bulkUpdateBlocks } = useTimeBlockActions();

  // --- Data Fetching (unchanged) ---
  const { data: timeBlocks = [] } = api.timeBlock.getWeeklyBlocks.useQuery(
    {
      weekStart,
      workspaceId: currentWorkspaceId,
      numberOfDays,
    },
    { enabled: !!currentWorkspaceId },
  );
  const { data: weekMetadata = [] as DayMetadataItem[] } =
    api.timeBlock.getWeekMetadata.useQuery(
      {
        workspaceId: currentWorkspaceId || "",
        weekStart,
        weekEnd: addDays(weekStart, numberOfDays),
      },
      { enabled: !!currentWorkspaceId },
    );
  // --- End Data Fetching ---

  // --- State (Current Time) ---
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Measure header height after mount
  useEffect(() => {
    if (headerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      // Only update if the height has changed
      if (headerHeight > 0) {
        setTopOffset(headerHeight);
      }
    }
  }, [setTopOffset]); // Rerun if setter changes (should be stable)

  // --- Mouse Events Hook ---
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
  // --- End Mouse Events Hook ---

  // --- Memos (Overlapping, Categorized Blocks - unchanged) ---
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
    const startOfDayDate = new Date(weekStart);
    startOfDayDate.setHours(startHour, 0, 0, 0);
    const endOfDayDate = new Date(weekStart);
    endOfDayDate.setHours(endHour, 59, 59, 999);
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
        const dayStart = new Date(startOfDayDate);
        dayStart.setDate(blockStart.getDate());
        dayStart.setMonth(blockStart.getMonth());
        dayStart.setFullYear(blockStart.getFullYear());
        const dayEnd = new Date(endOfDayDate);
        dayEnd.setDate(blockStart.getDate());
        dayEnd.setMonth(blockStart.getMonth());
        dayEnd.setFullYear(blockStart.getFullYear());
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
  // --- End Memos ---

  // --- Calculations / Render Helpers ---
  const getCurrentTimeIndicatorPosition = () => {
    const now = currentTime;
    const weekEnd = addDays(weekStart, numberOfDays);
    if (
      now < weekStart ||
      now >= weekEnd ||
      now.getHours() < startHour ||
      now.getHours() >= endHour
    ) {
      return null;
    }
    const top = getYPositionFromTime(now);
    const dayIndex = differenceInDays(startOfDay(now), startOfDay(weekStart));
    const leftPercent = (dayIndex * 100) / numberOfDays;
    const widthPercent = 100 / numberOfDays;
    return {
      top,
      left: `calc(${leftPercent}% + 1px)`,
      width: `calc(${widthPercent}% - 2px)`,
    };
  };

  const renderDragPreview = () => {
    if (dragState.type === "idle") {
      return null;
    }

    let previewStartTime: Date | null = null;
    let previewEndTime: Date | null = null;
    let blockData: Partial<TimeBlockWithPosition> = {}; // Base data for preview
    const isCreating = dragState.type === "drag_new";
    const isMoving = dragState.type === "drag_existing";
    const isResizing =
      dragState.type === "resize_block_top" ||
      dragState.type === "resize_block_bottom";
    const isDuplicating = isMoving && dragState.shouldDuplicate;

    switch (dragState.type) {
      case "drag_new":
        previewStartTime = snapTime(dragState.startTime);
        previewEndTime = snapTime(dragState.currentTime);
        blockData = { title: "New Block", color: null }; // Basic info
        break;

      case "drag_existing": {
        const originalBlock = timeBlocks.find(
          (b) => b.id === dragState.blockId,
        );
        if (!originalBlock) {
          return null;
        }

        const timeAtCurrentPos = positionToTime(
          dragState.currentMousePosition,
          gridRef,
          true,
        );
        const timeAtInitialPos = positionToTime(
          dragState.initialMousePosition,
          gridRef,
          true,
        );
        if (!timeAtCurrentPos || !timeAtInitialPos) {
          return null;
        }

        const timeDiff =
          timeAtCurrentPos.getTime() - timeAtInitialPos.getTime();
        const originalStartTime = new Date(originalBlock.startTime);
        const originalEndTime = new Date(originalBlock.endTime);
        previewStartTime = new Date(originalStartTime.getTime() + timeDiff);
        previewEndTime = new Date(originalEndTime.getTime() + timeDiff);
        blockData = originalBlock; // Use original block data
        break;
      }

      case "resize_block_top":
      case "resize_block_bottom": {
        const originalBlock = timeBlocks.find(
          (b) => b.id === dragState.blockId,
        );
        if (!originalBlock) {
          return null;
        }

        const timeAtCurrentPos = positionToTime(
          dragState.currentMousePosition,
          gridRef,
          true,
        );
        if (!timeAtCurrentPos) {
          return null;
        }

        const originalDayOffset = differenceInDays(
          dragState.initialStartTime,
          weekStart,
        );
        const resizeTimeOnOriginalDay = addDays(weekStart, originalDayOffset);
        resizeTimeOnOriginalDay.setHours(
          timeAtCurrentPos.getHours(),
          timeAtCurrentPos.getMinutes(),
          0,
          0,
        );

        previewStartTime = new Date(dragState.initialStartTime);
        previewEndTime = new Date(dragState.initialEndTime);

        if (dragState.type === "resize_block_top") {
          previewStartTime = resizeTimeOnOriginalDay;
        } else {
          previewEndTime = resizeTimeOnOriginalDay;
        }
        blockData = originalBlock; // Use original block data
        break;
      }
    }

    // Ensure valid times
    if (!previewStartTime || !previewEndTime) {
      return null;
    }
    if (previewEndTime.getTime() <= previewStartTime.getTime()) {
      // Ensure minimum duration if invalid
      previewEndTime = new Date(
        previewStartTime.getTime() + snapMinutes * 60 * 1000,
      );
    }

    // Calculate position and dimensions
    const startDayIndex = differenceInDays(
      startOfDay(previewStartTime),
      startOfDay(weekStart),
    );
    const endDayIndex = differenceInDays(
      startOfDay(previewEndTime),
      startOfDay(weekStart),
    );

    // For simplicity, preview stays within the start day for now
    // Multi-day preview rendering would require more complex width/left/offset calculation
    if (startDayIndex < 0 || startDayIndex >= numberOfDays) {
      return null;
    }

    const top = getYPositionFromTime(previewStartTime);
    const bottom = getYPositionFromTime(previewEndTime);
    const height = Math.max(bottom - top, blockHeight * (snapMinutes / 60)); // Min height
    const leftPercent = (startDayIndex * 100) / numberOfDays;
    const widthPercent = 100 / numberOfDays;

    // TODO: Handle overlapping previews if needed (similar to TimeBlock overlap logic)

    return (
      <BlockPreview
        blockData={blockData}
        top={top}
        left={`${leftPercent}%`}
        width={`${widthPercent}%`}
        height={height}
        isCreating={isCreating}
        isMoving={isMoving}
        isResizing={isResizing}
        isDuplicating={isDuplicating}
      />
    );
  };

  const handleBeforeClick = () => {
    if (categorizedBlocks.before.length === 0) {
      return;
    }
    const latestBefore = categorizedBlocks.before.reduce((latest, current) => {
      return new Date(current.endTime) > new Date(latest.endTime)
        ? current
        : latest;
    });
    const blockEndHour = new Date(latestBefore.endTime).getHours();
    // Use setter prop
    setStartHour(Math.max(0, blockEndHour - 1));
  };

  const handleAfterClick = () => {
    if (categorizedBlocks.after.length === 0) {
      return;
    }
    const earliestAfter = categorizedBlocks.after.reduce(
      (earliest, current) => {
        return new Date(current.startTime) < new Date(earliest.startTime)
          ? current
          : earliest;
      },
    );
    const blockStartHour = new Date(earliestAfter.startTime).getHours();
    // Use setter prop
    setEndHour(Math.min(23, blockStartHour + 1));
  };

  const correctOverlappingBlocks = (date: Date) => {
    const targetDate = startOfDay(date);

    // 1. Filter, Separate, and Sort
    const blocksForDay = overlappingGroups
      .filter((block) => {
        const blockDate = startOfDay(new Date(block.startTime));
        return blockDate.getTime() === targetDate.getTime();
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

    const fixedBlocks = blocksForDay.filter((b) => b.isFixedTime);
    const nonFixedBlocks = blocksForDay.filter((b) => !b.isFixedTime);

    // 2. Initialization
    const updates: { id: string; startTime: Date; endTime: Date }[] = [];
    const placedNonFixedIds = new Set<string>();
    let currentTime: Date | null = null; // Tracks the end of the last placed block

    // Helper function to add updates only if times changed
    const addUpdateIfNeeded = (
      block: TimeBlockWithPosition,
      newStart: Date,
      newEnd: Date,
    ) => {
      const originalStart = new Date(block.startTime);
      const originalEnd = new Date(block.endTime);
      if (
        newStart.getTime() !== originalStart.getTime() ||
        newEnd.getTime() !== originalEnd.getTime()
      ) {
        updates.push({ id: block.id, startTime: newStart, endTime: newEnd });
      }
    };

    // 3. Iterate Through Segments defined by Fixed Blocks
    const totalFixedBlocks = fixedBlocks.length;
    for (let i = 0; i <= totalFixedBlocks; i++) {
      const currentFixed = i > 0 ? fixedBlocks[i - 1] : null;
      const nextFixed = i < totalFixedBlocks ? fixedBlocks[i] : null;

      // Determine the bounds for placing non-fixed blocks in this segment
      const segmentStart = currentFixed ? currentFixed.endTime : null;
      const segmentEnd = nextFixed ? nextFixed.startTime : null;

      // Update currentTime based on the end of the previous segment/fixed block
      if (segmentStart) {
        currentTime =
          currentTime === null
            ? segmentStart
            : new Date(Math.max(currentTime.getTime(), segmentStart.getTime()));
      }

      // Try to place non-fixed blocks in this segment
      for (const block of nonFixedBlocks) {
        if (placedNonFixedIds.has(block.id)) {
          continue; // Skip already placed blocks
        }

        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        const duration = endTime.getTime() - startTime.getTime();

        // Determine the earliest possible start time for this block
        const potentialStartTime = currentTime ?? startTime;
        const potentialEndTime = new Date(
          potentialStartTime.getTime() + duration,
        );

        // Check if the block fits within the current segment
        if (segmentEnd === null || potentialEndTime <= segmentEnd) {
          // Fits! Place the block
          const newStartTime = potentialStartTime;
          const newEndTime = potentialEndTime;

          addUpdateIfNeeded(block, newStartTime, newEndTime);
          currentTime = newEndTime; // Update currentTime for the next block in this segment
          placedNonFixedIds.add(block.id);
        } else {
          // Doesn't fit in this segment, might fit in a later one.
          // If we are trying to place before the *first* fixed block (i === 0),
          // and it doesn't fit, it MUST go after that first fixed block.
          // We don't break here, just let it be potentially placed in the next segment.
        }
      }

      // After processing non-fixed blocks for the segment,
      // ensure currentTime respects the start of the next fixed block (if any)
      if (nextFixed) {
        currentTime =
          currentTime === null
            ? nextFixed.startTime // Should not happen if blocks exist
            : new Date(
                Math.max(currentTime.getTime(), nextFixed.startTime.getTime()),
              );
      }
    }

    // 4. Bulk Update
    if (updates.length > 0 && currentWorkspaceId) {
      console.log("Magic wand updates:", updates);
      bulkUpdateBlocks({
        updates,
        workspaceId: currentWorkspaceId,
      });
    }
  };

  const displayedHours = Array.from(
    { length: endHour - startHour },
    (_, i) => i + startHour,
  );
  const DAYS = Array.from({ length: numberOfDays }, (_, i) => i);
  // --- End Calculations / Render Helpers ---

  // --- JSX Return ---
  return (
    <div className="flex-grow overflow-auto">
      {/* Main Grid Structure */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `64px repeat(${numberOfDays}, minmax(0, 1fr))`,
        }}
      >
        {/* Time Labels Column */}
        <div className="relative w-16 select-none border-r">
          {categorizedBlocks.before.length > 0 && (
            <div
              className="h-8 cursor-pointer border-b bg-muted/50 pr-1 text-right text-sm hover:bg-muted/80"
              onClick={handleBeforeClick}
              title="Click to adjust view to show earlier blocks"
            >
              {categorizedBlocks.before.length} before
            </div>
          )}
          {displayedHours.map((hour, index) => (
            <div
              key={hour}
              className={`pr-1 text-right text-sm ${index < displayedHours.length - 1 ? "border-b" : ""}`}
              style={{ height: `${blockHeight}px` }}
            >
              {format(new Date().setHours(hour, 0), "h a")}
            </div>
          ))}
          {categorizedBlocks.after.length > 0 && (
            <div
              className="h-8 cursor-pointer border-t bg-muted/50 pr-1 text-right text-sm hover:bg-muted/80"
              onClick={handleAfterClick}
              title="Click to adjust view to show later blocks"
            >
              {categorizedBlocks.after.length} after
            </div>
          )}
        </div>

        {/* Days Content Area - Render each day column */}
        <div
          ref={gridRef}
          className="relative col-span-full grid"
          style={{
            gridColumn: `span ${numberOfDays}`,
            gridTemplateColumns: `repeat(${numberOfDays}, minmax(0, 1fr))`,
          }}
        >
          {/* Map over days to create columns */}
          {DAYS.map((dayOffset) => {
            const date = addDays(weekStart, dayOffset);
            const dayMetadata = weekMetadata.filter(
              (meta) =>
                format(startOfDay(meta.date), "yyyy-MM-dd") ===
                format(startOfDay(date), "yyyy-MM-dd"),
            );

            return (
              // Container for a single day column
              <div key={dayOffset} className="relative flex flex-col border-r">
                {/* Sticky Day Header */}
                <div
                  ref={dayOffset === 0 ? headerRef : undefined} // Attach ref to the first header
                  className="sticky top-0 z-20 flex items-center justify-between border-b bg-background p-2"
                >
                  <span className="font-medium">
                    {format(date, "EEE MMM d")}
                  </span>
                  {/* Day-specific Magic Wand Button */}
                  <Button
                    variant="ghost" // Use ghost variant for less emphasis
                    size="icon"
                    className="h-6 w-6" // Smaller size
                    onClick={() => correctOverlappingBlocks(date)} // Call directly with the day's date
                    title={`Auto-adjust overlaps for ${format(date, "MMM d")}`}
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Main Interaction Grid Area for the Day (relative positioning context) */}
                <div
                  className="relative flex-grow select-none"
                  // Mouse handlers attached to the container covering all days below
                  style={{
                    height: `${(endHour - startHour) * blockHeight}px`,
                  }}
                >
                  {/* Grid Lines for the Day */}
                  {displayedHours.map((hour, hourIndex) => (
                    <div
                      key={`${dayOffset}-${hour}`}
                      className={`relative border-b ${hourIndex === displayedHours.length - 1 ? "border-b-0" : ""}`}
                      style={{ height: `${blockHeight}px` }}
                    >
                      {/* Minor Ticks */}
                      {Array.from(
                        { length: Math.floor(60 / snapMinutes) - 1 },
                        (_, tickIndex) => (
                          <div
                            key={tickIndex}
                            className="absolute left-0 w-full border-t border-dashed border-muted/50"
                            style={{
                              top: `${((tickIndex + 1) * snapMinutes * blockHeight) / 60}px`,
                            }}
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>

                {/* Day Metadata Section at the bottom of the column */}
                {currentWorkspaceId && (
                  <DayMetadataSection
                    workspaceId={currentWorkspaceId}
                    date={date}
                    metadata={dayMetadata}
                  />
                )}
              </div>
            );
          })}

          {/* Absolutely Positioned Elements relative to the whole grid container */}
          {/* This container holds the time blocks, preview, indicators */}
          <div
            id="main-grid-overlay"
            className="absolute inset-0"
            onMouseDown={handleMouseDown} // Attach mouse handlers here
            onMouseMove={handleMouseMove}
            onMouseUp={(e) => handleMouseUp(e)} // Pass event to handleMouseUp
            onMouseLeave={handleMouseLeave}
            style={{
              cursor:
                dragState.type === "drag_existing" && isControlPressed
                  ? "copy"
                  : undefined,
            }}
          >
            {/* Current Time Indicator */}
            {(() => {
              const position = getCurrentTimeIndicatorPosition();
              if (!position) {
                return null;
              }
              return (
                <div
                  className="pointer-events-none absolute z-10 h-0.5 bg-blue-500"
                  style={{
                    top: position.top,
                    left: position.left,
                    width: position.width,
                  }}
                />
              );
            })()}

            {/* Render Time Blocks */}
            {categorizedBlocks.visible.map((block) => (
              <TimeBlock
                key={block.id}
                block={block}
                onDragStart={handleBlockDragStart}
                onResizeStart={handleBlockResizeStart}
                startHour={startHour}
                endHour={endHour}
                gridRef={gridRef} // Pass ref for calculations
                isClipped={block.isClipped}
                topOffset={topOffset}
                numberOfDays={numberOfDays}
                weekStart={weekStart}
                blockHeight={blockHeight}
              />
            ))}

            {/* Render Drag Preview */}
            {renderDragPreview()}

            {/* TimeIndicator Logic - Combined Hover and Drag/Resize */}
            {(() => {
              let indicatorTime: Date | null = null;
              // Use specific types expected by TimeIndicator
              let indicatorType:
                | "current"
                | "selection-start"
                | "selection-end" = "current";

              if (dragState.type === "idle" && mousePosition) {
                indicatorTime = mousePosition;
                indicatorType = "current";
              } else if (
                dragState.type !== "idle" &&
                dragState.type !== "drag_new" // Don't show edge indicator for brand new blocks yet
              ) {
                // --- Recalculate preview times directly here ---
                // This duplicates logic from renderDragPreview but keeps scope
                let previewStartTime: Date | null = null;
                let previewEndTime: Date | null = null;

                if (dragState.type === "drag_existing") {
                  const originalBlock = timeBlocks.find(
                    (b) => b.id === dragState.blockId,
                  );
                  if (originalBlock) {
                    const timeAtCurrentPos = positionToTime(
                      dragState.currentMousePosition,
                      gridRef,
                      true,
                    );
                    const timeAtInitialPos = positionToTime(
                      dragState.initialMousePosition,
                      gridRef,
                      true,
                    );
                    if (timeAtCurrentPos && timeAtInitialPos) {
                      const timeDiff =
                        timeAtCurrentPos.getTime() - timeAtInitialPos.getTime();
                      const originalStartTime = new Date(
                        originalBlock.startTime,
                      );
                      const originalEndTime = new Date(originalBlock.endTime);
                      previewStartTime = new Date(
                        originalStartTime.getTime() + timeDiff,
                      );
                      previewEndTime = new Date(
                        originalEndTime.getTime() + timeDiff,
                      );
                    }
                  }
                } else if (
                  dragState.type === "resize_block_top" ||
                  dragState.type === "resize_block_bottom"
                ) {
                  const originalBlock = timeBlocks.find(
                    (b) => b.id === dragState.blockId,
                  );
                  if (originalBlock) {
                    const timeAtCurrentPos = positionToTime(
                      dragState.currentMousePosition,
                      gridRef,
                      true,
                    );
                    if (timeAtCurrentPos) {
                      const originalDayOffset = differenceInDays(
                        dragState.initialStartTime,
                        weekStart,
                      );
                      const resizeTimeOnOriginalDay = addDays(
                        weekStart,
                        originalDayOffset,
                      );
                      resizeTimeOnOriginalDay.setHours(
                        timeAtCurrentPos.getHours(),
                        timeAtCurrentPos.getMinutes(),
                        0,
                        0,
                      );

                      previewStartTime = new Date(dragState.initialStartTime);
                      previewEndTime = new Date(dragState.initialEndTime);

                      if (dragState.type === "resize_block_top") {
                        previewStartTime = resizeTimeOnOriginalDay;
                      } else {
                        previewEndTime = resizeTimeOnOriginalDay;
                      }
                    }
                  }
                }
                // --- End Recalculation ---

                if (!previewStartTime || !previewEndTime) {
                  return null;
                }

                // Apply snapping
                previewStartTime = snapTime(previewStartTime);
                previewEndTime = snapTime(previewEndTime);

                // Swap if needed
                if (previewEndTime.getTime() < previewStartTime.getTime()) {
                  [previewStartTime, previewEndTime] = [
                    previewEndTime,
                    previewStartTime,
                  ];
                }
                // Prevent zero/negative duration for indicator time selection
                if (previewEndTime.getTime() <= previewStartTime.getTime()) {
                  // If times are identical after swap/snap, base end time on start time
                  previewEndTime = new Date(
                    previewStartTime.getTime() + snapMinutes * 60 * 1000,
                  );
                }

                // Determine which time and type to show
                if (dragState.type === "resize_block_bottom") {
                  indicatorTime = previewEndTime;
                  indicatorType = "selection-end";
                } else {
                  // Default to start time for move and resize_top
                  indicatorTime = previewStartTime;
                  indicatorType = "selection-start";
                }
              }

              // --- Common Rendering Logic for TimeIndicator ---
              if (!indicatorTime) {
                return null;
              }

              const top = getYPositionFromTime(indicatorTime);
              const currentDayStart = startOfDay(indicatorTime);
              const weekDayStart = startOfDay(weekStart);
              const dayIndex = differenceInDays(currentDayStart, weekDayStart);

              if (dayIndex < 0 || dayIndex >= numberOfDays) {
                return null;
              }

              const leftPercent = (dayIndex * 100) / numberOfDays;
              const widthPercent = 100 / numberOfDays;

              if (isNaN(top) || isNaN(leftPercent) || isNaN(widthPercent)) {
                return null;
              }

              const labelOnLeft = leftPercent > 50;

              return (
                <TimeIndicator
                  top={top}
                  left={`${leftPercent}%`}
                  width={`${widthPercent}%`}
                  time={indicatorTime}
                  type={indicatorType}
                  labelOnLeft={labelOnLeft}
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
  // --- End JSX Return ---
};

// --- Main WeeklyCalendar Component ---
export function WeeklyCalendar({
  defaultStartHour = 6,
  defaultEndHour = 20,
  defaultNumberOfDays = 7,
  defaultHeight = 64,
}: WeeklyCalendarProps) {
  // --- State Definitions ---
  const [startHour, setStartHour] = useState(defaultStartHour);
  const [endHour, setEndHour] = useState(defaultEndHour);
  const [numberOfDays, setNumberOfDays] = useState(defaultNumberOfDays);
  const [snapMinutes, setSnapMinutes] = useState(15);
  const [blockHeight, setBlockHeight] = useState(defaultHeight);
  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfDay(new Date()),
  );
  const weekStart = selectedDate;
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isMetadataSummaryOpen, setIsMetadataSummaryOpen] = useState(false);
  // --- End State Definitions ---

  // State for the height of the sticky day header
  const [topOffset, setTopOffset] = useState(0);

  // --- Handlers for Header Controls ---
  const handlePreviousWeek = () => {
    setSelectedDate((prev) => subWeeks(prev, 1));
  };
  const handleNextWeek = () => {
    setSelectedDate((prev) => addWeeks(prev, 1));
  };
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(startOfDay(date));
    }
  };
  // --- End Handlers ---

  return (
    <TimePositionProvider
      startHour={startHour}
      endHour={endHour}
      snapMinutes={snapMinutes}
      numberOfDays={numberOfDays}
      weekStart={weekStart}
      blockHeight={blockHeight}
      topOffset={topOffset}
    >
      <div className="flex h-full flex-col">
        {/* Header Section */}
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          {/* Date Navigation */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handlePreviousWeek}>
              Previous
            </Button>
            <DateInput
              value={selectedDate}
              onChange={handleDateChange}
              className="text-lg"
            />
            <Button variant="outline" onClick={handleNextWeek}>
              Next
            </Button>
          </div>
          {/* Controls: List, Summary, Settings */}
          <div className="flex items-center space-x-2">
            {/* Add List Button Back */}
            <Button
              variant="outline"
              onClick={() => setIsListDialogOpen(true)}
              title="List View"
            >
              <List className="h-4 w-4" />
              <span className="ml-2">List View</span>
            </Button>
            {/* Add Summary Button Back */}
            <Button
              variant="outline"
              onClick={() => setIsMetadataSummaryOpen(true)}
              title="Metadata Summary"
            >
              <Table className="h-4 w-4" />
              <span className="ml-2">Summary</span>
            </Button>
            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                {/* Settings Form (unchanged) */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Adjust calendar view settings.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label htmlFor="startHour">Start Hour</label>
                      <Input
                        id="startHour"
                        type="number"
                        defaultValue={startHour}
                        onChange={(e) =>
                          setStartHour(parseInt(e.target.value, 10))
                        }
                        className="col-span-2 h-8"
                        min={0}
                        max={endHour - 1}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label htmlFor="endHour">End Hour</label>
                      <Input
                        id="endHour"
                        type="number"
                        defaultValue={endHour}
                        onChange={(e) =>
                          setEndHour(parseInt(e.target.value, 10))
                        }
                        className="col-span-2 h-8"
                        min={startHour + 1}
                        max={24}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label htmlFor="numberOfDays">Number of Days</label>
                      <Input
                        id="numberOfDays"
                        type="number"
                        defaultValue={numberOfDays}
                        onChange={(e) =>
                          setNumberOfDays(parseInt(e.target.value, 10))
                        }
                        className="col-span-2 h-8"
                        min={1}
                        max={7}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label htmlFor="snapMinutes">Snap Interval (min)</label>
                      <Input
                        id="snapMinutes"
                        type="number"
                        defaultValue={snapMinutes}
                        onChange={(e) =>
                          setSnapMinutes(parseInt(e.target.value, 10))
                        }
                        className="col-span-2 h-8"
                        step={5}
                        min={5}
                        max={60}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label htmlFor="blockHeight">Block Height (px)</label>
                      <Input
                        id="blockHeight"
                        type="number"
                        defaultValue={blockHeight}
                        onChange={(e) =>
                          setBlockHeight(parseInt(e.target.value, 10))
                        }
                        className="col-span-2 h-8"
                        min={20}
                        max={120}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Render Calendar Content Component */}
        <CalendarContent
          startHour={startHour}
          endHour={endHour}
          snapMinutes={snapMinutes}
          numberOfDays={numberOfDays}
          weekStart={weekStart}
          blockHeight={blockHeight}
          topOffset={topOffset}
          setStartHour={setStartHour}
          setEndHour={setEndHour}
          setIsListDialogOpen={setIsListDialogOpen}
          setIsMetadataSummaryOpen={setIsMetadataSummaryOpen}
          setTopOffset={setTopOffset}
        />

        {/* Dialogs */}
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
    </TimePositionProvider>
  );
}
