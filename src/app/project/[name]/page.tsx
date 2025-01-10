"use client";

import { TaskList } from "~/app/_components/TaskList";
import { useCurrentProject } from "~/hooks/useCurrentProject";

export default function ProjectPage() {
  const { currentProjectName } = useCurrentProject();

  return <TaskList projectName={currentProjectName ?? undefined} />;
}
