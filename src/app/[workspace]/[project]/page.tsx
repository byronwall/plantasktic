import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { api } from "~/trpc/server";

import type { Project, Workspace } from "@prisma/client";

interface ProjectPageProps {
  params: {
    workspace: string;
    project: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const decodedWorkspace = decodeURIComponent(params.workspace);
  const decodedProject = decodeURIComponent(params.project);

  const workspaces = await api.workspace.getAll();
  const workspace = workspaces.find(
    (w: Workspace) => w.name === decodedWorkspace,
  );

  if (!workspace) {
    notFound();
  }

  const projects = await api.project.getAll();
  const project = projects.find(
    (p: Project) => p.name === decodedProject && p.workspaceId === workspace.id,
  );

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500">Workspace: {workspace.name}</p>
      </div>
      <TaskList workspaceId={workspace.id} projectId={project.id} />
    </div>
  );
}
