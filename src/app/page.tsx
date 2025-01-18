import Link from "next/link";

import { CreateWorkspaceButton } from "~/components/CreateWorkspaceButton";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import type { Task, Workspace } from "@prisma/client";

export default async function HomePage() {
  const workspaces = await api.workspace.getAll();
  const dueTasks = (
    await api.task.getTasks({
      showCompleted: false,
    })
  )
    .filter((task) => task.due_date !== null)
    .sort((a, b) => a.due_date!.getTime() - b.due_date!.getTime())
    .slice(0, 10);

  const session = await auth();

  if (!session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 text-center">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Task Manager</h1>
          <p className="text-xl text-muted-foreground">
            A simple and efficient way to manage your tasks and projects.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/api/auth/signin">Get Started</Link>
        </Button>
      </div>
    );
  }
  return (
    <HydrateClient>
      <div className="container mx-auto flex flex-col gap-4 p-4">
        <div>
          <h2 className="mb-4 text-2xl font-bold">Workspaces</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {workspaces.map((workspace: Workspace) => (
              <Link key={workspace.id} href={`/${workspace.name}`}>
                <Button
                  variant="outline"
                  className="w-full justify-start p-6 text-lg"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{workspace.name}</h3>
                  </div>
                </Button>
              </Link>
            ))}
            <CreateWorkspaceButton />
          </div>
        </div>
        <div className="mb-8">
          <h1 className="mb-4 text-2xl font-bold">Due Tasks</h1>
          <div className="space-y-2">
            {dueTasks.map((task: Task) => (
              <div key={task.task_id} className="rounded-lg border p-4">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500">
                  Due: {task.due_date?.toLocaleDateString()}
                </p>
              </div>
            ))}
            {dueTasks.length === 0 && (
              <p className="text-muted-foreground">
                No tasks with due dates found.
              </p>
            )}
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
