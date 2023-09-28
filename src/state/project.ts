import { atom } from "jotai";
import { workspaceAtom } from "./config";
import { tauriClient } from "./client";
import { atomWithDefault, useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

const refreshProjectsAtom = atom(0);

export const atomProjects = atomWithDefault(async (get) => {
  get(refreshProjectsAtom);
  let workspace = await get(workspaceAtom);
  if (workspace != null) {
    return tauriClient.getProjects(workspace);
  } else {
    return [] as string[];
  }
});

// By default active project should be suspended.
export const atomActiveProject = atom<string | Promise<string>>(
  new Promise<string>(() => {})
);

export function useRefreshProjects() {
  return useAtomCallback(useCallback((get, set) => {
    set(refreshProjectsAtom, get(refreshProjectsAtom) + 1);
  }, []));
}
