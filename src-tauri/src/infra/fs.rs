use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use crate::domain::note::{NoteDocument, NoteEngine, NoteSummary};
use crate::errors::{AppError, AppResult};

pub fn ensure_dir(path: &Path) -> AppResult<()> {
    fs::create_dir_all(path)?;
    Ok(())
}

pub fn read_file(path: &Path) -> AppResult<String> {
    Ok(fs::read_to_string(path)?)
}

pub fn write_file(path: &Path, content: &str) -> AppResult<()> {
    fs::write(path, content)?;
    Ok(())
}

pub fn list_note_files(root: &Path) -> AppResult<Vec<PathBuf>> {
    if !root.exists() {
        return Err(AppError::NotFound(format!("directory does not exist: {}", root.display())));
    }

    let mut out = Vec::new();
    collect_note_files(root, &mut out)?;
    Ok(out)
}

fn collect_note_files(dir: &Path, out: &mut Vec<PathBuf>) -> AppResult<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            collect_note_files(&path, out)?;
            continue;
        }

        if let Some(engine) = NoteEngine::from_path(&path) {
            let _ = engine;
            out.push(path);
        }
    }

    Ok(())
}

pub fn to_note_summary(path: &Path) -> AppResult<NoteSummary> {
    let engine = NoteEngine::from_path(path)
        .ok_or_else(|| AppError::InvalidInput(format!("unsupported note extension: {}", path.display())))?;
    let title = path
        .file_stem()
        .map(|v| v.to_string_lossy().to_string())
        .unwrap_or_else(|| String::from("untitled"));

    let updated_at_unix = fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    Ok(NoteSummary {
        path: path.to_string_lossy().to_string(),
        title,
        engine,
        updated_at_unix,
    })
}

pub fn to_note_document(path: &Path) -> AppResult<NoteDocument> {
    let content = read_file(path)?;
    let summary = to_note_summary(path)?;

    Ok(NoteDocument {
        path: summary.path,
        title: summary.title,
        engine: summary.engine,
        content,
    })
}
