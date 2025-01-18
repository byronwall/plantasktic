"use client";

import { ProjectSelector } from "~/components/ProjectSelector";
import { WorkspaceSelector } from "~/components/WorkspaceSelector";
import { useWorkspaceProject } from "~/hooks/useWorkspaceProject";

export function TopNavSelectors() {
  const {
    selectedWorkspaceId,
    selectedProjectId,
    setSelectedWorkspaceId,
    setSelectedProjectId,
  } = useWorkspaceProject();

  return (
    <>
      <WorkspaceSelector
        value={selectedWorkspaceId}
        onChange={setSelectedWorkspaceId}
      />
      <ProjectSelector
        value={selectedProjectId}
        onChange={setSelectedProjectId}
        workspaceId={selectedWorkspaceId}
      />
    </>
  );
}
