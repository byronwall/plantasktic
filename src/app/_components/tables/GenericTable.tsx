"use client";

import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

import { Filter } from "./Filter";
import { fuzzyFilter } from "./fuzzyFilter";

import { DebouncedInput } from "../DebouncedInput";

import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";

// declare module "@tanstack/table-core" {
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>;
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo;
//   }
// }

export type GenericTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, string | number | Date>[];

  onFilteredDataChange?: (data: T[]) => void;

  shouldHideGLobalFilter?: boolean;

  initialPageSize?: number;

  className?: string;
};

export function GenericTable<T>({
  data,
  columns,
  onFilteredDataChange,
  shouldHideGLobalFilter = false,
  initialPageSize = 30,
  className,
}: GenericTableProps<T>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
    },

    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },

    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  const filteredRows = table.getRowModel().rows;

  useEffect(() => {
    onFilteredDataChange?.(filteredRows.map((r) => r.original));
  }, [filteredRows, onFilteredDataChange]);

  return (
    <div className={className}>
      {!shouldHideGLobalFilter && (
        <div className="flex w-80 items-center gap-1">
          <DebouncedInput
            value={globalFilter ?? ""}
            onChange={(value) => setGlobalFilter(String(value))}
            className="font-lg border-block border p-2 shadow"
            placeholder="Search all columns..."
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setGlobalFilter("")}
          >
            clear
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn("flex items-center gap-1", {
                          "cursor-pointer select-none":
                            header.column.getCanSort(),
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <ChevronUp />,
                          desc: <ChevronDown />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                      {header.column.getCanFilter() ? (
                        <Filter column={header.column} table={table} />
                      ) : null}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {filteredRows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </Button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <Input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="w-16 rounded border p-1"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50, 200, 400, 800].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
        <div>{table.getPrePaginationRowModel().rows.length} Rows</div>
      </div>
    </div>
  );
}
