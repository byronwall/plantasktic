import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { getCurrentProjectServer } from "~/hooks/getCurrentProjectParams";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspaceObj } = await getCurrentProjectServer(await params);

  if (!workspaceObj) {
    notFound();
  }

  return (
    <div className="mx-auto">
      <TaskList />
    </div>
  );
}
