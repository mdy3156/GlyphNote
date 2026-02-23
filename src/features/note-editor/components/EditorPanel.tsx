import { Save, X } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Textarea } from "../../../components/ui/textarea";
import type { NoteEngine } from "../../../shared/types/note";

type EditorTab = {
  path: string;
  title: string;
  engine: NoteEngine;
  isDirty: boolean;
};

interface EditorPanelProps {
  title: string;
  path: string | null;
  tabs: EditorTab[];
  activePath: string | null;
  content: string;
  loading: boolean;
  disabled: boolean;
  onContentChange: (value: string) => void;
  onSave: () => Promise<void>;
  onActivateTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export function EditorPanel({
  title,
  path,
  tabs,
  activePath,
  content,
  loading,
  disabled,
  onContentChange,
  onSave,
  onActivateTab,
  onCloseTab,
}: EditorPanelProps) {
  const engineBadge = path?.split(".").pop()?.toLowerCase() ?? "";

  return (
    <Card className="flex h-full flex-col rounded-none border-y-0 border-r-0 bg-card/90">
      <div className="flex items-center gap-1 overflow-x-auto border-b bg-background/20 px-2 py-1">
        {tabs.length === 0 && (
          <span className="px-2 py-1 text-xs text-muted-foreground">No file opened</span>
        )}
        {tabs.map((tab) => {
          const active = tab.path === activePath;
          return (
            <div
              key={tab.path}
              className={`group inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                active
                  ? "border-border bg-secondary text-secondary-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent"
              }`}
            >
              <button
                type="button"
                className="max-w-[220px] truncate text-left"
                onClick={() => onActivateTab(tab.path)}
              >
                {tab.title}
                {tab.isDirty ? "*" : ""}
              </button>
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-sm hover:bg-background/40"
                onClick={() => onCloseTab(tab.path)}
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
      <CardHeader className="flex-row items-center justify-between gap-2 border-b">
        <div className="space-y-1">
          <CardTitle className="text-sm tracking-wide text-muted-foreground uppercase">
            {title || "Editor"}
          </CardTitle>
          <p className="break-all text-xs text-muted-foreground">{path ?? "Select a note"}</p>
        </div>
        <div className="flex items-center gap-2">
          {(engineBadge === "tex" || engineBadge === "typ") && (
            <Badge variant="outline">{engineBadge}</Badge>
          )}
          <Button type="button" onClick={onSave} disabled={disabled || loading}>
            <Save className="size-4" />
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 p-0">
        <Textarea
          className="h-full min-h-0 resize-none rounded-none border-0 bg-background/60 p-4 font-mono text-sm leading-6 focus-visible:ring-0"
          value={content}
          onChange={(event) => onContentChange(event.currentTarget.value)}
          spellCheck={false}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
