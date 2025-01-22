import { api } from "~/trpc/server";

export async function getCurrentProjectServer(params: {
  workspace: string;
  project?: string;
}) {
  // need to decode the params
  const { workspace, project } = params;

  const decodedWorkspace = decodeURIComponent(workspace);
  const decodedProject = project ? decodeURIComponent(project) : null;

  const workspaces = await api.workspace.getAll();
  const workspaceObj = workspaces.find((w) => w.name === decodedWorkspace);

  const projects = await api.task.getProjects();
  const projectObj = projects.find(
    (p) => p.name === decodedProject && p.workspaceId === workspaceObj?.id,
  );

  return { workspaceObj, projectObj };
}
