"use client";

import { PlusCircle, X } from "lucide-react";
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
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

import { ProjectForm } from "./ProjectForm";
import { ProjectTable } from "./ProjectTable";

import type { Workspace } from "@prisma/client";

const ALL_WORKSPACES_VALUE = "__ALL__"; // Constant for filter

export const ProjectAdminPanel = () => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const utils = api.useUtils();

  // Use the constant for the "All" filter state
  const [filterWorkspaceId, setFilterWorkspaceId] =
    useState<string>(ALL_WORKSPACES_VALUE);

  // --- tRPC Queries and Mutations ---
  const { data: workspacesData, isLoading: isLoadingWorkspaces } =
    api.workspace.getAll.useQuery();

  const {
    data: projects,
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = api.project.getAll.useQuery(
    // Pass undefined if filter is the special "ALL" value
    {
      workspaceId:
        filterWorkspaceId === ALL_WORKSPACES_VALUE
          ? undefined
          : filterWorkspaceId,
    },
    { enabled: !!workspacesData },
  );

  const createProjectMutation = api.project.create.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Project created successfully." });
      // Adjust invalidate logic for the filter constant
      void utils.project.getAll.invalidate({
        workspaceId:
          filterWorkspaceId === ALL_WORKSPACES_VALUE
            ? undefined
            : filterWorkspaceId,
      });
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating project",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // --- Event Handlers ---
  const handleCreateSubmit = async (values: {
    name: string;
    description?: string;
    workspaceId: string;
  }) => {
    createProjectMutation.mutate(values);
  };

  const handleFilterChange = (value: string) => {
    setFilterWorkspaceId(value);
  };

  const availableWorkspaces = (workspacesData ?? []).filter(
    (ws): ws is Workspace => !!ws,
  ) as Pick<Workspace, "id" | "name">[];

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            Manage projects here. Assign them to workspaces, edit, or delete.
          </CardDescription>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-[180px] items-center gap-1.5">
            <Label
              htmlFor="project-ws-filter"
              className="whitespace-nowrap text-xs"
            >
              Filter by Workspace:
            </Label>
            <Select
              value={filterWorkspaceId}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger id="project-ws-filter" className="h-8 flex-grow">
                <SelectValue placeholder="All Workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_WORKSPACES_VALUE}>
                  All Workspaces
                </SelectItem>
                {availableWorkspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterWorkspaceId !== ALL_WORKSPACES_VALUE && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleFilterChange(ALL_WORKSPACES_VALUE)}
                title="Clear filter"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={
                  !availableWorkspaces ||
                  availableWorkspaces.length === 0 ||
                  isLoadingWorkspaces
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              {availableWorkspaces && availableWorkspaces.length > 0 ? (
                <ProjectForm
                  workspaces={availableWorkspaces}
                  onSubmit={handleCreateSubmit}
                  isSubmitting={createProjectMutation.isPending}
                  submitButtonText="Create Project"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cannot create a project because no workspaces exist.
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ProjectTable
          data={projects ?? []}
          isLoading={isLoadingProjects || isLoadingWorkspaces}
          workspaces={availableWorkspaces}
          refetchProjects={refetchProjects}
        />
      </CardContent>
    </Card>
  );
};
