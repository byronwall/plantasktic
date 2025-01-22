"use client";

import { UTCDate } from "@date-fns/utc";
import { addDays, endOfMonth, endOfWeek } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import React, { useEffect, useRef } from "react";

import { cn } from "~/lib/utils";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
  classNamePopoverContent?: string;
  minimal?: boolean;
  iconClassName?: string;
  showQuickButtons?: boolean;
}

interface DateParts {
  day: number;
  month: number;
  year: number;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className,
  classNamePopoverContent,
  minimal = false,
  iconClassName,
  showQuickButtons = true,
}) => {
  const [date, setDate] = React.useState<DateParts | undefined>(() => {
    if (!value) {
      return undefined;
    }

    const d = new UTCDate(value);
    return {
      day: d.getDate(),
      month: d.getMonth() + 1, // JavaScript months are 0-indexed
      year: d.getFullYear(),
    };
  });

  const monthRef = useRef<HTMLInputElement | null>(null);
  const dayRef = useRef<HTMLInputElement | null>(null);
  const yearRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!value) {
      setDate(undefined);
      return;
    }
    const d = new UTCDate(value);
    setDate({
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }, [value]);

  const validateDate = (field: keyof DateParts, value: number): boolean => {
    if (
      (field === "day" && (value < 1 || value > 31)) ||
      (field === "month" && (value < 1 || value > 12)) ||
      (field === "year" && (value < 1000 || value > 9999))
    ) {
      return false;
    }

    if (date === undefined) {
      return false;
    }

    // Validate the day of the month
    const newDate = { ...date, [field]: value };

    const d = new UTCDate(newDate.year, newDate.month - 1, newDate.day);
    return (
      d.getFullYear() === newDate.year &&
      d.getMonth() + 1 === newDate.month &&
      d.getDate() === newDate.day
    );
  };

  const handleInputChange =
    (field: keyof DateParts) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value ? Number(e.target.value) : "";
      const isValid =
        typeof newValue === "number" && validateDate(field, newValue);

      if (date === undefined) {
        return;
      }

      // If the new value is valid, update the date
      const newDate = { ...date, [field]: newValue };
      setDate(newDate);

      // only call onChange when the entry is valid
      if (isValid) {
        onChange(new UTCDate(newDate.year, newDate.month - 1, newDate.day));
      }
    };

  const initialDate = useRef<DateParts | undefined>(date);

  const handleBlur =
    (field: keyof DateParts) =>
    (e: React.FocusEvent<HTMLInputElement>): void => {
      if (!e.target.value) {
        setDate(initialDate.current);
        return;
      }

      const newValue = Number(e.target.value);
      const isValid = validateDate(field, newValue);

      if (!isValid) {
        setDate(initialDate.current);
      } else {
        // If the new value is valid, update the initial value

        if (!date) {
          return;
        }

        initialDate.current = { ...date, [field]: newValue };
      }
    };

  const handleKeyDown =
    (field: keyof DateParts) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow command (or control) combinations
      if (e.metaKey || e.ctrlKey) {
        return;
      }

      if (!date) {
        return;
      }

      // Prevent non-numeric characters, excluding allowed keys
      if (
        !/^[0-9]$/.test(e.key) &&
        ![
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Delete",
          "Tab",
          "Backspace",
          "Enter",
        ].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        let newDate = { ...date };

        if (field === "day") {
          if (date[field] === new UTCDate(date.year, date.month, 0).getDate()) {
            newDate = { ...newDate, day: 1, month: (date.month % 12) + 1 };
            if (newDate.month === 1) {
              newDate.year += 1;
            }
          } else {
            newDate.day += 1;
          }
        }

        if (field === "month") {
          if (date[field] === 12) {
            newDate = { ...newDate, month: 1, year: date.year + 1 };
          } else {
            newDate.month += 1;
          }
        }

        if (field === "year") {
          newDate.year += 1;
        }

        setDate(newDate);
        onChange(new UTCDate(newDate.year, newDate.month - 1, newDate.day));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        let newDate = { ...date };

        if (field === "day") {
          if (date[field] === 1) {
            newDate.month -= 1;
            if (newDate.month === 0) {
              newDate.month = 12;
              newDate.year -= 1;
            }
            newDate.day = new UTCDate(newDate.year, newDate.month, 0).getDate();
          } else {
            newDate.day -= 1;
          }
        }

        if (field === "month") {
          if (date[field] === 1) {
            newDate = { ...newDate, month: 12, year: date.year - 1 };
          } else {
            newDate.month -= 1;
          }
        }

        if (field === "year") {
          newDate.year -= 1;
        }

        setDate(newDate);
        onChange(new UTCDate(newDate.year, newDate.month - 1, newDate.day));
      }

      if (e.key === "ArrowRight") {
        if (
          e.currentTarget.selectionStart === e.currentTarget.value.length ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (field === "month") {
            dayRef.current?.focus();
          }
          if (field === "day") {
            yearRef.current?.focus();
          }
        }
      } else if (e.key === "ArrowLeft") {
        if (
          e.currentTarget.selectionStart === 0 ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (field === "day") {
            monthRef.current?.focus();
          }
          if (field === "year") {
            dayRef.current?.focus();
          }
        }
      }
    };

  const handleQuickSelect = (
    type: "today" | "tomorrow" | "endWeek" | "endMonth",
  ) => {
    const today = new UTCDate();
    let newDate: Date;

    switch (type) {
      case "today":
        newDate = today;
        break;
      case "tomorrow":
        newDate = addDays(today, 1);
        break;
      case "endWeek":
        newDate = endOfWeek(today);
        break;
      case "endMonth":
        newDate = endOfMonth(today);
        break;
      default:
        return;
    }

    onChange(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {value ? (
          <Button variant={"ghost"} className="border-none">
            <span className={cn("cursor-pointer text-base", className)}>
              {new UTCDate(value).toLocaleDateString()}
            </span>
          </Button>
        ) : (
          <Button variant={"outline"} className={cn("w-9 p-0", iconClassName)}>
            <CalendarIcon className="m-auto h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto border bg-white p-0", classNamePopoverContent)}
        align="center"
      >
        <div className="flex border border-black p-1 shadow-lg">
          <div className="border-r p-1">
            <div className="mb-3 flex items-center justify-center gap-1 rounded-lg border px-1">
              <Input
                ref={monthRef}
                max={12}
                maxLength={2}
                value={date?.month.toString() ?? ""}
                onChange={handleInputChange("month")}
                onKeyDown={handleKeyDown("month")}
                onFocus={(e) => {
                  if (window.innerWidth > 1024) {
                    e.target.select();
                  }
                }}
                onBlur={handleBlur("month")}
                className="w-6 border-none p-0 text-center outline-none"
                placeholder="M"
              />
              <span className="-mx-px opacity-20">/</span>
              <Input
                ref={dayRef}
                max={31}
                maxLength={2}
                value={date?.day.toString() ?? ""}
                onChange={handleInputChange("day")}
                onKeyDown={handleKeyDown("day")}
                onFocus={(e) => {
                  if (window.innerWidth > 1024) {
                    e.target.select();
                  }
                }}
                onBlur={handleBlur("day")}
                className="w-7 border-none p-0 text-center outline-none"
                placeholder="D"
              />
              <span className="-mx-px opacity-20">/</span>
              <Input
                ref={yearRef}
                max={9999}
                maxLength={4}
                value={date?.year.toString() ?? ""}
                onChange={handleInputChange("year")}
                onKeyDown={handleKeyDown("year")}
                onFocus={(e) => {
                  if (window.innerWidth > 1024) {
                    e.target.select();
                  }
                }}
                onBlur={handleBlur("year")}
                className="w-12 border-none p-0 text-center outline-none"
                placeholder="YYYY"
              />
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100"
                  onClick={() => onChange(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {showQuickButtons && (
              <div className="grid grid-cols-1 gap-1 px-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("today")}
                  className="h-8"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("tomorrow")}
                  className="h-8"
                >
                  Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("endWeek")}
                  className="h-8"
                >
                  End of Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("endMonth")}
                  className="h-8"
                >
                  End of Month
                </Button>
              </div>
            )}
          </div>
          <div className="p-1">
            <Calendar
              key={value?.toISOString()}
              mode="single"
              selected={value}
              defaultMonth={value}
              onSelect={(date) => {
                onChange(date);
              }}
              disabled={(date) => date < new UTCDate("1900-01-01")}
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

DateInput.displayName = "DateInput";

export { DateInput };
