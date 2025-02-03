import Link from "next/link";

import { DueTaskList } from "~/app/_components/DueTaskList";
import { CreateWorkspaceButton } from "~/components/CreateWorkspaceButton";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import { LandingPage } from "./LandingPage";

import type { Workspace } from "@prisma/client";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <LandingPage />;
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
