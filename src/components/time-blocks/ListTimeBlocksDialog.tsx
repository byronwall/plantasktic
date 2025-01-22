"use client";

import { endOfDay, format, startOfDay } from "date-fns";
import { Edit, Trash } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import type { TimeBlock } from "./WeeklyCalendar";

interface ListTimeBlocksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditBlock: (block: TimeBlock) => void;
  weekStart: Date;
}

export function ListTimeBlocksDialog({
  isOpen,
  onClose,
  onEditBlock,
  weekStart,
}: ListTimeBlocksDialogProps) {
  const { currentWorkspaceId } = useCurrentProject();
  const { data: timeBlocks } = api.timeBlock.getWeeklyBlocks.useQuery({
    weekStart,
    workspaceId: currentWorkspaceId,
  });

  const deleteTimeBlock = api.timeBlock.delete.useMutation();
  const deleteByDateRange = api.timeBlock.deleteByDateRange.useMutation();

  const handleDelete = (blockId: string) => {
    const shouldDelete = confirm(
      "Are you sure you want to delete this time block?",
    );

    if (!shouldDelete) {
      return;
    }

    deleteTimeBlock.mutate({ id: blockId });
  };

  const handleBulkDelete = (date: Date) => {
    if (!currentWorkspaceId) {
      return;
    }

    const shouldDelete = confirm(
      "Are you sure you want to delete all time blocks for this day?",
    );

    if (!shouldDelete) {
      return;
    }

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    deleteByDateRange.mutate({
      startTime: dayStart,
      endTime: dayEnd,
      workspaceId: currentWorkspaceId,
    });
  };

  // Group time blocks by day
  const groupedBlocks = timeBlocks?.reduce<Record<number, TimeBlock[]>>(
    (acc, block) => {
      const day = new Date(block.startTime).getDay();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day]?.push(block);
      return acc;
    },
    {},
  );

  // Sort blocks within each day by start time
  Object.values(groupedBlocks || {}).forEach((blocks) => {
    blocks.sort((a, b) => {
      const aTime = new Date(a.startTime).getTime();
      const bTime = new Date(b.startTime).getTime();
      return aTime - bTime;
    });
  });

  // Get dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Time Blocks</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {weekDates.map((date, index) => {
              const blocks = groupedBlocks?.[index] ?? [];
              if (blocks.length === 0) {
                return null;
              }

              return (
                <div key={date.toISOString()} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {format(date, "EEEE, MMMM d")}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleBulkDelete(date)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                        style={{
                          borderLeftColor: block.color || "#3b82f6",
                          borderLeftWidth: "4px",
                        }}
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {block.title || "Untitled Block"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(block.startTime), "h:mm a")} -{" "}
                            {format(new Date(block.endTime), "h:mm a")}
                          </div>
                          {block.taskAssignments?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                Linked Tasks:
                              </div>
                              <ul className="space-y-1">
                                {block.taskAssignments.map((assignment) => (
                                  <li
                                    key={assignment.task.task_id}
                                    className="text-sm text-muted-foreground"
                                  >
                                    • {assignment.task.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditBlock(block)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(block.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
