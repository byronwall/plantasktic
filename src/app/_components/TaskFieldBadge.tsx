import { format } from "date-fns";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";

import { type Task } from "./TaskList";

interface TaskFieldBadgeProps {
  field: keyof Task;
  value: Task[keyof Task];
  task: Task;
}

export function TaskFieldBadge({ field, value, task }: TaskFieldBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const updateTask = api.task.updateTask.useMutation();

  if (value === null || value === undefined) {
    return null;
  }

  let displayValue: string;

  switch (field) {
    case "created_at":
    case "updated_at":
    case "start_date":
    case "due_date":
      displayValue = value instanceof Date ? format(value, "MMM d, yyyy") : "";
      break;
    case "duration":
      displayValue = typeof value === "number" ? `${value}h` : "";
      break;
    case "status":
    case "priority":
    case "category":
      displayValue = typeof value === "string" ? value : "";
      break;
    case "description":
    case "comments":
      displayValue =
        typeof value === "string"
          ? value.length > 30
            ? value.slice(0, 30) + "..."
            : value
          : "";
      break;
    default:
      displayValue = String(value);
  }

  if (!displayValue) {
    return null;
  }

  const handleEdit = async () => {
    try {
      await updateTask.mutateAsync({
        taskId: task.task_id,
        data: { [field]: editValue },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const isEditable = !["created_at", "updated_at", "task_id"].includes(field);

  return (
    <Popover open={isEditing} onOpenChange={setIsEditing}>
      <PopoverTrigger asChild>
        <Badge
          variant="secondary"
          className={`cursor-pointer whitespace-nowrap hover:bg-gray-200 ${
            isEditable ? "hover:shadow-sm" : ""
          }`}
        >
          <span className="font-medium text-gray-600">{field}:</span>{" "}
          <span>{displayValue}</span>
        </Badge>
      </PopoverTrigger>
      {isEditable && (
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">Edit {field}</h4>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Enter ${field}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleEdit();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => void handleEdit()}>
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
