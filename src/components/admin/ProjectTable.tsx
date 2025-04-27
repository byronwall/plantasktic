"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Edit, Move, Trash2 } from "lucide-react"; // Add Move icon
import React, { useMemo, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
// Import Select components for moving projects
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

import { ConfirmationDialog } from "./ConfirmationDialog";
import { ProjectForm } from "./ProjectForm";

import type { Project, Workspace } from "@prisma/client";

// Define the props for the ProjectTable component
interface ProjectTableProps {
  data: (Project & { workspace: Workspace | null })[]; // Expect projects with workspace data
  isLoading: boolean;
  workspaces: Pick<Workspace, "id" | "name">[]; // List of available workspaces for moving/editing
  refetchProjects: () => void;
}

const UNASSIGNED_VALUE = "__UNASSIGNED__"; // Define constant for clarity

export const ProjectTable: React.FC<ProjectTableProps> = ({
  data,
  isLoading,
  workspaces,
  refetchProjects,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isConfirmDeleteDialogOpen, setConfirmDeleteDialogOpen] =
    useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isMoveDialogOpen, setMoveDialogOpen] = useState(false);
  const [projectToMove, setProjectToMove] = useState<Project | null>(null);
  const [targetWorkspaceId, setTargetWorkspaceId] =
    useState<string>(UNASSIGNED_VALUE);

  const { toast } = useToast();
  const utils = api.useUtils();

  // --- tRPC Mutations ---
  const deleteProjectMutation = api.project.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Project deleted successfully." });
      void utils.project.getAll.invalidate(); // Invalidate projects
      // Potentially invalidate workspace stats if they exist
      // void utils.workspace.stats.invalidate();
      refetchProjects();
      setProjectToDelete(null);
      setConfirmDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting project",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
      setProjectToDelete(null);
      setConfirmDeleteDialogOpen(false);
    },
  });

  const updateProjectMutation = api.project.update.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Project updated successfully." });
      void utils.project.getAll.invalidate();
      refetchProjects();
      setProjectToEdit(null);
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating project",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // Mutation for moving a single project (using batchUpdateWorkspace for simplicity)
  const moveProjectMutation = api.project.batchUpdateWorkspace.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Project moved successfully." });
      void utils.project.getAll.invalidate();
      void utils.workspace.getAll.invalidate(); // Also refetch workspaces if stats change
      refetchProjects();
      setProjectToMove(null);
      setMoveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error moving project",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // --- Event Handlers ---
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate({ projectId: projectToDelete.id });
    }
  };

  const handleEditClick = (project: Project) => {
    setProjectToEdit(project);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (values: {
    name?: string;
    description?: string | null;
    workspaceId?: string;
  }) => {
    if (!projectToEdit) {
      return;
    }
    updateProjectMutation.mutate({
      projectId: projectToEdit.id,
      name: values.name,
      description: values.description,
      // workspaceId change is handled by move action for clarity
    });
  };

  const handleMoveClick = (project: Project) => {
    setProjectToMove(project);
    setTargetWorkspaceId(project.workspaceId || UNASSIGNED_VALUE);
    setMoveDialogOpen(true);
  };

  const handleConfirmMove = () => {
    if (!projectToMove) {
      return;
    }
    moveProjectMutation.mutate({
      projectIds: [projectToMove.id],
      workspaceId:
        targetWorkspaceId === UNASSIGNED_VALUE ? null : targetWorkspaceId,
    });
  };

  // --- Table Columns Definition ---
  const columns: ColumnDef<Project & { workspace: Workspace | null }>[] =
    useMemo(
      () => [
        {
          accessorKey: "name",
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <div>{row.getValue("name")}</div>,
        },
        {
          accessorKey: "description",
          header: "Description",
          cell: ({ row }) => (
            <div className="max-w-xs truncate">
              {row.getValue("description") || "-"}
            </div>
          ),
        },
        {
          accessorKey: "workspace",
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Workspace
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const workspace = row.original.workspace;
            return (
              <div>
                {workspace?.name || (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
            );
          },
          // Enable sorting by workspace name
          sortingFn: (rowA, rowB, columnId) => {
            const wsA = rowA.original.workspace?.name?.toLowerCase() || "";
            const wsB = rowB.original.workspace?.name?.toLowerCase() || "";
            return wsA.localeCompare(wsB);
          },
        },
        {
          id: "actions",
          header: () => <div className="text-right">Actions</div>,
          cell: ({ row }) => {
            const project = row.original;
            return (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveClick(project)}
                  title="Move Project"
                >
                  <Move className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(project)}
                  title="Edit Project"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(project)}
                  title="Delete Project"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          },
        },
      ],
      [workspaces],
    ); // Re-run memoization if workspaces list changes (though unlikely here)

  // --- React Table Instance ---
  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // --- Render Logic ---
  if (isLoading) {
    return <div>Loading projects...</div>; // Add spinner/skeleton later
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No projects found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {projectToEdit && (
            <ProjectForm
              initialData={projectToEdit}
              workspaces={workspaces} // Pass available workspaces
              onSubmit={handleEditSubmit}
              isSubmitting={updateProjectMutation.isPending}
              // Exclude workspaceId from this form maybe? Or make it read-only?
              // For now, it allows changing workspace here too, but move is separate action.
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Move Project Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Project: {projectToMove?.name ?? ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="targetWorkspace">Select Target Workspace</Label>
            <Select
              value={targetWorkspaceId}
              onValueChange={setTargetWorkspaceId}
            >
              <SelectTrigger id="targetWorkspace">
                <SelectValue placeholder="Select workspace..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>
                  -- Unassigned --
                </SelectItem>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleConfirmMove}
              disabled={moveProjectMutation.isPending}
            >
              {moveProjectMutation.isPending ? "Moving..." : "Confirm Move"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDeleteDialogOpen}
        onOpenChange={setConfirmDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={`Delete Project: ${projectToDelete?.name ?? ""}?`}
        description="This action cannot be undone."
        confirmText="Delete"
        confirmButtonVariant="destructive"
      />
    </div>
  );
};
