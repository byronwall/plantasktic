"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { useEditTaskStore } from "~/stores/useEditTaskStore";
import { api } from "~/trpc/react";

import type { Task } from "~/app/_components/TaskList";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { currentWorkspaceId, currentWorkspaceName } = useCurrentProject();
  const { open: openTask } = useEditTaskStore();

  const { data: workspaces = [] } = api.workspace.getAll.useQuery();
  const { data: projects = [] } = api.project.getAll.useQuery();
  const { data: dueTasks = [] } = api.task.getTasks.useQuery(
    {
      showCompleted: false,
      workspaceId: currentWorkspaceId ?? undefined,
    },
    {
      select: (tasks) =>
        tasks
          .filter((task) => task.due_date !== null)
          .sort((a, b) => a.due_date!.getTime() - b.due_date!.getTime())
          .slice(0, 10),
    },
  );

  const { data: goals = [] } = api.goal.getAll.useQuery({
    workspaceId: currentWorkspaceId ?? undefined,
  });

  const { data: searchResults = [] } = api.task.searchTasks.useQuery(
    {
      query: searchQuery,
      workspaceId: currentWorkspaceId ?? undefined,
    },
    {
      enabled: searchQuery.length > 0,
    },
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleTaskClick = (task: Task) => {
    openTask(task);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className="max-h-[calc(100vh-180px)]">
        <CommandEmpty>No results found.</CommandEmpty>

        {searchQuery.length > 0 && searchResults.length > 0 && (
          <>
            <CommandGroup
              heading={
                <div className="flex items-center gap-2">
                  <Search className="size-4" />
                  <span>Search Results</span>
                </div>
              }
            >
              {searchResults.map((task) => (
                <CommandItem
                  key={task.task_id}
                  onSelect={() => handleTaskClick(task)}
                >
                  {task.title}
                  {task.project && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {task.project.name}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              router.push("/");
              setOpen(false);
            }}
          >
            Home
          </CommandItem>
          {currentWorkspaceId && (
            <CommandItem
              onSelect={() => {
                router.push(`/${currentWorkspaceName}/goals`);
                setOpen(false);
              }}
            >
              Goals
            </CommandItem>
          )}
          {currentWorkspaceId && (
            <CommandItem
              onSelect={() => {
                router.push(`/${currentWorkspaceName}/time-blocks`);
                setOpen(false);
              }}
            >
              Time Blocks
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspaces">
          {workspaces.map((workspace) => (
            <CommandItem
              key={workspace.id}
              onSelect={() => {
                router.push(`/${workspace.name}`);
                setOpen(false);
              }}
            >
              {workspace.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {workspaces.map((workspace) => {
          const workspaceProjects = projects.filter(
            (project) => project.workspaceId === workspace.id,
          );

          if (workspaceProjects.length === 0) {
            return null;
          }

          return (
            <CommandGroup
              key={workspace.id}
              heading={`${workspace.name} Projects`}
            >
              {workspaceProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    router.push(`/${workspace.name}/${project.name}`);
                    setOpen(false);
                  }}
                >
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

        <CommandSeparator />

        <CommandGroup heading="Due Tasks">
          {dueTasks.map((task) => (
            <CommandItem
              key={task.task_id}
              onSelect={() => handleTaskClick(task)}
            >
              {task.title}
              <span className="ml-2 text-sm text-muted-foreground">
                {task.due_date?.toLocaleDateString()}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Goals">
          {goals.map((goal) => (
            <CommandItem
              key={goal.id}
              onSelect={() => {
                setOpen(false);
              }}
            >
              {goal.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
