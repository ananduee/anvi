import { useCallback } from "react";
import { selector, useRecoilValue } from "recoil";
import { open } from '@tauri-apps/api/dialog';
import { tauriClient } from "./client"; 

export const workspaceSelector = selector({
  key: "workspaceSelector",
  get: async () => {
    console.debug("fetching workspace selector again.")
    return tauriClient.getCurrentWorkspace()
  }
})

export function useWorkspaceFolderPicker() {
  let currentFolder = useRecoilValue(workspaceSelector);
  const folderPickerCallback = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: currentFolder ?? undefined,
      title: "Pick workspace folder"
    });
    console.log("root folder selected", selected);
    if (selected != null) {
      let path = Array.isArray(selected) ? selected[0] : selected;
      return tauriClient.setCurrentWorkspace(path)
    } else {
      return false;
    }
  }, [currentFolder])
  return folderPickerCallback;
}
