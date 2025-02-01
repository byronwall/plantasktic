import { create } from "zustand";

import type { TimeBlock } from "~/components/time-blocks/WeeklyCalendar";

type TimeBlockDialogState = {
  isOpen: boolean;
  selectedTimeBlock: TimeBlock | null;
  newBlockStart: Date | null;
  newBlockEnd: Date | null;

  openForTimeBlock: (timeBlock: TimeBlock) => void;
  openForNewBlock: (startTime: Date, endTime: Date) => void;
  close: () => void;
};

export const useTimeBlockDialogStore = create<TimeBlockDialogState>((set) => ({
  isOpen: false,

  selectedTimeBlock: null,

  newBlockStart: null,
  newBlockEnd: null,

  openForTimeBlock: (timeBlock) =>
    set({
      isOpen: true,
      selectedTimeBlock: timeBlock,
      newBlockStart: null,
      newBlockEnd: null,
    }),
  openForNewBlock: (startTime, endTime) =>
    set({
      isOpen: true,
      selectedTimeBlock: null,
      newBlockStart: startTime,
      newBlockEnd: endTime,
    }),
  close: () =>
    set({
      isOpen: false,
      selectedTimeBlock: null,
      newBlockStart: null,
      newBlockEnd: null,
    }),
}));
