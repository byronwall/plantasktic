import { create } from "zustand";

import type { Task } from "~/app/_components/TaskList";

interface EditTaskStore {
  isOpen: boolean;
  task: Task | null;
  open: (task: Task) => void;
  close: () => void;
}

export const useEditTaskStore = create<EditTaskStore>((set) => ({
  isOpen: false,
  task: null,
  open: (task) => set({ isOpen: true, task }),
  close: () => set({ isOpen: false, task: null }),
}));
