use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NoteEngine {
    Latex,
    Typst,
}

impl NoteEngine {
    pub fn extension(&self) -> &'static str {
        match self {
            Self::Latex => "tex",
            Self::Typst => "typ",
        }
    }

    pub fn from_path(path: &std::path::Path) -> Option<Self> {
        let ext = path.extension()?.to_string_lossy().to_lowercase();
        match ext.as_str() {
            "tex" => Some(Self::Latex),
            "typ" => Some(Self::Typst),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct NoteSummary {
    pub path: String,
    pub title: String,
    pub engine: NoteEngine,
    pub updated_at_unix: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct NoteDocument {
    pub path: String,
    pub title: String,
    pub engine: NoteEngine,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct VaultInfo {
    pub root_path: String,
    pub note_count: usize,
}
