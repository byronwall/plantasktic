import { format } from "date-fns";

import { Badge } from "~/components/ui/badge";

import { type Task } from "./TaskList";

interface TaskFieldBadgeProps {
  field: keyof Task;
  value: Task[keyof Task];
  task: Task;
}

export function TaskFieldBadge({ field, value, task }: TaskFieldBadgeProps) {
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

  return (
    <Badge variant="secondary" className="whitespace-nowrap">
      {field}: {displayValue}
    </Badge>
  );
}
