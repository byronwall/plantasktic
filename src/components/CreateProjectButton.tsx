"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

interface CreateProjectButtonProps {
  workspaceId: string;
}

export function CreateProjectButton({ workspaceId }: CreateProjectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const createProjectMutation = api.task.createProject.useMutation({
    onSuccess: () => {
      setIsOpen(false);
      setName("");
      window.location.reload();
    },
  });

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  void createProjectMutation.mutate({
                    name: name.trim(),
                    workspaceId,
                  });
                }
              }}
            />
            <Button
              onClick={() => {
                if (name.trim()) {
                  void createProjectMutation.mutate({
                    name: name.trim(),
                    workspaceId,
                  });
                }
              }}
            >
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
