"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea"; // Import Textarea

import type { Workspace } from "@prisma/client"; // Import type if needed

// Define Zod schema for form validation
const workspaceFormSchema = z.object({
  name: z.string().min(1, { message: "Workspace name is required." }),
  description: z.string().optional(),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

interface WorkspaceFormProps {
  // Pass initial data for editing, null/undefined for creation
  initialData?: Partial<Workspace> | null;
  // Callback function when form is submitted successfully
  onSubmit: (values: WorkspaceFormValues) => void | Promise<void>;
  // Optional: Text for the submit button
  submitButtonText?: string;
  isSubmitting?: boolean; // To disable button during submission
}

export const WorkspaceForm: React.FC<WorkspaceFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText = initialData ? "Save Changes" : "Create Workspace",
  isSubmitting = false,
}) => {
  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    // Optionally reset form after successful submission
    // if (!initialData) { // Reset only for create form
    //   form.reset();
    // }
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
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Marketing Team" {...field} />
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
                  placeholder="Describe the purpose of this workspace..."
                  className="resize-none" // Optional: prevent resizing
                  {...field}
                  value={field.value ?? ""} // Keep this handling
                />
              </FormControl>
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
