import { documentDir, join } from "@tauri-apps/api/path";
import { BookOpenText, FolderTree, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "./components/ui/button";
import {
  createNote,
  EditorPanel,
  ExplorerPanel,
  PreviewPanel,
  readNote,
  renderNotePdf,
  resolvePdfPreview,
  saveNote,
} from "./features/note-editor";
import { listNotes, openOrCreateVault, VaultDialog, WorkspacePanel } from "./features/vault";
import type { NoteDocument, NoteEngine, NoteSummary, VaultInfo } from "./shared/types/note";

type OpenTab = {
  path: string;
  title: string;
  engine: NoteEngine;
  content: string;
  isDirty: boolean;
};

const LAST_VAULT_PATH_KEY = "glyphnote:last-vault-path";
const WORKSPACE_NAME_KEY = "glyphnote:workspace-name";

function App() {
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [vaultDialogOpen, setVaultDialogOpen] = useState(false);
  const [vaultDialogRequired, setVaultDialogRequired] = useState(false);
  const [vaultDialogPath, setVaultDialogPath] = useState<string>("");
  const [suggestedVaultPath, setSuggestedVaultPath] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfPreviewPath, setPdfPreviewPath] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [renderBusy, setRenderBusy] = useState(false);
  const [lastVaultPath, setLastVaultPath, removeLastVaultPath] = useLocalStorage<string | null>(
    LAST_VAULT_PATH_KEY,
    null,
  );
  const [workspaceName, setWorkspaceName] = useLocalStorage<string>(
    WORKSPACE_NAME_KEY,
    "Workspace",
  );

  const activeTab = useMemo(
    () => openTabs.find((tab) => tab.path === activeTabPath) ?? null,
    [activeTabPath, openTabs],
  );
  const selectedPath = activeTabPath;
  const canEdit = Boolean(vault && activeTabPath && activeTab);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => (b.updated_at_unix ?? 0) - (a.updated_at_unix ?? 0)),
    [notes],
  );

  const refreshNotes = async (vaultPath: string) => {
    const nextNotes = await listNotes(vaultPath);
    setNotes(nextNotes);
  };

  const refreshPreview = useCallback(async (path: string | null) => {
    if (!path) {
      setPdfPreviewPath(null);
      return;
    }

    try {
      setPreviewBusy(true);
      const resolved = await resolvePdfPreview(path);
      setPdfPreviewPath(resolved);
    } finally {
      setPreviewBusy(false);
    }
  }, []);

  const handleOpenVault = async (path: string, source: "startup" | "dialog" = "dialog") => {
    try {
      setBusy(true);
      setStatus("Opening vault...");
      const opened = await openOrCreateVault(path);
      setVault(opened);
      setVaultDialogPath(opened.root_path);
      await refreshNotes(opened.root_path);
      setOpenTabs([]);
      setActiveTabPath(null);
      setPdfPreviewPath(null);
      setLastVaultPath(opened.root_path);
      setVaultDialogOpen(false);
      setVaultDialogRequired(false);
      setStatus("Vault opened");
    } catch (error) {
      if (source === "startup") {
        removeLastVaultPath();
        setVaultDialogOpen(true);
        setVaultDialogRequired(true);
        setVaultDialogPath(suggestedVaultPath);
      }
      setStatus(String(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const resolveSuggestedPath = async () => {
      if (vault?.root_path) {
        setSuggestedVaultPath(vault.root_path);
        return;
      }

      if (lastVaultPath) {
        setSuggestedVaultPath(lastVaultPath);
        return;
      }

      try {
        const docs = await documentDir();
        const candidate = await join(docs, "GlyphVault");
        if (!cancelled) {
          setSuggestedVaultPath(candidate);
          setVaultDialogPath((current) => current || candidate);
        }
      } catch {
        if (!cancelled) {
          setSuggestedVaultPath("");
        }
      }
    };

    void resolveSuggestedPath();
    return () => {
      cancelled = true;
    };
  }, [lastVaultPath, vault?.root_path]);

  useEffect(() => {
    let cancelled = false;

    const restoreLastVault = async () => {
      if (vault) {
        return;
      }

      const lastPath = lastVaultPath?.trim() ?? "";
      if (!lastPath) {
        if (!cancelled) {
          setVaultDialogPath((current) => current || suggestedVaultPath);
          setVaultDialogOpen(true);
          setVaultDialogRequired(true);
        }
        return;
      }

      try {
        if (!cancelled) {
          setBusy(true);
          setStatus("Opening vault...");
        }
        const opened = await openOrCreateVault(lastPath);
        if (cancelled) {
          return;
        }
        setVault(opened);
        setVaultDialogPath(opened.root_path);
        const nextNotes = await listNotes(opened.root_path);
        setNotes(nextNotes);
        setOpenTabs([]);
        setActiveTabPath(null);
        setPdfPreviewPath(null);
        setVaultDialogOpen(false);
        setVaultDialogRequired(false);
        setStatus("Vault opened");
      } catch (error) {
        if (cancelled) {
          return;
        }
        removeLastVaultPath();
        setVaultDialogOpen(true);
        setVaultDialogRequired(true);
        setVaultDialogPath(suggestedVaultPath);
        setStatus(String(error));
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    };

    void restoreLastVault();
    return () => {
      cancelled = true;
    };
  }, [lastVaultPath, removeLastVaultPath, suggestedVaultPath, vault]);

  useEffect(() => {
    if (!vault?.root_path) {
      return;
    }

    if (!workspaceName.trim() || workspaceName === "Workspace") {
      setWorkspaceName(extractWorkspaceName(vault.root_path));
    }
  }, [setWorkspaceName, vault?.root_path, workspaceName]);

  useEffect(() => {
    void refreshPreview(activeTabPath);
  }, [activeTabPath, refreshPreview]);

  const handleCreateNote = async (title: string, engine: NoteEngine) => {
    if (!vault) {
      return;
    }

    try {
      setBusy(true);
      setStatus("Creating note...");
      const created = await createNote(vault.root_path, title, engine);
      await refreshNotes(vault.root_path);
      await handleOpenNote(created.path);
      setStatus("Note created");
    } catch (error) {
      setStatus(String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleQuickCreateTex = async () => {
    const id = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-")
      .replace("T", "_")
      .slice(0, 19);
    await handleCreateNote(`untitled-${id}`, "latex");
  };

  const handleOpenNote = async (path: string) => {
    const existingTab = openTabs.find((tab) => tab.path === path);
    if (existingTab) {
      setActiveTabPath(path);
      return;
    }

    try {
      setBusy(true);
      setStatus("Loading note...");
      const note = await readNote(path);
      setOpenTabs((tabs) => [...tabs, toOpenTab(note)]);
      setActiveTabPath(note.path);
      setStatus("Note loaded");
    } catch (error) {
      setStatus(String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNote = async () => {
    if (!activeTab || !vault) {
      return;
    }

    try {
      setBusy(true);
      setStatus("Saving note...");
      await saveNote(activeTab.path, activeTab.content);
      setOpenTabs((tabs) =>
        tabs.map((tab) => (tab.path === activeTab.path ? { ...tab, isDirty: false } : tab)),
      );
      await refreshNotes(vault.root_path);
      await refreshPreview(activeTab.path);
      setStatus("Saved");
    } catch (error) {
      setStatus(String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleTabContentChange = (value: string) => {
    if (!activeTabPath) {
      return;
    }

    setOpenTabs((tabs) =>
      tabs.map((tab) =>
        tab.path === activeTabPath ? { ...tab, content: value, isDirty: true } : tab,
      ),
    );
  };

  const handleCloseTab = (path: string) => {
    setOpenTabs((tabs) => {
      const index = tabs.findIndex((tab) => tab.path === path);
      if (index === -1) {
        return tabs;
      }

      const nextTabs = tabs.filter((tab) => tab.path !== path);
      if (activeTabPath === path) {
        const fallback = nextTabs[index] ?? nextTabs[index - 1] ?? null;
        setActiveTabPath(fallback?.path ?? null);
      }
      return nextTabs;
    });
  };

  const handleRenderPreview = async () => {
    if (!activeTab?.path) {
      return;
    }

    try {
      setRenderBusy(true);
      setStatus("Rendering PDF...");
      const pdfPath = await renderNotePdf(activeTab.path);
      setPdfPreviewPath(pdfPath);
      setStatus("Rendered");
    } catch (error) {
      setStatus(String(error));
    } finally {
      setRenderBusy(false);
    }
  };

  return (
    <main className="grid h-screen w-screen grid-cols-[48px_1fr] gap-0 overflow-hidden">
      <aside className="flex flex-col items-center gap-2 border-r bg-card/95 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          onClick={() => setSidebarOpen((value) => !value)}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          variant={sidebarOpen ? "secondary" : "ghost"}
          size="sm"
          className="size-8 p-0"
          title="Explorer"
          onClick={() => setSidebarOpen(true)}
        >
          <FolderTree className="size-4" />
        </Button>
      </aside>

      <section className="relative min-h-0">
        <Group orientation="horizontal" id="glyphnote-main-panels">
          {sidebarOpen && (
            <>
              <Panel defaultSize={24} minSize={16}>
                <div className="flex h-full min-h-0 border-r bg-card/65">
                  <div className="flex min-h-0 w-full flex-col">
                    <ExplorerPanel
                      notes={sortedNotes}
                      vaultPath={vault?.root_path ?? null}
                      selectedPath={selectedPath}
                      disabled={!vault || busy}
                      onQuickCreateTex={handleQuickCreateTex}
                      onRefresh={async () => {
                        if (vault?.root_path) {
                          await refreshNotes(vault.root_path);
                        }
                      }}
                      onOpenNote={handleOpenNote}
                    />
                    <WorkspacePanel
                      workspaceName={workspaceName}
                      onChangeWorkspaceName={setWorkspaceName}
                      onOpenSettings={() => {
                        setVaultDialogPath(vault?.root_path ?? lastVaultPath ?? suggestedVaultPath);
                        setVaultDialogRequired(false);
                        setVaultDialogOpen(true);
                      }}
                    />
                  </div>
                </div>
              </Panel>
              <ResizeHandle />
            </>
          )}

          <Panel defaultSize={46} minSize={26}>
            <section className="h-full min-h-0 pb-8">
              <EditorPanel
                title={activeTab?.title ?? "Editor"}
                path={activeTab?.path ?? null}
                tabs={openTabs.map((tab) => ({
                  path: tab.path,
                  title: tab.title,
                  engine: tab.engine,
                  isDirty: tab.isDirty,
                }))}
                activePath={activeTabPath}
                content={activeTab?.content ?? ""}
                loading={busy}
                disabled={!canEdit}
                onContentChange={handleTabContentChange}
                onSave={handleSaveNote}
                onActivateTab={setActiveTabPath}
                onCloseTab={handleCloseTab}
              />
            </section>
          </Panel>

          <ResizeHandle />

          <Panel defaultSize={30} minSize={20}>
            <section className="h-full min-h-0 pb-8">
              <PreviewPanel
                notePath={activeTab?.path ?? null}
                pdfPath={pdfPreviewPath}
                loading={previewBusy}
                renderBusy={renderBusy}
                onRefresh={async () => {
                  await refreshPreview(activeTab?.path ?? null);
                }}
                onRender={handleRenderPreview}
              />
            </section>
          </Panel>
        </Group>

        <footer className="absolute bottom-0 left-0 right-0 z-10 flex h-8 items-center justify-between border-t bg-card/80 px-3 text-xs text-muted-foreground">
          <span>{status}</span>
          <span className="inline-flex items-center gap-1">
            <BookOpenText className="size-3.5" />
            <Sparkles className="size-3.5" />
            Research flow
          </span>
        </footer>
      </section>

      <VaultDialog
        open={vaultDialogOpen}
        required={vaultDialogRequired || !vault}
        loading={busy}
        initialPath={vaultDialogPath || suggestedVaultPath}
        onSubmitPath={async (path) => {
          await handleOpenVault(path, "dialog");
        }}
        onClose={() => setVaultDialogOpen(false)}
      />
    </main>
  );
}

export default App;

function ResizeHandle() {
  return (
    <Separator className="group relative w-1 bg-border/30 transition-colors hover:bg-primary/70 data-[separator-active]:bg-primary">
      <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-border/20 group-hover:border-primary/50" />
    </Separator>
  );
}

function toOpenTab(note: NoteDocument): OpenTab {
  return {
    path: note.path,
    title: note.title,
    engine: note.engine,
    content: note.content,
    isDirty: false,
  };
}

function extractWorkspaceName(path: string): string {
  const parts = path.split(/[/\\]/g).filter(Boolean);
  return parts[parts.length - 1] ?? "Workspace";
}
