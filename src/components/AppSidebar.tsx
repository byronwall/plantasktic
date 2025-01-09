"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "~/components/ui/sidebar";
import { api } from "~/trpc/react";
import { Check, ChevronRight, Loader2, Upload } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn } from "~/lib/utils";

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { data: projects = [], refetch: refetchProjects } =
    api.task.getProjects.useQuery();
  const [bulkText, setBulkText] = useState("");
  const bulkCreateTasksMutater = api.task.bulkCreateTasks.useMutation();
  const createProjectMutation = api.task.createProject.useMutation({
    onSuccess: () => void refetchProjects(),
  });

  // Get current project from URL if we're on a project page
  const currentProjectName = pathname.startsWith("/project/")
    ? decodeURIComponent(pathname.split("/")[2] ?? "")
    : null;

  // Find the project ID from the name
  const currentProjectId = currentProjectName
    ? projects.find((p) => p.name === currentProjectName)?.id
    : null;

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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Check /> Task Manager
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">All Tasks</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/projects">Projects</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="w-full">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full justify-between">
                      {currentProjectName ?? "All Projects"}
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 pl-4">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "w-full justify-start",
                            !currentProjectName &&
                              "bg-accent text-accent-foreground",
                          )}
                        >
                          <Link href="/">All Projects</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {projects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                          <SidebarMenuButton
                            asChild
                            className={cn(
                              "w-full justify-start",
                              currentProjectName === project.name &&
                                "bg-accent text-accent-foreground",
                            )}
                          >
                            <Link
                              href={`/project/${encodeURIComponent(project.name)}`}
                            >
                              {project.name}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        <input
                          type="text"
                          placeholder="New Project Name"
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              e.currentTarget.value.trim()
                            ) {
                              void createProjectMutation.mutate({
                                name: e.currentTarget.value.trim(),
                              });
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="mr-2 h-4 w-4" />
                      Bulk Import
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px]" align="start">
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">
                        Bulk Import Tasks
                      </h4>
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
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {session?.user ? (
                <div className="flex flex-col gap-2">
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
