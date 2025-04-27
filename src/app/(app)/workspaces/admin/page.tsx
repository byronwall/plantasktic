"use client";

import { BarChart, Briefcase, FolderKanban } from "lucide-react";

import { MetricsCard } from "~/components/admin/MetricsCard";
import { ProjectAdminPanel } from "~/components/admin/ProjectAdminPanel";
import { WorkspaceAdminPanel } from "~/components/admin/WorkspaceAdminPanel";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

export default function WorkspaceAdminPage() {
  const { data: workspacesData, isLoading: isLoadingWorkspaces } =
    api.workspace.getAll.useQuery();
  const { data: projectsData, isLoading: isLoadingProjects } =
    api.project.getAll.useQuery();

  const totalWorkspaces = workspacesData?.length;
  const totalProjects = projectsData?.length;
  const averageProjectsPerWorkspace =
    totalWorkspaces && totalProjects && totalWorkspaces > 0
      ? (totalProjects / totalWorkspaces).toFixed(1)
      : 0;

  const isLoadingMetrics = isLoadingWorkspaces || isLoadingProjects;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Admin Dashboard
      </h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricsCard
          title="Total Workspaces"
          value={totalWorkspaces}
          isLoading={isLoadingMetrics}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <MetricsCard
          title="Total Projects"
          value={totalProjects}
          isLoading={isLoadingMetrics}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <MetricsCard
          title="Avg Projects/Workspace"
          value={averageProjectsPerWorkspace}
          isLoading={isLoadingMetrics}
          icon={<BarChart className="h-4 w-4" />}
        />
      </div>

      <Separator className="my-8" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Workspace Management</h2>
          <WorkspaceAdminPanel />
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Project Management</h2>
          <ProjectAdminPanel />
        </div>
      </div>
    </div>
  );
}
