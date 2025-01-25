import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { getCurrentProjectServer } from "~/hooks/getCurrentProjectParams";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ workspace: string; project: string }>;
}) {
  const { workspaceObj, projectObj } = await getCurrentProjectServer(
    await params,
  );

  if (!workspaceObj || !projectObj) {
    notFound();
  }

  return (
    <div className="mx-auto">
      <TaskList />
    </div>
  );
}
