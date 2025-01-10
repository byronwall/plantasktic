import { Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";

import { ProjectActions } from "~/app/_components/ProjectActions";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/react";

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
  const createProject = api.project.create.useMutation();

  return (
    <Card className="max-w-md">
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
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(workspace.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                const name = prompt("Enter project name:");
                if (name) {
                  void createProject.mutate({
                    name,
                    workspaceId: workspace.id,
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
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
                <div className="flex items-center gap-2">
                  <ProjectActions
                    project={project}
                    variant="outline"
                    size="sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveProject(project.id)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
