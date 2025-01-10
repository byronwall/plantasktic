"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { CreateWorkspaceDialog } from "~/app/_components/CreateWorkspaceDialog";
import { RenameWorkspaceDialog } from "~/app/_components/RenameWorkspaceDialog";
import { UnassignedProjects } from "~/app/_components/UnassignedProjects";
import { WorkspaceCard } from "~/app/_components/WorkspaceCard";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

import type { Project, Workspace } from "@prisma/client";

interface WorkspaceWithProjects extends Workspace {
  projects: Project[];
}

export default function WorkspacesPage() {
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [newName, setNewName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");

  const { data: workspaces = [] } = api.workspace.getAll.useQuery();
  const { data: projects = [] } = api.project.getAll.useQuery();

  const createWorkspace = api.workspace.create.useMutation({
    onSuccess: () => {
      setIsCreatingWorkspace(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
    },
  });

  const deleteWorkspace = api.workspace.delete.useMutation();

  const renameWorkspace = api.workspace.rename.useMutation({
    onSuccess: () => {
      setEditingWorkspace(null);
    },
  });

  const assignProject = api.workspace.assignProject.useMutation();

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
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onRename={setEditingWorkspace}
            onDelete={handleDelete}
            onRemoveProject={(projectId) =>
              handleAssignProject(projectId, null)
            }
          />
        ))}

        {unassignedProjects.length > 0 && (
          <UnassignedProjects
            projects={unassignedProjects}
            workspaces={workspaces}
            onAssignProject={handleAssignProject}
          />
        )}
      </div>

      <RenameWorkspaceDialog
        workspace={editingWorkspace}
        newName={newName}
        onNewNameChange={setNewName}
        onClose={() => {
          setEditingWorkspace(null);
          setNewName("");
        }}
        onRename={handleRename}
      />

      <CreateWorkspaceDialog
        isOpen={isCreatingWorkspace}
        name={newWorkspaceName}
        description={newWorkspaceDescription}
        onNameChange={setNewWorkspaceName}
        onDescriptionChange={setNewWorkspaceDescription}
        onClose={() => {
          setIsCreatingWorkspace(false);
          setNewWorkspaceName("");
          setNewWorkspaceDescription("");
        }}
        onCreate={handleCreateWorkspace}
      />
    </div>
  );
}
