// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::RwLock;

mod config;
mod project;
mod state;
mod task;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let r = task::get_tasks("/Users/anasinha/Documents/Anvi", "Anand");
    println!("data: {}",r.unwrap());
    /*tauri::Builder::default()
        .manage(state::ActiveWorkspace(RwLock::new(None)))
        .invoke_handler(tauri::generate_handler![
            greet,
            config::current_workspace,
            config::set_current_workspace,
            project::get_projects,
            project::get_project,
            project::create_project,
            project::update_project,
            project::delete_project,
            task::get_tasks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");*/
}
