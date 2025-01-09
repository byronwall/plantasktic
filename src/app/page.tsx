import { HydrateClient } from "~/trpc/server";
import { TaskList } from "./_components/TaskList";

export default function Home() {
  return (
    <HydrateClient>
      <TaskList />
    </HydrateClient>
  );
}
