"use client";

import {
  addMonths,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { DateInput } from "~/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type ViewMode = "week" | "month" | "year" | "custom";

type MetadataSummaryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  weekStart: Date;
};

export function MetadataSummaryDialog({
  isOpen,
  onClose,
  weekStart,
}: MetadataSummaryDialogProps) {
  const { currentWorkspaceId } = useCurrentProject();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(weekStart);
  const [customStartDate, setCustomStartDate] = useState<Date>(weekStart);
  const [customEndDate, setCustomEndDate] = useState<Date>(
    endOfMonth(weekStart),
  );

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case "week":
        return {
          startDate: selectedDate,
          endDate: endOfMonth(selectedDate),
        };
      case "month":
        return {
          startDate: startOfMonth(selectedDate),
          endDate: endOfMonth(selectedDate),
        };
      case "year":
        return {
          startDate: startOfYear(selectedDate),
          endDate: endOfYear(selectedDate),
        };
      case "custom":
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
    }
  };

  const { startDate, endDate } = getDateRange();

  const { data: metadata = [] } = api.timeBlock.getDateRangeMetadata.useQuery(
    {
      workspaceId: currentWorkspaceId || "",
      startDate,
      endDate,
    },
    {
      enabled: !!currentWorkspaceId && isOpen,
    },
  );

  // Get unique keys for column headers
  const uniqueKeys = Array.from(
    new Set(metadata.map((item) => item.key)),
  ).sort();

  // Group metadata by date
  const metadataByDate = metadata.reduce(
    (acc, item) => {
      const dateKey = format(item.date, "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
      acc[dateKey][item.key] = item.value;
      return acc;
    },
    {} as Record<string, Record<string, string>>,
  );

  // Get unique dates for rows
  const uniqueDates = Array.from(
    new Set(metadata.map((item) => format(item.date, "yyyy-MM-dd"))),
  ).sort();

  const handlePrevious = () => {
    setSelectedDate((prev) => {
      switch (viewMode) {
        case "week":
        case "month":
          return subMonths(prev, 1);
        case "year":
          return new Date(prev.getFullYear() - 1, 0, 1);
        default:
          return prev;
      }
    });
  };

  const handleNext = () => {
    setSelectedDate((prev) => {
      switch (viewMode) {
        case "week":
        case "month":
          return addMonths(prev, 1);
        case "year":
          return new Date(prev.getFullYear() + 1, 0, 1);
        default:
          return prev;
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Metadata Summary</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {format(startDate, "MMM d, yyyy")} -{" "}
            {format(endDate, "MMM d, yyyy")}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
              >
                Month
              </Button>
              <Button
                variant={viewMode === "year" ? "default" : "outline"}
                onClick={() => setViewMode("year")}
              >
                Year
              </Button>
              <Button
                variant={viewMode === "custom" ? "default" : "outline"}
                onClick={() => setViewMode("custom")}
              >
                Custom
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === "custom" ? (
                <>
                  <DateInput
                    value={customStartDate}
                    onChange={(date) => date && setCustomStartDate(date)}
                  />
                  <span>to</span>
                  <DateInput
                    value={customEndDate}
                    onChange={(date) => date && setCustomEndDate(date)}
                  />
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handlePrevious}>
                    <ChevronLeft />
                  </Button>
                  <DateInput
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                  />
                  <Button variant="outline" onClick={handleNext}>
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {uniqueKeys.map((key) => (
                      <th key={key} className="p-2 text-left font-medium">
                        {key}
                      </th>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueDates.map((dateKey) => (
                    <TableRow key={dateKey} className="border-b">
                      <td className="p-2">
                        {format(new Date(dateKey), "MMM d, yyyy")}
                      </td>
                      {uniqueKeys.map((key) => (
                        <td key={key} className="p-2">
                          {metadataByDate[dateKey]?.[key] || "-"}
                        </td>
                      ))}
                    </TableRow>
                  ))}
                  {metadata.length === 0 && (
                    <TableRow>
                      <td colSpan={uniqueKeys.length + 1} className="p-2">
                        No data found
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
