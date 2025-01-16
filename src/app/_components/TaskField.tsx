import { format } from "date-fns";
import {
  AlignLeft,
  ArrowUpDown,
  Calendar,
  CalendarClock,
  ChevronDown,
  Clock,
  ListTodo,
  MessageSquare,
  Plus,
  RefreshCw,
  Tag,
  Text,
} from "lucide-react";
import * as React from "react";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DateInput } from "~/components/ui/date-input";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";
import { useTaskColumns } from "./hooks/useTaskColumns";
import { TaskCategory } from "./TaskCategory";
import { TaskComments } from "./TaskComments";
import { TaskTitle } from "./TaskTitle";

import type { Task } from "@prisma/client";

const TASK_STATUSES = [
  "open",
  "completed",
  "pending",
  "waiting",
  "blocked",
  "cancelled",
] as const;

type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskFieldProps = {
  task: Task;
  field: keyof Task;
  showLabel?: boolean;
  className?: string;
};

type NumberInputPopoverProps = {
  value: number | null;
  onSubmit: (value: number | null) => void;
  icon: React.ReactNode;
  label: string;
};

function NumberInputPopover({
  value,
  onSubmit,
  icon,
  label,
}: NumberInputPopoverProps) {
  const [inputValue, setInputValue] = React.useState(value?.toString() ?? "");
  const [open, setOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = inputValue === "" ? null : parseFloat(inputValue);
    if (parsed === null || !isNaN(parsed)) {
      onSubmit(parsed);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-2 hover:text-foreground">
        {value !== null ? (
          <span className="hover:bg-muted">{value}</span>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="text-muted-foreground"
          >
            {icon}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label className="text-sm font-medium">{label}</label>
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            step="any"
            className="w-full"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded bg-primary px-2 py-1 text-sm text-primary-foreground"
            >
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function TaskField({
  task,
  field,
  showLabel = false,
  className,
}: TaskFieldProps) {
  const updateTask = api.task.updateTask.useMutation();
  const { TASK_STATUSES } = useTaskColumns();
  const taskId = task.task_id;

  const renderField = () => {
    switch (field) {
      case "title":
        return <TaskTitle taskId={taskId} title={task.title} />;
      case "category":
        return <TaskCategory taskId={taskId} currentCategory={task.category} />;
      case "description":
        return (
          <div className="flex items-center gap-2">
            <span>
              {task.description ? task.description.slice(0, 50) + "..." : ""}
            </span>
            <button
              onClick={() => {
                const newDescription = window.prompt(
                  "Enter new description:",
                  task.description ?? "",
                );
                if (newDescription !== null) {
                  void updateTask.mutateAsync({
                    taskId,
                    data: { description: newDescription || null },
                  });
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
          </div>
        );
      case "comments":
        return <TaskComments taskId={taskId} comments={task.comments} />;
      case "due_date":
      case "start_date":
        return (
          <DateInput
            value={task[field] ?? undefined}
            onChange={(date) => {
              void updateTask.mutateAsync({
                taskId,
                data: { [field]: date ?? null },
              });
            }}
            minimal
          />
        );
      case "duration":
        return (
          <NumberInputPopover
            value={task.duration}
            onSubmit={(value) => {
              void updateTask.mutateAsync({
                taskId,
                data: { duration: value },
              });
            }}
            icon={<Clock className="h-4 w-4" />}
            label="Duration (hours)"
          />
        );
      case "priority":
        return (
          <NumberInputPopover
            value={task.priority ? parseFloat(task.priority) : null}
            onSubmit={(value) => {
              void updateTask.mutateAsync({
                taskId,
                data: { priority: value?.toString() ?? null },
              });
            }}
            icon={<ArrowUpDown className="h-4 w-4" />}
            label="Priority"
          />
        );
      case "status":
        return (
          <ComboBox
            options={[...TASK_STATUSES]}
            value={task.status}
            onChange={(newStatus: string | undefined) => {
              if (newStatus) {
                void updateTask.mutateAsync({
                  taskId,
                  data: { status: newStatus as TaskStatus },
                });
              }
            }}
          >
            <Badge
              variant="outline"
              className="flex cursor-pointer items-center justify-between gap-2 text-base hover:bg-muted"
            >
              {task.status}
              <ChevronDown className="h-4 w-4" />
            </Badge>
          </ComboBox>
        );
      case "created_at":
      case "updated_at":
        return task[field] ? format(task[field], "MMM d, yyyy") : "";
      default:
        return String(task[field] ?? "");
    }
  };

  const getFieldIcon = () => {
    switch (field) {
      case "title":
        return <Text className="h-4 w-4" />;
      case "category":
        return <Tag className="h-4 w-4" />;
      case "description":
        return <AlignLeft className="h-4 w-4" />;
      case "comments":
        return <MessageSquare className="h-4 w-4" />;
      case "due_date":
        return <CalendarClock className="h-4 w-4" />;
      case "start_date":
        return <Calendar className="h-4 w-4" />;
      case "duration":
        return <Clock className="h-4 w-4" />;
      case "priority":
        return <ArrowUpDown className="h-4 w-4" />;
      case "status":
        return <ListTodo className="h-4 w-4" />;
      case "created_at":
        return <Plus className="h-4 w-4" />;
      case "updated_at":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const label = showLabel ? (
    <SimpleTooltip
      content={field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())}
    >
      <span
        className="mr-2 text-gray-500"
        title={field
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())}
      >
        {getFieldIcon()}
      </span>
    </SimpleTooltip>
  ) : null;

  return (
    <div className={cn(className, "flex flex-1 items-center gap-0.5")}>
      {label}

      <div className="flex-1">{renderField()}</div>
    </div>
  );
}
