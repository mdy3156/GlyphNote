export type NoteEngine = "latex" | "typst";

export interface VaultInfo {
  root_path: string;
  note_count: number;
}

export interface NoteSummary {
  path: string;
  title: string;
  engine: NoteEngine;
  updated_at_unix: number | null;
}

export interface NoteDocument {
  path: string;
  title: string;
  engine: NoteEngine;
  content: string;
}
