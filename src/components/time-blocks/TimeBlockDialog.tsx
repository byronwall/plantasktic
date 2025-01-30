"use client";

import { format } from "date-fns";
import { Check, Link, Lock, Plus, Search, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";

interface TimeBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  startTime: Date;
  endTime: Date;
  timeBlockId?: string;
  position?: { x: number; y: number };
}

const generateRandomHslColor = () => {
  const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
  return `hsl(${hue}, 70%, 50%)`; // Fixed saturation and lightness for consistency
};

export function TimeBlockDialog({
  isOpen,
  onClose,
  workspaceId,
  startTime,
  endTime,
  timeBlockId,
  position,
}: TimeBlockDialogProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(generateRandomHslColor());
  const [isFixedTime, setIsFixedTime] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(startTime);
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(endTime);
  const [startTimeStr, setStartTimeStr] = useState(format(startTime, "HH:mm"));
  const [endTimeStr, setEndTimeStr] = useState(format(endTime, "HH:mm"));
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Query for tasks
  const { data: tasks } = api.task.getTasks.useQuery({
    showCompleted: false,
    workspaceId,
  });

  // Query for existing time block if editing
  const { data: timeBlock } = api.timeBlock.getById.useQuery(
    { id: timeBlockId || "" },
    { enabled: !!timeBlockId },
  );

  // Query for assigned tasks if editing
  const { data: assignedTasks } = api.timeBlock.getAssignedTasks.useQuery(
    { timeBlockId: timeBlockId || "" },
    { enabled: !!timeBlockId },
  );

  // Mutations
  const createTimeBlock = api.timeBlock.create.useMutation();
  const updateTimeBlock = api.timeBlock.update.useMutation();
  const deleteTimeBlock = api.timeBlock.delete.useMutation();
  const assignTask = api.timeBlock.assignTask.useMutation();
  const unassignTask = api.timeBlock.unassignTask.useMutation();

  // Initialize form with existing data if editing
  useEffect(() => {
    if (timeBlock) {
      setTitle(timeBlock.title || "");
      setColor(timeBlock.color || generateRandomHslColor());
      setIsFixedTime(timeBlock.isFixedTime || false);
      setSelectedStartDate(timeBlock.startTime);
      setSelectedEndDate(timeBlock.endTime);
      setStartTimeStr(format(timeBlock.startTime, "HH:mm"));
      setEndTimeStr(format(timeBlock.endTime, "HH:mm"));
    }
  }, [timeBlock]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (timeBlockId) {
      // Update existing time block
      await updateTimeBlock.mutateAsync({
        id: timeBlockId,
        title: title || "Untitled Block",
        startTime: finalStartTime,
        endTime: finalEndTime,
        color,
        isFixedTime,
      });
    } else {
      // Create new time block
      const newTimeBlock = await createTimeBlock.mutateAsync({
        workspaceId,
        title: title || "Untitled Block",
        startTime: finalStartTime,
        endTime: finalEndTime,
        color,
        isFixedTime,
      });

      if (selectedTaskId) {
        await assignTask.mutateAsync({
          timeBlockId: newTimeBlock.id,
          taskId: selectedTaskId,
        });
      }
    }

    onClose();
    setTitle("");
    setSelectedTaskId(null);
    setSelectedTaskTitle("");
  };

  const handleDelete = () => {
    if (!timeBlockId) {
      return;
    }

    if (confirm("Are you sure you want to delete this time block?")) {
      deleteTimeBlock.mutate({ id: timeBlockId });
      onClose();
    }
  };

  const handleTaskSelect = (taskId: number, taskTitle: string) => {
    if (timeBlockId) {
      assignTask.mutate({
        timeBlockId,
        taskId,
      });
    } else {
      setSelectedTaskId(taskId);
      setSelectedTaskTitle(taskTitle);
    }
    setIsSearchOpen(false);
  };

  const handleTaskUnassign = async (taskId: number) => {
    if (!timeBlockId) {
      return;
    }

    await unassignTask.mutateAsync({
      timeBlockId,
      taskId,
    });
  };

  const clearSelectedTask = () => {
    setSelectedTaskId(null);
    setSelectedTaskTitle("");
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
      <DialogContent style={dialogStyle}>
        <DialogHeader>
          <DialogTitle>
            {timeBlockId ? "Edit" : "Create"} Time Block
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Block Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Block title"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="fixed-time"
                checked={isFixedTime}
                onCheckedChange={setIsFixedTime}
              />
              <Label htmlFor="fixed-time" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Fixed Time Block
              </Label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link Task</label>
              {timeBlockId ? (
                // Show assigned tasks list when editing
                <div className="space-y-2">
                  {assignedTasks?.map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{task.title}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTaskUnassign(task.task_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="relative">
                    <Input
                      placeholder="Search tasks..."
                      onFocus={() => setIsSearchOpen(true)}
                      readOnly
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Show single task selection when creating
                <>
                  {selectedTaskId ? (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">
                        {selectedTaskTitle}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSelectedTask}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Search tasks..."
                        onFocus={() => setIsSearchOpen(true)}
                        value={selectedTaskTitle}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setIsSearchOpen(true)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
              {isSearchOpen && (
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search tasks..." />
                  <CommandList>
                    <CommandEmpty>No tasks found.</CommandEmpty>
                    <CommandGroup>
                      {tasks?.map((task) => (
                        <CommandItem
                          key={task.task_id}
                          onSelect={() =>
                            handleTaskSelect(task.task_id, task.title)
                          }
                        >
                          {task.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
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
              <label className="text-sm font-medium">Color</label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={/hsl\((\d+)/.exec(color)?.[1] ?? "0"}
                  onChange={(e) => setColor(`hsl(${e.target.value}, 70%, 50%)`)}
                  className="h-2 w-full appearance-none rounded-lg [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-lg [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:shadow-md"
                  style={{
                    background: `linear-gradient(to right,
                      hsl(0, 70%, 50%),
                      hsl(60, 70%, 50%),
                      hsl(120, 70%, 50%),
                      hsl(180, 70%, 50%),
                      hsl(240, 70%, 50%),
                      hsl(300, 70%, 50%),
                      hsl(360, 70%, 50%))`,
                  }}
                />
                <div
                  className="h-8 w-16 rounded-md border shadow-sm"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            {timeBlockId && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="mr-auto"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              {timeBlockId ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
