import Avatar from "boring-avatars";
import { useState } from "react";

import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

import { SimpleMarkdown } from "./SimpleMarkdown";

type TaskTitleProps = {
  taskId: number;
  title: string;
};

export function TaskTitle({ taskId, title }: TaskTitleProps) {
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
      className="max-w-2xl shrink flex-grow-[6] basis-[600px] [overflow-wrap:anywhere]"
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
          <Avatar
            name={title}
            colors={["#49007e", "#ff7d10", "#ffb238"]}
            variant="marble"
            size={24}
            className="shrink-0"
          />

          <SimpleMarkdown text={title} />
        </div>
      )}
    </div>
  );
}
