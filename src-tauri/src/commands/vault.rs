use crate::domain::note::{NoteSummary, VaultInfo};
use crate::services::vault_service;

#[tauri::command]
pub fn open_or_create_vault(path: String) -> Result<VaultInfo, String> {
    vault_service::open_or_create_vault(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_notes(vault_path: String) -> Result<Vec<NoteSummary>, String> {
    vault_service::list_notes(&vault_path).map_err(|e| e.to_string())
}
