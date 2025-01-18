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
  const workspaces = await api.workspace.getAll();
  const workspace = workspaces.find(
    (w: Workspace) => w.name === params.workspace,
  );

  if (!workspace) {
    notFound();
  }

  const projects = await api.project.getAll();
  const project = projects.find(
    (p: Project) => p.name === params.project && p.workspaceId === workspace.id,
  );

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500">Workspace: {workspace.name}</p>
      </div>
      <TaskList workspaceId={workspace.id} projectId={project.id} />
    </div>
  );
}
