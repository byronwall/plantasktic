"use client";

import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { useCurrentProject } from "~/hooks/useCurrentProject";

export default function ProjectPage() {
  const {
    currentWorkspace,
    currentProject,
    isInvalidWorkspace,
    isInvalidProject,
  } = useCurrentProject();

  if (
    isInvalidWorkspace ||
    isInvalidProject ||
    !currentWorkspace ||
    !currentProject
  ) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{currentProject.name}</h1>
        <p className="text-gray-500">Workspace: {currentWorkspace.name}</p>
      </div>
      <TaskList
        workspaceId={currentWorkspace.id}
        projectId={currentProject.id}
      />
    </div>
  );
}
