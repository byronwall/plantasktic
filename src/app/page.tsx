import Link from "next/link";

import { DueTaskList } from "~/app/_components/DueTaskList";
import { CreateWorkspaceButton } from "~/components/CreateWorkspaceButton";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import type { Workspace } from "@prisma/client";

export default async function HomePage() {
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

  const workspaces = await api.workspace.getAll();

  return (
    <HydrateClient>
      <div className="mx-auto flex flex-col gap-4 p-4">
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
        <DueTaskList />
      </div>
    </HydrateClient>
  );
}
