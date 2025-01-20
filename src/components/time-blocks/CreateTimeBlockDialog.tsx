import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { DateInput } from "~/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

interface CreateTimeBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  position?: { x: number; y: number };
}

export function CreateTimeBlockDialog({
  isOpen,
  onClose,
  workspaceId,
  startTime,
  endTime,
  dayOfWeek,
  position,
}: CreateTimeBlockDialogProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default blue color
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(startTime);
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(endTime);
  const [startTimeStr, setStartTimeStr] = useState(format(startTime, "HH:mm"));
  const [endTimeStr, setEndTimeStr] = useState(format(endTime, "HH:mm"));

  const createTimeBlock = api.timeBlock.create.useMutation({
    onSuccess: () => {
      onClose();
      setTitle("");
    },
  });

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

    createTimeBlock.mutate({
      workspaceId,
      title: title || "Untitled Block",
      startTime: finalStartTime,
      endTime: finalEndTime,
      dayOfWeek,
      color,
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
      <DialogContent style={dialogStyle}>
        <DialogHeader>
          <DialogTitle>Create Time Block</DialogTitle>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
