import { invoke } from "@tauri-apps/api/core";
import type { NoteDocument, NoteEngine, NoteSummary } from "../../../shared/types/note";

export const createNote = async (
  vaultPath: string,
  title: string,
  engine: NoteEngine,
): Promise<NoteSummary> => {
  return invoke<NoteSummary>("create_note", { vaultPath, title, engine });
};

export const readNote = async (path: string): Promise<NoteDocument> => {
  return invoke<NoteDocument>("read_note", { path });
};

export const saveNote = async (path: string, content: string): Promise<void> => {
  return invoke<void>("save_note", { path, content });
};

export const resolvePdfPreview = async (path: string): Promise<string | null> => {
  return invoke<string | null>("resolve_pdf_preview", { path });
};

export const renderNotePdf = async (path: string): Promise<string> => {
  return invoke<string>("render_note_pdf", { path });
};
