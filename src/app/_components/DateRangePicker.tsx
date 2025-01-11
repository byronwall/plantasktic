"use client";

import { useCallback } from "react";

import { DateInput } from "~/components/ui/date-input";

type DateRangePickerProps = {
  startDate?: Date;
  endDate?: Date;
  onChange: (startDate?: Date, endDate?: Date) => void;
  shouldAllowClear?: boolean;
};

export function DateRangePicker(props: DateRangePickerProps) {
  const { startDate, endDate, onChange, shouldAllowClear } = props;

  const handleStartChange = useCallback(
    (newStart: Date | undefined) => {
      onChange(newStart, endDate);
    },
    [endDate, onChange]
  );

  const handleEndChange = useCallback(
    (newEnd: Date | undefined) => {
      onChange(startDate, newEnd);
    },
    [startDate, onChange]
  );

  return (
    <div className="flex flex-col space-y-1">
      <DateInput
        value={startDate}
        onChange={handleStartChange}
        className=""
        shouldAllowClear={shouldAllowClear}
      />
      <DateInput
        value={endDate}
        onChange={handleEndChange}
        className=""
        shouldAllowClear={shouldAllowClear}
      />
    </div>
  );
}
