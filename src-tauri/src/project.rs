use std::{fs, path::PathBuf};

#[tauri::command]
pub fn get_projects(workspace: &str) -> Result<Vec<String>, String> {
    // Projects are .project files inside workspace directory.
    let v = fs::read_dir(workspace).map_err(|e| {
        format!(
            "[01] Error while reading workspace direcory {}: {:?}",
            workspace, e
        )
    })?;
    let mut projects: Vec<String> = Vec::new();
    for entry in v {
        let entry =
            entry.map_err(|e| format!("[01] Error while reading directory entry: {:?}", e))?;
        let file_name_result = entry.file_name().into_string();
        if let Ok(file_name) = file_name_result {
            let project_suffix = ".project";
            if file_name.ends_with(project_suffix) {
                let mut opt_file_name = file_name.clone();
                opt_file_name.truncate(file_name.len() - project_suffix.len());
                projects.push(opt_file_name);
            }
        }
    }
    Ok(projects)
}

#[tauri::command]
pub fn create_project(workspace: &str, name: &str) -> Result<bool, String> {
    let mut project_path = get_project_path(workspace, name);
    if project_path.exists() {
        // File or folder is present.
        return Err(format!("[04] Project with name {} already exists", name));
    } else {
        fs::write(&project_path, format!("{{ \"name\": \"{}\" }}", name))
            .map_err(|e| format!("Failed to create project: {:?}", e))?;
    }
    Ok(true)
}

#[tauri::command]
pub fn delete_project(workspace: &str, name: &str) -> Result<bool, String> {
    let project_path = get_project_path(workspace, name);
    if project_path.exists() {
        fs::remove_file(&project_path).map_err(|e| {
            format!(
                "[01] Failed to delete project {}: {:?}",
                &project_path.display(),
                e
            )
        })?;
    }
    Ok(true)
}

fn get_project_path(workspace: &str, name: &str) -> PathBuf {
    let mut project_path = PathBuf::from(workspace);
    project_path.push(format!("{}.project", name));
    project_path
}
