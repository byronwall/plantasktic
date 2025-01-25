import { create } from "zustand";

type SelectedTasksStore = {
  selectedTasks: Set<number>;
  availableTaskIds: Set<number>;
  toggleTask: (taskId: number) => void;
  toggleTasks: (taskIds: number[]) => void;
  clearSelection: () => void;
  toggleAllTasks: () => void;
  setAvailableTaskIds: (taskIds: number[]) => void;
};

export const useSelectedTasksStore = create<SelectedTasksStore>((set) => ({
  selectedTasks: new Set<number>(),
  availableTaskIds: new Set<number>(),
  toggleTask: (taskId) =>
    set((state) => {
      const newSelectedTasks = new Set(state.selectedTasks);
      if (newSelectedTasks.has(taskId)) {
        newSelectedTasks.delete(taskId);
      } else {
        newSelectedTasks.add(taskId);
      }
      return { selectedTasks: newSelectedTasks };
    }),
  toggleTasks: (taskIds) =>
    set((state) => {
      const newSelectedTasks = new Set(state.selectedTasks);
      taskIds.forEach((taskId) => {
        if (newSelectedTasks.has(taskId)) {
          newSelectedTasks.delete(taskId);
        } else {
          newSelectedTasks.add(taskId);
        }
      });
      return { selectedTasks: newSelectedTasks };
    }),
  clearSelection: () => set({ selectedTasks: new Set() }),
  toggleAllTasks: () =>
    set((state) => {
      // If all available tasks are selected, clear selection
      if (
        Array.from(state.availableTaskIds).every((id) =>
          state.selectedTasks.has(id),
        )
      ) {
        return { selectedTasks: new Set() };
      }
      // Otherwise, select all available tasks
      return { selectedTasks: new Set(state.availableTaskIds) };
    }),
  setAvailableTaskIds: (taskIds) =>
    set(() => ({
      availableTaskIds: new Set(taskIds),
    })),
}));
