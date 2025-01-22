"use client";

import { usePathname } from "next/navigation";

import { api } from "~/trpc/react";

import type { Project, Workspace } from "@prisma/client";

export interface UseCurrentProjectResult {
  // URL derived values
  currentWorkspaceName: string | null;
  currentProjectName: string | null;

  // Database objects
  currentWorkspace: Workspace | null;
  currentProject: Project | null;

  // IDs for direct usage
  currentWorkspaceId: string | null;
  currentProjectId: string | null;

  // Collections
  workspaces: Workspace[];
  projects: Project[];
  workspaceProjects: Project[];

  // Error states
  isInvalidWorkspace: boolean;
  isInvalidProject: boolean;
}

export function useCurrentProject(): UseCurrentProjectResult {
  const pathname = usePathname();

  // Extract workspace and project from URL path
  const pathParts = pathname.split("/").filter(Boolean);
  const currentWorkspaceName = pathParts[0]
    ? decodeURIComponent(pathParts[0])
    : null;
  const currentProjectName = pathParts[1]
    ? decodeURIComponent(pathParts[1])
    : null;

  // Get all workspaces and projects
  const { data: workspaces = [] } = api.workspace.getAll.useQuery();
  const { data: projects = [] } = api.project.getAll.useQuery();

  // Find current workspace
  const currentWorkspace = currentWorkspaceName
    ? (workspaces.find((w) => w.name === currentWorkspaceName) ?? null)
    : null;
  const currentWorkspaceId = currentWorkspace?.id ?? null;

  // Get projects for current workspace
  const workspaceProjects = projects.filter(
    (p) => p.workspaceId === currentWorkspaceId,
  );

  // Find current project - must be in current workspace
  const currentProject = currentProjectName
    ? (workspaceProjects.find((p) => p.name === currentProjectName) ?? null)
    : null;
  const currentProjectId = currentProject?.id ?? null;

  // Determine error states
  const isInvalidWorkspace = Boolean(currentWorkspaceName && !currentWorkspace);
  const isInvalidProject = Boolean(
    currentProjectName && currentWorkspace && !currentProject,
  );

  return {
    // URL derived values
    currentWorkspaceName,
    currentProjectName,

    // Database objects
    currentWorkspace,
    currentProject,

    // IDs for direct usage
    currentWorkspaceId,
    currentProjectId,

    // Collections
    workspaces,
    projects,
    workspaceProjects,

    // Error states
    isInvalidWorkspace,
    isInvalidProject,
  };
}
