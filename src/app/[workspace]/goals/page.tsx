"use client";

import { useState } from "react";

import { CreateGoalDialog } from "~/components/goals/CreateGoalDialog";
import { GoalList } from "~/components/goals/GoalList";
import { GoalMetrics } from "~/components/goals/GoalMetrics";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { api } from "~/trpc/react";

export default function WorkspaceGoalsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { currentWorkspaceName } = useCurrentProject();
  const { data: workspaces } = api.workspace.getAll.useQuery();
  const currentWorkspace = workspaces?.find(
    (w) => w.name === currentWorkspaceName,
  );

  const { data: goals } = api.goal.getAll.useQuery({
    workspaceId: currentWorkspace?.id,
  });

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Goals Dashboard</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Create Goal</Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Card className="p-4">
              <GoalList goals={goals ?? []} />
            </Card>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <Card className="p-4">
            <GoalMetrics goals={goals ?? []} />
          </Card>
        </TabsContent>
      </Tabs>

      <CreateGoalDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        workspaceId={currentWorkspace?.id ?? ""}
        onGoalCreated={() => {
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}
