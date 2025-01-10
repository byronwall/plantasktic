"use client";

import { Edit2, MessageSquare } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

interface TaskCommentsProps {
  taskId: number;
  comments?: string | null;
}

export function TaskComments({ taskId, comments }: TaskCommentsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comments ?? "");
  const [isOpen, setIsOpen] = useState(false);

  const utils = api.useUtils();
  const updateCommentsMutation = api.task.updateTaskComments.useMutation({
    onSuccess: () => {
      void utils.task.getTasks.invalidate();
      setIsEditing(false);
    },
  });

  const handleSave = async () => {
    await updateCommentsMutation.mutateAsync({
      taskId,
      comments: editText,
    });
  };

  const commentPreview = comments
    ? comments.split("\n")[0]?.slice(0, 50) +
      (comments.length > 50 ? "..." : "")
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">{commentPreview || "Add comments..."}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Task Comments</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[200px]">
          {isEditing ? (
            <div className="flex flex-col gap-4">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[200px]"
                placeholder="Write your comments in Markdown..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comments ?? "");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => void handleSave()}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{comments ?? ""}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
