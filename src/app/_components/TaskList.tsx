"use client";

import {
  Check,
  CheckSquare,
  Copy,
  FolderInput,
  Square,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { ProjectSelector } from "./ProjectSelector";
import { TaskCategory } from "./TaskCategory";
import { TaskText } from "./TaskText";

type TaskListProps = {
  projectName?: string;
};

export function TaskList({ projectName }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState("");

  const { projects } = useCurrentProject();
  const projectId = projectName
    ? projects.find((p) => p.name === projectName)?.id
    : undefined;

  const { data: rawTasks } = api.task.getTasks.useQuery({
    showCompleted,
    projectId,
  });
  const { data: categories = [] } = api.task.getCategories.useQuery();

  const tasks = rawTasks ?? [];

  const updateTaskTextMutation = api.task.updateTaskText.useMutation();
  const deleteTaskMutation = api.task.deleteTask.useMutation();
  const bulkDeleteTasksMutation = api.task.bulkDeleteTasks.useMutation();
  const bulkUpdateTaskCategoryMutation =
    api.task.bulkUpdateTaskCategory.useMutation();
  const bulkMoveTasksToProjectMutation =
    api.task.bulkMoveTasksToProject.useMutation();
  const moveTaskToProjectMutation = api.task.moveTaskToProject.useMutation();

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
    const newSelectedTasks = new Set(selectedTasks);
    if (newSelectedTasks.has(taskId)) {
      newSelectedTasks.delete(taskId);
    } else {
      newSelectedTasks.add(taskId);
    }
    setSelectedTasks(newSelectedTasks);
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

  const handleBulkMoveToProject = async (projectId: string | null) => {
    await bulkMoveTasksToProjectMutation.mutateAsync({
      taskIds: Array.from(selectedTasks),
      projectId,
    });
    setSelectedTasks(new Set());
  };

  const handleMoveToProject = async (
    taskId: number,
    projectId: string | null,
  ) => {
    await moveTaskToProjectMutation.mutateAsync({ taskId, projectId });
  };

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Move to Project
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <ProjectSelector
                    onProjectSelect={(projectId) =>
                      void handleBulkMoveToProject(projectId)
                    }
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
            <div className="flex flex-1 items-center gap-2">
              <span className="ml-2 text-sm font-medium">Title</span>
              <div className="flex-grow" />
              <span className="mr-24 text-sm font-medium">Category</span>
            </div>
            <div className="w-[160px]" />
          </div>
          {tasks.length === 0 ? (
            <div className="flex w-full items-center justify-center py-8 text-sm text-muted-foreground">
              No tasks found. Create a new task to get started.
            </div>
          ) : (
            tasks.map((task) => (
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
                      task.status === "completed"
                        ? "line-through opacity-50"
                        : ""
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
                      <TaskText text={task.title} />
                    )}
                  </div>
                  <TaskCategory
                    taskId={task.task_id}
                    currentCategory={task.category}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FolderInput className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                      <ProjectSelector
                        currentProjectId={task.projectId}
                        onProjectSelect={(projectId) =>
                          void handleMoveToProject(task.task_id, projectId)
                        }
                      />
                    </PopoverContent>
                  </Popover>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
