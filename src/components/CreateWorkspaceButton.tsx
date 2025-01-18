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

export function CreateWorkspaceButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const createWorkspaceMutation = api.workspace.create.useMutation({
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
        className="w-full justify-start p-4"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Workspace
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  void createWorkspaceMutation.mutate({ name: name.trim() });
                }
              }}
            />
            <Button
              onClick={() => {
                if (name.trim()) {
                  void createWorkspaceMutation.mutate({ name: name.trim() });
                }
              }}
            >
              Create Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
