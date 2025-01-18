import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { api } from "~/trpc/server";

import type { Workspace } from "@prisma/client";

interface WorkspacePageProps {
  params: {
    workspace: string;
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const workspaces = await api.workspace.getAll();
  const workspace = workspaces.find(
    (w: Workspace) => w.name === params.workspace,
  );

  if (!workspace) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">{workspace.name}</h1>
      <TaskList workspaceId={workspace.id} projectId={null} />
    </div>
  );
}
