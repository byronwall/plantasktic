import { useState } from "react";

import { Checkbox } from "~/components/ui/checkbox";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

import { SimpleMarkdown } from "./SimpleMarkdown";
import { TaskActions } from "./TaskActions";
import { TaskCategory } from "./TaskCategory";
import { TaskComments } from "./TaskComments";

type Task = {
  task_id: number;
  title: string;
  status: string;
  category: string | null;
  projectId: string | null;
  comments: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  userId: string | null;
  parentTaskId: number | null;
};

type TaskItemProps = {
  task: Task;
  isSelected: boolean;
  onToggleSelect: (taskId: number) => void;
  copiedTaskId: number | null;
  onCopy: (taskId: number, text: string) => void;
  onDelete: (taskId: number, e: React.MouseEvent) => void;
  onStatusChange: (taskId: number, status: string) => void;
  onMoveToProject: (taskId: number, projectId: string | null) => void;
};

export function TaskItem({
  task,
  isSelected,
  onToggleSelect,
  copiedTaskId,
  onCopy,
  onDelete,
  onStatusChange,
  onMoveToProject,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const updateTaskTextMutation = api.task.updateTaskText.useMutation();

  const handleEditKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editText.trim()) {
        await updateTaskTextMutation.mutateAsync({
          taskId: task.task_id,
          text: editText,
        });
        setIsEditing(false);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(task.title);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditText(task.title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setEditText(task.title);
  };

  return (
    <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-4 py-2 last:border-b-0">
      <div className="flex flex-1 items-center gap-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(task.task_id)}
          className="h-5 w-5"
        />
        <div
          className={`flex flex-1 justify-between gap-1 ${
            task.status === "completed" ? "line-through opacity-50" : ""
          }`}
        >
          <div onClick={startEditing} className="w-full">
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
              <SimpleMarkdown text={task.title} />
            )}
          </div>
          <TaskComments taskId={task.task_id} comments={task.comments} />
        </div>
        <TaskCategory taskId={task.task_id} currentCategory={task.category} />
      </div>
      <TaskActions
        taskId={task.task_id}
        status={task.status}
        projectId={task.projectId}
        copiedTaskId={copiedTaskId}
        onCopy={(taskId) => onCopy(taskId, task.title)}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        onMoveToProject={onMoveToProject}
      />
    </div>
  );
}
