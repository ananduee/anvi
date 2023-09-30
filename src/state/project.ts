import { atom } from "jotai";
import { workspaceAtom } from "./config";
import { tauriClient, Project } from "./client";
import { atomWithDefault, loadable, useAtomCallback } from "jotai/utils";
import { useCallback, useState } from "react";
import { DataCallState, Pair } from "./models";
import { readWriteAsyncAtom } from "./utils";

const refreshProjectsAtom = atom(0);
process.env.NODE_ENV !== "production" &&
  (refreshProjectsAtom.debugLabel = "refreshProjectsAtom");

export const atomProjects = atomWithDefault(async (get) => {
  get(refreshProjectsAtom);
  let workspace = await get(workspaceAtom);
  if (workspace != null) {
    return tauriClient.getProjects(workspace);
  } else {
    return [] as string[];
  }
});
process.env.NODE_ENV !== "production" &&
  (atomProjects.debugLabel = "atomProjects");

// By default active project should be suspended.
export const atomActiveProject = atom<string | Promise<string>>(
  new Promise<string>(() => {})
);
process.env.NODE_ENV !== "production" &&
  (atomActiveProject.debugLabel = "atomActiveProject");

export const loadableActiveProject = loadable(atomActiveProject);
process.env.NODE_ENV !== "production" &&
  (loadableActiveProject.debugLabel = "loadableActiveProject");

const activeProjectSmart = readWriteAsyncAtom(
  atom(async (get) => {
    let project = await get(atomActiveProject);
    let workspace = await get(workspaceAtom);
    let prjct = await tauriClient.getProject(workspace!, project);
    return new Pair(new Date(), prjct);
  }), "activeProjectSmart"
);
export const atomActiveProjectDetails = activeProjectSmart.left();

export function useRefreshProjects() {
  return useAtomCallback(
    useCallback((get, set) => {
      set(refreshProjectsAtom, get(refreshProjectsAtom) + 1);
    }, [])
  );
}

export function useUpdateProject(): [
  DataCallState,
  (workspace: string, project: Project) => Promise<void>
] {
  let [status, setStatus] = useState<DataCallState>({ progress: false });
  let callback = useAtomCallback(
    useCallback(
      async (_get, set, workspace: string, project: Project) => {
        setStatus({ progress: true });
        try {
          await tauriClient.updateProject(workspace, project);
          set(activeProjectSmart.right(), new Pair(new Date(), project));
          setStatus({progress: false})
        } catch (err) {
          setStatus({ progress: false, err: err as string });
        }
      },
      [setStatus]
    )
  );
  return [status, callback];
}
