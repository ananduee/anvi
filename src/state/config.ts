import { useCallback } from "react";
import { invoke } from '@tauri-apps/api'
import { selector, useRecoilValue } from "recoil";
import { open } from '@tauri-apps/api/dialog';

export const workspaceSelector = selector({
  key: "workspaceSelector",
  get: async () => {
    return invoke("current_workspace").then(response => {
      return response as null | string
    })
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
      return invoke("set_current_workspace", { path }).then(response => {
        console.log("response after workspace", response);
        return true;
      })
    } else {
      return false;
    }
  }, [currentFolder])
  return folderPickerCallback;
}
