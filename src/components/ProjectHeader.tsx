"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

interface ProjectHeaderProps {
  workspaceName: string;
  projectId: string;
}

export const ProjectHeader = ({
  workspaceName,
  projectId,
}: ProjectHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const { data: project, isLoading } = api.project.getById.useQuery({
    projectId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name ?? "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({ name: project.name });
    }
  }, [project]);

  const { mutate: renameProject } = api.project.rename.useMutation({
    onSuccess: (_, variables) => {
      setIsEditing(false);
      router.replace(`/${workspaceName}/${variables.name}`);
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.name.trim() === "") {
      return;
    }

    renameProject({ projectId, name: values.name.trim() });
  };

  if (isLoading) {
    return (
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mb-6 space-y-2">
        <div className="text-2xl font-bold text-destructive">
          Project not found
        </div>
        <p className="text-sm text-muted-foreground">
          Workspace: {workspaceName}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-2">
      {isEditing ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex items-center gap-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      className="text-2xl font-bold"
                      autoFocus
                      autoComplete="off"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
          </form>
        </Form>
      ) : (
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Workspace: {workspaceName}
      </p>
    </div>
  );
};
