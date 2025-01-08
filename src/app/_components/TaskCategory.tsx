"use client";

import { Badge } from "~/components/ui/badge";
import { ComboBox } from "./ComboBox";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";

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
  const updateCategoryMutation = api.task.updateTaskCategory.useMutation();
  const { data: categories = [] } = api.task.getCategories.useQuery();

  const handleCategorySelect = async (category: string) => {
    await updateCategoryMutation.mutateAsync({ taskId, category });
  };

  return (
    <div className="flex items-center gap-2">
      <ComboBox
        options={categories}
        value={currentCategory ?? ""}
        onChange={(value) => void handleCategorySelect(value)}
        onCreateNew={(value) => void handleCategorySelect(value)}
        placeholder="Assign category..."
        searchPlaceholder="Search categories..."
        emptyText="No categories found"
      >
        <Badge variant="outline">{currentCategory}</Badge>
      </ComboBox>
      {updateCategoryMutation.isPending && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
    </div>
  );
}
