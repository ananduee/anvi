use std::fs::OpenOptions;
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
    last_line: String,
}

impl TaskFileReader {
    pub fn new(workspace: &str, project: &str, task_id: &str) -> Result<TaskFileReader, String> {
        let mut path = get_task_path(workspace, project, task_id);
        let f = File::open(&path)
            .map_err(|e| format!("Failed to read file {}: {:?}", path.display(), e))?;
        let reader = BufReader::new(f);
        Ok(TaskFileReader {
            inner_iter: reader.lines().into_iter(),
            last_line: "".to_string(),
        })
    }

    pub fn last_line(&self) -> String {
        self.last_line.to_string()
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
                        break;
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

#[tauri::command]
pub fn get_task_details(workspace: &str, project: &str, task_id: &str) -> Result<String, String> {
    let mut task_reader = TaskFileReader::new(workspace, project, task_id)?;
    let (match_found, _) = task_reader.consume_till_line_ends_with("---")?;
    if !match_found {
        return Err(format!("No metadata found for task {}", task_id));
    }
    let (_, frontmatter_text) = task_reader.consume_till_line_ends_with("---")?;
    let (match_found, task_body) =
        task_reader.consume_till_line_starts_with("## MD:Task Updates")?;
    let mut task_comments: Vec<TaskComment> = Vec::new();
    let mut task_time_logs: Vec<TaskTimeLog> = Vec::new();
    if match_found {
        // Now we can read comments and events logs.
        let (match_found, _) = task_reader.consume_till_line_starts_with("### MD:")?;
        if match_found {
            loop {
                // Start by reading the heading.
                let heading_line = task_reader.last_line();
                // unwrap is safe since it has just matched before the loop.
                let headling_line_txt = heading_line.strip_prefix("### MD:").unwrap();
                if headling_line_txt.starts_with("Comment") {
                    // This is a comment post which we will have date.
                    let date_txt = headling_line_txt.strip_prefix("Comment").unwrap().trim();
                    let comment_time = DateTime::parse_from_rfc3339(date_txt).map_err(|e| {
                        format!(
                            "Failed to parse date string {} in task {} : {:?}",
                            date_txt, task_id, e
                        )
                    })?;
                    let (match_found, comment_body) =
                        task_reader.consume_till_line_starts_with("### MD:")?;
                    task_comments.push(TaskComment {
                        created_at: comment_time,
                        comment: comment_body,
                    });
                    if !match_found {
                        break;
                    }
                } else if headling_line_txt.starts_with("TimeLog") {
                    let mut time_txt_parts = headling_line_txt
                        .strip_prefix("TimeLog")
                        .unwrap()
                        .trim()
                        .splitn(2, " ");
                    // index 0 will always be accesible.
                    let start_time_txt = time_txt_parts.nth(0).unwrap();
                    // We need to read 0 again as iterator will be mutated.
                    let end_time_txt = time_txt_parts.nth(0).ok_or_else(|| {
                        format!(
                            "No end date found in time log line {} in file {}",
                            headling_line_txt, task_id
                        )
                    })?;
                    let start_time = DateTime::parse_from_rfc3339(start_time_txt).map_err(|e| {
                        format!(
                            "Failed to parse time log start time {} in task {}: {:?}",
                            start_time_txt, task_id, e
                        )
                    })?;
                    let end_time = DateTime::parse_from_rfc3339(end_time_txt).map_err(|e| {
                        format!(
                            "Failed to parse time log end time {} in task {}: {:?}",
                            end_time_txt, task_id, e
                        )
                    })?;
                    task_time_logs.push(TaskTimeLog {
                        start_time,
                        end_time,
                    });
                    // For time logs we simply ignore the contents under heading.
                    let (match_found, _) = task_reader.consume_till_line_starts_with("### MD:")?;
                    if !match_found {
                        break;
                    }
                }
            }
        }
    }

    let mut task_metadata: TaskMetadata = serde_yaml::from_str(&frontmatter_text)
        .map_err(|e| format!("Failed to parse metadata text : {:?}", e))?;
    task_metadata.id = task_id.to_string();
    let task_details = TaskDetails {
        content: task_body,
        metadata: task_metadata,
        comments: task_comments,
        time_logs: task_time_logs,
    };
    serde_json::to_string(&task_details)
        .map_err(|e| format!("Failed to convert task details to string: {:?}", e))
}

pub fn update_task(workspace: &str, project: &str, task: &str) -> Result<bool, String> {
    let task: TaskDetails = serde_json::from_str(task)
        .map_err(|e| format!("Error while reading task body: {:?}", e))?;
    let path = get_task_path(workspace, project, &task.metadata.id);
    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(path)
        .map_err(|e| format!("[04] Failed to open task file {:?}", e))?;
    write_to_file(&file, "---\n")?;
    // Now we need to write front matter yaml.
    serde_yaml::to_writer(&mut file, &task.metadata)
        .map_err(|e| format!("[04] Failed to write yaml to file: {:?}", e))?;
    write_to_file(&file, "\n---\n")?;
    write_to_file(&file, &task.content)?;
    write_to_file(&file, "\n## MD:Task Updates\n")?;
    // Sort comments and event logs in descending order.
    task.comments.iter().
    Ok(true)
}

fn write_to_file(mut file: &File, content: &str) -> Result<(), String> {
    file.write_all(content.as_bytes()).map_err(|e| format!("[04] Failed to write to file: {:?}", e))
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

fn get_task_path(workspace: &str, project: &str, task_id: &str) -> PathBuf {
    let mut path = PathBuf::from(workspace);
    path.push(project);
    path.push("tasks");
    path.push(task_id);
    path
}
