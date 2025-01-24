import { create } from "zustand";
import { persist } from "zustand/middleware";

type AvatarVariant =
  | "marble"
  | "beam"
  | "pixel"
  | "sunset"
  | "ring"
  | "bauhaus";

interface ColorPaletteStore {
  selectedColors: string[];
  avatarVariant: AvatarVariant;
  setSelectedColors: (colors: string[]) => void;
  setAvatarVariant: (variant: AvatarVariant) => void;
}

const defaultColors = ["#49007e", "#ff7d10", "#ffb238"];

const colorPalettes: string[][] = [
  defaultColors,
  ["#2563eb", "#f59e0b", "#10b981"],
  ["#dc2626", "#8b5cf6", "#f97316"],
  ["#0891b2", "#84cc16", "#ec4899"],
  ["#6366f1", "#f43f5e", "#14b8a6"],
  ["#8b5cf6", "#22c55e", "#f97316"],
  ["#ea580c", "#3b82f6", "#a855f7"],
  ["#0ea5e9", "#f59e0b", "#ec4899"],
  ["#7c3aed", "#10b981", "#f43f5e"],
  ["#059669", "#6366f1", "#f97316"],
  ["#d946ef", "#84cc16", "#3b82f6"],
  ["#f43f5e", "#0ea5e9", "#a855f7"],
  ["#14b8a6", "#8b5cf6", "#f59e0b"],
  ["#22c55e", "#d946ef", "#0891b2"],
  ["#f97316", "#7c3aed", "#22c55e"],
  ["#e11d48", "#fb923c", "#fbbf24"],
  ["#b91c1c", "#ea580c", "#f59e0b"],
  ["#9f1239", "#c2410c", "#b45309"],
  ["#1e40af", "#0369a1", "#0d9488"],
  ["#1d4ed8", "#0891b2", "#059669"],
  ["#3730a3", "#0e7490", "#047857"],
  ["#4b5563", "#6b7280", "#9ca3af"],
  ["#374151", "#4b5563", "#6b7280"],
  ["#0ea5e9", "#0ea5e9", "#f43f5e"],
  ["#8b5cf6", "#8b5cf6", "#22c55e"],
  ["#06b6d4", "#8b5cf6", "#f43f5e", "#22c55e"],
  ["#ec4899", "#f97316", "#0ea5e9", "#84cc16"],
  ["#3b82f6", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6"],
  ["#6366f1", "#f97316", "#14b8a6", "#d946ef", "#0891b2"],
  ["#7c3aed", "#f43f5e", "#fbbf24"],
  ["#2563eb", "#db2777", "#84cc16"],
  ["#1e40af", "#3b82f6", "#93c5fd"],
  ["#be123c", "#e11d48", "#fda4af"],
  ["#15803d", "#ca8a04", "#0369a1"],
  ["#166534", "#854d0e", "#155e75"],
  // add some more that include white and black with other bright colors
  ["#000000", "#ffffff", "#f43f5e", "#22c55e"],
  ["#ffffff", "#f43f5e", "#22c55e"],
  // do white blue orange
  ["#ffffff", "#0ea5e9", "#f97316"],
  // do a whole rainbow
  ["#f43f5e", "#0ea5e9", "#84cc16", "#f97316", "#22c55e", "#8b5cf6", "#0891b2"],
];

export const useColorPaletteStore = create<ColorPaletteStore>()(
  persist(
    (set) => ({
      selectedColors: defaultColors,
      avatarVariant: "marble" as AvatarVariant,
      setSelectedColors: (colors) => set({ selectedColors: colors }),
      setAvatarVariant: (variant) => set({ avatarVariant: variant }),
    }),
    {
      name: "color-palette-storage",
    },
  ),
);

export { colorPalettes };
