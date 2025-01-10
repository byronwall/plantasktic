import Link from "next/link";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import type { Project, Workspace } from "@prisma/client";

interface WorkspaceWithProjects extends Workspace {
  projects: Project[];
}

interface WorkspaceCardProps {
  workspace: WorkspaceWithProjects;
  onRename: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  onRemoveProject: (projectId: string) => void;
}

export function WorkspaceCard({
  workspace,
  onRename,
  onDelete,
  onRemoveProject,
}: WorkspaceCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{workspace.name}</CardTitle>
            {workspace.description && (
              <CardDescription>{workspace.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRename(workspace)}
            >
              Rename
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(workspace.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {workspace.projects.length === 0 ? (
            <p className="text-gray-500">No projects in this workspace</p>
          ) : (
            workspace.projects.map((project: Project) => (
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveProject(project.id)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
