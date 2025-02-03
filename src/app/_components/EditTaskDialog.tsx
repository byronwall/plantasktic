"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useEditTaskStore } from "~/stores/useEditTaskStore";
import { api } from "~/trpc/react";

import { TaskField } from "./TaskField";
import { TaskTitle } from "./TaskTitle";

const TASK_STATUSES = [
  "open",
  "completed",
  "pending",
  "waiting",
  "blocked",
  "cancelled",
] as const;

export function EditTaskDialog() {
  const { isOpen, taskId, close } = useEditTaskStore();
  const updateTask = api.task.updateTask.useMutation();

  const { data: task, isLoading: isLoadingTask } = api.task.getTask.useQuery(
    { taskId: taskId ?? 0 },
    { enabled: !!taskId },
  );

  const relatedTasks = api.task.getRelatedTasks.useQuery(
    { taskId: taskId ?? 0 },
    { enabled: !!taskId },
  );

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
    if (!taskId) {
      return;
    }

    await updateTask.mutateAsync({
      taskId,
      data: {
        ...formData,
        duration: formData.duration ? parseFloat(formData.duration) : null,
      },
    });
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={cn("min-h-[500px] max-w-2xl", {
          "ring-2 ring-blue-500": isLoadingTask,
        })}
      >
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        {isLoadingTask && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {task && (
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

            {/* Related Tasks Section */}
            <div className="col-span-3">
              <div className="space-y-4">
                {/* Parent Task */}
                <div>
                  <h3 className="mb-2 text-sm font-medium">Parent Task</h3>
                  {relatedTasks.data?.parentTask ? (
                    <TaskTitle
                      taskId={relatedTasks.data.parentTask.task_id}
                      title={relatedTasks.data.parentTask.title}
                      isReadOnly
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No parent task
                    </p>
                  )}
                </div>

                {/* Sub Tasks */}
                <div>
                  <h3 className="mb-2 text-sm font-medium">Sub Tasks</h3>
                  <div className="space-y-2">
                    {relatedTasks.data?.subTasks.length ? (
                      relatedTasks.data.subTasks.map((subTask) => (
                        <TaskTitle
                          key={subTask.task_id}
                          taskId={subTask.task_id}
                          title={subTask.title}
                          isReadOnly
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No sub tasks
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-1 gap-2 text-xs text-muted-foreground">
                  <p>Created {formatDistanceToNow(task.created_at)} ago</p>
                  <p>Updated {formatDistanceToNow(task.updated_at)} ago</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
