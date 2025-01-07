"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";
import { PlusIcon } from "lucide-react";
// Function to generate a consistent color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use predefined hues to ensure visually pleasing colors
  const hues = [210, 120, 45, 0, 270, 180]; // blue, green, orange, red, purple, cyan
  const hue = hues[Math.abs(hash) % hues.length];

  return `hsl(${hue}, 70%, 50%)`;
}

interface TaskCategoryProps {
  taskId: number;
  currentCategory?: string | null;
}

export function TaskCategory({ taskId, currentCategory }: TaskCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateCategoryMutation = api.task.updateTaskCategory.useMutation();
  const { data: categories = [] } = api.task.getCategories.useQuery();
  const [newCategory, setNewCategory] = useState("");

  const handleCategorySelect = async (category: string) => {
    await updateCategoryMutation.mutateAsync({ taskId, category });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <Badge
            className="cursor-pointer"
            style={{
              backgroundColor: currentCategory
                ? stringToColor(currentCategory)
                : "rgb(156 163 175)",
              color: "white",
            }}
          >
            {currentCategory ?? "Assign..."}
          </Badge>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-1">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              className="justify-start"
              onClick={() => void handleCategorySelect(category)}
              style={{
                backgroundColor: stringToColor(category),
                color: "white",
              }}
            >
              {category}
            </Button>
          ))}
          {categories.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No categories yet</div>
          )}
          <div className="mt-2 border-t pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New category"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategory.trim()) {
                    void handleCategorySelect(newCategory.trim());
                    setNewCategory("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newCategory.trim()) {
                    void handleCategorySelect(newCategory.trim());
                    setNewCategory("");
                  }
                }}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
