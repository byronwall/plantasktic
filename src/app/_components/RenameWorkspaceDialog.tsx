import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

import type { Workspace } from "@prisma/client";

interface RenameWorkspaceDialogProps {
  workspace: Workspace | null;
  newName: string;
  onNewNameChange: (name: string) => void;
  onClose: () => void;
  onRename: () => void;
}

export function RenameWorkspaceDialog({
  workspace,
  newName,
  onNewNameChange,
  onClose,
  onRename,
}: RenameWorkspaceDialogProps) {
  return (
    <Dialog
      open={workspace !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Workspace</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRename();
          }}
        >
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
              placeholder="New workspace name"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
