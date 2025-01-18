"use client";

import { usePathname, useRouter } from "next/navigation";

import { ProjectSelector } from "~/components/ProjectSelector";
import { WorkspaceSelector } from "~/components/WorkspaceSelector";
import { api } from "~/trpc/react";

export function TopNavSelectors() {
  const router = useRouter();
  const { data: workspaces } = api.workspace.getAll.useQuery();
  const { data: projects } = api.project.getAll.useQuery();

  const currentPath = usePathname();

  const pathParts = currentPath
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));

  const currentWorkspace = workspaces?.find((w) => w.name === pathParts[0]);
  const currentProject = projects?.find(
    (p) => p.name === pathParts[1] && p.workspaceId === currentWorkspace?.id,
  );

  console.log("currentPath", currentPath);
  console.log("pathParts", pathParts);
  console.log("currentWorkspace", currentWorkspace);
  console.log("currentProject", currentProject);
  console.log("workspaces", workspaces);
  console.log("projects", projects);

  const handleWorkspaceChange = (workspaceId: string | null) => {
    if (!workspaceId) {
      router.push("/");
      return;
    }
    const workspace = workspaces?.find((w) => w.id === workspaceId);
    if (workspace) {
      router.push(`/${workspace.name}`);
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

    const project = projects?.find((p) => p.id === projectId);
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
      />
    </>
  );
}
