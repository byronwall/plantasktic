import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { TaskList } from "./_components/TaskList";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default async function Home() {
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
      <TaskList />
    </HydrateClient>
  );
}
