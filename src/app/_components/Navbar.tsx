"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Loader2, Plus, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useRouter, usePathname } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  userId: string;
};

export function Navbar() {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [bulkText, setBulkText] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const { data: projects = [] } = api.task.getProjects.useQuery() as {
    data: Project[] | undefined;
  };

  // Get current project from URL if we're on a project page
  const currentProjectName = pathname.startsWith("/project/")
    ? decodeURIComponent(pathname.split("/")[2] ?? "")
    : null;

  // Find the project ID from the name
  const currentProjectId = currentProjectName
    ? projects.find((p) => p.name === currentProjectName)?.id
    : null;

  const createTaskMutater = api.task.createTask.useMutation();
  const bulkCreateTasksMutater = api.task.bulkCreateTasks.useMutation();
  const createProjectMutater = api.task.createProject.useMutation();

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

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const tasks = lines
      .map((line) => {
        line = line.replace(/^-?\s*\[ \]/, "").trim();
        line = line.replace(/^[-*•]/, "").trim();
        return line;
      })
      .filter((line) => line.length > 0);

    if (tasks.length > 0) {
      await bulkCreateTasksMutater.mutateAsync({
        tasks,
        projectId: currentProjectId ?? undefined,
      });
      setBulkText("");
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
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="text-2xl font-bold">
          Task Manager
        </Link>

        <div className="flex flex-1 items-center gap-2 px-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {currentProjectName ?? "All Projects"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px]" align="start">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push("/")}
                >
                  All Projects
                </Button>
                {projects.map((project: Project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() =>
                      router.push(
                        `/project/${encodeURIComponent(project.name)}`,
                      )
                    }
                  >
                    {project.name}
                  </Button>
                ))}
                <hr className="my-2" />
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="New Project Name"
                    className="w-full rounded-md border px-3 py-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        void createProjectMutater.mutateAsync({
                          name: e.currentTarget.value.trim(),
                        });
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Task
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4" />
                Bulk Import
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px]" align="end">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Bulk Import Tasks</h4>
                <p className="text-sm text-muted-foreground">
                  Paste your tasks below, one per line. Supports markdown
                  checkboxes and bullet points.
                </p>
                <textarea
                  className="h-[200px] w-full rounded-md border p-2"
                  placeholder="- [ ] Task 1&#10;- [ ] Task 2&#10;- Task 3"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => void handleBulkImport()}
                    disabled={bulkCreateTasksMutater.isPending}
                  >
                    {bulkCreateTasksMutater.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Import Tasks
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user.name}
              </span>
              <Button variant="outline" asChild>
                <Link href="/api/auth/signout">Sign out</Link>
              </Button>
            </div>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/api/auth/signin">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
