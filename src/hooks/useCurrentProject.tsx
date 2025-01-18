import { usePathname } from "next/navigation";

import { api } from "~/trpc/react";

export function useCurrentProject() {
  const pathname = usePathname();

  // Extract workspace and project from URL path
  const pathParts = pathname.split("/").filter(Boolean);
  const currentWorkspaceName = pathParts[0]
    ? decodeURIComponent(pathParts[0])
    : null;
  const currentProjectName = pathParts[1]
    ? decodeURIComponent(pathParts[1])
    : null;

  // Find the project ID from the name
  const { data: projects = [] } = api.task.getProjects.useQuery();
  const currentProjectId = currentProjectName
    ? projects.find((p) => p.name === currentProjectName)?.id
    : null;

  return {
    currentWorkspaceName,
    currentProjectName,
    currentProjectId,
    projects,
  };
}
