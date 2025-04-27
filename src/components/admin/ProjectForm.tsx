"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"; // Import Select for workspace
import { Textarea } from "~/components/ui/textarea";

import type { Project, Workspace } from "@prisma/client";

// Zod schema for project form validation
const projectFormSchema = z.object({
  name: z.string().min(1, { message: "Project name is required." }),
  description: z.string().optional(),
  // workspaceId is required for creation, potentially optional for update?
  // For simplicity, let's make it required for now in the form itself.
  // Logic for moving projects (changing workspaceId) can be handled separately or via update.
  workspaceId: z
    .string()
    .min(1, { message: "Workspace assignment is required." }),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  initialData?: Partial<Project> | null;
  // Provide list of workspaces for the select dropdown
  workspaces: Pick<Workspace, "id" | "name">[];
  onSubmit: (values: ProjectFormValues) => void | Promise<void>;
  submitButtonText?: string;
  isSubmitting?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  workspaces,
  onSubmit,
  submitButtonText = initialData ? "Save Changes" : "Create Project",
  isSubmitting = false,
}) => {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      workspaceId: initialData?.workspaceId || "", // Initialize with current or empty
    },
  });

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    // if (!initialData) { form.reset(); } // Optional reset
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleFormSubmit}
        className="space-y-6"
        autoComplete="off"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Q3 Campaign Launch" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe this project..."
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""} // Handle null/undefined
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workspaceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Assign this project to a workspace.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitButtonText}
        </Button>
      </form>
    </Form>
  );
};
