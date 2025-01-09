import { Check } from "lucide-react";
import { api } from "~/trpc/react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";

interface ProjectSelectorProps {
  currentProjectId?: string | null;
  onProjectSelect: (projectId: string | null) => void;
}

export function ProjectSelector({
  currentProjectId,
  onProjectSelect,
}: ProjectSelectorProps) {
  const { data: projects = [] } = api.task.getProjects.useQuery();

  return (
    <Command>
      <CommandInput placeholder="Search projects..." />
      <CommandList>
        <CommandEmpty>No projects found.</CommandEmpty>
        <CommandGroup>
          <CommandItem value="none" onSelect={() => onProjectSelect(null)}>
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                !currentProjectId ? "opacity-100" : "opacity-0",
              )}
            />
            No Project
          </CommandItem>
          {projects.map((project) => (
            <CommandItem
              key={project.id}
              value={project.name}
              onSelect={() => onProjectSelect(project.id)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  currentProjectId === project.id ? "opacity-100" : "opacity-0",
                )}
              />
              {project.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
