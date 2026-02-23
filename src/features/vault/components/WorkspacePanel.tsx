import { FolderOpen, PencilLine, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

interface WorkspacePanelProps {
  workspaceName: string;
  onChangeWorkspaceName: (nextName: string) => void;
  onOpenSettings: () => void;
}

export function WorkspacePanel({
  workspaceName,
  onChangeWorkspaceName,
  onOpenSettings,
}: WorkspacePanelProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(workspaceName);

  const commitName = () => {
    const next = draftName.trim();
    if (!next) {
      return;
    }
    onChangeWorkspaceName(next);
    setEditing(false);
  };

  return (
    <Card className="rounded-none border-x-0 border-b-0 bg-card/95 p-0">
      <div className="flex h-10 items-center justify-between border-b px-3">
        <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Workspace</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={onOpenSettings}
          title="Workspace settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>
      <div className="space-y-2 p-3 text-xs">
        <p className="text-muted-foreground">Name</p>
        <div className="space-y-2 rounded-sm border bg-background/40 p-2 text-foreground/90">
          <div className="flex items-center gap-2">
            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
            {editing ? (
              <Input
                value={draftName}
                onChange={(event) => setDraftName(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitName();
                  }
                }}
                className="h-7 text-xs"
              />
            ) : (
              <span className="truncate">{workspaceName}</span>
            )}
          </div>
          <div className="flex justify-end">
            {editing ? (
              <Button type="button" variant="outline" size="sm" onClick={commitName}>
                Save
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftName(workspaceName);
                  setEditing(true);
                }}
              >
                <PencilLine className="size-4" />
                Rename
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
