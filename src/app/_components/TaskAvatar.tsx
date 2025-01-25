import Avatar from "boring-avatars";

import { useColorPaletteStore } from "~/stores/useColorPaletteStore";
import { useEditTaskStore } from "~/stores/useEditTaskStore";

import type { Task } from "./TaskList";

type TaskAvatarProps = {
  title: string;
  size?: number;
  task: Task;
};

export const TaskAvatar = ({ title, size = 24, task }: TaskAvatarProps) => {
  const { selectedColors, avatarVariant } = useColorPaletteStore();
  const openEditDialog = useEditTaskStore((state) => state.open);

  return (
    <Avatar
      name={title}
      colors={selectedColors}
      variant={avatarVariant}
      size={size}
      className="shrink-0 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        openEditDialog(task);
      }}
    />
  );
};
