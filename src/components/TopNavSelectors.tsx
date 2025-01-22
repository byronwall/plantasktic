"use client";

import { useRouter } from "next/navigation";

import { ProjectSelector } from "~/components/ProjectSelector";
import { WorkspaceSelector } from "~/components/WorkspaceSelector";
import { useCurrentProject } from "~/hooks/useCurrentProject";

export function TopNavSelectors() {
  const router = useRouter();
  const { currentWorkspace, currentProject, workspaces, projects } =
    useCurrentProject();

  const handleWorkspaceChange = (workspaceId: string | null) => {
    if (!workspaceId) {
      router.push("/");
      return;
    }

    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      // Get the current path segments and replace just the workspace name
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      if (pathSegments.length > 1) {
        // Replace the first segment (workspace) and keep the rest
        pathSegments[0] = workspace.name;
        router.push(`/${pathSegments.join("/")}`);
      } else {
        // If only workspace or root, just use workspace name
        router.push(`/${workspace.name}`);
      }
    }
  };

  const handleProjectChange = (projectId: string | null) => {
    if (!currentWorkspace) {
      return;
    }

    if (!projectId) {
      router.push(`/${currentWorkspace.name}`);
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (project) {
      router.push(`/${currentWorkspace.name}/${project.name}`);
    }
  };

  return (
    <>
      <WorkspaceSelector
        value={currentWorkspace?.id ?? null}
        onChange={handleWorkspaceChange}
      />
      <ProjectSelector
        value={currentProject?.id ?? null}
        onChange={handleProjectChange}
        workspaceId={currentWorkspace?.id ?? null}
        disabled={!currentWorkspace}
      />
    </>
  );
}
