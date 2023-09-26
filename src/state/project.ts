import { atom, selector } from "recoil";
import { workspaceSelector } from "./config";
import { invoke } from "@tauri-apps/api";

const selectorProjects = selector<string[]>({
  key: "selectorProjects",
  get: async ({ get }) => {
    let folder = get(workspaceSelector);
    if (folder != null) {
      return invoke("get_projects", { workspace: folder }).then((response) => {
        console.log("response found for get_projects", response, typeof response);
        return response as string[];
      });
    } else {
      return [] as string[];
    }
  },
});

export const atomProjects = atom({
  key: "atomProjects",
  default: selectorProjects,
});
