"use client";

import { KanbanSquare, ListIcon, TableIcon } from "lucide-react";
import { useState } from "react";

import { useSearch } from "~/components/SearchContext";
import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api, type RouterOutputs } from "~/trpc/react";

import { TaskItemList } from "./TaskItemList";
import { TaskKanbanView } from "./TaskKanbanView";
import { TaskListHeader } from "./TaskListHeader";
import { TaskTable } from "./TaskTable";

type TaskListProps = {
  projectName?: string;
};

type ViewMode = "list" | "table" | "kanban";

export type Task = RouterOutputs["task"]["getTasks"][number];

export function TaskList({ projectName }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFieldNames, setShowFieldNames] = useState(true);
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

  const handleMoveTaskToProject = async (
    taskId: number,
    projectId: string | null,
  ) => {
    await bulkMoveTasksToProjectMutation.mutateAsync({
      taskIds: [taskId],
      projectId,
    });
  };

  const handleBulkMoveToProject = async (projectId: string | null) => {
    await bulkMoveTasksToProjectMutation.mutateAsync({
      taskIds: Array.from(selectedTasks),
      projectId,
    });
    setSelectedTasks(new Set());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("kanban")}
          >
            <KanbanSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <TaskListHeader
        selectedTasks={selectedTasks}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        showFieldNames={showFieldNames}
        setShowFieldNames={setShowFieldNames}
        onBulkDelete={handleBulkDelete}
        onBulkCategoryUpdate={handleBulkCategoryUpdate}
        onBulkMoveToProject={handleBulkMoveToProject}
        categories={categories}
      />
      {viewMode === "list" ? (
        <TaskItemList
          tasks={tasks}
          selectedTasks={selectedTasks}
          onToggleSelect={toggleTaskSelection}
          onMoveToProject={handleMoveTaskToProject}
          showFieldNames={showFieldNames}
        />
      ) : viewMode === "table" ? (
        <TaskTable tasks={tasks} />
      ) : (
        <TaskKanbanView tasks={tasks} />
      )}
    </div>
  );
}
