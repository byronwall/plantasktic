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
    console.log("not found", workspaceObj, projectObj);
    notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{projectObj.name}</h1>
        <p className="text-gray-500">Workspace: {workspaceObj.name}</p>
      </div>
      <TaskList workspaceId={workspaceObj.id} projectId={projectObj.id} />
    </div>
  );
}
