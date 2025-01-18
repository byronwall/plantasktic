"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";

interface WorkspaceProjectContextType {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
  setSelectedProjectId: Dispatch<SetStateAction<string | null>>;
}

const WorkspaceProjectContext =
  createContext<WorkspaceProjectContextType | null>(null);

export function WorkspaceProjectProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  return (
    <WorkspaceProjectContext.Provider
      value={{
        selectedWorkspaceId,
        selectedProjectId,
        setSelectedWorkspaceId,
        setSelectedProjectId,
      }}
    >
      {children}
    </WorkspaceProjectContext.Provider>
  );
}

export function useWorkspaceProject() {
  const context = useContext(WorkspaceProjectContext);
  if (!context) {
    throw new Error(
      "useWorkspaceProject must be used within a WorkspaceProjectProvider",
    );
  }
  return context;
}
