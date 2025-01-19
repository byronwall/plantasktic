import { zodResolver } from "@hookform/resolvers/zod";
import { type Goal, type GoalComment, type User } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

type CommentSchema = z.infer<typeof commentSchema>;

interface GoalCommentsProps {
  goal: Goal & { comments: (GoalComment & { user: User })[] };
  onCommentAdded: () => void;
}

export function GoalCommentsDialog({
  goal,
  onCommentAdded,
}: GoalCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addComment = api.goal.addComment.useMutation({
    onSuccess: () => {
      onCommentAdded();
      setIsOpen(false);
      form.reset();
    },
  });

  const form = useForm<CommentSchema>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CommentSchema) => {
    setIsSubmitting(true);
    try {
      await addComment.mutateAsync({
        goalId: goal.id,
        ...data,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add Comment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Goal Comments</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your comment..."
                      className="min-h-[100px]"
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
                {isSubmitting ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </form>
        </Form>

        {goal.comments.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 font-medium">Comment History</h4>
            <div className="max-h-[300px] space-y-4 overflow-y-auto">
              {goal.comments
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {comment.user.image && (
                          <img
                            src={comment.user.image}
                            alt={comment.user.name ?? ""}
                            className="h-6 w-6 rounded-full"
                          />
                        )}
                        <span className="font-medium">
                          {comment.user.name ?? "Anonymous"}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
