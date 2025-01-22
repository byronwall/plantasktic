"use client";

import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
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

export function DayMetadataSection({
  workspaceId,
  date,
  metadata,
}: DayMetadataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<MetadataFormData>({
    defaultValues: {
      key: "",
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
  };

  const handleShutdownChange = (checked: boolean) => {
    upsertMutation.mutate({
      workspaceId,
      date,
      key: "shutdown",
      value: checked.toString(),
    });
  };

  const shutdownValue =
    metadata.find((item) => item.key === "shutdown")?.value === "true";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{format(date, "EEE MMM d")}</div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger>
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
          onCheckedChange={handleShutdownChange}
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
        {metadata.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No metadata added
          </p>
        ) : (
          metadata
            .filter((item) => item.key !== "shutdown")
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.key}:</span>
                  <span>{item.value}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDelete(item.key)}
                  disabled={deleteMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
