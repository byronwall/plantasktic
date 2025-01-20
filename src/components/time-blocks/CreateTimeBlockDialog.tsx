import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
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

  const createTimeBlock = api.timeBlock.create.useMutation({
    onSuccess: () => {
      onClose();
      setTitle("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTimeBlock.mutate({
      workspaceId,
      title: title || "Untitled Block",
      startTime,
      endTime,
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
