"use client";

import { addDays, startOfDay } from "date-fns";
import {
  createContext,
  useContext,
  type ReactNode,
  type RefObject,
} from "react";

// Types
type TimePositionContextProps = {
  startHour: number;
  endHour: number;
  snapMinutes: number;
  numberOfDays: number;
  weekStart: Date;
  blockHeight: number;
  topOffset: number; // Added based on getTimeFromGridPosition
};

type TimePositionUtils = {
  getYPositionFromTime: (time: Date) => number;
  getTimeFromYPosition: (
    y: number,
    snap?: boolean,
  ) => { hour: number; minute: number };
  getDayFromXPosition: (
    x: number,
    gridRef: RefObject<HTMLDivElement>,
  ) => number;
  positionToTime: (
    position: { x: number; y: number },
    gridRef: RefObject<HTMLDivElement>,
    snap?: boolean,
  ) => Date | null;
  isInBounds: (
    position: { x: number; y: number },
    gridRef: RefObject<HTMLDivElement>,
  ) => boolean;
  snapTime: (time: Date) => Date;
};

// Context
const TimePositionContext = createContext<TimePositionContextProps | undefined>(
  undefined,
);

// Provider
export const TimePositionProvider = ({
  children,
  ...props
}: TimePositionContextProps & { children: ReactNode }) => {
  return (
    <TimePositionContext.Provider value={props}>
      {children}
    </TimePositionContext.Provider>
  );
};

// Hook
export const useTimePosition = (): TimePositionUtils => {
  const context = useContext(TimePositionContext);
  if (!context) {
    throw new Error(
      "useTimePosition must be used within a TimePositionProvider",
    );
  }

  const {
    startHour,
    endHour,
    snapMinutes,
    numberOfDays,
    weekStart,
    blockHeight,
    topOffset,
  } = context;

  const getYPositionFromTime = (time: Date): number => {
    const hourDecimal = time.getHours() + time.getMinutes() / 60;
    return (hourDecimal - startHour) * blockHeight + topOffset;
  };

  const getTimeFromYPosition = (
    y: number,
    snap = true,
  ): { hour: number; minute: number } => {
    const adjustedY = y - topOffset;
    const rawHour = adjustedY / blockHeight + startHour;
    const hour = Math.floor(rawHour);

    // Calculate minutes and snap to interval if requested
    const rawMinutes = (rawHour % 1) * 60;
    const snappedMinutes = snap
      ? Math.round(rawMinutes / snapMinutes) * snapMinutes
      : rawMinutes;

    // Adjust hour if minutes wrap around
    const finalHour = snappedMinutes === 60 ? hour + 1 : hour;
    const finalMinutes = snappedMinutes === 60 ? 0 : snappedMinutes;

    return {
      hour: Math.max(startHour, Math.min(endHour, finalHour)),
      minute: Math.max(0, Math.min(59, finalMinutes)),
    };
  };

  const getDayFromXPosition = (
    x: number,
    gridRef: RefObject<HTMLDivElement>,
  ): number => {
    if (!gridRef.current) {
      // Cannot determine day without grid dimensions
      // Return a default or handle this case appropriately upstream
      return 0;
    }
    const el = gridRef.current;
    const rect = el.getBoundingClientRect(); // Keep for rect.left
    const totalWidth = rect.width; // Use rect.width
    const dayWidth = totalWidth / numberOfDays;
    const relativeX = x - rect.left; // Use clientX relative to viewport for consistency

    // Ensure dayWidth is not zero to avoid division by zero
    if (dayWidth <= 0) {
      // Return the first day as a fallback
      return 0;
    }

    // Calculate day, clamping between 0 and numberOfDays - 1
    const day = Math.max(
      0,
      Math.min(numberOfDays - 1, Math.floor(relativeX / dayWidth)),
    );
    return day;
  };

  const isInBounds = (
    position: { x: number; y: number },
    gridRef: RefObject<HTMLDivElement>,
  ): boolean => {
    if (!gridRef.current) {
      return false;
    }
    const el = gridRef.current;
    const rect = el.getBoundingClientRect();

    // Use clientX/clientY as they are relative to viewport
    const clientX = position.x; // Assuming position.x is clientX
    const clientY = position.y; // Assuming position.y is clientY

    // Check bounds using viewport-relative coordinates
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const positionToTime = (
    position: { x: number; y: number },
    gridRef: RefObject<HTMLDivElement>,
    snap = true,
  ): Date | null => {
    if (!gridRef.current) {
      return null;
    }

    const el = gridRef.current;
    const rect = el.getBoundingClientRect(); // Keep for rect.left
    const totalWidth = rect.width; // Use rect.width
    const totalHeight = el.offsetHeight; // Use offsetHeight

    const clientX = position.x; // Assuming position.x is clientX
    const clientY = position.y; // Assuming position.y is clientY

    // Boundary check using viewport-relative coordinates
    // ensure relativeY isn't negative (above the element)
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    // Calculate position relative to the element's top-left corner
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Use getDayFromXPosition (which now also uses rect.width)
    const day = getDayFromXPosition(clientX, gridRef);
    // Use the clamped Y position for time calculation
    const { hour, minute } = getTimeFromYPosition(relativeY, snap);

    const resultDate = addDays(startOfDay(weekStart), day);
    resultDate.setHours(hour, minute, 0, 0);

    return resultDate;
  };

  const snapTime = (time: Date): Date => {
    const minutes = time.getMinutes();
    const snappedMinutes = Math.round(minutes / snapMinutes) * snapMinutes;
    const hourAdjustment = Math.floor(snappedMinutes / 60);
    const finalMinutes = snappedMinutes % 60;

    const snappedDate = new Date(time);
    snappedDate.setHours(
      snappedDate.getHours() + hourAdjustment,
      finalMinutes,
      0,
      0,
    );
    return snappedDate;
  };

  return {
    getYPositionFromTime,
    getTimeFromYPosition,
    getDayFromXPosition,
    positionToTime,
    isInBounds,
    snapTime,
  };
};
