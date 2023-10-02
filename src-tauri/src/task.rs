use std::io::{prelude::*, Lines};
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
    comment: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct TaskTimeLog {
    start_time: DateTime<FixedOffset>,
    end_time: DateTime<FixedOffset>,
    duration_minutes: u32,
}

#[derive(Debug, Deserialize, Serialize)]
struct TaskDetails {
    metadata: TaskMetadata,
    content: String,
    comments: Vec<TaskComment>,
    time_logs: Vec<TaskTimeLog>,
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

struct TaskFileReader {
    inner_iter: Lines<BufReader<File>>,
    last_line: String
}

impl TaskFileReader {
    pub fn new(workspace: &str, project: &str, task_id: &str) -> Result<TaskFileReader, String> {
        let mut path = PathBuf::from(workspace);
        path.push(project);
        path.push("tasks");
        path.push(task_id);
        let f = File::open(&path)
            .map_err(|e| format!("Failed to read file {}: {:?}", path.display(), e))?;
        let reader = BufReader::new(f);
        Ok(TaskFileReader { inner_iter: reader.lines().into_iter(), last_line: "".to_string() })
    }

    pub fn consume_till_line_ends_with(
        &mut self,
        suffix: &'static str,
    ) -> Result<(bool, String), String> {
        let matcher = Box::new(move |l: &str| l.ends_with(suffix));
        self.consume_till(matcher)
    }

    pub fn consume_till_line_starts_with(
        &mut self,
        prefix: &'static str,
    ) -> Result<(bool, String), String> {
        let matcher = Box::new(move |l: &str| l.starts_with(prefix));
        self.consume_till(matcher)
    }

    fn consume_till(
        &mut self,
        matcher: Box<dyn Fn(&str) -> bool>,
    ) -> Result<(bool, String), String> {
        let mut buf = String::new();
        let mut match_found = false;
        loop {
            match self.inner_iter.next() {
                None => break,
                Some(Err(e)) => {
                    return Err(format!("Error while reading line: {:?}", e));
                }
                Some(Ok(l)) => {
                    if matcher(&l) {
                        // We need to stop here. For now lets ignore this line.
                        match_found = true;
                        self.last_line = l;
                    } else {
                        buf.push_str(&l);
                        buf.push('\n');
                        self.last_line = l;
                    }
                }
            }
        }
        return Ok((match_found, buf));
    }
}

pub fn get_task_details(workspace: &str, project: &str, task_id: &str) -> Result<String, String> {
    let mut task_reader = TaskFileReader::new(workspace, project, task_id)?;
    let (match_found, _) = task_reader.consume_till_line_ends_with("---")?;
    if !match_found {
        return Err(format!("No metadata found for task {}", task_id));
    }
    let (_, frontmatter_text) = task_reader.consume_till_line_ends_with("---")?;
    let (match_found, task_body) = task_reader.consume_till_line_starts_with("## MD:Task Updates")?;
    if match_found {
        // Now we can read comments and events logs.
        
    }
    /*
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
    let mut main_body_finished = false;
    if front_matter_ended {
        loop {
            match reader_iter.next() {
                None => break,
                Some(Err(e)) => {
                    return Err(format!("Error while reading line : {:?}", e));
                },
                Some(Ok(l)) => {
                    if l.starts_with("## MD:Task Logs") {
                        main_body_finished = true;
                        break;
                    } else {
                        main_body_text.push_str(&l);
                        main_body_text.push('\n');
                    }
                }
            }
        }
    }
    if main_body_finished {
        loop {

        }
    }*/
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
