import { atom } from "jotai";
import { workspaceAtom } from "./config";
import { tauriClient, Project } from "./client";
import { atomWithDefault, useAtomCallback } from "jotai/utils";
import { useCallback, useState } from "react";
import { DataCallState, Pair } from "./models";
import { readWriteAsyncAtom } from "./utils";

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

const activeProjectSmart = readWriteAsyncAtom(
  atom(async (get) => {
    let project = await get(atomActiveProject);
    let workspace = await get(workspaceAtom);
    let prjct = await tauriClient.getProject(workspace!, project);
    return new Pair(new Date(), prjct);
  })
);
export const atomActiveProjectDetails = activeProjectSmart.left();

export function useRefreshProjects() {
  return useAtomCallback(
    useCallback((get, set) => {
      set(refreshProjectsAtom, get(refreshProjectsAtom) + 1);
    }, [])
  );
}

export function useUpdateProject() {
  let [status, setStatus] = useState<DataCallState>({ progress: false });
  return useAtomCallback(
    useCallback(
      async (_get, set, workspace: string, project: Project) => {
        setStatus({ progress: true });
        try {
          await tauriClient.updateProject(workspace, project);
          set(activeProjectSmart.right(), new Pair(new Date(), project));
        } catch (err) {
          setStatus({ progress: false, err: err as string });
        }
      },
      [setStatus]
    )
  );
}
