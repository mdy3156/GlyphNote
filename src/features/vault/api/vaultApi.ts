import { invoke } from "@tauri-apps/api/core";
import type { NoteSummary, VaultInfo } from "../../../shared/types/note";

export const openOrCreateVault = async (path: string): Promise<VaultInfo> => {
  return invoke<VaultInfo>("open_or_create_vault", { path });
};

export const listNotes = async (vaultPath: string): Promise<NoteSummary[]> => {
  return invoke<NoteSummary[]>("list_notes", { vaultPath });
};
