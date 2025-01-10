import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

import type { Project } from "@prisma/client";

interface ProjectActionsProps {
  project: Project;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

export function ProjectActions({
  project,
  variant = "default",
  size = "default",
}: ProjectActionsProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      // cleanup handled by global refresh
    },
  });

  const renameProject = api.project.rename.useMutation({
    onSuccess: () => {
      setIsRenaming(false);
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject.mutate({ projectId: project.id });
    }
  };

  const handleRename = () => {
    if (newName.trim() && newName !== project.name) {
      renameProject.mutate({
        projectId: project.id,
        name: newName.trim(),
      });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size={size}
          variant={variant}
          onClick={() => setIsRenaming(true)}
          title="Rename Project"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size={size}
          variant="destructive"
          onClick={handleDelete}
          title="Delete Project"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for the project
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenaming(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
