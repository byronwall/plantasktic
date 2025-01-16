"use client";

import { Check, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Collapsible } from "~/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { WorkspaceSelector } from "~/components/WorkspaceSelector";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export function AppSidebar() {
  const { data: session } = useSession();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null,
  );
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const { currentProjectId, projects } = useCurrentProject();

  const { refetch: refetchProjects } = api.task.getProjects.useQuery();

  const createProjectMutation = api.task.createProject.useMutation({
    onSuccess: () => {
      void refetchProjects();
      setIsNewProjectDialogOpen(false);
      setNewProjectName("");
    },
  });

  const filteredProjects = selectedWorkspaceId
    ? projects.filter((project) => project.workspaceId === selectedWorkspaceId)
    : projects;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Link href="/" className="flex items-center text-xl font-bold">
              <Check className="mr-2 h-4 w-4" /> Task Manager
            </Link>
          </SidebarGroupLabel>
        </SidebarGroup>

        {session?.user ? (
          <>
            <SidebarGroup>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/workspaces">Workspaces</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-4">
                  <WorkspaceSelector
                    value={selectedWorkspaceId}
                    onChange={setSelectedWorkspaceId}
                  />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <Collapsible defaultOpen>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenu>
                        {filteredProjects.map((project) => (
                          <SidebarMenuItem key={project.id}>
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                "w-full justify-start",
                                currentProjectId === project.id &&
                                  "bg-accent text-accent-foreground",
                              )}
                            >
                              <Link href={`/project/${project.name}`}>
                                {project.name}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                        <SidebarMenuItem>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setIsNewProjectDialogOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                          </Button>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </Collapsible>
          </>
        ) : (
          <SidebarGroup className="mt-4">
            <SidebarGroupContent>
              <div className="px-4 py-2 text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  Please sign in to manage tasks
                </p>
                <Button asChild>
                  <Link href="/api/auth/signin">Sign in</Link>
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Dialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newProjectName.trim()) {
                  void createProjectMutation.mutate({
                    name: newProjectName.trim(),
                    workspaceId: selectedWorkspaceId,
                  });
                }
              }}
            />
            <Button
              onClick={() => {
                if (newProjectName.trim()) {
                  void createProjectMutation.mutate({
                    name: newProjectName.trim(),
                    workspaceId: selectedWorkspaceId,
                  });
                }
              }}
            >
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
