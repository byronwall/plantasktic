import Link from "next/link";

import { api } from "~/trpc/server";

import type { Project, Workspace } from "@prisma/client";

interface WorkspaceWithProjects extends Workspace {
  projects: Project[];
}

export default async function WorkspacesPage() {
  const workspaces = await api.workspace.getAll();
  const projects = await api.project.getAll();

  // Group projects by workspace
  const unassignedProjects = projects.filter((p: Project) => !p.workspaceId);
  const workspaceProjects: WorkspaceWithProjects[] = workspaces.map(
    (workspace: Workspace) => ({
      ...workspace,
      projects: projects.filter((p: Project) => p.workspaceId === workspace.id),
    }),
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-8 text-3xl font-bold">Workspaces</h1>

      <div className="space-y-8">
        {workspaceProjects.map((workspace: WorkspaceWithProjects) => (
          <div key={workspace.id} className="rounded-lg border p-4 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">
              {workspace.name}
              {workspace.description && (
                <span className="ml-2 text-sm text-gray-500">
                  - {workspace.description}
                </span>
              )}
            </h2>
            <div className="space-y-2">
              {workspace.projects.length === 0 ? (
                <p className="text-gray-500">No projects in this workspace</p>
              ) : (
                workspace.projects.map((project: Project) => (
                  <div
                    key={project.id}
                    className="rounded border border-gray-200 p-3"
                  >
                    <Link
                      href={`/project/${project.name}`}
                      className="text-blue-600 hover:underline"
                    >
                      {project.name}
                    </Link>
                    {project.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {project.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Unassigned Projects Section */}
        <div className="rounded-lg border border-dashed p-4">
          <h2 className="mb-4 text-xl font-semibold">Unassigned Projects</h2>
          <div className="space-y-2">
            {unassignedProjects.length === 0 ? (
              <p className="text-gray-500">No unassigned projects</p>
            ) : (
              unassignedProjects.map((project: Project) => (
                <div
                  key={project.id}
                  className="rounded border border-gray-200 p-3"
                >
                  <Link
                    href={`/project/${project.name}`}
                    className="text-blue-600 hover:underline"
                  >
                    {project.name}
                  </Link>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {project.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
