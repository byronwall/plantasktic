"use client";

import { type Task } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";

import { TaskAvatar } from "./TaskAvatar";

interface TaskListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  title: string;
}

export function TaskListDialog({
  isOpen,
  onClose,
  tasks,
  title,
}: TaskListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-4">
            {tasks.map((task) => (
              <div
                key={task.task_id}
                className="flex items-center justify-between space-x-4 rounded-lg border p-4"
              >
                <div className="flex flex-1 items-center space-x-4">
                  <TaskAvatar task={task} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-sm text-muted-foreground">
                        Due: {task.due_date.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {task.priority && (
                  <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Priority: {task.priority}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
