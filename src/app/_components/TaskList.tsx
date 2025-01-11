"use client";

import { useState } from "react";

import { useSearch } from "~/components/SearchContext";
import { Checkbox } from "~/components/ui/checkbox";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import { TaskItem } from "./TaskItem";
import { TaskListHeader } from "./TaskListHeader";

type TaskListProps = {
  projectName?: string;
};

export function TaskList({ projectName }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const { searchQuery } = useSearch();

  const { projects } = useCurrentProject();
  const projectId = projectName
    ? projects.find((p) => p.name === projectName)?.id
    : undefined;

  const { data: rawTasks } = api.task.getTasks.useQuery({
    showCompleted,
    projectId,
  });

  const searchResults = rawTasks?.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const { data: categories = [] } = api.task.getCategories.useQuery();

  const tasks = searchQuery ? (searchResults ?? []) : (rawTasks ?? []);

  const deleteTaskMutation = api.task.deleteTask.useMutation();
  const bulkDeleteTasksMutation = api.task.bulkDeleteTasks.useMutation();
  const bulkUpdateTaskCategoryMutation =
    api.task.bulkUpdateTaskCategory.useMutation();
  const bulkMoveTasksToProjectMutation =
    api.task.bulkMoveTasksToProject.useMutation();
  const moveTaskToProjectMutation = api.task.moveTaskToProject.useMutation();
  const updateTaskMutation = api.task.updateTaskStatus.useMutation();

  const copyToClipboard = (taskId: number, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 1000);
  };

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
      <TaskListHeader
        selectedTasks={selectedTasks}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        onBulkDelete={handleBulkDelete}
        onBulkCategoryUpdate={handleBulkCategoryUpdate}
        onBulkMoveToProject={handleBulkMoveToProject}
        categories={categories}
      />

      <div className="w-full rounded-lg border bg-card shadow">
        <div className="flex flex-col items-center">
          <div className="flex w-full items-center border-b border-gray-200 px-4 py-2">
            <Checkbox
              checked={selectedTasks.size === tasks.length}
              onCheckedChange={toggleSelectAll}
              className="h-5 w-5"
            />
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
              <TaskItem
                key={task.task_id}
                task={task}
                isSelected={selectedTasks.has(task.task_id)}
                onToggleSelect={toggleTaskSelection}
                copiedTaskId={copiedTaskId}
                onCopy={copyToClipboard}
                onDelete={handleDelete}
                onStatusChange={toggleTaskStatus}
                onMoveToProject={handleMoveToProject}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
