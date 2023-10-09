use std::{fs, path::PathBuf};

use crate::state::{set_active_workspace, ActiveWorkspace};

#[tauri::command]
pub fn current_workspace(state: tauri::State<ActiveWorkspace>) -> Result<Option<String>, String> {
    let p = get_workspace_file()?;
    if p.is_file() {
        let workspace_path = fs::read_to_string(&p)
            .map_err(|e| format!("[01] Failed to read workspace file: {:?}", e))?;
        // Our core assumption is we only have one active workspace at a time which is okay.
        set_active_workspace(state, &workspace_path)?;
        Ok(Some(workspace_path))
    } else {
        Ok(None)
    }
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
        .map(|d| d.join("anvi").join("workspace.txt"))
        .ok_or_else(|| "[01] No cache directory found.".to_string())
}
