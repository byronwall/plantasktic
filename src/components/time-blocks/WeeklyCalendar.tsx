"use client";

import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { List, Table, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api, type RouterOutputs } from "~/trpc/react";

import { DayMetadataSection } from "./DayMetadataSection";
import { ListTimeBlocksDialog } from "./ListTimeBlocksDialog";
import { MetadataSummaryDialog } from "./MetadataSummaryDialog";
import { getOverlappingGroups } from "./overlapHelpers";
import { TimeBlock } from "./TimeBlock";
import { TimeBlockDialog } from "./TimeBlockDialog";

import { DateInput } from "../ui/date-input";
import { Input } from "../ui/input";

import type { TimeBlock as PrismaTimeBlock } from "@prisma/client";

const DAYS = Array.from({ length: 7 }, (_, i) => i);

export type WeeklyCalendarProps = {
  defaultStartHour?: number;
  defaultEndHour?: number;
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

type DragState =
  | { type: "idle" }
  | {
      type: "drag_new";
      startTime: { hour: number; day: number; minute: number };
      currentTime: { hour: number; day: number; minute: number };
    }
  | {
      type: "drag_existing";
      blockId: string;
      startOffset: { x: number; y: number };
      currentPosition: { x: number; y: number };
      startPosition: { x: number; y: number };
      totalMovement: number;
      shouldDuplicate: boolean;
    }
  | {
      type: "resize_block_top";
      blockId: string;
      startTime: Date;
      endTime: Date;
      currentPosition: { x: number; y: number };
    }
  | {
      type: "resize_block_bottom";
      blockId: string;
      startTime: Date;
      endTime: Date;
      currentPosition: { x: number; y: number };
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
}: WeeklyCalendarProps) {
  const { currentWorkspaceId } = useCurrentProject();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(defaultStartHour);
  const [endHour, setEndHour] = useState(defaultEndHour);
  const [snapMinutes, setSnapMinutes] = useState(15);
  const weekStart = startOfWeek(selectedDate);
  const gridRef = useRef<HTMLDivElement>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isMetadataSummaryOpen, setIsMetadataSummaryOpen] = useState(false);
  const [newBlockStart, setNewBlockStart] = useState<Date | null>(null);
  const [newBlockEnd, setNewBlockEnd] = useState<Date | null>(null);
  const [newBlockDay, setNewBlockDay] = useState<number>(0);

  // State machine for drag operations
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });

  // Remove DndKit state and sensors
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | null>(
    null,
  );

  // Fetch time blocks for the current week
  const { data: timeBlocks = [] } = api.timeBlock.getWeeklyBlocks.useQuery(
    {
      weekStart,
      workspaceId: currentWorkspaceId,
    },
    {
      enabled: !!currentWorkspaceId,
    },
  );

  // Add mutation
  const updateTimeBlockMutation = api.timeBlock.update.useMutation();

  // Add mutation for duplication
  const duplicateTimeBlockMutation = api.timeBlock.duplicate.useMutation();

  // Add metadata query
  const { data: weekMetadata = [] as DayMetadataItem[] } =
    api.timeBlock.getWeekMetadata.useQuery(
      {
        workspaceId: currentWorkspaceId || "",
        weekStart,
      },
      {
        enabled: !!currentWorkspaceId,
      },
    );

  // Track control key state
  const [isControlPressed, setIsControlPressed] = useState(false);

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
    const dayOfWeek = now.getDay();

    if (hour < startHour || hour > endHour) {
      return null;
    }

    const top = (hour - startHour + minutes / 60) * 64;
    const left = `${(dayOfWeek * 100) / 7}%`;
    const width = `${100 / 7}%`;

    return { top, left, width };
  };

  // Get drag indicator positions
  const getDragIndicatorPositions = () => {
    if (dragState.type === "idle") {
      return null;
    }

    const getPosition = (hour: number, minute = 0) => {
      return (hour - startHour + minute / 60) * 64;
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
        );
        if (!time) {
          return null;
        }
        return { startPos: getPosition(time.hour, time.minute) };
      }
    }
  };

  // Add keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dragState.type !== "idle") {
        setDragState({ type: "idle" });
      } else if (e.key === "Control" || e.key === "Meta") {
        setIsControlPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        setIsControlPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [dragState.type]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
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

  const getTimeFromGridPosition = (x: number, y: number) => {
    if (!gridRef.current) {
      return null;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;

    // Convert page coordinates to relative coordinates
    const relativeX = x - rect.left;
    const relativeY = y - rect.top - scrollY;

    // Ensure coordinates are within bounds
    if (
      relativeX < 0 ||
      relativeY < 0 ||
      relativeX > rect.width ||
      relativeY > rect.height + scrollY
    ) {
      return null;
    }

    const dayWidth = rect.width / 7;
    const hourHeight = 64; // matches the h-16 class

    // Add 0.5 * dayWidth to center the drag point within the column
    const adjustedX = relativeX;
    const day = Math.max(0, Math.min(6, Math.floor(adjustedX / dayWidth)));
    const rawHour = relativeY / hourHeight + startHour;
    const hour = Math.floor(rawHour);

    // Calculate minutes and snap to interval
    const rawMinutes = (rawHour % 1) * 60;
    const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;

    // Adjust hour if minutes wrap around
    const finalHour = snappedMinutes === 60 ? hour + 1 : hour;
    const finalMinutes = snappedMinutes === 60 ? 0 : snappedMinutes;

    return {
      day,
      hour: Math.max(startHour, Math.min(endHour, finalHour)),
      minute: Math.max(0, Math.min(59, finalMinutes)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if we clicked on a time block
    if ((e.target as HTMLElement).closest('[data-time-block="true"]')) {
      return;
    }

    const time = getTimeFromGridPosition(e.pageX, e.pageY);
    if (!time) {
      return;
    }

    setDragState({
      type: "drag_new",
      startTime: { hour: time.hour, day: time.day, minute: time.minute },
      currentTime: { hour: time.hour, day: time.day, minute: time.minute },
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) {
      return;
    }

    const time = getTimeFromGridPosition(e.pageX, e.pageY);

    if (!time) {
      return;
    }

    switch (dragState.type) {
      case "drag_new": {
        setDragState({
          ...dragState,
          currentTime: { hour: time.hour, day: time.day, minute: time.minute },
        });
        break;
      }
      case "drag_existing": {
        const { blockId, startOffset, startPosition, totalMovement } =
          dragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          return;
        }

        const dx = e.pageX - (startPosition.x || e.pageX);
        const dy = e.pageY - (startPosition.y || e.pageY);
        const newMovement = totalMovement + Math.sqrt(dx * dx + dy * dy);

        const adjustedTime = getTimeFromGridPosition(
          e.pageX,
          e.pageY - startOffset.y,
        );
        if (!adjustedTime) {
          return;
        }

        setDragState({
          ...dragState,
          currentPosition: {
            x: e.pageX,
            y: e.pageY - startOffset.y,
          },
          startPosition: { x: e.pageX, y: e.pageY },
          totalMovement: newMovement,
          shouldDuplicate: isControlPressed,
        });
        break;
      }
      case "resize_block_top":
      case "resize_block_bottom": {
        setDragState({
          ...dragState,
          currentPosition: { x: e.pageX, y: e.pageY },
        });
        break;
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current || !timeBlocks) {
      return;
    }

    switch (dragState.type) {
      case "drag_new": {
        const { startTime, currentTime } = dragState;

        const startDate = addDays(weekStart, startTime.day);
        startDate.setHours(
          Math.min(Math.max(startTime.hour, startHour), endHour),
          Math.round(startTime.minute / snapMinutes) * snapMinutes,
          0,
          0,
        );

        const endDate = addDays(weekStart, currentTime.day);
        endDate.setHours(
          Math.min(Math.max(currentTime.hour, startHour), endHour),
          Math.round(currentTime.minute / snapMinutes) * snapMinutes,
          0,
          0,
        );

        // Ensure end time is after start time and within bounds
        if (endDate.getTime() <= startDate.getTime()) {
          endDate.setTime(startDate.getTime() + snapMinutes * 60 * 1000); // Add one snap interval
        }

        setNewBlockStart(startDate);
        setNewBlockEnd(endDate);
        setNewBlockDay(startTime.day);
        setIsDialogOpen(true);
        break;
      }
      case "drag_existing": {
        const { blockId, currentPosition, totalMovement, shouldDuplicate } =
          dragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          return null;
        }

        // If total movement is less than threshold, show edit dialog instead of moving
        const MOVEMENT_THRESHOLD = 5; // pixels
        if (totalMovement < MOVEMENT_THRESHOLD) {
          setSelectedTimeBlock(block);
          break;
        }

        const time = getTimeFromGridPosition(
          currentPosition.x,
          currentPosition.y,
        );
        if (!time) {
          return null;
        }

        const blockStart = new Date(block.startTime);
        const blockEnd = new Date(block.endTime);
        const duration =
          (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60 * 60);

        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() + time.day);
        newStart.setHours(Math.max(time.hour, startHour), time.minute, 0, 0);

        const newEnd = new Date(newStart.getTime());
        newEnd.setTime(newStart.getTime() + duration * 60 * 60 * 1000);

        // If the end time would exceed the endHour, adjust both start and end times
        if (newEnd.getHours() > endHour) {
          const hoursToAdjust = newEnd.getHours() - endHour;
          newStart.setHours(newStart.getHours() - hoursToAdjust);
          newEnd.setHours(endHour);
        }

        if (shouldDuplicate) {
          duplicateTimeBlockMutation.mutate({
            id: blockId,
            startTime: newStart,
            endTime: newEnd,
          });
        } else {
          updateTimeBlockMutation.mutate({
            id: blockId,
            startTime: newStart,
            endTime: newEnd,
            ...(block.title && { title: block.title }),
            ...(block.color && { color: block.color }),
          });
        }
        break;
      }
      case "resize_block_top":
      case "resize_block_bottom": {
        const { blockId, startTime, endTime, currentPosition } = dragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          break;
        }

        const time = getTimeFromGridPosition(
          currentPosition.x,
          currentPosition.y,
        );
        if (!time) {
          break;
        }

        const dayOffset = new Date(block.startTime).getDay();
        const newTime = new Date(weekStart);
        newTime.setDate(newTime.getDate() + dayOffset);
        newTime.setHours(
          Math.min(Math.max(time.hour, startHour), endHour),
          time.minute,
          0,
          0,
        );

        // Only update the edge being dragged and ensure end time is after start time
        const newStart =
          dragState.type === "resize_block_top" ? newTime : startTime;
        const newEnd =
          dragState.type === "resize_block_bottom" ? newTime : endTime;

        // Ensure the block stays within bounds and has minimum duration
        if (
          newEnd.getTime() <= newStart.getTime() ||
          newStart.getHours() < startHour ||
          newEnd.getHours() > endHour
        ) {
          break;
        }

        updateTimeBlockMutation.mutate({
          id: blockId,
          startTime: newStart,
          endTime: newEnd,
        });
        break;
      }
    }

    setDragState({ type: "idle" });
  };

  const handleBlockDragStart = (
    blockId: string,
    offset: { x: number; y: number },
  ) => {
    setDragState({
      type: "drag_existing",
      blockId,
      startOffset: offset,
      currentPosition: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      totalMovement: 0,
      shouldDuplicate: isControlPressed,
    });
  };

  const handleBlockResizeStart = (
    blockId: string,
    edge: "top" | "bottom",
    startTime: Date,
    endTime: Date,
  ) => {
    setDragState({
      type: edge === "top" ? "resize_block_top" : "resize_block_bottom",
      blockId,
      startTime,
      endTime,
      currentPosition: { x: 0, y: 0 },
    });
  };

  const renderDragPreview = () => {
    if (dragState.type === "idle") {
      return null;
    }

    let previewBlock: TimeBlockWithPosition | null = null;

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
        previewBlock = {
          id: "preview",
          startTime: startDate,
          endTime: endDate,
          title: "New Block",
          workspaceId: currentWorkspaceId || "",
          color: null,
          created_at: now,
          updated_at: now,
          taskAssignments: [],
        };
        break;
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

        previewBlock = {
          ...block,
          startTime: previewStart,
          endTime: previewEnd,
        };
        break;
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
        );
        if (!time) {
          return null;
        }

        const dayOffset = new Date(block.startTime).getDay();
        const newTime = new Date(weekStart);
        newTime.setDate(newTime.getDate() + dayOffset);
        newTime.setHours(
          Math.min(Math.max(time.hour, startHour), endHour),
          time.minute,
          0,
          0,
        );

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

        previewBlock = {
          ...block,
          startTime: previewStart,
          endTime: previewEnd,
        };
        break;
      }
    }

    if (!previewBlock) {
      return null;
    }

    return (
      <TimeBlock
        block={previewBlock}
        onDragStart={() => undefined}
        onResizeStart={() => undefined}
        isPreview={true}
        startHour={startHour}
        gridRef={gridRef}
      />
    );
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

  // Helper function to categorize blocks based on visibility
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

        // Normalize times to the same day for comparison
        const normalizedStart = new Date(blockStart);
        normalizedStart.setFullYear(startOfDay.getFullYear());
        normalizedStart.setMonth(startOfDay.getMonth());
        normalizedStart.setDate(startOfDay.getDate());

        const normalizedEnd = new Date(blockEnd);
        normalizedEnd.setFullYear(startOfDay.getFullYear());
        normalizedEnd.setMonth(startOfDay.getMonth());
        normalizedEnd.setDate(startOfDay.getDate());

        if (normalizedEnd <= startOfDay) {
          acc.before.push(block);
        } else if (normalizedStart >= endOfDay) {
          acc.after.push(block);
        } else {
          // For visible blocks, clip the times to the visible range
          const clippedBlock = {
            ...block,
            startTime: normalizedStart < startOfDay ? startOfDay : blockStart,
            endTime: normalizedEnd > endOfDay ? endOfDay : blockEnd,
            isClipped: normalizedStart < startOfDay || normalizedEnd > endOfDay,
          };
          acc.visible.push(clippedBlock);
        }
        return acc;
      },
      { before: [], after: [], visible: [] },
    );
  }, [timeBlocks, weekStart, startHour, endHour, overlappingGroups]);

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

  const correctOverlappingBlocks = (dayOffset: number) => {
    const date = addDays(weekStart, dayOffset);
    const dayBlocks = timeBlocks?.filter(
      (block) => block.startTime.getDay() === dayOffset,
    );

    if (!dayBlocks?.length) {
      return;
    }

    // Sort blocks by start time
    const sortedBlocks = [...dayBlocks].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const updates: { id: string; startTime: Date; endTime: Date }[] = [];

    // Iterate through blocks and adjust times
    sortedBlocks.forEach((block, index) => {
      if (index === 0) {
        // Keep first block as is
        updates.push({
          id: block.id,
          startTime: new Date(block.startTime),
          endTime: new Date(block.endTime),
        });
        return;
      }

      const previousBlock = updates[index - 1];
      if (!previousBlock) {
        return;
      }

      const blockDuration =
        new Date(block.endTime).getTime() - new Date(block.startTime).getTime();

      // Set new start time to previous block's end time
      const newStartTime = new Date(previousBlock.endTime);
      const newEndTime = new Date(newStartTime.getTime() + blockDuration);

      updates.push({
        id: block.id,
        startTime: newStartTime,
        endTime: newEndTime,
      });
    });

    bulkUpdateMutation.mutate(updates);
  };

  // Function to check if a day has overlapping blocks
  const hasDayOverlaps = (dayOffset: number) => {
    const dayBlocks = timeBlocks?.filter(
      (block) => block.startTime.getDay() === dayOffset,
    );

    if (!dayBlocks?.length) {
      return false;
    }

    const sortedBlocks = [...dayBlocks].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    for (let i = 1; i < sortedBlocks.length; i++) {
      const currentBlock = sortedBlocks[i];
      const previousBlock = sortedBlocks[i - 1];

      if (!currentBlock || !previousBlock) {
        continue;
      }

      if (new Date(currentBlock.startTime) < new Date(previousBlock.endTime)) {
        return true;
      }
    }

    return false;
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
                min={1}
                max={24}
                value={endHour}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  // Ensure end hour is greater than start hour
                  if (value > startHour) {
                    setEndHour(value);
                  }
                }}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Snap (min)</span>
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
                className="w-20"
              />
            </div>
          </div>

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
          <div className="grid select-none grid-cols-[auto_repeat(7,1fr)] border-b">
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
                  {hasDayOverlaps(dayOffset) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => correctOverlappingBlocks(dayOffset)}
                      title="Fix overlapping blocks"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[auto_repeat(7,1fr)]">
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
                  className={`h-16 border-r pr-1 text-right text-sm ${index < displayedHours.length - 1 ? "border-b" : ""}`}
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
              className="relative col-span-7 select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setDragState({ type: "idle" })}
              style={{
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
                      left: position.left,
                      width: position.width,
                    }}
                  />
                );
              })()}

              {DAYS.map((dayOffset, index) => (
                <div
                  key={dayOffset}
                  className={`absolute ${index < DAYS.length - 1 ? "border-r" : ""}`}
                  style={{
                    left: `${(dayOffset * 100) / 7}%`,
                    width: `${100 / 7}%`,
                    height: `calc(100% - ${categorizedBlocks.before.length > 0 ? "32px" : "0px"} - ${
                      categorizedBlocks.after.length > 0 ? "32px" : "0px"
                    })`,
                    top: categorizedBlocks.before.length > 0 ? "32px" : "0px",
                  }}
                >
                  {displayedHours.map((hour, hourIndex) => (
                    <div
                      key={hour}
                      className={`h-16 ${hourIndex < displayedHours.length - 1 ? "border-b" : ""}`}
                    />
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
                  gridRef={gridRef}
                  isClipped={block.isClipped}
                  topOffset={categorizedBlocks.before.length > 0 ? 32 : 0}
                />
              ))}
              {renderDragPreview()}
            </div>
          </div>
        </div>

        {/* Day Metadata Section */}
        {currentWorkspaceId && (
          <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-4 rounded-lg border bg-card">
            <div className="w-16 border-r" />

            {DAYS.map((dayOffset) => {
              const date = addDays(weekStart, dayOffset);
              const dayMetadata = weekMetadata.filter(
                (meta) =>
                  format(meta.date, "yyyy-MM-dd") ===
                  format(date, "yyyy-MM-dd"),
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

      {currentWorkspaceId && newBlockStart && newBlockEnd && (
        <TimeBlockDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setNewBlockStart(null);
            setNewBlockEnd(null);
            setNewBlockDay(0);
          }}
          workspaceId={currentWorkspaceId}
          startTime={newBlockStart}
          endTime={newBlockEnd}
        />
      )}

      {selectedTimeBlock && (
        <TimeBlockDialog
          isOpen={!!selectedTimeBlock}
          onClose={() => setSelectedTimeBlock(null)}
          workspaceId={currentWorkspaceId || ""}
          startTime={selectedTimeBlock.startTime}
          endTime={selectedTimeBlock.endTime}
          timeBlockId={selectedTimeBlock.id}
        />
      )}

      <ListTimeBlocksDialog
        isOpen={isListDialogOpen}
        onClose={() => setIsListDialogOpen(false)}
        weekStart={weekStart}
      />

      <MetadataSummaryDialog
        isOpen={isMetadataSummaryOpen}
        onClose={() => setIsMetadataSummaryOpen(false)}
        weekStart={weekStart}
      />
    </div>
  );
}
