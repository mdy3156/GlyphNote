import { convertFileSrc } from "@tauri-apps/api/core";
import { Eye, FileSearch, RefreshCcw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

interface PreviewPanelProps {
  notePath: string | null;
  pdfPath: string | null;
  loading: boolean;
  renderBusy: boolean;
  onRefresh: () => Promise<void>;
  onRender: () => Promise<void>;
}

export function PreviewPanel({
  notePath,
  pdfPath,
  loading,
  renderBusy,
  onRefresh,
  onRender,
}: PreviewPanelProps) {
  const previewSrc = pdfPath ? convertFileSrc(pdfPath) : null;

  return (
    <Card className="flex h-full min-h-0 flex-col rounded-none border-y-0 border-r-0 bg-card/90">
      <CardHeader className="flex-row items-center justify-between border-b px-3 py-2">
        <CardTitle className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
          Preview
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={() => void onRender()}
            disabled={renderBusy || !notePath}
            title="Render PDF"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={() => void onRefresh()}
            disabled={loading || !notePath}
            title="Refresh preview"
          >
            <RefreshCcw className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        {previewSrc ? (
          <iframe title="PDF Preview" src={previewSrc} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <FileSearch className="size-5" />
            <p>No rendered PDF found.</p>
            <p className="max-w-[240px] text-center">
              Generate a PDF beside the note file to preview it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
