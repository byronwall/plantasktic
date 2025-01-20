import { format } from "date-fns";
import { Check, Plus, Trash, X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { DateInput } from "~/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";

import { ScrollArea } from "../ui/scroll-area";

import type { Task, TimeBlock } from "@prisma/client";

interface EditTimeBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timeBlock: TimeBlock;
  position?: { x: number; y: number };
}

export function EditTimeBlockDialog({
  isOpen,
  onClose,
  timeBlock,
  position,
}: EditTimeBlockDialogProps) {
  const [title, setTitle] = useState(timeBlock.title || "");
  const [color, setColor] = useState(timeBlock.color || "#3b82f6");
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(
    timeBlock.startTime,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(
    timeBlock.endTime,
  );
  const [startTimeStr, setStartTimeStr] = useState(
    format(timeBlock.startTime, "HH:mm"),
  );
  const [endTimeStr, setEndTimeStr] = useState(
    format(timeBlock.endTime, "HH:mm"),
  );
  const [isTaskSearchOpen, setIsTaskSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Query for assigned tasks
  const { data: assignedTasks } = api.timeBlock.getAssignedTasks.useQuery({
    timeBlockId: timeBlock.id,
  });

  // Query for searching tasks
  const { data: searchResults } = api.task.search.useQuery(
    {
      query: searchQuery,
      workspaceId: timeBlock.workspaceId,
    },
    {
      enabled: isTaskSearchOpen && searchQuery.length > 0,
    },
  );

  const updateTimeBlock = api.timeBlock.update.useMutation();

  const deleteTimeBlock = api.timeBlock.delete.useMutation();

  const assignTask = api.timeBlock.assignTask.useMutation();

  const unassignTask = api.timeBlock.unassignTask.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time
    const [startHours = 0, startMinutes = 0] = startTimeStr
      .split(":")
      .map(Number);
    const [endHours = 0, endMinutes = 0] = endTimeStr.split(":").map(Number);

    const finalStartTime = new Date(selectedStartDate);
    finalStartTime.setHours(startHours, startMinutes);

    const finalEndTime = new Date(selectedEndDate);
    finalEndTime.setHours(endHours, endMinutes);

    updateTimeBlock.mutate({
      id: timeBlock.id,
      title: title || "Untitled Block",
      startTime: finalStartTime,
      endTime: finalEndTime,
      dayOfWeek: finalStartTime.getDay(),
      color,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this time block?")) {
      deleteTimeBlock.mutate({ id: timeBlock.id });
    }
  };

  const handleTaskSelect = (task: Task) => {
    assignTask.mutate({
      timeBlockId: timeBlock.id,
      taskId: task.task_id,
    });
    setIsTaskSearchOpen(false);
    setSearchQuery("");
  };

  const handleTaskUnassign = (taskId: number) => {
    unassignTask.mutate({
      timeBlockId: timeBlock.id,
      taskId,
    });
  };

  const dialogStyle = position
    ? {
        position: "absolute" as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent style={dialogStyle} className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Time Block</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Block title"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start</label>
                <div className="flex gap-2">
                  <DateInput
                    value={selectedStartDate}
                    onChange={(date) => date && setSelectedStartDate(date)}
                  />
                  <Input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End</label>
                <div className="flex gap-2">
                  <DateInput
                    value={selectedEndDate}
                    onChange={(date) => date && setSelectedEndDate(date)}
                  />
                  <Input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
            <div>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Assigned Tasks</label>
                <Popover
                  open={isTaskSearchOpen}
                  onOpenChange={setIsTaskSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="right" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandEmpty>No tasks found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          {searchResults?.map((task) => (
                            <CommandItem
                              key={task.task_id}
                              value={task.title}
                              onSelect={() => handleTaskSelect(task)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  assignedTasks?.some(
                                    (t) => t.task_id === task.task_id,
                                  )
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {task.title}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <ScrollArea className="h-[100px] rounded-md border p-2">
                {assignedTasks?.map((task) => (
                  <div
                    key={task.task_id}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{task.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTaskUnassign(task.task_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!assignedTasks || assignedTasks.length === 0) && (
                  <div className="py-1 text-sm text-muted-foreground">
                    No tasks assigned
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              <Check className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
