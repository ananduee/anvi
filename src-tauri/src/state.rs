use std::{path::PathBuf, sync::RwLock};

use sled::Db;

pub struct ActiveWorkspace(pub RwLock<Option<(Db, String)>>);

pub fn set_active_workspace(
    state: tauri::State<ActiveWorkspace>,
    path: &str,
) -> Result<(), String> {
    let mut state_guard = state.0.write().unwrap();
    let is_path_same = state_guard.as_ref().map(|x| x.1.eq(path)).unwrap_or(false);
    if !is_path_same {
        // We need to initialize now.
        let mut cache_file_path = PathBuf::from(path);
        cache_file_path.push("cache.db");
        let db = sled::open(cache_file_path.to_str().unwrap())
            .map_err(|e| format!("[01] Failed to open cache db. {:?}", e))?;
        *state_guard = Some((db, path.to_string()));
    }
    Ok(())
}
