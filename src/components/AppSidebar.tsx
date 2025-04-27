"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "~/components/icons";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const isRouteActive = (
  pathname: string,
  workspace: string,
  project?: string,
  route?: string,
) => {
  const normalizedPathname = decodeURIComponent(pathname.toLowerCase());
  const workspacePath = `/${encodeURIComponent(workspace.toLowerCase())}`;

  if (route) {
    return normalizedPathname === `${workspacePath}/${route.toLowerCase()}`;
  }

  if (project) {
    const projectPath = `${workspacePath}/${encodeURIComponent(project.toLowerCase())}`;
    return normalizedPathname === projectPath;
  }

  // For workspace overview page
  return normalizedPathname === workspacePath;
};

const activeItemClass = "bg-primary/10 text-primary font-medium";
const hoverItemClass = "hover:bg-accent/50 hover:text-primary";

export function AppSidebar() {
  const { data: session } = useSession();
  const {
    currentWorkspaceName,
    currentProjectName,
    currentProjectId,
    workspaces,
    projects,
  } = useCurrentProject();
  const pathname = usePathname();

  const { data: projectTaskCounts = {} } =
    api.task.getProjectTaskCounts.useQuery();

  const { data: workspaceGoalCounts = {} } =
    api.goal.getWorkspaceGoalCounts.useQuery();

  type TimeBlockCounts = Record<string, { today: number; upcoming: number }>;
  const { data: workspaceTimeBlockCounts } =
    api.timeBlock.getWorkspaceTimeBlockCounts.useQuery();
  const timeBlockCounts = (workspaceTimeBlockCounts ?? {}) as TimeBlockCounts;

  // Helper function to safely get time block counts
  const getTimeBlockCounts = (workspaceId: string) => {
    const counts = timeBlockCounts[workspaceId];
    return counts ?? { today: 0, upcoming: 0 };
  };

  // Sort workspaces alphabetically
  const sortedWorkspaces = [...workspaces].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const isAdmin = session?.user?.roles?.includes("SITE_ADMIN");

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
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>

        {session?.user ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "w-full transition-colors",
                        typeof pathname === "string" &&
                          pathname.startsWith("/workspaces/admin")
                          ? activeItemClass
                          : hoverItemClass,
                      )}
                    >
                      <Link
                        href={`/workspaces/admin`}
                        className="flex items-center gap-2"
                      >
                        <Icons.settings className="h-4 w-4" />
                        Manage All
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {sortedWorkspaces.map((workspace) => (
                    <Collapsible
                      key={workspace.id}
                      defaultOpen={workspace.name === currentWorkspaceName}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-accent">
                        <span>{workspace.name}</span>
                        <Icons.chevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4">
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                "w-full transition-colors",
                                isRouteActive(pathname, workspace.name)
                                  ? activeItemClass
                                  : hoverItemClass,
                              )}
                            >
                              <Link
                                href={`/${workspace.name}`}
                                className="flex items-center gap-2"
                              >
                                <Icons.panel className="h-4 w-4" />
                                Overview
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                "w-full transition-colors",
                                isRouteActive(
                                  pathname,
                                  workspace.name,
                                  undefined,
                                  "goals",
                                )
                                  ? activeItemClass
                                  : hoverItemClass,
                              )}
                            >
                              <Link
                                href={`/${workspace.name}/goals`}
                                className="flex w-full items-center justify-between"
                              >
                                <span className="flex items-center gap-2">
                                  <Icons.goals className="h-4 w-4" />
                                  Goals
                                </span>
                                {workspaceGoalCounts[workspace.id] ? (
                                  <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {workspaceGoalCounts[workspace.id]}
                                  </span>
                                ) : null}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                "w-full transition-colors",
                                isRouteActive(
                                  pathname,
                                  workspace.name,
                                  undefined,
                                  "time-blocks",
                                )
                                  ? activeItemClass
                                  : hoverItemClass,
                              )}
                            >
                              <Link
                                href={`/${workspace.name}/time-blocks`}
                                className="flex w-full items-center justify-between"
                              >
                                <span className="flex items-center gap-2">
                                  <Icons.timeBlock className="h-4 w-4" />
                                  Time Blocks
                                </span>
                                {(() => {
                                  const counts = workspace.id
                                    ? getTimeBlockCounts(workspace.id)
                                    : { today: 0, upcoming: 0 };
                                  return counts.today > 0 ||
                                    counts.upcoming > 0 ? (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                          {counts.today} / {counts.upcoming}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{counts.today} blocks today</p>
                                        <p>
                                          {counts.upcoming} blocks in next 7
                                          days
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : null;
                                })()}
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
                                .map((project) => {
                                  const taskCount =
                                    projectTaskCounts?.[project.id];
                                  return (
                                    <SidebarMenuItem key={project.id}>
                                      <SidebarMenuButton
                                        asChild
                                        className={cn(
                                          "w-full transition-colors",
                                          project.id === currentProjectId
                                            ? activeItemClass
                                            : hoverItemClass,
                                        )}
                                      >
                                        <Link
                                          href={`/${workspace.name}/${project.name}`}
                                          className="flex h-fit w-full items-center justify-between"
                                        >
                                          <span className="flex items-center gap-2">
                                            <Icons.todo className="h-4 w-4" />
                                            {project.name}
                                          </span>
                                          {project?.id != undefined &&
                                            taskCount !== undefined &&
                                            taskCount > 0 && (
                                              <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                {taskCount}
                                              </span>
                                            )}
                                        </Link>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  );
                                })}
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 transition-colors",
                          pathname === "/admin"
                            ? activeItemClass
                            : hoverItemClass,
                        )}
                      >
                        <Link href="/admin">
                          <Icons.admin
                            className="h-6 w-6 shrink-0"
                            aria-hidden="true"
                          />
                          Admin
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
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

        <SidebarGroup className="mt-auto pb-4">
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
