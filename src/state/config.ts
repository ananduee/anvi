import { useCallback } from "react";
import { open } from "@tauri-apps/api/dialog";
import { tauriClient } from "./client";
import { atom } from "jotai";
import { useAtomCallback } from "jotai/utils";

const workspaceRefresh = atom(0);

export const workspaceAtom = atom(async (get) => {
  get(workspaceRefresh);
  return tauriClient.getCurrentWorkspace();
});
process.env.NODE_ENV !== "production" &&
  (workspaceAtom.debugLabel = "workspaceAtom");

export function useWorkspaceFolderPicker() {
  const folderPickerCallback = useAtomCallback(
    useCallback(async (get, set) => {
      let currentWorkspace = await get(workspaceAtom);
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: currentWorkspace ?? undefined,
        title: "Pick workspace folder",
      });
      if (selected != null) {
        let path = Array.isArray(selected) ? selected[0] : selected;
        let wsSet = await tauriClient.setCurrentWorkspace(path);
        if (wsSet) {
          set(workspaceRefresh, (v) => v + 1);
        }
      } else {
        return false;
      }
    }, [])
  );
  return folderPickerCallback;
}
