"use client";

import { addDays, differenceInDays } from "date-fns";
import { useEffect, useState } from "react";

import { useKeyModifiers } from "~/hooks/useKeyModifiers";
import { useTimeBlockActions } from "~/hooks/useTimeBlockActions";
import { useTimeBlockDialogStore } from "~/stores/timeBlockDialogStore";

import { useTimePosition } from "./TimePositionContext";
import { useTimeBlockDragMachine } from "./useTimeBlockDragMachine";
import { type TimeBlock } from "./WeeklyCalendar";

type MousePosition = Date | null;

export function useTimeBlockMouseEvents(
  gridRef: React.RefObject<HTMLDivElement>,
  startHour: number,
  endHour: number,
  snapMinutes: number,
  timeBlocks: TimeBlock[],
  weekStart: Date,
  topOffset: number,
  numberOfDays = 7,
  blockHeight = 64,
) {
  const {
    state: dragState,
    startNew,
    startExisting,
    startResize,
    move,
    end,
    cancel,
  } = useTimeBlockDragMachine();

  const [mousePosition, setMousePosition] = useState<MousePosition>(null);

  const { Control, Meta } = useKeyModifiers(["Control", "Meta"]);
  const isControlPressed = Control || Meta;

  const { positionToTime, snapTime } = useTimePosition();
  const { openForTimeBlock, openForNewBlock } = useTimeBlockDialogStore();
  const { moveBlock, resizeBlock, duplicateBlock } = useTimeBlockActions();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-time-block="true"]')) {
      return;
    }
    const timeAtClick = positionToTime(
      { x: e.clientX, y: e.clientY },
      gridRef,
      true,
    );
    if (!timeAtClick) {
      return;
    }
    startNew(timeAtClick);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) {
      return;
    }

    const timeAtPosition = positionToTime(
      { x: e.clientX, y: e.clientY },
      gridRef,
      false,
    );

    if (dragState.type === "idle") {
      setMousePosition(timeAtPosition ? snapTime(timeAtPosition) : null);
    } else {
      setMousePosition(null);

      if (dragState.type === "drag_new") {
        if (timeAtPosition) {
          move({ time: timeAtPosition });
        }
      } else if (
        dragState.type === "drag_existing" ||
        dragState.type === "resize_block_top" ||
        dragState.type === "resize_block_bottom"
      ) {
        move({
          mousePosition: { x: e.clientX, y: e.clientY },
          isControlPressed: isControlPressed,
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const button = e.button;
    const finalDragState = { ...dragState };

    end({ button });

    if (!gridRef.current || !timeBlocks) {
      if (finalDragState.type === "idle") {
        return;
      }
    }

    switch (finalDragState.type) {
      case "drag_new": {
        let finalStartTime = snapTime(finalDragState.startTime);
        let finalEndTime = snapTime(finalDragState.currentTime);

        // Swap if end time is before start time
        if (finalEndTime.getTime() < finalStartTime.getTime()) {
          [finalStartTime, finalEndTime] = [finalEndTime, finalStartTime];
        }

        // Ensure minimum duration if they are the same after potential swap
        if (finalEndTime.getTime() <= finalStartTime.getTime()) {
          finalEndTime = new Date(
            finalStartTime.getTime() + snapMinutes * 60 * 1000,
          );
        }

        if (button === 0) {
          openForNewBlock(finalStartTime, finalEndTime);
        }
        break;
      }
      case "drag_existing": {
        const {
          blockId,
          currentMousePosition,
          initialMousePosition,
          totalMovement,
          shouldDuplicate,
        } = finalDragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          break;
        }

        const MOVEMENT_THRESHOLD = 5;
        if (
          totalMovement < MOVEMENT_THRESHOLD &&
          !shouldDuplicate &&
          button === 0
        ) {
          openForTimeBlock(block);
          break;
        }

        const timeAtCurrentPos = positionToTime(
          { x: currentMousePosition.x, y: currentMousePosition.y },
          gridRef,
          true,
        );
        const timeAtInitialPos = positionToTime(
          { x: initialMousePosition.x, y: initialMousePosition.y },
          gridRef,
          true,
        );

        if (!timeAtCurrentPos || !timeAtInitialPos) {
          break;
        }

        const timeDiff =
          timeAtCurrentPos.getTime() - timeAtInitialPos.getTime();

        const originalStartTime = new Date(block.startTime);
        const originalEndTime = new Date(block.endTime);
        const newStart = new Date(originalStartTime.getTime() + timeDiff);
        const newEnd = new Date(originalEndTime.getTime() + timeDiff);

        if (shouldDuplicate) {
          duplicateBlock(blockId, newStart, newEnd);
        } else {
          moveBlock(blockId, newStart, newEnd);
        }
        break;
      }
      case "resize_block_top":
      case "resize_block_bottom": {
        const {
          blockId,
          initialStartTime,
          initialEndTime,
          currentMousePosition,
        } = finalDragState;
        const block = timeBlocks?.find((b) => b.id === blockId);
        if (!block) {
          break;
        }

        const finalTime = positionToTime(
          { x: currentMousePosition.x, y: currentMousePosition.y },
          gridRef,
          true,
        );

        if (!finalTime) {
          break;
        }

        const originalDayOffset = differenceInDays(initialStartTime, weekStart);

        const newTimeOnOriginalDay = addDays(weekStart, originalDayOffset);
        newTimeOnOriginalDay.setHours(
          finalTime.getHours(),
          finalTime.getMinutes(),
          0,
          0,
        );

        let newStart = new Date(initialStartTime);
        let newEnd = new Date(initialEndTime);

        if (finalDragState.type === "resize_block_top") {
          newStart = newTimeOnOriginalDay;
        } else {
          newEnd = newTimeOnOriginalDay;
        }

        // Swap if end time is before start time
        if (newEnd.getTime() < newStart.getTime()) {
          [newStart, newEnd] = [newEnd, newStart];
        }

        // Prevent resize if duration becomes zero or negative after potential swap
        if (newEnd.getTime() <= newStart.getTime()) {
          break;
        }

        resizeBlock(blockId, newStart, newEnd);
        break;
      }
    }
  };

  const handleBlockDragStart = (
    blockId: string,
    offset: { x: number; y: number },
    e: React.MouseEvent,
  ) => {
    const block = timeBlocks.find((b) => b.id === blockId);
    if (!block) {
      return;
    }
    startExisting({
      blockId,
      initialStartTime: new Date(block.startTime),
      initialEndTime: new Date(block.endTime),
      startOffset: offset,
      initialMousePosition: { x: e.clientX, y: e.clientY },
      isControlPressed: !!isControlPressed,
    });
  };

  const handleBlockResizeStart = (
    blockId: string,
    edge: "top" | "bottom",
    startTime: Date,
    endTime: Date,
    e: React.MouseEvent,
  ) => {
    startResize({
      blockId,
      edge,
      initialStartTime: startTime,
      initialEndTime: endTime,
      initialMousePosition: { x: e.clientX, y: e.clientY },
    });
  };

  // Add effect to prevent text selection during drag
  useEffect(() => {
    const isDragging = dragState.type !== "idle";
    document.body.style.userSelect = isDragging ? "none" : "";
    document.body.style.cursor = isDragging ? "grabbing" : ""; // Optional: general grabbing cursor

    // Cleanup function to reset styles if component unmounts mid-drag
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragState.type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dragState.type !== "idle") {
        cancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dragState.type, cancel]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleBlockDragStart,
    handleBlockResizeStart,
    dragState,
    isControlPressed: isControlPressed,
    mousePosition,
  };
}
