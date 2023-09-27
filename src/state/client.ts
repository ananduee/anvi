import { invoke } from "@tauri-apps/api";

class LocalTauriClient {
  getCurrentWorkspace(): Promise<null | string> {
    return invoke("current_workspace").then((response) => {
      return response as null | string;
    });
  }

  setCurrentWorkspace(path: string): Promise<boolean> {
    return invoke("set_current_workspace", { path }).then((response) => {
      return response as boolean;
    });
  }

  getProjects(workspace: string): Promise<Array<string>> {
    return invoke("get_projects", { workspace }).then((response) => {
      return response as Array<string>;
    });
  }

  createProject(workspace: string, name: string): Promise<boolean> {
    return invoke("create_project", { workspace, name }).then((response) => {
      return response as boolean;
    });
  } 
}

export const tauriClient = new LocalTauriClient();
