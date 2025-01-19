"use client";

import { Loader2, Tag } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

import { ComboBox } from "./ComboBox";

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

// Function to determine if white or black text should be used
function getContrastingTextColor(backgroundColor: string | undefined) {
  if (!backgroundColor) {
    return "white";
  }

  // Extract values from HSL or RGB color
  const hslMatch = /hsl\(\d+,\s*\d+%,\s*(\d+)%\)/.exec(backgroundColor);
  const rgbMatch = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(backgroundColor);

  if (hslMatch) {
    // For HSL, use lightness directly
    const lightness = parseInt(hslMatch[1] ?? "0", 10);
    return lightness < 65 ? "white" : "black";
  } else if (rgbMatch) {
    // For RGB, calculate relative luminance
    const [r = 0, g = 0, b = 0] = rgbMatch
      .slice(1)
      .map((x) => parseInt(x ?? "0", 10));
    // Perceived brightness formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128 ? "white" : "black";
  }

  return "white"; // Default fallback
}

interface TaskCategoryProps {
  taskId: number;
  currentCategory?: string | null;
}

export function TaskCategory({ taskId, currentCategory }: TaskCategoryProps) {
  const updateCategoryMutation = api.task.updateTask.useMutation();
  const { data: categories = [] } = api.task.getCategories.useQuery();

  const handleCategorySelect = async (category: string) => {
    await updateCategoryMutation.mutateAsync({
      taskId,
      data: {
        category,
      },
    });
  };

  const backgroundColor = currentCategory
    ? stringToColor(currentCategory)
    : undefined;

  const textColor = backgroundColor
    ? getContrastingTextColor(backgroundColor)
    : undefined;

  return (
    <div className="flex items-center gap-2">
      <ComboBox
        options={categories}
        value={currentCategory ?? ""}
        onChange={(value) => void handleCategorySelect(value ?? "")}
        onCreateNew={(value) => void handleCategorySelect(value)}
        placeholder="Assign category..."
        searchPlaceholder="Search categories..."
        emptyText="No categories found"
      >
        {currentCategory ? (
          <Badge
            variant="outline"
            className="flex cursor-pointer items-center justify-between gap-2 text-base hover:bg-muted"
            style={{
              backgroundColor,
              color: textColor,
            }}
          >
            {currentCategory}
          </Badge>
        ) : (
          <Button variant="icon" size="icon">
            <Tag className="h-4 w-4" />
          </Button>
        )}
      </ComboBox>
      {updateCategoryMutation.isPending && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
    </div>
  );
}
