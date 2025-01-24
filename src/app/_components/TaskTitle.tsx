import { useState } from "react";

import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

import { SimpleMarkdown } from "./SimpleMarkdown";
import { TaskAvatar } from "./TaskAvatar";

type TaskTitleProps = {
  taskId: number;
  title: string;
  isReadOnly?: boolean;
};

export function TaskTitle({
  taskId,
  title,
  isReadOnly = false,
}: TaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(title);

  const updateTask = api.task.updateTask.useMutation();

  const handleEditKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editText.trim()) {
        await updateTask.mutateAsync({
          taskId,
          data: { title: editText },
        });
        setIsEditing(false);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(title);
    }
  };

  const startEditing = () => {
    if (isReadOnly) {
      return;
    }
    setIsEditing(true);
    setEditText(title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setEditText(title);
  };

  return (
    <div
      onClick={startEditing}
      className={`max-w-2xl shrink flex-grow-[6] basis-[600px] [overflow-wrap:anywhere] ${!isReadOnly ? "cursor-pointer" : ""}`}
    >
      {isEditing ? (
        <Textarea
          value={editText}
          ref={(textarea) => {
            if (textarea) {
              textarea.style.height = "0px";
              textarea.style.height = textarea.scrollHeight + "px";
            }
          }}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleEditKeyPress}
          onBlur={handleBlur}
          className="w-full"
          autoFocus
        />
      ) : (
        <div className="flex items-center gap-2">
          <TaskAvatar title={title} />
          <SimpleMarkdown text={title} />
        </div>
      )}
    </div>
  );
}
