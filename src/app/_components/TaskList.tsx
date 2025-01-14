"use client";

import { ListIcon, TableIcon } from "lucide-react";
import { useState } from "react";

import { useSearch } from "~/components/SearchContext";
import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api, type RouterOutputs } from "~/trpc/react";

import { TaskItemList } from "./TaskItemList";
import { TaskListHeader } from "./TaskListHeader";
import { TaskTable } from "./TaskTable";

type TaskListProps = {
  projectName?: string;
};

type ViewMode = "list" | "table";

export type Task = RouterOutputs["task"]["getTasks"][number];

export function TaskList({ projectName }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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

  const bulkDeleteTasksMutation = api.task.bulkDeleteTasks.useMutation();
  const bulkUpdateTaskCategoryMutation =
    api.task.bulkUpdateTaskCategory.useMutation();
  const bulkMoveTasksToProjectMutation =
    api.task.bulkMoveTasksToProject.useMutation();

  const toggleTaskSelection = (taskId: number) => {
    const newSelectedTasks = new Set(selectedTasks);
    if (taskId === -1) {
      // special case to clear
      setSelectedTasks(new Set());
      return;
    }
    if (newSelectedTasks.has(taskId)) {
      newSelectedTasks.delete(taskId);
    } else {
      newSelectedTasks.add(taskId);
    }
    setSelectedTasks(newSelectedTasks);
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

  return (
    <div className="flex max-w-full flex-col items-center gap-6">
      <div className="flex w-full gap-2">
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          onClick={() => setViewMode("list")}
        >
          <ListIcon className="h-4 w-4" />
          List View
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          onClick={() => setViewMode("table")}
        >
          <TableIcon className="h-4 w-4" />
          Table View
        </Button>
      </div>

      <TaskListHeader
        selectedTasks={selectedTasks}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        onBulkDelete={handleBulkDelete}
        onBulkCategoryUpdate={handleBulkCategoryUpdate}
        onBulkMoveToProject={handleBulkMoveToProject}
        categories={categories}
      />

      {viewMode === "list" ? (
        <TaskItemList
          tasks={tasks}
          selectedTasks={selectedTasks}
          toggleTaskSelection={toggleTaskSelection}
        />
      ) : (
        <TaskTable tasks={tasks} />
      )}
    </div>
  );
}
