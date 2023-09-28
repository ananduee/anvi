import { useCallback } from "react";
import { open } from "@tauri-apps/api/dialog";
import { tauriClient } from "./client";
import { atom } from "jotai";
import { useAtomCallback } from "jotai/utils";

export const workspaceAtom = atom(async () => {
  return tauriClient.getCurrentWorkspace();
});
process.env.NODE_ENV !== "production" &&
  (workspaceAtom.debugLabel = "workspaceAtom");

export function useWorkspaceFolderPicker() {
  const folderPickerCallback = useAtomCallback(
    useCallback(async (get) => {
      let currentWorkspace = await get(workspaceAtom);
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: currentWorkspace ?? undefined,
        title: "Pick workspace folder",
      });
      if (selected != null) {
        let path = Array.isArray(selected) ? selected[0] : selected;
        return tauriClient.setCurrentWorkspace(path);
      } else {
        return false;
      }
    }, [])
  );
  return folderPickerCallback;
}
