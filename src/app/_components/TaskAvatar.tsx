import Avatar from "boring-avatars";

import { useColorPaletteStore } from "~/stores/useColorPaletteStore";

type TaskAvatarProps = {
  title: string;
  size?: number;
};

export const TaskAvatar = ({ title, size = 24 }: TaskAvatarProps) => {
  const { selectedColors, avatarVariant } = useColorPaletteStore();

  return (
    <Avatar
      name={title}
      colors={selectedColors}
      variant={avatarVariant}
      size={size}
      className="shrink-0"
    />
  );
};
