"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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

type DraggableTimeBlockProps = {
  block: TimeBlockWithPosition;
  onSelect: () => void;
};

function DraggableTimeBlock({ block, onSelect }: DraggableTimeBlockProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
  });

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
    transform: CSS.Transform.toString(transform),
    zIndex:
      block.totalOverlaps && block.totalOverlaps > 3
        ? (block.index || 0) + 1
        : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-time-block="true"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="group relative"
      {...attributes}
      {...listeners}
    >
      <div className="absolute inset-x-0 top-0 h-2 cursor-ns-resize hover:bg-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-black/10" />
      {block.title || "Untitled Block"}
    </div>
  );
}

export function WeeklyCalendar() {
  const { currentWorkspaceId } = useCurrentProject();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(DEFAULT_START_HOUR);
  const [endHour, setEndHour] = useState(DEFAULT_END_HOUR);
  const weekStart = startOfWeek(selectedDate);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragOffsetYRef = useRef<number>(0);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<{
    x: number;
    y: number;
  }>();
  const [newBlockStart, setNewBlockStart] = useState<Date | null>(null);
  const [newBlockEnd, setNewBlockEnd] = useState<Date | null>(null);
  const [newBlockDay, setNewBlockDay] = useState<number>(0);

  // DndKit state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    hour: number;
    day: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ hour: number; day: number } | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  // Fetch time blocks for the current week
  const { data: timeBlocks } = api.timeBlock.getWeeklyBlocks.useQuery({
    workspaceId: currentWorkspaceId,
    weekStart,
  });

  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | null>(
    null,
  );

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
    // Convert page coordinates to relative coordinates by subtracting the grid's position
    const relativeX = x - (rect.left + window.scrollX);
    const relativeY = y - (rect.top + window.scrollY);

    const dayWidth = rect.width / 7;
    const hourHeight = 64; // matches the h-16 class

    const day = Math.floor(relativeX / dayWidth);
    const hour = Math.floor(relativeY / hourHeight) + startHour;
    const minute = Math.floor((relativeY % hourHeight) / (hourHeight / 60));

    return {
      day: Math.max(0, Math.min(6, day)),
      hour: Math.max(startHour, Math.min(endHour, hour)),
      minute: Math.max(0, Math.min(59, minute)),
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Store the initial click offset
    if (
      event.activatorEvent instanceof PointerEvent &&
      event.activatorEvent.target instanceof HTMLElement
    ) {
      const element = event.activatorEvent.target;
      if (element) {
        const rect = element.getBoundingClientRect();
        const offsetY = event.activatorEvent.pageY - rect.top;

        dragOffsetYRef.current = offsetY;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    setActiveId(null);

    if (!timeBlocks) {
      return;
    }

    const activeBlock = timeBlocks.find((block) => block.id === active.id);
    if (!activeBlock) {
      return;
    }

    // Cast the event to get access to coordinates
    const mouseEvent = event.activatorEvent as MouseEvent;
    const offsetY = dragOffsetYRef.current;

    // Adjust the position based on the initial click offset
    const adjustedCoords = {
      x: mouseEvent.pageX,
      y: mouseEvent.pageY - offsetY,
    };

    const time = getTimeFromGridPosition(adjustedCoords.x, adjustedCoords.y);
    if (!time) {
      return;
    }

    const blockStart = new Date(activeBlock.startTime);
    const blockEnd = new Date(activeBlock.endTime);
    const duration = (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60);

    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + time.day);
    newStart.setHours(time.hour, time.minute, 0, 0);

    const newEnd = new Date(newStart);
    newEnd.setMinutes(newStart.getMinutes() + duration);

    // Only update if the times have actually changed
    if (
      newStart.getTime() !== blockStart.getTime() ||
      newEnd.getTime() !== blockEnd.getTime()
    ) {
      updateTimeBlockMutation.mutate({
        id: activeBlock.id,
        startTime: newStart,
        endTime: newEnd,
        dayOfWeek: time.day,
        ...(activeBlock.title && { title: activeBlock.title }),
        ...(activeBlock.color && { color: activeBlock.color }),
      });
    }
  };

  const handleCreateBlockMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if we clicked on a time block
    if ((e.target as HTMLElement).closest('[data-time-block="true"]')) {
      return;
    }

    const time = getTimeFromGridPosition(e.pageX, e.pageY);
    console.log("mouse down", {
      x: e.pageX,
      y: e.pageY,
      scrollY: window.scrollY,
      time,
    });
    if (!time) {
      return;
    }

    setIsDragging(true);
    setDragStart(time);
    setDragEnd(time);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const time = getTimeFromGridPosition(e.pageX, e.pageY);
      if (!time) {
        return;
      }
      setDragEnd(time);
    }
  };

  const handleCreateBlockMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && dragStart && dragEnd && currentWorkspaceId) {
      setIsDragging(false);

      const startDate = addDays(weekStart, dragStart.day);
      startDate.setHours(dragStart.hour, 0, 0, 0);

      const endDate = addDays(weekStart, dragEnd.day);
      endDate.setHours(dragEnd.hour + 1, 0, 0, 0);

      setNewBlockStart(startDate);
      setNewBlockEnd(endDate);
      setNewBlockDay(dragStart.day);

      // Position dialog near the mouse
      setDialogPosition({ x: e.pageX, y: e.pageY });
      setIsDialogOpen(true);

      setDragStart(null);
      setDragEnd(null);
    }
  };

  const renderDragPreview = () => {
    if (isDragging && dragStart && dragEnd) {
      const startHourOffset =
        Math.min(dragStart.hour, dragEnd.hour) - startHour;
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
    }

    return null;
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
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div
                ref={gridRef}
                className="relative col-span-7"
                onMouseDown={handleCreateBlockMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleCreateBlockMouseUp}
                onMouseLeave={() => {
                  setIsDragging(false);
                }}
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
                      <DraggableTimeBlock
                        key={block.id}
                        block={block}
                        onSelect={() => setSelectedTimeBlock(block)}
                      />
                    ))}
                {renderDragPreview()}
              </div>

              <DragOverlay>
                {activeId && timeBlocks && (
                  <DraggableTimeBlock
                    block={timeBlocks.find((block) => block.id === activeId)!}
                    onSelect={() => void 0}
                  />
                )}
              </DragOverlay>
            </DndContext>
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
