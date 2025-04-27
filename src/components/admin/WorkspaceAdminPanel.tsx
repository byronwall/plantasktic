"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";

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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react"; // Import tRPC API

import { WorkspaceForm } from "./WorkspaceForm";
import { WorkspaceTable } from "./WorkspaceTable";

export const WorkspaceAdminPanel = () => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const utils = api.useUtils();

  // --- tRPC Queries and Mutations ---
  const {
    data: workspaces,
    isLoading,
    refetch,
  } = api.workspace.getAll.useQuery();

  const createWorkspaceMutation = api.workspace.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workspace created successfully.",
      });
      void utils.workspace.getAll.invalidate(); // Invalidate to refetch
      setCreateDialogOpen(false); // Close dialog
    },
    onError: (error) => {
      toast({
        title: "Error creating workspace",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // --- Event Handlers ---
  const handleCreateSubmit = async (values: {
    name: string;
    description?: string;
  }) => {
    createWorkspaceMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1.5">
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>
            Manage your workspaces here. Create, edit, or delete them.
          </CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
            </DialogHeader>
            <WorkspaceForm
              onSubmit={handleCreateSubmit}
              isSubmitting={createWorkspaceMutation.isPending}
              submitButtonText="Create Workspace"
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <WorkspaceTable
          data={workspaces ?? []}
          isLoading={isLoading}
          refetchWorkspaces={refetch}
        />
      </CardContent>
    </Card>
  );
};
