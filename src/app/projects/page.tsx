"use client";

import Link from "next/link";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export default function ProjectsPage() {
  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState("");

  const { data: projects, refetch } = api.task.getProjects.useQuery();
  const deleteProject = api.task.deleteProject.useMutation({
    onSuccess: () => void refetch(),
  });
  const renameProject = api.task.renameProject.useMutation({
    onSuccess: () => {
      void refetch();
      setEditingProject(null);
    },
  });

  const handleDelete = (projectId: string) => {
    if (
      confirm("Are you sure you want to delete this project and all its tasks?")
    ) {
      void deleteProject.mutate({ projectId });
    }
  };

  const handleRename = () => {
    if (editingProject && newName.trim()) {
      void renameProject.mutate({
        projectId: editingProject.id,
        name: newName.trim(),
      });
      setNewName("");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Projects</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>
                <Link
                  href={`/project/${project.name}`}
                  className="hover:text-blue-500"
                >
                  {project.name}
                </Link>
              </CardTitle>
              {project.description && (
                <CardDescription>{project.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingProject(project);
                    setNewName(project.name);
                  }}
                >
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(project.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={editingProject !== null}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewName(e.target.value)
                }
                placeholder="New project name"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingProject(null);
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
    </div>
  );
}
