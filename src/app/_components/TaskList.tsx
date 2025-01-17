"use client";

import {
  GanttChart,
  Grid2X2,
  KanbanSquare,
  LayoutGrid,
  ListIcon,
  TableIcon,
} from "lucide-react";
import { useState } from "react";

import { useSearch } from "~/components/SearchContext";
import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api, type RouterOutputs } from "~/trpc/react";

import { EditTaskDialog } from "./EditTaskDialog";
import { TaskCardList } from "./TaskCardList";
import { TaskGanttChart } from "./TaskGanttChart";
import { TaskItemList } from "./TaskItemList";
import { TaskKanbanView } from "./TaskKanbanView";
import { TaskListHeader } from "./TaskListHeader";
import { TaskMatrixView } from "./TaskMatrixView";
import { TaskTable } from "./TaskTable";

type TaskListProps = {
  projectName?: string;
};

type ViewMode = "list" | "table" | "kanban" | "gantt" | "matrix" | "card";

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

  const toggleTaskSelection = (taskIds: number[]) => {
    const newSelectedTasks = new Set(selectedTasks);

    if (taskIds[0] === -1) {
      // special case to clear
      setSelectedTasks(new Set());
      return;
    }

    // Process all IDs at once
    taskIds.forEach((taskId) => {
      if (newSelectedTasks.has(taskId)) {
        newSelectedTasks.delete(taskId);
      } else {
        newSelectedTasks.add(taskId);
      }
    });

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
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="h-4 w-4" /> List
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4" /> Table
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" /> Cards
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            onClick={() => setViewMode("kanban")}
          >
            <KanbanSquare className="h-4 w-4" /> Kanban
          </Button>
          <Button
            variant={viewMode === "gantt" ? "default" : "outline"}
            onClick={() => setViewMode("gantt")}
          >
            <GanttChart className="h-4 w-4" /> Gantt
          </Button>
          <Button
            variant={viewMode === "matrix" ? "default" : "outline"}
            onClick={() => setViewMode("matrix")}
          >
            <Grid2X2 className="h-4 w-4" /> Matrix
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
        totalTasks={tasks.length}
        onToggleSelectAll={() => {
          const allTaskIds = tasks.map((t) => t.task_id);
          const isAllSelected = allTaskIds.every((id) => selectedTasks.has(id));

          if (isAllSelected) {
            toggleTaskSelection([-1]); // signal to clear
          } else {
            // Select all tasks that aren't currently selected
            const unselectedTasks = allTaskIds.filter(
              (id) => !selectedTasks.has(id),
            );
            toggleTaskSelection(unselectedTasks);
          }
        }}
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
        <TaskTable
          tasks={tasks}
          selectedTasks={selectedTasks}
          onToggleSelect={toggleTaskSelection}
        />
      ) : viewMode === "card" ? (
        <TaskCardList
          tasks={tasks}
          selectedTasks={selectedTasks}
          onToggleSelect={toggleTaskSelection}
          onMoveToProject={handleMoveTaskToProject}
        />
      ) : viewMode === "kanban" ? (
        <TaskKanbanView tasks={tasks} />
      ) : viewMode === "gantt" ? (
        <TaskGanttChart tasks={tasks} />
      ) : viewMode === "matrix" ? (
        <TaskMatrixView tasks={tasks} />
      ) : null}
      <EditTaskDialog />
    </div>
  );
}
