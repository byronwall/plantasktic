"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"; // Import Dialog
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useToast } from "~/hooks/use-toast"; // Import toast
import { api } from "~/trpc/react"; // Import tRPC API

import { ConfirmationDialog } from "./ConfirmationDialog"; // Import confirmation dialog
import { WorkspaceForm } from "./WorkspaceForm"; // Import form

import type { Workspace } from "@prisma/client";

// Define the props for the WorkspaceTable component
interface WorkspaceTableProps {
  data: Workspace[];
  isLoading: boolean;
  // Add refetch function to update data after mutations
  refetchWorkspaces: () => void;
}

export const WorkspaceTable: React.FC<WorkspaceTableProps> = ({
  data,
  isLoading,
  refetchWorkspaces,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isConfirmDeleteDialogOpen, setConfirmDeleteDialogOpen] =
    useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(
    null,
  );
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(
    null,
  );

  const { toast } = useToast();
  const utils = api.useUtils();

  // --- tRPC Mutations ---
  const deleteWorkspaceMutation = api.workspace.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workspace deleted successfully.",
      });
      // Invalidate queries to refetch data
      void utils.workspace.getAll.invalidate();
      void utils.project.getAll.invalidate(); // Invalidate projects too, as they might have been unassigned
      refetchWorkspaces(); // Explicitly call refetch passed as prop
      setWorkspaceToDelete(null); // Clear selection
      setConfirmDeleteDialogOpen(false); // Close dialog
    },
    onError: (error) => {
      toast({
        title: "Error deleting workspace",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
      setWorkspaceToDelete(null); // Clear selection
      setConfirmDeleteDialogOpen(false); // Close dialog
    },
  });

  const updateWorkspaceMutation = api.workspace.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workspace updated successfully.",
      });
      void utils.workspace.getAll.invalidate();
      refetchWorkspaces();
      setWorkspaceToEdit(null);
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating workspace",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // --- Event Handlers ---
  const handleDeleteClick = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (workspaceToDelete) {
      deleteWorkspaceMutation.mutate({ workspaceId: workspaceToDelete.id });
    }
  };

  const handleEditClick = (workspace: Workspace) => {
    setWorkspaceToEdit(workspace);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (values: {
    name?: string;
    description?: string | null;
  }) => {
    if (!workspaceToEdit) {
      return;
    }
    updateWorkspaceMutation.mutate({
      workspaceId: workspaceToEdit.id,
      name: values.name,
      description: values.description,
    });
  };

  // --- Table Columns Definition ---
  const columns: ColumnDef<Workspace>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
    // TODO: Add column for Project Count using the 'stats' endpoint if needed
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const workspace = row.original;
        return (
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(workspace)}
              title="Edit Workspace"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(workspace)}
              title="Delete Workspace"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // --- React Table Instance ---
  const table = useReactTable({
    data: data ?? [], // Use data passed in props
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
    return <div>Loading workspaces...</div>; // Add a proper spinner/skeleton later
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
                No workspaces found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
          </DialogHeader>
          {workspaceToEdit && (
            <WorkspaceForm
              initialData={workspaceToEdit}
              onSubmit={handleEditSubmit}
              isSubmitting={updateWorkspaceMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDeleteDialogOpen}
        onOpenChange={setConfirmDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={`Delete Workspace: ${workspaceToDelete?.name ?? ""}?`}
        description="This will remove the workspace and unassign all its projects. This action cannot be undone."
        confirmText="Delete"
        confirmButtonVariant="destructive"
      />
    </div>
  );
};
