import Link from "next/link";
import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { CreateProjectButton } from "~/components/CreateProjectButton";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";

import type { Project, Workspace } from "@prisma/client";

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

  const projects = await api.project.getAll();
  const workspaceProjects = projects.filter(
    (p: Project) => p.workspaceId === workspace.id,
  );

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold">{workspace.name}</h1>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3">
          {workspaceProjects.map((project) => (
            <Link key={project.id} href={`/${workspace.name}/${project.name}`}>
              <Button
                variant="outline"
                className="h-full w-full justify-start text-wrap p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                </div>
              </Button>
            </Link>
          ))}
          <CreateProjectButton workspaceId={workspace.id} />
        </div>
      </div>
      <TaskList workspaceId={workspace.id} projectId={null} />
    </div>
  );
}
