import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  GanttChart,
  Grid2X2,
  KanbanSquare,
  LayoutGrid,
  ListIcon,
  Pencil,
  Settings,
  TableIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { ColorPalettePicker } from "~/components/ColorPalettePicker";
import { CreateProjectButton } from "~/components/CreateProjectButton";
import { SimpleTooltip } from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useCurrentProject } from "~/hooks/useCurrentProject";
import { cn } from "~/lib/utils";
import { useViewSettingsStore } from "~/stores/useViewSettingsStore";
import { api } from "~/trpc/react";

import { TaskSelectionActions } from "./TaskSelectionActions";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

type TaskListHeaderProps = {
  totalTasks: number;
};

export function TaskListHeader({ totalTasks }: TaskListHeaderProps) {
  const router = useRouter();

  const {
    showCompleted,
    showFieldNames,
    setShowCompleted,
    setShowFieldNames,
    viewMode,
    setViewMode,
  } = useViewSettingsStore();

  const {
    currentWorkspaceId: workspaceId,
    currentWorkspaceName: workspaceName,
    currentProjectId: projectId,
    currentProjectName: projectName,
  } = useCurrentProject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: projectName ?? "",
    },
  });

  const { mutate: renameProject, isPending: isRenamingProject } =
    api.project.rename.useMutation({
      onSuccess: (_, variables) => {
        router.replace(`/${workspaceName}/${variables.name}`);
      },
    });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!projectId || values.name.trim() === "") {
      return;
    }

    renameProject({ projectId, name: values.name.trim() });
  };

  return (
    <div className="flex h-12 w-full items-center justify-between gap-2 border-b pb-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1
            className={cn("text-2xl font-bold", {
              "text-lg font-semibold": projectId !== null,
            })}
          >
            {workspaceName}
          </h1>
          {workspaceId && (
            <SimpleTooltip content="Create new project">
              <div>
                <CreateProjectButton workspaceId={workspaceId} />
              </div>
            </SimpleTooltip>
          )}
          {projectName && (
            <>
              <span className="text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{projectName}</h2>
                <Popover>
                  <SimpleTooltip content="Rename project">
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                  </SimpleTooltip>
                  <PopoverContent className="w-80">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="flex flex-col gap-4"
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium">Rename Project</h4>
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} autoComplete="off" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isRenamingProject}
                        >
                          Save
                        </Button>
                      </form>
                    </Form>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
        {viewMode !== "summary" && (
          <TaskSelectionActions totalTasks={totalTasks} />
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <SimpleTooltip content="Summary View">
            <Button
              variant={viewMode === "summary" ? "default" : "outline"}
              onClick={() => setViewMode("summary")}
              size="sm"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="List View">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Table View">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
              size="sm"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Card View">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              onClick={() => setViewMode("card")}
              size="sm"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Kanban View">
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              onClick={() => setViewMode("kanban")}
              size="sm"
            >
              <KanbanSquare className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Gantt View">
            <Button
              variant={viewMode === "gantt" ? "default" : "outline"}
              onClick={() => setViewMode("gantt")}
              size="sm"
            >
              <GanttChart className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Matrix View">
            <Button
              variant={viewMode === "matrix" ? "default" : "outline"}
              onClick={() => setViewMode("matrix")}
              size="sm"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
          </SimpleTooltip>
        </div>
        <div className="flex items-center gap-2">
          <ColorPalettePicker />

          <Popover>
            <SimpleTooltip content="View Settings">
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </SimpleTooltip>
            <PopoverContent className="w-[200px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Field Names</span>
                  <Switch
                    checked={showFieldNames}
                    onCheckedChange={setShowFieldNames}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Completed Tasks</span>
                  <Switch
                    checked={showCompleted}
                    onCheckedChange={setShowCompleted}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
