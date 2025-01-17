"use client";

import { type Row } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";

import { useTaskColumns } from "./hooks/useTaskColumns";
import {
  COLUMN_PRESETS,
  type ColumnKey,
  ColumnSelector,
  type PresetKey,
} from "./tables/ColumnSelector";
import { GenericTable } from "./tables/GenericTable";
import { TaskActions } from "./TaskActions";

import type { Task } from "@prisma/client";

export function TaskTable({
  tasks,
  selectedTasks,
  onToggleSelect,
}: {
  tasks: Task[];
  selectedTasks: Set<number>;
  onToggleSelect: (taskIds: number[]) => void;
}) {
  const { AVAILABLE_COLUMNS } = useTaskColumns();
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);
  const updateTask = api.task.updateTask.useMutation();
  const deleteTaskMutation = api.task.deleteTask.useMutation();
  const bulkMoveTasksToProjectMutation =
    api.task.bulkMoveTasksToProject.useMutation();

  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
    ...COLUMN_PRESETS.basic.columns,
  ]);

  const handleColumnToggle = (columns: ColumnKey[]) => {
    // Ensure at least one column is selected
    if (columns.length === 0) {
      columns = ["title" as const];
    }
    setSelectedColumns(columns);
  };

  const handlePresetClick = (preset: PresetKey) => {
    setSelectedColumns([...COLUMN_PRESETS[preset].columns]);
  };

  const copyToClipboard = (taskId: number, title: string) => {
    void navigator.clipboard.writeText(title);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const toggleTaskStatus = (taskId: number, status: string) => {
    const newStatus = status === "completed" ? "open" : "completed";
    void updateTask.mutateAsync({
      taskId,
      data: { status: newStatus },
    });
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

  const handleMoveToProject = async (
    taskId: number,
    projectId: string | null,
  ) => {
    await bulkMoveTasksToProjectMutation.mutateAsync({
      taskIds: [taskId],
      projectId,
    });
  };

  const selectionColumn = {
    id: "select",
    cell: ({ row }: { row: Row<Task> }) => (
      <Checkbox
        checked={selectedTasks.has(row.original.task_id)}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
          onToggleSelect([row.original.task_id]);
        }}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const actionsColumn = {
    id: "actions",
    cell: ({ row }: { row: Row<Task> }) => (
      <Popover>
        <PopoverTrigger>
          <Button variant="ghost" size="icon">
            <MoreVertical />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <TaskActions
            task={row.original}
            copiedTaskId={copiedTaskId}
            onCopy={(taskId) => copyToClipboard(taskId, row.original.title)}
            onDelete={handleDelete}
            onStatusChange={toggleTaskStatus}
            onMoveToProject={handleMoveToProject}
          />
        </PopoverContent>
      </Popover>
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const columns = [
    selectionColumn,
    actionsColumn,
    ...selectedColumns.map(
      (key) =>
        AVAILABLE_COLUMNS.find((col) => col.value === key)?.columnDef ?? {
          accessorKey: key,
          header:
            AVAILABLE_COLUMNS.find((col) => col.value === key)?.label ?? key,
        },
    ),
  ];

  return (
    <>
      <div className="mb-4 space-y-2">
        <ColumnSelector
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
          availableColumns={AVAILABLE_COLUMNS}
          onPresetClick={handlePresetClick}
        />
      </div>
      <div className="w-fit max-w-full">
        <GenericTable columns={columns} data={tasks} shouldHideGLobalFilter />
      </div>
    </>
  );
}
