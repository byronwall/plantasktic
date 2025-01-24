import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useEditTaskStore } from "~/stores/useEditTaskStore";
import { api } from "~/trpc/react";

import { TaskField } from "./TaskField";

const TASK_STATUSES = [
  "open",
  "completed",
  "pending",
  "waiting",
  "blocked",
  "cancelled",
] as const;

export function EditTaskDialog() {
  const { isOpen, task, close } = useEditTaskStore();
  const updateTask = api.task.updateTask.useMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open" as (typeof TASK_STATUSES)[number],
    priority: "",
    duration: "",
    start_date: null as Date | null,
    due_date: null as Date | null,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description ?? "",
        status: task.status as (typeof TASK_STATUSES)[number],
        priority: task.priority ?? "",
        duration: task.duration?.toString() ?? "",
        start_date: task.start_date,
        due_date: task.due_date,
      });
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!task) {
      return;
    }

    await updateTask.mutateAsync({
      taskId: task.task_id,
      data: {
        ...formData,
        duration: formData.duration ? parseFloat(formData.duration) : null,
      },
    });
    close();
  };

  if (!task) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          {/* Full width fields */}
          <div className="col-span-3 space-y-4">
            <TaskField task={task} field="title" showLabel showTextLabel />
            <TaskField
              task={task}
              field="description"
              showLabel
              showTextLabel
            />
          </div>

          <TaskField
            task={task}
            field="status"
            showLabel
            showTextLabel
            className="z-50"
          />
          <TaskField
            task={task}
            field="priority"
            showLabel
            showTextLabel
            className="z-50"
          />
          <TaskField
            task={task}
            field="category"
            showLabel
            showTextLabel
            className="z-50"
          />

          <TaskField
            task={task}
            field="duration"
            showLabel
            showTextLabel
            className="z-50"
          />
          <TaskField
            task={task}
            field="start_date"
            showLabel
            showTextLabel
            className="z-50"
          />
          <TaskField
            task={task}
            field="due_date"
            showLabel
            showTextLabel
            className="z-50"
          />

          {/* Full width bottom section */}
          <div className="col-span-2">
            <TaskField
              task={task}
              field="comments"
              showLabel
              showTextLabel
              className="z-50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Close
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
