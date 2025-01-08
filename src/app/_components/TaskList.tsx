"use client";

import { Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";
import { TaskCategory } from "./TaskCategory";

// Helper function to detect and format URLs in text
function formatTextWithLinks(text: string) {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlPattern);
  return parts.map((part, index) => {
    if (part.match(urlPattern)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function TaskList() {
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);
  const { data: rawTasks } = api.task.getTasks.useQuery({ showCompleted });

  const tasks = rawTasks ?? [];

  const createTaskMutater = api.task.createTask.useMutation();
  const updateTaskTextMutation = api.task.updateTaskText.useMutation();

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

  const handleEditKeyPress = async (e: React.KeyboardEvent, taskId: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editText.trim()) {
        await updateTaskTextMutation.mutateAsync({ taskId, text: editText });
        setEditingTaskId(null);
      }
    } else if (e.key === "Escape") {
      setEditingTaskId(null);
    }
  };

  const startEditing = (taskId: number, currentText: string) => {
    setEditingTaskId(taskId);
    setEditText(currentText);
  };

  const copyToClipboard = (taskId: number, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 1000);
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
              <div className="flex flex-1 items-center gap-2">
                <div
                  className={`flex-1 ${
                    task.status === "completed" ? "line-through opacity-50" : ""
                  }`}
                  onClick={() => startEditing(task.task_id, task.title)}
                >
                  {editingTaskId === task.task_id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) =>
                        void handleEditKeyPress(e, task.task_id)
                      }
                      onBlur={() => setEditingTaskId(null)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      autoFocus
                    />
                  ) : (
                    formatTextWithLinks(task.title)
                  )}
                </div>
                <TaskCategory
                  taskId={task.task_id}
                  currentCategory={task.category}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(task.task_id, task.title);
                  }}
                  className="h-8 w-8 transition-opacity"
                  disabled={copiedTaskId === task.task_id}
                >
                  {copiedTaskId === task.task_id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Switch
                  checked={task.status === "completed"}
                  onCheckedChange={() =>
                    void toggleTaskStatus(task.task_id, task.status)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
