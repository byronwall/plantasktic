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
import { useEffect, useState } from "react";

import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DateInput } from "~/components/ui/date-input";
import { Input } from "~/components/ui/input";
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
  showTextLabel?: boolean;
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
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = React.useState(value?.toString() ?? "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = inputValue === "" ? null : parseFloat(inputValue);
      if (parsed === null || !isNaN(parsed)) {
        onSubmit(parsed);
        setIsEditing(false);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value?.toString() ?? "");
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    setInputValue(value?.toString() ?? "");
  };

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="flex cursor-pointer items-center gap-2 hover:text-foreground"
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleEditKeyPress}
          onBlur={handleBlur}
          className="w-20"
          step="any"
        />
      ) : value !== null ? (
        <span className="hover:bg-muted">{value}</span>
      ) : (
        <Button variant="icon" size="icon">
          {icon}
        </Button>
      )}
    </div>
  );
}

export function TaskField({
  task,
  field,
  showLabel = false,
  showTextLabel = false,
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
            <Button
              variant="outline"
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
              className=""
            >
              Edit
            </Button>
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
            iconClassName="h-4 w-4"
          />
        );
      case "duration":
        return (
          <div className="flex items-center justify-center">
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
          </div>
        );
      case "priority":
        return (
          <div className="flex items-center justify-center">
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
          </div>
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
      <div className="flex items-center gap-2">
        <span
          className="text-gray-500"
          title={field
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        >
          {getFieldIcon()}
        </span>
        {showTextLabel && (
          <span className="text-sm text-gray-500">
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        )}
      </div>
    </SimpleTooltip>
  ) : null;

  return (
    <div className={cn("flex items-center justify-center gap-0.5", className)}>
      {label}

      {renderField()}
    </div>
  );
}
