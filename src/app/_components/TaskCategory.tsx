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

// Predefined categories with their colors
const categories = [
  { name: "Work", color: "bg-blue-500" },
  { name: "Personal", color: "bg-green-500" },
  { name: "Shopping", color: "bg-yellow-500" },
  { name: "Health", color: "bg-red-500" },
  { name: "Education", color: "bg-purple-500" },
  { name: "Other", color: "bg-gray-500" },
] as const;

interface TaskCategoryProps {
  taskId: number;
  currentCategory?: string | null;
}

export function TaskCategory({ taskId, currentCategory }: TaskCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateCategoryMutation = api.task.updateTaskCategory.useMutation();

  const currentCategoryData =
    categories.find((c) => c.name === currentCategory) ?? categories[5];

  const handleCategorySelect = async (category: string) => {
    await updateCategoryMutation.mutateAsync({ taskId, category });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <Badge
            className={`cursor-pointer ${currentCategoryData.color} hover:${currentCategoryData.color}/80`}
          >
            {currentCategory ?? "Other"}
          </Badge>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="flex flex-col gap-1">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant="ghost"
              className="justify-start"
              onClick={() => void handleCategorySelect(category.name)}
            >
              <Badge className={`mr-2 ${category.color}`}>
                {category.name}
              </Badge>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
