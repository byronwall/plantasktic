"use client";

import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { BulkImportButton } from "./BulkImportButton";

export function TaskInput() {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const createTaskMutater = api.task.createTask.useMutation();
  const { currentProjectId } = useCurrentProject();

  const createTask = async () => {
    if (newTaskTitle.trim()) {
      await createTaskMutater.mutateAsync({
        text: newTaskTitle,
        projectId: currentProjectId ?? undefined,
      });
      setNewTaskTitle("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void createTask();
    }
  };

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Check if the key is '/' and the target is not an input element
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        const inputElement = document.getElementById("new-task-input");
        inputElement?.focus();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyPress);
    return () => document.removeEventListener("keydown", handleGlobalKeyPress);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <input
        id="new-task-input"
        type="text"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder='Press "/" to create a new task...'
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        onClick={() => void createTask()}
        disabled={createTaskMutater.isPending}
      >
        {createTaskMutater.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
      <BulkImportButton projectId={currentProjectId ?? undefined} />
    </div>
  );
}
