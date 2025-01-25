"use client";

import { useEffect } from "react";

import { useSearch } from "~/components/SearchContext";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { useSelectedTasksStore } from "~/stores/useSelectedTasksStore";
import {
  useSyncViewSettingsWithUrl,
  useUpdateUrlFromViewSettings,
  useViewSettingsStore,
} from "~/stores/useViewSettingsStore";
import { api, type RouterOutputs } from "~/trpc/react";

import { TaskCardList } from "./TaskCardList";
import { TaskGanttChart } from "./TaskGanttChart";
import { TaskItemList } from "./TaskItemList";
import { TaskKanbanView } from "./TaskKanbanView";
import { TaskListHeader } from "./TaskListHeader";
import { TaskMatrixView } from "./TaskMatrixView";
import { TaskSummaryView } from "./TaskSummaryView";
import { TaskTable } from "./TaskTable";

export type Task = RouterOutputs["task"]["getTasks"][number];

export function TaskList() {
  const { viewMode, showCompleted, showFieldNames } = useViewSettingsStore();
  const { searchQuery } = useSearch();
  const setAvailableTaskIds = useSelectedTasksStore(
    (state) => state.setAvailableTaskIds,
  );

  const { currentWorkspaceId: workspaceId, currentProjectId: projectId } =
    useCurrentProject();

  // Sync view settings with URL
  useSyncViewSettingsWithUrl();
  useUpdateUrlFromViewSettings();

  const { data: rawTasks } = api.task.getTasks.useQuery({
    showCompleted,
    projectId: projectId ?? undefined,
    workspaceId: workspaceId ?? undefined,
  });

  const searchResults = rawTasks?.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const tasks = searchQuery ? (searchResults ?? []) : (rawTasks ?? []);

  // Update available task IDs whenever the task list changes
  useEffect(() => {
    setAvailableTaskIds(tasks.map((task) => task.task_id));
  }, [tasks, setAvailableTaskIds]);

  return (
    <div className="flex flex-col gap-4">
      <TaskListHeader totalTasks={tasks.length} />
      {viewMode === "list" ? (
        <TaskItemList tasks={tasks} showFieldNames={showFieldNames} />
      ) : viewMode === "table" ? (
        <TaskTable tasks={tasks} />
      ) : viewMode === "card" ? (
        <TaskCardList tasks={tasks} />
      ) : viewMode === "kanban" ? (
        <TaskKanbanView tasks={tasks} />
      ) : viewMode === "gantt" ? (
        <TaskGanttChart tasks={tasks} />
      ) : viewMode === "matrix" ? (
        <TaskMatrixView tasks={tasks} />
      ) : viewMode === "summary" ? (
        <TaskSummaryView tasks={tasks} />
      ) : null}
    </div>
  );
}
