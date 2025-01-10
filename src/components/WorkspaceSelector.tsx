import { Check } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";

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

interface WorkspaceSelectorProps {
  value: string | null;
  onChange: Dispatch<SetStateAction<string | null>>;
}

export function WorkspaceSelector({ value, onChange }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: _workspaces } = api.workspace.getAll.useQuery();

  const workspaces = _workspaces ?? [];

  const selectedWorkspace = workspaces.find(
    (workspace) => workspace.id === value,
  );

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(search.toLowerCase()),
  );

  console.log(filteredWorkspaces);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedWorkspace?.name ?? "Select workspace..."}
          <Check
            className={cn(
              "ml-2 h-4 w-4 shrink-0 opacity-50",
              selectedWorkspace && "opacity-100",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search workspaces..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No workspace found.</CommandEmpty>
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
                All Workspaces
              </CommandItem>
              {filteredWorkspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  onSelect={() => {
                    onChange(workspace.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      workspace.id === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {workspace.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
