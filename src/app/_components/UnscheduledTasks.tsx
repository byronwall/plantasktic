"use client";

import { startOfDay } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";

import { Button } from "~/components/ui/button";
import { DateInput } from "~/components/ui/date-input";
import { api } from "~/trpc/react";

import { TaskAvatar } from "./TaskAvatar";

import type { Task } from "@prisma/client";

type UnscheduledTasksProps = {
  tasks: Task[];
};

export function UnscheduledTasks({ tasks }: UnscheduledTasksProps) {
  const updateTask = api.task.updateTask.useMutation();

  const handleScheduleToday = async (taskId: number) => {
    await updateTask.mutateAsync({
      taskId,
      data: {
        start_date: startOfDay(new Date()),
      },
    });
  };

  const handleScheduleDate = async (taskId: number, date: Date | null) => {
    if (!date) {
      return;
    }
    await updateTask.mutateAsync({
      taskId,
      data: {
        start_date: startOfDay(date),
      },
    });
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="mb-4 text-lg font-semibold">Unscheduled Tasks</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tasks.map((task) => (
          <div
            key={task.task_id}
            className="flex items-center gap-4 rounded-lg border bg-card p-4"
          >
            <TaskAvatar title={task.title} task={task} />
            <div className="flex flex-grow flex-col gap-2">
              <div className="font-medium">{task.title}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => void handleScheduleToday(task.task_id)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Today
                </Button>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <DateInput
                    value={undefined}
                    onChange={(date: Date | undefined) =>
                      void handleScheduleDate(task.task_id, date ?? null)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
