"use client";

import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

import { BulkImportButton } from "./BulkImportButton";
import { useSearch } from "./SearchContext";
import { Input } from "./ui/input";

export function TaskInput() {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const createTaskMutater = api.task.createTask.useMutation();
  const { currentProjectId } = useCurrentProject();

  const { setSearchQuery } = useSearch();

  const isSearchMode = newTaskTitle.startsWith("?");
  const searchQuery = isSearchMode ? newTaskTitle.slice(1) : "";

  const createTask = async () => {
    if (!isSearchMode && newTaskTitle.trim()) {
      await createTaskMutater.mutateAsync({
        title: newTaskTitle,
        status: "open",
        projectId: currentProjectId ?? undefined,
      });
      setNewTaskTitle("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearchMode) {
      void createTask();
    }
  };

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Check if the key is '/' and the target is not an input or textarea element
      // If the key is '?' and the target is an input or textarea element, set the newTaskTitle to "?" + newTaskTitle
      if (
        (e.key === "/" || e.key === "?") &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();

        const inputElement = document.getElementById("new-task-input");
        if (e.shiftKey) {
          setNewTaskTitle("?" + newTaskTitle);
        }

        inputElement?.focus();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyPress);
    return () => document.removeEventListener("keydown", handleGlobalKeyPress);
  }, []);

  // Update search query when input changes
  useEffect(() => {
    setSearchQuery(searchQuery);
  }, [searchQuery, setSearchQuery]);

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          id="new-task-input"
          autoComplete="off"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={
            isSearchMode
              ? "Search tasks..."
              : 'Press "/" to create a new task...'
          }
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          onClick={() => void createTask()}
          disabled={createTaskMutater.isPending || isSearchMode}
        >
          {createTaskMutater.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
        <BulkImportButton projectId={currentProjectId ?? undefined} />
      </div>
    </>
  );
}
