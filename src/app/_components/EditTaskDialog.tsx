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

  const fieldsToShow = [
    "title",
    "description",
    "status",
    "category",
    "priority",
    "duration",
    "start_date",
    "due_date",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {fieldsToShow.map((field) => (
            <TaskField
              key={field}
              task={task}
              className="z-50 justify-start"
              field={field as keyof typeof task}
              showLabel
              showTextLabel
            />
          ))}
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
