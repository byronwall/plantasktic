"use client";

import { addDays } from "date-fns";
import { useEffect, useState } from "react";

import { api } from "~/trpc/react";

import { getTimeFromGridPosition } from "./getTimeFromGridPosition";
import { type TimeBlock } from "./WeeklyCalendar";

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

type MousePosition = {
  day: number;
  hour: number;
  minute: number;
} | null;

export function useTimeBlockMouseEvents(
  gridRef: React.RefObject<HTMLDivElement>,
  startHour: number,
  endHour: number,
  snapMinutes: number,
  timeBlocks: TimeBlock[],
  weekStart: Date,
  setNewBlockStart: (start: Date) => void,
  setNewBlockEnd: (end: Date) => void,
  setIsDialogOpen: (open: boolean) => void,
  setSelectedTimeBlock: (block: TimeBlock) => void,
  topOffset: number,
) {
  const [dragState, setDragState] = useState<DragState>({ type: "idle" });
  const [isControlPressed, setIsControlPressed] = useState(false);
  const [mousePosition, setMousePosition] = useState<MousePosition>(null);

  const updateTimeBlockMutation = api.timeBlock.update.useMutation();

  const duplicateTimeBlockMutation = api.timeBlock.duplicate.useMutation();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if we clicked on a time block
    if ((e.target as HTMLElement).closest('[data-time-block="true"]')) {
      return;
    }

    const time = getTimeFromGridPosition(
      e.pageX,
      e.pageY,
      gridRef,
      topOffset,
      startHour,
      endHour,
      snapMinutes,
    );
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

    const time = getTimeFromGridPosition(
      e.pageX,
      e.pageY,
      gridRef,
      topOffset,
      startHour,
      endHour,
      snapMinutes,
    );

    if (!time) {
      setMousePosition(null);
      return;
    }

    // Only update mouse position when not dragging
    if (dragState.type === "idle") {
      setMousePosition(time);
    } else {
      setMousePosition(null);
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
          gridRef,
          topOffset,
          startHour,
          endHour,
          snapMinutes,
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

  // Add handler to clear mouse position when leaving grid
  const handleMouseLeave = () => {
    setMousePosition(null);
    setDragState({ type: "idle" });
  };

  const handleMouseUp = () => {
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
          gridRef,
          topOffset,
          startHour,
          endHour,
          snapMinutes,
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
          gridRef,
          topOffset,
          startHour,
          endHour,
          snapMinutes,
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

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleBlockDragStart,
    handleBlockResizeStart,
    dragState,
    isControlPressed,
    mousePosition,
  };
}
