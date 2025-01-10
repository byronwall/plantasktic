import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

import { ComboBox } from "./ComboBox";

import type { Project, Workspace } from "@prisma/client";

interface UnassignedProjectsProps {
  projects: Project[];
  workspaces: Workspace[];
  onAssignProject: (projectId: string, workspaceId: string) => void;
}

export function UnassignedProjects({
  projects,
  workspaces,
  onAssignProject,
}: UnassignedProjectsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unassigned Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projects.length === 0 ? (
            <p className="text-gray-500">No unassigned projects</p>
          ) : (
            projects.map((project: Project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded border border-gray-200 p-3"
              >
                <div>
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
                <ComboBox
                  options={workspaces.map((w) => w.name)}
                  value=""
                  onChange={(workspaceName) => {
                    const workspace = workspaces.find(
                      (w) => w.name === workspaceName,
                    );
                    if (workspace) {
                      onAssignProject(project.id, workspace.id);
                    }
                  }}
                  placeholder="Assign to workspace..."
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
