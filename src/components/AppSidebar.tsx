"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
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

export function AppSidebar() {
  const { data: session } = useSession();
  const {
    currentWorkspace,
    currentWorkspaceName,
    currentProjectName,
    workspaces,
    workspaceProjects,
  } = useCurrentProject();

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
                  {currentWorkspace && (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href={`/${currentWorkspace.name}/goals`}>
                            Goals
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href={`/${currentWorkspace.name}/time-blocks`}>
                            Time Blocks
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Workspaces - Tasks</SidebarGroupLabel>
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
                <SidebarGroupLabel>Projects - Tasks</SidebarGroupLabel>
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
