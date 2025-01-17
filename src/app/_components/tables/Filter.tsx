"use client";

import { useMemo } from "react";

import { ComboBox } from "../ComboBox";
import { DateRangePicker } from "../DateRangePicker";
import { DebouncedInput } from "../DebouncedInput";

import type { Column, Table } from "@tanstack/react-table";

export function Filter<T>({
  column,
  table,
}: {
  column: Column<T, any>;
  table: Table<T>;
}) {
  const allColValues = table
    .getPreFilteredRowModel()
    .flatRows.map((row) => row.getValue(column.id));

  const columnFilterValue = column.getFilterValue();
  const [minValue, maxValue] = column.getFacetedMinMaxValues() ?? [];

  const isNumberColumn = allColValues.every(
    (v) => typeof v === "number" || v === null || v === undefined,
  );

  const colHasDates = allColValues.some((v) => v instanceof Date);

  const isStringColumn = allColValues.every(
    (v) => typeof v === "string" || v === null || v === undefined,
  );

  const sortedUniqueValues = useMemo(
    () =>
      isStringColumn
        ? Array.from(column.getFacetedUniqueValues().keys())
            .filter((value): value is string => typeof value === "string")
            .sort()
        : [],
    [column.getFacetedUniqueValues(), isStringColumn],
  );

  const MAX_UNIQUE_VALUES_FOR_COMBO = 8;
  const MAX_TEXT_LENGTH_FOR_COMBO = 12;

  const areAllNull = allColValues.every((v) => v === null || v === undefined);
  // if all are null, set the filter to null
  if (areAllNull) {
    return null;
  }

  if (colHasDates) {
    const [filterMin, filterMax] = (columnFilterValue as [Date, Date]) ?? [];

    return (
      <div>
        <DateRangePicker
          startDate={filterMin}
          endDate={filterMax}
          onChange={(start, end) => {
            const newRange =
              !start && !end ? undefined : [start ?? null, end ?? null];
            column.setFilterValue(newRange);
          }}
        />
      </div>
    );
  }

  if (isNumberColumn) {
    const [filterMin, filterMax] = (columnFilterValue as [number, number]) ?? [
      null,
      null,
    ];

    const minPlaceholder = `Min ${minValue ? `(${Math.floor(minValue)})` : ""}`;
    const maxPlaceholder = `Max ${maxValue ? `(${Math.ceil(maxValue)})` : ""}`;

    return (
      <div>
        <div className="flex flex-col">
          <DebouncedInput
            type="number"
            min={minValue}
            max={maxValue}
            value={filterMin}
            onChange={(value) =>
              column.setFilterValue((old: [number, number]) => {
                const num =
                  value === undefined || value === "" || value === null
                    ? undefined
                    : Number(value);
                // only if different
                if (num === old?.[0]) {
                  return old;
                }
                const newEnd = old?.[1] ?? null;

                // if both are null, return null
                if (num === null && newEnd === null) {
                  return null;
                }

                return [num, newEnd];
              })
            }
            placeholder={minPlaceholder}
            className="rounded border shadow"
          />
          <DebouncedInput
            type="number"
            min={minValue}
            max={maxValue}
            value={filterMax}
            onChange={(value) =>
              column.setFilterValue((old: [number, number]) => {
                const num =
                  value === undefined || value === "" || value === null
                    ? undefined
                    : Number(value);
                // only if different
                if (num === old?.[1]) {
                  return old;
                }
                const newStart = old?.[0] ?? null;

                // if both are null, return null
                if (newStart === null && num === null) {
                  return null;
                }

                return [newStart, num];
              })
            }
            placeholder={maxPlaceholder}
            className="rounded border shadow"
          />
        </div>
      </div>
    );
  }

  const shouldUseComboBox =
    isStringColumn &&
    sortedUniqueValues.length <= MAX_UNIQUE_VALUES_FOR_COMBO &&
    sortedUniqueValues.every(
      (value) => value.length <= MAX_TEXT_LENGTH_FOR_COMBO,
    );

  if (shouldUseComboBox) {
    return (
      <>
        <ComboBox
          onChange={(value) => column.setFilterValue(value)}
          value={columnFilterValue as string}
          options={sortedUniqueValues}
          allowClear
        />
        <div className="h-1" />
      </>
    );
  }

  return (
    <>
      <DebouncedInput
        value={columnFilterValue ?? ""}
        onChange={(value) => column.setFilterValue(value)}
        placeholder="Filter..."
        className="rounded border text-sm shadow"
      />
      <div className="h-1" />
    </>
  );
}
