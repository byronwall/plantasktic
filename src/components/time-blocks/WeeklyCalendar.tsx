"use client";

import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { CreateTimeBlockDialog } from "./CreateTimeBlockDialog";
import { EditTimeBlockDialog } from "./EditTimeBlockDialog";

import { DateInput } from "../ui/date-input";
import { Input } from "../ui/input";

import type { TimeBlock as PrismaTimeBlock } from "@prisma/client";

const DAYS = Array.from({ length: 7 }, (_, i) => i);

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 20;

type TimeBlockTask = {
  id: string;
  timeBlockId: string;
  taskId: number;
  created_at: Date;
  task: {
    task_id: number;
    title: string;
    description: string | null;
    comments: string | null;
    category: string | null;
    due_date: Date | null;
    start_date: Date | null;
    duration: number | null;
    priority: string | null;
    status: string;
    created_at: Date;
    updated_at: Date;
    parentTaskId: number | null;
    projectId: string | null;
    userId: string | null;
  };
};

type TimeBlock = PrismaTimeBlock & {
  taskAssignments: TimeBlockTask[];
};

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

type TimeBlockProps = {
  block: TimeBlockWithPosition;
  onSelect: () => void;
  onDragStart: (blockId: string, offset: { x: number; y: number }) => void;
  onResizeStart: (
    blockId: string,
    edge: "top" | "bottom",
    startTime: Date,
    endTime: Date,
  ) => void;
};

function TimeBlock({
  block,
  onSelect,
  onDragStart,
  onResizeStart,
}: TimeBlockProps) {
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);

  const dayOffset = blockStart.getDay();
  const startHourOffset = blockStart.getHours() - DEFAULT_START_HOUR;
  const startMinuteOffset = blockStart.getMinutes() / 60;
  const duration =
    (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60 * 60);

  const baseWidth = 100 / 7;
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
    top: `${(startHourOffset + startMinuteOffset) * 64}px`,
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
    cursor: "grab",
    zIndex:
      block.totalOverlaps && block.totalOverlaps > 3
        ? (block.index || 0) + 1
        : 1,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Check if clicking on resize handles
    if (offsetY < 8) {
      onResizeStart(block.id, "top", blockStart, blockEnd);
    } else if (offsetY > rect.height - 8) {
      onResizeStart(block.id, "bottom", blockStart, blockEnd);
    } else {
      onDragStart(block.id, { x: offsetX, y: offsetY });
    }
  };

  return (
    <div
      style={style}
      data-time-block="true"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={handleMouseDown}
      className={cn("group relative select-none")}
    >
      <div className="absolute inset-x-0 top-0 h-2 cursor-ns-resize hover:bg-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-black/10" />
      {block.title || "Untitled Block"}
    </div>
  );
}

