use crate::domain::note::{NoteDocument, NoteEngine, NoteSummary};
use crate::services::note_service;

#[tauri::command]
pub fn create_note(
    vault_path: String,
    title: String,
    engine: String,
) -> Result<NoteSummary, String> {
    let engine = parse_engine(&engine)?;
    note_service::create_note(&vault_path, &title, engine).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_note(path: String) -> Result<NoteDocument, String> {
    note_service::read_note(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_note(path: String, content: String) -> Result<(), String> {
    note_service::save_note(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resolve_pdf_preview(path: String) -> Result<Option<String>, String> {
    Ok(note_service::resolve_pdf_preview(&path))
}

#[tauri::command]
pub fn render_note_pdf(path: String) -> Result<String, String> {
    note_service::render_note_pdf(&path).map_err(|e| e.to_string())
}

fn parse_engine(raw: &str) -> Result<NoteEngine, String> {
    match raw.trim().to_lowercase().as_str() {
        "latex" => Ok(NoteEngine::Latex),
        "typst" => Ok(NoteEngine::Typst),
        _ => Err(format!("unsupported engine: {raw}")),
    }
}
