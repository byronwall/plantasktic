import { zodResolver } from "@hookform/resolvers/zod";
import { type Goal, type GoalProgress } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const progressSchema = z.object({
  value: z.number().min(0, "Value must be positive"),
  notes: z.string().optional(),
});

type ProgressSchema = z.infer<typeof progressSchema>;

interface GoalProgressProps {
  goal: Goal & { progress: GoalProgress[] };
  onProgressAdded: () => void;
}

export function GoalProgressDialog({
  goal,
  onProgressAdded,
}: GoalProgressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addProgress = api.goal.addProgress.useMutation({
    onSuccess: () => {
      onProgressAdded();
      setIsOpen(false);
      form.reset();
    },
  });

  const form = useForm<ProgressSchema>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      value: 0,
      notes: "",
    },
  });

  const onSubmit = async (data: ProgressSchema) => {
    setIsSubmitting(true);
    try {
      await addProgress.mutateAsync({
        goalId: goal.id,
        ...data,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = goal.progress
    .map((p) => ({
      date: new Date(p.date).toLocaleDateString(),
      value: p.value,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add Progress
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Goal Progress</DialogTitle>
        </DialogHeader>

        {goal.targetValue && (
          <div className="mb-4">
            <h4 className="mb-2 font-medium">Progress Overview</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, goal.targetValue]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter progress value"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this progress update"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Progress"}
              </Button>
            </div>
          </form>
        </Form>

        {goal.progress.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 font-medium">Progress History</h4>
            <div className="max-h-[200px] space-y-2 overflow-y-auto">
              {goal.progress
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {p.value} {goal.metricUnit}
                      </span>
                      {p.notes && (
                        <p className="mt-1 text-muted-foreground">{p.notes}</p>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(p.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
