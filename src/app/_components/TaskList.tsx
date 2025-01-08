"use client";

import { Copy, Check, Trash2, CheckSquare, Square } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";
import { TaskCategory } from "./TaskCategory";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ComboBox } from "./ComboBox";

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
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const { data: rawTasks } = api.task.getTasks.useQuery({ showCompleted });
  const { data: categories = [] } = api.task.getCategories.useQuery();
  const [selectedCategory, setSelectedCategory] = useState("");

  const tasks = rawTasks ?? [];

  const updateTaskTextMutation = api.task.updateTaskText.useMutation();
  const deleteTaskMutation = api.task.deleteTask.useMutation();
  const updateTaskCategoryMutation = api.task.updateTaskCategory.useMutation();
  const bulkDeleteTasksMutation = api.task.bulkDeleteTasks.useMutation();
  const bulkUpdateTaskCategoryMutation =
    api.task.bulkUpdateTaskCategory.useMutation();

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

  const updateTaskMutation = api.task.updateTaskStatus.useMutation();

  const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateTaskMutation.mutateAsync({ taskId, status: newStatus });
  };

  const handleDelete = async (taskId: number, e: React.MouseEvent) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const skipConfirm = (isMac && e.metaKey) || (!isMac && e.ctrlKey);

    if (
      skipConfirm ||
      window.confirm("Are you sure you want to delete this task?")
    ) {
      await deleteTaskMutation.mutateAsync({ taskId });
    }
  };

  const toggleTaskSelection = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.task_id)));
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedTasks.size} tasks?`,
      )
    ) {
      await bulkDeleteTasksMutation.mutateAsync({
        taskIds: Array.from(selectedTasks),
      });
      setSelectedTasks(new Set());
    }
  };

  const handleBulkCategoryUpdate = async (category: string) => {
    await bulkUpdateTaskCategoryMutation.mutateAsync({
      taskIds: Array.from(selectedTasks),
      category,
    });
    setSelectedTasks(new Set());
    setSelectedCategory("");
  };

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm">{selectedTasks.size} selected</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleBulkDelete()}
              >
                Delete Selected
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Set Category
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <ComboBox
                    options={categories}
                    value={selectedCategory}
                    onChange={(category) =>
                      void handleBulkCategoryUpdate(category)
                    }
                    placeholder="Select category..."
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Show Completed Tasks</span>
          <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
        </div>
      </div>

      <div className="w-full rounded-lg border bg-card shadow">
        <div className="flex flex-col items-center">
          <div className="flex w-full items-center border-b border-gray-200 px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSelectAll}
              className="h-8 w-8"
            >
              {selectedTasks.size === tasks.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
            <span className="ml-2 text-sm font-medium">Select All</span>
          </div>
          {tasks.map((task) => (
            <div
              key={task.task_id}
              className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-4 py-2 last:border-b-0"
            >
              <div className="flex flex-1 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleTaskSelection(task.task_id)}
                  className="h-8 w-8"
                >
                  {selectedTasks.has(task.task_id) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(task.task_id, e);
                  }}
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
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
