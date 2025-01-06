"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function TaskList() {
  const { data: rawTasks } = api.post.getTasks.useQuery();

  const tasks = rawTasks ?? [];

  // create task handler

  const createTaskMutater = api.post.createTask.useMutation();

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const createTask = async () => {
    await createTaskMutater.mutateAsync({ text: newTaskTitle });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-3xl font-semibold">Tasks</h2>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Task title"
          className="rounded-md px-2 py-1"
        />
        <button
          onClick={createTask}
          className="rounded-md bg-blue-500 px-2 py-1 text-white"
        >
          Create task
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        {tasks.map((task) => (
          <div key={task.task_id} className="flex items-center gap-2">
            <span>{task.title}</span>
            <span>{task.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
