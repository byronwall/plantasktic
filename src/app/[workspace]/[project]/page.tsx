import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { ProjectHeader } from "~/components/ProjectHeader";
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
    <div className="container mx-auto">
      <ProjectHeader
        workspaceName={workspaceObj.name}
        projectId={projectObj.id}
      />
      <TaskList workspaceId={workspaceObj.id} projectId={projectObj.id} />
    </div>
  );
}
