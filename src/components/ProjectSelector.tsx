import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface ProjectSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  workspaceId: string | null;
}

export function ProjectSelector({
  value,
  onChange,
  workspaceId,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: _projects } = api.project.getAll.useQuery();

  const projects = _projects ?? [];

  const filteredProjects = projects
    .filter((project) => !workspaceId || project.workspaceId === workspaceId)
    .filter((project) =>
      project.name.toLowerCase().includes(search.toLowerCase()),
    );

  const selectedProject = projects.find((project) => project.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between truncate"
        >
          {selectedProject?.name ?? "Select project..."}
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 opacity-50",
              selectedProject && "opacity-100",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search projects..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No project found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandItem
                key="all"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0",
                  )}
                />
                All Projects
              </CommandItem>
              {filteredProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    onChange(project.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      project.id === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
