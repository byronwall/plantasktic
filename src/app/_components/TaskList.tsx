"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";

export function TaskList() {
  const [showCompleted, setShowCompleted] = useState(false);
  const { data: rawTasks } = api.task.getTasks.useQuery({ showCompleted });

  const tasks = rawTasks ?? [];

  const createTaskMutater = api.task.createTask.useMutation();

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const createTask = async () => {
    if (newTaskTitle.trim()) {
      await createTaskMutater.mutateAsync({ text: newTaskTitle });
      setNewTaskTitle("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void createTask();
    }
  };

  const updateTaskMutation = api.task.updateTaskStatus.useMutation();

  const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateTaskMutation.mutateAsync({ taskId, status: newStatus });
  };

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-end gap-2">
        <span className="text-sm">Show Completed Tasks</span>
        <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
      </div>

      <div className="flex w-full items-center gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Task title"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          onClick={() => void createTask()}
          disabled={createTaskMutater.isPending}
        >
          {createTaskMutater.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            "Create task"
          )}
        </Button>
      </div>

      <div className="w-full rounded-lg border bg-card shadow">
        <div className="flex flex-col items-center">
          {tasks.map((task) => (
            <div
              key={task.task_id}
              className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-4 py-2 last:border-b-0"
            >
              <div
                onClick={() => void toggleTaskStatus(task.task_id, task.status)}
                className={`cursor-pointer rounded-md px-3 py-1 hover:bg-accent hover:text-accent-foreground ${
                  task.status === "completed" ? "line-through opacity-50" : ""
                }`}
              >
                {task.title}
              </div>
              <span className="text-sm text-gray-500">{task.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
