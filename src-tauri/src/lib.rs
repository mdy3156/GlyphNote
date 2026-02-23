mod commands;
mod domain;
mod errors;
mod infra;
mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::vault::open_or_create_vault,
            commands::vault::list_notes,
            commands::note::create_note,
            commands::note::read_note,
            commands::note::save_note,
            commands::note::resolve_pdf_preview,
            commands::note::render_note_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
