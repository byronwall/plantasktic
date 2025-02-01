"use client";

export function getTimeFromGridPosition(
  x: number,
  y: number,
  gridRef: React.RefObject<HTMLDivElement>,
  topOffset: number,
  startHour: number,
  endHour: number,
  snapMinutes: number,
  numberOfDays = 7,
  blockHeight = 64,
) {
  if (!gridRef.current) {
    return null;
  }

  const rect = gridRef.current.getBoundingClientRect();
  const scrollY = window.scrollY;

  // Convert page coordinates to relative coordinates
  const relativeX = x - rect.left;
  const relativeY = y - rect.top - scrollY;

  const adjustedY = relativeY - topOffset;

  // Ensure coordinates are within bounds
  if (
    relativeX < 0 ||
    adjustedY < 0 ||
    relativeX > rect.width ||
    adjustedY > rect.height + scrollY
  ) {
    return null;
  }

  const dayWidth = rect.width / numberOfDays;

  // Add 0.5 * dayWidth to center the drag point within the column
  const adjustedX = relativeX;
  const day = Math.max(
    0,
    Math.min(numberOfDays - 1, Math.floor(adjustedX / dayWidth)),
  );
  const rawHour = adjustedY / blockHeight + startHour;
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
}
