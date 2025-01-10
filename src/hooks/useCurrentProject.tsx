import { usePathname } from "next/navigation";

import { api } from "~/trpc/react";

export function useCurrentProject() {
  const pathname = usePathname();

  // Get current project from URL if we're on a project page
  const currentProjectName = pathname.startsWith("/project/")
    ? decodeURIComponent(pathname.split("/")[2] ?? "")
    : null;

  // Find the project ID from the name
  const { data: projects = [] } = api.task.getProjects.useQuery();
  const currentProjectId = currentProjectName
    ? projects.find((p) => p.name === currentProjectName)?.id
    : null;

  return {
    currentProjectName,
    currentProjectId,
    projects,
  };
}
