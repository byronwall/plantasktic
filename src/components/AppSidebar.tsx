"use client";

import { ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
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
  const {
    currentWorkspace,
    currentWorkspaceName,
    currentProjectName,
    workspaces,
    workspaceProjects,
    projects,
  } = useCurrentProject();

  const { data: projectTaskCounts = {} } =
    api.task.getProjectTaskCounts.useQuery();

  // Sort workspaces to put current workspace first
  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    if (a.name === currentWorkspaceName) {
      return -1;
    }
    if (b.name === currentWorkspaceName) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="mt-2 flex flex-col items-center">
              <Link href="/" className="flex items-center text-xl font-bold">
                <Image
                  src="/favicon-32x32.png"
                  alt="Logo"
                  className="mr-2 h-4 w-4"
                  width={16}
                  height={16}
                />
                Plan•Task•Tic
              </Link>
              <Link
                href="https://byroni.us"
                className="mt-1 block text-xs text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                created by Byron Wall
              </Link>
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>

        {session?.user ? (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/">Home View</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sortedWorkspaces.map((workspace) => (
                    <Collapsible
                      key={workspace.id}
                      defaultOpen={workspace.name === currentWorkspaceName}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-accent">
                        <span>{workspace.name}</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4">
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              isActive={
                                workspace.name === currentWorkspaceName &&
                                !currentProjectName
                              }
                            >
                              <Link href={`/${workspace.name}`}>Overview</Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link href={`/${workspace.name}/goals`}>
                                Goals
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link href={`/${workspace.name}/time-blocks`}>
                                Time Blocks
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          {projects.filter(
                            (p) => p.workspaceId === workspace.id,
                          ).length > 0 && (
                            <>
                              <div className="my-2 px-2 text-xs font-medium text-muted-foreground">
                                Projects
                              </div>
                              {projects
                                .filter((p) => p.workspaceId === workspace.id)
                                .map((project) => (
                                  <SidebarMenuItem key={project.id}>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={
                                        workspace.name ===
                                          currentWorkspaceName &&
                                        project.name === currentProjectName
                                      }
                                    >
                                      <Link
                                        href={`/${workspace.name}/${project.name}`}
                                        className="flex w-full items-center justify-between"
                                      >
                                        <span>{project.name}</span>
                                        {(() => {
                                          const count = project.id
                                            ? projectTaskCounts[project.id]
                                            : 0;
                                          return count && count > 0 ? (
                                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                              {count}
                                            </span>
                                          ) : null;
                                        })()}
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup className="mt-4">
            <SidebarGroupContent>
              <div className="px-4 py-2 text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  Please sign in to manage tasks
                </p>
                <Button asChild>
                  <Link href="/api/identity/signin">Sign in</Link>
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
                    <Link href="/api/identity/signout">Sign out</Link>
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
