"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

type EditMetadataFormData = {
  value: string;
};

type EditableMetadataValueProps = {
  date: Date;
  metadataKey: string;
  value: string;
};

export const EditableMetadataValue = ({
  date,
  metadataKey,
  value,
}: EditableMetadataValueProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { currentWorkspaceId: workspaceId } = useCurrentProject();

  const form = useForm<EditMetadataFormData>({
    defaultValues: {
      value: value,
    },
  });

  const upsertMutation = api.timeBlock.upsertTimeBlockDayMeta.useMutation();
  const deleteMutation = api.timeBlock.deleteTimeBlockDayMeta.useMutation();

  if (!workspaceId) {
    return null;
  }

  const handleSubmit = async (data: EditMetadataFormData) => {
    await upsertMutation.mutateAsync({
      workspaceId,
      date,
      key: metadataKey,
      value: data.value,
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate({
      workspaceId,
      date,
      key: metadataKey,
    });
    setIsEditing(false);
  };

  const handleBooleanChange = (checked: boolean) => {
    upsertMutation.mutate({
      workspaceId,
      date,
      key: metadataKey,
      value: checked.toString(),
    });
  };

  const isBooleanValue = (val: string) =>
    val.toLowerCase() === "true" || val.toLowerCase() === "false";

  if (isBooleanValue(value)) {
    return (
      <Checkbox
        checked={value.toLowerCase() === "true"}
        onCheckedChange={handleBooleanChange}
      />
    );
  }

  return (
    <>
      <button onClick={() => setIsEditing(true)} className="hover:underline">
        {value}
      </button>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {metadataKey}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" autoFocus />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
