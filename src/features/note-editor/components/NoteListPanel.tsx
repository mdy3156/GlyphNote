import {
  ChevronDown,
  ChevronRight,
  FilePlus2,
  FileText,
  FolderTree,
  RefreshCcw,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import type { NoteEngine } from "../../../shared/types/note";

type ExplorerNode = {
  id: string;
  name: string;
  path?: string;
  children?: ExplorerNode[];
};

interface ExplorerPanelProps {
  notes: Array<{
    path: string;
    title: string;
    engine: NoteEngine;
  }>;
  vaultPath: string | null;
  selectedPath: string | null;
  disabled: boolean;
  onQuickCreateTex: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onOpenNote: (path: string) => Promise<void>;
}

function toExplorerTree(
  notes: ExplorerPanelProps["notes"],
  vaultPath: string | null,
): ExplorerNode[] {
  const root: ExplorerNode = {
    id: "root",
    name: "notes",
    children: [],
  };

  if (!vaultPath) {
    return root.children ?? [];
  }

  const notesRoot = `${vaultPath}\\notes\\`.toLowerCase();

  for (const note of notes) {
    const normalized = note.path.toLowerCase();
    const relative = normalized.startsWith(notesRoot)
      ? note.path.slice(notesRoot.length)
      : note.path.split("\\").slice(-1)[0];
    const parts = relative.split(/[/\\]/g).filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    let cursor = root;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      if (!cursor.children) {
        cursor.children = [];
      }

      let existing = cursor.children.find((node) => node.name === part);
      if (!existing) {
        existing = {
          id: `${cursor.id}/${part}`,
          name: part,
          path: isLeaf ? note.path : undefined,
          children: isLeaf ? undefined : [],
        };
        cursor.children.push(existing);
      }

      cursor = existing;
    }
  }

  return root.children ?? [];
}

function ExplorerNodeItem({
  node,
  depth,
  selectedPath,
  onOpenNote,
}: {
  node: ExplorerNode;
  depth: number;
  selectedPath: string | null;
  onOpenNote: (path: string) => Promise<void>;
}) {
  const isFolder = Boolean(node.children && node.children.length > 0);
  const [expanded, setExpanded] = useState(true);

  if (isFolder) {
    return (
      <li className="space-y-1">
        <button
          type="button"
          className="flex h-7 w-full items-center gap-1 rounded-sm px-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <FolderTree className="size-3.5" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <ul className="space-y-1">
            {node.children
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((child) => (
                <ExplorerNodeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  onOpenNote={onOpenNote}
                />
              ))}
          </ul>
        )}
      </li>
    );
  }

  const active = selectedPath === node.path;
  return (
    <li>
      <Button
        type="button"
        variant={active ? "secondary" : "ghost"}
        className="h-7 w-full justify-start gap-2 rounded-sm px-2 text-xs"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (node.path) {
            void onOpenNote(node.path);
          }
        }}
      >
        <FileText className="size-3.5" />
        <span className="truncate">{node.name}</span>
      </Button>
    </li>
  );
}

export function ExplorerPanel({
  notes,
  vaultPath,
  selectedPath,
  disabled,
  onQuickCreateTex,
  onRefresh,
  onOpenNote,
}: ExplorerPanelProps) {
  const tree = toExplorerTree(notes, vaultPath);

  return (
    <Card className="flex h-full min-h-0 flex-col rounded-none border-x-0 border-y-0 bg-card/95">
      <div className="flex h-10 items-center justify-between border-b px-3">
        <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Explorer</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={() => void onQuickCreateTex()}
            disabled={disabled}
            title="New .tex note"
          >
            <FilePlus2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={() => void onRefresh()}
            disabled={disabled}
            title="Refresh explorer"
          >
            <RefreshCcw className="size-4" />
          </Button>
        </div>
      </div>
      <CardContent className="min-h-0 flex-1 p-2">
        <p className="mb-2 px-1 text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
          notes
        </p>
        <ul className="grid h-full content-start gap-1 overflow-auto pr-1">
          {tree.map((node) => (
            <ExplorerNodeItem
              key={node.id}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onOpenNote={onOpenNote}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
