import { invoke } from "@tauri-apps/api";

export interface Project {
  name: string;
  stacks?: Array<string>;
}

class LocalTauriClient {
  getCurrentWorkspace(): Promise<null | string> {
    return this.invokeDebug("current_workspace").then((response) => {
      return response as null | string;
    });
  }

  setCurrentWorkspace(path: string): Promise<boolean> {
    return this.invokeDebug("set_current_workspace", { path }).then(
      (response) => {
        return response as boolean;
      }
    );
  }

  getProject(workspace: string, name: string): Promise<Project> {
    return this.invokeDebug("get_project", { workspace, name }).then(
      (response) => {
        return JSON.parse(response as string) as Project;
      }
    );
  }

  getProjects(workspace: string): Promise<Array<string>> {
    return this.invokeDebug("get_projects", { workspace }).then((response) => {
      return response as Array<string>;
    });
  }

  createProject(workspace: string, name: string): Promise<boolean> {
    return this.invokeDebug("create_project", { workspace, name }).then(
      (response) => {
        return response as boolean;
      }
    );
  }

  updateProject(
    workspace: string,
    project: Project
  ): Promise<boolean> {
    return this.invokeDebug("update_project", {
      workspace,
      name: project.name,
      details: JSON.stringify(project),
    }).then((r) => {
      return r as boolean;
    });
  }

  deleteProject(workspace: string, name: string): Promise<boolean> {
    return this.invokeDebug("delete_project", { workspace, name }).then(
      (response) => {
        return response as boolean;
      }
    );
  }

  private invokeDebug(command: string, props?: any): Promise<unknown> {
    console.log("invoking command", command, "props", props);
    return invoke(command, props)
      .then((response) => {
        console.log("raw response", response);
        return response;
      })
      .catch((e) => {
        console.log("errpr", e);
        throw e;
      });
  }
}

export const tauriClient = new LocalTauriClient();
