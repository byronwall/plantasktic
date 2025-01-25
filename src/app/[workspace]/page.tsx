import { notFound } from "next/navigation";

import { TaskList } from "~/app/_components/TaskList";
import { CreateProjectButton } from "~/components/CreateProjectButton";
import { SimpleTooltip } from "~/components/SimpleTooltip";
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
    <div className="container mx-auto">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-bold">{workspaceObj.name}</h1>
        <SimpleTooltip content="Create new project">
          <div>
            <CreateProjectButton workspaceId={workspaceObj.id} />
          </div>
        </SimpleTooltip>
      </div>
      <TaskList workspaceId={workspaceObj.id} projectId={null} />
    </div>
  );
}
