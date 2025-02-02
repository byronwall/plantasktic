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
import { api } from "~/trpc/react";

type EditMetadataFormData = {
  value: string;
};

type EditableMetadataValueProps = {
  metadataKey: string;
  value: string;
  id: string;
};

export const EditableMetadataValue = ({
  metadataKey,
  value,
  id,
}: EditableMetadataValueProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<EditMetadataFormData>({
    defaultValues: {
      value: value,
    },
  });

  const upsertMutation = api.timeBlock.upsertTimeBlockDayMeta.useMutation();
  const deleteMutation = api.timeBlock.deleteTimeBlockDayMeta.useMutation();

  const handleSubmit = async (data: EditMetadataFormData) => {
    await upsertMutation.mutateAsync({
      id,
      value: data.value,
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate({
      id,
    });
    setIsEditing(false);
  };

  const handleBooleanChange = (checked: boolean) => {
    upsertMutation.mutate({
      id,
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
