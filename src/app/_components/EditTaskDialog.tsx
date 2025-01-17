import { useEffect, useState } from "react";

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
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useEditTaskStore } from "~/stores/useEditTaskStore";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { TaskCategory } from "./TaskCategory";

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

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <ComboBox
                options={[...TASK_STATUSES]}
                value={formData.status}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as (typeof TASK_STATUSES)[number],
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <TaskCategory
                taskId={task.task_id}
                currentCategory={task.category}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <DateInput
                value={formData.start_date ?? undefined}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, start_date: date ?? null }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Due Date</Label>
              <DateInput
                value={formData.due_date ?? undefined}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, due_date: date ?? null }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateTask.isPending}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
