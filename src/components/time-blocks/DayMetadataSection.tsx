"use client";

import { format } from "date-fns";
import { Plus, X } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

type DayMetadataItem = {
  id: string;
  date: Date;
  key: string;
  value: string;
  created_at: Date;
  updated_at: Date;
  workspaceId: string;
};

type DayMetadataProps = {
  workspaceId: string;
  date: Date;
  metadata: DayMetadataItem[];
};

type MetadataFormData = {
  key: string;
  value: string;
};

type EditMetadataFormData = {
  value: string;
};

export function DayMetadataSection({
  workspaceId,
  date,
  metadata,
}: DayMetadataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMetadata, setEditingMetadata] =
    useState<DayMetadataItem | null>(null);

  const form = useForm<MetadataFormData>({
    defaultValues: {
      key: "",
      value: "",
    },
  });

  const editForm = useForm<EditMetadataFormData>({
    defaultValues: {
      value: "",
    },
  });

  const upsertMutation = api.timeBlock.upsertTimeBlockDayMeta.useMutation();
  const deleteMutation = api.timeBlock.deleteTimeBlockDayMeta.useMutation();

  const onSubmit = async (data: MetadataFormData) => {
    await upsertMutation.mutateAsync({
      workspaceId,
      date,
      key: data.key,
      value: data.value,
    });

    form.reset();
    setIsOpen(false);
  };

  const handleDelete = (key: string) => {
    deleteMutation.mutate({
      workspaceId,
      date,
      key,
    });
    setEditingMetadata(null);
  };

  const handleBooleanChange = (key: string, checked: boolean) => {
    upsertMutation.mutate({
      workspaceId,
      date,
      key,
      value: checked.toString(),
    });
  };

  const handleEditSubmit = async (data: EditMetadataFormData) => {
    if (!editingMetadata) {
      return;
    }

    await upsertMutation.mutateAsync({
      workspaceId,
      date,
      key: editingMetadata.key,
      value: data.value,
    });

    setEditingMetadata(null);
  };

  const handleEditClick = (item: DayMetadataItem) => {
    setEditingMetadata(item);
    editForm.reset({ value: item.value });
  };

  const shutdownValue =
    metadata.find((item) => item.key === "shutdown")?.value === "true";

  const isBooleanValue = (value: string) =>
    value.toLowerCase() === "true" || value.toLowerCase() === "false";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{format(date, "EEE MMM d")}</div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-medium">Add Metadata</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., mood, energy, focus"
                          autoComplete="off"
                          autoFocus
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter value"
                          autoComplete="off"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? "Adding..." : "Add Metadata"}
                </Button>
              </form>
            </Form>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="shutdown"
          checked={shutdownValue}
          onCheckedChange={(checked: boolean) =>
            handleBooleanChange("shutdown", checked)
          }
        />
        <label
          htmlFor="shutdown"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Shutdown
        </label>
      </div>
      <div
        className={cn(
          "space-y-1.5",
          metadata.length === 0 && "rounded-md border border-dashed p-2",
        )}
      >
        {metadata.length > 0 &&
          metadata
            .filter((item) => item.key !== "shutdown")
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.key}:</span>
                  {isBooleanValue(item.value) ? (
                    <Checkbox
                      checked={item.value.toLowerCase() === "true"}
                      onCheckedChange={(checked: boolean) =>
                        handleBooleanChange(item.key, checked)
                      }
                    />
                  ) : (
                    <button
                      onClick={() => handleEditClick(item)}
                      className="hover:underline"
                    >
                      {item.value}
                    </button>
                  )}
                </div>
              </div>
            ))}
      </div>

      <Dialog
        open={!!editingMetadata}
        onOpenChange={() => setEditingMetadata(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingMetadata?.key}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
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
                  onClick={() =>
                    editingMetadata && handleDelete(editingMetadata.key)
                  }
                >
                  Delete
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
