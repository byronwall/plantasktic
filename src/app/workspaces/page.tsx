"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ComboBox } from "~/app/_components/ComboBox";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

import type { Project, Workspace } from "@prisma/client";

interface WorkspaceWithProjects extends Workspace {
  projects: Project[];
}

export default function WorkspacesPage() {
  const [editingWorkspace, setEditingWorkspace] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");

  const { data: workspaces = [], refetch: refetchWorkspaces } =
    api.workspace.getAll.useQuery();
  const { data: projects = [] } = api.project.getAll.useQuery();

  const createWorkspace = api.workspace.create.useMutation({
    onSuccess: () => {
      void refetchWorkspaces();
      setIsCreatingWorkspace(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
    },
  });

  const deleteWorkspace = api.workspace.delete.useMutation({
    onSuccess: () => void refetchWorkspaces(),
  });

  const renameWorkspace = api.workspace.rename.useMutation({
    onSuccess: () => {
      void refetchWorkspaces();
      setEditingWorkspace(null);
    },
  });

  const assignProject = api.workspace.assignProject.useMutation({
    onSuccess: () => void refetchWorkspaces(),
  });

  // Group projects by workspace
  const unassignedProjects = projects.filter((p: Project) => !p.workspaceId);
  const workspaceProjects: WorkspaceWithProjects[] = workspaces.map(
    (workspace: Workspace) => ({
      ...workspace,
      projects: projects.filter((p: Project) => p.workspaceId === workspace.id),
    }),
  );

  const handleDelete = (workspaceId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this workspace? Projects will be unassigned but not deleted.",
      )
    ) {
      void deleteWorkspace.mutate({ workspaceId });
    }
  };

  const handleRename = () => {
    if (editingWorkspace && newName.trim()) {
      void renameWorkspace.mutate({
        workspaceId: editingWorkspace.id,
        name: newName.trim(),
      });
      setNewName("");
    }
  };

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      void createWorkspace.mutate({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim() || undefined,
      });
    }
  };

  const handleAssignProject = (
    projectId: string,
    workspaceId: string | null,
  ) => {
    void assignProject.mutate({
      projectId,
      workspaceId,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <Button onClick={() => setIsCreatingWorkspace(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      <div className="space-y-8">
        {workspaceProjects.map((workspace: WorkspaceWithProjects) => (
          <Card key={workspace.id}>
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
                    onClick={() => {
                      setEditingWorkspace(workspace);
                      setNewName(workspace.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(workspace.id)}
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
                        onClick={() => handleAssignProject(project.id, null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Unassigned Projects Section */}
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedProjects.length === 0 ? (
                <p className="text-gray-500">No unassigned projects</p>
              ) : (
                unassignedProjects.map((project: Project) => (
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
                          handleAssignProject(project.id, workspace.id);
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
      </div>

      {/* Rename Workspace Dialog */}
      <Dialog
        open={editingWorkspace !== null}
        onOpenChange={(open) => !open && setEditingWorkspace(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
          >
            <div className="py-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New workspace name"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingWorkspace(null);
                  setNewName("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Dialog */}
      <Dialog
        open={isCreatingWorkspace}
        onOpenChange={(open) => !open && setIsCreatingWorkspace(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateWorkspace();
            }}
          >
            <div className="space-y-4 py-4">
              <div>
                <Input
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Workspace name"
                />
              </div>
              <div>
                <Input
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="Description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreatingWorkspace(false);
                  setNewWorkspaceName("");
                  setNewWorkspaceDescription("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
