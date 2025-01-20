"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { CreateProjectButton } from "~/components/CreateProjectButton";
import { Button } from "~/components/ui/button";
import { useCurrentProject } from "~/hooks/useCurrentProject";

export default function WorkspacePage() {
  const { currentWorkspace, workspaceProjects, isInvalidWorkspace } =
    useCurrentProject();

  if (isInvalidWorkspace || !currentWorkspace) {
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold">{currentWorkspace.name}</h1>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3">
          {workspaceProjects.map((project) => (
            <Link
              key={project.id}
              href={`/${currentWorkspace.name}/${project.name}`}
            >
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
          <CreateProjectButton workspaceId={currentWorkspace.id} />
        </div>
      </div>
      <TaskList workspaceId={currentWorkspace.id} projectId={null} />
    </div>
  );
}
