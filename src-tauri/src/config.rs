use std::{fs, path::PathBuf};

#[tauri::command]
pub fn current_workspace() -> Option<String> {
    get_workspace_file()
        .map(|p| {
            if p.is_file() {
                fs::read_to_string(&p).ok()
            } else {
                None
            }
        })
        .ok()
        .flatten()
}

#[tauri::command]
pub fn set_current_workspace(path: &str) -> Result<bool, String> {
    get_workspace_file().and_then(|workspace_file| {
        if workspace_file.is_file() {
            // If file exists lets remove it and then write. Ignore error.
            fs::remove_file(&workspace_file)
                .map_err(|e| format!("[03] Failed to remove workspace file: {:?}", e))?;
        }
        fs::write(&workspace_file, path).map(|_| true).map_err(|e| {
            format!(
                "[02] Error while writing to file {}: {:?}",
                workspace_file.display(),
                e
            )
        })
    })
}

fn get_workspace_file() -> Result<PathBuf, String> {
    tauri::api::path::cache_dir()
        .map(|d| d.join("workspace.txt"))
        .ok_or_else(|| "[01] No cache directory found.".to_string())
}
