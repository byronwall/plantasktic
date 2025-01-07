"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function TaskList() {
  const { data: rawTasks } = api.post.getTasks.useQuery();

  const tasks = rawTasks ?? [];

  const createTaskMutater = api.post.createTask.useMutation();

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

  const updateTaskMutation = api.post.updateTaskStatus.useMutation();

  const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateTaskMutation.mutateAsync({ taskId, status: newStatus });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-3xl font-semibold">Tasks</h2>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Task title"
          className="rounded-md px-2 py-1"
        />
        <Button
          onClick={() => void createTask()}
          disabled={createTaskMutater.isPending}
        >
          {createTaskMutater.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Please wait
            </>
          ) : (
            "Create task"
          )}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2">
        {tasks.map((task) => (
          <div key={task.task_id} className="flex items-center gap-2">
            <div
              onClick={() => void toggleTaskStatus(task.task_id, task.status)}
              className={`cursor-pointer rounded-md px-3 py-1 hover:bg-accent hover:text-accent-foreground ${
                task.status === "completed" ? "line-through opacity-50" : ""
              }`}
            >
              {task.title}
            </div>
            <span>{task.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
