"use client";

import { type TimeBlock, type TimeBlockWithPosition } from "./WeeklyCalendar";

export const getOverlappingGroups = (
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
export const doBlocksOverlap = (block1: TimeBlock, block2: TimeBlock) => {
  const start1 = new Date(block1.startTime);
  const end1 = new Date(block1.endTime);
  const start2 = new Date(block2.startTime);
  const end2 = new Date(block2.endTime);

  return start1 < end2 && start2 < end1;
};
