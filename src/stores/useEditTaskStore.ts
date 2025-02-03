import { create } from "zustand";

interface EditTaskStore {
  isOpen: boolean;
  taskId: number | null;
  open: (taskId: number) => void;
  close: () => void;
}

export const useEditTaskStore = create<EditTaskStore>((set) => ({
  isOpen: false,
  taskId: null,
  open: (taskId) => set({ isOpen: true, taskId }),
  close: () => set({ isOpen: false, taskId: null }),
}));
