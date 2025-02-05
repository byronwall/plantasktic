"use client";

import { TaskAvatar } from "~/app/_components/TaskAvatar";
import { api } from "~/trpc/react";

import type { Task } from "@prisma/client";

export function DueTaskList() {
  const { data: _x } = api.task.getTasks.useQuery({
    showCompleted: false,
  });

  const x = _x ?? [];

  const tasks = x
    .filter((task) => task.due_date !== null)
    .sort((a, b) => a.due_date!.getTime() - b.due_date!.getTime())
    .slice(0, 10);

  return (
    <div className="mb-8">
      <h1 className="mb-4 text-2xl font-bold">Due Tasks</h1>
      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <div key={task.task_id} className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <TaskAvatar task={task} />
              <h3 className="font-semibold">{task.title}</h3>
            </div>
            <p className="text-sm text-gray-500">
              Due: {task.due_date?.toLocaleDateString()}
            </p>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-muted-foreground">
            No tasks with due dates found.
          </p>
        )}
      </div>
    </div>
  );
}
