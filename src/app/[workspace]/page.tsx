import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { CreateProjectButton } from "~/components/CreateProjectButton";
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
    <div className="container mx-auto">
      <div className="mb-6 flex items-center">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <CreateProjectButton workspaceId={workspace.id} />
      </div>
      <TaskList workspaceId={workspace.id} projectId={null} />
    </div>
  );
}
