use std::path::{Path, PathBuf};

use crate::domain::note::{NoteSummary, VaultInfo};
use crate::errors::{AppError, AppResult};
use crate::infra::fs;

pub fn open_or_create_vault(path: &str) -> AppResult<VaultInfo> {
    let root = Path::new(path);
    if path.trim().is_empty() {
        return Err(AppError::InvalidInput(String::from("vault path must not be empty")));
    }

    fs::ensure_dir(root)?;
    fs::ensure_dir(&root.join("notes"))?;

    let note_count = list_notes(path)?.len();
    Ok(VaultInfo {
        root_path: root.to_string_lossy().to_string(),
        note_count,
    })
}

pub fn list_notes(vault_path: &str) -> AppResult<Vec<NoteSummary>> {
    let root = Path::new(vault_path);
    if !root.exists() {
        return Err(AppError::NotFound(format!("vault does not exist: {}", root.display())));
    }

    let notes_dir: PathBuf = root.join("notes");
    fs::ensure_dir(&notes_dir)?;

    let mut notes: Vec<NoteSummary> = fs::list_note_files(&notes_dir)?
        .iter()
        .map(|p| fs::to_note_summary(p))
        .collect::<AppResult<Vec<_>>>()?;

    notes.sort_by(|a, b| b.updated_at_unix.cmp(&a.updated_at_unix));
    Ok(notes)
}
