import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { FolderKanban } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

interface VaultDialogProps {
  open: boolean;
  required: boolean;
  loading: boolean;
  initialPath: string;
  onSubmitPath: (path: string) => Promise<void>;
  onClose: () => void;
}

export function VaultDialog({
  open,
  required,
  loading,
  initialPath,
  onSubmitPath,
  onClose,
}: VaultDialogProps) {
  const [pathInput, setPathInput] = useState(initialPath);

  useEffect(() => {
    if (open) {
      setPathInput(initialPath);
    }
  }, [initialPath, open]);

  const pickFolder = async () => {
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: "Select Vault Folder",
      defaultPath: pathInput.trim() || initialPath || undefined,
    });

    if (typeof selected === "string") {
      setPathInput(selected);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pathInput.trim()) {
      return;
    }
    await onSubmitPath(pathInput.trim());
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-xl border-border bg-card/95 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm tracking-wide text-muted-foreground uppercase">
            <FolderKanban className="size-4 text-primary" />
            {required ? "Create Or Select Vault" : "Vault Settings"}
          </CardTitle>
          <CardDescription>
            {required
              ? "A vault is required. Enter a path to create or open one."
              : "Change the current vault path."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={submit}>
            <Label htmlFor="vault-path-input">Vault Path</Label>
            <Input
              id="vault-path-input"
              value={pathInput}
              onChange={(event) => setPathInput(event.currentTarget.value)}
              placeholder="C:\\Users\\Type-\\Documents\\GlyphVault"
            />
            <div className="flex justify-start">
              <Button type="button" variant="outline" onClick={pickFolder} disabled={loading}>
                Browse Folder
              </Button>
            </div>
            <div className="flex items-center justify-end gap-2">
              {!required && (
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading || !pathInput.trim()}>
                {loading ? "Opening..." : "Open / Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
