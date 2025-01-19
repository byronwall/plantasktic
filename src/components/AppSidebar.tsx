"use client";

import { Check } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
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
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

export function AppSidebar() {
  const { data: session } = useSession();
  const { data: workspaces = [] } = api.workspace.getAll.useQuery();
  const { currentWorkspaceName, currentProjectName } = useCurrentProject();
  const { data: projects = [] } = api.project.getAll.useQuery();

  const currentWorkspace = workspaces.find(
    (w) => w.name === currentWorkspaceName,
  );

  const workspaceProjects = projects.filter(
    (p) => p.workspaceId === currentWorkspace?.id,
  );

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
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/">All Tasks</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {currentWorkspace && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href={`/${currentWorkspace.name}/goals`}>
                          Goals
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {workspaces.map((workspace) => (
                    <SidebarMenuItem key={workspace.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={workspace.name === currentWorkspaceName}
                      >
                        <Link href={`/${workspace.name}`}>
                          {workspace.name}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {currentWorkspace && (
              <SidebarGroup>
                <SidebarGroupLabel>Projects</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {workspaceProjects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={project.name === currentProjectName}
                        >
                          <Link
                            href={`/${currentWorkspace.name}/${project.name}`}
                          >
                            {project.name}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
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
    </Sidebar>
  );
}
