use std::io::prelude::*;
use std::ops::Add;
use std::path::MAIN_SEPARATOR;
use std::{fs::File, io::BufReader, path::PathBuf};

use chrono::{DateTime, FixedOffset};
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

#[derive(Debug, Deserialize, Serialize)]
struct TaskMetadata {
    #[serde(skip_deserializing)]
    id: String,
    title: String,
    completed: bool,
    stack: String,
    status: String,
    priority: u8,
    created_at: DateTime<FixedOffset>,
    due_date: Option<DateTime<FixedOffset>>,
    tags: Option<Vec<String>>,
    blocked_till: Option<DateTime<FixedOffset>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct TaskComment {
    created_at: DateTime<FixedOffset>,
    comment: String
}

#[derive(Debug, Deserialize, Serialize)]
struct TaskTimeLog {
    start_time: DateTime<FixedOffset>,
    end_time: DateTime<FixedOffset>,
    duration_minutes: u32
}

#[derive(Debug, Deserialize, Serialize)]
struct TaskDetails {
    metadata: TaskMetadata,
    content: String,
    comments: Vec<TaskComment>,
    time_logs: Vec<TaskTimeLog>
}

#[tauri::command]
pub fn get_tasks(workspace: &str, project: &str) -> Result<String, String> {
    let mut path = PathBuf::from(workspace);
    path.push(project);
    path.push("tasks");
    let task_files = WalkDir::new(&path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(move |e| {
            if e.file_type().is_dir() {
                return false;
            }

            let path = e.path();
            return path.extension().map(|x| x.eq("md")).unwrap_or(false);
        });
    let mut tasks = Vec::new();
    for d in task_files {
        let f = File::open(d.path())
            .map_err(|e| format!("Failed to read file {}: {:?}", d.path().display(), e))?;
        let mut reader = BufReader::new(f);
        let mut buf = String::new();
        let mut front_matter_started = false;
        loop {
            let bytes_read = reader
                .read_line(&mut buf)
                .map_err(|e| format!("Error reading line: {:?}", e))?;
            if bytes_read == 0 {
                break;
            }
            if !front_matter_started {
                // Since frontmatter has not started we need to reset the buffer.
                let (op_buf, op_front_matter_started) = is_start_of_frontmatter(buf);
                buf = op_buf;
                front_matter_started = op_front_matter_started;
            } else {
                // Now we keep reading till we reach state where string ends with ---\n or ---\r\n
                let (op_buf, loop_end) = is_end_of_frontmatter(buf);
                buf = op_buf;
                if loop_end {
                    break;
                }
            }
        }
        // parse buf which us yaml to object.
        if buf.len() > 0 {
            let mut task: TaskMetadata = serde_yaml::from_str(&buf)
                .map_err(|e| format!("Failed to convert data to Taskmetdata: {:?}", e))?;
            if !task.completed {
                // Calling unwrap is safe as we have read the path successfully in line above.
                task.id = d
                    .path()
                    .to_str()
                    .unwrap()
                    .strip_prefix(path.to_str().unwrap())
                    .unwrap()
                    .strip_prefix(MAIN_SEPARATOR)
                    .unwrap()
                    .to_string();
                tasks.push(task);
            }
        }
    }
    serde_json::to_string(&tasks).map_err(|e| format!("Failed to convert tasks to json: {:?}", e))
}

pub fn get_task_details(workspace: &str, project: &str, task_id: &str) -> Result<String, String> {
    let mut path = PathBuf::from(workspace);
    path.push(project);
    path.push("tasks");
    path.push(task_id);
    let f = File::open(&path)
            .map_err(|e| format!("Failed to read file {}: {:?}", path.display(), e))?;
    let mut reader = BufReader::new(f);
    let mut front_matter_started = false;
    let mut front_matter_ended = false;
    let mut front_matter_text = String::new();
    let mut main_body_text = String::new();
    let mut reader_iter = reader.lines().into_iter();
    loop {
        match reader_iter.next() {
            None => break,
            Some(Err(e)) => {
                return Err(format!("Error while reading line : {:?}", e));
            }
            Some(Ok(l)) => {
                if !front_matter_started && l.ends_with("---") {
                    front_matter_started = true;
                } else if front_matter_started && !l.ends_with("---") {
                    front_matter_text.push_str(&l);
                    front_matter_text.push('\n');
                } else {
                    front_matter_ended = true;
                    break;
                }
            }
        }
    }
    if front_matter_ended {

    }
    /* 
    for l in reader.lines() {
        let l = l.map_err(|e| format!("Error reading line: {:?}", e))?;
        if !front_matter_ended {
            if !front_matter_started && l.ends_with("---") {
                front_matter_started = true;
            } else if front_matter_started && !l.ends_with("---") {
                front_matter_text.push_str(&l);
                front_matter_text.push('\n');
            } else {
                front_matter_ended = true;
            }
        } else if !updates_started {
            // This is core body
        }
    } */
    Ok("()".to_string())
}

fn is_end_of_frontmatter(mut buf: String) -> (String, bool) {
    if buf.ends_with("---\n") {
        buf.truncate(buf.len() - 4);
        return (buf, true);
    } else if buf.ends_with("---\r\n") {
        buf.truncate(buf.len() - 5);
        return (buf, true);
    } else if buf.ends_with("---") {
        buf.truncate(buf.len() - 3);
        return (buf, true);
    }
    return (buf, false);
}

fn is_start_of_frontmatter(mut buf: String) -> (String, bool) {
    let mut front_matter_started = false;
    if buf.ends_with('\n') {
        buf.pop();
        if buf.ends_with('\r') {
            buf.pop();
        }
    }
    if buf.ends_with("---") {
        front_matter_started = true;
    }
    buf.truncate(0);
    (buf, front_matter_started)
}