type DragState =
  | { type: "idle" }
  | {
      type: "drag_new";
      startTime: { hour: number; day: number };
      currentTime: { hour: number; day: number };
    }
  | {
      type: "drag_existing";
      blockId: string;
      startOffset: { x: number; y: number };
      currentPosition: { x: number; y: number };
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

export function WeeklyCalendar() {
  const { currentWorkspaceId } = useCurrentProject();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(DEFAULT_START_HOUR);
  const [endHour, setEndHour] = useState(DEFAULT_END_HOUR);
  const weekStart = startOfWeek(selectedDate);
  const gridRef = useRef<HTMLDivElement>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<{
    x: number;
    y: number;
  }>();
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
  const { data: timeBlocks } = api.timeBlock.getWeeklyBlocks.useQuery({
    workspaceId: currentWorkspaceId,
    weekStart,
  });

  // Add mutation
  const updateTimeBlockMutation = api.timeBlock.update.useMutation();

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

    const day = Math.max(0, Math.min(6, Math.floor(relativeX / dayWidth)));
    const rawHour = relativeY / hourHeight + startHour;
    const hour = Math.max(startHour, Math.min(endHour, Math.floor(rawHour)));
    const minute = Math.floor((rawHour % 1) * 60);

    return {
      day,
      hour,
      minute: Math.max(0, Math.min(59, minute)),
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
      startTime: { hour: time.hour, day: time.day },
      currentTime: { hour: time.hour, day: time.day },
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
          currentTime: { hour: time.hour, day: time.day },
        });
        break;
      }
      case "drag_existing": {
        const { blockId, startOffset } = dragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          return;
        }

        // Calculate adjusted position relative to the grid

        // Get the time from the adjusted position
        const adjustedTime = getTimeFromGridPosition(
          e.pageX - startOffset.x,
          e.pageY - startOffset.y,
        );
        if (!adjustedTime) {
          return;
        }

        setDragState({
          ...dragState,
          currentPosition: {
            x: e.pageX - startOffset.x,
            y: e.pageY - startOffset.y,
          },
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
        startDate.setHours(Math.min(startTime.hour, currentTime.hour), 0, 0, 0);

        const endDate = addDays(weekStart, currentTime.day);
        endDate.setHours(
          Math.max(startTime.hour, currentTime.hour) + 1,
          0,
          0,
          0,
        );

        setNewBlockStart(startDate);
        setNewBlockEnd(endDate);
        setNewBlockDay(startTime.day);
        setDialogPosition({ x: e.pageX, y: e.pageY });
        setIsDialogOpen(true);
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

        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() + time.day);
        newStart.setHours(time.hour, time.minute, 0, 0);

        const newEnd = new Date(newStart.getTime());
        newEnd.setTime(newStart.getTime() + duration * 60 * 60 * 1000);

        updateTimeBlockMutation.mutate({
          id: blockId,
          startTime: newStart,
          endTime: newEnd,
          dayOfWeek: time.day,
          ...(block.title && { title: block.title }),
          ...(block.color && { color: block.color }),
        });
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
        newTime.setHours(time.hour, time.minute, 0, 0);

        // Only update the edge being dragged and ensure end time is after start time
        const newStart =
          dragState.type === "resize_block_top" ? newTime : startTime;
        const newEnd =
          dragState.type === "resize_block_bottom" ? newTime : endTime;

        if (newEnd.getTime() <= newStart.getTime()) {
          break;
        }

        updateTimeBlockMutation.mutate({
          id: blockId,
          startTime: newStart,
          endTime: newEnd,
          dayOfWeek: dayOffset,
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

    let style: React.CSSProperties = {
      position: "absolute",
      backgroundColor: "#3b82f6",
      opacity: 0.4,
      borderRadius: "0.375rem",
      pointerEvents: "none",
    };

    switch (dragState.type) {
      case "drag_new": {
        const { startTime, currentTime } = dragState;
        const startHourOffset =
          Math.min(startTime.hour, currentTime.hour) - startHour;
        const endHourOffset =
          Math.max(startTime.hour, currentTime.hour) - startHour;
        const dayOffset = startTime.day;

        style = {
          ...style,
          left: `${(dayOffset * 100) / 7}%`,
          top: `${startHourOffset * 64}px`,
          height: `${(endHourOffset - startHourOffset + 1) * 64}px`,
          width: `${100 / 7}%`,
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

        style = {
          ...style,
          left: `${(time.day * 100) / 7}%`,
          top: `${(time.hour - startHour + time.minute / 60) * 64}px`,
          height: `${duration * 64}px`,
          width: `${100 / 7}%`,
          backgroundColor: block.color || "#3b82f6",
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
        newTime.setHours(time.hour, time.minute, 0, 0);

        // Only modify the edge being dragged
        const previewStart =
          dragState.type === "resize_block_top" ? newTime : startTime;
        const previewEnd =
          dragState.type === "resize_block_bottom" ? newTime : endTime;

        // Ensure end time is always after start time
        if (previewEnd.getTime() <= previewStart.getTime()) {
          return null;
        }

        const duration =
          (previewEnd.getTime() - previewStart.getTime()) / (1000 * 60 * 60);
        const startHourOffset =
          previewStart.getHours() + previewStart.getMinutes() / 60 - startHour;

        style = {
          ...style,
          left: `${(dayOffset * 100) / 7}%`,
          top: `${startHourOffset * 64}px`,
          height: `${Math.max(1, duration) * 64}px`,
          width: `${100 / 7}%`,
          backgroundColor: block.color || "#3b82f6",
        };
        break;
      }
    }

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
          <div className="grid select-none grid-cols-[auto_repeat(7,1fr)] border-b">
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
            <div className="select-none space-y-[1px]">
              {displayedHours.map((hour) => (
                <div key={hour} className="h-16 border-r p-2 text-sm">
                  {format(new Date().setHours(hour, 0), "h a")}
                </div>
              ))}
            </div>

            {/* Time slots for each day */}
            <div
              ref={gridRef}
              className="relative col-span-7 select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setDragState({ type: "idle" })}
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
                getOverlappingGroups(timeBlocks)
                  .flat()
                  .map((block) => (
                    <TimeBlock
                      key={block.id}
                      block={block}
                      onSelect={() => setSelectedTimeBlock(block)}
                      onDragStart={handleBlockDragStart}
                      onResizeStart={handleBlockResizeStart}
                    />
                  ))}
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
            setNewBlockStart(null);
            setNewBlockEnd(null);
            setNewBlockDay(0);
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
