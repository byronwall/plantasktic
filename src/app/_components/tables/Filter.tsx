"use client";

import React from "react";

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
    .getPreSortedRowModel()
    .flatRows.map((row) => row.getValue(column.id));

  const columnFilterValue = column.getFilterValue();
  const [minValue, maxValue] = column.getFacetedMinMaxValues() ?? [];

  const isNumberColumn = allColValues.every(
    (v) => typeof v === "number" || v === null || v === undefined,
  );

  const isDateColumn = allColValues.every(
    (v) => v instanceof Date || v === null || v === undefined,
  );

  const sortedUniqueValues = React.useMemo(
    () =>
      !isNumberColumn
        ? Array.from(
            column.getFacetedUniqueValues().keys() as unknown as string[],
          ).sort()
        : [],
    [column.getFacetedUniqueValues(), isNumberColumn],
  );

  // if all are null, set the filter to null
  if (allColValues.every((v) => v === null)) {
    return null;
  }

  if (isDateColumn) {
    const [filterMin, filterMax] = (columnFilterValue as [Date, Date]) ?? [];

    return (
      <div>
        <DateRangePicker
          startDate={filterMin}
          endDate={filterMax}
          onChange={(start, end) => column.setFilterValue([start, end])}
        />
      </div>
    );
  }

  if (isNumberColumn) {
    const [filterMin, filterMax] =
      (columnFilterValue as [number, number]) ?? [];
    const minPlaceholder = `Min ${minValue ? `(${Math.floor(minValue)})` : ""}`;
    const maxPlaceholder = `Max ${maxValue ? `(${Math.ceil(maxValue)})` : ""}`;

    return (
      <div>
        <div className="flex flex-col">
          <DebouncedInput
            min={Number(minValue ?? "")}
            max={Number(maxValue ?? "")}
            value={filterMin ?? ""}
            onChange={(value) =>
              column.setFilterValue((old: [number, number]) => [
                value,
                old?.[1],
              ])
            }
            placeholder={minPlaceholder}
            className="rounded border shadow"
          />
          <DebouncedInput
            min={Number(minValue ?? "")}
            max={Number(maxValue ?? "")}
            value={filterMax ?? ""}
            onChange={(value) =>
              column.setFilterValue((old: [number, number]) => [
                old?.[0],
                value,
              ])
            }
            placeholder={maxPlaceholder}
            className="rounded border shadow"
          />
        </div>
        <div className="h-1" />
      </div>
    );
  }

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
