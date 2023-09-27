import { atom, selector } from "recoil";
import { workspaceSelector } from "./config";
import { tauriClient } from "./client";

export const selectorProjects = selector<string[]>({
  key: "selectorProjects",
  get: async ({ get }) => {
    let folder = get(workspaceSelector);
    if (folder != null) {
      return tauriClient.getProjects(folder);
    } else {
      return [] as string[];
    }
  },
});

export const atomActiveProject = atom<string>({
  key: "atomActiveProject"
})
