import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { create } from "zustand";

import { useCurrentProject } from "~/hooks/useCurrentProject";

export type ViewMode =
  | "list"
  | "table"
  | "kanban"
  | "gantt"
  | "matrix"
  | "card"
  | "summary";

type ViewSettings = {
  viewMode: ViewMode;
  showCompleted: boolean;
  showFieldNames: boolean;
  setViewMode: (mode: ViewMode) => void;
  setShowCompleted: (show: boolean) => void;
  setShowFieldNames: (show: boolean) => void;
};

export const useViewSettingsStore = create<ViewSettings>((set) => ({
  viewMode: "list",
  showCompleted: false,
  showFieldNames: true,
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowCompleted: (show) => set({ showCompleted: show }),
  setShowFieldNames: (show) => set({ showFieldNames: show }),
}));

// Hook to sync store with URL query params
export const useSyncViewSettingsWithUrl = () => {
  const searchParams = useSearchParams();
  const { setViewMode, setShowCompleted, setShowFieldNames } =
    useViewSettingsStore();

  const { currentProject, currentWorkspace } = useCurrentProject();

  // if we have a workspace only, set the view mode to summary
  useEffect(() => {
    if (currentWorkspace?.id && !currentProject?.id) {
      setViewMode("summary");
    }
  }, [currentWorkspace, currentProject, setViewMode]);

  useEffect(() => {
    const viewMode = searchParams.get("view") as ViewMode;
    const showCompleted = searchParams.get("completed") === "true";
    const showFieldNames = searchParams.get("fields") !== "false";

    if (viewMode) {
      setViewMode(viewMode);
    }
    if (searchParams.has("completed")) {
      setShowCompleted(showCompleted);
    }
    if (searchParams.has("fields")) {
      setShowFieldNames(showFieldNames);
    }
  }, [searchParams, setViewMode, setShowCompleted, setShowFieldNames]);
};

// Hook to update URL when store changes
export const useUpdateUrlFromViewSettings = () => {
  const { viewMode, showCompleted, showFieldNames } = useViewSettingsStore();

  useEffect(() => {
    const url = new URL(window.location.href);

    // Only set non-default values
    if (viewMode !== "list") {
      url.searchParams.set("view", viewMode);
    } else {
      url.searchParams.delete("view");
    }

    if (showCompleted) {
      url.searchParams.set("completed", "true");
    } else {
      url.searchParams.delete("completed");
    }

    if (!showFieldNames) {
      url.searchParams.set("fields", "false");
    } else {
      url.searchParams.delete("fields");
    }

    window.history.replaceState({}, "", url.toString());
  }, [viewMode, showCompleted, showFieldNames]);
};
