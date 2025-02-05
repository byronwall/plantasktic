"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TaskTitle } from "~/app/_components/TaskTitle";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { useToast } from "~/hooks/use-toast";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { useEditTaskStore } from "~/stores/useEditTaskStore";
import { api } from "~/trpc/react";

import type { Task } from "~/app/_components/TaskList";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { toast } = useToast();
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

  const { data: searchResults = [], isLoading: isSearching } =
    api.task.searchTasks.useQuery(
      {
        query: searchQuery,
        workspaceId: currentWorkspaceId ?? undefined,
      },
      {
        enabled: searchQuery.length > 0,
      },
    );

  const createWorkspace = api.workspace.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  const seedDemoData = api.demo.seedDemoData.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
      toast({
        title: "Demo Data Created",
        description:
          "Demo workspaces, projects, tasks, and time blocks have been created.",
      });
    },
  });

  const handleCreateWorkspace = () => {
    const name = window.prompt("Enter workspace name:");
    if (name?.trim()) {
      createWorkspace.mutate({ name: name.trim() });
    }
  };

  const handleCreateProject = () => {
    if (!currentWorkspaceId) {
      return;
    }

    const name = window.prompt("Enter project name:");
    if (name?.trim()) {
      createProject.mutate({
        name: name.trim(),
        workspaceId: currentWorkspaceId,
      });
    }
  };

  const handleSeedDemoData = () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will create DEMO CONTENT in your account.\n\n" +
        "This includes:\n" +
        "- Multiple demo workspaces and projects\n" +
        "- Sample tasks for a marketing campaign\n" +
        "- Time blocks for a work week\n\n" +
        "Are you sure you want to proceed?",
    );

    if (confirmed) {
      seedDemoData.mutate();
    }
  };

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
    openTask(task.task_id);
    setOpen(false);
  };

  const hasResults = searchQuery.length > 0 && searchResults.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className="max-h-[calc(100vh-180px)]">
        <CommandEmpty>No results found.</CommandEmpty>

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
            <>
              <CommandItem
                onSelect={() => {
                  router.push(`/${currentWorkspaceName}/goals`);
                  setOpen(false);
                }}
              >
                Goals
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  router.push(`/${currentWorkspaceName}/time-blocks`);
                  setOpen(false);
                }}
              >
                Time Blocks
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Create">
          <CommandItem onSelect={handleCreateWorkspace}>
            Create Workspace
          </CommandItem>
          {currentWorkspaceId && (
            <CommandItem onSelect={handleCreateProject}>
              Create Project
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

        {currentWorkspaceId && (
          <>
            <CommandGroup
              heading={`${currentWorkspaceName} Projects (Current)`}
            >
              {projects
                .filter((project) => project.workspaceId === currentWorkspaceId)
                .map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      router.push(`/${currentWorkspaceName}/${project.name}`);
                      setOpen(false);
                    }}
                  >
                    {project.name}
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {workspaces
          .filter((workspace) => workspace.id !== currentWorkspaceId)
          .map((workspace) => {
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
              <TaskTitle taskId={task.task_id} title={task.title} isReadOnly />
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

        {hasResults && <CommandSeparator />}

        {hasResults && (
          <CommandGroup
            key={searchQuery}
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
                value={task.title + task.project?.name}
              >
                <div className="">
                  <TaskTitle
                    taskId={task.task_id}
                    title={task.title}
                    isReadOnly
                  />
                  {task.project && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {task.project.name}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
