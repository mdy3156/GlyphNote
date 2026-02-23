use std::path::{Path, PathBuf};
use std::process::Command;

use crate::domain::note::{NoteDocument, NoteEngine, NoteSummary};
use crate::errors::{AppError, AppResult};
use crate::infra::fs;

pub fn create_note(vault_path: &str, title: &str, engine: NoteEngine) -> AppResult<NoteSummary> {
    let clean_title = title.trim();
    if clean_title.is_empty() {
        return Err(AppError::InvalidInput(String::from("title must not be empty")));
    }

    let notes_dir = Path::new(vault_path).join("notes");
    fs::ensure_dir(&notes_dir)?;

    let slug = slugify(clean_title);
    let mut candidate = notes_dir.join(format!("{}.{}", slug, engine.extension()));
    let mut index: usize = 2;
    while candidate.exists() {
        candidate = notes_dir.join(format!("{}-{}.{}", slug, index, engine.extension()));
        index += 1;
    }

    fs::write_file(&candidate, &note_template(clean_title, &engine))?;
    fs::to_note_summary(&candidate)
}

pub fn read_note(path: &str) -> AppResult<NoteDocument> {
    let note_path = Path::new(path);
    if !note_path.exists() {
        return Err(AppError::NotFound(format!("note does not exist: {}", note_path.display())));
    }

    fs::to_note_document(note_path)
}

pub fn save_note(path: &str, content: &str) -> AppResult<()> {
    let note_path = PathBuf::from(path);
    if !note_path.exists() {
        return Err(AppError::NotFound(format!("note does not exist: {}", note_path.display())));
    }

    fs::write_file(&note_path, content)
}

pub fn resolve_pdf_preview(path: &str) -> Option<String> {
    let note_path = Path::new(path);
    let stem = note_path.file_stem()?.to_string_lossy();
    let parent = note_path.parent()?;
    let pdf_path = parent.join(format!("{stem}.pdf"));
    if pdf_path.exists() {
        Some(pdf_path.to_string_lossy().to_string())
    } else {
        None
    }
}

pub fn render_note_pdf(path: &str) -> AppResult<String> {
    let note_path = Path::new(path);
    if !note_path.exists() {
        return Err(AppError::NotFound(format!("note does not exist: {}", note_path.display())));
    }

    let engine = NoteEngine::from_path(note_path).ok_or_else(|| {
        AppError::InvalidInput(format!(
            "unsupported note extension for render: {}",
            note_path.display()
        ))
    })?;

    let stem = note_path.file_stem().ok_or_else(|| {
        AppError::InvalidInput(format!("failed to resolve file stem: {}", note_path.display()))
    })?;
    let parent = note_path.parent().ok_or_else(|| {
        AppError::InvalidInput(format!("failed to resolve parent dir: {}", note_path.display()))
    })?;
    let pdf_path = parent.join(format!("{}.pdf", stem.to_string_lossy()));

    match engine {
        NoteEngine::Latex => run_latex_with_texlive(note_path, parent)?,
        NoteEngine::Typst => run_process(
            "typst",
            &[
                "compile",
                note_path.to_string_lossy().as_ref(),
                pdf_path.to_string_lossy().as_ref(),
            ],
        )?,
    }

    if !pdf_path.exists() {
        return Err(AppError::NotFound(format!(
            "render finished but pdf not found: {}",
            pdf_path.display()
        )));
    }

    Ok(pdf_path.to_string_lossy().to_string())
}

fn run_process(bin: &str, args: &[&str]) -> AppResult<()> {
    let output = Command::new(bin).args(args).output().map_err(|err| {
        if err.kind() == std::io::ErrorKind::NotFound {
            AppError::InvalidInput(format!("{bin} is not installed or not in PATH"))
        } else {
            AppError::Io(err)
        }
    })?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let details = if !stderr.is_empty() { stderr } else { stdout };

    Err(AppError::InvalidInput(if details.is_empty() {
        format!("{bin} exited with status {}", output.status)
    } else {
        format!("{bin} failed: {details}")
    }))
}

fn run_latex_with_texlive(note_path: &Path, out_dir: &Path) -> AppResult<()> {
    let note = note_path.to_string_lossy().to_string();
    let out = out_dir.to_string_lossy().to_string();

    if run_process_allow_missing(
        "latexmk",
        &[
            "-pdf",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-outdir",
            out.as_str(),
            note.as_str(),
        ],
    )?
    .is_some()
    {
        return Ok(());
    }

    // Fallback for environments without latexmk.
    run_process(
        "pdflatex",
        &[
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-output-directory",
            out.as_str(),
            note.as_str(),
        ],
    )?;
    run_process(
        "pdflatex",
        &[
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-output-directory",
            out.as_str(),
            note.as_str(),
        ],
    )?;
    Ok(())
}

fn run_process_allow_missing(bin: &str, args: &[&str]) -> AppResult<Option<()>> {
    let output = match Command::new(bin).args(args).output() {
        Ok(output) => output,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(err) => return Err(AppError::Io(err)),
    };

    if output.status.success() {
        return Ok(Some(()));
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let details = if !stderr.is_empty() { stderr } else { stdout };
    Err(AppError::InvalidInput(if details.is_empty() {
        format!("{bin} exited with status {}", output.status)
    } else {
        format!("{bin} failed: {details}")
    }))
}

fn slugify(input: &str) -> String {
    let mut out = String::new();
    for ch in input.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch.to_ascii_lowercase());
        } else if (ch.is_whitespace() || ch == '-' || ch == '_') && !out.ends_with('-') {
            out.push('-');
        }
    }

    let trimmed = out.trim_matches('-').to_string();
    if trimmed.is_empty() {
        String::from("note")
    } else {
        trimmed
    }
}

fn note_template(title: &str, engine: &NoteEngine) -> String {
    match engine {
        NoteEngine::Latex => format!(
            "\\documentclass{{article}}\n\\usepackage{{amsmath,amssymb,amsthm}}\n\n\\title{{{title}}}\n\\begin{{document}}\n\\maketitle\n\n% Write your theorem / derivation here\n\n\\end{{document}}\n"
        ),
        NoteEngine::Typst => format!(
            "#set document(title: \"{title}\")\n\n= {title}\n\n// Write your theorem / derivation here\n"
        ),
    }
}
