"use client";

import { format } from "date-fns";
import { Link, Lock, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { TaskAvatar } from "~/app/_components/TaskAvatar";
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
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { useTimeBlockDialogStore } from "~/stores/timeBlockDialogStore";
import { useEditTaskStore } from "~/stores/useEditTaskStore";
import { api } from "~/trpc/react";

const generateRandomHslColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
};

export function TimeBlockDialog() {
  const { isOpen, selectedTimeBlock, newBlockStart, newBlockEnd, close } =
    useTimeBlockDialogStore();
  const openEditDialog = useEditTaskStore((state) => state.open);

  const { currentWorkspaceId: workspaceId } = useCurrentProject();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState(generateRandomHslColor());
  const [isFixedTime, setIsFixedTime] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date());
  const [startTimeStr, setStartTimeStr] = useState("00:00");
  const [endTimeStr, setEndTimeStr] = useState("00:00");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Calculate duration in minutes
  const calculateDuration = (start: Date, end: Date) => {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  // Check if a duration matches the current time block
  const isDurationMatch = (minutes: number) => {
    const start = new Date(selectedStartDate);
    start.setHours(
      parseInt(startTimeStr.split(":")[0] || "0"),
      parseInt(startTimeStr.split(":")[1] || "0"),
    );

    const end = new Date(selectedEndDate);
    end.setHours(
      parseInt(endTimeStr.split(":")[0] || "0"),
      parseInt(endTimeStr.split(":")[1] || "0"),
    );

    return calculateDuration(start, end) === minutes;
  };

  // Reset all form state when modal is closed or when switching between edit/create modes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setColor(generateRandomHslColor());
      setIsFixedTime(false);
      setSelectedStartDate(new Date());
      setSelectedEndDate(new Date());
      setStartTimeStr("00:00");
      setEndTimeStr("00:00");
      setSelectedTaskId(null);
      setSelectedTaskTitle("");
      setIsSearchOpen(false);
    }
  }, [isOpen]);

  // Query for tasks
  const { data: tasks } = api.task.getTasks.useQuery({
    showCompleted: false,
    workspaceId,
  });

  // Query for existing time block if editing
  const { data: timeBlock } = api.timeBlock.getById.useQuery(
    { id: selectedTimeBlock?.id || "" },
    { enabled: !!selectedTimeBlock },
  );

  // Query for assigned tasks if editing
  const { data: assignedTasks } = api.timeBlock.getAssignedTasks.useQuery(
    { timeBlockId: selectedTimeBlock?.id || "" },
    { enabled: !!selectedTimeBlock },
  );

  // Mutations
  const createTimeBlock = api.timeBlock.create.useMutation();
  const updateTimeBlock = api.timeBlock.update.useMutation();
  const deleteTimeBlock = api.timeBlock.delete.useMutation();
  const assignTask = api.timeBlock.assignTask.useMutation();
  const unassignTask = api.timeBlock.unassignTask.useMutation();

  // Combine loading states for submit button using isPending
  const isSaving = createTimeBlock.isPending || updateTimeBlock.isPending;
  // Loading state for delete button using isPending
  const isDeleting = deleteTimeBlock.isPending;

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

  // Update state when newBlockStart/newBlockEnd change
  useEffect(() => {
    if (newBlockStart && newBlockEnd) {
      setSelectedStartDate(newBlockStart);
      setSelectedEndDate(newBlockEnd);
      setStartTimeStr(format(newBlockStart, "HH:mm"));
      setEndTimeStr(format(newBlockEnd, "HH:mm"));
    }
  }, [newBlockStart, newBlockEnd]);

  if (!workspaceId || (!selectedTimeBlock && !newBlockStart)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time
    const [startHours = 0, startMinutes = 0] = startTimeStr
      .split(":")
      .map(Number);
    const [endHours = 0, endMinutes = 0] = endTimeStr.split(":").map(Number);

    let finalStartTime = new Date(selectedStartDate);
    finalStartTime.setHours(startHours, startMinutes);

    let finalEndTime = new Date(selectedEndDate);
    finalEndTime.setHours(endHours, endMinutes);

    // Swap if end time is before start time
    if (finalEndTime.getTime() < finalStartTime.getTime()) {
      [finalStartTime, finalEndTime] = [finalEndTime, finalStartTime];
      // Also update the string state if swapped during submission
      setStartTimeStr(format(finalStartTime, "HH:mm"));
      setEndTimeStr(format(finalEndTime, "HH:mm"));
    }

    if (selectedTimeBlock) {
      // Update existing time block
      await updateTimeBlock.mutateAsync({
        id: selectedTimeBlock.id,
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

    close();
    setTitle("");
    setSelectedTaskId(null);
    setSelectedTaskTitle("");
  };

  const handleDelete = () => {
    if (!selectedTimeBlock) {
      return;
    }

    if (confirm("Are you sure you want to delete this time block?")) {
      deleteTimeBlock.mutate({ id: selectedTimeBlock.id });
      close();
    }
  };

  const handleTaskSelect = (taskId: number, taskTitle: string) => {
    if (selectedTimeBlock) {
      assignTask.mutate({
        timeBlockId: selectedTimeBlock.id,
        taskId,
      });
    } else {
      setSelectedTaskId(taskId);
      setSelectedTaskTitle(taskTitle);
    }
    setIsSearchOpen(false);
  };

  const handleTaskUnassign = async (taskId: number) => {
    if (!selectedTimeBlock) {
      return;
    }

    await unassignTask.mutateAsync({
      timeBlockId: selectedTimeBlock.id,
      taskId,
    });
  };

  const clearSelectedTask = () => {
    setSelectedTaskId(null);
    setSelectedTaskTitle("");
  };

  // Function to check and swap time strings on blur
  const handleTimeBlur = () => {
    // Parse current values
    const [startHours = 0, startMinutes = 0] = startTimeStr
      .split(":")
      .map(Number);
    const [endHours = 0, endMinutes = 0] = endTimeStr.split(":").map(Number);

    const tempStartDate = new Date(selectedStartDate);
    tempStartDate.setHours(startHours, startMinutes, 0, 0);

    const tempEndDate = new Date(selectedEndDate);
    tempEndDate.setHours(endHours, endMinutes, 0, 0);

    // Check if dates need swapping (handle multi-day inversion)
    if (tempEndDate.getTime() < tempStartDate.getTime()) {
      // Swap the full dates first
      const newStartDate = tempEndDate;
      const newEndDate = tempStartDate;

      // Update state for both date and time strings
      setSelectedStartDate(newStartDate);
      setSelectedEndDate(newEndDate);
      setStartTimeStr(format(newStartDate, "HH:mm"));
      setEndTimeStr(format(newEndDate, "HH:mm"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedTimeBlock ? "Edit" : "Create"} Time Block
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
              {selectedTimeBlock ? (
                // Show assigned tasks list when editing
                <div className="space-y-2">
                  {assignedTasks?.map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-2"
                    >
                      <div
                        className="flex flex-1 cursor-pointer items-center gap-2"
                        onClick={() => openEditDialog(task.task_id)}
                      >
                        <TaskAvatar task={task} />
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
                    onBlur={handleTimeBlur}
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
                    onBlur={handleTimeBlur}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Duration</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "15m", minutes: 15 },
                  { label: "30m", minutes: 30 },
                  { label: "45m", minutes: 45 },
                  { label: "60m", minutes: 60 },
                  { label: "90m", minutes: 90 },
                  { label: "2h", minutes: 120 },
                  { label: "3h", minutes: 180 },
                  { label: "4h", minutes: 240 },
                ].map(({ label, minutes }) => (
                  <Button
                    key={label}
                    type="button"
                    variant={isDurationMatch(minutes) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newEndDate = new Date(selectedStartDate);
                      newEndDate.setMinutes(newEndDate.getMinutes() + minutes);
                      setSelectedEndDate(newEndDate);
                      setEndTimeStr(format(newEndDate, "HH:mm"));
                    }}
                  >
                    {label}
                  </Button>
                ))}
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
            {selectedTimeBlock && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : selectedTimeBlock
                  ? "Save Changes"
                  : "Create Block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
