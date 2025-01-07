import { HydrateClient } from "~/trpc/server";
import { TaskList } from "./_components/TaskList";

export default function Home() {
  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-8">
        <TaskList />
      </main>
    </HydrateClient>
  );
}
